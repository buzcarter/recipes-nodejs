import { KeyNames, updateKey, updateMRUList } from './preferences.js';
import { debounce } from './utils.js';

/* eslint-disable key-spacing */
const Styles = {
  HIDDEN: 'recipe-list__item--hidden',
};

const Selectors = {
  RECIPE_LIST:  '#recipe-list',
  RECIPE_ITEMS: '#recipe-list li',
  SEARCH:       '#filter-field',
  CLEAR_BTN:    '#clear-filter-btn',
};

const KeyCodes = {
  ESCAPE: 27,
};
/* eslint-enable key-spacing */

const MAX_LIST_LENGTH = 8;
const HISTORY_DEBOUNCE_DELAY = 2.25 * 1000;

const scrub = (value) => value
  .trim()
  .toLowerCase()
  .replace(/\W/g, '')
  .replace(/\s+/g, ' ');

function filter(filterText) {
  const words = filterText.split(/\s+/).map((w) => scrub(w)).filter(Boolean);

  document.querySelectorAll(Selectors.RECIPE_ITEMS)
    .forEach((item) => {
      if (!filterText) {
        item.classList.remove(Styles.HIDDEN);
      }
      const { searchText } = item.dataset || '';
      const isMatch = words.reduce((acc, word) => acc && searchText.includes(word), true);
      item.classList.toggle(Styles.HIDDEN, !isMatch);
    });
}

const updateHistory = () => {
  const { value } = document.querySelector(Selectors.SEARCH);
  if (value.trim()) {
    updateMRUList(KeyNames.SEARCH_HISTORY, MAX_LIST_LENGTH, value);
  }
};

const clearInput = () => {
  const input = document.querySelector(Selectors.SEARCH);
  input.value = '';
  input.focus();
  filter('');
  updateKey(KeyNames.SEARCH, '');
};

export function init(initalValue) {
  // must build the index, and want to do that while everything is visible (using `innerText`)
  const list = document.querySelector(Selectors.RECIPE_LIST);
  list.style.opacity = '0';
  // eslint-disable-next-line no-return-assign
  document.querySelectorAll(Selectors.RECIPE_ITEMS).forEach((item) => item.dataset.searchText = scrub(item.innerText));

  const input = document.querySelector(Selectors.SEARCH);
  input.value = initalValue || '';
  filter(initalValue);
  list.style.opacity = '100%';

  input.addEventListener('keyup', function onKeyUp() {
    updateKey(KeyNames.SEARCH, this.value);
    filter(this.value);
  });
  input.addEventListener('keyup', debounce(updateHistory, HISTORY_DEBOUNCE_DELAY));

  input.addEventListener('keydown', (e) => e.which === KeyCodes.ESCAPE && clearInput());

  document.querySelector(Selectors.CLEAR_BTN).addEventListener('click', clearInput);
}
