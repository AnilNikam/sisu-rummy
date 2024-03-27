const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const BetLists = mongoose.model('betLists');
const Users = mongoose.model('users');
const PlayingTables = mongoose.model('playingTable');

const gameStartActions = require('./gameStart');
const botLogic = require('../botFunction');
const CONST = require('../../constant');
const logger = require('../../logger');

const { sendEvent, sendDirectEvent, AddTime, setDelay, clearJob } = require('../socketFunctions');
const { userReconnect } = require('../common-function/reConnectFunction');

module.exports.joinTable = async (requestData, socket) => {
  try {
    logger.info("requestData joinTable", requestData)
    logger.info("requestData joinTable socket ", socket.JT)

    const entryFee = requestData.entryFee.toString()
    logger.info("requestData joinTable entryFee", typeof entryFee, entryFee)

    if (typeof socket.uid === 'undefined') {
      sendEvent(socket, CONST.JOIN_TABLE, requestData, {
        flag: false,
        msg: 'Please restart game!!',
      });
      return false;
    }

    if (typeof socket.JT !== 'undefined' && socket.JT) {
      return false;
    }

    socket.JT = true;

    let query = {
      entryFee: entryFee,
      maxSeat: parseInt(requestData.maxSeat)
    };

    const betInfo = await BetLists.findOne(query).lean();
    logger.info("betInfo =>", betInfo);

    let condition = { _id: MongoID(socket.uid) };
    let userInfo = await Users.findOne(condition, {}).lean();
    logger.info("userInfo", userInfo)


    let gameChips = parseFloat(requestData.entryFee) * 80;
    logger.info("gameChips", gameChips)

    if (Number(userInfo.chips) < Number(gameChips)) {
      sendEvent(socket, CONST.INSUFFICIENT_CHIPS, requestData, {
        flag: false,
        msg: 'Please Add Wallet!!',
      });
      delete socket.JT;
      return false;
    }

    let wh = { 'playerInfo._id': MongoID(socket.uid) };
    let tableInfo = await PlayingTables.findOne(wh, {}).lean();
    logger.info('join table Info ->', tableInfo);

    if (tableInfo) {
      // sendDirectEvent(socket.id, CONST.ALREADY_PLAYER_AXIST, requestData, {
      //   flag: false,
      //   msg: 'Already In playing table!!',
      // });
      logger.info('player already in table');

      // let updateData = {
      //   $set: {
      //     'playerInfo.$': {},
      //   },
      //   $inc:{
      //     "activePlayer":-1
      //   }
      // };

      // let tableInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
      //   new: true,
      // });

      // logger.info("Remove User table -->", tableInfo)

      await userReconnect({
        playerId: socket.uid
      }, socket);
      delete socket.JT;
      return false;
    } else {
      return await this.findTable(betInfo, socket, userInfo);
    }
  } catch (error) {
    sendEvent(socket, CONST.JOIN_TABLE, requestData, {
      flag: false,
      msg: 'Something Went Wrong!!',
    });
    logger.error('joinTable.js joinTable error=> ', error, requestData);
    delete socket.JT;
  }
};

module.exports.findTable = async (betInfo, socket, userInfo) => {
  try {
    let tableInfo = await this.getBetTable(betInfo, userInfo);

    if (tableInfo.gameTimer !== null && tableInfo.gameTimer !== undefined) {
      let currentDateTime = new Date();
      let time = currentDateTime.getSeconds();
      let turnTime = new Date(tableInfo.gameTimer.GST);
      let Gtime = turnTime.getSeconds();
      let diff = Gtime - time;

      if (Math.abs(diff) > 6 && Math.abs(diff) < 10) {
        let tbId = tableInfo._id;
        let jobId = 'WAITING:' + tbId;
        let delay = AddTime(6);

        await setDelay(jobId, new Date(delay));
        await this.findTable(betInfo, socket);
      } else {
        logger.info('time is greater than 4 sec');
      }
    }
    await this.findEmptySeatAndUserSeat(tableInfo, betInfo, socket);
  } catch (error) {
    logger.error('joinTable.js findTable error=> ', error, betInfo);
  }
};

