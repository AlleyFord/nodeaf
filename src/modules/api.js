const fetch = require('node-fetch');
const { URLSearchParams } = require('url');



module.exports = class API {
  version;
  last_run = 0;
  delay = 600;
  simplify_return = true;
  cursor = [];

  status;

  debug = false;
  debugg = false;
  debuggg = false;

  MIME_JSON = 'application/json';
  MIME_URLENC = 'application/x-www-form-urlencoded';
  MIME_FORM = 'application/x-www-form-urlencoded';
  MIME_GRAPH = 'application/graphql';

  constructor(opts) {
    this.last_run = new Date().getTime();

    if (opts.debug) this.debug = opts.debug;
    if (opts.debugg) this.debugg = opts.debugg;
    if (opts.debuggg) this.debugg = opts.debuggg;

    this.resetCursor();
  }

  setDelay(v) {
    this.delay = parseInt(v);
  }

  resetCursor() {
    this.cursor = {
      page: null,
      next: null,
      previous: null,
    };
  }

  apply(keys, vars) {
    for (const k of keys) {
      if (this.hasOwnProperty(k) && vars.hasOwnProperty(k)) {
        this[k] = vars[k];
      }
    }
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
    return this.get(this.cursor.next);
  }
  previous() {
    if (!this.hasPrevious()) return false;
    return this.get(this.cursor.previous);
  }
  prev() {
    return this.previous();
  }


  buildURI(path) { // overload me
    return path;
  }
  buildHeaders() { // overload me
    return {};
  }
  optsHook(opts) { // overload me
    return opts;
  }
  responseHook(res) { // overload me
    return;
  }
  endHook(ret) { // overload me
    return;
  }


  graph(query) {
    this.resetCursor();

    if (typeof this.queryHookGraph === 'function') query = this.queryHookGraph(query);

    let headers = (typeof this.buildHeadersGraph === 'function') ? this.buildHeadersGraph() : {};

    if (query && query.headers) {
      headers = {...headers, ...query.headers};
      delete query.headers;
    }

    let request = {
      headers: headers,
      method: 'post',
      redirect: 'follow',
    };

    if (query) {
      if (query.hasOwnProperty('query')) {
        query.query = String(query.query).replace(/\n/g, '').trim();
      }

      request.body = JSON.stringify(query);
    }

    return new Promise((resolve, reject) => {
      let t = 0;

      // this ensures we don't beat up the api
      do {
        t = new Date().getTime();
      } while (t - this.last_run < this.delay * (Math.random() + 1));

      resolve();
    })
    .then(_ => {
      const URI = this.buildURIGraph();

      if (this.debug) console.log(URI, request, request.body);

      return fetch(URI, request)
        .then(res => {
          if (this.debugg) console.log("RESPONSE", res);

          this.status = res.status;

          if (typeof this.responseHookGraph === 'function') {
            this.responseHookGraph(res);
          }

          return res.json();
        })
        .then(ret => {
          if (this.debuggg) console.log("RETURNED RESPONSE", ret);

          const jk = Object.keys(ret);

          this.last_run = new Date().getTime();

          const finishedData = (this.simplify_return && jk.length)
            ? ret[jk[0]]
            : ret;

          return finishedData;
        });
    });
  }


  request(method, URI, opts) {
    this.resetCursor();

    if (typeof this.optsHook === 'function') opts = this.optsHook(opts);

    let headers = (typeof this.buildHeaders === 'function') ? this.buildHeaders() : {};

    if (opts && opts.headers) {
      headers = {...headers, ...opts.headers};
      delete opts.headers;
    }

    let request = {
      headers: headers,
      method: method,
      redirect: 'follow',
    };

    if (opts) {
      if (method === 'get') {
        let enc_opt = '';

        Object.keys(opts).forEach(key => {
          if (Array.isArray(opts[key])) {
            enc_opt = opts[key]; // leave alone
          }
          else if (opts[key] === Object(opts[key])) {
            enc_opt = JSON.stringify(opts[key]);
          }
          else {
            enc_opt = opts[key];
          }

          URI.searchParams.append(key, enc_opt)
        });
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

    return new Promise((resolve, reject) => {
      let t = 0;

      // this ensures we don't beat up the api
      do {
        t = new Date().getTime();
      } while (t - this.last_run < this.delay * (Math.random() + 1));

      resolve();
    })
    .then(_ => {
      if (this.debug) console.log(URI, request, request.body);

      return fetch(URI, request)
        .then(res => {
          if (this.debugg) console.log("RESPONSE", res);

          this.status = res.status;

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

          if (typeof this.responseHook === 'function') {
            this.responseHook(res);
          }

          if (res.status == 204) return is_json_return ? {} : '';

          return is_json_return ? res.json() : res.text();
        })
        .then(ret => {
          if (this.debuggg) console.log("RETURNED RESPONSE", ret);

          const jk = Object.keys(ret);

          this.last_run = new Date().getTime();

          if (typeof this.endHook === 'function') {
            this.endHook(ret);
          }

          let finishedData = ret;

          if (typeof this.simplifyReturnHook === 'function') {
            finishedData = this.simplifyReturnHook(ret);
          }
          else if (this.simplify_return && jk.length) {
            finishedData = ret[jk[0]];
          }

          return finishedData;
      });
    });
  }

  isOK() {
    const status = parseInt(this.status);
    return (status >= 200 && status <= 299);
  }

  get(path, opts) {
    return this.request('get', this.buildURI(path), opts);
  }
  getURL(url) {
    return this.request('get', this.buildURI(url));
  }

  post(path, opts) {
    return this.request('post', this.buildURI(path), opts);
  }

  put(path, opts) {
    return this.request('put', this.buildURI(path), opts);
  }

  del(path, opts) {
    return this.request('delete', this.buildURI(path), opts);
  }
}
