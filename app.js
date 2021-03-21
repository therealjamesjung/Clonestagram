const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");

const app = express();
const API_PORT = process.env.API_PORT || 3000;
const API_HOST = process.env.API_HOST || "localhost";
const API_ROOT = "/api/v1/";

const auth = require("./api/user/auth");
const user = require("./api/user/user");
const post = require("./api/post/post");
const comment = require("./api/comment/comment");
const file = require("./api/file/file");
const story = require("./api/story/story");

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use(API_ROOT, auth);
app.use(API_ROOT, user);
app.use(API_ROOT, post);
app.use(API_ROOT, comment);
app.use(API_ROOT, file);
app.use(API_ROOT, story);

app.use(API_ROOT + "uploads", express.static(__dirname + `/uploads`));

app.listen(API_PORT, API_HOST, () => {
  console.log(`Clonestagram running at http://${API_HOST}:${API_PORT}`);
});
