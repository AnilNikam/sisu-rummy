const bcrypt = require('bcrypt');
const { omit } = require('lodash');
const axios = require('axios');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;

const Admin = mongoose.model('admin');
const Users = mongoose.model('users');
const Wallet = mongoose.model('wallets');
const OtpEmail = mongoose.model('otpEmail');
const BetLists = mongoose.model('betLists');
const OtpMobile = mongoose.model('otpMobile');
const Friend = mongoose.model('friends');
const otpAdharkyc = mongoose.model('otpAdharkyc');
const BankDetails = mongoose.model('bankDetails');
const WalletTrackTransaction = mongoose.model('walletTrackTransaction');


const config = require('../config');
const CONST = require('../constant');
const logger = require('../logger');

const usersHelper = require('../helper/usersHelper');
const commonHelper = require('../helper/commonHelper');
const { stat } = require('fs');
// const BankDetails = require('../models/bankDetails');

/**
 * @description  User Sign In
 * @param {Object} requestBody
 * @return - {message:"response Message", status: 1, data?:{}}
 */
async function logIn(requestBody = {}) {
  // logger.info('request Body LogIn in => ', requestBody);
  // logger.info('condition in login => ', condition);
  const { email } = requestBody;
  // logger.info('email => ', email, '\npassword => ', password, '\nrequestBody password => ', requestBody.password);

  try {
    const userData = await Users.findOne({ email }).lean();
    // logger.info('login userData => ', userData);
    if (userData !== null) {
      const result = await bcrypt.compare(requestBody.password, userData.password);
      // logger.info('login result => ', result);

      if (result) {
        const rest = omit(userData, ['lastLoginDate', 'createdAt', 'modifiedAt', 'password', 'flags', 'coins', 'winningChips']);

        // logger.info('ML rest => ', rest);
        const userWallet = await Wallet.findOne({
          userId: userData._id.toString(),
        }).lean();
        logger.info('ML userWallet => ', userWallet);
        const { balance /*, winningAmount */ } = userWallet;

        const finaldata = {
          ...rest,
          userWalletData: {
            balance: Number(balance.toFixed(2)),
          } /* { balance, winningAmount  } */,
        };

        // logger.info('Final =====> Log In final Data => ', finaldata);
        return { status: 1, message: 'Login Succesfully', data: finaldata };
      } else {
        return { status: 0, message: 'Id not Found' };
      }
    } else {
      logger.info('At mainController.js:108 User not found => ', JSON.stringify(requestBody));
      return { status: 0, message: 'Id not Found' };
    }
  } catch (error) {
    logger.error('mainController.js logIn error=> ', error, requestBody);
    return { status: 0, message: 'No data found' };
  }
}

/**
 * @description  Auto Login
 * @param {Object} requestBody
 * @return - {message:"response Message", status: 1, data?:{}}
 */
async function autoLogin(requestBody) {
  try {
    // console.info('Auto Login Request Body data => ', requestBody);
    const responseID = await usersHelper.autologin(Users, requestBody);
    if (responseID.data) {
      delete responseID.data.password;

      // const token = await commonHelper.sign(responseID);
      if (responseID.status === 1 && responseID.data !== null) {
        const rest = omit(responseID.data, ['lastLoginDate', 'createdAt', 'modifiedAt', 'flags', 'coins', 'winningChips']);

        const userWalletData = await Wallet.findOne({
          userId: responseID.data._id.toString(),
        }).lean();

        const { balance /*, winningAmount */ } = userWalletData;

        const finalResponse = {
          ...rest,
          userWalletData: {
            balance: Number(balance.toFixed(2)) /*, winningAmount */,
          },
        };

        return {
          status: 1,
          message: ' Auto Login Succesfully',
          data: finalResponse,
        };
      } else {
        return { status: 0, message: 'No data found' };
      }
    } else {
      logger.info('At mainController.js:153 User not found => ', JSON.stringify(requestBody));
      return { status: 0, message: 'No data found' };
    }
  } catch (error) {
    logger.error('mainController.js autoLogin error=> ', error, requestBody);
    return {
      message: 'something went wrong while Signing In, please try again',
      status: 0,
    };
  }
}

/**
 * @description  profile Find
 * @param {Object} requestBody
 * @return - {message:"response Message", status: 1, data?:{}}
 */

