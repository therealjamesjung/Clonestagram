const express = require("express");
const router = express.Router();
const fs = require("fs");

const _query = require("../../database/db");
const middleware = require("../../utils/middleware");
const utils = require("../../utils/utils");

// Get stories posted by a specific user API
router.get("/stories/:user_id", middleware._auth, async (req, res) => {
  let query_response = {};

  const is_exist = await _query(
    `SELECT user_id FROM User WHERE user_id = '${req.params.user_id}';`
  );
  if (!is_exist.length) {
    res.status(400);
    query_response.message = `User with id '${req.params.user_id}' does not exists`;
    return res.send(query_response);
  }
  try {
    const story = await _query(
      `SELECT * FROM Story WHERE id in (SELECT story_id FROM File_Story WHERE file_id in 
        (SELECT id FROM File WHERE uploader = '${req.params.user_id}')) AND created_at > DATE_ADD(now(), INTERVAL -24 HOUR);`
    );
    if (story) {
      for (let i = 0; i < story.length; i++) {
        const file = await _query(
          `SELECT url FROM File WHERE id = (SELECT file_id FROM File_Story WHERE story_id = ${story[i].id});`
        );
        story[i].url = file[0].url;
      }
    }
    query_response.data = story;
  } catch (error) {
    res.status(400);
    query_response.data = error;
  }
  res.send(query_response);
});

// Post a story API
router.post("/stories", middleware._auth, async (req, res) => {
  let query_response = {};

  try {
    const file_id = await _query(
      `SELECT id FROM File WHERE url = '${req.body.url}';`
    );
    if (file_id.length == 0) {
      res.status(400);
      query_response.message = "The url does not exist.";
    } else {
      await _query(
        `INSERT INTO Story (writer) VALUES ('${res.locals.user_id}');`
      );
      const story_id = await _query(`SELECT MAX(id) as id FROM Story;`);
      await _query(
        `INSERT INTO File_Story (file_id, story_id) VALUES (${file_id[0].id}, ${story_id[0].id});`
      );
      const story = await _query(
        `SELECT writer, created_at FROM Story WHERE id = ${story_id[0].id};`
      );
      story[0].url = req.body.url;
      query_response.data = story;
    }
  } catch (error) {
    res.status(400);
    query_response.data = error;
  }
  res.send(query_response);
});

// Delete a story API
router.delete("/stories/:story_id", middleware._auth, async (req, res) => {
  let query_response = {};

  try {
    const story = await _query(
      `SELECT * FROM Story WHERE id = ${req.params.story_id};`
    );
    if (story.length == 0) {
      res.status(400);
      query_response.message = "The story does not exist.";
    } else {
      if (res.locals.user_id == story[0].writer) {
        const file_story = await _query(
          `SELECT * FROM File_Story WHERE story_id = ${req.params.story_id}`
        );
        const url = await _query(
          `SELECT url FROM File WHERE id = ${file_story[0].file_id}`
        );
        await _query(utils._delete("Story", file_story[0].story_id));
        await _query(utils._delete("File", file_story[0].file_id));
        fs.unlink("./uploads/" + url[0].url, (err) => {
          if (err) {
            query_response.data = err;
            return res.send(query_response);
          }
        });
        query_response.message = `You delete a story '${res.locals.user_id}/${url[0].url}' successfully.`;
      } else {
        res.status(400);
        query_response.message = "No authority.";
      }
    }
  } catch (error) {
    res.status(400);
    query_response.data = error;
  }
  res.send(query_response);
});

// Get list of users who have posted stories
router.get("/stories", middleware._auth, async (req, res) => {
  let query_response = {};

  try {
    query_response.data = await _query(
      `SELECT DISTINCT writer FROM Story JOIN User_User ON Story.writer = User_User.target_user AND request_user = '${res.locals.user_id}'
        WHERE Story.created_at > DATE_ADD(now(), INTERVAL -24 HOUR);`
    );
    my_story = await _query(
      `SELECT writer FROM Story WHERE writer = '${res.locals.user_id}' AND created_at > DATE_ADD(now(), INTERVAL -24 HOUR);`
    );
    if (my_story) {
      query_response.data.unshift(my_story[0]);
    }
  } catch (error) {
    res.status(400);
    query_response.data = error;
  }
  res.send(query_response);
});

module.exports = router;
