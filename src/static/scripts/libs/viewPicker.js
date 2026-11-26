import { KeyNames, updateKey } from './preferences.js';

/** Index layouts; keep in sync with `IndexViews` in `src/buildRecipeIndex.js`. */
const ViewTypes = Object.freeze([
  'content',
  'compact-list',
  'grid',
]);

const Selectors = {
  RADIO_BTN: '.js-view-radio-btn',
};

function setView(view) {
  ViewTypes.forEach((name) => document.body.classList.toggle(`view--${name}`, name === view));
  document.querySelectorAll(Selectors.RADIO_BTN)
    .forEach((btn) => btn.setAttribute('aria-checked', String(btn.dataset.view === view)));
}

function onClick(e) {
  const { view } = e.currentTarget.dataset;
  updateKey(KeyNames.VIEW, view);
  setView(view);
}

/**
 * Wires up the layout buttons.
 * @param {string} initialIndexView layout to start with
 */
export function init(initialIndexView) {
  document.querySelectorAll(Selectors.RADIO_BTN)
    .forEach((item) => item.addEventListener('click', onClick));
  setView(ViewTypes.includes(initialIndexView) ? initialIndexView : ViewTypes[0]);
}
