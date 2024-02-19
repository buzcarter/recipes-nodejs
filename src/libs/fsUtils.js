import {
  basename,
  dirname,
  extname,
  resolve,
} from 'path';
import { fileURLToPath } from 'url';

/** directory name of project root */
export const __dirname = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const filterByExtension = (fileList, basePath, allowedExtensions) => fileList
  .filter((fileName) => allowedExtensions.includes(extname(fileName)))
  .map((fileName) => ({
    file: resolve(basePath, fileName),
    fileName,
    name: basename(fileName, extname(fileName)),
  }));
