const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const PlayingTables = mongoose.model('playingTable');
const Users = mongoose.model('users');

const logger = require('../../logger');
const CONST = require('../../constant');
const leaveTableAction = require('./leaveTable');
// const { pic, mycardGroup } = require('../botFunction');
const botCtrl = require('./poolBotFunction');

const { lastUserWinnerDeclareCall } = require('./gameFinish');
const { getPlayingUserInRound } = require('../common-function/manageUserFunction');
const { clearJob, GetRandomString, AddTime, setDelay, sendEventInTable, sendDirectEvent } = require('../socketFunctions');
const { playerDrop } = require('./gamePlay');

module.exports.roundStarted = async (tbid) => {
  try {
    logger.info("pool roundStarted call tbid : ", tbid);
    const wh = {
      _id: MongoID(tbid),
    };

    const project = {
      gameState: 1,
      playerInfo: 1,
      activePlayer: 1,
      currentPlayerTurnIndex: 1,
    };

    let tabInfo = await PlayingTables.findOne(wh, project).lean();

    if (tabInfo === null) {
      logger.info('roundStarted table in 1:', tabInfo);
      return false;
    }

    if (tabInfo.gameState !== 'CardDealing' || tabInfo.activePlayer < 2) {
      logger.info('round Started table in 2 player:', tabInfo.gameState, tabInfo.activePlayer);
      return false;
    }

    const update = {
      $set: {
        gameState: CONST.ROUND_STARTED, //"RoundStated"
      },
    };

    const tb = await PlayingTables.findOneAndUpdate(wh, update, { new: true });

    await this.nextUserTurnstart(tb);
  } catch (e) {
    logger.error('roundStart.js roundStarted error : ', e);
  }
};

module.exports.startUserTurn = async (seatIndex, objData) => {
  try {
    let wh = {
      _id: objData._id.toString(),
    };

    let project = {
      jobId: 1,
    };

    let tabInfo = await PlayingTables.findOne(wh, project).lean();
    logger.info("pool init Game State table Info : ", tabInfo);

    if (typeof tabInfo.jobId !== 'undefined' && tabInfo.jobId !== '') {
      await clearJob(tabInfo.jobId);
    }

    let jobId = GetRandomString(10);

    let update = {
      $set: {
        currentPlayerTurnIndex: seatIndex,
        turnDone: false,
        'gameTimer.ttimer': new Date(),
        jobId: jobId,
      },
    };
    logger.info("pool startUserTurn wh update ::", wh, update);

    const tb = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
    logger.info("pool \n init Game State table Info : ", JSON.stringify(tb, null, 5));

    const playerInGame = await getPlayingUserInRound(tb.playerInfo);
    //logger.info('startUserTurn playerInGame ::', playerInGame);

    if (playerInGame.length === 1) {
      logger.info("pool startUserTurn single user in game so game goes on winner state..!");
      await lastUserWinnerDeclareCall(tb);
      return false;
    }

    logger.info("pool tb.openDeck -->: ", tb.openDeck);
    let lastCardIndex = tb.openDeck.length - 1;
    logger.info("pool startUserTurn lastCardIndex : ", lastCardIndex);

    if (lastCardIndex < 0) {
      lastCardIndex = 0;
    }

    logger.info("pool After startUserTurn lastCardIndex : ", lastCardIndex);

    const deck = 'open';

    let response = {
      si: tb.currentPlayerTurnIndex,
      pi: tb.playerInfo[tb.currentPlayerTurnIndex]._id,
      playerName: tb.playerInfo[tb.currentPlayerTurnIndex].name,
      deck,
    };

    // logger.info("\nstartUserTurn response =>", response);

    sendEventInTable(tb._id.toString(), CONST.USER_TURN_START, response);

    //Assign to BOT
    let plid = tb.playerInfo[tb.currentPlayerTurnIndex]._id
    logger.info("player id bot =>", plid)

    const data = await Users.findOne({
      _id: MongoID(plid),
    }).lean();
    logger.info("pool check pic data =>", data)

    if (data && data.isBot) {
      await botCtrl.pic(tb, plid, tb.gamePlayType, 'close')
    }

    let tbid = tb._id.toString();

    let time = CONST.userTurnTimer;
    let turnChangeDelayTimer = AddTime(time);

    await setDelay(jobId, new Date(turnChangeDelayTimer));

    await this.userTurnExpaire(tbid);
    // logger.info("result-->", result);
  } catch (e) {
    logger.error('roundStart.js startUserTurn error : ', e);
  }
};

