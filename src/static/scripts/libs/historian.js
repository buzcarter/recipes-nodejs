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
