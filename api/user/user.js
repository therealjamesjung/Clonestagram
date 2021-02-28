const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const router = express.Router();

const _query = require("../../database/db");
const _auth = require("./auth");
const utils = require("../../utils/utils");

router.use((req, res, next) => {
  console.log(`${req.method}  ${req.ip} requested on ${req.path}`);
  next();
});

// Sign in API
router.post("/signin", async (req, res) => {
  const user_id = req.body.user_id;
  const password = crypto
    .createHash("sha512")
    .update(req.body.password)
    .digest("base64");

  let query_response = {};

  query_response.data = await _query(
    `SELECT user_id, email, name FROM User WHERE user_id='${user_id}' AND password='${password}'`
  );
  if (query_response.data.length == 0) {
    res.status(400);
    query_response.message = "User with given info does not exists";
  } else {
    query_response.token = jwt.sign(
      {
        user_id: query_response.data[0].user_id,
        email: query_response.data[0].email,
        name: query_response.data[0].name,
      },
      process.env.SECRET_KEY,
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

// Sign up API
router.post("/signup", async (req, res) => {
  let query_response = {};

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
    res.status(400);
    query_response.message = `Fields ${missing_fields.toString()} is required.`;
  } else if (utils._validate_email(email) === false) {
    res.status(400);
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
      res.status(400);
      query_response.message = error.message;
    }
  }

  res.send(query_response);
});

// Should be gone before production
router.get("/users", _auth, async (req, res) => {
  let query_response = {};

  try {
    query_response.data = await _query("SELECT * FROM User;");
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Follow request API
router.put("/users/:user_id/follow", _auth, async (req, res) => {
  let query_response = {};

  if (req.params.user_id == res.locals.user_id) {
    query_response.message = "You can not follow yourself";
    return res.send(query_response);
  }

  try {
    let query = await _query(
      `SELECT user_id, name, is_private FROM User WHERE user_id='${req.params.user_id}'`
    );
    if (query.length === 0) {
      res.status(400);
      query_response.message = `User with user_id ${req.params.user_id} does not exists`;
    } else {
      let target_user = query[0];
      try {
        let data = await _query(
          `SELECT * FROM User_User WHERE target_user='${target_user.user_id}' AND request_user='${res.locals.user_id}'`
        );
        if (data.length === 0) {
          await _query(
            `INSERT INTO User_User (target_user, request_user) VALUES ('${target_user.user_id}', '${res.locals.user_id}')`
          );
          query_response.message = `Follow request has been sent to ${target_user.user_id}`;
        } else if (data[0].accepted === 0) {
          res.status(400);
          query_response.message = `You have already requested to follow ${target_user.user_id}`;
        } else {
          res.status(400);
          query_response.message = `You are already following ${target_user.user_id}`;
        }
      } catch (error) {
        res.status(400);
        query_response.message = error;
      }
    }
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Unfollow request API
router.put("/users/:user_id/unfollow", _auth, async (req, res) => {
  let query_response = {};

  if (req.params.user_id == res.locals.user_id) {
    query_response.message = "You can not unfollow yourself";
    return res.send(query_response);
  }

  try {
    let query = await _query(
      `SELECT user_id, name, is_private FROM User WHERE user_id='${req.params.user_id}'`
    );
    if (query.length === 0) {
      res.status(400);
      query_response.message = `User with user_id ${req.params.user_id} does not exists`;
    } else {
      let target_user = query[0];
      try {
        let follow_req = await _query(
          `SELECT * FROM User_User WHERE target_user='${target_user.user_id}' AND request_user='${res.locals.user_id}'`
        );
        if (follow_req.length === 0) {
          query_response.message = `You are not following user_id ${target_user.user_id}`;
        } else {
          if (follow_req[0].accepted === 0) {
            query_response.message = `You have cancelled your follow request to user_id ${req.params.user_id}`;
          } else {
            query_response.message = `You have succesfully unfollowed user_id ${req.params.user_id}`;
          }
          try {
            await _query(`DELETE FROM User_User WHERE id=${follow_req[0].id}`);
          } catch (error) {
            res.status(400);
            query_response.message = error;
          }
        }
      } catch (error) {
        res.status(400);
        query_response.message = error;
      }
    }
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Accept follow request API
router.put("/users/:user_id/accept", _auth, async (req, res) => {
  let query_response = {};

  if (req.params.user_id == res.locals.user_id) {
    query_response.message = "You can accpept yourself";
    return res.send(query_response);
  }

  let query = await _query(
    `SELECT user_id, name, is_private FROM User WHERE user_id='${req.params.user_id}'`
  );
  if (query.length === 0) {
    res.status(400);
    query_response.message = `User with user_id ${req.params.user_id} does not exists`;
  } else {
    try {
      let follow_req = await _query(
        `SELECT * FROM User_User WHERE target_user='${res.locals.user_id}' AND request_user='${req.params.user_id}'`
      );
      if (follow_req.length === 0) {
        res.status(400);
        query_response.message = `You have no follow request from ${req.params.user_id}`;
      } else if (follow_req[0].accepted === 1) {
        query_response.message = `You have already accepted the follow request from ${req.params.user_id}`;
      } else {
        try {
          await _query(
            `UPDATE User_User SET accepted=1 WHERE id=${follow_req[0].id}`
          );
          query_response.message = `You have accepted the follow request of user_id ${req.params.user_id}`;
        } catch (error) {
          res.status(400);
          query_response.message = error;
        }
      }
    } catch (error) {
      res.status(400);
      query_response.message = error;
    }
  }
  res.send(query_response);
});

module.exports = router;
