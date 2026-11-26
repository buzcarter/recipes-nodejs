import { extname } from 'path';
import { escapeHtml } from './html.js';

/** `<head>` placeholders shared by the recipe and index templates. */
export const HeadPlaceholders = Object.freeze({
  META_DATE: '{{__metaDateGenerated__}}',
  META_FAVICON: '{{__favIcon__}}',
  META_OG_IMG: '{{__metaOGImage__}}',
  THEME_CSS: '{{__theme__}}',
});

const IconTypes = Object.freeze({
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
});

/**
 * Values for the shared `<head>` placeholders, ready for `fillTemplate`.
 *
 * @param {object} meta
 * @param {string} [meta.favicon] favicon path, relative to the site root
 * @param {string} [meta.ogImgURL] already-encoded URL of the page's preview image
 * @param {string} meta.theme theme name; becomes the `styles/theme-<name>.css` stylesheet
 * @param {Date} [meta.generated] build time (defaults to now)
 * @returns {Record<string, string>}
 */
export function getHeadMeta({ favicon, ogImgURL, theme, generated = new Date() }) {
  const iconType = favicon && IconTypes[extname(favicon).toLowerCase()];

  return {
    [HeadPlaceholders.META_DATE]: `<meta name="date" content="${generated.toISOString()}">`,
    [HeadPlaceholders.META_FAVICON]: favicon
      ? `<link rel="icon"${iconType ? ` type="${iconType}"` : ''} href="${escapeHtml(favicon)}">`
      : '',
    [HeadPlaceholders.META_OG_IMG]: ogImgURL ? `<meta property="og:image" content="${escapeHtml(ogImgURL)}">` : '',
    [HeadPlaceholders.THEME_CSS]: `theme-${escapeHtml(theme)}`,
  };
}
