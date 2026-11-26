import { KeyNames, getKey, updateMRUList } from './preferences.js';
import { fileNameToTitleCase } from '../../../libs/utils.js';

const MAX_LIST_LENGTH = 50;

/* eslint-disable key-spacing */
const Selectors = {
  RECIPE_LIST:           '#recipe-list',

  RECENTLY_VIEWED_BTN:   '#show-recents-btn',

  MODAL:                 '#show-recents-modal',
  MODAL_CONTENT:         '#show-recents-content',
  MODAL_CLOST_BTN:       '#show-recents-close-btn',
};
/* eslint-enable key-spacing */

const Styles = {
  MODAL_ACTIVE: 'modal--is-active',
};

/** Display name for a recipe's file name; the same text the index page shows. */
export const toDisplay = fileNameToTitleCase;

/** Recipe name from a link's `href` (`foo%20bar.html` → `foo bar`). */
function hrefToName(href) {
  const encoded = href.replace(/^.*\/|\.html$/g, '');
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

function onRecipeLinkClick(e) {
  const anchor = e.target.tagName === 'A'
    ? e.target
    : e.target.closest('a');

  if (anchor) {
    const value = anchor.getAttribute('href');
    if (value) {
      updateMRUList(KeyNames.RECENT, MAX_LIST_LENGTH, hrefToName(value));
    }
  }
}

function toggleModal(isActive) {
  const modal = document.querySelector(Selectors.MODAL);
  modal.classList.toggle(Styles.MODAL_ACTIVE, isActive);
  modal.setAttribute('aria-hidden', !isActive);
}

/** One recents-list entry; built with DOM nodes, since `name` comes from localStorage. */
function createListItem(name) {
  const link = document.createElement('a');
  link.href = `${encodeURIComponent(name)}.html`;
  link.textContent = toDisplay(name);
  const item = document.createElement('li');
  item.append(link);
  return item;
}

function onViewBtnClick() {
  toggleModal(true);
  document.querySelector(Selectors.MODAL_CONTENT)
    .replaceChildren(...getKey(KeyNames.RECENT, []).map(createListItem));
}

export function init() {
  document.querySelector(Selectors.RECENTLY_VIEWED_BTN).addEventListener('click', onViewBtnClick);
  // event delegation: record all recipe link clicks
  document.querySelector(Selectors.RECIPE_LIST).addEventListener('click', onRecipeLinkClick);
  document.querySelector(Selectors.MODAL_CLOST_BTN).addEventListener('click', () => toggleModal(false));
}
