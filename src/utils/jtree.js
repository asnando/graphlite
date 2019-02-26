const isArray = require('./is-array');
const isNumber = require('./is-number');

module.exports = function jtree(tree, handler, path, parentNode, parentPath) {
  path = path || '$';
  if (typeof handler === 'function') {
    handler(tree, path, parentNode, parentPath);
  }
  if (isArray(tree)) {
    tree.forEach((node, index) => {
      jtree(node, handler, path.concat('#').concat(index), tree, path);
    });
  } else if (typeof tree === 'object') {
    Object.keys(tree).forEach(nodeName => {
      if (isNumber(nodeName)) return;
      jtree(tree[nodeName], handler, path.concat('.').concat(nodeName), tree, path);
    });
  }
}