var fs = require('graceful-fs');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
module.exports = function walk(dir, cb) {
  var ee = new EventEmitter();
  var done = false;
  fs.readdir(dir, function(err, names) {
    if (err) {
      done = true;
      cb(err);
      return
    }
    var togo = names.length;
    if (!togo) {
      cb(null);
      return;
    }
    function tick(name, err) {
      names.splice(names.indexOf(name),1);
      if (done) return;
      if (err) {
        done = true;
        cb(err);
        return;
      }
      togo--;
      if (togo === 0) {
        done = true;
        cb(null);
      }
    }
    names.forEach(function (name) {
      var resolved = path.join(dir, name);
      fs.stat(resolved, function (err, stat) {
        if (err) {
          done = true;
          tick(err);
          return
        }
        if (stat.isDirectory()) {
          var subee = walk(resolved, function (err) { 
            tick(name,err);
          });
          subee.on('entry', function (resolved, stat, tick) {
            ee.emit('entry', resolved, stat, tick);
          })
          return;
        }
        if (ee.emit('entry', resolved, stat, tick.bind(null, name))) {
          return;
        }
        tick(name);
      });
    });
  });
  return ee;
}