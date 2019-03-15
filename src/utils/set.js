// const isString = require('./is-string');
// const isObject = require('./is-object');
// const isArray = require('./is-array');

// module.exports = function set(object, path, value) {
//   if (isString(path)) {
//     path = path.split(/[\.\#]/);
//   } 
//   const beginsWith = path.shift();
//   // Beginning of the object, ignores...
//   if (/^\$$/.test(beginsWith)) {
//     return set(object, path, value);
//   }
//   // The node where to set value.
//   if (!path.length) {
//     if (object.hasOwnProperty(beginsWith)) {
//       object[beginsWith] = value;
//     }
//     return object;
//   }
//   // Loop to the next node.
//   if (isObject(object) && object.hasOwnProperty(beginsWith)) {
//     return set(object[beginsWith], path, value);
//   }
//   if (isArray(object) && object[beginsWith]) {
//     return set(object[beginsWith], path, value);
//   }
//   return object;
// }

module.exports = function set(obj, path, value) {
  var schema = obj;  // a moving reference to internal objects within obj
  var pList = path.split('.');
  var len = pList.length;
  for(var i = 0; i < len-1; i++) {
      var elem = pList[i];
      if( !schema[elem] ) schema[elem] = {}
      schema = schema[elem];
  }
  schema[pList[len-1]] = value;
}