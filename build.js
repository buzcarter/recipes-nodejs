/* eslint-disable no-console */
import { existsSync } from 'fs';
import { basename, extname, join, resolve } from 'path';
import {
  cp, mkdir, readdir, readFile, rename, rm,
} from 'fs/promises';
import { pathToFileURL } from 'url';
import sharp from 'sharp';

import buildRecipes from './src/buildRecipes.js';
import buildRecipeIndex from './src/buildRecipeIndex.js';
import configs from './config.js';
import { __dirname, assertSafeOutputDir, filterByExtension } from './src/libs/fsUtils.js';
import { settleAll } from './src/libs/asyncUtils.js';
import { UsageError, getUsage, parseCommandLine } from './src/libs/cliArgs.js';

import { ColorTypes, Colors } from './src/libs/ConsoleColors.js';

const THUMBNAIL_WIDTH = 260;
const JPEG_QUALITY = 70;
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

/** optional, git-ignored file whose settings override `config.js` (handy for personal paths) */
const LOCAL_CONFIG_PATH = resolve(__dirname, 'config.local.js');

const showOverrideMsg = (cmdArgs) => {
  const { Reset } = ColorTypes;
  const { Orange, Cyan, Yellow, Magenta } = Colors;
  console.log(`\n${
    Yellow}Using command line overrides:\n${Magenta}${JSON
    .stringify(cmdArgs, null, 3)
    .replace(/^(\s*)"([^"]+)": ("?)(.*?)("?)(,?)$/gm, `$1${Magenta}"${Orange}$2${Magenta}": ${Magenta}$3${Cyan}$4${Magenta}$5$6`)}${
    Reset}\n`);
};

const showDoneMsg = (recipeCount, time, errorCount) => {
  const { Reset } = ColorTypes;
  const { Orange, Cyan, Yellow, Red } = Colors;
  const errorMsg = errorCount ? `${Red} with ${errorCount} error${errorCount === 1 ? '' : 's'}` : '';
  console.log(`\n${
    Yellow}Processed ${
    Cyan}${recipeCount}${
    Yellow} recipes in ${
    Cyan}${Math.round(time)}${
    Orange}ms${errorMsg}${
    Reset
  }\n`);
};

/** Wipes and recreates the output folder tree. Callers must run `assertSafeOutputDir` first. */
async function setupOutputDir(outputPath) {
  await rm(outputPath, { recursive: true, force: true });
  await mkdir(resolve(outputPath, 'sources'), { recursive: true });
  await mkdir(resolve(outputPath, 'images/thumbnails'), { recursive: true });
}

/** Renames the copied markdown sources `*.md` → `*.txt` so browsers display them as plain text. */
async function changeExtension(mdDestinationPath) {
  const fileList = await readdir(mdDestinationPath);
  return settleAll('Renaming recipe source', fileList
    .filter((file) => extname(file) === '.md')
    .map((file) => rename(
      join(mdDestinationPath, file),
      join(mdDestinationPath, `${basename(file, '.md')}.txt`),
    )));
}

/**
 * Edge doesn't support `.avif` yet, so write a `.jpg` copy of each one into the output folder.
 * `.rotate()` with no arguments applies the EXIF orientation, which sharp would otherwise drop.
 */
function makeLegacyJpegs(imgDestinationPath, images) {
  return settleAll('AVIF to JPEG conversion', images
    .filter(({ fileName }) => extname(fileName) === '.avif')
    .map(({ file, name }) => sharp(file)
      .rotate()
      .jpeg({ quality: JPEG_QUALITY })
      .toFile(join(imgDestinationPath, `${name}.jpg`))));
}

/** images within this long:short side ratio are treated as "square" (1.25 = 5:4 or 4:5) */
const SQUARISH_MAX_RATIO = 1.25;

/**
 * Reads each image's dimensions (honoring EXIF rotation) and adds `width`, `height`, and
 * `orientation` ('landscape' | 'portrait' | 'square') so CSS can adapt to the image's shape.
 * Images whose metadata can't be read are left as-is.
 */
async function addImageDimensions(images) {
  await settleAll('Reading image dimensions', images.map(async (img) => {
    const { width, height, orientation: exif = 1 } = await sharp(img.file).metadata();
    // EXIF orientations 5-8 are rotated 90°, so the stored width/height are swapped
    const [w, h] = exif >= 5 ? [height, width] : [width, height];
    img.width = w;
    img.height = h;
    const ratio = Math.max(w, h) / Math.min(w, h);
    if (ratio <= SQUARISH_MAX_RATIO) {
      img.orientation = 'square';
    } else {
      img.orientation = w > h ? 'landscape' : 'portrait';
    }
  }));
  return images;
}

/** Pages link to the `.jpg` copies made by `makeLegacyJpegs` rather than the `.avif` originals. */
function swapJpegForAvif(images) {
  images
    .filter(({ fileName }) => extname(fileName) === '.avif')
    // eslint-disable-next-line no-return-assign
    .forEach((img) => img.fileName = img.fileName.replace(/avif$/, 'jpg'));

  return images;
}

