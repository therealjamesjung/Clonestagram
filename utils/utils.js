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

module.exports = { _validate_email, _validate_body };
