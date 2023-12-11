import { init as initRecentlyViewed } from './libs/recentlyViewed.js';
import { init as initSearchBox } from './libs/searchBox.js';
import { init as initViewBtns } from './libs/viewPicker.js';
import { KeyNames, getKey } from './libs/preferences.js';

function run() {
  const view = getKey(KeyNames.VIEW, 'content');
  const search = getKey(KeyNames.SEARCH, '');

  initSearchBox(search);
  initViewBtns(view);
  initRecentlyViewed();
}

run();
