const { Ledger } = require('../Ledger');

describe('Ledger', () => {
  describe('set', () => {
    // const ledger = new Ledger();

    it('should manage keys (add, get, json)', () => {
      const list = new Ledger(1, 'First');
      list.add(48, 'pan flutes');
      list.add(97, 'steel pans');

      const expectedResults = {
        id: 1,
        name: 'First',
        locked: true,
        maxLength: null,
        items: [
          { id: 48, value: 'pan flutes' },
          { id: 97, value: 'steel pans' },
        ],
      };

      expect(list.json).toEqual(expectedResults);

      // list.get(97)
    });
  });
});
// keyMgr.set('taco-bell', 'run for the border');
// keyMgr.set('arhur-bryant', 'sliced white bread');
// keyMgr.set('wyndott-bbq', 'best fries');

// const maxId = data.reduce((acc, { id }) => (id > acc ? id : acc), -1);
// this.#items = maxId;

/*
{
    id: 9,
    value: 'fist-primer-glob',
  }
{
    id: SystemLists.,
    locked: true,
    name: '',
    items: [{ id: 9, date: '11/2018' }],
  }, {
    id: SystemLists.,
    locked: true,
    name: '',
    items: [],
  },
*/

// this.id = newId;
// this.name = newName;
// this.system = isSystem;
// this.maxLength = newMaxLength;
