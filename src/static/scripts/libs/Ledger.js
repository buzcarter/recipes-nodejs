export class Ledger {
  constructor(id, name, newMaxLength = null) {
    this.json = {
      id,
      name,
      newMaxLength,
    };
  }

  #id = null;

  #name = null;

  #items = [];

  #maxLength = null;

  #locked = false;

  add(id, value) {
    const item = this.find(id);
    // this.maxLength
    if (!item) {
      this.#items.push({ id, value });
    } else {
      item.value = value;
    }
    return this.#items.length; // index? yah
  }

  find(id) {
    return this.#items.find((item) => item.id === id);
  }

  remove(id) {
    const item = this.find(id);
  }

  get json() {
    return {
      id: this.#id,
      items: this.#items, // [{ id: 9, value: '11/2018' }],
      locked: this.#locked,
      maxLength: this.#maxLength,
      name: this.#name,
    };
  }

  set json({ id, name, items = [], maxLength = null } = {}) {
    this.#id = id;
    this.#items = Array.isArray(items) ? items : [];
    this.#locked = id < 100;
    this.#maxLength = maxLength;
    this.#name = name;
  }

  toString() {
    return JSON.stringify(this.json);
  }
}

export default Ledger;