async function findProfile(requestBody) {
  const { deviceId } = requestBody;
  const condition = { deviceId };
  // console.info('condition => ', condition);
  try {
    const user = await Users.findOne(condition);
    logger.info('mainController.js findProfile user => ', user);

    return user;
  } catch (error) {
    logger.error('mainController.js findProfile error=> ', error, requestBody);
    return {
      message: 'something went wrong while Find Profile, please try again',
      status: 0,
    };
  }
}

/**
 * @description  Update Coin
 * @param {Object} requestData
 * @return - {message:"response Message", status: 1, data?:{}}
 */
async function updateCoin(requestData) {
  //logger.info("request Data========>", requestData);
  const { coins, playerId } = requestData;
  const condition = { userId: commonHelper.strToMongoDb(playerId) };
  // logger.info('Update Coin Condition => ', condition);

  const newData = {
    coins,
    modifiedAt: Date.now(),
  };
  try {
    const responseData = await commonHelper.update(Wallet, condition, newData);
    //logger.info('responseData => ', responseData);

    if (responseData.status === 1) {
      delete responseData.data.password;
      return { message: 'Update Coin', status: 1, data: responseData.data };
    } else {
      return { message: 'Not Update Coin', status: 0 };
    }
    // return responseData
  } catch (error) {
    logger.error('mainController.js updateCoin error=> ', error, requestData);
    return {
      message: 'something went wrong while Data update, please try again',
      status: 0,
    };
  }
}

/**
 * @description  playerDetails Find
 * @param {Object} requestBody
 * @return - {message:"response Message", status: 1, data?:{}}
 */

async function playerDetails(requestBody) {
  logger.info('playerDetails request Body---->', requestBody);
  try {
    const { playerId } = requestBody;
    // const user = await Users.findOne({ condition }).lean();
    const user = await Users.findOne({ _id: commonHelper.strToMongoDb(playerId) }).lean();
    //logger.info('mainController.js playerDetails => ', user);
    const userBankDetails = await BankDetails.findOne({ userId: commonHelper.strToMongoDb(playerId) }).lean();
    logger.info('mainController.js userBankDetails => ', userBankDetails);

    const isverified = await otpAdharkyc.findOne(
      {
        userId: commonHelper.strToMongoDb(playerId),
        //verified: true,
      },
      {
        verified: 1,
        adharcard: 1,
        pancardverified: 1,
        panCardNumber: 1,
        pancard: 1
      }
    );

    const indianStates = [
      'Andaman and Nicobar Islands',
      'Arunachal Pradesh',
      'Bihar',
      'Chandigarh',
      'Chhattisgarh',
      'Dadra and Nagar Haveli',
      'Daman',
      'Diu',
      'Delhi',
      'Goa',
      'Gujarat',
      'Haryana',
      'Himachal Pradesh',
      'Jammu and Kashmir',
      'Jharkhand',
      'Karnataka',
      'Kerala',
      'Ladakh',
      'Lakshadweep',
      'Madhya Pradesh',
      'Maharashtra',
      'Manipur',
      'Mizoram',
      'Odisha',
      'Puducherry',
      'Punjab',
      'Rajasthan',
      'Tamil Nadu',
      'Tripura',
      'Uttar Pradesh',
      'Uttarakhand',
      'West Bengal'
    ];

    logger.info("isverified ", isverified)
    user.verified = isverified ? isverified.verified : false
    user.aadharcardnumber = isverified ? isverified.adharcard : ""
    user.mobileVerify = user.mobileVerify ? user.mobileVerify : false
    user.panCardVerify = isverified ? isverified.pancardverified : false
    user.panCardNumber = isverified ? isverified.pancard : ""
    user.isBankAccountAdded = userBankDetails ? true : false
    user.isBankAccountVerify = userBankDetails ? userBankDetails.verify : false //
    user.stateList = indianStates //

    return user;
  } catch (error) {
    logger.error('mainController.js playerDetails error=> ', error, requestBody);
    return {
      message: 'something went wrong while find profile, please try again',
      status: 0,
    };
  }
}

/**
 * @description  playerInformation Find
 * @param {Object} requestBody
 * @return - {message:"response Message", status: 1, data?:{}}
 */

