var jwt = require("jsonwebtoken");
var config = require("../config/database");
var userModel = require("../api/pg/auth/auth.model");

module.exports = (req, res, next) => {
  // check header or url parameters or post parameters for token
  var token = req.get("Authorization") || req.body.token;
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, config.secret, async function(error, decoded) {
      if (error) {
        if (error.name == "TokenExpiredError") {
          return res.status(401).send({
            success: false,
            message: error.message
          });
        }
      } else {
        try {
          var result = await userModel.getByIdUnfiltred(decoded);
        } catch (e) {}
        if (
          result &&
          result.rows.length > 0 &&
          decoded.login_id &&
          result.rows[0].login_id == decoded.login_id
        ) {
          // if everything is good, save to request for use in other routes
          req._user = result.rows[0];
          next();
        } else {
          if (
            (result && result.rows[0].usertype == "Driver") ||
            result.rows[0].usertype == "Enforcer"
          ) {
            return res.status(401).send({
              code: -1,
              message: "Unauthorized request. You are logged in elsewhere."
            });
          } else {
            req._user = result.rows[0];
            next();
          }
        }
      }
    });
  } else {
    // if there is no token
    // return an error
    return res.status(401).send({
      message: "Permission denied."
    });
  }
};
