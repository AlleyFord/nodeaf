const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { readFileSync, existsSync } = require('fs');
const { parse } = require('csv/sync');
const csv_read = parse;
const csv_write = createCsvWriter;



module.exports = class CSV {
  #fpath = false;
  #data = [];
  #header = [];


  constructor(fpath) {
    return this.setPath(fpath);
  }

  error(error) {
    throw error;
    return false;
  }


  setPath(fpath) {
    if (!fpath) return this.error(`path is blank: "${fpath}"`);

    this.#fpath = fpath;
    return this;
  }


  read(opts) {
    if (!this.#fpath || !existsSync(this.#fpath)) return this.error(`path does not exist: ${this.#fpath}`);

    let defaults = {columns: true, group_columns_by_name: true, delimiter: ','};

    if (!opts) opts = {};
    opts = {...defaults, ...opts};

    // clean args
    if (opts.hasOwnProperty('columns') && opts.columns === false) opts.group_columns_by_name = false;

    return csv_read(readFileSync(this.#fpath, 'utf8'), opts);
  }


  setData(data) {
    this.#data = data;

    return this;
  }

  setHeaders(arr) {
    arr.forEach((k, i) => {
      this.#header.push({
        id: k, title: k
      });
    });
  }

  async write(data) {
    if (!this.#fpath) return this.error(`path is blank: "${this.#fpath}"`);

    if (data) this.setData(data);

    let header = [];

    if (!this.#header.length) {
      const peek = Object.keys(this.#data[0]);

      peek.forEach((k, i) => {
        header.push({
          id: k, title: k
        });
      });
    }
    else {
      header = this.#header;
    }

    const w = csv_write({
      path: this.#fpath,
      header: header
    });

    await w.writeRecords(this.#data);

    return true;
  }
}
