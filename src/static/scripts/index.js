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

(() => {
  const Styles = {
    HIDDEN: 'recipe-list__item--hidden',
  };

  const Selectors = {
    RECIPE_ITEMS: '.recipe-list li',
    SEARCH: '#filter'
  };

  const scrub = value => value
    .trim()
    .toLowerCase()
    .replace(/\W/g, '')
    .replace(/\s+/g, ' ');

  function filter(filterText) {
    const words = filterText.split(/\s+/).map(w => scrub(w)).filter(Boolean);

    document.querySelectorAll(Selectors.RECIPE_ITEMS)
      .forEach((item) => {
        if (!filterText) {
          item.classList.remove(Styles.HIDDEN);
        }
        const { searchText } = item.dataset || '';
        const isMatch = words.reduce((isMatch, word) => isMatch && searchText.includes(word), true);
        item.classList.toggle(Styles.HIDDEN, !isMatch);
      });
  }

  function init() {
    document.querySelectorAll(Selectors.RECIPE_ITEMS).forEach(item => item.dataset.searchText = scrub(item.innerText));
    document.querySelector(Selectors.SEARCH).addEventListener('keyup', function () {
      filter(this.value);
    });
  }

  init();
})();
