/* eslint-disable no-console */

/**
 * Waits for every promise, even when some reject, so one bad file doesn't stop the rest of the
 * build. Each failure is logged under `label`.
 *
 * @template T
 * @param {string} label short description used when logging failures (e.g. "Thumbnail")
 * @param {Array<Promise<T>>} promises work to wait on
 * @returns {Promise<{ values: T[], errors: unknown[] }>} fulfilled values and rejection reasons
 */
export async function settleAll(label, promises) {
  const results = await Promise.allSettled(promises);
  const values = [];
  const errors = [];
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      values.push(result.value);
    } else {
      errors.push(result.reason);
      console.error(`${label} failed:`, result.reason?.message ?? result.reason);
    }
  });
  return { values, errors };
}
