const StorageKeys = {
  APP_NAME: 'RecipeNodeJs',
};

export const KeyNames = Object.freeze({
  /** most recently viewed recipe list */
  RECENT: 'recent',
  /** last search term */
  SEARCH: 'search',
  /** most recently selected view/layout */
  VIEW: 'view',
});

/** Storage keys that were renamed: old name → current name. */
/** @type {Readonly<Record<string, string>>} */
const RenamedKeys = Object.freeze({
  content: KeyNames.VIEW,
});

/** @param {Record<string, unknown>} payload */
const setAppData = (payload) => localStorage.setItem(StorageKeys.APP_NAME, JSON.stringify(payload));

/**
 * Everything this site keeps in localStorage, as one object.
 * @returns {Record<string, unknown>}
 */
export function getAppData() {
  const stored = localStorage.getItem(StorageKeys.APP_NAME);
  /** @type {Record<string, unknown> | null} */
  let payload = stored ? JSON.parse(stored) : null;

  if (!payload) {
    payload = {};
    setAppData(payload);
  }

  // carry values saved under an old key name over to the new one
  const renamed = Object.keys(RenamedKeys).filter((oldKey) => oldKey in payload);
  if (renamed.length) {
    renamed.forEach((oldKey) => {
      payload[RenamedKeys[oldKey]] ??= payload[oldKey];
      delete payload[oldKey];
    });
    setAppData(payload);
  }

  return payload;
}

export const updateKey = (key, value) => {
  const payload = getAppData();
  payload[key] = value;
  setAppData(payload);
};

export const getKey = (key, defaultValue) => {
  const payload = getAppData();
  const value = payload[key];
  return value === undefined ? defaultValue : value;
};

/**
 * Add `value` in first position of list named `key`. When list length
 * exceeds `maxLength` last item is discarded.
 */
export const updateMRUList = (key, maxLength, value) => {
  let list = getKey(key, []);
  const index = list.indexOf(value);
  if (index === 0) {
    return;
  }

  if (index > -1) {
    list.splice(index, 1);
  }

  list.unshift(value);

  if (list.length > maxLength) {
    list = list.slice(0, maxLength);
  }

  updateKey(key, list);
};
