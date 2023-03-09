module.exports = class CoreMethods {
  apply(opts) {
    if (!opts) return;
    for (const [k, v] of Object.entries(opts)) {
      if (this.hasOwnProperty(k)) {
        this[k] = v;
      }
    }
  }
}
