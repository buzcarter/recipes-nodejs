/* global document */
(() => {
  const ViewTypes = Object.freeze([
    'content',
    'compact-list',
    'grid',
  ]);

  const Selectors = {
    RADIO_BTN: '.js-view-radio-btn',
  };

  function onClick() {
    const { view } = this.dataset;
    ViewTypes.forEach(name => document.body.classList.remove(`view--${name}`));
    document.body.classList.add(`view--${view}`);
  }

  function init() {
    document.querySelectorAll(Selectors.RADIO_BTN)
      .forEach(item => item.addEventListener('click', onClick));
  }

  init();
})();
