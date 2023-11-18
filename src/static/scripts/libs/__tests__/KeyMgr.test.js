const { KeyMgr } = require('../KeyMgr');

describe('KeyMgr', () => {
  describe('set', () => {
    const keyMgr = new KeyMgr();

    it('should manage keys (add, get, json)', () => {
      let id;

      id = keyMgr.add('taco-bell');
      expect(id).toBe(0);

      id = keyMgr.add('arthur-bryant');
      expect(id).toBe(1);

      id = keyMgr.add('wyndott-bbq');
      expect(id).toBe(2);

      const expectedValue = [{
        id: 0,
        value: 'taco-bell',
      }, {
        id: 1,
        value: 'arthur-bryant',
      }, {
        id: 2,
        value: 'wyndott-bbq',
      }];

      const result = keyMgr.json;

      expect(result).toEqual(expectedValue);

      expect(keyMgr.get('arthur-bryant')).toBe(1);
      expect(keyMgr.get('you-say-tomato')).toBe(null);
    });
  });
});
