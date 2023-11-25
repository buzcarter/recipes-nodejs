import { KeyNames, getKey, updateMRUList } from './preferences.js';

const MAX_LIST_LENGTH = 50;

const Selectors = {
  RECIPE_LIST: '#recipe-list',
  RECENTLY_VIEWED_BTN: '#show-recents-btn',
};

function onRecipeLinkClick(e) {
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

function onViewBtnClick() {
  //
  alert(getKey(KeyNames.RECENT));
}

export function init() {
  document.querySelector(Selectors.RECENTLY_VIEWED_BTN).addEventListener('click', onViewBtnClick);
  // event delegation: record all recipe link clicks
  document.querySelector(Selectors.RECIPE_LIST).addEventListener('click', onRecipeLinkClick);
}
