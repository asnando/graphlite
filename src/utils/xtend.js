module.exports = function xtend() {
  var args = [].slice.call(arguments);
  var target = args.shift() || {};
  args.forEach(function(object) {
    for (var key in object) {
      if (object.hasOwnProperty(key))
        target[key] = object[key];
    }
  });
  return target;
}