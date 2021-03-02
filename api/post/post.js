const express = require('express');
const router = express.Router();

const _query = require('../../database/db');
const _auth = require('../user/auth');
const utils = require('../../utils/utils');

router.use((req, res, next) => {
  console.log(`${req.method}  ${req.ip} requested on ${req.path}`);
  next();
});

router.get('/posts', _auth, async (req, res) => {
  let query_response = { status: '200 OK' };

  const request_user = res.locals.user_id;
  const target_user = req.body.target_user;
  const is_private = await _query(
    `SELECT is_private FROM user WHERE user_id='${target_user}'`
  );
  const accepted = await _query(
    `SELECT accepted FROM user_user WHERE target_user='${target_user}' AND request_user='${request_user}'`
  );

  try {
    if (is_private[0].is_private && !accepted[0].accepted) {
      query_response.message = `This account is private.`;
    } else {
      query_response.data = await _query(
        `SELECT * FROM post WHERE writer='${target_user}'`
      );
    }
  } catch (error) {
    query_response.status = '400 Bad Request';
    query_response.message = error;
  }

  res.send(query_response);
});

router.post('/posts', _auth, async (req, res) => {
  let query_response = { status: '200 OK' };

  const writer = res.locals.user_id;
  const content = req.body.content;

  try {
    await _query(
      `INSERT INTO post (content, writer) VALUES ('${content}', '${writer}');`
    );
    query_response.data = req.body;
  } catch (error) {
    query_response.status = '400 Bad Request';
    query_response.message = error;
  }

  res.send(query_response);
});

router.put('/posts/:post_id', _auth, async (req, res) => {
  let query_response = { status: '200 OK' };

  const user_id = res.locals.user_id;
  const post_id = req.params.post_id;
  const content = req.body.content;
  const writer = await _query(`SELECT writer FROM Post WHERE id=${post_id}`);

  try {
    if (user_id === writer[0].writer) {
      let query = await _query(utils._select('post', post_id));

      if (query.length == 0) {
        query_response.status = '204 No Content';
        query_response.message = `Post with id ${post_id} does not exists.`;
      } else {
        await _query(
          `UPDATE post SET content='${content}' WHERE id=${post_id}`
        );
        query_response.message = `Post with id ${post_id} has been successfully updated.`;
        query_response.data = req.body;
      }
    } else {
      query_response.message = `Post with id ${post_id} is not your post.`;
    }
  } catch (error) {
    query_response.status = '400 Bad Request';
    query_response.message = error;
  }

  res.send(query_response);
});

router.delete('/posts/:post_id', _auth, async (req, res) => {
  let query_response = { status: '200 OK' };
  const post_id = req.params.id;

  try {
    let query = await _query(utils._select('post', post_id));

    if (query.length == 0) {
      query_response.status = '204 No Content';
      query_response.message = `Post with id=${post_id} does not exists.`;
    } else {
      await _query(utils._delete('post', post_id));
      query_response.message = `Post id ${post_id} has been successfully deleted.`;
    }
  } catch (error) {
    query_response.status = '400 Bad Request';
    query_response.message = error;
  }

  res.send(query_response);
});

module.exports = router;
