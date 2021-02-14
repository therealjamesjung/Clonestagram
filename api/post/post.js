const express = require('express');
const router = express.Router();

const _query = require('../../database/db');
const _auth = require('./auth');
const utils = require('../../utils/utils');

router.use((req, res, next) => {
  console.log(`${req.method}  ${req.ip} requested on ${req.path}`);
  next();
});

router.get('/posts', async (req, res) => {
  let query_response = { status: '200 OK' };

  try {
    query_response.data = await _query('SELECT * FROM Post;');
  } catch (error) {
    query_response.status = '400 Bad Request';
    query_response.message = error;
  }

  res.send(query_response);
});

router.post('/posts', _auth, async (req, res) => {
  let query_response = { status: '200 OK' };

  try {
    await _query(utils._insert((table = 'post'), req.body));
    query_response.data = req.body;
  } catch (error) {
    query_response.status = '400 Bad Request';
    query_response.message = error;
  }
  res.send(query_response);
});

router.delete('/posts/:id', _auth, async (req, res) => {
  let query_response = { status: '200 OK' };

  try {
    let query = await _query(utils._select('post', req.params.id));

    if (query.length == 0) {
      query_response.status = '204 No Content';
      query_response.message = `Post with id=${req.params.id} does not exists.`;
    } else {
      await _query(utils._delete('post', req.params.id));
      query_response.message = `Post id ${req.params.id} has been successfully deleted.`;
    }
  } catch (error) {
    query_response.status = '400 Bad Request';
    query_response.message = error;
  }
  res.send(query_response);
});

router.put('/posts/:id', _auth, async (req, res) => {
  let query_response = { status: '200 OK' };

  try {
    let query = await _query(utils._select('post', req.params.id));

    if (query.length == 0) {
      query_response.status = '204 No Content ';
      query_response.message = `Post with id=${req.params.id} does not exists.`;
    } else {
      await _query(utils._update('post', req.params.id, req.body));
      query_response.message = `Post id ${req.params.id} has been successfully updated.`;
      query_response.data = req.body;
    }
  } catch (error) {
    query_response.status = '400 Bad Request';
    query_response.message = error;
  }
  res.send(query_response);
});

module.exports = router;
