const { checkMobileNumber,OKYCRequest, checkReferalOrCouponCode, userLogin, userSignup, verifyOTP, resendOTP } = require('./signupValidation');
const { appLunchDetails } = require('./appStart');

module.exports = {
  checkMobileNumber: checkMobileNumber,
  OKYCRequest:OKYCRequest,
  checkReferalOrCouponCode: checkReferalOrCouponCode,
  userLogin: userLogin,
  userSignup: userSignup,
  verifyOTP: verifyOTP,
  resendOTP: resendOTP,
  appLunchDetail: appLunchDetails,
};
