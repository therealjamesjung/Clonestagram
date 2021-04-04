const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const multer = require('multer');

const _query = require('../../database/db');
const middleware = require('../../utils/middleware');
const utils = require('../../utils/utils');

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
});

// Sign in API
router.post('/signin', async (req, res) => {
  const user_id = req.body.user_id;
  const password = crypto
    .createHash('sha512')
    .update(req.body.password)
    .digest('base64');

  let query_response = {};

  query_response.data = await _query(
    `SELECT user_id, email, name FROM User WHERE user_id='${user_id}' AND password='${password}'`
  );
  if (query_response.data.length == 0) {
    res.status(400);
    query_response.message = 'User with given info does not exists';
  } else {
    query_response.token = jwt.sign(
      {
        user_id: query_response.data[0].user_id,
        email: query_response.data[0].email,
        name: query_response.data[0].name,
      },
      process.env.SECRET_KEY,
      {
        expiresIn: '12h',
      },
      {
        algorithm: 'RS256',
      }
    );
  }

  res.send(query_response);
});

// Sign up API
router.post('/signup', async (req, res) => {
  let query_response = {};

  const user_id = req.body.user_id;
  const email = req.body.email;
  const name = req.body.name;
  const password = crypto
    .createHash('sha512')
    .update(req.body.password)
    .digest('base64');

  const missing_fields = utils._validate_body(req.body, [
    'user_id',
    'email',
    'name',
    'password',
  ]);

  if (missing_fields.length != 0) {
    res.status(400);
    query_response.message = `Fields ${missing_fields.toString()} is required.`;
  } else if (utils._validate_email(email) === false) {
    res.status(400);
    query_response.message = 'Email is not valid.';
  } else if (req.body.password.length < 8) {
    res.status(400);
    query_response.message = 'Password has to be longer than 8 characters.';
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
router.get('/users', middleware._auth, async (req, res) => {
  let query_response = {};

  try {
    query_response.data = await _query('SELECT * FROM User;');
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Reset password API
router.put('/users/password', middleware._auth, async (req, res) => {
  let query_response = {};
  const request_user = res.locals.user_id;
  const prev_pw = crypto
    .createHash('sha512')
    .update(req.body.prev_pw)
    .digest('base64');
  const new_pw = crypto
    .createHash('sha512')
    .update(req.body.new_pw)
    .digest('base64');

  user = await _query(
    `SELECT user_id FROM User WHERE user_id='${request_user}' AND password='${prev_pw}'`
  );
  try {
    if (user.length === 0) {
      query_response.message = `Your previous password wrong.`;
    } else {
      if (prev_pw === new_pw) {
        res.status(400);
        query_response.message = `You have to change to another password.`;
        return res.send(query_response);
      } else if (req.body.new_pw.length < 8) {
        res.status(400);
        query_response.message = `Password has to be longer than 8 characters.`;
        return res.send(query_response);
      }

      await _query(
        `UPDATE User set password='${new_pw}' WHERE user_id='${request_user}' AND password='${prev_pw}'`
      );
      query_response.message = `Your password has been updated.`;
    }
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Reset bio API
router.put('/users/bio', middleware._auth, async (req, res) => {
  let query_response = {};
  const request_user = res.locals.user_id;

  try {
    await _query(
      `UPDATE User set bio='${req.body.bio}' WHERE user_id='${request_user}'`
    );
    query_response.data = await _query(
      `SELECT user_id, email, name, bio, is_private FROM User WHERE user_id='${request_user}'`
    );
    query_response.message = `You have sucessfully reset your bio`;
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Reset profile image API
router.put(
  '/users/image',
  middleware._auth,
  upload.single('img'),
  async (req, res) => {
    let query_response = {};
    const request_user = res.locals.user_id;

    try {
      await _query(
        `UPDATE User set profile_image='${req.file.filename}' WHERE user_id='${request_user}'`
      );
      query_response.data = await _query(
        `SELECT user_id, profile_image FROM User WHERE user_id='${request_user}'`
      );
      query_response.message = `You have sucessfully reset your profile image.`;
    } catch (error) {
      res.status(400);
      query_response.message = error;
    }

    res.send(query_response);
  }
);

// Delete profile image API
router.delete('/users/image', middleware._auth, async (req, res) => {
  let query_response = {};
  const request_user = res.locals.user_id;

  try {
    await _query(
      `UPDATE User set profile_image='https://instagram.fdel3-1.fna.fbcdn.net/v/t51.2885-19/44884218_345707102882519_2446069589734326272_n.jpg?_nc_ht=instagram.fdel3-1.fna.fbcdn.net&_nc_ohc=NyXVWUpcBzMAX9SGJRm&edm=ANmP7GQAAAAA&ccb=7-4&oh=540c619fc854da05f400a2750451847d&oe=608E2CCF&_nc_sid=276363&ig_cache_key=YW5vbnltb3VzX3Byb2ZpbGVfcGlj.2-ccb7-4' WHERE user_id='${request_user}'`
    );
    query_response.data = await _query(
      `SELECT user_id, profile_image FROM User WHERE user_id='${request_user}'`
    );
    query_response.message = `You have sucessfully deleted your profile image.`;
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

module.exports = router;
