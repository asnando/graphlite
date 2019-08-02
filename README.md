# Graphlite
SQLite ORM to query data as graph and receive it as json (uses the SQLite builtin json1 extension).

## Installation
```bash
npm install graphlite --save
```

Another related modules that can work with the Graphlite:

[express-graphlite](https://github.com/ffrm/express-graphlite)

[sqlite-storage](https://github.com/ffrm/sqlite-storage) - Makes easy to manage multiple related databases on Node.js

## Usage
```javascript
const Graphlite = require('graphlite');

// ... schemas, queries, associations, connection, locales
const graphliteInstance = new Graphlite({
  /* ...options */
});

graphliteInstance
  .findAll(queryName, queryOptions)
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

#### Constructor options
| Key | Type | Required |
| --- | ---- | -------- |
| schemas | Array of [schemas](#schemas) | true |
| queries | Array of [queries](#queries) | true |
| associations | Function([associations](#associations)) | false |
| connection | Function([connection](#connection-provider)) | true |
| locales | Object([locales](#locales)) | false |
| debug | Boolean | false |

## Connection Provider
GraphLite takes the defined query and schemas and translate the query graph to a executable SQLite query. The query is passed to a connection provider class (which can be any javascript class that have the ```run``` method). Basically a Connection Provider is a class that wraps the connection to the real SQLite instance.

```javascript
const GraphLite = require('graphlite');

const ConnectionProvider = function() {
  // ...
  run(query) {
    // it should execute the query in the SQLite connection
    // and return a promise from that execution. When it is resolved
    // GraphLite will parse the data and return it to the caller.
    return new Promise((resolve, reject) => {
      return SQLite.executeSql(query);
    });
  }
}

const graphlite = new GraphLite({ connection });
```

## Schemas
Schemas are object representations for relational databases <b>Tables</b>. It can be defined using the GraphLite <b>defineSchema</b> method.
```javascript
const product = graphlite.defineSchema('product', {
  tableName: 'products',
  properties: {
    productID: 'primaryKey',
    productDescription: 'string',
    productNumber: {
      alias: 'produt_number',
      type: 'number'
    },
    isRelease: 'boolean'
  }
});

const image = graphlite.defineSchema('image', {
  tableName: 'images',
  properties: {
    imageName: 'primaryKey',
    imageSource: 'string',
  }
});
```

The name for the field that will be showed by the query response will be resolved by the name of the key in the root of properties object.

#### Properties Options
| Name | Type | Description | Acceptable |
| ---- | ---- | ----------- | ---------- |
| type | String | Type of the field value on response | primaryKey, string, number, boolean |
| join | Array | Join two or more columns into one | - |
| resolve | Array | Resolves one of columns that is not empty nor defined | - |
| parse | Function | Function that will receive the response value of this column and returns a new value | - |
| alias | String | Alias used when the key name inside properties object does not represents the real column name | - |


## Queries
Graph representation of the queries that will execute. The keys from graph must match the schemas names (GraphLite will import it when mounting the query representation of the query graph).
```javascript
graphlite.defineQuery('products-list', {
  product: {
    image: {
      properties: ['imageSource']
    }
  }
});
```

## Associations
Queries can have associations between schemas. All associations must be defined in the query definition as a particular case for that query.
Schemas can be associated by one or N relations. GraphLite have four methods for schema association:

| Method |
| ------ |
| hasOne |
| hasMany |
| belongsTo |
| belongsToMany |

<i>* Relations with "N" size will be rendered as array in the query response. Otherwise they will be patched within the parent schema object.</i>

All the association methods above accepts some extra options needed for that associations. The options must be an object containing some of the following keys:

| Name | Type | Description | Default |
| ---- | ---- | ----------- | ------- |
| foreignTable | String | Name of the foreign table | - |
| foreignKey | String | Name of the foreign key | - |
| grouped | Boolean | Tells if any group by is defined in the query definition that uses this association | - |
| type | String | The type of join used to associate the tables (e.g: left/inner) | inner |
| using | [String] | When schemas are not directly asssociated but they need to have data patched. ```using``` must receive the name of all the others schemas which goes down the associations tree to turn it into a valid association. | - |
| useSourceKey | String | When the keys used by the association between the tables must be different from it primary keys. The source will repesent the table which ```have``` data from the other table. | - |
| useTargetKey | String | When the keys used by the association between the tables must be different from it primary keys. The target will repesent the table which ```belongs``` to the other table. | - |

#### Using association on query
Here is an example on how to use defined association between two or more schemas within the query:

```javascript
const product = graphlite.defineSchema(/* ... */);
const image = graphlite.defineSchema(/* ... */);

product.hasOne(image, {
  useSourceKey: 'productImageName'
});

image.belongsToOne(product, {
  useTargetKey: 'productImageName'
});
```

#### Using the ```associations``` function directly on the constructor
Graphlite accepts the constructor ```associations``` object option that is refers to a function where all the defined schemas will be defined inside an object(first argument received by the function) and then you can make all the manual associations.

```javascript
const useAssociations = (schemas = {}) => {
  const { product, group } = schemas;
  product.hasOne(group, { /* ... */ });
};

const graphlite = new Graphlite({
  // …
  associations: useAssociations,
});
```

## Locales
Graphlite supports translation using dynamic column suffix names. For example, if you have a column of product table as ```description``` and you have another column with the description translated to another language like ```description-es```.

You need to tell to Graphlite that specific schema property use translation using the ```useLocale``` boolean property.

And when requesting data you can pass the ```locale``` query option as the locale key name inside configuration object.

If query options locale does not match any locale configuration or no locale is specified then it will assume the first locale of the configuration object as the default.

```javascript
// locales configuration
const locales = {
  'pt-br': {
    columnSuffix: '-ptBR',
  },
  es: {
    columnSuffix: '-es',
  },
  en: {
    columnSuffix: '-en',
  },
};

// and on the schema definition:
const productSchema = {
  properties: {
    // … properies
    description: {
      useLocale: true,
    }
  }
};

const graphlite = new Graphlite({
  // … another options
  locales,
});

graphlite.findAll(queryName, {
  // …options
  locale: 'en',
}).then(({ rows }) => console.log(rows[0].description));
```

## Getting data
Data can be fetched by using the ```findAll``` or ```findOne``` methods from the Graplite instance.
These methods can receive two argument objects. The first object represents the filters that will be used by the query within its values, while the second object receive some extra options for pagination, ordering, etc.

| Option | Type   | Required | Default |
| ------ | ------ | -------- | ------- |
| page   | Number | false    | 1       |
| size   | Number | false    | 100     |
| orderBy | String/Array | false | - |
| count | Boolean | false | true |
| locale | String | false | Will use the first locale configuration from the ```locales``` object. |

```javascript
graphlite.findAll('product-list', {
  id: 38125,
  page: 1,
  size: 30,
  orderBy: 'productNumber',
}).then(data => {
  console.log(data.rows[0]);
  /* {
    _id: 38125,
    productDescription: '...',
    productNumber: 38125,
    isRelease: true,
    imageSource: 'data:image/png;base64,...'
  } */  
});
```

## Response
The response will be an object with the following properties:

| Name | Type | Description |
| ---- | ---- | ----------- |
| rows | Array | Array containing all rows object values fetched from the database |
| total | Number | Count the total number of rows that query have matched from the query |
| count | Number | Count the number of rows loaded by the actual page (equals to the rows.length) |
