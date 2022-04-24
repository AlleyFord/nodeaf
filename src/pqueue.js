class PQueue {
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


export { PQueue };
