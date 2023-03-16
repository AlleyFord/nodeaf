module.exports = class STD {
  // output
  die(...v) {
    if (v.length) console.log(...v);
    process.exit();
  }
  line(...v) {
    console.log(...v);
  }
  print(...v) {
    return this.line(...v);
  }
  out(...v) {
    process.stdout.write(...v);
  }

  // QOL
  iterable(v) {
    if (v === null || typeof v === 'undefined') return false;
    return typeof v[Symbol.iterator] === 'function';
  }
}
