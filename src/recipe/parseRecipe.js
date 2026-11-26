import MarkdownIt from 'markdown-it';
import { getAuthor, linkifyImages, replaceQuotes } from '../libs/utils.js';
import { SectionMgr } from '../libs/SectionManager.js';
import { SectionTypes, getSectionType, isDefinedType, transformSection } from './sections.js';

/**
 * Markdown parser. `html: true` keeps raw HTML in recipes, including the `<!-- recipe-… -->`
 * customization comments. Auto-linking is done per section instead (`autoUrlSections`).
 */
const md = new MarkdownIt({ html: true });

// "..." → "…" in text (not code), as the previous converter (showdown) did
md.core.ruler.push('ellipsis', ({ tokens }) => {
  tokens
    .filter(({ type }) => type === 'inline')
    .flatMap(({ children }) => children || [])
    .filter(({ type }) => type === 'text')
    .forEach((token) => {
      token.content = token.content.replaceAll('...', '…');
    });
});

/* eslint-disable key-spacing */
const RegExes = Object.freeze({
  /** "• " bullets, treated the same as "* " */
  BULLET:           /^([ \t]*)•[ \t]+/gm,
  /**
   * links to other local recipes (`foo.md`, `./foo.md#bar`), so they can point at the converted
   * `.html`; skips anything with a scheme (http:, mailto:) or protocol-relative (//)
   */
  LOCAL_MD_HREF:    /^(?![a-z][a-z0-9+.-]*:|\/\/)([^#?]*?)\.md([#?].*)?$/i,
  /** characters dropped from a heading's text to make its id */
  NON_ID_CHARS:     /[^\w]/g,
  /** `<!-- recipe-style: foo -->`, `<!-- recipe-body-class: foo -->`, … */
  CUSTOMIZATIONS:   /^\s*<!--\s+recipe[- ](style|theme|body-class)\s*[:=]\s*([\w-]+)\s+-->\s*$/,
});
/* eslint-enable key-spacing */

/** Headings at these levels start a new section; lower ones (`###`…) stay inside it. */
const SECTION_HEADINGS = new Set(['h1', 'h2']);

/**
 * @typedef {import('markdown-it/lib/token.mjs').default} Token
 *
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
 * This project's additions to markdown, applied before parsing: `•` bullets and, optionally,
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
 * Gives every heading an `id` made from its text: word characters only, lower-cased
 * ("Nutrition Info" → `nutritioninfo`). Repeats get `-1`, `-2`, … appended (`steps-1`).
 * @param {Token[]} tokens
 */
function addHeadingIds(tokens) {
  const counts = new Map();
  tokens.forEach((token, index) => {
    if (token.type !== 'heading_open') {
      return;
    }
    const baseId = tokens[index + 1].content.replace(RegExes.NON_ID_CHARS, '').toLowerCase();
    const count = counts.get(baseId) || 0;
    counts.set(baseId, count + 1);
    token.attrSet('id', count ? `${baseId}-${count}` : baseId);
  });
}

/**
 * Points links to sibling `.md` recipes at their `.html` page.
 * @param {Token[]} tokens
 */
function rewriteLocalLinks(tokens) {
  tokens
    .filter(({ type }) => type === 'inline')
    .flatMap(({ children }) => children || [])
    .filter(({ type }) => type === 'link_open')
    .forEach((link) => {
      const href = link.attrGet('href');
      if (href && RegExes.LOCAL_MD_HREF.test(href)) {
        link.attrSet('href', href.replace(RegExes.LOCAL_MD_HREF, '$1.html$2'));
      }
    });
}

/**
 * Groups top-level tokens into chunks, each starting at an `h1`/`h2`. Anything before the first
 * such heading isn't part of a section and is dropped.
 *
 * @param {Token[]} tokens
 * @returns {Array<{ heading: Token, tokens: Token[] }>}
 */
function chunkBySection(tokens) {
  const chunks = [];
  tokens.forEach((token) => {
    if (token.type === 'heading_open' && token.level === 0 && SECTION_HEADINGS.has(token.tag)) {
      chunks.push({ heading: token, tokens: [] });
    }
    chunks.at(-1)?.tokens.push(token);
  });
  return chunks;
}

/**
 * Demotes a chunk's heading to `<h3>`, so it reads as a subheading of the section above.
 * @param {Token[]} tokens a chunk, starting with `heading_open`, inline, `heading_close`
 */
function demoteHeading([open, , close]) {
  open.tag = 'h3';
  close.tag = 'h3';
}

/**
 * Parses preprocessed markdown and sorts it into sections, formatting each one.
 * * The first `# title` is pulled out on its own; the rest of its chunk is the "header" section.
 *   A later `#` heading (say, a second recipe in the same file) stays in the header section as
 *   a subheading.
 * * A standard section that appears again (a second "## Steps", or "## Method" after "## Steps")
 *   is merged into the first, its heading demoted to `<h3>` — the same as writing `### …`.
 * * Content under an unrecognized heading goes into the "notes" section
 *   (see `sections.unknownTypes`).
 *
 * @param {string} markdown output of `preprocessMarkdown`
 * @param {object} options build options (`addImageLinks`, `autoUrlSections`, `shortenURLs`,
 *   `useFractionSymbols`)
 * @returns {{ title: string, customizations: object, sections: SectionMgr }}
 */
export function splitSections(markdown, options) {
  const env = {};
  const tokens = md.parse(markdown, env);
  addHeadingIds(tokens);
  rewriteLocalLinks(tokens);

  const render = (chunkTokens) => {
    const html = md.renderer.render(chunkTokens, md.options, env);
    return options.addImageLinks ? linkifyImages(html) : html;
  };

  let title;
  /** @type {Array<{ type: string, id: string, html: string }>} in document order */
  const parts = [];
  /** first part of each standard section, which repeats are merged into */
  const partsByType = new Map();

  chunkBySection(tokens).forEach(({ heading, tokens: chunkTokens }) => {
    const isH1 = heading.tag === 'h1';
    const id = isH1 ? '' : heading.attrGet('id');
    const sectionType = isH1 ? SectionTypes.HEADER : getSectionType(id);

    let bodyTokens = chunkTokens;
    if (isH1 && title === undefined) {
      const [, inline] = chunkTokens;
      title = md.renderer.renderInline(inline.children, md.options, env);
      bodyTokens = chunkTokens.slice(3);
    }

    const existing = partsByType.get(sectionType);
    if (existing) {
      demoteHeading(bodyTokens);
      existing.html += transformSection(sectionType, render(bodyTokens), options);
      return;
    }

    const part = { type: sectionType, id, html: transformSection(sectionType, render(bodyTokens), options) };
    parts.push(part);
    if (isDefinedType(sectionType)) {
      partsByType.set(sectionType, part);
    }
  });

  const sections = new SectionMgr({ definedTypes: SectionTypes, defaultType: SectionTypes.NOTES });
  parts.forEach(({ type, id, html }) => sections.add(type, id, html));

  const customizations = getCustomizations(tokens
    .filter(({ type }) => type === 'html_block')
    .map(({ content }) => content)
    .join('\n'));

  return { title: title || '', customizations, sections };
}

/**
 * Turns one markdown recipe into its parts, ready for `renderRecipe`. No I/O.
 *
 * @param {string} markdown the recipe file's contents
 * @param {object} options build options (see `config.js`)
 * @returns {ParsedRecipe}
 */
export default function parseRecipe(markdown, options) {
  const text = preprocessMarkdown(markdown, options);
  const { title, customizations, sections } = splitSections(text, options);

  return {
    title,
    author: options.findAuthor ? getAuthor(text) : '',
    customizations,
    sections,
  };
}