module.exports.userTurnExpaire = async (tbid) => {
  try {
    // logger.info("\nuserTurnExpaire tbid : ", tbid);
    const wh = {
      _id: MongoID(tbid),
    };

    let project = {
      gameState: 1,
      playerInfo: 1,
      activePlayer: 1,
      currentPlayerTurnIndex: 1,
      turnDone: 1,
      openDeck: 1,
      gameTimer: 1,
    };

    let tabInfo = await PlayingTables.findOne(wh, project).lean();
    // logger.info("userTurnExpaire tabInfo : ", tabInfo);

    if (tabInfo === null || tabInfo.gameState !== 'RoundStated') return false;

    let activePlayerInRound = await getPlayingUserInRound(tabInfo.playerInfo);
    // logger.info("userTurnExpaire activePlayerInRound ==>  ", activePlayerInRound);

    if (activePlayerInRound.length === 0 || tabInfo.turnDone) {
      logger.info('userTurnExpaire : user not activate found!!', activePlayerInRound, tabInfo.turnDone);
      return false;
    }
    // logger.info("\nmanagePlayerOnLeave activePlayerInRound :",activePlayerInRound, activePlayerInRound.length,tabInfo.gameState);
    // logger.info("tabinfo.playerInfo :--> ", tabInfo.playerInfo[tabInfo.currentPlayerTurnIndex]);
    let playerInfo = tabInfo.playerInfo[tabInfo.currentPlayerTurnIndex];
    // logger.info("userTurnExpaire playerInfo ::--> ", playerInfo);

    const playersCards = playerInfo.cards;
    if (playerInfo.pickedCard !== '') {
      const pickedCard = playerInfo.pickedCard;
      // logger.info("userTurnExpaire picked Card => ", pickedCard);

      let pickedCardIndex = playersCards.findIndex((card) => card === pickedCard);
      // logger.info("userTurnExpaire pickedCardIndex => ", pickedCardIndex);

      playersCards.splice(pickedCardIndex, 1);
      // logger.info("userTurnExpaire playerInfo ::--> ", tabInfo.openDeck);
      tabInfo.openDeck.push(pickedCard);

      // logger.info("players Cards =>", playersCards);
      let response = {
        playerId: playerInfo._id,
        disCard: pickedCard,
      };

      sendEventInTable(tabInfo._id.toString(), CONST.USER_TIME_OUT, response);
      // io.to(table.tableId).emit("req", { "eventName": CONST.USER_TIME_OUT, "data": { "playerId": table.currentPlayingPlayerId, "disCard": pickedCard } });
    }

    const whPlayer = {
      _id: MongoID(tbid),
      'playerInfo.seatIndex': Number(tabInfo.currentPlayerTurnIndex),
    };

    let update = {
      $set: {
        'playerInfo.$.cards': playersCards,
        openDeck: tabInfo.openDeck,
        'playerInfo.$.gCard': playerInfo.gCard,
        'playerInfo.$.pickedCard': '',
      },
      $inc: {
        'playerInfo.$.turnMissCounter': 1,
        'playerInfo.$.turnCount': 1,
      },
    };
    // logger.info("userTurnExpaire whPlayer update :: ", whPlayer, update);

    const upRes = await PlayingTables.findOneAndUpdate(whPlayer, update, {
      new: true,
    });

    // logger.info("userTurnExpaire upRes : ", upRes);
    // logger.info("upRes.playerInfo[upRes.currentPlayerTurnIndex] :  ", upRes.playerInfo[upRes.currentPlayerTurnIndex]);
    if (upRes.playerInfo[upRes.currentPlayerTurnIndex].turnMissCounter >= 3) {
      // logger.info("userTurnExpaire : user turn miss 3 times");
      let sckId = upRes.playerInfo[upRes.currentPlayerTurnIndex].sck
      sendDirectEvent(sckId, CONST.USER_MESSAGE, { msg: 'User Drop Out for Missed 3 turn' });

      this.handleTimeOut(upRes.playerInfo[upRes.currentPlayerTurnIndex], tbid);
      return;
    }

    return await this.nextUserTurnstart(tabInfo);
  } catch (e) {
    logger.info('userTurnExpaire error : ', e);
  }
};

module.exports.handleTimeOut = async (turnIndex, tbid) => {
  // logger.info("\n handle TimeOut turnIndex :", turnIndex, "ttttbbbb--->", tbid);
  let playerInfo = turnIndex;
  logger.info('handle TimeOut tb.pi[turnIndex] :: ', playerInfo);

  let requestData = { playerId: playerInfo._id };

  let client = {
    tbid: tbid,
    uid: playerInfo._id,
    seatIndex: playerInfo.seatIndex,
    sck: playerInfo.sck,
  };

  // logger.info("requestData, client ==> ", requestData, client);
  // const res = await leaveTableAction.leaveTable(requestData, client);
  const res = await playerDrop(requestData, client);
  if (!res) {
    logger.info('roundStart.js leave table : user turn miss 3 times res : ', res);
  }
  //Diskcard Card Function Called
  return;
};

module.exports.nextUserTurnstart = async (tb) => {
  try {
    logger.info("pool next User Turnstart tb => :: ", tb);
    let nextTurnIndex = await this.getUserTurnSeatIndex(tb, tb.currentPlayerTurnIndex, 0);
    logger.info('pool nextUserTurnstart nextTurnIndex :: ', nextTurnIndex);

    await this.startUserTurn(nextTurnIndex, tb, false);
  } catch (e) {
    logger.error('pool roundStart.js nextUserTurnstart error : ', e);
  }
};

module.exports.DealerRobotLogicCard = async (PlayerInfo, wildcard, tbid) => {
  if (PlayerInfo.length == 0) {
    return false
  }

  let userData = PlayerInfo.splice(0, 1)

  if (userData[0].isBot) {

    botCtrl.mycardGroup(userData[0].cards, wildcard, async (cardjson) => {

      if (cardjson.dwd.length > 0) {
        cardjson.dwd = [cardjson.dwd]
      }

      //update user game finish status
      let updateStatus = {
        $set: {},
      };
      updateStatus.$set['playerInfo.$.gCard'] = cardjson;

      const qr = {
        _id: MongoID(tbid.toString()),
        'playerInfo.seatIndex': Number(userData[0].seatIndex),
      };

      const table = await PlayingTables.findOneAndUpdate(qr, updateStatus, {
        new: true,
      });

      logger.info("pool DealerRobotLogicCard table =>", table)
      this.DealerRobotLogicCard(PlayerInfo, wildcard, tbid)

    });
  } else {
    this.DealerRobotLogicCard(PlayerInfo, wildcard, tbid)
  }
}

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
    const index = await this.getUserTurnSeatIndex(tbInfo, x, counter);
    return index;
  } else {
    logger.info('getUserTurnSeatIndex x', x);
    return x;
  }
};