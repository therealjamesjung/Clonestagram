const express = require("express");
const router = express.Router();

const _query = require("../../database/db");
const middleware = require("../../utils/middleware");

// Search users API
router.get("/search", middleware._auth, async (req, res) => {
  let query_response = {};

  const search = req.query.search;
  const user = res.locals.user_id;

  try {
    const result = await _query(
      `SELECT user_id, name FROM User WHERE user_id LIKE '%${search}%' AND user_id != '${user}' AND is_private = 0;;`
    );
    const is_private = await _query(
      `SELECT user_id, name FROM User WHERE user_id LIKE '%${search}%' AND user_id != '${user}' AND is_private = 1;`
    );
    for (i = 0; i < is_private.length; i++) {
      const follower = await _query(
        `SELECT * FROM User_User WHERE target_user = '${is_private[i].user_id}' AND request_user = '${user}' AND accepted = 1;`
      );
      if (follower.length) {
        result.push(is_private[i]);
      }
    }
    query_response.data = result;
  } catch (error) {
    res.status(400);
    query_response.data = error;
  }
  res.send(query_response);
});

module.exports = router;
