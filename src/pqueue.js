class PQ {
  #queue = [];

  add(func) {
    this.#queue.push(func);
  }

  async run() {
    for (const fn of this.#queue) {
      await fn();
    }
  }
}


export default PQ;
