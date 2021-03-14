const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");

const app = express();
const API_PORT = process.env.API_PORT || 3000;
const API_HOST = process.env.API_HOST || "localhost";
const API_ROOT = "/api/v1/";

const user = require("./api/user/user");
const post = require("./api/post/post");
const comment = require("./api/comment/comment");
const file = require("./api/file/file");

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use(API_ROOT, user);
app.use(API_ROOT, post);
app.use(API_ROOT, comment);
app.use(API_ROOT, file);

app.listen(API_PORT, API_HOST, () => {
  console.log(`Clonestagram running at http://${API_HOST}:${API_PORT}`);
});
