import { KeyNames, getKey, updateMRUList } from './preferences.js';
import { fileNameToTitleCase } from '../../../libs/utils.js';

const MAX_LIST_LENGTH = 50;

/* eslint-disable key-spacing */
const Selectors = {
  RECIPE_LIST:           '#recipe-list',

  RECENTLY_VIEWED_BTN:   '#show-recents-btn',

  MODAL:                 '#show-recents-modal',
  MODAL_CONTENT:         '#show-recents-content',
  MODAL_CLOSE_BTN:       '#show-recents-close-btn',
};
/* eslint-enable key-spacing */

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

/** One recents-list entry; built with DOM nodes, since `name` comes from localStorage. */
function createListItem(name) {
  const link = document.createElement('a');
  link.href = `${encodeURIComponent(name)}.html`;
  link.textContent = toDisplay(name);
  const item = document.createElement('li');
  item.append(link);
  return item;
}

/**
 * Opens the "Recently Visited" dialog. A native `<dialog>` opened with `showModal()` traps focus,
 * closes on Escape, and returns focus to the button afterward.
 */
function openModal() {
  document.querySelector(Selectors.MODAL_CONTENT)
    .replaceChildren(...getKey(KeyNames.RECENT, []).map(createListItem));
  document.querySelector(Selectors.MODAL).showModal();
  document.querySelector(Selectors.RECENTLY_VIEWED_BTN).setAttribute('aria-expanded', 'true');
}

export function init() {
  const modal = document.querySelector(Selectors.MODAL);
  const openBtn = document.querySelector(Selectors.RECENTLY_VIEWED_BTN);

  openBtn.addEventListener('click', openModal);
  document.querySelector(Selectors.MODAL_CLOSE_BTN).addEventListener('click', () => modal.close());
  // a click on the backdrop lands on the <dialog> itself (its contents are inside `.modal__inner`)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.close();
    }
  });
  // however it closed (button, Escape, backdrop)
  modal.addEventListener('close', () => openBtn.setAttribute('aria-expanded', 'false'));

  // event delegation: record all recipe link clicks
  document.querySelector(Selectors.RECIPE_LIST).addEventListener('click', onRecipeLinkClick);
}
