const sqlite3 = require('sqlite3');

const QUERY_TESTER = `SELECT * FROM sqlite_master;`;

class ConnectionProvider {

  constructor(databasePath) {
    this.path = databasePath;
    // this._connection = null;
    this.connect();
  }

  connect() {
    this._connection = new sqlite3.Database(this.path);
  }

  attach(file, alias) {
    return this.run(`ATTACH DATABASE '${file}' AS ${alias};`);
  }

  run(query) {
    return new Promise((resolve, reject) => {
      this._connection.all(query, [], (error, rows) => {
        return error ? reject(error) : resolve(rows);
      });
    });
  }

  test() {
    this.connect();
    this.run(QUERY_TESTER)
      .then(() => console.log('Success!'))
      .catch((error) => console.error(error));
  }

}

module.exports = ConnectionProvider;