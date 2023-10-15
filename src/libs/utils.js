const RegExes = {
  // #region linkify
  /** URLs (starting with http://, https://, or ftp://) that aren't already in a link tag */
  URL_WITH_PROTOCOL: /(?<!href=")(\b(https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gim,
  /** URLs starting with "www." (without // before it, or it'd re-link the ones done above) */
  URL_WITH_WWW: /(^|[^/"])(www\.[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|]+(\b|$))/gim,
  /** Wrap email addresses in "mailto:" links */
  EMAIL: /(([a-zA-Z0-9\-_.])+@[a-zA-Z_]+?(\.[a-zA-Z]{2,6})+)/gim,
  // #endregion

  // #region Shorten
  textReg: /(?<=>)(https?:\/\/.*?)(?=<\/a>)/,
  simpleDomain: /((?:[\w-]+\.)+[\w-]+)/,
  // #endregion

  // #region replaceFractions
  FRACTIONS: /(1\/[2-9]|2\/[35]|3\/[458]|4\/5|5\/[68])|7\/8/g,
  // #endregion
};

const FractionsHash = Object.freeze({
  '1/2': '½',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/4': '¼',
  '3/4': '¾',
  '1/5': '⅕',
  '2/5': '⅖',
  '3/5': '⅗',
  '4/5': '⅘',
  '1/6': '⅙',
  '5/6': '⅚',
  '1/7': '⅐',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
});

/**
 * handy function to create links in the markdown text
 * @see https://stackoverflow.com/a/3890175/1167783
 */
const linkify = value => value
  .replace(RegExes.URL_WITH_PROTOCOL, '<a href="$1">$1</a>')
  .replace(RegExes.URL_WITH_WWW, '$1<a href="http://$2">$2</a>')
  .replace(RegExes.EMAIL, '<a href="mailto:$1">$1</a>');

/**
 * Replaces complete URL with only the domain, i.e. strips
 * off path & protocol.
 * ex: `https://recipes.painswick.edu.uk/puddings/christmas.html`
 * is converted to just `recipes.painswick.edu.uk`
 */
const shorten = value => value
  .replace(RegExes.textReg, (match) => {
    const [, domain] = match.match(RegExes.simpleDomain);
    return domain;
  });

/** brute-force approach: replaces `1/2` with `½` */
const replaceFractions = value => value
  .replace(RegExes.FRACTIONS, m => FractionsHash[m]);

module.exports = {
  linkify,
  replaceFractions,
  shorten,
};
