const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const router = express.Router();

const _query = require("../../database/db");
const _auth = require("./auth");
const utils = require("../../utils/utils");
const config = require("../../config/config.json");

router.use((req, res, next) => {
  console.log(`${req.method}  ${req.ip} requested on ${req.path}`);
  next();
});

router.post("/signin", async (req, res) => {
  const user_id = req.body.user_id;
  const password = crypto
    .createHash("sha512")
    .update(req.body.password)
    .digest("base64");
  let query_response = { status: "200 OK" };

  query_response.data = await _query(
    `SELECT user_id, email, name FROM User WHERE user_id='${user_id}' AND password='${password}'`
  );

  if (query_response.data.length == 0) {
    query_response.message = "User with given info does not exists";
  } else {
    query_response.token = jwt.sign(
      {
        user_id: query_response.data.user_id,
        email: query_response.data.email,
        name: query_response.data.name,
      },
      config.SECRET_KEY,
      {
        expiresIn: "12h",
      },
      {
        algorithm: "RS256",
      }
    );
  }

  res.send(query_response);
});

router.post("/signup", async (req, res) => {
  let query_response = { status: "200 OK" };

  const user_id = req.body.user_id;
  const email = req.body.email;
  const name = req.body.name;
  const password = crypto
    .createHash("sha512")
    .update(req.body.password)
    .digest("base64");

  const missing_fields = utils._validate_body(req.body, [
    "user_id",
    "email",
    "name",
    "password",
  ]);

  if (missing_fields.length != 0) {
    query_response.status = "400 Bad Request";
    query_response.message = `Fields ${missing_fields.toString()} is required.`;
  } else if (utils._validate_email(email) === false) {
    query_response.status = "400 Bad Request";
    query_response.message = "Email is not valid.";
  } else {
    try {
      await _query(
        `INSERT INTO User (user_id, email, name, password) VALUES ('${user_id}', '${email}', '${name}', '${password}');`
      );
      query_response.data = {
        user_id: user_id,
        email: email,
        name: name,
      };
      query_response.message = `User: ${user_id} is created.`;
    } catch (error) {
      query_response.status = "400 Bad Request";
      query_response.message = error;
    }
  }

  res.send(query_response);
});

router.get("/users", _auth, async (req, res) => {
  let query_response = { status: "200 OK" };

  try {
    query_response.data = await _query("SELECT * FROM User;");
  } catch (error) {
    query_response.status = "400 Bad Request";
    query_response.message = error;
  }

  res.send(query_response);
});

module.exports = router;
