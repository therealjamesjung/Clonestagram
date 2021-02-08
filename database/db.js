const mysql = require("mysql2/promise");
const db_config = require("../config/db_config.json");

const _query = async (raw_query) => {
  const connection = await mysql.createConnection({
    host: db_config.host,
    user: db_config.user,
    password: db_config.password,
    database: db_config.database,
  });

  let [rows, _] = await connection.execute(raw_query);
  await connection.end();

  return rows;
};

module.exports = _query;