async function playerInformation(requestBody) {
  logger.info('player Information request Body---->', requestBody);
  try {
    const { playerId, OPId } = requestBody;
    const condition = { _id: commonHelper.strToMongoDb(playerId) };

    const friendCondition = {
      userId: commonHelper.strToMongoDb(playerId),
      friendId: commonHelper.strToMongoDb(OPId),
    };

    let alreadyFriend = false;

    // logger.info("Player Details data-->", condition, "\n friend Condition data-->", friendCondition)
    // const user = await Users.findOne({ condition }).lean();
    const user = await commonHelper.findOne(Users, condition);
    const friendList = await Friend.find(friendCondition);

    // logger.info('user Details => ', user);
    logger.info('friendList Details  1=> ', JSON.stringify(friendList));
    if (friendList.length > 0) {
      if (friendList[0].status === 'approved') {
        // logger.info("status change approoved -- >", alreadyFriend);
        alreadyFriend = true;
      } else {
        logger.info('<-- data Not approoved -- >');
      }
    } else {
      logger.error('mainController.js playerInformation 297 else=> ', requestBody);
    }

    return { user, alreadyFriend };
  } catch (error) {
    logger.error('mainController.js playerInformation error=> ', error, requestBody);
    return {
      message: 'something went wrong while Find Profile, please try again',
      status: 0,
    };
  }
}

/**
 * @description  Leaderboard
 * @param {Object} requestBody
 * @return - {message:"response Message", status: 1, data?:{}}
 */

async function leaderBoard() {
  try {
    const sort = { chips: -1 };
    const data = await Users.find({}, { _id: 1, name: 1, chips: 1, avatar: 1 }).sort(sort);

    const newdata = [];
    data.forEach((e) => {
      newdata.push({
        playerId: e._id,
        name: e.name,
        chips: e.chips,
        avatar: e.avatar,
      });
    });

    logger.info('leaderBoard newData', newdata);
    if (data) {
      return { status: 1, list: newdata };
    } else {
      logger.info('At mainController.js:342 User not found => ', data);
      return { status: 0, message: 'Coins not updated' };
    }
  } catch (error) {
    logger.error('mainController.js leaderBoard error=> ', error);
    return {
      message: 'something went wrong while leader board, please try again',
      status: 0,
    };
  }
}

/**
 * @description . Create Admin User
 * @param {Object} requestBody
 * @returns {Object}
 */

async function registerAdmin(requestBody) {
  try {
    const { name, password, email } = requestBody;
    //logger.info('requestBody => ', requestBody);

    const user = await Admin.countDocuments({ email });
    //logger.info("user =>", user);

    if (user > 0) {
      return {
        message: 'User already exists',
        status: 0,
      };
    } else {
      const newData = {
        name,
        email,
        password,
      };

      //logger.info("Before New Data", newData);
      const hashedPassword = await bcrypt.hash(password, 10);
      //logger.info('hashedPassword => ', hashedPassword);
      newData.password = hashedPassword;
      const response = await usersHelper.registerAdmin(newData);
      // console.info('response => ', response);

      delete response.data.password;
      // response.data.playerId = response.data._id;
      // delete response.data._id;

      if (response.status) {
        const token = await commonHelper.sign(response.data);
        response.data.token = token;
        //logger.info("Admin Regsitration Successfully");
      } else {
        logger.info('At mainController.js:540 User not created => ', JSON.stringify(requestBody));
      }
      return response;
    }
  } catch (error) {
    logger.error('mainController.js registerAdmin error=> ', error, requestBody);
    return {
      message: 'something went wrong while registering, please try again',
      status: 0,
    };
  }
}


async function userUpdateState(requestBody) {
  try {
    const { playerId, state } = requestBody;
    const data = await Users.findOne({ _id: playerId }).lean();

    if (data) {
      const updateData = {
        $set: {
          location: state
        }
      };

      const response = await Users.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(data._id) }, updateData, { new: true });
      logger.info("update state response =>", response)
      return { status: 1, message: 'Update State Succesfully', data: response };

    } else {
      return { status: 0, message: 'Id not Found' };
    }


  } catch (error) {
    logger.error('userUpdateState error=> ', error, requestBody);
    return {
      message: 'something went wrong while registering, please try again',
      status: 0,
    };
  }
}
/**
 * @description . Create Admin User
 * @param {Object} requestBody
 * @returns {Object}
 */

