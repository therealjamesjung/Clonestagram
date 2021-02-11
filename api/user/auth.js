const jwt = require("jsonwebtoken");
const config = require("../../config/config.json");

const _auth = (req, res, next) => {
  try {
    console.log(req.headers.authorization);
    req.decoded = jwt.verify(req.headers.authorization, config.SECRET_KEY);
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(419).json({
        status: 419,
        message: "Token has expired.",
      });
    }

    return res.status(401).json({
      status: 401,
      message: "Token is not valid.",
    });
  }
};

module.exports = _auth;