/** Copies static assets, images, and recipe sources (renamed to `.txt`) into the output folder. */
async function copyStatic({ staticPath, imagesPath, outputPath, recipesPath }) {
  const mdDestinationPath = resolve(outputPath, 'sources');
  const imgDestinationPath = resolve(outputPath, 'images');

  const { errors } = await settleAll('Copying files', [
    cp(staticPath, outputPath, { recursive: true }),
    cp(imagesPath, imgDestinationPath, { recursive: true }),
    cp(recipesPath, mdDestinationPath, { recursive: true })
      .then(() => changeExtension(mdDestinationPath))
      .then(({ errors: renameErrors }) => {
        if (renameErrors.length) {
          throw new Error(`${renameErrors.length} recipe source file(s) could not be renamed to .txt`);
        }
      }),
  ]);
  return errors;
}

function makeThumbnails(outputPath, images) {
  return settleAll('Thumbnail', images
    .map(({ file, name }) => sharp(file)
      .rotate()
      .resize(THUMBNAIL_WIDTH)
      .jpeg({ quality: JPEG_QUALITY })
      .toFile(resolve(outputPath, `images/thumbnails/${name}.jpg`))));
}

/**
 * Settings given on the command line (see `parseCommandLine`). Intended for, well, me: makes it
 * easy to keep a private folder of recipes and images outside of this git repo:
 *
 * ```sh
 * npm run build imageDir="$HOME/documents/recipes/images" recipeDir="$HOME/documents/recipes/recipes" outputDir="$HOME/websites/recipes/html"
 * ```
 */
function getCommandLineOverrides(args) {
  const { overrides, help } = parseCommandLine(args, configs);
  if (help) {
    console.log(getUsage(configs));
    process.exit(0);
  }
  if (Object.keys(overrides).length) {
    showOverrideMsg(overrides);
  }
  return overrides;
}

/** Loads `config.local.js` when present; returns `{}` otherwise. */
async function getLocalConfig() {
  if (!existsSync(LOCAL_CONFIG_PATH)) {
    return {};
  }
  const { default: localConfig } = await import(pathToFileURL(LOCAL_CONFIG_PATH).href);
  return localConfig || {};
}

/**
 * Builds the whole site into `opts.outputDir`.
 * @returns {Promise<number>} number of failed steps (0 means a clean build)
 */
async function main(opts) {
  const startTime = performance.now();
  const imagesPath = resolve(__dirname, opts.imageDir);
  const outputPath = resolve(__dirname, opts.outputDir);
  const recipesPath = resolve(__dirname, opts.recipeDir);
  const staticPath = resolve(__dirname, './src/static/');
  const templatesPath = resolve(__dirname, './src/templates/');

  assertSafeOutputDir(outputPath, [__dirname, imagesPath, recipesPath]);

  const options = {
    ...opts,
    imagesPath,
    outputPath,
    recipesPath,
    staticPath,
    templatesPath,
  };

  const [recipeFileNames, imageFileNames, indexTemplate, recipeTemplate] = await Promise.all([
    readdir(recipesPath),
    readdir(imagesPath),
    readFile(resolve(templatesPath, 'index.html'), { encoding: 'utf8' }),
    readFile(resolve(templatesPath, 'recipe.html'), { encoding: 'utf8' }),
  ]);
  const markdownFiles = filterByExtension(recipeFileNames, recipesPath, ['.md']);
  const images = filterByExtension(imageFileNames, imagesPath, IMAGE_EXTENSIONS);

  await setupOutputDir(outputPath);

  const buildPages = async () => {
    const pageImages = opts.lookForHeroImage === false
      ? []
      : swapJpegForAvif(await addImageDimensions(images.map((img) => ({ ...img }))));
    const { recipeInfo, errors } = await buildRecipes(recipeTemplate, options, markdownFiles, pageImages);
    await buildRecipeIndex(indexTemplate, options, markdownFiles, pageImages, recipeInfo);
    return errors;
  };

  // run concurrently; each step logs and returns its own per-file failures
  const [copyErrors, thumbs, jpegs, pageErrors] = await Promise.all([
    copyStatic(options),
    makeThumbnails(outputPath, images),
    makeLegacyJpegs(resolve(outputPath, 'images'), images),
    buildPages(),
  ]);
  const errorCount = copyErrors.length + thumbs.errors.length + jpegs.errors.length + pageErrors.length;

  showDoneMsg(markdownFiles.length, performance.now() - startTime, errorCount);
  return errorCount;
}

try {
  // command line first, so a typo fails fast, before anything else is read
  const overrides = getCommandLineOverrides(process.argv.slice(2));
  const errorCount = await main({
    ...configs,
    ...await getLocalConfig(),
    ...overrides,
  });
  if (errorCount) {
    process.exitCode = 1;
  }
} catch (err) {
  if (err instanceof UsageError) {
    console.error(`${Colors.Red}${err.message}${ColorTypes.Reset}\n\n${getUsage(configs)}`);
  } else {
    console.error(err);
  }
  process.exitCode = 1;
}
