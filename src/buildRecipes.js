import { resolve } from 'path';
import { readFile, writeFile } from 'fs/promises';
import showdown from 'showdown';
import formatHtml from './libs/formatHtml.js';

import { ColorTypes, Colors } from './libs/ConsoleColors.js';
import { settleAll } from './libs/asyncUtils.js';
import {
  linkify, shorten, replaceFractions, replaceQuotes, linkifyImages, getAuthor,
} from './libs/utils.js';
import { SectionMgr } from './libs/SectionManager.js';

/* eslint-disable key-spacing */
/**
 * Predefined "standard" recipe sections, some have special formatting
 * code attached. Others are just convenience. All are used in your
 * recipe template, a placeholder, ex. `{{__info__}}` will be replaced
 * with whatever value is found in the markdown recipe for that secion.
 */
const SectionTypes = Object.freeze({
  BASED_ON:       'basedon',
  HEADER:         'header',
  INFO:           'info',
  INGREDIENTS:    'ingredients',
  NOTES:          'notes',
  STEPS:          'steps',
});

const SectionAliases = Object.freeze({
  [SectionTypes.BASED_ON]: ['credits', 'resources', 'source'],
  [SectionTypes.NOTES]:    ['tips', 'variations', 'nutritioninfo', 'nutrition', 'nutritionalfacts'],
  [SectionTypes.STEPS]:    ['directions', 'instructions', 'preparation', 'procedure', 'procedures', 'method'],
});

const Substitutions = Object.freeze({
  // Substitions not driven by Recipe Sections (h1 or h2 which denote `SectionTypes`)
  HELP:           '{{__help__}}',
  HERO_IMG:       '{{__heroImg__}}',
  TITLE:          '{{__title__}}',
  // odds 'n ends
  BODY_CLASS:     '{{__bodyClass__}}',
  TEXT_LINK:      '{{__sourceFile__}}',
  // Head's meta-tags
  META_FAVICON:   '{{__favIcon__}}',
  META_DATE:      '{{__metaDateGenerated__}}',
  META_OG_IMG:    '{{__metaOGImage__}}',
  THEME_CSS:      '{{__theme__}}',
  INLINE_CSS:     '{{__css__}}',
});

const Styles = Object.freeze({
  HELP_LINK:        'help-link',
  HERO_IMG:         'hero-img',
  HERO_IMG_LINK:    'hero-img-link',
  PAREN:            'paren',

  HAS_NUMERIC:      'ingredient--has-amt',
  NUMERIC:          'ingredient__amt',
  UNITS:            'ingredient__text',
  FRACTION_SYMBOL:  'ingredient__symbol',
});

