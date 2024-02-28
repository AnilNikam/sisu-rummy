const { checkMobileNumber, OKYCRequest, OKYCverifyRequest, checkReferalOrCouponCode, userLogin, userSignup, verifyOTP, resendOTP, updateMobileNumber, OKYCPanverifyRequest } = require('./signupValidation');
const { appLunchDetails } = require('./appStart');

module.exports = {
  checkMobileNumber: checkMobileNumber,
  OKYCRequest: OKYCRequest,
  OKYCverifyRequest: OKYCverifyRequest,
  OKYCPanverifyRequest: OKYCPanverifyRequest,
  checkReferalOrCouponCode: checkReferalOrCouponCode,
  userLogin: userLogin,
  userSignup: userSignup,
  verifyOTP: verifyOTP,
  resendOTP: resendOTP,
  appLunchDetail: appLunchDetails,
  updateMobileNumber: updateMobileNumber
};