module.exports.getBetTable = async (betInfo, userInfo) => {
  try {
    logger.info("getBetTable betinfo =>", betInfo);
    logger.info("getBetTable userInfo =>", userInfo);

    let wh = {
      // _id: { $nin: userInfo.lastTableId },
      _id: { $nin: userInfo && userInfo.lastTableId ? userInfo.lastTableId : [] },
      entryFee: betInfo.entryFee,
      activePlayer: { $gte: 0, $lt: betInfo.maxSeat },
      gamePlayType: betInfo.gamePlayType,
      maxSeat: parseInt(betInfo.maxSeat)
    };

    let tableInfo = await PlayingTables.find(wh, {}).sort({ activePlayer: 1 }).lean();

    if (tableInfo.length > 0) {
      return tableInfo[0];
    }
    let table = await this.createTable(betInfo);
    return table;
  } catch (error) {
    logger.error('joinTable.js getBetTable error=> ', error, betInfo);
  }
};

module.exports.createTable = async (betInfo) => {
  try {
    let insertobj = {
      maxSeat: betInfo.maxSeat,
      entryFee: betInfo.entryFee,
      commission: betInfo.commission,
      activePlayer: 0,
      gamePlayType: betInfo.gamePlayType,
      playerInfo: this.makeObjects(Number(betInfo.maxSeat)),
      // gameState: CONST.WAITING,
      discardCard: '',
      totalRewardCoins: 0,
      playersScoreBoard: [],
    };

    let insertInfo = await PlayingTables.create(insertobj);

    return insertInfo;
  } catch (error) {
    logger.error('joinTable.js createTable error=> ', error, betInfo);
  }
};

module.exports.makeObjects = (length = 0) => {
  try {
    return Array.from({ length }, () => {
      return {};
    });
  } catch (error) {
    logger.error('joinTable.js makeObjects error=> ', error);
  }
};

