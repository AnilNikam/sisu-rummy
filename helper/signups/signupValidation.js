const commandAcions = require('../socketFunctions');
const { OBJECT_ID } = require('../../config');

const CONST = require('../../constant');
const UserOtp = require('../../models/userOtp');
const smsActions = require('../sms');
const mongoose = require('mongoose');
const logger = require('../../logger');
const { userSesssionSet, filterBeforeSendSPEvent, getUserDefaultFields, saveGameUser, checkReferral } = require('./appStart');
const Users = mongoose.model('users');
const otpAdharkyc = mongoose.model('otpAdharkyc');
const axios = require('axios');
const commonHelper = require('../commonHelper');
const walletActions = require('../../helper/common-function/walletTrackTransaction');

const checkMobileNumber = async (requestData, socket) => {
  logger.info(' Signup validation Request Data ->', requestData);
  logger.info(' requestData.mobileNumber.length Data ->', requestData.mobileNumber.length);

  if (requestData.mobileNumber.length !== 10) {
    commandAcions.sendEvent(socket, CONST.CHECK_MOBILE_NUMBER, requestData, false, 'Please check mobile Number!');
    return false;
  }

  if (typeof requestData.loginType !== 'undefined' && requestData.loginType === CONST.LOGIN_TYPE.SIGNUP) {
    let wh = {
      mobileNumber: requestData.mobileNumber,
    };
    logger.info('checkMobileNumber wh ::', wh);

    let resp = await Users.findOne(wh, { username: 1, _id: 1 });
    logger.info('checkMobileNumber resp ::', resp);

    if (resp !== null) {
      commandAcions.sendEvent(socket, CONST.CHECK_MOBILE_NUMBER, requestData, false, 'Mobile Number already exists!');
    } else {
      commandAcions.sendEvent(socket, CONST.CHECK_MOBILE_NUMBER, { valid: true });
    }
  } else if (typeof requestData.loginType !== 'undefined' && requestData.loginType === CONST.LOGIN_TYPE.LOGIN) {
    let wh = {
      mobileNumber: requestData.mobileNumber,
    };
    logger.info('CONST.LOGIN_TYPE.LOGIN checkMobileNumber wh ::', wh);

    let resp = await Users.findOne(wh);
    logger.info('Login checkMobileNumber resp ::', resp);

    if (resp) {
      commandAcions.sendEvent(socket, CONST.CHECK_MOBILE_NUMBER, { valid: true });
      //await userLogin(requestData, socket);
    } else {
      commandAcions.sendEvent(socket, CONST.CHECK_MOBILE_NUMBER, requestData, false, 'Mobile Number not register!');
    }
  } else {
    commandAcions.sendEvent(socket, CONST.CHECK_MOBILE_NUMBER, requestData, false, 'Enter Valid mobile Number!');
  }
  return true;
};

const checkReferalOrCouponCode = async (requestData, socket) => {
  if (requestData.code.length !== 0 && requestData.code.length <= 10) {
    let wh = {
      rfc: requestData.code.toLowerCase(),
    };

    let resp = await Users.findOne(wh, { username: 1, _id: 1 });
    //csl('checkReferalOrCouponCode resp ::', resp);
    if (resp !== null) {
      let response = { valid: true, msg: 'Congrats! Referral Code Valid' };
      commandAcions.sendEvent(socket, CONST.CHECK_REFERAL_CODE, response);
    } else {
      commandAcions.sendEvent(socket, CONST.CHECK_REFERAL_CODE, requestData, false, 'Enter valid referral!');
    }
  } else {
    commandAcions.sendEvent(socket, CONST.CHECK_REFERAL_CODE, requestData, false, 'Enter valid referral!');
  }
  return true;
};

