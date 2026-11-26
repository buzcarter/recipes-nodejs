import { resolve } from 'path';
import { writeFile } from 'fs/promises';
import prettyHtml from 'pretty';
import { fileNameToTitleCase } from './libs/utils.js';

/* eslint-disable key-spacing */
const Substitutions = {
  LETTERS_INDEX:     '{{__letters-index__}}',
  RECIPE_LIST:       '{{__recipe-list__}}',
  // Head's meta-tags
  META_FAVICON:      '{{__favIcon__}}',
  META_DATE:         '{{__metaDateGenerated__}}',
  META_OG_IMG:       '{{__metaOGImage__}}',
  THEME_CSS:         '{{__theme__}}',
  // kickoff the on-page script
  STARTUP_JS:        '{{__startup__}}',
};

const Styles = Object.freeze({
  AUTHOR:   'recipe-list__author',
  ITEM:     'recipe-list__item',
  LINK:     'recipe-list__item-link',
  NAME:     'recipe-list__name',
  PHOTO:    'recipe-list__photo',
});

const RegExes = {
  END_SPACES: /^[\s\n]+|[\s\n]+$/gm,
};
/* eslint-enable key-spacing */

/**
 * Alphabetical, case-insensitive, with numbers in natural order ("2 eggs" before "10 eggs").
 * `readdir` order is filesystem-dependent (Linux returns hash order), so always sort explicitly.
 */
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/**
 * Writes `index.html`: the table of contents for every recipe, plus a quick-nav list of
 * first letters at the top.
 *
 * @param {string} indexTemplate contents of `templates/index.html`
 * @param {object} options build options (`defaultTheme`, `favicon`, `outputPath`, `initialIndexView`)
 * @param {Array<{ name: string }>} fileList recipe files, in any order
 * @param {Array<{ name: string, fileName: string }>} images available recipe images
 * @param {Array<{ name: string, author: string }>} recipeInfo detected authors, by recipe name
 */
export default async function buildRecipeIndex(indexTemplate, { defaultTheme, favicon, outputPath, initialIndexView }, fileList, images, recipeInfo) {
  // create anchor and name from url
  let lettersIndex = '';
  // create list of recipes
  let recipeItems = '';
  let ogImgURL = '';

  let prevLetter = '';

  [...fileList]
    .sort((a, b) => collator.compare(a.name, b.name))
    .forEach(({ name }) => {
      const firstLetter = name.charAt(0).toUpperCase();
      const displayName = fileNameToTitleCase(name);

      // if the first letter of the recipe hasn't been
      // seen yet, add to list of letters and put an anchor in
      const isNewLetter = firstLetter !== prevLetter;
      if (isNewLetter) {
        lettersIndex += `<a href="#${firstLetter}">${firstLetter}</a>`;
        prevLetter = firstLetter;
      }

      const image = images.find((i) => i.name === name);
      if (!ogImgURL && image) {
        ogImgURL = `images/${image.fileName}`;
      }
      const author = recipeInfo.find(({ name: infoName }) => infoName === name)?.author || '';
      const imgPath = image
        ? `images/thumbnails/${image.name}.jpg`
        : 'images/placeholder.svg';
      recipeItems += `
<li${isNewLetter ? ` id="${firstLetter}"` : ''} class="${Styles.ITEM}">
  <a href="${name}.html" class="${Styles.LINK}">
    <span class="${Styles.PHOTO}"><img src="${imgPath}" role="presentation"></span>
    <span class="${Styles.NAME}">${displayName}
    ${author ? `<em class="${Styles.AUTHOR}">${author}</em>` : ''}
    </span>
  </a>
</li>
`.replace(RegExes.END_SPACES, '');
    });

  // function replacers keep `$&`, `$$`, etc. in names/authors literal (see buildRecipes.js)
  const contents = indexTemplate
    // add recipes to page...
    .replace(Substitutions.RECIPE_LIST, () => recipeItems)
    // ...and the list of first-letters for quick nav
    .replace(Substitutions.LETTERS_INDEX, () => lettersIndex)
    .replace(Substitutions.META_DATE, () => `<meta name="date" content="${new Date()}">`)
    .replace(Substitutions.THEME_CSS, () => `theme-${defaultTheme}`)
    .replace(Substitutions.META_FAVICON, () => (favicon ? `<link rel="icon" type="image/png" href="${favicon}">` : ''))
    .replace(Substitutions.META_OG_IMG, () => (ogImgURL ? `<meta property="og:image" content="${ogImgURL}">` : ''))
    .replace(Substitutions.STARTUP_JS, () => `recipeIndex.init("${initialIndexView || 'content'}")`);

  await writeFile(resolve(outputPath, 'index.html'), prettyHtml(contents), { encoding: 'utf8' });
}
