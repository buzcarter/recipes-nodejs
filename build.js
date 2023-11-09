/* eslint-disable no-console */
const { basename, extname, join, resolve } = require('path');
const { rmSync, mkdirSync, rename } = require('fs');
const { cp, readdir, readFile } = require('fs/promises');
const sharp = require('sharp');

const { buildRecipes } = require('./src/buildRecipes');
const buildRecipeIndex = require('./src/buildRecipeIndex');
const configs = require('./config');

const THUMBNAIL_WIDTH = 260;

const filterByExtension = (fileList, recipesPath, allowedExtensions) => fileList
  .filter(fileName => allowedExtensions.includes(extname(fileName)))
  .map(fileName => ({
    file: resolve(recipesPath, fileName),
    fileName,
    name: basename(fileName, extname(fileName)),
  }));

function setupOutputDir(outputPath) {
  rmSync(outputPath, { recursive: true, force: true });
  mkdirSync(outputPath);
  mkdirSync(resolve(outputPath, 'sources'));
  mkdirSync(resolve(outputPath, 'images'));
  mkdirSync(resolve(outputPath, 'images/thumbnails'));
}

function copyStatic({staticPath, imagesPath, outputPath, recipesPath}) {
  const mdDestinationPath = resolve(outputPath, 'sources');
  const noop = (e) => {
    console.log(e);
  };

  Promise.all([
    cp(staticPath, outputPath, { recursive: true }),
    cp(imagesPath, resolve(outputPath, 'images'), { recursive: true }),
    cp(recipesPath, mdDestinationPath, { recursive: true }),
  ])
    .then(() => {
      readdir(mdDestinationPath)
        .then((filelist) => {
          filelist.forEach((file) => {
            if (extname(file) !== '.md') {
              return;
            }
            const originalPath = join(mdDestinationPath, file);
            const newPath = join(mdDestinationPath, basename(file, '.md') + '.txt');
            console.log(originalPath, newPath);
            rename(originalPath, newPath, noop);
          });
        });
    })
    .catch((err) => {
      console.error(err);
    });
}

function makeThumbnails(outputPath, images) {
  images
    .forEach(({ file, name }) => {
      const thumbnailPath = resolve(outputPath, `images/thumbnails/${name}.jpg`);
      sharp(file)
        .resize(THUMBNAIL_WIDTH)
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath)
        .catch(err => console.error(`Problem generating ${thumbnailPath}`, err));
    });
}

/**
 * Intended for, well, me: makes it easier to have my own private directory of images outside
 * of this git repo. For example, on a Mac you might use:
 *
 * ```sh
 * npm run build imageDir="~/documents/recipes/images" recipeDir="~/documents/recipes/recipes" outputDir="~/websites/recipes/html"
 * ```
 */
function getCommanLineOverrides(args) {
  const cmdArgs = args
    ?.filter((z, index) => index > 1)
    .reduce((acc, arg) => {
      const [key, value] = arg.split('=');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});

  if (cmdArgs && Object.keys(cmdArgs).length) {
    console.log(`Using command line overrides: ${JSON.stringify(cmdArgs, null, 3)}`);
  }
  return cmdArgs;
}

function main(configs) {
  const startTime = new Date();
  const imagesPath = resolve(__dirname, configs.imageDir);
  const outputPath = resolve(__dirname, configs.outputDir);
  const recipesPath = resolve(__dirname, configs.recipeDir);
  const staticPath = resolve(__dirname, './src/static/');
  const templatesPath = resolve(__dirname, './src/templates/');

  const options = {
    ...configs,
    imagesPath,
    outputPath,
    recipesPath,
    staticPath,
    templatesPath,
  };

  Promise.all([
    readdir(recipesPath),
    readdir(imagesPath),
    readFile(resolve(templatesPath, 'index.html'), { encoding: 'utf8' }),
    readFile(resolve(templatesPath, 'recipe.html'), { encoding: 'utf8' }),
  ])
    .then(([markdownFiles, images, indexTemplate, recipeTemplate]) => {
      markdownFiles = filterByExtension(markdownFiles, recipesPath, ['.md']);
      images = filterByExtension(images, imagesPath, ['.jpg', '.jpeg', '.png', '.webp', '.avif']);

      setupOutputDir(outputPath);
      copyStatic({staticPath, imagesPath, outputPath, recipesPath});
      makeThumbnails(outputPath, images);
      buildRecipes(recipeTemplate, options, markdownFiles, images);
      buildRecipeIndex(indexTemplate, options, markdownFiles, images);

      const endTime = new Date();
      console.log(`Processed ${markdownFiles.length} recipes in ${endTime - startTime}ms`);
    })
    .catch((err) => {
      console.error(err);
    });
}

main({
  ...configs,
  ...getCommanLineOverrides(process.argv),
});
