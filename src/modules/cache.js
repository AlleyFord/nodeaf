const { readFileSync, writeFileSync, existsSync } = require('fs');
const { createHash } = require('crypto');



module.exports = class Cache {
  path;

  constructor(path) {
    this.setPath(path);
  }

  setPath(path) {
    this.path = path || './';
  }

  createKey(str, prefix) {
    return (prefix || '') + createHash('sha256').update(str).digest('hex');
  }

  buildPath(key) {
    return `${this.path}/${key}`;
  }

  has(key) {
    return this.exists(key);
  }
  exists(key) {
    return existsSync(this.buildPath(key));
  }

  get(key) {
    if (this.exists(key)) {
      return readFileSync(this.buildPath(key), 'utf8');
    }

    return null;
  }

  set(key, content) {
    writeFileSync(this.buildPath(key), content);

    return true;
  }
}
