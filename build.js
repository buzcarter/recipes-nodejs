/* eslint-disable no-console */
const { basename, extname, resolve } = require('path');
const { rmSync, mkdirSync } = require('fs');
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
  Promise.all([
    cp(staticPath, outputPath, { recursive: true }),
    cp(imagesPath, resolve(outputPath, 'images'), { recursive: true }),
    cp(recipesPath, resolve(outputPath, 'sources'), { recursive: true }),
  ])
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

main(configs);
