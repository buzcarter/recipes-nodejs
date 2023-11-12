import { KeyNames, updateKey } from './preferences.js';

const ViewTypes = Object.freeze([
  'content',
  'compact-list',
  'grid',
]);

const Selectors = {
  RADIO_BTN: '.js-view-radio-btn',
};

function setView(view) {
  ViewTypes.forEach((name) => document.body.classList.remove(`view--${name}`));
  document.body.classList.add(`view--${view}`);
}

function onClick() {
  const { view } = this.dataset;
  updateKey(KeyNames.VIEW, view);
  setView(view);
}

export function init(initialIndexView) {
  document.querySelectorAll(Selectors.RADIO_BTN)
    .forEach((item) => item.addEventListener('click', onClick));
  setView(initialIndexView);
}
