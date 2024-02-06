const commandAcions = require('../socketFunctions');
//const bcrypt = require('bcrypt');
const CONST = require('../../constant');
const { createClient } = require('redis');
const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const UserReferTracks = mongoose.model('userReferTracks');
const IdCounter = mongoose.model('idCounter');
const logger = require('../../logger');

module.exports.appLunchDetails = async (requestData, client) => {
  let { playerId /*mobileNumber, deviceId, loginType, email*/ } = requestData;
  let query = { _id: playerId.toString() };
  let result = await GameUser.findOne(query, {});
  if (result) {
    await this.userSesssionSet(result, client);

    let response = await this.filterBeforeSendSPEvent(result);
    //logger.info('Guest Final response Dashboard', response);
    commandAcions.sendEvent(client, CONST.DASHBOARD, response);
    if (requestData.referralCode != "") {
      await this.referralReward(requestData.referralCode, response)
    }
  } else {
    commandAcions.sendEvent(client, CONST.DASHBOARD, requestData, false, 'Please register the user first');
    return false;
  }

  return true;
};

module.exports.referralReward = async (referralCode, userData) => {

  let wh = {};
  if (referralCode) {
    wh.referralCode = referralCode.toLowerCase();
  }

  let res = await GameUser.findOne(wh, {});
  // let wh = {
  //   referralCode: referralCode.toLowerCase(),
  // };

  // let res = await GameUser.findOne(wh, {});
  logger.info('referralReward res : ', res);

  if (res !== null) {
    await UserReferTracks.create({
      // eslint-disable-next-line no-undef
      userId: MongoID(userData._id.toString()),
      referalUserId: MongoID(res._id.toString()),
    });
    let response = { valid: true, msg: 'Congrats! Referral Code Valid' };
    commandAcions.sendEvent(socket, CONST.CHECK_REFERAL_CODE, response);

    // let reward = await bonusActions.getReferalBonus({
    //     referCounter : urc
    // })

    // if(reward.otc > 0){
    //     await walletActions.addotcWallet(userData._id.toString(), Number(reward.otc), "friend signup otc", 2);
    // }else{
    //     return false;
    // }
    return true;
  } else {

    return false;
  }
};

module.exports.checkReferral = async (requestData, socket) => {
  let { referralCode, userId } = requestData
  let wh = {
    referralCode: referralCode,
  };

  let res = await GameUser.findOne(wh, {});
  logger.info('referralReward res : ', res);

  if (res !== null) {
    await UserReferTracks.create({
      // eslint-disable-next-line no-undef
      userId: MongoID(userId.toString()),
      referalUserId: MongoID(res._id.toString()),
    });
    let response = { valid: true, msg: 'Congrats! Referral Code Valid' };
    commandAcions.sendEvent(socket, CONST.CHECK_REFERAL_CODE, response);
    return true;
  } else {
    commandAcions.sendEvent(socket, CONST.CHECK_REFERAL_CODE, requestData, false, 'Enter valid referral!');
    return false;
  }
};

module.exports.getUserDefaultFields = async (data, client) => {
  logger.info('getUserDefaultFields get User Default Fields -->', data);
  const setUserDetail = {
    id: 0,
    deviceId: data.deviceId ? data.deviceId : 'botDevice',
    username: data.username ? data.username : '',
    name: data.name ? data.name : '',
    status: data.status ? data.status : '',
    mobileNumber: data.mobileNumber ? data.mobileNumber : '',
    email: data.email ? data.email : '',
    uniqueId: '',
    loginType: data.loginType,
    avatar: data.avatar,
    chips: 20000,
    winningChips: 0,
    flags: {
      isOnline: 1, //is Online
    },
    counters: {
      gameWin: 0,
      gameLoss: 0,
      totalMatch: 0,
    },
    referralCode: await this.getReferralCode(8),
    tableId: '',
    sckId: client && client.id ? client.id : '',
    isBot: data.isBot ? data.isBot : false,
  };

  return setUserDetail;
};

