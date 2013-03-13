var fs = require('graceful-fs');  
var zlib = require('zlib');
var path = require('path');
var stream = require('readable-stream');
var EventEmitter = require('events').EventEmitter;
function stringify(str) {
  return '"'+str.replace(/[\\"]/g, '\\$&')+'"';
}
CCharStream = require('./CCharStream').CCharStream;
walk = require('./walk');
SurroundedStream = require('./SurroundedStream').SurroundedStream;
var assets = assetsStream(null, {
  rootdir: '.'
}).pipe(process.stdout);
function assetsStream(name, options) {
  var destdir = options.destdir;
  var rootdir = options.rootdir;
  var visited = {};
  var assets = new SurroundedStream(function (info) {
    var resolved = info.resolved;
    var size = info.stat.size;
    this.push('{'+resolved.length+','+stringify(resolved)+','+size+',(char[]){');
    var fstream = new stream.Readable();
    fstream.wrap(fs.createReadStream(info.real)); 
    return fstream/*.pipe(zlib.createGzip())*/.pipe(new CCharStream());
  }, function (info) {
    this.push('}},\n');
  });
  assets.push('const bundled_asset_t assets[] = {\n');
  var togo = 0;
  var written = {};
  function finish() {
    assets.push('};');
    assets.end();
  }
  walk(rootdir, function () {
    assets.on('empty', finish);
  }).on('entry', function writeEntry(resolved, stat, tick) {
    written[resolved] = true;
    if (stat.isSymbolicLink()) {
      fs.realpath(resolved,function(err, real) {
        if (err) {
          tick(err);
          return;
        }
        assets.enqueue({
          real: real,
          resolved: resolved,
          stat: stat
        });
        tick(null);
      });
    }
    else if (stat.isFile()) {
      assets.enqueue({
        real: resolved,
        resolved: resolved,
        stat: stat
      });
    }
    tick(null);
  });
  return assets;
}
