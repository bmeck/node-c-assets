var stream = require('readable-stream');
function CCharStream(options) {
  stream.Transform.call(this, options);
  return this;
}
exports.CCharStream = CCharStream;
require('util').inherits(CCharStream, stream.Transform);
CCharStream.prototype._transform = function (chunk, encoding, cb) {
  var result = '';
  chunk = encoding ? new Buffer(chunk, encoding) : chunk;
  for (var i = 0; i < chunk.length; i++) {
    var c = chunk[i];
    result+='0x'+(c[i]<16?'0':'')+c.toString(16)+',';
  }
  this.push(result);
  cb();
}