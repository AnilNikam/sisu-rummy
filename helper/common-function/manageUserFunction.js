const logger = require('../../logger');
const CONST = require('../../constant');
const mongoose = require('mongoose');
const PlayingTables = mongoose.model('playingTable');


module.exports.getPlayingUserInRound = async (p) => {
  // logger.info("\n get getPlayingUserInRound Round p :", p);
  let pl = [];
  if (typeof p === 'undefined' || p === null) {
    return pl;
  }

  for (let x = 0; x < p.length; x++) {
    if (typeof p[x] === 'object' && p[x] !== null && typeof p[x].seatIndex !== 'undefined' && p[x].status === 'PLAYING') pl.push(p[x]);
  }

  return pl;
};
module.exports.getPlayingRealUserInRound = async (p) => {
  // logger.info("\n get getPlayingUserInRound Round p :", p);
  let pl = [];
  if (typeof p === 'undefined' || p === null) {
    return pl;
  }

  for (let x = 0; x < p.length; x++) {
    if (typeof p[x] === 'object' && p[x] !== null && typeof p[x].seatIndex !== 'undefined' && p[x].isBot === false) pl.push(p[x]);
  }

  return pl;
};

module.exports.getWaitingUserInRound = async (p) => {
  // logger.info("\n get getWaitingUserInRound p :", p);
  let pl = [];
  if (typeof p === 'undefined' || p === null) {
    return pl;
  }

  for (let x = 0; x < p.length; x++) {
    if (typeof p[x] === 'object' && p[x] !== null && typeof p[x].seatIndex !== 'undefined' && p[x].status === 'WAITING') pl.push(p[x]);
  }

  return pl;
};

module.exports.getPlayingUserInTable = async (p) => {
  try {
    // logger.info("\n get getPlayingUserInTable Round p :", p);
    let pl = [];
    if (typeof p === 'undefined' || p === null) {
      logger.info('\n get table Playing User In Round p find Null:', p);
      return pl;
    }

    const list = [CONST.PLAYING, CONST.DROPPED, CONST.WAITING, CONST.WATCHING, CONST.INVALID_DECLARE, CONST.LEAVE];

    for (let x = 0; x < p.length; x++) {
      if (typeof p[x] === 'object' && p[x] !== null && typeof p[x].seatIndex !== 'undefined' && list.includes(p[x].status)) {
        pl.push(p[x]);
      }
    }
    return pl;
  } catch (e) {
    logger.error('leaveTable.js getPlayingUserInTable error : ', e);
  }
};

module.exports.getPlayingAndDropUserRound = async (p) => {
  // logger.info("\n get getPlayingAndDropUserRound p :", p);
  let pl = [];
  if (typeof p === 'undefined' || p === null) {
    return pl;
  }

  for (let x = 0; x < p.length; x++) {
    if (typeof p[x] === 'object' && p[x] !== null && typeof p[x].seatIndex !== 'undefined' && (p[x].status === 'PLAYING' || p[x].status === CONST.DROPPED || p[x].status === CONST.INVALID_DECLARE))
      pl.push(p[x]);
  }

  return pl;
};

module.exports.filterBeforeSendSPEvent = async (userData) => {
  let findCountPlayer = await PlayingTables.aggregate([
    {
      $project: {
        numberOfPlayers: { $size: "$playerInfo" }
      }
    }
  ])

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
    email: userData.email,
    winningChips: userData.winningChips,
    activePlayerCounter: findCountPlayer.length > 0 ? findCountPlayer[0].numberOfPlayers : 0,
    tableId: userData.tableId || 0,
    createdAt: userData.createdAt,
    msg: ""
  };

  //logger.info('filter Before Send SP Event -->', res);
  return res;
};

module.exports.getPlayingInTable = async (p, entryFee) => {
  let pl = [];
  if (typeof p === 'undefined' || p === null) {
    return pl;
  }

  for (let x = 0; x < p.length; x++) {
    if (typeof p[x] === 'object' && p[x] !== null && typeof p[x].seatIndex !== 'undefined' && p[x].gameChips >= entryFee) {
      pl.push(p[x]);
    }
  }
  logger.info('\nLost Player In Round=> ', pl);
  return pl;
};

module.exports.getPlayingUserInRoundWaiting = async (p) => {
  try {
    // logger.info("\n get getPlayingUserInRoundWaiting Round p :", p);
    let pl = [];
    if (typeof p === 'undefined' || p === null) {
      logger.info('\n get Playing User In Round p find Null:', p);
      return pl;
    }

    for (let x = 0; x < p.length; x++) {
      if ((typeof p[x] === 'object' && p[x] !== null && typeof p[x].seatIndex !== 'undefined' && p[x].status === 'WAITING') || p[x].status === 'PLAYING') pl.push(p[x]);
    }

    // logger.info("\n Get Playing User In Round pl => ", pl);
    return pl;
  } catch (e) {
    logger.error('\n reconnect.js getPlayingUserInRoundWaiting error => ', e);
  }
};

module.exports.getUserTurnSeatIndex = async (tbInfo, prevTurn, cnt) => {
  let counter = cnt;
  let p = tbInfo.playerInfo; // [{},{},{}]
  let plen = p.length; //3

  let x = 0;

  if (prevTurn === plen - 1) x = 0;
  else x = Number(prevTurn) + 1;

  if (counter === plen + 1) {
    return prevTurn;
  }

  counter++;

  if (x < plen && (p[x] === null || typeof p[x].seatIndex === 'undefined' || p[x].status !== 'PLAYING')) {
    let index = await this.getUserTurnSeatIndex(tbInfo, x, counter);
    //logger.info('getUserTurnSeatIndex index', index);
    return index;
  } else {
    logger.info('getUserTurnSeatIndex x', x);
    return x;
  }
};

module.exports.winnerViewResponseFilter = (playerDetails) => {
  logger.info('\n winnerViewResponseFilter =>', playerDetails);
  try {
    let userInfo = [];
    let playerInfo = playerDetails;
    for (let i = 0; i < playerInfo.length; i++) {
      if (typeof playerInfo[i].playerId !== 'undefined') {
        userInfo.push({
          playerId: playerInfo[i].playerId,
          playerName: playerInfo[i].playerName,
          result: playerInfo[i].result,
          cards: playerInfo[i].cards,
          gCards: playerInfo[i].gCards,
          point: playerInfo[i].point,
          lostChips: playerInfo[i].lostChips,
          avatar: playerInfo[i].avatar,
          chips: playerInfo[i].chips,
          gameChips: playerInfo[i].gameChips,
        });
      }
    }
    return {
      userInfo: userInfo,
    };
  } catch (err) {
    logger.error('gameFinish.js winnerViewResponseFilter => ', err);
  }
};
