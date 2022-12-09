function die(v) {
  console.log(v);
  process.exit();
}

function out(v) {
  process.stdout.write(v);
}

function iterable(v) {
  if (v === null || v === undefined) return false;
  return typeof v[Symbol.iterator] === 'function';
}


export { die, out, iterable };
