import Knex, { Sqlite3ConnectionConfig } from "knex";
export default class Database {
  private static _connection: Knex;
  private static config = {
    client: "sqlite3",
    connection: <Sqlite3ConnectionConfig>{
      filename: __dirname + `/../../${process.env.DB_FILENAME}`,
    },
    useNullAsDefault: true,
  };

  static get connection(): Knex {
    return this._connection;
  }

  static set connection(newConnection: Knex) {
    this._connection = newConnection;
  }

  static getConnection(): Knex {
    if (!this.connection) {
      const connection = Knex(this.config);
      connection.on("query", () => console.log("BANCO"));
      this.connection = connection;
    }

    return this.connection;
  }
}
