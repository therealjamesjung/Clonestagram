const express = require("express");
const router = express.Router();

const _query = require("../../database/db");
const middleware = require("../../utils/middleware");

router.get("/search", middleware._auth, async (req, res) => {
  let query_response = {};

  const search = req.query.search;

  try {
    query_response.data = await _query(
      `SELECT user_id, name FROM User WHERE user_id LIKE '%${search}%';`
    );
  } catch (error) {
    res.status(400);
    query_response.data = error;
  }
  res.send(query_response);
});

module.exports = router;