const userLogin = async (requestData, socket) => {
  if (requestData.mobileNumber.length !== 10) {
    commandAcions.sendEvent(socket, CONST.LOGIN, requestData, false, 'Please check mobile Number!');
    return false;
  }

  let wh = {
    mobileNumber: requestData.mobileNumber,
  };
  //  csl('F wh :', wh);

  let resp = await Users.findOne(wh, {});
  logger.info('LOGIN resp :', resp);

  if (resp !== null) {
    // eslint-disable-next-line no-unused-vars
    //let otpsend = await smsActions.sendOTP(requestData, socket);
    //csl('LOGIN Otp Send :: ', JSON.stringify(otpsend));
    //let response = { mobileNumber: requestData.mobileNumber, status: true };

    await userSesssionSet(resp, socket);

    let response = await filterBeforeSendSPEvent(resp);

    commandAcions.sendEvent(socket, CONST.DASHBOARD, response);
  } else {
    commandAcions.sendEvent(socket, CONST.LOGIN, requestData, false, 'Mobile number not register!');
  }
  return true;
};

const userSignup = async (requestData_, socket) => {
  let requestData = requestData_;
  if (requestData.mobileNumber.length !== 10) {
    commandAcions.sendEvent(socket, CONST.SIGNUP, requestData, false, 'Please check mobile Number!');
    return false;
  }

  let wh = {
    mobileNumber: requestData.mobileNumber,
  };
  //  logger.info('userSignup wh :', wh);

  let resp = await Users.findOne(wh, { username: 1, _id: 1 });
  //  logger.info('userSignup resp :', resp);

  if (resp === null) {
    requestData.new_user = true;
    // eslint-disable-next-line no-unused-vars
    let otpsend = await smsActions.sendOTP(requestData, socket);
    //logger.info('userSignup Otp Send :: ', JSON.stringify(otpsend));

    let response = { mobileNumber: requestData.mobileNumber, status: true };
    commandAcions.sendEvent(socket, CONST.REGISTER_USER, response);
  } else {
    commandAcions.sendEvent(socket, CONST.REGISTER_USER, requestData, false, 'Mobile Number already register!');
  }
  return true;
};

const verifyOTP = async (requestData_, socket) => {
  let requestData = requestData_;
  if (requestData.mobileNumber.length !== 10) {
    commandAcions.sendEvent(socket, CONST.VERIFY_OTP, requestData, false, 'Please check mobile Number!');
    return false;
  }

  let mobileNumberRd = requestData.mobileNumber;

  let wh = {
    mobileNumber: mobileNumberRd,
    otp: Number(requestData.otp),
    codeVerify: false,
  };

  let otpData = await UserOtp.findOne(wh, {});
  //  csl('\nverifyOTP otpData : ', wh, otpData);

  if (otpData !== null) {
    await UserOtp.updateOne(
      {
        _id: otpData._id,
      },
      {
        $set: {
          codeVerify: true,
        },
      },
      {}
    );
    requestData['codeVerify'] = true;
    commandAcions.sendEvent(socket, CONST.VERIFY_OTP, requestData);
  } else {
    commandAcions.sendEvent(socket, CONST.VERIFY_OTP, requestData, false, 'Incorrect OTP');
  }
  return true;
};

const resendOTP = async (requestData_, socket) => {
  let requestData = requestData_;
  if (requestData.mobileNumber.length !== 10) {
    commandAcions.sendEvent(socket, CONST.RESEND_OTP, requestData, false, 'Please check mobile Number!');
    return false;
  }

  let mobileNumberRd = requestData.mobileNumber;

  let wh = {
    mobileNumber: mobileNumberRd,
    codeVerify: false,
  };

  let otpData = await UserOtp.findOne(wh, {});
  //  csl('\nresendOTP otpData : ', wh, otpData);

  if (otpData !== null) {
    requestData.reSend = true;
    await smsActions.sendOTP(requestData, socket);
    let response = { mobileNumber: requestData.mobileNumber, status: true };
    commandAcions.sendEvent(socket, CONST.RESEND_OTP, response);
  } else {
    commandAcions.sendEvent(socket, CONST.RESEND_OTP, requestData, false, 'Enter Valid mobile Number!');
  }
  return true;
};

