import { getAuthor, linkifyImages, replaceQuotes } from '../libs/utils.js';
import { SectionMgr } from '../libs/SectionManager.js';
import { SectionTypes, getH2Id, getSectionType, transformSection } from './sections.js';

/* eslint-disable key-spacing */
const RegExes = Object.freeze({
  /** "• " bullets, treated the same as "* " */
  BULLET:           /^([ \t]*)•[ \t]+/gm,
  /**
   * `href`s to other local recipes (`foo.md`, `./foo.md#bar`), so they can point at the
   * converted `.html`; skips anything with a scheme (http:, mailto:) or protocol-relative (//)
   */
  LOCAL_MD_LINK:    /(href=")(?![a-z][a-z0-9+.-]*:|\/\/)([^"#?]*?)\.md([#?][^"]*)?(")/gi,
  /** each section starts at an `<h1>` or `<h2>` */
  SECTION_SPLIT:    /(?=<h[12])/,
  TITLE:            /<h1(?:\s+id=".*?")?>(.*?)<\/h1>/i,
  /** `<!-- recipe-style: foo -->`, `<!-- recipe-body-class: foo -->`, … */
  CUSTOMIZATIONS:   /^\s*<!--\s+recipe[- ](style|theme|body-class)\s*[:=]\s*([\w-]+)\s+-->\s*$/,
});
/* eslint-enable key-spacing */

/**
 * @typedef {object} ParsedRecipe
 * @property {string} title the `# heading`, as HTML (`''` if missing)
 * @property {string} author detected author credit (`''` if none, or `findAuthor` is off)
 * @property {{ style?: string, theme?: string, 'body-class'?: string }} customizations
 *   from `<!-- recipe-… -->` comments
 * @property {SectionMgr} sections formatted content, by section type
 */

/**
 * Reads `<!-- recipe-style: foo -->`-type comments.
 * @param {string} html
 */
export function getCustomizations(html) {
  return Object.fromEntries(
    (html.match(new RegExp(RegExes.CUSTOMIZATIONS, 'gm')) || [])
      .map((comment) => comment.match(RegExes.CUSTOMIZATIONS).slice(1)),
  );
}

/**
 * This project's additions to markdown, applied before conversion: `•` bullets and, optionally,
 * smart quotes.
 *
 * @param {string} markdown
 * @param {{ useSmartQuotes?: boolean }} options
 * @returns {string}
 */
export function preprocessMarkdown(markdown, { useSmartQuotes }) {
  const text = markdown.replace(RegExes.BULLET, '$1* ');
  return useSmartQuotes ? replaceQuotes(text) : text;
}

/**
 * Converts preprocessed markdown to HTML, pointing links to sibling `.md` recipes at their `.html`
 * page and, optionally, making images clickable.
 *
 * @param {import('showdown').Converter} converter
 * @param {string} markdown output of `preprocessMarkdown`
 * @param {{ addImageLinks?: boolean }} options
 * @returns {string}
 */
export function markdownToHtml(converter, markdown, { addImageLinks }) {
  const html = converter.makeHtml(markdown).replace(RegExes.LOCAL_MD_LINK, '$1$2.html$3$4');
  return addImageLinks ? linkifyImages(html) : html;
}

/**
 * Splits recipe HTML into its sections (at each `<h1>`/`<h2>`) and formats each one. Content
 * under an unrecognized heading goes into the "notes" section (see `sections.unknownTypes`).
 *
 * @param {string} html output of `markdownToHtml`
 * @param {object} options build options (`autoUrlSections`, `shortenURLs`, `useFractionSymbols`)
 * @returns {{ title: string, sections: SectionMgr }}
 */
export function splitSections(html, options) {
  const sections = new SectionMgr({ definedTypes: SectionTypes, defaultType: SectionTypes.NOTES });
  let title = '';

  html
    .split(RegExes.SECTION_SPLIT)
    .forEach((chunk) => {
      const titleMatch = chunk.match(RegExes.TITLE);
      const sectionType = titleMatch ? SectionTypes.HEADER : getSectionType(chunk);
      if (!sectionType) {
        // text before the first heading isn't part of any section
        return;
      }

      let sectionHtml = transformSection(sectionType, chunk, options);
      if (titleMatch) {
        [, title] = titleMatch;
        sectionHtml = sectionHtml.replace(RegExes.TITLE, '');
      }
      sections.add(sectionType, getH2Id(sectionHtml), sectionHtml);
    });

  return { title, sections };
}

/**
 * Turns one markdown recipe into its parts, ready for `renderRecipe`. No I/O.
 *
 * @param {import('showdown').Converter} converter
 * @param {string} markdown the recipe file's contents
 * @param {object} options build options (see `config.js`)
 * @returns {ParsedRecipe}
 */
export default function parseRecipe(converter, markdown, options) {
  const text = preprocessMarkdown(markdown, options);
  const html = markdownToHtml(converter, text, options);
  const { title, sections } = splitSections(html, options);

  return {
    title,
    author: options.findAuthor ? getAuthor(text) : '',
    customizations: getCustomizations(html),
    sections,
  };
}
