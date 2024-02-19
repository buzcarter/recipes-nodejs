/* eslint-disable no-console */
import { resolve } from 'path';
import { readdir, readFile } from 'fs/promises';
import { __dirname, filterByExtension } from './libs/fsUtils.js';
import { fileNameToTitleCase } from './libs/utils.js';

const RegExes = {
  // Can ignore "MENU" directive
  DIRECTIVES: /^#EXT(AUTH|DATE|DESC|IMG|INFO|RATING|TITLE):\s*(.*)$/i,
};

function parseMenuFile(content) {
  const menuObj = {
    recipes: [],
  };
  let recipe = null;
  let isMenuScope = true;

  content.split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length)
    .forEach((line) => {
      if (!line.startsWith('#')) {
        isMenuScope = false;
        if (recipe) {
          menuObj.recipes.push(recipe);
        }
        // assume it's a URL
        recipe = {
          url: line,
        };
      } else {
        const matches = line.match(RegExes.DIRECTIVES);
        if (!matches) {
          // ignore comment or unrecognized directive
          return;
        }
        const [, directive, value] = matches;
        if (isMenuScope) {
          switch (directive) {
            case 'AUTH':
              menuObj.author = value;
              break;
            case 'DATE':
              menuObj.date = value;
              break;
            case 'DESC':
              menuObj.description = value;
              break;
            case 'IMG':
              menuObj.imgURL = value;
              break;
            case 'INFO':
              menuObj.info = value;
              break;
            case 'TITLE':
              menuObj.title = value;
              break;
          }
        } else {
          switch (directive) {
            case 'INFO':
              recipe.info = value;
              break;
            case 'RATING':
              recipe.rating = value;
              break;
          }
        }
      }
    });

  // add any stragglers
  if (recipe) {
    menuObj.recipes.push(recipe);
  }

  return menuObj;
}

function main() {
  const recipesPath = resolve(__dirname, './recipes/');
  let menuCount = 0;
  readdir(recipesPath)
    .then((menuFiles) => {
      menuFiles = filterByExtension(menuFiles, recipesPath, ['.menu']);
      menuCount = menuFiles.length;
      menuFiles.forEach(({ file, fileName, name }) => {
        readFile(resolve(recipesPath, file), 'utf8')
          .then((data) => {
            const json = parseMenuFile(data);
            if (!json.title) {
              json.title = fileNameToTitleCase(name);
            }
            console.log(fileName, json);
          })
          .catch((err) => {
            console.error(`BuildMenuLists: Problem reading "${fileName}"`, err);
          });
      });
    })
    .finally(() => {
      console.info(`Processing ${menuCount} menus`);
    });
}

main();
