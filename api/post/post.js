const express = require("express");
const router = express.Router();

const _query = require("../../database/db");

router.use((req, res, next) => {
  // Middleware goes here
  console.log(`${req.method}  ${req.ip} requested on ${req.path}`);
  next();
});

router.get("/posts", async (req, res) => {
  let query_response = { status: "200 OK" };

  try {
    query_response.data = await _query("SELECT * FROM Post;");
  } catch (error) {
    query_response.status = "400 Bad Request";
    query_response.message = error;
  }

  res.send(query_response);
});

module.exports = router;
