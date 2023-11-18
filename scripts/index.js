import { init as initViewBtns } from './libs/viewPicker.js';
import { init as initSearchBox } from './libs/searchBox.js';
import { KeyNames, getKey } from './libs/preferences.js';

function run() {
  const view = getKey(KeyNames.VIEW, 'content');
  const search = getKey(KeyNames.SEARCH, '');

  initSearchBox(search);
  initViewBtns(view);
}

run();
