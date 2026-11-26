import fillTemplate from '../libs/template.js';
import { getHeadMeta } from '../libs/headMeta.js';
import { escapeHtml, fileUrl, stripTags } from '../libs/html.js';

/* eslint-disable key-spacing */
/** Recipe-template placeholders not tied to a section (sections fill their own, e.g. `{{__steps__}}`) */
const Placeholders = Object.freeze({
  BODY_CLASS:     '{{__bodyClass__}}',
  HELP:           '{{__help__}}',
  HERO_IMG:       '{{__heroImg__}}',
  INLINE_CSS:     '{{__css__}}',
  TEXT_LINK:      '{{__sourceFile__}}',
  TITLE:          '{{__title__}}',
});

const Styles = Object.freeze({
  HELP_LINK:      'help-link',
  HERO_IMG:       'hero-img',
  HERO_IMG_LINK:  'hero-img-link',
});
/* eslint-enable key-spacing */

const PAGE_TITLE = /<title>.*?<\/title>/;

/** In `helpURLs`, where the recipe's name goes. */
const LINK_SUB_NAME = '<name>';

/**
 * A help link's URL: the recipe name (URL-encoded) goes in place of `<name>`, then any spaces or
 * other characters in the configured URL itself are normalized (e.g. a Yelp location).
 */
function getHelpUrl(urlTemplate, name) {
  const url = urlTemplate.replaceAll(LINK_SUB_NAME, () => encodeURIComponent(name));
  try {
    return new URL(url).href;
  } catch {
    return url;
  }
}

function getHelpSection(helpURLs, name) {
  const links = helpURLs.map(({ label, url }) => (
    `<li><a class="${Styles.HELP_LINK}" href="${escapeHtml(getHelpUrl(url, name))}" target="_blank" rel="noopener">${escapeHtml(label)}</a></li>`
  ));

  return `
<h2>help!</h2>
<ul>${links.join('\n')}</ul>
`;
}

const getHeroImg = (url) => (url
  ? `<a class="${Styles.HERO_IMG_LINK}" href="${escapeHtml(url)}" target="_blank"><img class="${Styles.HERO_IMG}" src="${escapeHtml(url)}" alt=""></a>`
  : '');

const getInlineCss = (url, { width, height } = {}) => (!url
  ? ''
  : `
<style>
  :root {
    --hero-image-url: url("${url}");${width && height ? `
    --hero-aspect-ratio: ${width} / ${height};` : ''}
  }
</style>
`);

function getBodyClasses({ customizations, sections }, image) {
  return [
    `heroimage--${image ? 'visible' : 'hidden'}`,
    image?.orientation && `heroimage--${image.orientation}`,
    customizations.style,
    customizations['body-class'],
    ...sections.sectionsInUse.map((n) => `${n}--visible`),
    ...sections.sectionsUnused.map((n) => `${n}--hidden`),
  ].filter(Boolean).join(' ');
}

/**
 * Fills the recipe page template. No I/O.
 *
 * @param {string} template contents of `templates/recipe.html`
 * @param {import('./parseRecipe.js').ParsedRecipe} recipe output of `parseRecipe`
 * @param {object} page
 * @param {string} page.name the recipe's file name, without extension
 * @param {{ fileName: string, width?: number, height?: number, orientation?: string }} [page.image] hero image
 * @param {object} options build options (`defaultTheme`, `favicon`, `helpURLs`, `includeHelpLinks`, `titleSuffix`)
 * @returns {string} the page's HTML (not yet pretty-printed)
 */
export default function renderRecipe(template, recipe, { name, image }, options) {
  const { defaultTheme, favicon, helpURLs, includeHelpLinks, titleSuffix } = options;
  const { author, customizations, sections, title } = recipe;

  const heroImgURL = image ? fileUrl('images', image.fileName) : '';
  const showHelp = includeHelpLinks && Array.isArray(helpURLs) && helpURLs.length > 0;
  const pageTitle = `${stripTags(title)}${author ? ` by ${escapeHtml(author)}` : ''}${escapeHtml(titleSuffix || '')}`;

  const html = sections
    .replace(template)
    .replace(PAGE_TITLE, () => `<title>${pageTitle}</title>`);

  return fillTemplate(html, {
    ...getHeadMeta({ favicon, ogImgURL: heroImgURL, theme: customizations.style || defaultTheme }),
    [Placeholders.TITLE]: title,
    [Placeholders.HELP]: showHelp ? getHelpSection(helpURLs, name) : '',
    [Placeholders.HERO_IMG]: getHeroImg(heroImgURL),
    [Placeholders.INLINE_CSS]: getInlineCss(heroImgURL, image),
    [Placeholders.TEXT_LINK]: fileUrl('sources', `${name}.txt`),
    [Placeholders.BODY_CLASS]: getBodyClasses(recipe, image),
  });
}
