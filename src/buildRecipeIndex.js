const { resolve } = require('path');
const { writeFileSync } = require('fs');
const prettyHtml = require('pretty');

/* eslint-disable key-spacing */
const Substitutions = {
  LETTERS_INDEX:     '{{__letters-index__}}',
  RECIPE_LIST:       '{{__recipe-list__}}',
  // Head's meta-tags
  META_FAVICON:      '{{__favIcon__}}',
  META_DATE:         '{{__metaDateGenerated__}}',
  THEME_CSS:         '{{__theme__}}',
};

const Styles = Object.freeze({
  ITEM:     'recipe-list__item',
  NAME:     'recipe-list__name',
  PHOTO:    'recipe-list__photo',
});

const RegExes = {
  END_SPACES: /^[\s\n]+|[\s\n]+$/gm,
};
/* eslint-enable key-spacing */

/**
 * and generate table of contents, plus a quick-nav list
 *  at the top
 */
function buildRecipeIndex(indexTemplate, { defaultTheme, favicon, outputPath }, fileList, images) {
  // create anchor and name from url
  let lettersIndex = '';
  // create list of recipes
  let recipeItems = '';

  let prevLetter = '';

  fileList.forEach(({ name }) => {
    const firstLetter = name.charAt(0).toUpperCase();
    const displayName = name.replace(/-/g, ' ');

    // if the first letter of the recipe hasn't been
    // seen yet, add to list of letters and put an achor in
    const isNewLetter = firstLetter !== prevLetter;
    if (isNewLetter) {
      lettersIndex += `<a href="#${firstLetter}">${firstLetter}</a>`;
      prevLetter = firstLetter;
    }

    const image = images.find(i => i.name === name);
    const imgPath = image
      ? `images/thumbnails/${image.name}.jpg`
      : 'images/placeholder.svg';
    recipeItems += `
<li${isNewLetter ? ` id="${firstLetter}"` : ''} class="${Styles.ITEM}">
  <a href="${name}.html">
    <span class="${Styles.PHOTO}"><img src="${imgPath}" role="presentation"></span>
    <span class="${Styles.NAME}">${displayName}</span>
  </a>
</li>
`.replace(RegExes.END_SPACES, '');
  });

  const contents = indexTemplate
    // add recipes to page...
    .replace(Substitutions.RECIPE_LIST, recipeItems)
    // ...and the list of first-letters for quick nav
    .replace(Substitutions.LETTERS_INDEX, lettersIndex)
    .replace(Substitutions.META_DATE, `<meta name="date" content="${new Date()}">`)
    .replace(Substitutions.THEME_CSS, `theme-${defaultTheme}`)
    .replace(Substitutions.META_FAVICON, favicon ? `<link rel="icon" type="image/png" href="${favicon}">` : '');

  writeFileSync(resolve(outputPath, 'index.html'), prettyHtml(contents), { encoding: 'utf8' });
}

module.exports = buildRecipeIndex;

/*
show-thumbnails
*/
