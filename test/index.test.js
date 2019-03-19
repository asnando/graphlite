const chalk = require('chalk');
const GraphLite = require('../src');
const connectionProvider = require('./connection-provider');

const DATABASE_FILE = './test/databases/test.db';
const SHOW_EXAMPLE_ON_LOG = true;

const connection = new connectionProvider(DATABASE_FILE);

const graphlite = new GraphLite({
  connection
});

describe('GraphLite', () => {

  // #1
  it('should define schemas', done => {
    require('./schemas/product')(graphlite);
    require('./schemas/vehicle')(graphlite);
    require('./schemas/automaker')(graphlite);
    done();
  });

  // #2
  it('should define the associations', done => {
    const product   = graphlite._schemaProvider('product'),
          automaker = graphlite._schemaProvider('automaker'),
          vehicle   = graphlite._schemaProvider('vehicle');

    const PRODUCT_VEHICLE_ASSOCIATION_OPTIONS = {
      foreignTable: 'PRODUTO_APLICACAO',
      foreignKey: 'CodigoAplicacao'
    };

    product.hasMany(vehicle, PRODUCT_VEHICLE_ASSOCIATION_OPTIONS);
    vehicle.belongsTo(product, PRODUCT_VEHICLE_ASSOCIATION_OPTIONS);

    vehicle.hasOne(automaker);
    automaker.belongsTo(vehicle);

    done();
  });

  // #3
  it('should define queries', done => {
    require('./queries/products')(graphlite);
    require('./queries/products-with-vehicles')(graphlite);
    // require('./queries/products-automakers-vehicles')(graphlite);
    done();
  });

  // ###
  describe('findAll()', () => {
    // #4
    // it('should fetch a list with 30 products', done => {
    //   graphlite.findAll('products')
    //     .then(logresponse.bind(null, done))
    //     .catch(logerror.bind(null, done));
    // });

    // #5
    it('should fetch a list with products within vehicles', done => {
      graphlite.findAll('products-with-vehicles', {
        descricaofabricante: 'AUDI',
        descricaoveiculo: 'A3'
      })
        .then(logresponse.bind(null, done))
        .catch(logerror.bind(null, done));
    });
  });

});

function logresponse(done, response) {
  if (!!SHOW_EXAMPLE_ON_LOG) {
    console.log();
    console.log('Example:', response.rows[0]);
    console.log();
  }
  console.log('   ', chalk.green(`Query returned ${response.rows.length} rows!`));
  console.log('   ', chalk.green(`Query builded in ${response.buildedIn}s!`));
  console.log('   ', chalk.green(`Query executed in ${response.executedIn}s!`));
  return done();
}

function logerror(done, error) {
  console.log(error);
  return done(error);
}