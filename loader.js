const { existsSync } = require('fs');



class NodeAF {
  #modules = new Map();

  OK = '✓';
  ERROR = '×';


  get std() {
    return this.#proto('std');
  }
  get cache() {
    return this.#proto('cache');
  }
  get workers() {
    return this.#proto('workers');
  }
  get queue() {
    return this.workers;
  }

  #proto(key) {
    if (this.#modules.has(key)) return this.#modules.get(key);

    const fname = key.replace(/[^a-z]/gi, '');
    const fpath = `./src/modules/${fname}.js`;

    if (!existsSync(fpath)) return this.#error(`no module "${fname}" (at ${fpath})`);

    let cls = null;

    try {
      cls = require(fpath);
    }
    catch (e) {
      return this.#error(`module "${fname}" failed to load (at ${fpath}, error: ${e})`);
    }

    if (cls !== null) {
      const mod = new cls();

      this.#modules.set(key, mod);
      return mod;
    }

    return this.#error(`module "${fname}" is null (at ${fpath})`);
  }

  #error (v) {
    console.log(this.ERROR + ' ' + v);
    return null;
  }
}


module.exports = new NodeAF();
