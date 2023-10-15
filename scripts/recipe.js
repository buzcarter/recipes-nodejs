/* global document */
(() => {
  /* eslint-disable key-spacing */
  const Styles = Object.freeze({
    HIGHLIGHT: 'step--highlight',
    USED:      'ingredient--used',
  });

  const Selectors = {
    INGREDIENT_ITEMS: '#section-ingredients li',
    STEP_ITEMS:       '#section-steps li',
  };

  const KeyCodes = {
    LEFT:   37,
    RIGHT:  39,
  };
  /* eslint-enable key-spacing */

  function onKeyDown(e) {
    const { HIGHLIGHT: HIGLIGHT } = Styles;
    const curr = document.querySelector(`.${HIGLIGHT}`);
    if (!curr) {
      return;
    }

    switch (e.which) {
      case KeyCodes.LEFT:
        curr.classList.remove(HIGLIGHT);
        curr.previousElementSibling?.classList.add(HIGLIGHT);
        break;
      case KeyCodes.RIGHT:
        curr.classList.remove(HIGLIGHT);
        curr.nextElementSibling?.classList.add(HIGLIGHT);
        break;
    }

    // ignore normal L/R behavior
    // (probably don't want to do this, since
    // we want to use L/R for the back button, etc)
    // e.preventDefault();
  }

  function onStepClick() {
    const { HIGHLIGHT } = Styles;
    if (this.classList.contains(HIGHLIGHT)) {
      this.classList.remove(HIGHLIGHT);
    } else {
      document.querySelector(`.${HIGHLIGHT}`)?.classList.remove(HIGHLIGHT);
      this.classList.add(HIGHLIGHT);
    }
  }

  function onIngredientClick() {
    this.classList.toggle(Styles.USED);
  }

  function init() {
    // click a step to highlight it
    document.querySelectorAll(Selectors.STEP_ITEMS).forEach(step => step.addEventListener('click', onStepClick));
    // L/R arrow keys shift the step highlight
    document.addEventListener('keydown', onKeyDown);
    // click an ingredient to mark it as "used"
    document.querySelectorAll(Selectors.INGREDIENT_ITEMS).forEach(ingredient => ingredient.addEventListener('click', onIngredientClick));
  }

  init();
})();