async function registerAdminUpdate(requestBody) {
  try {
    const { email, oldPwd, newPwd } = requestBody;
    const data = await Admin.findOne({ email }).lean();

    if (data !== null) {
      const passwordMatch = await bcrypt.compare(oldPwd, data.password);
      if (passwordMatch) {
        const updateData = {
          $set: {

          }
        };
        if (newPwd != "") {
          const hashedPassword = await bcrypt.hash(newPwd, 10);
          updateData["$set"]["password"] = hashedPassword
        }

        const response = await Admin.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(data._id) }, updateData, { new: true });
        const token = await commonHelper.sign(data);
        data.token = token;
        delete data.password;
        return { status: 1, message: 'Update Admin Id Password Succesfully', data };
      } else return { status: 0, message: 'Incorrect Password' };
    } else {
      logger.info('At mainController.js:571 userId not found => ', JSON.stringify(requestBody));
      return { status: 0, message: 'Id not Found' };
    }


  } catch (error) {
    logger.error('adminController.js registerAdmin error=> ', error, requestBody);
    return {
      message: 'something went wrong while registering, please try again',
      status: 0,
    };
  }
}

/**
 * @description . Create Admin User
 * @param {Object} requestBody
 * @returns {Object}
 */

async function registerAdminProfileUpdate(requestBody) {
  try {
    const { email, name, newEmail } = requestBody;
    const data = await Admin.findOne({ email }).lean();

    if (data !== null) {

      const updateData = {
        $set: {

        }
      };
      if (name != "") {
        updateData["$set"]["name"] = name
      }

      if (newEmail != "") {
        updateData["$set"]["email"] = newEmail
      }

      const response = await Admin.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(data._id) }, updateData, { new: true });
      const token = await commonHelper.sign(data);
      data.token = token;
      delete data.password;
      return { status: 1, message: 'Update Admin Profile Succesfully', data };

    } else {
      logger.info('At mainController.js:571 userId not found => ', JSON.stringify(requestBody));
      return { status: 0, message: 'Id not Found' };
    }


  } catch (error) {
    logger.error('adminController.js registerAdmin error=> ', error, requestBody);
    return {
      message: 'something went wrong while registering, please try again',
      status: 0,
    };
  }
}


/**
 * @description . Create GAME REPORT PROBLEM
 * @param {Object} requestBody
 * @returns {Object}
 */

async function registerProblemReport(requestBody) {
  try {
    const { tableId, playerId, gamePlayType, email, issueType, issueSubType, comments } = requestBody;
    logger.info('Register Problem Report Request Body => ', requestBody);

    const newData = {
      tableId,
      playerId,
      gamePlayType,
      email,
      issueType,
      issueSubType,
      comments,
    };

    const response = await usersHelper.createProblemReprot(newData);

    return response;
  } catch (error) {
    logger.error('mainController.js registerAdmin error=> ', error, requestBody);
    return {
      message: 'something went wrong while registering, please try again',
      status: 0,
    };
  }
}

/**
 * @description . Admin Login
 * @param {Object} requestBody
 * @returns {Object}
 */
async function adminLogin(requestBody) {
  const { email, password } = requestBody;
  //console.info('email => ', email, '\n password => ', password);
  try {
    const data = await Admin.findOne({ email }).lean();
    if (data !== null) {
      const passwordMatch = await bcrypt.compare(password, data.password);

      logger.info('passwordMatch =====> ', passwordMatch, "\n data =====> ", data);


      if (passwordMatch) {
        const token = await commonHelper.sign(data);
        data.token = token;
        delete data.password;
        return { status: 1, message: 'Login Succesfully', data };
      } else return { status: 0, message: 'Incorrect Password' };
    } else {
      logger.info('At mainController.js:571 userId not found => ', JSON.stringify(requestBody));
      return { status: 0, message: 'Id not Found' };
    }
  } catch (error) {
    logger.error('mainController.js adminLogin error=> ', error, requestBody);
    return { status: 0, message: 'No data found' };
  }
}

/**
 * @description . Email Send
 * @param {Object} requestBody
 * @returns {Object}
 */
