const connectionProvider = require('./connection-provider');
const graphlite = require('../src');

const connection = new connectionProvider('./test/databases/test.db');

const instance = new graphlite({
  connection,
  schema: [
    require('./models/products'),
    require('./models/aplications'),
    require('./models/result'),
  ]
});

// console.log(instance);
instance.findAll('result');