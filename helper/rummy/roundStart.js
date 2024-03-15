const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const PlayingTables = mongoose.model('playingTable');
const Users = mongoose.model('users');

const CONST = require('../../constant');
const logger = require('../../logger');

const { leaveTable } = require('./leaveTable');
const { pic, mycardGroup } = require('../botFunction');
const { getPlayingUserInRound } = require('../common-function/manageUserFunction');
const { lastUserWinnerDeclareCall } = require('./gameFinish');
const { clearJob, GetRandomString, AddTime, setDelay, sendEventInTable, sendDirectEvent } = require('../socketFunctions');


module.exports.roundStarted = async (tbid) => {
  try {
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
    //logger.info('Round start table =>', tb);

    await this.nextUserTurnstart(tb);
  } catch (e) {
    logger.error('roundStart.js roundStarted error : ', e);
  }
};

module.exports.nextUserTurnstart = async (tb) => {
  try {

    if (!tb) {
      logger.error('roundStart.js nextUserTurnstart error: tb is not provided');
      return;
    }
    let nextTurnIndex = await this.getUserTurnSeatIndex(tb, tb.currentPlayerTurnIndex, 0);

    await this.startUserTurn(nextTurnIndex, tb, false);
  } catch (e) {
    logger.error('roundStart.js nextUserTurnstart error : ', e);
  }
};

module.exports.startUserTurn = async (seatIndex, objData) => {
  try {
    //logger.info('startUserTurn turnIndex :', seatIndex, '\n startUserTurn objData => ', objData);
    // let jobid = CONST.TURN_START + ":" + objData._id.toString(); // remove later

    let wh = {
      _id: objData._id.toString(),
    };

    let project = {
      jobId: 1,
    };

    let tabInfo = await PlayingTables.findOne(wh, project).lean();
    // logger.info("init Game State table Info : ", tabInfo);

    if (tabInfo === null) {
      logger.info('startUserTurn table in :', tabInfo);
      return false;
    }

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

    const tb = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
    const playerInGame = await getPlayingUserInRound(tb.playerInfo);

    if (playerInGame.length === 1) {
      await lastUserWinnerDeclareCall(tb);
      return false;
    }

    let lastCardIndex = tb.openDeck.length - 1;

    if (lastCardIndex < 0) {
      lastCardIndex = 0;
    }

    const deck = 'open';


    let response = {
      si: tb.currentPlayerTurnIndex,
      pi: tb.playerInfo[tb.currentPlayerTurnIndex]._id,
      playerName: tb.playerInfo[tb.currentPlayerTurnIndex].name,
      deck,
    };

    sendEventInTable(tb._id.toString(), CONST.USER_TURN_START, response);

    //Assign to bot
    let plid = tb.playerInfo[tb.currentPlayerTurnIndex]._id

    const data = await Users.findOne({
      _id: MongoID(plid),
    }).lean();

    logger.info("check pic data =>", data)

    if (data && data.isBot) {
      await pic(tb, plid, tb.gamePlayType, 'close')
    }

    let tbid = tb._id.toString();
    let time = CONST.userTurnTimer;
    let turnChangeDelayTimer = AddTime(time);


    await setDelay(jobId, new Date(turnChangeDelayTimer));

    await this.userTurnExpaire(tbid);
  } catch (e) {
    logger.error('roundStart.js startUserTurn error : ', e);
  }
};

module.exports.userTurnExpaire = async (tbid) => {
  try {
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

    if (tabInfo === null || tabInfo.gameState !== 'RoundStated') return false;

    let activePlayerInRound = await getPlayingUserInRound(tabInfo.playerInfo);

    if (activePlayerInRound.length === 0 || tabInfo.turnDone) {
      logger.info('userTurnExpaire : user not activate found!!', activePlayerInRound, tabInfo.turnDone);
      return false;
    }

    let playerInfo = tabInfo.playerInfo[tabInfo.currentPlayerTurnIndex];

    const playersCards = playerInfo.cards;
    if (playerInfo.pickedCard !== '') {
      const pickedCard = playerInfo.pickedCard;

      let pickedCardIndex = playersCards.findIndex((card) => card === pickedCard);

      playersCards.splice(pickedCardIndex, 1);
      tabInfo.openDeck.push(pickedCard);

      let response = {
        playerId: playerInfo._id,
        disCard: pickedCard,
      };

      sendEventInTable(tabInfo._id.toString(), CONST.USER_TIME_OUT, response);
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

    const upRes = await PlayingTables.findOneAndUpdate(whPlayer, update, {
      new: true,
    });

    if (upRes.playerInfo[upRes.currentPlayerTurnIndex].turnMissCounter >= 3) {
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
  let playerInfo = turnIndex;
  logger.info('handle TimeOut tb.pi[turnIndex] :: ', playerInfo);

  let requestData = { playerId: playerInfo._id, autotimeout: true };

  let client = {
    tbid: tbid,
    uid: playerInfo._id,
    seatIndex: playerInfo.seatIndex,
    sck: playerInfo.sck,
  };

  const res = await leaveTable(requestData, client);
  if (!res) {
    logger.info('roundStart.js leave table : user turn miss 3 times res : ', res);
  }
  return;
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
    const index = await this.getUserTurnSeatIndex(tbInfo, x, counter);
    return index;
  } else {
    logger.info('getUserTurnSeatIndex x', x);
    return x;
  }
};


module.exports.DealerRobotLogicCard = async (PlayerInfo, wildcard, tbid) => {
  if (PlayerInfo.length == 0) {
    return false
  }

  var userData = PlayerInfo.splice(0, 1)

  if (userData[0].isBot) {

    mycardGroup(userData[0].cards, wildcard, async (cardjson) => {

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
      console.log("qr ", qr)
      console.log("updateStatus ", updateStatus)

      const table = await PlayingTables.findOneAndUpdate(qr, updateStatus, {
        new: true,
      });

      logger.info("rummy DealerRobotLogicCard table =>", table)
      this.DealerRobotLogicCard(PlayerInfo, wildcard, tbid)

    });
  } else {
    this.DealerRobotLogicCard(PlayerInfo, wildcard, tbid)
  }
}