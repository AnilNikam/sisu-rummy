const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const BetLists = mongoose.model('dealbetLists');
const Users = mongoose.model('users');
const PlayingTables = mongoose.model('playingTable');

// const botCtrl = require('./assignBot');
const { findRoom } = require('./assignBot');
const gameStartActions = require('./gameStart');
const CONST = require('../../constant');
const logger = require('../../logger');

const { sendEvent, sendDirectEvent, clearJob } = require('../socketFunctions');
const { userReconnect } = require('../common-function/reConnectFunction');

module.exports.joinTable = async (requestData, socket) => {
  try {
    logger.info('Join Deal Table Request Data : ', JSON.stringify(requestData));
    logger.info('\n socket joinTable Table Id: ', socket.tbid);

    const entryFee = requestData.entryFee.toString()


    if (typeof socket.uid === 'undefined') {
      sendEvent(socket, CONST.JOIN_TABLE, requestData, {
        flag: false,
        msg: 'Please restart game!!',
      });
      return false;
    }

    if (typeof socket.JT !== 'undefined' && socket.JT) {
      return false
    };

    socket.JT = true;

    let query = {
      deal: Number(requestData.deal),
      entryFee: entryFee,
      maxSeat: parseInt(requestData.maxSeat)
    };

    const betInfo = await BetLists.findOne(query, {}).lean();
    logger.info('deal bet info -->', betInfo);

    let condition = { _id: MongoID(socket.uid) };
    let userInfo = await Users.findOne(condition, {}).lean();
    logger.info("userInfo =>", userInfo)
    logger.info("userInfo.chips =>", userInfo.chips)
    logger.info("userInfo.winningChips =>", userInfo.winningChips)

    let gameChips = requestData.entryFee;

    if (Number(userInfo.chips + userInfo.winningChips) < Number(gameChips)) {
      sendEvent(socket, CONST.INSUFFICIENT_CHIPS, requestData, {
        flag: false,
        msg: 'Please Add Wallet!!',
      });
      delete socket.JT;
      return false;
    }

    let wh = { 'playerInfo._id': MongoID(socket.uid) };
    let tableInfo = await PlayingTables.findOne(wh, {}).lean();

    if (tableInfo !== null) {
      sendEvent(socket, CONST.JOIN_TABLE, requestData, {
        flag: false,
        msg: 'Already In playing table!!',
      });

      await userReconnect({ playerId: socket.uid }, socket);
      delete socket.JT;

      return false;
    } else {
      return await this.findTable(betInfo, socket, userInfo);
    }
  } catch (error) {
    logger.error('joinTable.js joinTable error=> ', error, requestData);
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
      logger.info('Table find gamestart Timer diffrence :', Math.abs(diff), '  --> ', diff);

      if (Math.abs(diff) > 6 && Math.abs(diff) < 10) {
        let wh = { _id: tableInfo._id };

        let update = {
          $set: {
            tableLock: true,
          },
        };

        const tblInfo = await PlayingTables.findOneAndUpdate(wh, update, {
          new: true,
        });

        logger.info('  ==> time is less than 4 secconds tblInfo <== ', tblInfo);
        tableInfo = await this.getBetTable(betInfo, userInfo);
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
    logger.info('getBetTable betInfo ->', betInfo);
    let wh = {
      _id: { $nin: userInfo.lastTableId },
      deal: betInfo.deal,
      entryFee: betInfo.entryFee,
      activePlayer: { $gte: 0, $lt: betInfo.maxSeat },
      gamePlayType: 'dealrummy',
      tableLock: false,
      maxSeat: parseInt(betInfo.maxSeat),
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
    let winingDeclareCount = getRandomNumber(4, 8)

    let insertobj = {
      maxSeat: betInfo.maxSeat,
      betId: betInfo._id,
      entryFee: betInfo.entryFee,
      commission: betInfo.commission,
      deal: parseInt(betInfo.deal),
      gameType: parseInt(betInfo.deal),
      activePlayer: 0,
      gamePlayType: betInfo.gamePlayType,
      playerInfo: this.makeObjects(Number(betInfo.maxSeat)),
      discardCard: '',
      totalRewardCoins: 0,
      playersScoreBoard: [],
      winingDeclareCount: winingDeclareCount

    };
    logger.info('Create Table Insert Obj => ', insertobj);

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
    logger.info("deal findEmptySeatAndUserSeat betInfo ::", betInfo);

    let seatIndex = this.findEmptySeat(table.playerInfo); //finding empty seat
    // logger.info("findEmptySeatAndUserSeat seatIndex ::", seatIndex);

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
    let totalWallet = Number(userInfo.chips) + Number(userInfo.winningChips);

    let playerGameChips = table.entryFee
    totalWallet -= playerGameChips;



    let playerDetail = {
      seatIndex: seatIndex,
      _id: userInfo._id,
      playerId: userInfo._id,
      name: userInfo.name,
      username: userInfo.username,
      avatar: userInfo.avatar,
      currentGamePoint: 0,
      point: 0,
      detain: false,
      chips: totalWallet,
      gameChips: 0,
      playerStatus: '',
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

    //logger.info('findEmptySeatAndUserSeat playerDetail : ', playerDetail, '\n find Empty Seat And User Seat table : ', table);

    let whereCond = { _id: MongoID(table._id.toString()) };

    whereCond['playerInfo.' + seatIndex + '.seatIndex'] = { $exists: false };

    let setPlayerInfo = {
      $set: {},
      $inc: {
        activePlayer: 1,
      },
    };

    setPlayerInfo['$set']['playerInfo.' + seatIndex] = playerDetail;

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

    logger.info('\n Assign tbale id and seat index socket event ->', socket.seatIndex, socket.tbid);

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
      type: tableInfo.gameType,
      openDecks: tableInfo.openDeck,
      tableAmount: tableInfo.tableAmount,
      deal: tableInfo.deal,
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

    logger.info("Table Info 1==>", tableInfo)
    logger.info("Table userInfo 1==>", userInfo)
    logger.info("\n Table activePlayer 1==>", tableInfo.activePlayer)

    if (tableInfo.activePlayer == 1) {
      setTimeout(() => {
        if (tableInfo.maxSeat === 2 && tableInfo.activePlayer < 2) {
          setTimeout(() => {
            // findDealRoom(tableInfo, betInfo)
            findRoom(tableInfo, betInfo)
          }, 1000)
        } else if (tableInfo.maxSeat === 6 && tableInfo.activePlayer < 6) {
          setTimeout(() => {
            logger.info("check call function 111 ==>")
            // findDealRoom(tableInfo, betInfo)
            findRoom(tableInfo, betInfo)
          }, 1000)
        }
      }, 7000)
    } else if (userInfo.isBot == true) {
      logger.info("check call function seat bot 2==>")
      logger.info("check call function MAx seat 2==>", tableInfo.maxSeat)
      logger.info("\n else Table activePlayer 2==>", tableInfo.activePlayer)


      if (tableInfo.maxSeat === 2 && tableInfo.activePlayer < 2) {
        setTimeout(() => {
          // findDealRoom(tableInfo, betInfo)
          findRoom(tableInfo, betInfo)
        }, 1000)
      } else if (tableInfo.maxSeat === 6 && tableInfo.activePlayer < 6) {
        setTimeout(() => {
          logger.info("check call function 222 ==>")
          // findDealRoom(tableInfo, betInfo)
          findRoom(tableInfo, betInfo)
        }, 1000)
      }
    }
  } catch (error) {
    logger.error('joinTable.js findEmptySeatAndUserSeat error=> ', error, table);
  }
};

module.exports.findEmptySeat = (playerInfo) => {
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

const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}