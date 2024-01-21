const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = function (req, res, next) {
  // console.log('req.body => ', req.body);
  // console.log('req.headers => ', req.headers);

  try {
    // throw "error"
    const token = req.headers.token || req.body.token || req.query.token;
    //console.log('token => ', token);
    //console.log('req.headers => ', req.headers);

    if (token) {
      jwt.verify(token, config.SECRET_KEY, function (err, decoded) {
        // console.log('decoded => ', decoded);

        if (err) {
          return res.status(config.UNAUTHORIZED).json({
            message: err.message,
          });
        } else {
          // eslint-disable-next-line no-param-reassign
          req.decoded = decoded;
          next();
        }
      });
    } else {
      return res.status(config.UNAUTHORIZED).json({
        message: 'Unauthorized access',
      });
    }
  } catch (error) {
    return res.status(config.INTERNAL_SERVER_ERROR).json({
      message: 'Something went wrong! please check header params',
      error,
    });
  }
};
// I'll try Git Code
