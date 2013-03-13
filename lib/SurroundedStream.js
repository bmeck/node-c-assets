var stream = require('readable-stream');
//
// options
// - directories
// - - required rootdir
// - - required destdir
// - sources
//
function SurroundedStream(prefix, suffix, options) {
  stream.Duplex.call(this, options);
  this._queued = [];
  this._current = null;
  this._prefix = prefix;
  this._suffix = suffix;
  return this;
}
exports.SurroundedStream = SurroundedStream;
require('util').inherits(SurroundedStream, stream.Duplex);
SurroundedStream.prototype.enqueue = function (obj) {
  this._queued.push(obj);
  this._start();
  return this;
}
SurroundedStream.prototype._read = function () {
  return this._current && this._current._read.apply(this._current, arguments);
}
SurroundedStream.prototype._start = function () {
  var self = this;
  if (self._current) return;
  else if (!self._queued.length) {
    self.emit('empty');
    return;
  }
  var next = self._queued.shift();
  var nextStream = self._prefix(next);
  if (!nextStream) {
    process.nextTick(self._start.bind(self));
    return;
  }
  self._current = nextStream;
  process.nextTick(function () {
    nextStream.on('end', function () {
      self._suffix && self._suffix(next);
      self._current = null;
      self._start();
     });
     nextStream.pipe(self, {end:false}); 
  });
}
SurroundedStream.prototype._write = function (chunk, encoding, callback) {
  var self = this;
  chunk = encoding ? new Buffer(chunk, encoding) : chunk;
  self.push(chunk);
  callback();
}