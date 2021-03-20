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
      `SELECT * FROM Story JOIN File ON story.file_id = file.id AND uploader = '${req.params.user_id}' AND url = '${req.params.url}';`
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
        `INSERT INTO Story (writer, file_id) VALUES ('${res.locals.user_id}', ${file_id[0].id});`
      );
      query_response.data = req.body;
    }
  } catch (error) {
    res.status(400);
    query_response.data = error;
  }
  res.send(query_response);
});

router.delete("/stories/:user_id/:url", _auth, async (req, res) => {
  let query_response = {};

  try {
    const story = await _query(
      `SELECT Story.id, Story.file_id FROM Story JOIN File ON story.file_id = file.id AND uploader = '${req.params.user_id}' AND url = '${req.params.url}';`
    );
    if (story.length == 0) {
      res.status(400);
      query_response.message = "The story does not exist.";
    } else {
      if (res.locals.user_id == req.params.user_id) {
        await _query(utils._delete("Story", story[0].id));
        await _query(utils._delete("File", story[0].file_id));
        fs.unlink("./uploads/" + req.params.url, (err) => {
          if (err) {
            query_response.data = err;
            return res.send(query_response);
          }
        });
        query_response.message = `You delete a story '${req.params.user_id}/${req.params.url}' successfully.`;
      } else {
        res.status(400);
        query_response.message = "No authority.";
      }
    }
  } catch (error) {
    res.status(400);
    query_response.data = error;
    res.send(query_response);
  }
  res.send(query_response);
});

module.exports = router;
