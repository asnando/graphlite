# Graphlite
SQLite ORM to query data as graph and receive it as json (uses the SQLite builtin json1 extension).

## Installation
```bash
npm install graphlite --save
```

Another related modules that can work with the Graphlite:

[express-graphlite](https://github.com/ffrm/express-graphlite)

[sqlite-storage](https://github.com/ffrm/sqlite-storage) - Makes easy to manage multiple related databases on Node.js

## Features
- Schemas ```(with association between them)```
- Queries
- Multi level array graph response with ```array``` and ```sub objects``` directly from the database (using the ```json1``` builtin extension)
- Schema properties response types and parsers
- JavaScript response parser for accurate types
- Custom query filters
- [Locale](#locales) support
- [HTM](#htm) - Hightlight text match

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
| type | String | Type of the field value on response | pkey, string, number, bool |
| parser | Function | Function that will receive the response value of this column and returns a new value | - |
| alias | String | The name of the column into database that the property refers to | - |
| useLocale | Boolean | If property supports [multi lang](#locales) feature | -
| htm | Boolean | If [Hightlight text match](#htm) feature must be used for this field | -

## Queries
You must define the query structure to get data from the database. Query is a representation of schemas and the associations between them in graph format. The graph keys must match the desired schema name. For example, if want to fetch data where product is the root of the graph we could do like so:

```javascript
graphlite.defineQuery('products', {
  product: {
    properties: '*'
  }
});
```

and when resolved we will get the products data in the root node like:

```json
[
  { "description": "Product 1" },
  { "description": "Product 2" }
]
```

The nexted nodes in graph will resolve data from associated schemas. It can create a new node inside the response object in case of array associations (defined in [associations](#associations)) or it can merge all the nested schema properties into the current node. See the examples below:

```javascript
graphlite.defineQuery('products', {
  product: {
    properties: '*',
    group: {
      as: 'groups',
      properties: [
        'groupDescription'
      ]
    }
  }
});
```
and then

```json
[
  {
    "description": "Product 1",
    "groups": [
      { "groupDescription": "Group 1" },
      { "groupDescription": "Group 2" },
    ]
  }
]
```

### Query specific keys options
| Name | Type | Description |
| ---- | ---- | ----------- |
| properties | Array[String] | Filter the properties that must be returned for this node data using the properties names from schema definition.
| as | String | Alias for new response object node key (when using array).
| size | Number | Limits the current node with N records.
| where | Object | Object containing filters (static or dynamic) with the [following](#query-filters) configuration.
| groupBy | String, Array[String] | Property name or list of properties names from the schema to be static used for group by.
| orderBy | String, Array[String] | Property name or list of properties names to use as order by. It will be overrided when query options receives a new orderBy array on query call.

### Query filters
Each schema in graph can receive dynnamic or use static query filters to filter the data from the tables. A query filter must be defined inside the <b>where</b> object inside the query graph node. Query filter supports the following keys:

| Name | Type | Description | Acceptable values |
| ---- | ---- | ----------- | --------- |
| property | String | Schema property name to be used. | -
| properties | Array[String] | List of schema properties names to be used. Will create a ```and``` or ```or``` condition based on the ```join``` definition. | -
| parser | String, Function | Parses the query input for filter before querying the data. | -
| operator | String | Represents | equals ```=propName, =```, more than ```>propName, >```, less than ```<propName, <```, begins with ```%propName, ^%```, ends with ```propName%, ...%```, contains ```%propName%, %%```, globed ```*propName, *```, differs ```<>propName, <>``` |
| join | String | The type of concatenation to be used when property refers to a list of properties or the value inputed for query contains " "(spaces). | and ```&&```, or ```||```
| htm | Boolean | Indicates if schema properties with [htm](#htm) support must be hightlighted when using this filter. | -

Example:

```js
{
  product: {
    properties: '*',
    where: {
      text: {
        property: 'keywords',
        operator: '^%',
        htm: true,
      }
    }
  }
}
```

Query filters can also be used as a simple string but it supports less functionalities:

```js
{
  // ...
  where: {
    description: '=productDescription',
  }
}
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
| join | String | The type of join used to associate the tables ```(e.g: left/inner)``` | inner |
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

## HTM
Refers to hightlight text match feature. This feature hightlightes the matching sub strings of the response values from the enabled schema properties within a ```<strong>``` enclose query. Properties that must be hightlighted must contains the ```htm``` property as enabled in the schema definition.

<i>Text hightlight will only be working when you use a query filter with the ```htm``` feature support.</i>

Example:
```javascript
const mySchema = {
  // ...
  someProperty: {
    alias: 'columnName',
    type: 'string',
    htm: true,
  }
};

const myQuery = {
  // ...
  product: {
    mySchema: {
      properties: '*',
      where: {
        text: {
          // ...
          htm: true,
        },
      }
    }
  }
};

// Then when using the query:
graphlite.findAll('myQuery', {
  text: 'productName',
}).then((data) => {
  console.log(data);
  // {
  //   someProperty: 'This is the <strong>productName</strong> description',
  // }
});

```

## Getting data
Data can be fetched by using the ```findAll``` or ```findOne``` methods from the Graplite instance.
These methods can receive two argument objects. The first object represents the filters that will be used by the query within its values, while the second object receive some extra options for pagination, ordering, etc.

| Option | Type   | Required | Default | Description |
| ------ | ------ | -------- | ------- | ----------- |
| page   | Number | false    | 1       | -
| size   | Number | false    | 100     | -
| orderBy | String/Array | false | - | -
| count | Boolean | false | true | -
| locale | String | false | - | Name of the defined locale to use with the query. If locale does not match it will detect the default one.
| htm | Array[String] | false | - | Query can hightlight specific words on response for properties with ```htm``` feature enabled. You can specify a list of strings that will be hightlighted.

```javascript
graphlite.findAll('product-list', {
  id: 38125,
  page: 1,
  size: 30,
  orderBy: 'productNumber',
}).then(data => {
  console.log(data.rows[0]);
  /* {
    id: 38125,
    productDescription: '...',
    productNumber: 38125,
    isRelease: true,
    imageSource: 'data:image/png;base64,...',
    vehicles: [
      { vehicleDescription: '...' },
      { vehicleDescription: '...' },
      { vehicleDescription: '...' }
    ]
  } */  
});
```

## Response
The response will be an object with the following properties:

| Name | Type | Description |
| ---- | ---- | ----------- |
| rows | Array | Array containing all rows object values fetched from the database |
| total | Number | Count the total number of rows that query have matched from the query |
| count | Number | Count the number of rows loaded by the actual page ```(equals to the rows.length)``` |
