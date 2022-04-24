import { createObjectCsvWriter as csv_write } from 'csv-writer';
import { readFileSync, existsSync } from 'fs';
import { parse as csv_read } from 'csv/sync';



class CSV {
  #fpath = false;
  #data = [];


  constructor(fpath) {
    return this.setPath(fpath);
  }

  error(error) {
    throw error;
    return false;
  }


  setPath(fpath) {
    if (!fpath) return this.error(`Path is blank: "${fpath}"`);

    if (existsSync(fpath)) {
      this.#fpath = fpath;
      return this;
    }

    return this.error(`Path does not exist: "${fpath}"`);
  }


  read() {
    if (!this.#fpath || !existsSync(this.#fpath)) return this.error(`Path does not exist: ${this.#fpath}`);

    return csv_read(readFileSync(this.#fpath), {columns: true, group_columns_by_name: true});
  }


  setData(data) {
    this.#data = data;

    return this;
  }


  async write(data) {
    if (!this.#fpath || !existsSync(this.#fpath)) return this.error(`Path does not exist: ${this.#fpath}`);

    if (data) this.setData(data);

    const peek = Object.keys(this.#data[0]);
    let header = [];

    peek.forEach((k, i) => {
      header.push({
        id: k, title: k
      });
    });

    const w = csv_write({
      path: this.#fpath,
      header: header
    });

    await w.writeRecords(this.#data);

    return true;
  }
}



export default CSV;
