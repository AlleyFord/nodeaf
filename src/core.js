module.exports = class Core {
  apply(opts) {
    if (!opts) return;

    for (const [k, v] of Object.entries(opts)) {
      if (this.hasOwnProperty(k) || typeof this[k] === 'function') {
        this[k] = v;
      }
    }
  }
}
