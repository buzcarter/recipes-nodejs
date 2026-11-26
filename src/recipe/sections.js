import { linkify, replaceFractions, shorten } from '../libs/utils.js';

/* eslint-disable key-spacing */
/**
 * Predefined "standard" recipe sections, some with special formatting. Each one has a placeholder
 * in the recipe template, e.g. `{{__info__}}`, filled with that section's content.
 */
export const SectionTypes = Object.freeze({
  BASED_ON:       'basedon',
  HEADER:         'header',
  INFO:           'info',
  INGREDIENTS:    'ingredients',
  NOTES:          'notes',
  STEPS:          'steps',
});

/** Other heading names accepted for a section (compared against showdown's heading id). */
const SectionAliases = Object.freeze({
  [SectionTypes.BASED_ON]: ['credits', 'resources', 'source'],
  [SectionTypes.NOTES]:    ['tips', 'variations', 'nutritioninfo', 'nutrition', 'nutritionalfacts'],
  [SectionTypes.STEPS]:    ['directions', 'instructions', 'preparation', 'procedure', 'procedures', 'method'],
});

const Styles = Object.freeze({
  PAREN:            'paren',
  HAS_NUMERIC:      'ingredient--has-amt',
  NUMERIC:          'ingredient__amt',
  UNITS:            'ingredient__text',
  FRACTION_SYMBOL:  'ingredient__symbol',
});

const RegExes = Object.freeze({
  H2:               /<h2 id="(.+?)">(.+?)<\/h2>/,
  /** showdown de-duplicates heading ids by appending `-1`, `-2`, … */
  DUPLICATE_ID:     /-\d+$/,
  LI:               /<li>(.|\n)+?<\/li>/gm,
  ANCHORS_SHORT:    /<a [^>]*?href="[^"]{10,}"[^>]*?>[^<]{10,}<\/a>/g,
  PARENS:           /\(([^)]+)\)/g,
  /**
   * An ingredient's leading amount, and the rest of the line.
   * * Watch for "-" v. "–" (em-dash)
   * * single letter or other abbreviations are included with amount (ex "1c", "2 oz", "20 ml")
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
});
/* eslint-enable key-spacing */

export const NumericRegEx = RegExes.NUMERIC;

const definedTypes = new Set(Object.values(SectionTypes));

/** `true` for one of the standard `SectionTypes`. */
export const isDefinedType = (sectionType) => definedTypes.has(sectionType);

/**
 * The `id` of a section's `<h2>`, lower-cased (`''` when the section has none).
 * @param {string} sectionHtml
 */
export const getH2Id = (sectionHtml) => sectionHtml.match(RegExes.H2)?.[1].toLowerCase() || '';

/**
 * Which section an `<h2>`-led chunk of HTML belongs to: a `SectionTypes` value, an alias's
 * section, or — for an unrecognized heading — the heading id itself.
 *
 * @param {string} sectionHtml
 * @returns {string} `''` when the chunk has no `<h2>`
 */
export function getSectionType(sectionHtml) {
  const id = getH2Id(sectionHtml);
  if (!id) {
    return '';
  }

  // a second "## Steps" gets id "steps-1"; it's still the steps section
  const baseId = definedTypes.has(id) ? id : id.replace(RegExes.DUPLICATE_ID, '');
  if (definedTypes.has(baseId)) {
    return baseId;
  }

  return Object.keys(SectionAliases).find((type) => SectionAliases[type].includes(baseId)) || id;
}

/** Optionally trims long "based on" link text down to just the domain. */
export function prettyBasedOnSection(sectionHtml, shortenURLs) {
  return shortenURLs
    ? sectionHtml.replace(RegExes.ANCHORS_SHORT, (anchor) => shorten(anchor))
    : sectionHtml;
}

/**
 * Marks up each ingredient: wraps a leading amount (and unit) so it can be styled apart from the
 * name, and dims anything in parentheses.
 */
export function prettyIngredientsSection(sectionHtml, useFractionSymbols) {
  return sectionHtml.replace(RegExes.LI, (str) => str
    .replace(RegExes.NUMERIC, (a, amount, name) => {
      if (useFractionSymbols) {
        amount = replaceFractions(amount);
      }
      amount = amount.replace(RegExes.FRACTION_SYMBOL, `<span class="${Styles.FRACTION_SYMBOL}">$1</span>`);
      return `<li class="${Styles.HAS_NUMERIC}"><span class="${Styles.NUMERIC}">${amount}</span> <span class="${Styles.UNITS}">${name}</span></li>`;
    })
    .replace(RegExes.PARENS, `<span class="${Styles.PAREN}">($1)</span>`));
}

/**
 * Applies the formatting for one section's type.
 *
 * @param {string} sectionType a `SectionTypes` value (or an unrecognized id)
 * @param {string} sectionHtml
 * @param {{ autoUrlSections?: string[], shortenURLs?: boolean, useFractionSymbols?: boolean }} options
 * @returns {string}
 */
export function transformSection(sectionType, sectionHtml, { autoUrlSections = [], shortenURLs, useFractionSymbols }) {
  let html = autoUrlSections.includes(sectionType) ? linkify(sectionHtml) : sectionHtml;

  switch (sectionType) {
    case SectionTypes.BASED_ON:
      html = prettyBasedOnSection(html, shortenURLs);
      break;
    case SectionTypes.INGREDIENTS:
      html = prettyIngredientsSection(html, useFractionSymbols);
      break;
  }
  return html;
}