module.exports.getReferralCode = async (length) => {
  let result = '';
  let characters = 'qwertyuipasdfghkjlzxcvbnmQWERTYUIPASDFGHJKLZXCVBNM';
  for (let i = 0; i < length - 1; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  let digit = '123456789';
  for (let i = result.length; i < length; i++) {
    result += digit.charAt(Math.floor(Math.random() * digit.length));
  }
  let parts = result.split('');
  for (let i = parts.length; i > 0;) {
    let random = parseInt(Math.random() * i);
    let temp = parts[--i];
    parts[i] = parts[random];
    parts[random] = temp;
  }
  let newRfc = parts.join('');
  //logger.info('getReferralCode :newRfc ------->', newRfc.toLowerCase());
  return newRfc.toLowerCase();
};

module.exports.saveGameUser = async (userInfoDetails, client) => {
  let userInfo = userInfoDetails;
  try {
    const uCounter = await this.getCountDetails('gameusers');
    logger.info('saveGameUser uCounter :: ', uCounter);

    let number = '000000000000' + Number(uCounter);
    logger.info('saveGameUser number : ', number);

    number = number.slice(-10);

    let uniqueId = 'USER_' + number;

    userInfo.id = uCounter;
    userInfo.username = 'USER_' + uCounter;
    userInfo.uniqueId = uniqueId;

    logger.info('saveGameUser uniqueId ::', userInfo.uniqueId, userInfo.id);
    logger.info('\nsaveGameUser userInfo :: ', userInfo);

    let insertRes = await GameUser.create(userInfo);

    if (Object.keys(insertRes).length > 0) {
      return insertRes;
    } else {
      logger.info('\nsaveGameUser Error :: ', insertRes);
      return this.saveGameUser(userInfo, client);
    }
  } catch (e) {
    logger.info('saveGameUser : 1 : Exception :', e);
  }
};

module.exports.getCountDetails = async (type) => {
  logger.info(' getCountDetails Type ==>', type);
  try {
    let wh = {
      type: type,
    };

    let update = {
      $set: {
        type: type,
      },
      $inc: {
        counter: 1,
      },
    };
    logger.info('\ngetUserCount wh : ', wh, update);

    let resp2 = await IdCounter.findOneAndUpdate(wh, update, { upsert: true, new: true });
    return resp2.counter;
  } catch (error) {
    logger.error(' get Count Error =>', error);
  }
};

module.exports.userSesssionSet = async (userData, client) => {
  //logger.info('Redis User Session ', userData);
  try {
    // client.uid = userData._id.toString();
    // client.uniqueId = userData.uniqueId;

    // eslint-disable-next-line no-unused-vars
    let redisSet = {
      _id: userData._id.toString(),
      uid: userData.id,
      mobileNumber: userData.mobileNumber,
      uniqueId: userData.uniqueId,
    };

    const { _id, uniqueId, mobileNumber, email } = userData;
    let rdlClient = createClient();
    rdlClient.hmset(`socket-${_id.toString()}`, 'socketId', client.id.toString(), 'userId', _id.toString(), 'mobileNumber', mobileNumber, 'uniqueId', uniqueId, 'email', email);

    return true;
  } catch (e) {
    logger.info('user Session -->', e);
  }
};

module.exports.filterBeforeSendSPEvent = async (userData) => {
  //logger.info('filter Before Send SP Event filterBeforeSendSPEvent -->', userData);

  let res = {
    _id: userData._id,
    name: userData.name,
    username: userData.username,
    mobileNumber: userData.mobileNumber,
    avatar: userData.avatar,
    loginType: userData.loginType,
    uniqueId: userData.uniqueId,
    deviceId: userData.deviceId,
    chips: userData.chips,
    winningChips: userData.winningChips,
    tableId: userData.tableId || 0,
    createdAt: userData.createdAt,
  };

  //logger.info('filter Before Send SP Event -->', res);
  return res;
};
