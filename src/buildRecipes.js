import { resolve } from 'path';
import { readFile, writeFile } from 'fs/promises';
import formatHtml from './libs/formatHtml.js';
import { ColorTypes, Colors } from './libs/ConsoleColors.js';
import { settleAll } from './libs/asyncUtils.js';
import parseRecipe from './recipe/parseRecipe.js';
import renderRecipe from './recipe/renderRecipe.js';
import { SectionTypes } from './recipe/sections.js';

/**
 * Lists recipes whose headings weren't recognized; their content was put under "notes".
 * @param {Array<{ name: string, unknownSections: string }>} recipes
 */
function showUnknownSectionWarnings(recipes) {
  if (!recipes.length) {
    return;
  }
  const { Reset } = ColorTypes;
  const { Magenta, Cyan, Orange, CoolYellow, Yellow } = Colors;
  /* eslint-disable no-console */
  console.warn(`\n${
    Yellow}Some recipes contain unrecognized sections. Content for these sections will appear under the "${
    Magenta}${SectionTypes.NOTES}${
    Yellow}" section.${
    Reset}\n`);
  recipes.forEach(({ name, unknownSections }, index) => console.warn(`${
    CoolYellow}${index + 1}. ${
    Cyan}${name}.md${
    CoolYellow}: ${
    Orange}${unknownSections}${
    Reset}`));
  /* eslint-enable no-console */
}

/**
 * Reads one markdown recipe, converts it, and writes the finished page to `outputPath`.
 *
 * @returns {Promise<{ name: string, author: string, unknownSections: string }>}
 */
async function buildRecipe(recipeTemplate, options, { file, name }, images) {
  const markdown = await readFile(file, { encoding: 'utf8' });
  const recipe = parseRecipe(markdown, options);
  const image = images.find((i) => i.name === name);

  const html = formatHtml(renderRecipe(recipeTemplate, recipe, { name, image }, options), { tidy: true });
  await writeFile(resolve(options.outputPath, `${name}.html`), html, { encoding: 'utf8' });

  return { name, author: recipe.author, unknownSections: recipe.sections.warnings };
}

/**
 * Builds every recipe page concurrently. A recipe that fails is logged and skipped; the rest
 * are still written.
 *
 * @param {string} recipeTemplate contents of `templates/recipe.html`
 * @param {object} options build options (see `config.js`), plus `outputPath`
 * @param {Array<{ file: string, name: string }>} fileList markdown recipes
 * @param {Array<{ name: string, fileName: string }>} images available hero images
 * @returns {Promise<{ recipeInfo: Array<{ name: string, author: string }>, errors: unknown[] }>}
 *   `recipeInfo` lists recipes with a detected author; `errors` holds per-recipe failures
 */
export default async function buildRecipes(recipeTemplate, options, fileList, images) {
  const { values, errors } = await settleAll('Recipe', fileList.map((recipeFile) => (
    buildRecipe(recipeTemplate, options, recipeFile, images)
      .catch((err) => {
        throw new Error(`${recipeFile.name}.md: ${err.message}`, { cause: err });
      })
  )));

  showUnknownSectionWarnings(values.filter(({ unknownSections }) => unknownSections));

  return {
    recipeInfo: values
      .filter(({ author }) => author)
      .map(({ name, author }) => ({ name, author })),
    errors,
  };
}