async function emailSend(requestBody) {
  logger.info('request Body Email Send  => ', requestBody);
  const { email } = requestBody;
  // console.info('email => ', email);
  // console.info('password => ', password);
  try {
    const data = await Users.findOne({ email }).lean();
    if (data !== null) {
      const otpCode = Math.floor(Math.random() * 10000 + 1);

      const otpData = new OtpEmail({
        email,
        otp: otpCode,
        expireIn: new Date().getTime() * 30000,
      });
      mailer(email, otpCode);
      const result = await otpData.save();
      // console.info('Result Email Data Save => ', result);
      return { status: 1, message: 'Please Check your email Id', data: result };
    } else {
      return { status: 0, message: 'EmailId not Found' };
    }
  } catch (error) {
    logger.error('mainController.js emailSend error=> ', error, requestBody);
    return { status: 0, message: 'No data found' };
  }
}

/**
 * @description . forgotPassword
 * @param {Object} requestBody
 * @returns {Object}
 */
async function forgotPassword(requestBody) {
  // logger.info('forgotPassword request Body Send  => ', requestBody);
  const { number, password } = requestBody;
  // logger.info('forgotPassword number => ', number, '\n password => ', password);
  try {
    const data = await Users.findOne({ mobileNumber: number }).lean();
    // logger.info('forgotPassword data => ', data);
    if (data !== null) {
      const hashedPassword = await bcrypt.hash(password, 10);
      // result.data.password = hashedPassword;
      // logger.info('forgotPassword hashedPassword => ', hashedPassword);
      const res = { password: hashedPassword };
      const result = await commonHelper.update(Users, { mobileNumber: number }, res);
      // logger.info('forgotPassword verify Otp data result  => ', result);
      if (result.status === 1) {
        return {
          status: 1,
          message: 'Password Updated Successfully',
          data: result.data,
        };
      } else return { status: 0, message: 'Password Not Updated', data: result };
    } else {
      logger.info('At mainController.js:682 User not found => ', JSON.stringify(requestBody));
      return { status: 0, message: 'Not Found Valid Number' };
    }
  } catch (error) {
    logger.error('mainController.js forgotPassword error=> ', error, requestBody);
    return { status: 0, message: 'No data found' };
  }
}

/**
 * @description . Otp Send
 * @param {Object} requestBody
 * @returns {Object}
 */

async function otpSend(requestBody) {
  // console.info('request Body Email Send  => ', requestBody);
  const { mobileNumber, otpType } = requestBody;
  // console.info('mobileNumber => ', mobileNumber + '  || Type =>' + otpType);
  try {
    const otpCode = Math.floor(Math.random() * 100000 + 1);

    const otpData = new OtpMobile({
      mobileNumber,
      otpCode,
      type: otpType,
      expireIn: new Date().getTime() * 60000,
    });

    const result = await otpData.save();
    if (result) {
      // console.info('Result Otp Data Save => ', result);
      return { status: 1, message: 'Otp Data Save Succesfully', data: result };
    } else {
      logger.info('At mainController.js:715 Otp data not save => ', JSON.stringify(requestBody));
      return { status: 0, message: 'data Not save' };
    }
  } catch (error) {
    logger.error('mainController.js otpSend error=> ', error, requestBody);
    return { status: 0, message: 'Send Otp No data found' };
  }
}

/**
 * @description . changePassword
 * @param {Object} requestBody
 * @returns {Object}
 */
async function changePassword(requestBody) {
  // logger.info('changePassword request Send  => ', requestBody);
  const { playerId, password, newPassword } = requestBody;
  // logger.info('playerId => ', playerId, '\n password => ', password, '\n newPassword => ', newPassword);
  try {
    const data = await Users.findOne({
      _id: commonHelper.strToMongoDb(playerId),
    }).lean();
    // logger.info('changePassword data => ', data);

    if (data !== null) {
      const match = await bcrypt.compare(password, data.password);
      // logger.info('changePassword match => ', match);

      if (match) {
        const hashedPasswordRes = await bcrypt.hash(newPassword, 10);
        // logger.info('changePassword hashedPassword => ', hashedPasswordRes);
        const res = { password: hashedPasswordRes };

        const result = await commonHelper.update(Users, { _id: commonHelper.strToMongoDb(playerId) }, res);
        // logger.info('changePassword result => ', result);
        // result.data.password = hashedPassword;
        // logger.info('verify Otp data result  => ', result);

        if (result.status === 1) {
          return { status: true, message: 'Your password updated successfully' };
        } else {
          return { status: false, message: 'Your password not update' };
        }
      } else {
        return { status: false, message: 'Your old password is incorrect' };
      }
    } else {
      logger.info('At mainController.js:796 changePassword data not found => ', JSON.stringify(requestBody));
      return { status: 0, message: 'Id Not Found' };
    }
  } catch (error) {
    logger.error('mainController.js changePassword error=> ', error, requestBody);
    return { status: 0, message: 'No data found' };
  }
}

