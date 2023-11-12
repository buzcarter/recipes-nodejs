const StorageKeys = {
  APP_NAME: 'RecipeNodeJs',
};

export const KeyNames = Object.freeze({
  VIEW: 'content',
  SEARCH: 'search',
});

const setAppData = (payload) => localStorage.setItem(StorageKeys.APP_NAME, JSON.stringify(payload));

export function getAppData() {
  let payload = localStorage.getItem(StorageKeys.APP_NAME);
  payload = payload && JSON.parse(payload);

  if (!payload) {
    payload = {

    };
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
