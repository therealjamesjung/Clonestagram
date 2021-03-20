const express = require("express");
const router = express.Router();

const _query = require("../../database/db");
const _auth = require("../../utils/middleware");
const utils = require("../../utils/utils");

router.use((req, res, next) => {
  console.log(`${req.method}  ${req.ip} requested on ${req.path}`);
  next();
});

router.get("/posts/:user_id", _auth, async (req, res) => {
  let query_response = { status: "200 OK" };

  const request_user = res.locals.user_id;
  const target_user = req.params.user_id;
  const is_private = await _query(
    `SELECT is_private FROM User WHERE user_id='${target_user}'`
  );
  const accepted = await _query(
    `SELECT accepted FROM User_User WHERE target_user='${target_user}' AND request_user='${request_user}'`
  );

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

  res.send(query_response);
});

router.post("/posts", _auth, async (req, res) => {
  let query_response = { status: "200 OK" };

  const writer = res.locals.user_id;
  const content = req.body.content;

  try {
    await _query(
      `INSERT INTO Post (content, writer) VALUES ('${content}', '${writer}');`
    );
    query_response.data = req.body;
  } catch (error) {
    query_response.status = "400 Bad Request";
    query_response.message = error;
  }

  res.send(query_response);
});

router.put("/posts/:post_id", _auth, async (req, res) => {
  let query_response = { status: "200 OK" };

  const user_id = res.locals.user_id;
  const post_id = req.params.post_id;
  const content = req.body.content;
  const writer = await _query(`SELECT writer FROM Post WHERE id=${post_id}`);

  try {
    if (user_id === writer[0].writer) {
      let query = await _query(utils._select("Post", post_id));

      if (query.length == 0) {
        query_response.status = "204 No Content";
        query_response.message = `Post with id ${post_id} does not exists.`;
      } else {
        await _query(
          `UPDATE Post SET content='${content}' WHERE id=${post_id}`
        );
        query_response.message = `Post with id ${post_id} has been successfully updated.`;
        query_response.data = req.body;
      }
    } else {
      query_response.message = `Post with id ${post_id} is not your post.`;
    }
  } catch (error) {
    query_response.status = "400 Bad Request";
    query_response.message = error;
  }

  res.send(query_response);
});

router.delete("/posts/:post_id", _auth, async (req, res) => {
  let query_response = { status: "200 OK" };

  const user_id = res.locals.user_id;
  const post_id = req.params.post_id;
  const writer = await _query(`SELECT writer FROM Post WHERE id=${post_id}`);

  try {
    if (user_id === writer[0].writer) {
      let query = await _query(utils._select("Post", post_id));

      if (query.length == 0) {
        query_response.status = "204 No Content";
        query_response.message = `Post with id ${post_id} does not exists.`;
      } else {
        await _query(utils._delete("Post", post_id));
        query_response.message = `Post id ${post_id} has been successfully deleted.`;
      }
    } else {
      query_response.message = `Post with id ${post_id} is not your post.`;
    }
  } catch (error) {
    query_response.status = "400 Bad Request";
    query_response.message = error;
  }

  res.send(query_response);
});

router.put("/posts/:post_id/disable_cmt", _auth, async (req, res) => {
  let query_response = { status: "200 OK" };

  const user_id = res.locals.user_id;
  const post_id = req.params.post_id;
  const writer = await _query(`SELECT writer FROM Post WHERE id=${post_id}`);

  try {
    if (user_id === writer[0].writer) {
      let query = await _query(utils._select("Post", post_id));

      if (query.length == 0) {
        query_response.status = "204 No Content";
        query_response.message = `Post with id ${post_id} does not exists.`;
      } else {
        const prev = await _query(
          `SELECT comment_disabled FROM Post WHERE id=${post_id}`
        );
        await _query(
          `UPDATE Post SET comment_disabled=${
            (prev[0].comment_disabled + 1) % 2
          } WHERE id=${post_id}`
        );
        query_response.message = `Accessibility of comments has been successfully updated.`;
      }
    } else {
      query_response.message = `Post with id ${post_id} is not your post.`;
    }
  } catch (error) {
    query_response.status = "400 Bad Request";
    query_response.message = error;
  }

  res.send(query_response);
});

router.put("/posts/:post_id/archive", _auth, async (req, res) => {
  let query_response = { status: "200 OK" };

  const user_id = res.locals.user_id;
  const post_id = req.params.post_id;
  const writer = await _query(`SELECT writer FROM Post WHERE id=${post_id}`);

  try {
    if (user_id === writer[0].writer) {
      let query = await _query(utils._select("Post", post_id));

      if (query.length == 0) {
        query_response.status = "204 No Content";
        query_response.message = `Post with id ${post_id} does not exists.`;
      } else {
        const prev = await _query(
          `SELECT archived FROM Post WHERE id=${post_id}`
        );
        await _query(
          `UPDATE Post SET archived=${
            (prev[0].archived + 1) % 2
          } WHERE id=${post_id}`
        );
        query_response.message = `Archived of post with id ${post_id} has been successfully updated.`;
      }
    } else {
      query_response.message = `Post with id ${post_id} is not your post.`;
    }
  } catch (error) {
    query_response.status = "400 Bad Request";
    query_response.message = error;
  }

  res.send(query_response);
});

module.exports = router;
