import { resolve } from 'path';
import { writeFile } from 'fs/promises';
import formatHtml from './libs/formatHtml.js';
import fillTemplate from './libs/template.js';
import { getHeadMeta } from './libs/headMeta.js';
import { escapeHtml, fileUrl } from './libs/html.js';
import { fileNameToTitleCase } from './libs/utils.js';

/* eslint-disable key-spacing */
const Placeholders = Object.freeze({
  LETTERS_INDEX:     '{{__letters-index__}}',
  RECIPE_LIST:       '{{__recipe-list__}}',
  /** the index layout shown until the visitor picks one (`initialIndexView`) */
  INITIAL_VIEW:      '{{__initialView__}}',
});

/** Index layouts; keep in sync with `ViewTypes` in `static/scripts/libs/viewPicker.js`. */
const IndexViews = Object.freeze(['content', 'compact-list', 'grid']);
const DEFAULT_VIEW = 'content';

const Styles = Object.freeze({
  AUTHOR:   'recipe-list__author',
  ITEM:     'recipe-list__item',
  LINK:     'recipe-list__item-link',
  NAME:     'recipe-list__name',
  PHOTO:    'recipe-list__photo',
});

const RegExes = Object.freeze({
  END_SPACES: /^[\s\n]+|[\s\n]+$/gm,
});
/* eslint-enable key-spacing */

/**
 * Alphabetical, case-insensitive, with numbers in natural order ("2 eggs" before "10 eggs").
 * `readdir` order is filesystem-dependent (Linux returns hash order), so always sort explicitly.
 */
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/** `initialIndexView`, falling back to the default (with a warning) when it isn't a known layout. */
function getInitialView(view) {
  if (!view) {
    return DEFAULT_VIEW;
  }
  if (!IndexViews.includes(view)) {
    // eslint-disable-next-line no-console
    console.warn(`initialIndexView "${view}" isn't one of: ${IndexViews.join(', ')}; using "${DEFAULT_VIEW}"`);
    return DEFAULT_VIEW;
  }
  return view;
}

function renderItem({ name, image, author, letter }) {
  const imgPath = image ? fileUrl('images/thumbnails', `${image.name}.jpg`) : 'images/placeholder.svg';
  return `
<li${letter ? ` id="${escapeHtml(letter)}"` : ''} class="${Styles.ITEM}">
  <a href="${escapeHtml(fileUrl('', `${name}.html`))}" class="${Styles.LINK}">
    <span class="${Styles.PHOTO}"><img src="${escapeHtml(imgPath)}" alt=""></span>
    <span class="${Styles.NAME}">${escapeHtml(fileNameToTitleCase(name))}
    ${author ? `<em class="${Styles.AUTHOR}">${escapeHtml(author)}</em>` : ''}
    </span>
  </a>
</li>
`.replace(RegExes.END_SPACES, '');
}

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
  const imagesByName = new Map(images.map((image) => [image.name, image]));
  const authorsByName = new Map(recipeInfo.map(({ name, author }) => [name, author]));

  const letters = [];
  const items = [...fileList]
    .sort((a, b) => collator.compare(a.name, b.name))
    .map(({ name }) => {
      // the first recipe for each letter gets an anchor for the quick-nav list
      const firstLetter = name.charAt(0).toUpperCase();
      const isNewLetter = firstLetter !== letters.at(-1);
      if (isNewLetter) {
        letters.push(firstLetter);
      }
      return {
        name,
        image: imagesByName.get(name),
        author: authorsByName.get(name) || '',
        letter: isNewLetter ? firstLetter : '',
      };
    });

  const ogImage = items.find(({ image }) => image)?.image;

  const contents = fillTemplate(indexTemplate, {
    ...getHeadMeta({ favicon, ogImgURL: ogImage && fileUrl('images', ogImage.fileName), theme: defaultTheme }),
    [Placeholders.RECIPE_LIST]: items.map(renderItem).join(''),
    [Placeholders.LETTERS_INDEX]: letters
      .map((letter) => `<a href="#${escapeHtml(encodeURIComponent(letter))}">${escapeHtml(letter)}</a>`)
      .join(''),
    [Placeholders.INITIAL_VIEW]: getInitialView(initialIndexView),
  });

  await writeFile(resolve(outputPath, 'index.html'), formatHtml(contents), { encoding: 'utf8' });
}
