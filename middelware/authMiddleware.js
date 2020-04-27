const userModel = require('../api/pg/auth/auth.model');
const tokenHelper = require('../helpers/tokenHelper');

module.exports = async (req, res, next) => {
  // check authorization header or url parameters or post parameters for AccessToken
  const token = req.get('Authorization') || req.body.token;

  if (!token) {
    return res.status(401).send({ message: 'Permission denied.' });
  }

  // decode, verifies AccessToken's validity
  await tokenHelper.verifyAsync(token, async function(error, decoded) {
    if (error) {
      /**
      * name: 'TokenExpiredError' | 'JsonWebTokenError' ...
      * message: 'jwt expired' | 'jwt malformed' | NotBeforeError ...
      * expiredAt: [ExpDate]
      */
      return res.status(401).send({
        success: false,
        type: error.name,
        message: error.message
      });
    } else {
      let result;
      try {
        result = await userModel.getByIdUnfiltred(decoded);
      } catch (e) {}

      if (result && result.rows.length > 0) {
        if (
            (result && result.rows[0].job_type === 'Driver') ||
            (result && result.rows[0].job_type === 'Enforcer') ||
            (result && result.rows[0].job_type === 'Enforcer-Driver')
        ) {

          // Request from the same mobile
          if (
              decoded.mobileIMEI && decoded.mobileIMEI === result.rows[0].mobile_imei &&
              decoded.loginId && decoded.loginId === result.rows[0].login_id
          ) {
            req._user = result.rows[0];
            next();

          // Request from browser
          } else if (decoded.mobileIMEI === undefined && decoded.loginId === undefined) {
            req._user = result.rows[0];
            next();

          } else {
            return res.status(401).send({
              success: false,
              code: -1,
              message: 'Unauthorized request. You are logged in elsewhere!'
            });
          }
        } else {
          req._user = result.rows[0];
          next();
        }

      } else {
        return res.status(401).send({
          success: false,
          code: -2,
          message: 'Unauthorized request. Your account no longer exists!'
        });
      }
    }
  });
};
