const mysql = require("mysql2/promise");

const _query = async (raw_query) => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  try {
    let [rows, _] = await connection.execute(raw_query);
    await connection.end();
    return rows;
  } catch (error) {
    await connection.end();
    throw error;
  }
};

module.exports = _query;