/**
 * @description . updateUserDetails
 * @param {Object} requestBody
 * @returns {Object}
 */
async function updateUserDetails(requestBody) {
  // logger.info('request Body Email Send  => ', requestBody);
  const { playerId, name, gender, age } = requestBody;
  // logger.info('playerId => ', playerId, '\nname => ', name, '\ngender => ', gender, '\n age => ', age);
  try {
    const data = await Users.findOne({
      _id: commonHelper.strToMongoDb(playerId),
    }).lean();
    // logger.info('data => ', data);

    if (data !== null) {
      const res = { name, gender, age };

      const result = await commonHelper.update(Users, { _id: commonHelper.strToMongoDb(playerId) }, res);

      // logger.info('updateUserDetails result => ', result);
      if (result.status === 1) {
        return { status: true, message: 'Update User Details Succesfully' };
      } else {
        return { status: false, message: 'Details not Updated' };
      }
    } else {
      return { status: 0, message: 'Id Not Found' };
    }
  } catch (error) {
    logger.error('mainController.js updateUserDetails error=> ', error, requestBody);
    return { status: 0, message: 'No data found' };
  }
}

/**
 * @description .  inAppPurchase
 * @param {Object} requestBody
 * @returns {Object}
 */
async function inAppPurchase(requestBody) {
  // console.info(' inAppPurchase requestBody=> ', requestBody);
  const { playerId, coin } = requestBody;
  // console.info('playerId,coin => ', playerId, coin);
  try {
    const data = await Users.findOneAndUpdate({ _id: commonHelper.strToMongoDb(playerId) }, { $inc: { coins: coin } });

    //logger.info("InApp Purchase data --> ", JSON.stringify(data));
    if (data) {
      return {
        status: 1,
        message: 'Update User Details Succesfully',
        data,
      };
    } else {
      return { status: 0, message: 'Coins not updated' };
    }
  } catch (error) {
    logger.error('mainController.js inAppPurchase error=> ', error, requestBody);
    return {
      message: 'something went wrong while leader board, please try again',
      status: 0,
    };
  }
}


/*
//Send OTP
*/
async function sendOTP(payload) {
  try {
    logger.info('User Send OTP payload.data => ', payload);
    const { email, mobileNumber, otpType } = payload;


    const alreadyExist = await OtpMobile.countDocuments({
      mobileNumber: mobileNumber,
      otpType,
    });

    if (alreadyExist) {

      const deletedOtp = await OtpMobile.findOneAndDelete({
        mobileNumber: mobileNumber,
        otpType: otpType,
      });
      if (deletedOtp) {
        logger.info("Deleted old OTP:", deletedOtp);
      }
    } // Delay deletion by 30 seconds (adjust as needed)


    const accountSid = process.env.SID;
    const apiKey = process.env.SMS_API;

    const otpCode = Math.floor(10000 + Math.random() * 90000);

    const otpData = new OtpMobile({
      mobileNumber: payload.mobileNumber,
      email: email !== null ? email : '',
      otpCode,
      otpType: payload.otpType,
      expireIn: new Date().getTime() * 60000,
    });

    const result = await otpData.save();
    logger.info('Result Otp Data Save => ', result);
    logger.info('send to this number', CONST.COUNTRY_CODE + payload.mobileNumber);

    // const { to, type, sender, body, callback, template_id } = payload;
    // const apiKey = 'Aa3320ee6c6a0a33529f0680107521673';

    const toNumber = CONST.COUNTRY_CODE + payload.mobileNumber; // Replace with the recipient's phone number
    const senderId = "LGTPLY"; // Replace with your sender ID
    const messageBody = `Hi, User! RummyLegit welcomes you! Your OTP for registration is ${otpCode}`;
    const templateId = "1107170892964345957";


    const formData = new URLSearchParams();
    formData.append('to', toNumber);
    formData.append('type', 'OTP');
    formData.append('sender', senderId);
    formData.append('body', messageBody);
    formData.append('template_id', templateId);

    const response = await axios.post(`https://api.kaleyra.io/v1/${accountSid}/messages`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'api-key': apiKey,
      },
    });

    if (response.data.data != undefined && response.data.data.message_id != undefined) {
      logger.info("Suceesss Send OTP")
    } else {
      logger.info("OTP Not Send")
    }

  } catch (error) {
    logger.error('mainController.js sendOTP error=> ', error, payload);
  }
}

