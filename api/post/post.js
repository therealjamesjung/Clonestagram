const express = require('express');
const router = express.Router();

const _query = require('../../database/db');
const _auth = require('../../utils/middleware');
const utils = require('../../utils/utils');

router.use((req, res, next) => {
  console.log(`${req.method}  ${req.ip} requested on ${req.path}`);
  next();
});

// Post upload API
router.post('/posts', _auth, async (req, res) => {
  let query_response = {};

  const writer = res.locals.user_id;
  const content = req.body.content;

  try {
    await _query(
      `INSERT INTO Post (content, writer) VALUES ('${content}', '${writer}');`
    );
    query_response.data = req.body;
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Follower's posts get API
router.get('/feed', _auth, async (req, res) => {
  let query_response = {};

  const page = req.query.page;
  const user_id = res.locals.user_id;
  const followers = await _query(
    `SELECT target_user FROM User_User WHERE request_user='${user_id}' AND accepted=1`
  );

  if (!followers.length) {
    res.status(400);
    query_response.message = `You don't have any follower.`;
  } else {
    try {
      const start = page == 1 ? 0 : (page - 1) * 10 - 1;
      query_response.data = await _query(
        `SELECT * FROM Post WHERE writer IN (SELECT target_user FROM User_User WHERE request_user='${user_id}' AND accepted=1) ORDER BY id LIMIT ${start}, 10`
      );
    } catch (error) {
      res.status(400);
      query_response.message = error;
    }
  }

  res.send(query_response);
});

// User's posts get API
router.get('/posts/:user_id', _auth, async (req, res) => {
  let query_response = {};

  const request_user = res.locals.user_id;
  const target_user = req.params.user_id;
  const is_exist = await _query(
    `SELECT user_id FROM User WHERE user_id='${target_user}'`
  );
  const is_private = await _query(
    `SELECT is_private FROM User WHERE user_id='${target_user}'`
  );
  const accepted = await _query(
    `SELECT accepted FROM User_User WHERE target_user='${target_user}' AND request_user='${request_user}'`
  );

  if (!is_exist.length) {
    res.status(400);
    query_response.message = `User with id '${req.params.user_id}' does not exists`;
  } else {
    try {
      if (is_private[0].is_private && !accepted[0].accepted) {
        res.status(400);
        query_response.message = `This account is private.`;
      } else {
        query_response.data = await _query(
          `SELECT * FROM Post WHERE writer='${target_user}'`
        );
      }
    } catch (error) {
      res.status(400);
      query_response.message = error;
    }
  }

  res.send(query_response);
});

// Post's content update API
router.put('/posts/:post_id', _auth, async (req, res) => {
  let query_response = {};

  const user_id = res.locals.user_id;
  const post_id = req.params.post_id;
  const content = req.body.content;
  const writer = await _query(`SELECT writer FROM Post WHERE id=${post_id}`);

  if (!writer.length) {
    res.status(400);
    query_response.message = `Post with id ${post_id} does not exists.`;
  } else {
    try {
      if (user_id === writer[0].writer) {
        await _query(
          `UPDATE Post SET content='${content}' WHERE id=${post_id}`
        );
        query_response.message = `Post with id ${post_id} has been successfully updated.`;
        query_response.data = req.body;
      } else {
        query_response.message = `Post with id ${post_id} is not your post.`;
      }
    } catch (error) {
      res.status(400);
      query_response.message = error;
    }
  }

  res.send(query_response);
});

// Post delete API
router.delete('/posts/:post_id', _auth, async (req, res) => {
  let query_response = {};

  const user_id = res.locals.user_id;
  const post_id = req.params.post_id;
  const writer = await _query(`SELECT writer FROM Post WHERE id=${post_id}`);

  if (!writer.length) {
    res.status(400);
    query_response.message = `Post with id ${post_id} does not exists.`;
  } else {
    try {
      if (user_id === writer[0].writer) {
        await _query(utils._delete('Post', post_id));
        query_response.message = `Post id ${post_id} has been successfully deleted.`;
      } else {
        query_response.message = `Post with id ${post_id} is not your post.`;
      }
    } catch (error) {
      res.status(400);
      query_response.message = error;
    }
  }

  res.send(query_response);
});

// Post's comment accessibility update API
router.put('/posts/:post_id/disable_cmt', _auth, async (req, res) => {
  let query_response = {};

  const user_id = res.locals.user_id;
  const post_id = req.params.post_id;
  const writer = await _query(`SELECT writer FROM Post WHERE id=${post_id}`);

  if (!writer.length) {
    res.status(400);
    query_response.message = `Post with id ${post_id} does not exists.`;
  } else {
    try {
      if (user_id === writer[0].writer) {
        const prev = await _query(
          `SELECT comment_disabled FROM Post WHERE id=${post_id}`
        );
        await _query(
          `UPDATE Post SET comment_disabled=${
            (prev[0].comment_disabled + 1) % 2
          } WHERE id=${post_id}`
        );
        query_response.message = `Accessibility of comments has been successfully updated.`;
      } else {
        query_response.message = `Post with id ${post_id} is not your post.`;
      }
    } catch (error) {
      res.status(400);
      query_response.message = error;
    }
  }

  res.send(query_response);
});

// Post archive/unarchive API
router.put('/posts/:post_id/archive', _auth, async (req, res) => {
  let query_response = {};

  const user_id = res.locals.user_id;
  const post_id = req.params.post_id;
  const writer = await _query(`SELECT writer FROM Post WHERE id=${post_id}`);

  if (!writer.length) {
    res.status(400);
    query_response.message = `Post with id ${post_id} does not exists.`;
  } else {
    try {
      if (user_id === writer[0].writer) {
        const prev = await _query(
          `SELECT archived FROM Post WHERE id=${post_id}`
        );
        await _query(
          `UPDATE Post SET archived=${
            (prev[0].archived + 1) % 2
          } WHERE id=${post_id}`
        );
        query_response.message = `Archived of post with id ${post_id} has been successfully updated.`;
      } else {
        query_response.message = `Post with id ${post_id} is not your post.`;
      }
    } catch (error) {
      res.status(400);
      query_response.message = error;
    }
  }

  res.send(query_response);
});

// Post like/unlike API
router.post('/posts/:post_id/like', _auth, async (req, res) => {
  let query_response = {};

  const user_id = res.locals.user_id;
  const post_id = req.params.post_id;
  const post = await _query(
    `SELECT writer, likes FROM Post WHERE id=${post_id}`
  );

  if (!post.length) {
    res.status(400);
    query_response.message = `Post with id ${post_id} does not exists.`;
  } else {
    const is_private = await _query(
      `SELECT is_private FROM User WHERE user_id='${post[0].writer}'`
    );
    const accepted = await _query(
      `SELECT accepted FROM User_User WHERE target_user='${post[0].writer}' AND request_user='${user_id}'`
    );

    try {
      if (is_private[0].is_private && !accepted[0].accepted) {
        res.status(400);
        query_response.message = `The account of this post's writer is private.`;
      } else {
        const liked = await _query(
          `SELECT * FROM Post_User WHERE post_id=${post_id} AND user_id='${user_id}'`
        );
        if (!liked.length) {
          await _query(
            `INSERT INTO Post_User (post_id, user_id) VALUES ('${post_id}', '${user_id}')`
          );
          await _query(
            `UPDATE Post SET likes=${post[0].likes + 1} WHERE id=${post_id}`
          );
        } else {
          await _query(
            `DELETE FROM Post_User WHERE post_id='${post_id}' AND user_id='${user_id}'`
          );
          await _query(
            `UPDATE Post SET likes=${post[0].likes - 1} WHERE id=${post_id}`
          );
        }
      }
      query_response.data = await _query(
        `SELECT id, likes FROM Post WHERE id='${post_id}'`
      );
    } catch (error) {
      res.status(400);
      query_response.message = error;
    }
  }

  res.send(query_response);
});

module.exports = router;
