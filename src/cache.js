import { readFileSync, writeFileSync, existsSync } from 'fs';
const { createHash } = await import('crypto');



class Cache {
  path;

  constructor(dir) {
    this.path = dir || './';
  }

  createKey(str) {
    return createHash('sha256').update(str).digest('hex');
  }

  buildPath(key) {
    return `${this.path}/${key}`;
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



export default Cache;
