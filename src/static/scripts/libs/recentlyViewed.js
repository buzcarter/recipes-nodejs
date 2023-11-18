import { KeyNames, updateMRUList } from './preferences.js';

const MAX_LIST_LENGTH = 50;

const Selectors = {
  RECIPE_LIST: '#recipe-list',
};

function onClick(e) {
  const anchor = e.target.tagName === 'A'
    ? e.target
    : e.target.closest('a');

  if (anchor) {
    const value = anchor.getAttribute('href');
    if (value) {
      updateMRUList(KeyNames.RECENT, MAX_LIST_LENGTH, value.replace(/^.*\/|\.html$/g, ''));
    }
  }
}

export function init() {
  // event delegation: record all recipe link clicks
  document.querySelector(Selectors.RECIPE_LIST).addEventListener('click', onClick);
}
