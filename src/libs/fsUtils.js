import { homedir } from 'os';
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  parse,
  relative,
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

/**
 * macOS and Windows filesystems are usually case-insensitive, so compare paths case-insensitively
 * there. That can only make the safety check below stricter, never looser.
 */
const normalizeCase = (path) => (process.platform === 'linux' ? path : path.toLowerCase());

/** true when `child` is `parent` itself or somewhere beneath it */
const isSameOrInside = (parent, child) => {
  const rel = relative(normalizeCase(parent), normalizeCase(child));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
};

/**
 * The build deletes `outputPath` recursively before writing to it. Throws unless that is safe:
 * the path must not be a filesystem root, and must not be (or contain) the home directory or
 * any of `protectedPaths` (e.g. the project itself and the recipe/image source folders).
 *
 * @param {string} outputPath directory the build is about to wipe
 * @param {string[]} [protectedPaths] directories that must survive the wipe
 * @throws {Error} describing why the path was refused
 */
export function assertSafeOutputDir(outputPath, protectedPaths = []) {
  const target = resolve(outputPath);
  const guarded = [homedir(), ...protectedPaths].map((p) => resolve(p));

  let problem = '';
  if (parse(target).root === target) {
    problem = 'a filesystem root';
  } else {
    const hit = guarded.find((p) => isSameOrInside(target, p));
    if (hit) {
      problem = hit === target ? 'a protected directory' : `a parent of protected directory "${hit}"`;
    }
  }

  if (problem) {
    throw new Error(`Refusing to delete output directory "${target}": it is ${problem}. Set "outputDir" to a dedicated folder.`);
  }
}
