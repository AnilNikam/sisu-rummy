const mongoose = require('mongoose');
const logger = require('../../logger');
const UserOtp = mongoose.model('userOtp');

module.exports.sendOTP = async (data) => {
  try {
    logger.info('sendOtp ->', data);
    //logger.info('sendOtp ->', client);
    let otp = '12345';

    let tempMobile = data.mobileNumber;

    const up = {
      $set: {
        mobileNumber: tempMobile,
        otp: otp,
        codeVerify: false,
      },
    };

    if (typeof data.newUser !== 'undefined' && data.newUser) {
      up['$set']['referralCode'] = data.referralCode || '';
      up['$set']['newUser'] = typeof data.newUser !== 'undefined' && data.newUser ? true : false;
    }
    //csl('sendOTP up :: ', up);

    let wh = {
      mobileNumber: tempMobile.toString(),
    };

    let otpDetails = await UserOtp.findOneAndUpdate(wh, up, {
      upsert: true,
      new: true,
    }).lean();
    //csl('sendOTP otpDetails :', otpDetails);

    otpDetails['SampleOTP'] = otpDetails.otp;
    return otpDetails;
  } catch (e) {
    //csl('sendOTP Exception : 1 ::', e);
    return false;
  }
};
