import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { Cache as C } from './cache.js';



class API {
  version;
  last_run = 0;
  delay = 600;
  simplify_return = true;
  cursor = [];

  cache = null;

  constructor(opts) {
    this.last_run = new Date().getTime();

    if (opts && opts.cache) {
      this.enableCache(opts.cache_dir);
    }
  }

  _resetCursor() {
    this.cursor = {
      page: null, // unused ATM
      next: null,
      previous: null,
    };
  }

  enableCache(dir) {
    this.cache = new C(dir || `${process.env.__out}/cache`);
  }
  disableCache() {
    this.cache = null;
  }

  hasNext() {
    return this.cursor.next !== null;
  }

  hasPrevious() {
    return this.cursor.previous !== null;
  }
  hasPrev() {
    return this.hasPrevious();
  }

  next() {
    if (!this.hasNext()) return false;

    return this._request('get', null, null, new URL(this.cursor.next));
  }

  previous() {
    if (!this.hasPrevious()) return false;

    return this._request('get', null, null, new URL(this.cursor.previous));
  }
  prev() {
    return this.previous();
  }

  _request(method, path, opts, directURI) {
    this._resetCursor();

    let URI = (path === null && opts === null) ? directURI : this._buildURI(path);

    if (typeof this._optsHook === 'function') opts = this._optsHook(opts);

    let headers = (typeof this._buildHeaders === 'function') ? this._buildHeaders() : {};

    let request = {
      headers: headers,
      method: method,
    };

    if (opts) {
      if (method === 'get') {
        Object.keys(opts).forEach(key => URI.searchParams.append(key, opts[key]));
      }
      else if (['post', 'put'].includes(method)) {
        let isURLEncoded = false;

        Object.keys(request.headers).forEach(key => {
          if (key.toLowerCase() === 'content-type' && /x\-www\-form/.test(request.headers[key])) {
            isURLEncoded = true;
          }
        });

        let enc_opts = {};

        Object.keys(opts).forEach(key => {
          if (opts[key] === Object(opts[key])) {
            enc_opts[key] = JSON.stringify(opts[key]);
          }
          else {
            enc_opts[key] = opts[key];
          }
        });

        request.body = (isURLEncoded) ? new URLSearchParams(enc_opts) : JSON.stringify(opts);
      }
    }


    // cache hit before trying live
    // EXPERIMENTAL RIGHT NOW. only works on shit where you don't need header inspection (non-paged API calls)
    const hashkey = this.cache.createKey(JSON.stringify(URI) + JSON.stringify(request));

    if (this.cache) {
      let cachehit = this.cache.get(hashkey);

      if (cachehit) {
        return new Promise((resolve, reject) => {
          resolve(JSON.parse(cachehit));
        });
      }
    }

    return new Promise((resolve, reject) => {
      let t = 0;

      // this ensures we don't beat up the api
      do {
        t = new Date().getTime();
      } while (t - this.last_run < this.delay * (Math.random() + 1));

      resolve();
    })
    .then(() => {
      //console.log(URI, request);

      return fetch(URI, request)
        .then(res => {
          let is_json_return = true;

          if (typeof res.headers !== 'undefined') {
            const link = res.headers.get('link');

            if (link) {
              for (const direction of ['next', 'previous']) {
                const m = link.match(new RegExp(`<(?<url>[^>]+)>;\\s+?rel="?(?<dir>${direction})"?`, 'i'));

                if (m && m.groups && m.groups.dir && m.groups.url) {
                  this.cursor[m.groups.dir] = m.groups.url;
                }
              }
            }

            const type = res.headers.get('content-type');

            if (type && type.match(/(json|javascript)/) === null) {
              is_json_return = false;
            }
          }

          if (typeof this._responseHook === 'function') {
            this._responseHook(res);
          }

          return is_json_return ? res.json() : res.text();
        })
        .then(ret => {
          const jk = Object.keys(ret);

          this.last_run = new Date().getTime();

          const finishedData = (this.simplify_return && jk.length)
            ? ret[jk[0]]
            : ret;

          if (this.cache) {
            this.cache.set(hashkey, JSON.stringify(finishedData));
          }

          return finishedData;
      });
    });
  }

  get(path, opts) {
    return this._request('get', path, opts);
  }

  post(path, opts) {
    return this._request('post', path, opts);
  }

  put(path, opts) {
    return this._request('put', path, opts);
  }
}



export default API;
