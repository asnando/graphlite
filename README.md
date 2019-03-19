# Graphlite
SQLite ORM to query data as graph and receive it as json (uses the JSON1 extension)

# Connection Provider
GraphLite takes the defined query and schemas and translate the query graph to a executable SQLite query. The query is passed to a connection provider class (which can be any javascript class that have the <b>run</b> method). Basically a Connection Provider is a class that wraps the connection to the real SQLite instance.

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

# Schemas
Schemas are object representations for relational databases <b>Tables</b>. It can be defined using the GraphLite <b>defineSchema</b> method.
```javascript
const mySchema = graphlite.defineSchema('mySchemaName', {
  tableName: 'myTableName',
  properties: {
    id: 'primaryKey',
    description: {
      type: 'string'
    },
    agg: {
      join: ['columna', 'columnb']
    },
    type: {
      resolve: ['typea', 'typeb']
    }
  }
});
```

The name for the field that will be showed by the query response will be resolved by the name of the key in the root of properties object.

### Properties Options
| Name | Type | Description | Acceptable |
| ---- | ---- | ----------- | ---------- |
| type | String | Type of the field value on response | primaryKey, string, number |
| join | Array | Join two or more columns into one | - |
| resolve | Array | Resolves one of columns that is not empty nor defined | - |
| parse | Function | Function that will receive the response value of this column and returns a new value | - |
| alias | String | Alias used when the key name inside properties object does not represents the real column name | - |


# Queries
Graph representation of the queries that will execute. The keys from graph must match the schemas names (GraphLite will import it when mounting the query representation of the query graph).
```javascript
graphlite.defineQuery('result', {
  mySchemaName: {
    properties: '*',
    anotherSchema: '*'
  }
});
```

# Associations
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

| Name | Type | Description |
| ---- | ---- | ----------- |
| foreignTable | String | Name of the foreign table |
| foreignKey | String | Name of the foreign key |
| grouped | Boolean | Tells if any group by is defined in the query definition that uses this association |

### Example
```javascript
const schema1 = graphlite.defineSchema(/* ... */),
      schema2 = graphlite.defineSchema(/* ... */);

schema1.hasMany(schema2);

schema2.belongsTo(schema1, {
  foreignTable: 'tableB',
  foreignKey: 'keyB'
});
```

### Using association on query
Here is an example on how to use defined association between two or more schemas within the query:

```javascript
const schema1 = graphlite.defineSchema(/* ... */),
      schema2 = graphlite.defineSchema(/* ... */);

const query = graphlite.defineQuery('test', {
  schema1: {
    properties: '*',
    schema2: {
      properties: [
        'columna'
      ]
    }
  }
});
```

<i>Note.: When associations are not directly associated GraphLite will try to detect the association with parent by walking throught another possible schema until it reaches the parent.</i>