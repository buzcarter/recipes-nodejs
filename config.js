const RECIPE_NAME = '<name>';

const yelpLocation = 'Bloomfield, NJ'; // no need for fancy formatting, just do it like this

/*
* RECIPE OPTIONS
* below are some options to customize how your recipes appear
* (these are mostly things that folks might want to change, but
* of course you can customize the code too)
*/
export default {
  imageDir: './images',
  outputDir: './output',
  recipeDir: './recipes',

  titleSuffix: ' - Recipe Book',
  favicon: 'measuring-cup-favicon.svg',

  includeHelpLinks: false,

  /**
   * **experimental**
   * when enabled searches for double-quotes and makes them "curly quotes" (smart)
   */
  useSmartQuotes: true,

  /**
   * **experimental**
   * when enabled wraps `<img />` tags in link to open in new tab
   */
  addImageLinks: true,

  /**
   * **experimental**
   * when enabled looks in raw file for author's name
   */
  findAuthor: true,

  defaultTheme: 'default',

  /**
   * Options are:
   * * 'content'
   * * 'compact-list'
   * * 'grid'
   */
  initialIndexView: 'content',
  /**
   * help urls to include (will be listed in the order below)
   * label = text displayed
   * url = template url (put <name> where the search term
   *       goes, it will be auto-added later)
   */
  helpURLs: [{
    label: 'Image search',
    url: `https://www.google.com/search?q=${RECIPE_NAME}&tbm=isch`,
  },
  {
    label: 'Serious Eats',
    url: `https://www.seriouseats.com/search?q=${RECIPE_NAME}&site=recipes`,
  },
  {
    label: 'More recipes',
    url: `https://www.google.com/search?q=${RECIPE_NAME}+recipe`,
  },
  {
    label: 'Yelp (takeout pls)',
    url: `https://www.yelp.com/search?find_loc=${yelpLocation}&find_desc=${RECIPE_NAME}`,
  },
  ],

  /**
   * look in `config.imageDir` folder an image to display
   * at the top of the recipe?
   *
   * * must be named the same thing as the recipe's file name
   * * must have extension `jpg`, 'png`, or `webp`
   *
   * For example: "aloo-matar.md" would have an image "aloo-matar.jpg"
   *
   * Fail gracefully if an image doesn't exist, but you can
   * turn it off entirely if you want
   */
  lookForHeroImage: true,

  /**
   * turn text-only urls to links in these sections
   * (in other sections, markdown links will work as normal)
   */
  autoUrlSections: ['basedon'],

  /**
   * trim display text for long urls in 'based on' section
   * @example
   * const url = 'https://www.seriouseats.com/recipes/2012/01/aloo-matar.html'
   * // would become:
   * // www.seriouseats.com
   */
  shortenURLs: true,

  /**
   * How to handle fractions within ingredient list's amount, should the app
   * use standard fractions (such as 1/2) instead of special characters (such as ½)
   * in your ingredient list, or leave them as-is, no changes (ignore).
   *
   * * false:    leave as-is (no change)
   * * true:     prefer special characters, i.e. convert `1/2` to `½`
   */
  useFractionSymbols: true,
};
