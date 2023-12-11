import { KeyNames, getKey, updateMRUList } from './preferences.js';

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

const toDisplay = (value) => value
  .replace(/-/g, ' ')
  .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

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

function toggleModal(isActive) {
  const modal = document.querySelector(Selectors.MODAL);
  modal.classList.toggle(Styles.MODAL_ACTIVE, isActive);
  modal.setAttribute('aria-hidden', !isActive);
}

function onViewBtnClick() {
  toggleModal(true);
  document.querySelector(Selectors.MODAL_CONTENT).innerHTML = getKey(KeyNames.RECENT)
    .map((value) => `<li><a href="${value}.html">${toDisplay(value)}</a></li>`)
    .join('');
}

export function init() {
  document.querySelector(Selectors.RECENTLY_VIEWED_BTN).addEventListener('click', onViewBtnClick);
  // event delegation: record all recipe link clicks
  document.querySelector(Selectors.RECIPE_LIST).addEventListener('click', onRecipeLinkClick);
  document.querySelector(Selectors.MODAL_CLOST_BTN).addEventListener('click', () => toggleModal(false));
}