const updateMobileNumber = async (requestData, socket) => {
  if (requestData.mobileNumber.length !== 10) {
    commandAcions.sendEvent(socket, CONST.LOGIN, requestData, false, 'Please check mobile Number!');
    return false;
  }

  let wh = {
    mobileNumber: requestData.mobileNumber,
  };

  let resp = await Users.findOne(wh, {});
  logger.info('LOGIN resp :', resp);

  if (resp !== null) {

    const updateData = {
      $set: {
        mobileNumber: requestData.updateMobileNumber,
      },
    };

    const result = await Users.findOneAndUpdate(upWh, updateData, {
      new: true,
    });
    commandAcions.sendEvent(socket, CONST.EDIT_MOBILE, result);
  } else {
    commandAcions.sendEvent(socket, CONST.EDIT_MOBILE, requestData, false, 'Mobile number not Find!');
  }
  return true;
};
/**
 * @description Register user for New Game
 * @param {Object} requestBody
 * @returns {Object}{ status:0/1, message: '', data: Response }
 */
const registerUser = async (requestBody, socket) => {
  try {
    logger.info('Register User Request Body =>', requestBody);
    const { mobileNumber, loginType, deviceId /*, email */ } = requestBody;
    if (loginType === 'Mobile') {
      let query = { mobileNumber: mobileNumber };
      let result = await Users.findOne(query, {});
      if (!result) {
        let defaultData = await getUserDefaultFields(requestBody, socket);
        logger.info('registerUser defaultData : ', defaultData);

        let userInsertInfo = await saveGameUser(defaultData, socket);
        logger.info('registerUser userInsertInfo : ', userInsertInfo);

        let userData = userInsertInfo;

        await walletActions.addWalletBonusDeposit(userData._id.toString(), Number(50), 'Credit', 'SingUp Bonus');

        await userSesssionSet(userData, socket);

        let response = await filterBeforeSendSPEvent(userData);

        commandAcions.sendEvent(socket, CONST.DASHBOARD, response);

        if (requestBody.referralCode != "") {
          await checkReferral({ referralCode: requestBody.referralCode, userId: userInsertInfo._id }, socket)
        }
      } else {
        commandAcions.sendEvent(socket, CONST.DASHBOARD, requestBody, false, 'User Already Register!');
        return false;
      }
    } else if (loginType === 'Google') {
      let query = { email: requestBody.email.toString() };
      let result = await Users.findOne(query, {});
      if (!result) {
        let defaultData = await getUserDefaultFields(requestBody, socket);

        let userInsertInfo = await saveGameUser(defaultData, socket);

        let userData = userInsertInfo;

        await userSesssionSet(userData, socket);

        let response = await filterBeforeSendSPEvent(userData);
        commandAcions.sendEvent(socket, CONST.DASHBOARD, response);
      } else {
        await userSesssionSet(result, socket);

        let response = await filterBeforeSendSPEvent(result);
        commandAcions.sendEvent(socket, CONST.DASHBOARD, response);
        //commandAcions.sendEvent(socket, CONST.DASHBOARD, requestBody, false, 'User Already Register!');
        //return;
      }
    } else if (loginType === 'Guest') {
      let query = { deviceId: deviceId.toString() };
      let result = await Users.findOne(query, {});
      if (result) {
        await userSesssionSet(result, socket);

        let response = await filterBeforeSendSPEvent(result);
        commandAcions.sendEvent(socket, CONST.DASHBOARD, response);
      } else {
        let defaultData = await getUserDefaultFields(requestBody, socket);

        let userInsertInfo = await saveGameUser(defaultData, socket);

        let userData = userInsertInfo;

        await walletActions.addWalletBonusDeposit(userData._id.toString(), Number(50), 'Credit', 'SingUp Bonus');


        await userSesssionSet(userData, socket);

        let response = await filterBeforeSendSPEvent(userData);
        commandAcions.sendEvent(socket, CONST.DASHBOARD, response);
      }
    }
  } catch (error) {
    logger.error('mainController.js registerUser error=> ', error);
    return {
      message: 'something went wrong while registering, please try again',
      status: 0,
    };
  }
};


/**
 * @description OKYCRequest
 * @param {Object} {customer_aadhaar_number : "" ,playerId }
 * @returns {Object}{ status:0/1, message: '', data: Response }
 */
