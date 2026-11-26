/*
 * Recipe page: tap an ingredient or step to highlight it, double-tap to mark it done, and use the
 * ← / → keys to move the highlight through the steps.
 *
 * A classic script (not a module) on purpose, so pages still work when opened straight from disk
 * (`file://`), where browsers block module scripts.
 */
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
  /* eslint-enable key-spacing */

  /** How long to wait for a second tap before treating a tap as a single one. */
  const DBL_CLICK_SPEED = 460;

  /** Pending single-tap actions, per item, so quick taps on different items don't collide. */
  const pendingClicks = new Map();

  function cancelPendingClick(li) {
    clearTimeout(pendingClicks.get(li));
    pendingClicks.delete(li);
  }

  /** Highlights `li` (only one per section), or un-highlights it if it already was. */
  function toggleHighlight(li) {
    const { HIGHLIGHT } = Styles;
    if (!li.classList.contains(HIGHLIGHT)) {
      li.closest(Selectors.HIGHLIGHTABLE)
        .querySelector(`.${HIGHLIGHT}`)?.classList.remove(HIGHLIGHT);
    }
    li.classList.toggle(HIGHLIGHT);
  }

  const isTyping = (target) => target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

  function onKeyDown(e) {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || isTyping(e.target)) {
      return;
    }

    // every step in order, even across sub-lists (`### …` subheadings start a new list)
    const steps = [...document.querySelectorAll(`${Selectors.STEPS_SECTION} li`)];
    const index = steps.findIndex((li) => li.classList.contains(Styles.HIGHLIGHT));
    const next = steps[index + step];
    if (index < 0 || !next) {
      return;
    }

    e.preventDefault();
    steps[index].classList.remove(Styles.HIGHLIGHT);
    next.classList.add(Styles.HIGHLIGHT);
    next.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function onClick(e) {
    const li = e.target.closest('li');
    if (!li) {
      return;
    }

    cancelPendingClick(li);
    // the second click of a double-click: `onDoubleClick` handles it
    if (e.detail > 1) {
      return;
    }

    li.classList.add(Styles.ACTIVATED);
    pendingClicks.set(li, setTimeout(() => {
      pendingClicks.delete(li);
      li.classList.remove(Styles.ACTIVATED);
      toggleHighlight(li);
    }, DBL_CLICK_SPEED));
  }

  /** Clears a text selection made inside `li` (double-clicking selects a word). */
  function clearSelectionIn(li) {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    if (element && li.contains(element)) {
      selection.removeAllRanges();
    }
  }

  function onDoubleClick(e) {
    const li = e.target.closest('li');
    if (!li) {
      return;
    }

    cancelPendingClick(li);
    li.classList.remove(Styles.ACTIVATED);
    li.classList.toggle(Styles.COMPLETE);
    // don't leave the tapped word selected (this may interfere with some legit lookups)
    clearSelectionIn(li);
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
