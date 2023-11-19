import KeyMgr from './KeyMgr';
import Ledger from './Ledger';

const SystemLists = {
  MARKED: 1,
  RECENT: 2,
  MADE: 3,
};

export const store = {
  version: '2.3.0',
  lastListId: 100,
  keys: new KeyMgr(),
  lists: [
    new Ledger(SystemLists.MARKED, 'Marked', true),
    new Ledger(SystemLists.RECENT, 'Recent', true),
    new Ledger(SystemLists.MADE, 'Made', true),
  ],
};

// listId, key, content
store.add('Recent', 'my-first-name-is-pickles');
store.getAll('Recent');

store.add('Favorites', 'my-first-name-is-pickles');
store.remove('Favorites', 'my-first-name-is-pickles');
store.includes('Favorites', 'my-first-name-is-pickles');

store.add('Made', 'tamale-pie', 'tasted bland, add...', '11/24');
store.get('Made', 'tamale-pie');
