import { parseArgs } from 'node:util';

const TRUE_VALUES = new Set(['true', 'yes', 'on', '1']);
const FALSE_VALUES = new Set(['false', 'no', 'off', '0']);

/** Thrown for a command line the build can't use; the message is meant for the user. */
export class UsageError extends Error {
  name = 'UsageError';
}

/**
 * Config keys that can be set from the command line: those whose default is a string or boolean
 * (lists like `helpURLs` belong in a config file).
 *
 * @param {Record<string, unknown>} defaults
 * @returns {Map<string, 'string' | 'boolean'>}
 */
function getSettableKeys(defaults) {
  return new Map(Object.entries(defaults)
    .filter(([, value]) => typeof value === 'string' || typeof value === 'boolean')
    .map(([key, value]) => [key, /** @type {'string' | 'boolean'} */ (typeof value)]));
}

function toBoolean(key, value) {
  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }
  if (FALSE_VALUES.has(normalized)) {
    return false;
  }
  throw new UsageError(`"${key}" must be true or false (got "${value}")`);
}

/**
 * Reads config overrides from the command line. Both styles work, and can be mixed:
 *
 * ```sh
 * node build.js outputDir="$HOME/Sites/recipes" includeHelpLinks=true
 * node build.js --outputDir "$HOME/Sites/recipes" --includeHelpLinks --no-findAuthor
 * ```
 *
 * (With `npm run build`, put `--` before any `--option`s, or npm keeps them for itself.)
 *
 * @param {string[]} args command-line arguments, without node and the script (`process.argv.slice(2)`)
 * @param {Record<string, unknown>} defaults the full default config; decides the known keys and their types
 * @returns {{ overrides: Record<string, string | boolean>, help: boolean }}
 * @throws {UsageError} for an unknown key, a missing value, or a boolean that isn't true/false
 */
export function parseCommandLine(args, defaults) {
  const settable = getSettableKeys(defaults);

  /** @type {import('node:util').ParseArgsConfig['options']} */
  const options = { help: { type: 'boolean', short: 'h' } };
  settable.forEach((type, key) => {
    options[key] = { type };
    if (type === 'boolean') {
      options[`no-${key}`] = { type: 'boolean' };
    }
  });

  let parsed;
  try {
    parsed = parseArgs({ args, options, strict: true, allowPositionals: true });
  } catch (err) {
    throw new UsageError(err.message.replace(/\. To specify a positional argument.*$/s, ''));
  }

  /** @type {Record<string, string | boolean>} */
  const overrides = {};
  Object.entries(parsed.values).forEach(([key, value]) => {
    if (key === 'help') {
      return;
    }
    if (key.startsWith('no-')) {
      overrides[key.slice(3)] = !value;
      return;
    }
    // no option is declared `multiple`, so values are never arrays
    overrides[key] = /** @type {string | boolean} */ (value);
  });

  // `key=value` style; split on the first "=" only, so values may contain "="
  parsed.positionals.forEach((arg) => {
    const separator = arg.indexOf('=');
    const key = separator > 0 ? arg.slice(0, separator) : arg;
    if (!settable.has(key)) {
      throw new UsageError(`Unknown setting "${key}"`);
    }
    if (separator < 0) {
      throw new UsageError(`"${key}" needs a value, e.g. ${key}=…`);
    }
    const value = arg.slice(separator + 1);
    overrides[key] = settable.get(key) === 'boolean' ? toBoolean(key, value) : value;
  });

  return { overrides, help: Boolean(parsed.values.help) };
}

/**
 * Help text listing every setting the command line accepts.
 * @param {Record<string, unknown>} defaults
 */
export function getUsage(defaults) {
  const lines = [...getSettableKeys(defaults)]
    .map(([key, type]) => `  ${key.padEnd(20)} ${type === 'boolean' ? 'true | false' : 'text'}  (default: ${JSON.stringify(defaults[key])})`);

  return `Usage: npm run build [setting=value …]
       node build.js [--setting value …] [--flag | --no-flag …]

Overrides config.js and config.local.js for this run. Settings:
${lines.join('\n')}
`;
}
