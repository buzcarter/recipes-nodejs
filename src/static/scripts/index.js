/* global document, window */
(() => {
  const ViewTypes = Object.freeze([
    'content',
    'compact-list',
    'grid',
  ]);

  const Selectors = {
    RADIO_BTN: '.js-view-radio-btn',
  };

  function setView(view) {
    ViewTypes.forEach(name => document.body.classList.remove(`view--${name}`));
    document.body.classList.add(`view--${view}`);
  }

  function onClick() {
    setView(this.dataset.view);
  }

  function init(initialIndexView) {
    document.querySelectorAll(Selectors.RADIO_BTN)
      .forEach(item => item.addEventListener('click', onClick));
    setView(initialIndexView);
  }

  window.recipeIndex = Object.assign(window.recipeIndex || {}, {
    init,
  });
})();