module.exports.findEmptySeatAndUserSeat = async (table, betInfo, socket) => {
  try {
    // logger.info("\n findEmptySeatAndUserSeat socket  -->", socket.isBot)
    // logger.info("\n findEmptySeatAndUserSeat socket table -->", table)
    let seatIndex = this.findEmptySeat(table.playerInfo); //finding empty seat
    logger.info("\n findEmptySeatAndUserSeat seat index  -->", seatIndex)

    if (seatIndex === '-1') {
      if (socket && socket.isBot !== true) {
        await this.findTable(betInfo, socket);
        return false;
      } else {
        logger.info("not create table by BOT and seatindex")
        return false;
      }
    }


    let wh = { _id: socket.uid };
    let userInfo = await Users.findOne(wh, {}).lean();
    let totalWallet = Number(userInfo.chips);

    let playerGameChips = table.entryFee * 80;
    let gameDepositChips = playerGameChips;

    if (userInfo.chips > gameDepositChips) {
      playerGameChips = gameDepositChips;
      totalWallet -= gameDepositChips;
    } else if (userInfo.chips > playerGameChips * 2) {
      playerGameChips = playerGameChips * 2;
      totalWallet -= playerGameChips;
    } else if (userInfo.chips > playerGameChips) {
      playerGameChips;
      totalWallet -= playerGameChips;
    }

    let playerDetail = {
      seatIndex: seatIndex,
      _id: userInfo._id,
      playerId: userInfo._id,
      name: userInfo.name,
      username: userInfo.username,
      avatar: userInfo.avatar || "1",
      chips: totalWallet,
      gameChips: playerGameChips,
      playerStatus: '',
      point: 0,
      cards: [],
      gCard: { pure: [], impure: [], set: [], dwd: [] },
      turnMissCounter: 0,
      turnCount: 0,
      sck: socket.id,
      playerSocketId: socket.id,
      status: [CONST.ROUND_STARTED, CONST.ROUND_COLLECT_BOOT].includes(table.gameState) ? CONST.WATCHING : CONST.WAITING,
      winStatus: false,
      finished: false,
      playerLostChips: 0,
      pickedCard: '',
      debitChips: false,
      rejoin: false,
      isBot: userInfo.isBot
    };

    let whereCond = { _id: MongoID(table._id.toString()) };

    whereCond['playerInfo.' + seatIndex + '.seatIndex'] = { $exists: false };

    logger.info("Where Condition =>", whereCond);

    let setPlayerInfo = {
      $set: {},
      $inc: {
        activePlayer: 1,
      },
    };

    setPlayerInfo['$set']['playerInfo.' + seatIndex] = playerDetail;
    logger.info("joinTbale setPlayerInfo=>", whereCond);

    let tableInfo = await PlayingTables.findOneAndUpdate(whereCond, setPlayerInfo, { new: true });

    if (tableInfo == null && socket && socket.isBot !== true) {
      await this.findTable(betInfo, socket);
      return false;
    }
    let playerInfo = tableInfo.playerInfo[seatIndex];

    if (!(playerInfo._id.toString() === userInfo._id.toString())) {
      logger.info('\n Assign User Info :--> ', playerInfo._id + '\n Assign User Info :--> ', userInfo._id);
      await this.findTable(betInfo, socket);
      return false;
    }

    socket.seatIndex = seatIndex;
    socket.tbid = tableInfo._id;
    logger.info('\n Assign table id and seat index socket event ->', socket.seatIndex, socket.tbid);

    let diff = -1;

    if (tableInfo.activePlayer >= 2 && tableInfo.gameState === CONST.ROUND_START_TIMER) {
      let currentDateTime = new Date();
      let time = currentDateTime.getSeconds();
      let turnTime = new Date(tableInfo.gameTimer.GST);
      let Gtime = turnTime.getSeconds();

      diff = Gtime - time;
      diff += CONST.gameStartTime;
    }

    sendEvent(socket, CONST.JOIN_SIGN_UP, {});

    //GTI event
    sendEvent(socket, CONST.GAME_TABLE_INFO, {
      ssi: tableInfo.playerInfo[seatIndex].seatIndex,
      gst: diff,
      pi: tableInfo.playerInfo,
      utt: CONST.userTurnTimer,
      fns: CONST.finishTimer,
      tableid: tableInfo._id,
      gamePlayType: tableInfo.gamePlayType,
      type: tableInfo.gamePlayType,
      openDecks: tableInfo.openDeck,
      tableAmount: tableInfo.tableAmount,
    });

    //JT event
    if (userInfo.isBot == undefined || userInfo.isBot == false)
      socket.join(tableInfo._id.toString());

    sendDirectEvent(socket.tbid.toString(), CONST.JOIN_TABLE, {
      ap: tableInfo.activePlayer,
      playerDetail: tableInfo.playerInfo[seatIndex],
    });

    delete socket.JT;

    await Users.updateOne(
      { _id: MongoID(userInfo._id) },
      {
        $push: {
          "lastTableId": {
            $each: [MongoID(tableInfo._id.toString())],
            $slice: -3
          }
        }
      })

    if (tableInfo.activePlayer === 2 && tableInfo.gameState === '') {
      let jobId = 'LEAVE_SINGLE_USER:' + tableInfo._id;
      clearJob(jobId);
      gameStartActions.gameTimerStart(tableInfo);
    }


    // waiting for real player
    // let botJobId = 'WAITING' + ':' + tableInfo._id;
    // let delay = AddTime(7);
    // await setDelay(botJobId, new Date(delay));




    if (tableInfo.activePlayer == 1) {
      setTimeout(() => {
        if (tableInfo.maxSeat === 2 && tableInfo.activePlayer < 2) {
          setTimeout(() => {
            botLogic.findRoom(tableInfo, betInfo)
          }, 1000)
        } else if (tableInfo.maxSeat === 6 && tableInfo.activePlayer < 6) {
          setTimeout(() => {
            botLogic.findRoom(tableInfo, betInfo)
          }, 1000)
        }
      }, 7000)
    } else if (userInfo.isBot == true) {
      if (tableInfo.maxSeat === 2 && tableInfo.activePlayer < 2) {
        setTimeout(() => {
          botLogic.findRoom(tableInfo, betInfo)
        }, 1000)
      } else if (tableInfo.maxSeat === 6 && tableInfo.activePlayer < 6) {
        setTimeout(() => {
          botLogic.findRoom(tableInfo, betInfo)
        }, 1000)
      }
    }

    //let counter = 0;

    // const intervalId = setInterval(() => {
    //   counter++;
    //   logger.info(`Function called ${counter} times.`);
    //   botLogic.findRoom(tableInfo, betInfo)
    //   if (tableInfo.maxSeat === 2) {
    //     logger.info("Check 1", counter)
    //     if (counter === 1) {
    //       clearInterval(intervalId); // Stop the interval after 2 calls
    //     }
    //   } else {
    //     logger.info("Check 2", counter)
    //     if (counter === 5) {
    //       clearInterval(intervalId); // Stop the interval after 5 calls
    //     }
    //   }
    // }, 1200);

  } catch (error) {
    logger.error('joinTable.js findEmptySeatAndUserSeat error=> ', error, table);
  }
};

module.exports.findEmptySeat = (playerInfo) => {
  logger.info("PlyerInfo", playerInfo)
  try {
    for (let x in playerInfo) {
      if (typeof playerInfo[x] === 'object' && playerInfo[x] !== null && typeof playerInfo[x].seatIndex === 'undefined') {
        return parseInt(x);
      }
    }

    return '-1';
  } catch (error) {
    logger.error('joinTable.js findEmptySeat error=> ', error);
  }
};
