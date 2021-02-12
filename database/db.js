const mysql = require("mysql2/promise");
const config = require("../config/config.json");

const _query = async (raw_query) => {
  const connection = await mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
  });
  try {
    let [rows, _] = await connection.execute(raw_query);
    await connection.end();
    return rows[0];
  } catch (error) {
    await connection.end();
    return error;
  }
};

module.exports = _query;
