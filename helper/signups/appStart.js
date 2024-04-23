const commandAcions = require('../socketFunctions');
//const bcrypt = require('bcrypt');
const CONST = require('../../constant');
const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const UserReferTracks = mongoose.model('userReferTracks');
const PlayingTables = mongoose.model('playingTable');
const IdCounter = mongoose.model('idCounter');
const logger = require('../../logger');

module.exports.appLunchDetails = async (requestData, client) => {
  try {
    // logger.info("appLunchDetails =>", requestData);
    let { playerId, appVersion/*, deviceId, loginType, email*/ } = requestData;
    let query = { _id: playerId.toString() };
    let result = await GameUser.findOne(query, {}).lean();
    // logger.info('Guest Final response result', result);

    if (result) {

      if (appVersion !== GAMELOGICCONFIG.App_Version) {
        if (result.appVersion !== GAMELOGICCONFIG.App_Version) {
          let response = { valid: false, msg: 'Update! Upgrade Your App' };
          commandAcions.sendEvent(client, CONST.APP_UPDATE, response);
          // return false
        } else {
          // App version is up to date
          let response = { valid: true, msg: 'App Already Updated' };
          commandAcions.sendEvent(client, CONST.APP_UPDATE, response);
          // You can add any additional logic here if needed
        }
      } else {
        await GameUser.findOneAndUpdate(query, { $set: { appVersion: appVersion } }, { new: true }).lean();
      }

      //user connect sckId store
      //disconnect when null

      // if (result.sckId && result.sckId !== client.id) {
      //   // User is already logged in from another device
      //   commandAcions.sendEvent(client, CONST.ALREADY_PLAYER_AXIST);
      //   logger.info("check socket id unatched ");
      //   return; // Stop further execution
      // }

      // Update user session with new socket id
      await this.userSesssionSet(result, client);

      let response = await this.filterBeforeSendSPEvent(result);
      commandAcions.sendEvent(client, CONST.DASHBOARD, response);


      const dataUpdate = await GameUser.findOneAndUpdate({ _id: MongoID(playerId.toString()) }, { $set: { sckId: client.id } }, {
        new: true,
      });
      // logger.info('update socket Id ', dataUpdate);

      if (requestData.referralCode) {
        await this.referralReward(requestData.referralCode, response)
      }
    } else {
      commandAcions.sendEvent(client, CONST.DASHBOARD, requestData, false, 'Please register the user first');
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Check APP launch Deatils", error)
  }
};

module.exports.activePlayerCounter = async (client) => {
  try {

    let findCountPlayer = await PlayingTables.aggregate([
      {
        $project: {
          numberOfPlayers: { $size: "$playerInfo" }
        }
      }
    ])
    logger.info("activePlayerCounter  =>", findCountPlayer)
    let res = {
      activePlayerCounter: findCountPlayer.length > 0 ? findCountPlayer[0].numberOfPlayers : 0,
    };
    return res;
  } catch (error) {
    logger.error("Check APP launch Deatils", error)
  }
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
    location: data.location ? data.location : '',
    uniqueId: '',
    loginType: data.loginType,
    mobileVerify: data.mobileVerify ? data.mobileVerify : false,
    avatar: data.avatar,
    chips: 0,
    winningChips: 0,
    systemVersion: data.systemVersion ? data.systemVersion : '',
    deviceName: data.deviceName ? data.deviceName : '',
    deviceModel: data.deviceModel ? data.deviceModel : '',
    operatingSystem: data.operatingSystem ? data.operatingSystem : '',
    graphicsMemorySize: data.graphicsMemorySize ? data.graphicsMemorySize : '',
    systemMemorySize: data.systemMemorySize ? data.systemMemorySize : '',
    processorType: data.processorType ? data.processorType : '',
    processorCount: data.processorCount ? data.processorCount : '',
    batteryLevel: data.batteryLevel ? data.batteryLevel : '',
    genuineCheckAvailable: data.genuineCheckAvailable ? data.genuineCheckAvailable : '',
    platform: data.platform ? data.platform : '',
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
  try {
    // Validate userData
    if (!userData || typeof userData !== 'object' || !userData._id) {
      logger.error('Invalid userData. Missing required fields.');
      return;
    }

    // Validate client
    if (!client || typeof client !== 'object' || !client.id) {
      logger.error('Invalid client. Missing required fields.');
      return
    }

    //update user socket Id
    const updateSocketId = await GameUser.findOneAndUpdate(
      { _id: MongoID(userData._id) },
      { $set: { sckId: client.id } },
      { new: true }
    );

    logger.info('User Update Socket Id  :: ', updateSocketId);

    // Set user session in Redis
    client.uid = userData._id.toString();
    client.uniqueId = userData.uniqueId;

    const { _id, uniqueId, mobileNumber, email } = userData;

    // Set user session data in Redis hash
    await rClient.hmset(`socket-${_id.toString()}`, 'socketId', client.id.toString(), 'userId', _id.toString(), 'mobileNumber', mobileNumber, 'uniqueId', uniqueId, 'email', email);

    return true;
  } catch (error) {
    logger.error('Error setting user session:', error);
    return false;
  }
};

module.exports.filterBeforeSendSPEvent = async (userData) => {
  logger.info('filter Before Send SP Event filterBeforeSendSPEvent -->', userData);

  let res = {
    _id: userData._id,
    name: userData.name,
    username: userData.username,
    mobileNumber: userData.mobileNumber,
    email: userData.email,
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

module.exports.appUpdate = async (requestData, client) => {
  try {
    const { playerId } = requestData;
    const query = { _id: playerId.toString() };
    const result = await GameUser.findOne(query, {}).lean();

    if (result) {
      if (result.App_Version !== GAMELOGICCONFIG.App_Version) {
        let response = { valid: false, msg: 'Update! Upgrade Your App' };
        commandAcions.sendEvent(client, CONST.CHECK_REFERAL_CODE, response);
      } else {
        // App version is up to date
        let response = { valid: true, msg: 'App Already Updated' };
        commandAcions.sendEvent(client, CONST.CHECK_REFERAL_CODE, response);
        // You can add any additional logic here if needed
      }
    } else {
      const response = { valid: false, msg: 'User not Find' };
      commandAcions.sendEvent(client, CONST.CHECK_REFERAL_CODE, response);
    }
  } catch (error) {
    logger.error('Error in appUpdate:', error);
  }
}
