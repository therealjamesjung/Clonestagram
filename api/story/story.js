const express = require("express");
const router = express.Router();
const fs = require("fs");

const _query = require("../../database/db");
const _auth = require("../../utils/middleware");
const utils = require("../../utils/utils");

router.use((req, res, next) => {
  console.log(`${req.method}  ${req.ip} requested on ${req.path}`);
  next();
});

router.get("/stories/:user_id/:url", async (req, res) => {
  let query_response = {};

  try {
    const story = await _query(
      `SELECT * FROM Story WHERE id in (SELECT story_id FROM File_Story WHERE file_id in 
        (SELECT id FROM File WHERE uploader = '${req.params.user_id}' AND url = '${req.params.url}'));`
    );
    if (story.length == 0) {
      res.status(400);
      query_response.message = "The story does not exist.";
      res.send(query_response);
    } else {
      fs.readFile("./uploads/" + req.params.url, (err, content) => {
        if (err) {
          res.status(400);
          query_response.data = err;
        }
        //query_response.data = story;
        res.end(content);
      });
    }
  } catch (error) {
    res.status(400);
    query_response.data = error;
    res.send(query_response);
  }
});

router.post("/stories", _auth, async (req, res) => {
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

router.delete("/stories/:story_id", _auth, async (req, res) => {
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
        await _query(utils._delete("File_Story", file_story[0].id));
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

module.exports = router;
