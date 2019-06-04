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
    require('./schemas/group')(graphlite);
    require('./schemas/reference')(graphlite);
    require('./schemas/productmaker')(graphlite);
    done();
  });

  // #2
  it('should define the associations', done => {
    const product       = graphlite._schemaProvider('product'),
          automaker     = graphlite._schemaProvider('automaker'),
          vehicle       = graphlite._schemaProvider('vehicle'),
          image         = graphlite._schemaProvider('image'),
          group         = graphlite._schemaProvider('group'),
          reference     = graphlite._schemaProvider('reference'),
          productmaker  = graphlite._schemaProvider('productmaker');

    product.hasOne(image, {
      type: 'left',
      useSourceKey: 'ArquivoFotoProduto'
    });

    product.hasOne(group, {
      useSourceKey: 'CodigoGrupoProduto'
    });

    product.hasMany(reference, {
      type: 'left',
      useTargetKey: 'CodigoProduto'
    });

    productmaker.belongsToMany(reference);

    product.hasMany(productmaker, {
      using: ['reference']
    });

    product.hasMany(vehicle, {
      foreignTable: 'PRODUTO_APLICACAO',
      foreignKey: 'CodigoProduto'
    });

    product.hasMany(automaker, {
      using: ['vehicle']
    });

    vehicle.hasOne(automaker, {
      useSourceKey: 'CodigoFabricante'
    });
    automaker.belongsToMany(vehicle);

    done();
  });

  // #3
  it('should define queries', done => {
    require('./queries/full-product')(graphlite);
    done();
  });

  describe('findOne()', () => {
    // #4
    it('should fetch one product', done => {
      graphlite.findOne('full-product', { }, { withCount: true })
        .then(logresponse.bind(null, done))
        .catch(logerror.bind(null, done));
    });
  });


});

const log = console.log.bind(console, '   ');

function logresponse(done, response) {
  if (SHOW_EXAMPLE_ON_LOG) {
    log(response);
    // const object = response.rows[0];
    // log('---');
    // log(chalk.green('Object:'));
    // log(object);
    // log(chalk.green('Resume:'));
    // log(`  Query returned ${response.rows.length} rows!`);
    // log(`  Query builded in ${response.buildedIn}s!`);
    // log(`  Query executed in ${response.executedIn}s!`);
    // log('---');
  }
  return done();
}

function logerror(done, error) {
  log(error);
  return done(error);
}