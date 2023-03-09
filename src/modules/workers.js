const CoreMethods = require('../core.js');
const BQueue = require('better-queue');
const fs = require('fs');



class Worker {
  namespace;
  meta;

  friendlyNamespace;

  constructor(obj) {
    for (const [k, v] of Object.entries(obj)) {
      if (this.hasOwnProperty(k) || typeof this[k] === 'function') {
        this[k] = v;
      }
    }

    this.friendlyNamespace = this.namespace.replaceAll('/', '-');
  }

  // overload
  async process() { return true; }
  validate(ret) { return true; }
  processMessage() { return false; }
  debugMessage() { return false; }
}


module.exports = class Workers extends CoreMethods {
  cache;
  logging = false;
  logDir = false;
  workers = [];

  concurrent = 8;
  filo = true;


  constructor(opts) {
    super();
    this.apply(opts);
  }

  clear() {
    this.workers = [];
  }

  canLog() {
    return this.logging && this.logDir !== false;
  }

  enableLogging(path) {
    this.setLogDir(path);
  }
  setLogDir(path) {
    if (path) {
      this.logDir = path;
    }

    this.logging = true;
  }

  addWorker(obj) {
    this.workers.push(new Worker(obj));
  }

  process() {
    const q = new BQueue(async (worker, cb) => {
      const out = worker.processMessage() || '';

      let ret = [];

      if (!Array.isArray(worker.process)) {
        worker.process = [worker.process];
      }

      for (const proc of worker.process) {
        try {
          ret = await proc.call(worker);
        }
        catch(e) {
          cb(`${out}\nerror: ` + JSON.stringify(e));
        }
      }

      if (ret && worker.validate(ret)) {
        cb(null, out);
      }

      cb(`${out}\nerror: ` + JSON.stringify(ret));
    }, {
      concurrent: this.concurrent,
      filo: this.filo,
    });

    for (const worker of this.workers) {
      q.push(worker, (err, res) => {
        const stats = q.getStats();
        const complete = parseFloat(stats.total / stats.peak * 100).toFixed(3);

        const workerDebugMsg = worker.debugMessage() || '';
        const debug = `[${complete}%${workerDebugMsg ? ' ' + workerDebugMsg : ''}]`;

        if (err) {
          const errStr = `ERROR: ${debug} ${err}`;
          console.log(errStr);

          if (this.canLog()) {
            fs.appendFileSync(`${this.logDir}/${worker.friendlyNamespace}.txt`, `${errStr}\n`);
          }
        }
        else {
          console.log(`OK: ${debug} ${res}`);
        }
      });
    }
  }
}
