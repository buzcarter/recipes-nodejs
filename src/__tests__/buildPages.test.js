/*
 * File-level tests: real markdown in a temp folder → the HTML files the build writes.
 */
import { jest } from '@jest/globals';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import buildRecipes from '../buildRecipes.js';
import buildRecipeIndex from '../buildRecipeIndex.js';

const RecipeTemplate = '<html><head><title>x</title>{{__metaDateGenerated__}}</head><body class="{{__bodyClass__}}"><h1>{{__title__}}</h1>{{__heroImg__}}{{__header__}}{{__ingredients__}}{{__steps__}}{{__notes__}}</body></html>';
const IndexTemplate = '<html><head>{{__metaOGImage__}}</head><body class="view--{{__initialView__}}"><nav>{{__letters-index__}}</nav><ul>{{__recipe-list__}}</ul></body></html>';

const Options = {
  autoUrlSections: ['basedon'],
  defaultTheme: 'default',
  findAuthor: true,
  initialIndexView: 'grid',
  useFractionSymbols: true,
};

let dir;
let consoleWarn;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'recipes-test-'));
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
  jest.restoreAllMocks();
  await rm(dir, { recursive: true, force: true });
});

async function addRecipe(name, markdown) {
  const file = join(dir, `${name}.md`);
  await writeFile(file, markdown);
  return { file, name };
}

const read = (name) => readFile(join(dir, name), 'utf8');

describe('buildRecipes', () => {
  it('writes a page per recipe and reports authors', async () => {
    const files = [
      await addRecipe('apple-pie', '# Apple Pie\n\nBy Pat Baker\n\n## Ingredients\n\n* 1/2 cup sugar\n\n## Steps\n\n1. Bake it\n'),
      await addRecipe('toast', '# Toast\n\n## Steps\n\n1. Toast it\n\n## Wine Pairing\n\nred\n'),
    ];
    const images = [{ name: 'apple-pie', fileName: 'apple-pie.jpg', orientation: 'square' }];

    const { recipeInfo, errors } = await buildRecipes(RecipeTemplate, { ...Options, outputPath: dir }, files, images);

    expect(errors).toEqual([]);
    expect(recipeInfo).toEqual([{ name: 'apple-pie', author: 'Pat Baker' }]);

    const pie = await read('apple-pie.html');
    expect(pie).toContain('<h1>Apple Pie</h1>');
    expect(pie).toContain('<img class="hero-img" src="images/apple-pie.jpg" alt="Apple Pie">');
    expect(pie).toContain('<span class="ingredient__symbol">½</span> cup');
    expect(pie).toMatch(/class="heroimage--visible heroimage--square header--visible ingredients--visible steps--visible/);

    // an unrecognized heading lands in notes, with a warning
    expect(await read('toast.html')).toMatch(/<div class="subsection--winepairing">\s*<h2 id="winepairing">Wine Pairing<\/h2>/);
    expect(consoleWarn.mock.calls.flat().join(' ')).toContain('toast.md');
  });

  it('keeps going when one recipe fails', async () => {
    const files = [
      await addRecipe('ok', '# OK\n'),
      { file: join(dir, 'missing.md'), name: 'missing' },
    ];

    const { errors } = await buildRecipes(RecipeTemplate, { ...Options, outputPath: dir }, files, []);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/^missing\.md: /);
    expect(await read('ok.html')).toContain('<h1>OK</h1>');
  });
});

describe('buildRecipeIndex', () => {
  it('lists recipes alphabetically with letter anchors, authors, and thumbnails', async () => {
    const fileList = ['banana-bread', 'apple-pie', '10-minute-eggs', 'Avocado Toast'].map((name) => ({ name }));
    const images = [{ name: 'banana-bread', fileName: 'banana-bread.jpg' }];
    const recipeInfo = [{ name: 'apple-pie', author: 'Pat & Sam' }];

    await buildRecipeIndex(IndexTemplate, { ...Options, outputPath: dir }, fileList, images, recipeInfo);
    const html = await read('index.html');

    const order = [...html.matchAll(/<a href="([^"]+)\.html"/g)].map(([, href]) => href);
    expect(order).toEqual(['10-minute-eggs', 'apple-pie', 'Avocado%20Toast', 'banana-bread']);
    expect([...html.matchAll(/<a href="#([^"]+)">/g)].map(([, letter]) => letter)).toEqual(['1', 'A', 'B']);
    expect(html).toContain('<em class="recipe-list__author">Pat &amp; Sam</em>');
    expect(html).toContain('<img src="images/thumbnails/banana-bread.jpg" alt="">');
    expect(html).toContain('<meta property="og:image" content="images/banana-bread.jpg">');
    expect(html).toContain('<body class="view--grid">');
  });
});
