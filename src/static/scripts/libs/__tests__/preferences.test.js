import {
  KeyNames,
  updateKey,
  getKey,
  updateMRUList,
} from '../preferences';

describe('preferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('updateKey', () => {
    it('should update the value of a key in the app data', () => {
      const key = KeyNames.RECENT;
      const value = ['recipe1', 'recipe2'];

      updateKey(key, value);

      const updatedValue = getKey(key);
      expect(updatedValue).toEqual(value);
    });
  });

  describe('getKey', () => {
    it('should return the default value when `key` has not been set', () => {
      const key = KeyNames.SEARCH;
      const defaultValue = 'default';

      const value = getKey(key, defaultValue);
      expect(value).toEqual(defaultValue);
    });

    it('should return the default value if the key does not exist', () => {
      const key = 'nonExistentKey';
      const defaultValue = 'default';

      const value = getKey(key, defaultValue);
      expect(value).toEqual(defaultValue);
    });
  });

  describe('updateMRUList', () => {
    it('should add a value to the MRU list', () => {
      const key = KeyNames.RECENT;
      const maxLength = 3;
      const value = 'recipe1';

      updateMRUList(key, maxLength, value);

      const updatedList = getKey(key);
      expect(updatedList).toEqual([value]);
    });

    it('should place new values at top of the MRU list', () => {
      const key = KeyNames.RECENT;
      const maxLength = 3;
      const value1 = 'recipe1';
      const value2 = 'recipe2';

      updateMRUList(key, maxLength, value1);
      updateMRUList(key, maxLength, value2);

      const updatedList = getKey(key);
      expect(updatedList).toEqual([value2, value1]);
    });

    it('should move an existing value to the top of the MRU list', () => {
      const key = KeyNames.RECENT;
      const maxLength = 3;
      const value1 = 'recipe1';
      const value2 = 'recipe2';

      updateMRUList(key, maxLength, value1);
      updateMRUList(key, maxLength, value2);
      updateMRUList(key, maxLength, value1);

      const updatedList = getKey(key);
      expect(updatedList).toEqual([value1, value2]);
    });

    it('should discard the last item if the MRU list exceeds the max length', () => {
      const key = KeyNames.RECENT;
      const maxLength = 2;
      const value1 = 'recipe1';
      const value2 = 'recipe2';
      const value3 = 'recipe3';

      updateMRUList(key, maxLength, value1);
      updateMRUList(key, maxLength, value2);
      updateMRUList(key, maxLength, value3);

      const updatedList = getKey(key);
      expect(updatedList).toEqual([value3, value2]);
    });
  });
});
