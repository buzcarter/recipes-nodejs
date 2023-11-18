export class Ledger {
  constructor(id, name, newMaxLength = null) {
    this.json = {
      id,
      locked: id < 100,
      name,
      newMaxLength,
    };
  }

  #id = null;

  #name = null;

  #items = [];

  #maxLength = null;

  #locked = false;

  add(id, date) {
    const item = this.find(id);
    // this.maxLength
    if (!item) {
      this.#items.push({ id, date });
    } else {
      item.date = date;
    }
    return this.#items.length; // index? yah
  }

  find(id) {
    return null;
  }

  remove(id) {
    const item = this.find(id);
  }

  get json() {
    return {
      id: this.#id,
      locked: this.#locked,
      name: this.#name,
      items: [{ id: 9, date: '11/2018' }],
    };
  }

  set json(data = {}) {
  }

  toString() {
    return JSON.stringify(this.json);
  }
}

export default Ledger;
