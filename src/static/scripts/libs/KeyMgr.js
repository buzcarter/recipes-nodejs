export class KeyMgr {
  constructor(data) {
    if (Array.isArray(data)) {
      this.json = data;
    }
  }

  #lastId = -1;

  /**
   * @@type {[( id: number, value: string )]}
   */
  #items = [];

  add(key) {
    const id = this.get(key);
    if (id) {
      return id;
    }
    this.#items.push({
      id: ++this.#lastId,
      value: key,
    });
    return this.#lastId;
  }

  get(key) {
    return this.#items.find(({ value }) => value === key)?.id || null;
  }

  get json() {
    return this.#items;
  }

  set json(data = []) {
    this.#lastId = -1;
    this.#items = [];

    data.forEach((item) => {
      this.#lastId = item.id > this.#lastId ? item.id : this.#lastId;
      this.#items.push(item);
    });
  }
}

export default KeyMgr;
