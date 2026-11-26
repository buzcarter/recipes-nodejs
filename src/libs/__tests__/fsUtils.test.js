import { homedir } from 'os';
import { join, parse, resolve } from 'path';
import { __dirname as projectDir, assertSafeOutputDir, filterByExtension } from '../fsUtils.js';

describe('assertSafeOutputDir', () => {
  const recipes = resolve('/data/recipes');
  const images = resolve('/data/recipes/images');
  const protectedPaths = [projectDir, recipes, images];

  it.each([
    ['a filesystem root', parse(projectDir).root],
    ['the home directory', homedir()],
    ['the project', projectDir],
    ['a parent of the project', resolve(projectDir, '..')],
    ['the recipe folder', recipes],
    ['a parent of the recipe folder', resolve('/data')],
    ['the image folder', images],
  ])('refuses %s', (_, outputPath) => {
    expect(() => assertSafeOutputDir(outputPath, protectedPaths)).toThrow(/Refusing to delete/);
  });

  it.each([
    ['a sibling folder', resolve('/data/site')],
    ['a folder inside the project', join(projectDir, 'output')],
    ['a folder inside the recipes', join(recipes, 'html')],
    ['a folder inside the home directory', join(homedir(), 'Sites', 'recipes')],
  ])('allows %s', (_, outputPath) => {
    expect(() => assertSafeOutputDir(outputPath, protectedPaths)).not.toThrow();
  });
});

describe('filterByExtension', () => {
  it('keeps matching files and splits out their names', () => {
    expect(filterByExtension(['pie.md', 'pie.jpg', 'notes.txt', 'tart.MD'], '/r', ['.md', '.jpg'])).toEqual([
      { file: resolve('/r', 'pie.md'), fileName: 'pie.md', name: 'pie' },
      { file: resolve('/r', 'pie.jpg'), fileName: 'pie.jpg', name: 'pie' },
    ]);
  });
});
