var jwt_decode = require("jwt-decode");

exports.getCurrentUser = req => {
  try {
    var token = req.headers["authorization"];
    var decoded = jwt_decode(token);
    if (decoded) return decoded;
  } catch (e) {}
};
