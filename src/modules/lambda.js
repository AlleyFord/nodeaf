const Core = require('../core.js');

module.exports = class Lambda extends Core {
  STATUS_OK = 200;
  STATUS_CLIENT_ERROR = 400;
  STATUS_SERVER_ERROR = 500;

  parse(body) {
    if (body.body) body = body.body;
    return new Map(Object.entries(JSON.parse(body)));
  }

  ok(res) {
    return this.response({statusCode: this.STATUS_OK, body: res});
  }

  errorClient(res) {
    return this.response({statusCode: this.STATUS_CLIENT_ERROR, body: res});
  }

  errorServer(res) {
    return this.response({statusCode: this.STATUS_SERVER_ERROR, body: res});
  }

  response(obj) {
    return {
      statusCode: obj.statusCode || 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Origin',
        'Content-Type': 'application/javascript',
        'Vary': 'Origin',
      },
      body: JSON.stringify(ret.body),
    };
  }
};
