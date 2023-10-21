const { basename, extname, resolve } = require('path');
const { cpSync, rmSync, mkdirSync } = require('fs');
const { readdir, readFile } = require('fs/promises');
const sharp = require('sharp');

const { buildRecipes } = require('./src/buildRecipes');
const buildRecipeIndex = require('./src/buildRecipeIndex');
const configs = require('./config');

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
  mkdirSync(resolve(outputPath, 'images'));
  mkdirSync(resolve(outputPath, 'images/thumbnails'));
}

function copyStatic(staticPath, imagesPath, outputPath) {
  cpSync(staticPath, outputPath, { recursive: true });
  cpSync(imagesPath, resolve(outputPath, 'images'), { recursive: true });
}

function makeThumbnails(imagesPath, outputPath, images) {
  images
    .forEach(({ file, name }) => {
      const thumbnailPath = resolve(outputPath, `images/thumbnails/${name}.jpg`);
      sharp(file)
        .resize(300)
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath)
        // eslint-disable-next-line no-console
        .catch(err => console.error(`Problem generating ${thumbnailPath}`, err));
    });
}

function main(configs) {
  const startTime = new Date();
  const options = {
    ...configs,
    imagesPath: resolve(__dirname, configs.imageDir),
    outputPath: resolve(__dirname, configs.outputDir),
    recipesPath: resolve(__dirname, configs.recipeDir),
    staticPath: resolve(__dirname, './src/static/'),
    templatesPath: resolve(__dirname, './src/templates/'),
  };

  Promise.all([
    readdir(options.recipesPath),
    readdir(options.imagesPath),
    readFile(resolve(options.templatesPath, 'index.html'), { encoding: 'utf8' }),
    readFile(resolve(options.templatesPath, 'recipe.html'), { encoding: 'utf8' }),
  ])
    .then(([markdownFiles, images, indexTemplate, recipeTemplate]) => {
      markdownFiles = filterByExtension(markdownFiles, options.recipesPath, ['.md']);
      images = filterByExtension(images, options.imagesPath, ['.jpg', '.jpeg', '.png', '.webp', '.avif']);

      setupOutputDir(options.outputPath);
      copyStatic(options.staticPath, options.imagesPath, options.outputPath);
      makeThumbnails(options.imagesPath, options.outputPath, images);
      buildRecipes(recipeTemplate, options, markdownFiles, images);
      buildRecipeIndex(indexTemplate, options, markdownFiles, images);

      const endTime = new Date();
      // eslint-disable-next-line no-console
      console.log(`Processed ${markdownFiles.length} recipes in ${endTime - startTime}ms`);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
}

main(configs);
