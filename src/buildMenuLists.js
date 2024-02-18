import { readFile } from 'fs';

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
  readFile('./recipes/my-holiday-bakes.menu', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    const json = parseMenuFile(data);
    console.log(json);
  });
}

main();
