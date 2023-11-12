import { init as initViewBtns } from './viewPicker.js';
import { init as initSearchBox } from './searchBox.js';
import { KeyNames, getKey } from './preferences.js';

function run() {
  const view = getKey(KeyNames.VIEW, 'content');
  const search = getKey(KeyNames.SEARCH, '');

  initSearchBox(search);
  initViewBtns(view);
}

run();
