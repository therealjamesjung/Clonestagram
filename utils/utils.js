const _validate_email = (email) => {
  const filter = /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/;
  return String(email).search(filter) != -1;
};

const _validate_body = (body, fields) => {
  let missing_fields = [];
  for (i = 0; i < fields.length; i++) {
    if (body.hasOwnProperty(fields[i]) == false) missing_fields.push(fields[i]);
  }
  return missing_fields;
};

const _response = (status, body) => {
  res = {};
  res.status = status;
  res.body = body;

  return res;
};

const _insert = (table, body) => {
  const columns = Object.keys(body);
  const values = Object.values(body).map((value) => `'${value}'`);

  return (query = `INSERT INTO ${table} (${columns.join(
    ", "
  )}) VALUES (${values.join(", ")});`);
};

const _delete = (table, id) => {
  return (query = `DELETE FROM ${table} WHERE id='${id}';`);
};

const _select = (table, id) => {
  return (query = `SELECT * FROM ${table} WHERE id=${id};`);
};

const _update = (table, id, body) => {
  const columns = Object.keys(body);
  const values = Object.values(body);

  const data = columns
    .map((column, i) => {
      return `${column}='${values[i]}'`;
    })
    .join();

  return (query = `UPDATE ${table} SET ${data} WHERE id=${id};`);
};

const _convertToTree = (
  array,
  idFieldName,
  parentIdFieldName,
  childrenFieldName
) => {
  let cloned = array.slice();

  for (let i = cloned.length - 1; i >= 0; i--) {
    let parentId = cloned[i][parentIdFieldName];

    if (parentId) {
      let filtered = array.filter((elem) => {
        return elem[idFieldName].toString() == parentId.toString();
      });

      if (filtered.length) {
        let parent = filtered[0];

        if (parent[childrenFieldName]) {
          parent[childrenFieldName].unshift(cloned[i]);
        } else {
          parent[childrenFieldName] = [cloned[i]];
        }
      }
      cloned.splice(i, 1);
    }
  }
  return cloned;
};

module.exports = {
  _validate_email,
  _validate_body,
  _response,
  _insert,
  _delete,
  _select,
  _update,
  _convertToTree,
};