/*
Verify OTP
*/
async function verifyOTP(payload) {
  try {
    logger.info('verify User Verify OTP payload.data => ', payload);
    const { mobileNumber, otp, otpType } = payload;


    const result = await OtpMobile.findOne({
      mobileNumber: mobileNumber,
      otpCode: otp,
      otpType,
    });

    logger.info('mainController verify Result Otp Data => ', result);
    if (result !== null) {
      const res = { verified: true };

      const response = await commonHelper.update(OtpMobile, { mobileNumber: mobileNumber, otpCode: otp }, res);
      const upWh2 = {
        mobileNumber: mobileNumber
      };


      return { status: true, message: 'OTP Verified', data: response.data };
    } else {
      return { status: false, message: 'OTP Not Verified' };

      // const key = 12345;

      // const query = {
      //   mobileNumber: payload.mobileNumber,
      // };

      // //logger.info('Check Validation ->', parseInt(payload.otp) === key);
      // if (parseInt(payload.otp) === key) {
      //   const response = await OtpMobile.findOneAndUpdate(
      //     query,
      //     {
      //       verified: true,
      //     },
      //     { new: true }
      //   );

      //   //logger.info('verify Result Otp Data => ', response);
      //   return { status: true, message: 'OTP Verified', data: response };
      // } else {
      //   return { status: false, message: 'OTP Not Verified' };

      // }
    }
  } catch (error) {
    logger.info('mainController.js verifyOTP error => ', error);
    return { status: 0, message: 'OTP Not Verified' };
  }
}

/*
// Mail Function
*/
async function mailer(email, otp) {
  try {
    // console.info('Mailer email otp => ', email, otp);
    const transporter = nodemailer.createTransport({
      service: config.MAIL_SERVICE,
      port: 465,
      secure: false,
      auth: {
        user: config.MAIL_ID,
        pass: config.PASSWORD,
      },
    });

    const payload = {
      from: config.MAIL_SERVICE, // sender address
      to: email, // list of receivers
      subject: 'Rummy ✔', // Subject line
      text: ` your ${otp} one time password for your email verification`, // plain text body
    };

    const info = await transporter.sendMail(payload);
    if (!info) {
      logger.error('failed Email payload', JSON.stringify(payload));
    }
  } catch (error) {
    logger.error('mainController.js mailer error=> ', error);
  }
}

/**
 * @description . Add betlist
 * @param {Object} requestBody
 * @returns {Object}
 */
async function registerBetList(requestBody) {
  console.log("requestBody ", requestBody)
  const { gamePlayType, entryFee, maxSeat, status, commission, tableName } = requestBody;
  logger.info('registerBetList requestBody => ', requestBody);
  try {
    const entryFeexists = await BetLists.countDocuments({ entryFee, maxSeat });
    if (entryFeexists > 0) {
      return { status: 0, message: 'Entry Fee Already Exists' };
    }
    const newData = { gamePlayType, entryFee, status, commission, maxSeat, tableName };
    const response = await usersHelper.betLists(newData);
    logger.info('Create Bet table  response => ', response);
    if (response.status) {
      response.message = 'Register Success';
    } else {
      response.message = 'Invalid Credential';
    }
    return response;
  } catch (error) {
    logger.error('mainController.js registerBetList error=> ', error, requestBody);
    return {
      message: 'something went wrong while registering, please try again',
      status: 0,
    };
  }
}


/**
 * @description . updateBetList
 * @param {Object} requestBody
 * @returns {Object}
 */
async function updateBetList(requestBody) {
  // console.info('request Body Email Send  => ', requestBody);
  const { entryFee, gamePlayType } = requestBody;
  try {
    const data = await Users.findOne({
      entryFee: commonHelper.strToMongoDb(entryFee),
    }).lean();

    // console.info('updateBetList data => ', data);
    if (data !== null) {
      const res = { entryFee, gamePlayType };

      const result = await commonHelper.update(BetLists, { entryFee: commonHelper.strToMongoDb(entryFee) }, res);

      // logger.info('Update Bet result => ', result);
      if (result.status === 1) {
        return { status: true, message: 'Update User Details Succesfully' };
      } else {
        return { status: false, message: 'Details not Updated' };
      }
    } else {
      return { status: 0, message: 'Id Not Found' };
    }
  } catch (error) {
    logger.error('mainController.js updateBetList error=> ', error, requestBody);
    return { status: 0, message: 'No data found' };
  }
}

