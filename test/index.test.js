const chalk = require('chalk');
const GraphLite = require('../src');
const connectionProvider = require('./connection-provider');

const DATABASE_FILE = './test/databases/test.db';
const SHOW_EXAMPLE_ON_LOG = true;

const connection = new connectionProvider(DATABASE_FILE);
connection.attach('./test/databases/images.db', 'images');

const graphlite = new GraphLite({
  connection
});

describe('GraphLite', () => {

  // #1
  it('should define schemas', done => {
    require('./schemas/product')(graphlite);
    require('./schemas/vehicle')(graphlite);
    require('./schemas/automaker')(graphlite);
    require('./schemas/image')(graphlite);
    done();
  });

  // #2
  it('should define the associations', done => {
    const product   = graphlite._schemaProvider('product'),
          automaker = graphlite._schemaProvider('automaker'),
          vehicle   = graphlite._schemaProvider('vehicle'),
          image     = graphlite._schemaProvider('image');

    product.hasOne(image, { type: 'left' });
    product.hasMany(vehicle, {
      foreignTable: 'PRODUTO_APLICACAO',
      foreignKey: 'CodigoProduto'
    });
    product.hasMany(automaker, {
      using: ['vehicle']
    });
    vehicle.hasOne(automaker);
    automaker.belongsToMany(vehicle);
    done();
  });

  // #3
  it('should define queries', done => {
    require('./queries/products')(graphlite);
    require('./queries/products-with-vehicles')(graphlite);
    require('./queries/products-automakers-vehicles')(graphlite);
    done();
  });

  describe('findOne()', () => {
    // #4
    it('should fetch one product', done => {
      graphlite.findOne('products')
        .then(logresponse.bind(null, done))
        .catch(logerror.bind(null, done));
    });
  });

  // ###
  describe('findAll()', () => {
    // #5
    it('should fetch a list with products within vehicles', done => {
      graphlite.findAll('products-with-vehicles', { })
        .then(logresponse.bind(null, done))
        .catch(logerror.bind(null, done));
    });

    // #6
    it('should fetch a list with products within automakers and it respective vehicles', done => {
      graphlite.findAll('products-automakers-vehicles', { })
        .then(logresponse.bind(null, done))
        .catch(logerror.bind(null, done));
    });
  });
});

function logresponse(done, response) {
  if (SHOW_EXAMPLE_ON_LOG && response.rows && response.rows.length) {
    const object = response.rows[0];
    console.log('---');
    console.log(chalk.green('Object:'));
    console.log(object);
    console.log(chalk.green('Resume:'));
    console.log(`  Query returned ${response.rows.length} rows! \n  Query builded in ${response.buildedIn}s! \n  Query executed in ${response.executedIn}s!`);
    console.log('---');
  }
  return done();
}

function logerror(done, error) {
  console.log(error);
  return done(error);
}