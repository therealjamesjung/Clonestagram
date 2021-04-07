const express = require("express");
const router = express.Router();

const _query = require("../../database/db");
const middleware = require("../../utils/middleware");
const utils = require("../../utils/utils");

// Get parent comments API
router.get("/comments/:post_id", middleware._auth, async (req, res) => {
  let query_response = {};

  const user = res.locals.user_id;
  const post_id = req.params.post_id;
  const page = req.query.page - 1;
  const limit = 10;
  const post = await _query(`SELECT * FROM Post WHERE id = ${post_id};`);

  if (post.length == 0) {
    query_response.message = `Post #${post_id} does not exist.`;
    return res.send(query_response);
  }

  try {
    let comments = await _query(
      `SELECT * FROM Comment WHERE post = ${post_id} AND parent_comment is null ORDER BY likes desc LIMIT ${
        page * limit
      }, ${limit};`
    );
    for (let i = 0; i < comments.length; i++) {
      let result = await _query(
        `SELECT * From Comment_User WHERE comment_id = ${comments[i].id} AND user_id = '${user}';`
      );
      if (result.length == 0) {
        comments[i].is_liked = false;
      } else {
        comments[i].is_liked = true;
      }
    }
    if (comments.length == 0) {
      res.status(400);
      query_response.message = "No more comments";
    }
    query_response.data = comments;
  } catch (error) {
    res.status(400);
    query_response.data = error;
  }
  res.send(query_response);
});

// Get child comments API
router.get(
  "/comments/:parent_comment_id/reply",
  middleware._auth,
  async (req, res) => {
    let query_response = {};

    const page = req.query.page - 1;
    const limit = 10;
    const user = res.locals.user_id;
    const parent_comment_id = req.params.parent_comment_id;
    const comment = await _query(
      `SELECT * FROM Comment WHERE id = ${parent_comment_id};`
    );

    if (comment.length == 0) {
      query_response.message = `Comment #${parent_comment_id} does not exist.`;
      return res.send(query_response);
    }

    try {
      let comments = await _query(
        `SELECT * FROM Comment WHERE parent_comment = ${parent_comment_id} ORDER BY likes desc LIMIT ${
          page * limit
        }, ${limit};`
      );
      for (let i = 0; i < comments.length; i++) {
        let result = await _query(
          `SELECT * From Comment_User WHERE comment_id = ${comments[i].id} AND user_id = '${user}';`
        );
        if (result.length == 0) {
          comments[i].is_liked = false;
        } else {
          comments[i].is_liked = true;
        }
      }
      if (comments.length == 0) {
        res.status(400);
        query_response.message = "No more comments";
      }
      query_response.data = comments;
    } catch (error) {
      res.status(400);
      query_response.data = error;
    }
    res.send(query_response);
  }
);

// Write a comment API
router.post("/comments/:post_id", middleware._auth, async (req, res) => {
  let query_response = {};

  const content = req.body.content;
  const writer = res.locals.user_id;
  const post_id = req.params.post_id;
  const post = await _query(`SELECT * FROM Post WHERE id = ${post_id};`);

  if (post.length == 0) {
    query_response.message = `Post #${post_id} does not exist.`;
    return res.send(query_response);
  }

  try {
    await _query(
      `INSERT INTO Comment (content, writer, post)
            VALUES ('${content}','${writer}',${post_id});`
    );
    const comment = await _query(
      `SELECT content, writer, created_at FROM Comment WHERE id IN (SELECT MAX(id) FROM Comment);`
    );
    query_response.data = comment;
  } catch (error) {
    res.status(400);
    query_response.data = error;
  }
  res.send(query_response);
});

// Reply to a specific comment API
router.post(
  "/comments/:comment_id/reply",
  middleware._auth,
  async (req, res) => {
    let query_response = {};

    const content = req.body.content;
    const writer = res.locals.user_id;
    const data = await _query(
      `SELECT post, parent_comment FROM Comment WHERE id = ${req.params.comment_id};`
    );
    const parent_comment = req.params.comment_id;

    if (data.length == 0) {
      query_response.message = `Comment #${req.params.comment_id} does not exist.`;
      return res.send(query_response);
    }

    try {
      if (data[0].parent_comment == null) {
        await _query(
          `INSERT INTO Comment (content, writer, post, parent_comment)
                VALUES ('${content}', '${writer}', ${data[0].post}, ${parent_comment});`
        );
      } else {
        await _query(
          `INSERT INTO Comment (content, writer, post, parent_comment)
                VALUES ('${content}', '${writer}', ${data[0].post}, ${data[0].parent_comment});`
        );
      }
      const comment = await _query(
        `SELECT content, writer, created_at FROM Comment WHERE id IN (SELECT MAX(id) FROM Comment);`
      );
      query_response.data = comment;
    } catch (error) {
      res.status(400);
      query_response.data = error;
    }
    res.send(query_response);
  }
);