/**
 * @description . getBetList
 * @param {Object} requestBody
 * @returns {Object}
 */
async function getBetList(requestBody) {
  try {
    const responseData = await BetLists.aggregate([
      { $sort: { entryFee: 1 } },
      {
        $project: {
          entryFee: '$entryFee',
          gamePlayType: '$gamePlayType',
          commission: '$commission',
          maxSeat: '$maxSeat',
          status: '$status',
          tableName: '$tableName'
        },
      },
    ]);
    console.log("responseData ", responseData)
    if (responseData.length !== 0) {
      return { status: 1, message: 'result sucessfully ', data: responseData };
    } else {
      return { status: 0, message: 'data not find' };
    }
  } catch (error) {
    logger.error('mainController.js getBetList error=> ', error, requestBody);
  }
}

/**
 * @description . getBankDetails
 * @param {Object} requestBody
 * @returns {Object}
 */
async function getBankDetailByUserId(requestBody) {
  try {
    logger.info("getBankDetailByUserId requestBody ==>", requestBody)
    let { playerId } = requestBody
    const responseData = await BankDetails.findOne({ userId: MongoID(playerId) }).lean();
    logger.info("getBankDetailByUserId ==>", responseData)
    if (responseData) {
      return { status: 1, message: 'result sucessfully ', data: responseData };
    } else {
      return { status: 0, message: 'data not find' };
    }
  } catch (error) {
    logger.error('mainController.js getBankDetailByUserId error=> ', error, requestBody);
  }
}

/**
 * @description . getBankDetails
 * @param {Object} requestBody
 * @returns {Object}
 */
async function getTransactiobDetailByUserId(requestBody) {
  try {
    logger.info("get transaction requestBody ==>", requestBody)
    let { playerId } = requestBody
    const responseData = await WalletTrackTransaction.find({ userId: MongoID(playerId) }).sort({ createdAt: -1 }).lean();
    logger.info("transaction 1==>", responseData)


    responseData.forEach(doc => {
      const createdAt = new Date(doc.createdAt);
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      doc.date = createdAt.toLocaleDateString('en-GB', options); // Format date as dd/mm/yyyy
      doc.time = createdAt.toLocaleTimeString(); // Keep time in the default format
    });

    logger.info("transactions date formate -> ", responseData); // Now you have formatted dates in each transaction object

    if (responseData) {
      return { status: 1, message: 'result sucessfully ', data: responseData };
    } else {
      return { status: 0, message: 'data not find' };
    }
  } catch (error) {
    logger.error('mainController.js getBankDetailByUserId error=> ', error, requestBody);
  }
}

/**
 * @description . getBetDetails
 * @param {Object} requestBody
 * @returns {Object}
 */
async function getBetDetails(requestBody) {
  // console.info('request Body  Send  => ', requestBody);
  const { userId } = requestBody;
  try {
    const responseData = await BetLists.findOne({
      _id: commonHelper.strToMongoDb(userId),
    }).lean();

    //logger.info('responseData => ', responseData);
    // return responseData
    if (responseData !== null) {
      return { status: 1, message: 'result sucessfully ', data: responseData };
    } else {
      return { status: 0, message: 'data not find' };
    }
  } catch (error) {
    logger.error('mainController.js getBetDetails error=> ', error, requestBody);
  }
}

// Export Functions
module.exports = {
  logIn,
  autoLogin,
  findProfile,
  updateCoin,
  playerDetails,
  leaderBoard,
  registerAdmin,
  adminLogin,
  emailSend,
  forgotPassword,
  otpSend,
  changePassword,
  updateUserDetails,
  inAppPurchase,
  sendOTP,
  mailer,
  verifyOTP,
  playerInformation,
  updateBetList,
  registerBetList,
  getBetList,
  getBetDetails,
  registerProblemReport,
  getBankDetailByUserId,
  getTransactiobDetailByUserId,
  registerAdminUpdate,
  registerAdminProfileUpdate,
  userUpdateState
};
