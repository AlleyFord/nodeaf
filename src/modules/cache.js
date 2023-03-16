const Core = require('../core.js');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { createHash } = require('crypto');



module.exports = class Cache extends Core {
  path;

  constructor(path) {
    super();
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

  exists(key) {
    return existsSync(this.buildPath(key));
  }
  has(key) {
    return this.exists(key);
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
