class Graphlite {

  constructor(opts) {
    this._connection = opts.connection;
    this._schema = opts.schema;
  }

  getSchema(schemaName) {
    return this._schema.find(schema => schema.name === schemaName);
  }

  findAll(schemaName) {
    debug(`Finding all ${schemaName}(s)`);
    let schema = this.getSchema(schemaName);
    if (!schema) throw new Error(`Undefined schema for ${schemaName}`);
    this._translateGraph(schema);
  }

  findOne(schemaName) {

  }

  _translateGraph(graph) {
    let g;
    let lastNodeName = null;

    jtree(graph, (node, path, parentPath) => {
      if (path === '$') {
        g = {};
      } else if (/\.name$/.test(path)) {
        g[node] = {};
        lastNodeName = node;
      } else if (/\.properties$/.test(path)) {
        g[lastNodeName].properties = {};
      } else if (/\.alias$/.test(path)) {
        const propertyName = path.match(/(\w+)\.\w+$/)[1];
        g[lastNodeName].properties[propertyName]._fieldName = node;
      } else if (/\.type$/.test(path)) {
        const propertyName = path.match(/(\w+)\.\w+$/)[1];
        g[lastNodeName].properties[propertyName].type = node;
      } else {
        const propertyName = path.match(/\w+$/)[0];
        g[lastNodeName].properties[propertyName] = type(node) === 'string'
          ? { type: node, _fieldName: propertyName }
          : {...node, _fieldName: propertyName };
        // console.log('*', path, node);
      }
    });
    console.log(JSON.stringify(g, null, 2));
    return g;
  }

}

module.exports = Graphlite;

function debug() {
  const m = Array
    .from(arguments)
    .map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg)
    .join(' ');
  console.log(m);
}

function jtree(tree, handler, path, parentPath) {
  path = path || '$';
  if (typeof handler === 'function') {
    handler(tree, path, parentPath);
  }
  if (isArray(tree)) {
    tree.forEach((node, index) => {
      jtree(node, handler, path.concat('#').concat(index), path);
    });
  } else if (typeof tree === 'object') {
    Object.keys(tree).forEach(nodeName => {
      if (isNumber(nodeName)) return;
      jtree(tree[nodeName], handler, path.concat('.').concat(nodeName), path);
    });
  }
}

function createHashCode() {
  let h = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return /^\d/.test(h) ? hashCode() : h;
}

function type(a) {
  return Object.prototype.toString.call(a).replace(/^\[object (.+)\]$/, '$1').toLowerCase();
}

function isArray(array) {
  return type(array) === 'array';
}

function isNumber(number) {
  return type(number) === 'number';
}