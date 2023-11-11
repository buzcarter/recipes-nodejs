const { resolve } = require('path');
const { readFile, writeFile } = require('fs');
const showdown  = require('showdown');
const prettyHtml = require('pretty');
const { linkify, shorten, replaceFractions, replaceQuotes, linkifyImages, getAuthor } = require('./libs/utils');
const SectionMgr = require('./libs/SectionManager');

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
  NUMERIC:          /<li>(~?[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞/ .–-]+(?:(?:to|-) \d+)?(?:["gcltT]|oz|ml|lb|kg)?\.?)\s+(.*)\s*<\/li>/,
  FRACTION_SYMBOL:  /([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞])/g,

  /** Custom meta tags */
  CUSTOMIZATIONS:  /^\s*<!--\s+recipe-(style|theme|body-class)\s*[:=]\s*([\w-]+)\s+-->\s*$/,
});
/* eslint-enable key-spacing */

const LINK_SUB_NAME = '<name>';

function setHeadMeta(documentHtml, { favicon, ogImgURL, recipeName, titleSuffix }) {
  return documentHtml
    .replace(RegExes.PAGE_TITLE, `<title>${recipeName}${titleSuffix || ''}</title>`)
    .replace(Substitutions.META_DATE, `<meta name="date" content="${new Date()}">`)
    .replace(Substitutions.META_OG_IMG, ogImgURL ? `<meta property="og:image" content="${ogImgURL}">` : '')
    .replace(Substitutions.META_FAVICON, favicon ? `<link rel="icon" type="image/png" href="${favicon}">` : '')
    .replace(Substitutions.TITLE, recipeName);
}

function getCustomizations(documentHtml) {
  return documentHtml
    .match(new RegExp(RegExes.CUSTOMIZATIONS, 'gm'))
    ?.map((a) => {
      const [, type, value] = a.match(RegExes.CUSTOMIZATIONS);
      return { type, value };
    })
    .reduce((acc, { type, value }) => Object.assign(acc, {[type]: value }), {})
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

  if (Object.keys(SectionTypes).some(key => SectionTypes[key] === type)) {
    return type;
  }

  const aliasType = Object.keys(SectionAliases)
    .find(key => SectionAliases[key].includes(type));

  return aliasType || type;
}

const getInlineCss = heroImgURL => !heroImgURL
  ? ''
  : `
<style>
  :root {
    --hero-image-url: url("${heroImgURL}");
  }
</style>
`;

function prettyBasedOnSection(section, shortenURLs) {
  // opt: remove cruft from 'based on' links
  return shortenURLs
    ? section.replace(RegExes.ANCHORS_SHORT, anchor => shorten(anchor))
    : section;
}

/**
 * in the ingredients, make things in parentheses a bit lighter
 */
function prettyIngredientsSection(section, useFractionSymbols) {
  return section.replace(RegExes.LI, str => str
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
  const links = helpURLs.map(({ label, url }) => `<li><a class=${Styles.HELP_LINK} href="${url.replace(LINK_SUB_NAME, recipeName)}" target="blank">${label}</a></li>`);

  return `
<h2>help!</h2>
<ul>${links.join('\n')}</ul>
`;
}

function convertRecipe(outputHTML, recipeHTML, opts) {
  const {
    name, image,
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
    console.warn(`${name}.md contains unknown sections [${sectionMgr.warnings}] that are included under "${SectionTypes.NOTES}"`);
  }

  outputHTML = sectionMgr.replace(outputHTML);

  return setHeadMeta(outputHTML, { favicon, ogImgURL: heroImgURL, recipeName, titleSuffix })
    .replace(Substitutions.HELP, showHelp ? getHelpSection(helpURLs, name) : '')
    .replace(Substitutions.HERO_IMG, heroImgURL ? `<img class=${Styles.HERO_IMG} src="${heroImgURL}">` : '')
    .replace(Substitutions.THEME_CSS, `theme-${customizations.style || defaultTheme}`)
    .replace(Substitutions.INLINE_CSS, getInlineCss(heroImgURL))
    .replace(Substitutions.TEXT_LINK, `sources/${name}.txt`)
    .replace(Substitutions.BODY_CLASS, [
      `heroimage--${heroImgURL ? 'visible' : 'hidden'}`,
      customizations.style || '',
      customizations['body-class'] || '',
      ...sectionMgr.sectionsInUse.map(n => `${n}--visible`),
      ...sectionMgr.sectionsUnused.map(n => `${n}--hidden`),
    ].join(' '));
}

function buildRecipes(recipeTemplate, options, fileList, images) {
  return new Promise((promResolve) => {
    let fileCount = 0;
    const { addImageLinks, findAuthor, outputPath, useSmartQuotes } = options;
    const converter = new showdown.Converter();
    const recipeInfo = [];
    fileList.forEach(({ file: path, name }) => {
      readFile(path, { encoding: 'utf8' }, (err, markdown) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error(err);
          return;
        }
        const heroImgURL = images.find(i => i.name === name);
        if (useSmartQuotes) {
          markdown = replaceQuotes(markdown);
        }
        const author = findAuthor ? getAuthor(markdown) : '';
        if (author) {
          recipeInfo.push({ name, author });
        }
        let html = converter.makeHtml(markdown);
        if (addImageLinks) {
          html = linkifyImages(html);
        }
        html = prettyHtml(convertRecipe(recipeTemplate, html, { ...options, name, heroImgURL }), { ocd: true });
        writeFile(resolve(outputPath, `${name}.html`), html, { encoding: 'utf8'}, () => {
          if (fileList.length === ++fileCount) {
            promResolve(recipeInfo);
          }
        });
      });
    });
  });
}

module.exports = {
  __test__: {
    prettyIngredientsSection,
    NumericRegEx: RegExes.NUMERIC,
  },
  buildRecipes,
};