// Delete a comment API
router.delete("/comments/:comment_id", middleware._auth, async (req, res) => {
  let query_response = {};

  const writer = res.locals.user_id;
  const comment_id = req.params.comment_id;
  const post_writer = await _query(
    `SELECT writer FROM Post WHERE id = (SELECT post FROM Comment WHERE id = ${comment_id});`
  );
  const comment_writer = await _query(
    `SELECT writer FROM Comment WHERE id = ${comment_id};`
  );
  const comment = await _query(
    `SELECT * FROM Comment WHERE id = ${comment_id};`
  );

  if (comment.length == 0) {
    query_response.message = `Comment #${req.params.comment_id} does not exist.`;
    return res.send(query_response);
  }

  try {
    if (writer == post_writer[0].writer) {
      await _query(utils._delete("Comment", comment_id));
      query_response.message = `You delete a comment #${comment_id} successfully.`;
    } else if (writer == comment_writer[0].writer) {
      await _query(utils._delete("Comment", comment_id));
      query_response.message = `You delete a comment #${comment_id} successfully.`;
    } else {
      res.status(400);
      query_response.message = "No authority.";
    }
  } catch (error) {
    res.status(400);
    query_response.data = error;
  }
  res.send(query_response);
});

// Like a comment API
router.post(
  "/comments/:comment_id/like",
  middleware._auth,
  async (req, res) => {
    let query_response = {};

    const user = res.locals.user_id;
    const comment_id = req.params.comment_id;
    const is_liked = await _query(
      `SELECT * FROM Comment_User WHERE comment_id = ${comment_id} AND user_id = '${user}';`
    );
    const comment = await _query(
      `SELECT * FROM Comment WHERE id = ${comment_id};`
    );

    if (comment.length == 0) {
      query_response.message = `Comment #${req.params.comment_id} does not exist.`;
      return res.send(query_response);
    }

    try {
      if (is_liked.length == 0) {
        await _query(
          `INSERT INTO Comment_User (comment_id, user_id)
                    VALUES (${comment_id}, '${user}');`
        );
        await _query(
          `UPDATE Comment SET likes = likes + 1 where id = ${comment_id};`
        );
        query_response.message = `'${user}' like a comment #${comment_id}.`;
      } else {
        await _query(utils._delete("Comment_User", is_liked[0].id));
        await _query(
          `UPDATE Comment SET likes = likes - 1 where id = ${comment_id};`
        );
        query_response.message = `'${user}' cancel to like a comment #${comment_id}.`;
      }
    } catch (error) {
      res.status(400);
      query_response.data = error;
    }
    res.send(query_response);
  }
);

// Get list of users who liked a specific comment API
router.get("/comments/:comment_id/like", middleware._auth, async (req, res) => {
  let query_response = {};

  const user = res.locals.user_id;
  const comment_id = req.params.comment_id;
  const comment = await _query(
    `SELECT * FROM Comment WHERE id = ${comment_id};`
  );

  if (comment.length == 0) {
    query_response.message = `Comment #${req.params.comment_id} does not exist.`;
    return res.send(query_response);
  }

  try {
    query_response.data = await _query(
      `SELECT user_id,name FROM User WHERE user_id in (SELECT user_id FROM Comment_User WHERE comment_id = ${comment_id});`
    );
    for (let i = 0; i < query_response.data.length; i++) {
      let result = await _query(
        `SELECT * FROM User_User WHERE target_user = '${query_response.data[i].user_id}' AND request_user = '${user}';`
      );
      if (result.length == 0) {
        query_response.data[i].is_followed = false;
      } else {
        query_response.data[i].is_followed = true;
      }
    }
  } catch (error) {
    res.status(400);
    query_response.data = error;
  }
  res.send(query_response);
});

module.exports = router;