const OKYCRequest = async (requestBody, socket) => {
  try {
    let okyc = {
      userId: OBJECT_ID(requestBody.playerId.toString()),
      adharcard: requestBody.customer_aadhaar_number,
      verified: false,
    }

    const isverified = await otpAdharkyc.find({ userId: commonHelper.strToMongoDb(requestBody.playerId.toString()) }, {})
    const findadharcard = await otpAdharkyc.find({ adharcard: requestBody.customer_aadhaar_number }, {})


    console.log("isverified ", isverified)


    var task_id;
    if (isverified.length == 0) {
      insertRes = await otpAdharkyc.create(okyc);
      task_id = insertRes._id.toString()
    } else {
      task_id = isverified[0]._id.toString()
    }
    console.log("findadharcard[0].userId ", findadharcard)
    console.log("isverified[0].userId.toString() ", isverified)

    if (findadharcard.length != 0 && isverified,length != 0&& findadharcard[0].userId.toString() != isverified[0].userId.toString()) {
      commandAcions.sendEvent(socket, CONST.CHECK_KYC_ADHARA_NUMBER, { success: 0, msg: "Fail", status: "001", statusText: "Already Adharcad Use ...!!!" });

      return false;
    }

    console.log("task_id ", task_id)

    var body = {
      "data": {
        "customer_aadhaar_number": requestBody.customer_aadhaar_number,
        "consent": "Y",
        "consent_text": "I hear by declare my consent agreement for fetching my information via ZOOP API"
      },
      "task_id": task_id
    }

    // var options = {
    //   'method': 'POST',
    //   'url': 'https://test.zoop.one/in/identity/okyc/otp/request',
    //   'headers': {
    //     "app-id": "63b6927ed78829001d9aa71c",
    //     "api-key": "ABW7D06-QGCM6AT-J1TK17G-AFXZ5GH",
    //     "org-id": "60800ca35ed0c7001cad2605",
    //     "Content-Type": "application/json"
    //   },
    //   body: body
    // };


    const payload = body

    const response = await axios.post('https://test.zoop.one/in/identity/okyc/otp/request', payload, {
      'headers': {
        "app-id": "63b6927ed78829001d9aa71c",
        "api-key": "ABW7D06-QGCM6AT-J1TK17G-AFXZ5GH",
        "org-id": "60800ca35ed0c7001cad2605",
        "Content-Type": "application/json"
      }
    });


    console.log("response::::::::::::::::::", response.data);

    if (response.data.success) {
      commandAcions.sendEvent(socket, CONST.CHECK_KYC_ADHARA_NUMBER, { request_id: response.data.request_id, success: 1, msg: "Successful", status: response.data.response_code, statusText: response.data.response_message });
      return false;
    } else {
      commandAcions.sendEvent(socket, CONST.CHECK_KYC_ADHARA_NUMBER, { request_id: response.data.request_id, success: 1, msg: "Successful", status: response.data.response_code, statusText: response.data.response_message });

    }



  } catch (error) {
    console.log('mainController.js OKYCRequest error=> ', error);
    if (error.response)
      commandAcions.sendEvent(socket, CONST.CHECK_KYC_ADHARA_NUMBER, { success: 0, msg: "Fail", status: error.response.data.response_code, statusText: error.response.data.response_message });
    else {
      commandAcions.sendEvent(socket, CONST.CHECK_KYC_ADHARA_NUMBER, { success: 0, msg: "Fail", status: error.response.data.response_code, statusText: error.response.data.response_message });

    }
  }
};


/**
 * @description OKYCVERIFY
 * @param {Object} {customer_aadhaar_number : "" ,playerId:"",otp:"",request_id:"" }
 * @returns {Object}{ status:0/1, message: '', data: Response }
 */
