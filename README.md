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
graphlite.defineSchema('mySchemaName', {
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

# Relations
