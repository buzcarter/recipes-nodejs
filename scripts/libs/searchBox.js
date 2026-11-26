import { KeyNames, updateKey } from './preferences.js';

/* eslint-disable key-spacing */
const Styles = {
  HIDDEN: 'recipe-list__item--hidden',
};

const Selectors = {
  RECIPE_ITEMS: '#recipe-list li',
  SEARCH:       '#filter-field',
  CLEAR_BTN:    '#clear-filter-btn',
};
/* eslint-enable key-spacing */

/**
 * Normalizes text for matching: lower-case, accents removed ("jalapeño" → "jalapeno"), and
 * anything that isn't a letter or digit dropped. Works for any alphabet, not just a–z.
 *
 * @param {string} value
 * @returns {string}
 */
export const scrub = (value) => value
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]/gu, '');

/**
 * `true` when every word of the filter appears somewhere in `searchText`.
 *
 * @param {string} searchText an item's scrubbed text
 * @param {string} filterText what the visitor typed
 */
export function isMatch(searchText, filterText) {
  return filterText
    .split(/\s+/)
    .map(scrub)
    .filter(Boolean)
    .every((word) => searchText.includes(word));
}

function filter(filterText) {
  document.querySelectorAll(Selectors.RECIPE_ITEMS)
    .forEach((item) => item.classList.toggle(Styles.HIDDEN, !isMatch(item.dataset.searchText || '', filterText)));
}

function setFilter(value) {
  updateKey(KeyNames.SEARCH, value);
  filter(value);
}

function clearInput() {
  const input = document.querySelector(Selectors.SEARCH);
  input.value = '';
  input.focus();
  setFilter('');
}

/**
 * Wires up the recipe filter box.
 * @param {string} [initialValue] filter to start with (the visitor's last search)
 */
export function init(initialValue = '') {
  // index each item's text once; `textContent` works whether or not the item is visible
  document.querySelectorAll(Selectors.RECIPE_ITEMS)
    .forEach((item) => {
      item.dataset.searchText = scrub(item.textContent);
    });

  const input = document.querySelector(Selectors.SEARCH);
  input.value = initialValue;
  filter(initialValue);

  // `input` (unlike `keyup`) also catches paste, autofill, and dictation
  input.addEventListener('input', () => setFilter(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearInput();
    }
  });

  document.querySelector(Selectors.CLEAR_BTN).addEventListener('click', clearInput);
}