const OKYCverifyRequest = async (requestBody, socket) => {
  try {


    var body = {
      "data": {
        "request_id": requestBody.request_id,
        "otp": requestBody.otp,
        "consent": "Y",
        "consent_text": "I hear by declare my consent agreement for fetching my information via ZOOP API"
      },
      "task_id": "6270e9c2f5419a2153744f5a"
    }

    const response = await axios.post('https://test.zoop.one/in/identity/okyc/otp/verify', body, {
      'headers': {
        "app-id": "63b6927ed78829001d9aa71c",
        "api-key": "ABW7D06-QGCM6AT-J1TK17G-AFXZ5GH",
        "org-id": "60800ca35ed0c7001cad2605",
        "Content-Type": "application/json"
      }
    });
    console.log("response.data ::::::::::::", response.data)
    if (response.data.success) {
      await otpAdharkyc.updateOne(
        {
          userId: OBJECT_ID(requestBody.playerId.toString()),
        },
        {
          $set: {
            verified: true,
            userInfo: response.data.result
          },
        },
        {}
      );

      commandAcions.sendEvent(socket, CONST.VERIFY_KYC_ADHARA_NUMBER, { success: 1, msg: "Successful", status: response.data.response_code, statusText: response.data.response_message });
      return false;
    } else {
      commandAcions.sendEvent(socket, CONST.VERIFY_KYC_ADHARA_NUMBER, { success: 0, msg: "Fail", status: response.data.response_code, statusText: response.data.response_message });
    }
  } catch (error) {
    console.log('mainController.js OKYCRequest error=> ', error);

    if (error.response)
      commandAcions.sendEvent(socket, CONST.VERIFY_KYC_ADHARA_NUMBER, { success: 0, msg: "Fail", status: error.response.data.response_code, statusText: error.response.data.response_message });
    else {
      commandAcions.sendEvent(socket, CONST.VERIFY_KYC_ADHARA_NUMBER, { success: 0, msg: "Fail", status: error.response.data.response_code, statusText: error.response.data.response_message });

    }

  }
};


/**
 * @description OKYCPanverifyRequest
 * @param {Object} {playerId:"",pancard : "" ,Pancardname:"",pancardfrontimages:"",pancardbackimages:"" }
 * @returns {Object}{ status:0/1, message: '', data: Response }
 * 
 *  pancard:{ type: String, default: '' },
    pancardname:{ type: String, default: '' },
    pancardverified:{ type: Boolean, default: false },
    panInfo:{},
    pancardfrontimages:{ type: String, default: '' },
    pancardbackimages:{ type: String, default: '' },  

 */
const OKYCPanverifyRequest = async (requestBody, socket) => {
  try {


    var body = {

      "mode": "sync",
      "data": {
        "customer_pan_number": requestBody.pancard,
        "pan_holder_name": requestBody.pancardname,
        "consent": "Y",
        "consent_text": "I consent to this information being shared with zoop.one"
      }
    }

    const response = await axios.post('https://test.zoop.one/api/v1/in/identity/pan/lite', body, {
      'headers': {
        "app-id": "63b6927ed78829001d9aa71c",
        "api-key": "ABW7D06-QGCM6AT-J1TK17G-AFXZ5GH",
        "org-id": "60800ca35ed0c7001cad2605",
        "Content-Type": "application/json"
      }
    });
    console.log("response.data ::::::::::::", response.data)
    if (response.data.success) {
      await otpAdharkyc.updateOne(
        {
          userId: OBJECT_ID(requestBody.playerId.toString()),
        },
        {
          $set: {
            pancardverified: true,
            panInfo: response.data.result
          },
        },
        {}
      );

      commandAcions.sendEvent(socket, CONST.VERIFY_KYC_PAN_CARD, { success: 1, msg: "Successful", status: response.data.response_code, statusText: response.data.response_message });
      return false;
    } else {
      commandAcions.sendEvent(socket, CONST.VERIFY_KYC_PAN_CARD, { success: 0, msg: "Fail", status: response.data.response_code, statusText: response.data.response_message });
    }
  } catch (error) {
    console.log('mainController.js OKYCRequest error=> ', error);

    if (error.response)
      commandAcions.sendEvent(socket, CONST.VERIFY_KYC_PAN_CARD, { success: 0, msg: "Fail", status: error.response.data.response_code, statusText: error.response.data.response_message });
    else {
      commandAcions.sendEvent(socket, CONST.VERIFY_KYC_PAN_CARD, { success: 0, msg: "Fail", status: error.response.data.response_code, statusText: error.response.data.response_message });

    }

  }
};



module.exports = {
  checkMobileNumber,
  checkReferalOrCouponCode,
  userLogin,
  userSignup,
  verifyOTP,
  resendOTP,
  registerUser,
  OKYCRequest,
  OKYCverifyRequest,
  OKYCPanverifyRequest
};
