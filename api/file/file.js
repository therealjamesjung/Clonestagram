const express = require("express");
const router = express.Router();
const multer = require("multer");

const _query = require("../../database/db");
const middleware = require("../../utils/middleware");

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  let typeArray = file.mimetype.split("/");
  let fileType = typeArray[1];
  if (
    fileType == "jpg" ||
    fileType == "png" ||
    fileType == "jpeg" ||
    fileType == "mp4"
  ) {
    cb(null, true);
  } else {
    req.fileValidationError = "only jpg, png and mp4 are allowed";
    cb(null, false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

router.post(
  "/uploadFiles",
  middleware._auth,
  upload.array("files", 10),
  async (req, res, next) => {
    let query_response = {};

    if (req.fileValidationError) {
      res.status(400);
      query_response.message = req.fileValidationError;
      return res.send(query_response);
    }
    try {
      let url = [];
      for (let i = 0; i < req.files.length; i++) {
        await _query(
          `INSERT INTO File (filename, type, size, url, uploader)
          VALUES ('${req.files[i].originalname}','${req.files[i].mimetype}',${req.files[i].size},'${req.files[i].filename}','${res.locals.user_id}');`
        );
        url[i] = req.files[i].filename;
      }
      query_response.data = url;
    } catch (error) {
      res.status(400);
      query_response.data = error;
    }
    query_response.message = "The file has been uploaded successfully.";
    res.send(query_response);
  }
);

router.get("/files", async (req, res) => {
  let query_response = {};
  query_response.data = await _query("SELECT * from File");

  res.send(query_response);
});

module.exports = router;
