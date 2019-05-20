const _ = require('lodash');

module.exports = function jtree(tree, handler, path, parentNode, parentPath, options) {
  path = path || '$';
  options = options || {};
  if (typeof handler === 'function') {
    options = handler(tree, path, options, parentNode, parentPath);
  }
  if (_.isArray(tree)) {
    tree.forEach((node, index) => {
      jtree(node, handler, path.concat('#').concat(index), tree, path, options);
    });
  } else if (_.isObject(tree)) {
    Object.keys(tree).forEach(nodeName => {
      if (_.isNumber(nodeName)) return;
      jtree(tree[nodeName], handler, path.concat('.').concat(nodeName), tree, path, options);
    });
  }
}