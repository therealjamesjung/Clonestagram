const jwt = require("jsonwebtoken");

const _auth = (req, res, next) => {
  try {
    req.decoded = jwt.verify(req.headers.authorization, process.env.SECRET_KEY);

    if (req.decoded) {
      res.locals.user_id = req.decoded.user_id;
      return next();
    }
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
