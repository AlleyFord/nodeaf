const { existsSync, readFileSync } = require('fs');
const Core = require('./core.js');
const util = require('util');



module.exports = class NodeAF {
  #modules = new Map();

  OK = '✓';
  ERROR = '×';


  // core modules, load on demand
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


  // loads core modules
  #proto(key) {
    if (this.#modules.has(key)) return this.#modules.get(key);

    const fname = key.replace(/[^a-z]/gi, '');
    const fpath = `${__dirname}/modules/${fname}.js`;

    if (!existsSync(fpath)) return this.#error(`no module "${fname}" (at ${fpath})`);

    let cls = null;

    try {
      // this line is why this is commonjs and not es6.
      // there's no clean, native way to do a synchronous import
      cls = require(fpath);

      if (cls !== null) {
        const mod = new cls();

        this.#modules.set(key, mod);
        return mod;
      }
    }
    catch(e) {
      return this.#error(`module "${fname}" failed to load (at ${fpath}, error: ${e})`);
    }

    return this.#error(`module "${fname}" is null (at ${fpath})`);
  }

  #error(v) {
    console.log(`${this.ERROR} nodeaf: ${v}`);
    return null;
  }


  // extend your own
  extend(key, cls) {
    if (this.#modules.has(key)) {
      return this.#error(`module "${key}" has already been defined`);
    }

    try {
      // will apply Core functions to all extended classes
      util.inherits(cls, Core);
      const mod = new cls();

      this.#modules.set(key, mod);

      // allows for nodeaf.key.syntax
      Object.defineProperty(this, key, {
        get: _ => {
          return this.#modules.get(key);
        }
      });

      return mod;
    }
    catch(e) {
      return this.#error(`module "${key}" failed to load (error: ${e})`);
    }
  }
}
