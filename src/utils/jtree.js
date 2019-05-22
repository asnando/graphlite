const isArray = require('lodash/isArray');
const isObject = require('lodash/isObject');
const isNumber = require('lodash/isNumber');
const keys = require('lodash/keys');

module.exports = function jtree(tree, handler, path, parentNode, parentPath, options = {}) {
  const activePath = path || '$';
  let activeOptions = options;
  if (typeof handler === 'function') {
    activeOptions = handler(tree, activePath, activeOptions, parentNode, parentPath);
  }
  if (isArray(tree)) {
    tree.forEach((node, index) => {
      jtree(node, handler, activePath.concat('#').concat(index), tree, activePath, activeOptions);
    });
  } else if (isObject(tree)) {
    keys(tree).forEach((nodeName) => {
      if (!isNumber(nodeName)) {
        jtree(tree[nodeName], handler, activePath.concat('.').concat(nodeName), tree, activePath, activeOptions);
      }
    });
  }
};
