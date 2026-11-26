import jsBeautify from 'js-beautify';

/**
 * js-beautify settings; matches what the (now removed, unmaintained) `pretty` package used,
 * so generated pages keep the same formatting.
 */
const BEAUTIFY_OPTIONS = Object.freeze({
  unformatted: ['code', 'pre', 'em', 'strong', 'span'],
  indent_inner_html: true,
  indent_char: ' ',
  indent_size: 2,
});

/**
 * Extra tidying (formerly `pretty`'s "ocd" mode): drop blank lines, trim the file's ends, and put
 * a blank line before each comment.
 */
const tidy = (html) => html
  // whitespace-only lines become empty, then runs of newlines collapse to one
  .split('\n')
  .map((line) => (line.trim() ? line : ''))
  .join('\n')
  .replace(/\s+$/, '\n')
  .replace(/(\r\n|\n|␤){2,}/g, '\n')
  .replace(/^\s+/g, '')
  .replace(/\s+$/g, '\n')
  .replace(/(\s*<!--)/g, '\n$1')
  // bring closing comments (`<!-- /foo -->`) up to the same line as the closing tag
  .replace(/>(\s*)(?=<!--\s*\/)/g, '> ');

/**
 * Pretty-prints an HTML document.
 *
 * @param {string} html markup to format
 * @param {{ tidy?: boolean }} [options] `tidy: true` also condenses blank lines (see `tidy`)
 * @returns {string} formatted markup
 */
export default function formatHtml(html, { tidy: shouldTidy = false } = {}) {
  const formatted = jsBeautify.html(html, BEAUTIFY_OPTIONS);
  return shouldTidy ? tidy(formatted) : formatted;
}