const RegExes = Object.freeze({
  SECTION_SPLIT:    /(?=<h[12])/,

  TITLE:            /<h1(?:\s+id=".*?")?>(.*?)<\/h1>/i,
  H2:               /<h2 id="(.+?)">(.+?)<\/h2>/,
  LI:               /<li>(.|\n)+?<\/li>/gm,

  PAGE_TITLE:       /<title>.*?<\/title>/,
  ANCHORS_SHORT:    /<a [^>]*?href="[^"]{10,}"[^>]*?>[^<]{10,}<\/a>/g,

  PARENS:           /\(([^)]+)\)/g,
  /**
   * * Watch for "-" v. "–" (em-dash)
   * * single letter or other abbreviateions are included with amount (ex "1c", "2 oz", "20 ml")
   *
   * @example
   * "1 3/4 - 2 cups graham cracker crumbs"
   * "1 to 2 tablespoons lemon juice"
   * "½ cup calamansi concentrate"
   * "1/4 teaspoon vanilla extract"
   * "1.5 oz gin"
   */
  NUMERIC:          /<li>(~?[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞/ .–-]+(?:(?:to|-) \d+)?(?:["gcltT]|cup|oz|ml|lb|kg|gm|tsp|Tbsp)?\.?)\s+(.*)\s*<\/li>/,
  FRACTION_SYMBOL:  /([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞])/g,

  /** Custom meta tags */
  CUSTOMIZATIONS:  /^\s*<!--\s+recipe[- ](style|theme|body-class)\s*[:=]\s*([\w-]+)\s+-->\s*$/,
});
/* eslint-enable key-spacing */

const LINK_SUB_NAME = '<name>';

let warnNbr = 0;
const showWarnings = (name, warnings) => {
  const { Reset } = ColorTypes;
  const { Magenta, Cyan, Orange, CoolYellow, Yellow } = Colors;
  if (warnNbr === 0) {
    // eslint-disable-next-line no-console
    console.warn(`\n${
      Yellow}Somw recipes contain unrecognized sections. Content for these sections will be appear under the "${
      Magenta}${SectionTypes.NOTES}${
      Yellow}" section.${
      Reset}\n`);
  }
  // eslint-disable-next-line no-console
  console.warn(`${
    CoolYellow}${++warnNbr}. ${
    Cyan}${name}.md${
    CoolYellow}: ${
    Orange}${warnings}${
    Reset}`);
};

/*
 * NOTE: template placeholders are always filled with a *function* replacer, e.g.
 * `.replace(KEY, () => value)`. With a plain string, `String.replace` treats `$&`, `$$`, `` $` ``
 * and `$'` inside the recipe's own text as special patterns and silently corrupts it.
 */

function setHeadMeta(documentHtml, { author, favicon, ogImgURL, recipeName, titleSuffix }) {
  return documentHtml
    .replace(RegExes.PAGE_TITLE, () => `<title>${recipeName}${author ? ` by ${author}` : ''}${titleSuffix || ''}</title>`)
    .replace(Substitutions.META_DATE, () => `<meta name="date" content="${new Date()}">`)
    .replace(Substitutions.META_OG_IMG, () => (ogImgURL ? `<meta property="og:image" content="${ogImgURL}">` : ''))
    .replace(Substitutions.META_FAVICON, () => (favicon ? `<link rel="icon" type="image/png" href="${favicon}">` : ''))
    .replace(Substitutions.TITLE, () => recipeName);
}

function getCustomizations(documentHtml) {
  return documentHtml
    .match(new RegExp(RegExes.CUSTOMIZATIONS, 'gm'))
    ?.map((a) => {
      const [, type, value] = a.match(RegExes.CUSTOMIZATIONS);
      return { type, value };
    })
    .reduce((acc, { type, value }) => Object.assign(acc, { [type]: value }), {})
    || {};
}

const getH2Id = (html) => {
  const matches = html.match(RegExes.H2);
  return matches?.[1].toLowerCase() || '';
};

function getSectionType(section) {
  const type = getH2Id(section);
  if (!type) {
    return '';
  }

  if (Object.keys(SectionTypes).some((key) => SectionTypes[key] === type)) {
    return type;
  }

  const aliasType = Object.keys(SectionAliases)
    .find((key) => SectionAliases[key].includes(type));

  return aliasType || type;
}

const getInlineCss = (heroImgURL, { width, height } = {}) => (!heroImgURL
  ? ''
  : `
<style>
  :root {
    --hero-image-url: url("${heroImgURL}");${width && height ? `
    --hero-aspect-ratio: ${width} / ${height};` : ''}
  }
</style>
`);

function prettyBasedOnSection(section, shortenURLs) {
  // opt: remove cruft from 'based on' links
  return shortenURLs
    ? section.replace(RegExes.ANCHORS_SHORT, (anchor) => shorten(anchor))
    : section;
}

/**
 * in the ingredients, make things in parentheses a bit lighter
 */
function prettyIngredientsSection(section, useFractionSymbols) {
  return section.replace(RegExes.LI, (str) => str
    .replace(RegExes.NUMERIC, (a, amount, name) => {
      if (useFractionSymbols) {
        amount = replaceFractions(amount);
      }
      amount = amount.replace(RegExes.FRACTION_SYMBOL, `<span class="${Styles.FRACTION_SYMBOL}">$1</span>`);
      return `<li class="${Styles.HAS_NUMERIC}"><span class="${Styles.NUMERIC}">${amount}</span> <span class="${Styles.UNITS}">${name}</span></li>`;
    })
    .replace(RegExes.PARENS, `<span class="${Styles.PAREN}">($1)</span>`));
}

function getHelpSection(helpURLs, name) {
  const recipeName = name.replace(' ', '+');
  const links = helpURLs.map(({ label, url }) => `<li><a class=${Styles.HELP_LINK} href="${url.replace(LINK_SUB_NAME, () => recipeName)}" target="blank">${label}</a></li>`);

  return `
<h2>help!</h2>
<ul>${links.join('\n')}</ul>
`;
}

function convertRecipe(outputHTML, recipeHTML, opts) {
  const {
    author, name,
    heroImgURL: image,
    autoUrlSections, defaultTheme, favicon, useFractionSymbols, helpURLs, includeHelpLinks, shortenURLs, titleSuffix,
  } = opts;
  let recipeName = '';

  const sectionMgr = new SectionMgr({ definedTypes: SectionTypes, defaultType: SectionTypes.NOTES });
  const customizations = getCustomizations(recipeHTML);

  recipeHTML
    .split(RegExes.SECTION_SPLIT)
    .forEach((section) => {
      const sectionType = RegExes.TITLE.test(section)
        ? SectionTypes.HEADER
        : getSectionType(section);

      if (autoUrlSections.includes(sectionType)) {
        section = linkify(section);
      }

      switch (sectionType) {
        case SectionTypes.BASED_ON:
          section = prettyBasedOnSection(section, shortenURLs);
          break;
        case SectionTypes.HEADER:
          // eslint-disable-next-line prefer-destructuring
          recipeName = section.match(RegExes.TITLE)[1];
          section = section.replace(RegExes.TITLE, '');
          break;
        case SectionTypes.INGREDIENTS:
          section = prettyIngredientsSection(section, useFractionSymbols);
          break;
      }

      if (sectionType) {
        sectionMgr.add(sectionType, getH2Id(section), section);
      }
    });

  // add some helper links
  const showHelp = includeHelpLinks && Array.isArray(helpURLs) && helpURLs.length;

  // if there's a hero image available, load and display
  const heroImgURL = image ? `images/${image.fileName}` : '';

  if (sectionMgr.hasWarnings) {
    showWarnings(name, sectionMgr.warnings);
  }

  outputHTML = sectionMgr.replace(outputHTML);

  return setHeadMeta(outputHTML, { author, favicon, ogImgURL: heroImgURL, recipeName, titleSuffix })
    .replace(Substitutions.HELP, () => (showHelp ? getHelpSection(helpURLs, name) : ''))
    .replace(Substitutions.HERO_IMG, () => (heroImgURL ? `<a class=${Styles.HERO_IMG_LINK} href="${heroImgURL}" target="_blank"><img class=${Styles.HERO_IMG} src="${heroImgURL}"></a>` : ''))
    .replace(Substitutions.THEME_CSS, () => `theme-${customizations.style || defaultTheme}`)
    .replace(Substitutions.INLINE_CSS, () => getInlineCss(heroImgURL, image))
    .replace(Substitutions.TEXT_LINK, () => `sources/${name}.txt`)
    .replace(Substitutions.BODY_CLASS, () => [
      `heroimage--${heroImgURL ? 'visible' : 'hidden'}`,
      heroImgURL && image.orientation ? `heroimage--${image.orientation}` : '',
      customizations.style || '',
      customizations['body-class'] || '',
      ...sectionMgr.sectionsInUse.map((n) => `${n}--visible`),
      ...sectionMgr.sectionsUnused.map((n) => `${n}--hidden`),
    ].join(' '));
}

/**
 * Converts one markdown recipe to a finished HTML page and writes it to `outputPath`.
 * @returns {Promise<{ name: string, author: string }>}
 */
async function buildRecipe(converter, recipeTemplate, options, { file, name }, images) {
  const { addImageLinks, findAuthor, outputPath, useSmartQuotes } = options;

  let markdown = await readFile(file, { encoding: 'utf8' });
  const heroImgURL = images.find((i) => i.name === name);
  // treat "• " bullets the same as "* "
  markdown = markdown.replace(/^([ \t]*)•[ \t]+/gm, '$1* ');
  if (useSmartQuotes) {
    markdown = replaceQuotes(markdown);
  }
  const author = findAuthor ? getAuthor(markdown) : '';

  let html = converter.makeHtml(markdown);
  // local links to other recipes (`foo.md`, `./foo.md#bar`) point at the converted `.html`;
  // skips anything with a scheme (http:, mailto:) or protocol-relative (//)
  html = html.replace(/(href=")(?![a-z][a-z0-9+.-]*:|\/\/)([^"#?]*?)\.md([#?][^"]*)?(")/gi, '$1$2.html$3$4');
  if (addImageLinks) {
    html = linkifyImages(html);
  }
  html = formatHtml(convertRecipe(recipeTemplate, html, { ...options, author, heroImgURL, name }), { tidy: true });
  await writeFile(resolve(outputPath, `${name}.html`), html, { encoding: 'utf8' });

  return { name, author };
}

/**
 * Builds every recipe page concurrently. A recipe that fails is logged and skipped; the rest
 * are still written.
 *
 * @returns {Promise<{ recipeInfo: Array<{ name: string, author: string }>, errors: unknown[] }>}
 *   `recipeInfo` lists recipes with a detected author; `errors` holds per-recipe failures
 */
export default async function buildRecipes(recipeTemplate, options, fileList, images) {
  const converter = new showdown.Converter();
  const { values, errors } = await settleAll('Recipe', fileList.map((recipeFile) => (
    buildRecipe(converter, recipeTemplate, options, recipeFile, images)
      .catch((err) => {
        throw new Error(`${recipeFile.name}.md: ${err.message}`, { cause: err });
      })
  )));

  return {
    recipeInfo: values.filter(({ author }) => author),
    errors,
  };
}

export const __test__ = {
  prettyIngredientsSection,
  NumericRegEx: RegExes.NUMERIC,
};
