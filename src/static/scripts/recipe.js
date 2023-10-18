/* global document, window */
(() => {
  /* eslint-disable key-spacing */
  const Styles = Object.freeze({
    ACTIVATED: 'activated',
    COMPLETE:  'complete',
    HIGHLIGHT: 'highlight',
  });

  const Selectors = {
    HIGHLIGHTABLE:    '.js-highlighter',
    STEPS_SECTION:    '#section-steps',
  };

  const KeyCodes = {
    LEFT:   37,
    RIGHT:  39,
  };
  /* eslint-enable key-spacing */

  const DBL_CLICK_SPEED = 460;

  let clickTimer;
  let isDoubleClick = false;

  function onKeyDown(e) {
    const { HIGHLIGHT: HIGLIGHT } = Styles;
    const curr = document.querySelector(`${Selectors.STEPS_SECTION} .${HIGLIGHT}`);
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
  }

  function onClick(e) {
    const li = e.target.closest('li');
    if (!li) {
      return;
    }

    li.classList.add(Styles.ACTIVATED);
    clickTimer = setTimeout(() => {
      if (!isDoubleClick) {
        const { HIGHLIGHT } = Styles;
        if (li.classList.contains(HIGHLIGHT)) {
          li.classList.remove(HIGHLIGHT);
        } else {
          document.querySelector(`.${HIGHLIGHT}`)?.classList.remove(HIGHLIGHT);
          li.classList.add(HIGHLIGHT);
        }
      }

      isDoubleClick = false;
      li.classList.remove(Styles.ACTIVATED);
    }, DBL_CLICK_SPEED);
  }

  function onDoubleClick(e) {
    const li = e.target.closest('li');
    if (!li) {
      return;
    }

    clearTimeout(clickTimer);
    isDoubleClick = true;
    li.classList.toggle(Styles.COMPLETE);
    li.classList.remove(Styles.ACTIVATED);

    // don't want to accidentally select the tapped text
    // (I know this might interfer with some legit actions/lookups)
    const selection = window.getSelection();
    if (selection && (selection.anchorNode.parentElement === li || selection.anchorNode.parentElement.closest('li') === li)) {
      selection.removeAllRanges();
    }
  }

  function init() {
    document.querySelectorAll(Selectors.HIGHLIGHTABLE)
      .forEach((item) => {
        // click an item to highlight it
        item.addEventListener('click', onClick);
        // double-click an item to mark it as "complete" (or "used" for ingredients)
        item.addEventListener('dblclick', onDoubleClick);
      });

    // L/R arrow keys shift the step highlight
    document.addEventListener('keydown', onKeyDown);
  }

  init();
})();
