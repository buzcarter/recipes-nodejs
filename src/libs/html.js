/**
 * Small, dependency-free helpers for building HTML strings safely. Use these whenever text that
 * came from a recipe file, a filename, or config is put into markup.
 */

const HtmlEntities = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
});

/**
 * Escapes text for use as HTML content or inside a quoted attribute value.
 *
 * @param {unknown} value text to escape; `null`/`undefined` become `''`
 * @returns {string}
 */
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => HtmlEntities[char]);

/**
 * Removes tags, leaving only the text (entities are kept as-is). For places such as `<title>`,
 * where markup isn't allowed but already-escaped text is.
 *
 * @param {string} html
 * @returns {string}
 */
export const stripTags = (html) => String(html ?? '').replace(/<[^>]*>/g, '');

/**
 * Builds a relative URL for a file, percent-encoding the filename (spaces, `#`, `?`, quotes…).
 *
 * @param {string} dir folder, no trailing slash (may be `''`)
 * @param {string} fileName unencoded file name
 * @returns {string} e.g. `images/aloo%20matar.jpg`
 */
export const fileUrl = (dir, fileName) => `${dir ? `${dir}/` : ''}${encodeURIComponent(fileName)}`;
