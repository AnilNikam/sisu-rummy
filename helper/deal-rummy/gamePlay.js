const mongoose = require('mongoose');
const PlayingTables = mongoose.model('playingTable');
const commandAcions = require('../socketFunctions');

const { nextUserTurnstart, DealerRobotLogicCard } = require('./roundStart');
const { getPlayingUserInRound } = require('../common-function/manageUserFunction');

const gameFinishActions = require('./gameFinish');
const checkWinnerActions = require('./checkWinner');
const CONST = require('../../constant');
const logger = require('../../logger');
const MongoID = mongoose.Types.ObjectId;

const { pushPlayerScoreToPlayerScoreBoard } = require('../common-function/cardFunction');
const { ifSocketDefine, shuffle } = require('../helperFunction');

module.exports.pickCard = async (requestData, client) => {
  try {
    //logger.info('Request Data ', requestData);
    if (!ifSocketDefine(requestData, client, CONST.PICK_CARD)) {
      return false;
    }
    if (typeof client.pickCard !== 'undefined' && client.pickCard) return false;

    client.pickCard = true;

    const wh = {
      _id: MongoID(client.tbid.toString()),
    };

    const project = {};
    let tableInfo = await PlayingTables.findOne(wh, project).lean();

    if (tableInfo === null) {
      logger.info('pickCard user not turn ::', tableInfo);
      delete client.pickCard;
      return false;
    }

    if (tableInfo.turnDone) {
      logger.info('pickCard : client.su ::', client.seatIndex);
      delete client.pickCard;
      commandAcions.sendDirectEvent(client.sck, CONST.PICK_CARD, requestData, false, 'Turn is already taken!');
      return false;
    }

    if (parseInt(tableInfo.currentPlayerTurnIndex) !== parseInt(client.seatIndex)) {
      delete client.pickCard;
      commandAcions.sendDirectEvent(client.sck, CONST.PICK_CARD, requestData, false, "It's not your turn!");
      return false;
    }

    let updateData = {
      $set: {},
      $inc: {},
    };

    let pickedCard;
    let playerInfo = tableInfo.playerInfo[client.seatIndex];

    if (requestData.deck === 'open') {
      pickedCard = tableInfo.openDeck.pop();

      const words = pickedCard.split('-');

      if ((words[0] === 'J' || tableInfo.wildCard.split('-')[1] === words[1]) && tableInfo.openDeck.length != 0) {
        logger.info("deal rummy JOKER");
        delete client.pickCard;
        commandAcions.sendDirectEvent(client.sck, CONST.PICK_CARD, requestData, false, "You can't pick the joker!");
        return false;
      }


      playerInfo.cards.push(pickedCard.toString());

      if (playerInfo.playerStatus === 'PLAYING') {
        updateData.$set['playerInfo.$.cards'] = playerInfo.cards;
        updateData.$set['playerInfo.$.pickedCard'] = pickedCard;
        updateData.$set['openDeck'] = tableInfo.openDeck;
        updateData.$inc['playerInfo.$.turnCount'] = 1;
      }

      // the Scheduele job
      // commandAcions.clearJob(tabInfo.jobId);

      const upWh = {
        _id: MongoID(client.tbid.toString()),
        'playerInfo.seatIndex': Number(client.seatIndex),
      };

      // console.log("pickCard upWh updateData :: ", upWh, updateData);
      if (playerInfo.turnMissCounter > 0) {
        playerInfo.turnMissCounter = 0;
        updateData.$set['playerInfo.' + client.seatIndex + '.turnMissCounter'] = playerInfo.turnMissCounter;
      }
      tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
        new: true,
      });
    } else if (requestData.deck === 'close') {
      if (tableInfo.closeDeck.length === 0) {
        let newOpenDeck = tableInfo.openDeck;
        let newCloseDeck = newOpenDeck.slice(0, newOpenDeck.length - 5);

        updateData.$set['closeDeck'] = shuffle(newCloseDeck);
        updateData.$set['openDeck'] = newOpenDeck;

        let upWh = {
          _id: MongoID(tableInfo._id.toString()),
        };

        let tbl = await PlayingTables.findOneAndUpdate(upWh, updateData, {
          new: true,
        });
        logger.info('check Close Deck ', tbl);
      }
      pickedCard = tableInfo.closeDeck.pop();
      playerInfo.cards.push(pickedCard.toString());

      //logger.info('pickedCard     ==>', pickedCard);

      if (playerInfo.playerStatus === 'PLAYING') {
        updateData.$set['playerInfo.$.cards'] = playerInfo.cards;
        updateData.$set['playerInfo.$.pickedCard'] = pickedCard;
        updateData.$set['closeDeck'] = tableInfo.closeDeck;
        updateData.$inc['playerInfo.$.turnCount'] = 1;
      }

      const upWh = {
        _id: MongoID(client.tbid.toString()),
        'playerInfo.seatIndex': Number(client.seatIndex),
      };

      if (playerInfo.turnMissCounter > 0) {
        playerInfo.turnMissCounter = 0;
        updateData.$set['playerInfo.' + client.seatIndex + '.turnMissCounter'] = playerInfo.turnMissCounter;
      }
      tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
        new: true,
      });
    }

    let response = {
      pickedCard: pickedCard,
      playerId: playerInfo._id,
      deck: requestData.deck,
      closedecklength: tableInfo.closeDeck.length,
    };
    commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.PICK_CARD, response);

    delete client.pickCard;
    return true;
  } catch (e) {
    logger.error('gamePlay.js pick Card error => ', e);
  }
};

module.exports.disCard = async (requestData, client) => {
  try {
    if (!ifSocketDefine(requestData, client, CONST.DISCARD)) {
      return false;
    }

    if (typeof client.disCard !== 'undefined' && client.disCard) return false;

    client.disCard = true;

    const wh = {
      _id: MongoID(client.tbid.toString()),
    };

    const project = {};
    const tabInfo = await PlayingTables.findOne(wh, project).lean();

    if (tabInfo === null) {
      logger.info('disc card user not turn ::', tabInfo);
      delete client.disCard;
      return false;
    }

    if (tabInfo.turnDone) {
      logger.info('disc card : client.su ::', client.seatIndex);
      delete client.disCard;
      commandAcions.sendDirectEvent(client.sck, CONST.DISCARD, requestData, false, 'Turn is already taken!');
      return false;
    }

    if (tabInfo.currentPlayerTurnIndex !== client.seatIndex) {
      delete client.disCard;
      commandAcions.sendDirectEvent(client.sck, CONST.DISCARD, requestData, false, "It's not your turn!");
      return false;
    }

    let droppedCard = requestData.cardName;
    let playerInfo = tabInfo.playerInfo[client.seatIndex];
    let playersCards = playerInfo.cards;

    const droppedCardIndex = playersCards.indexOf(droppedCard);
    const disCard = playersCards[droppedCardIndex];

    playerInfo.cards.splice(droppedCardIndex, 1);

    //remove picCard
    playerInfo.pickedCard = '';
    tabInfo.openDeck.push(disCard);

    //logger.info('<-- after Discraded Open Deck --- > ', tabInfo.openDeck);

    let updateData = {
      $set: {},
      $inc: {},
    };

    if (playerInfo.playerStatus === 'PLAYING') {
      updateData.$set['playerInfo.$.cards'] = playerInfo.cards;
      updateData.$set['playerInfo.$.pickedCard'] = '';
      updateData.$set['openDeck'] = tabInfo.openDeck;
    }

    //cancel Schedule job
    commandAcions.clearJob(tabInfo.jobId);

    const upWh = {
      _id: MongoID(client.tbid.toString()),
      'playerInfo.seatIndex': Number(client.seatIndex),
    };

    const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });

    let response = {
      playerId: playerInfo._id,
      disCard: disCard,
    };

    commandAcions.sendEventInTable(tb._id.toString(), CONST.DISCARD, response);

    delete client.disCard;
    let activePlayerInRound = await getPlayingUserInRound(tb.playerInfo);

    if (activePlayerInRound.length === 1) {
      await gameFinishActions.lastUserWinnerDeclareCall(tb);
    } else {
      await nextUserTurnstart(tb);
    }
    return true;
  } catch (e) {
    logger.error('gamePlay.js discard Card error => ', e);
  }
};

module.exports.cardGroup = async (requestData, client) => {
  try {
    if (!ifSocketDefine(requestData, client, CONST.CARD_GROUP)) {
      return false;
    }

    if (typeof client.cardGroup !== 'undefined' && client.cardGroup) return false;

    client.cardGroup = true;

    const wh = {
      _id: MongoID(client.tbid.toString()),
    };

    const project = {};

    const tabInfo = await PlayingTables.findOne(wh, project).lean();

    if (tabInfo === null) {
      delete client.cardGroup;
      return false;
    }

    let playerDetails = tabInfo.playerInfo[client.seatIndex];

    playerDetails.gCard = {
      pure: requestData.pure,
      impure: requestData.impure,
      set: requestData.set,
      dwd: requestData.dwd,
    };

    let updateData = {
      $set: {
        ['playerInfo.$.gCard']: playerDetails.gCard,
      },
      $inc: {},
    };

    //Cancel the Scheduele job
    // commandAcions.clearJob(tabInfo.jobId);

    const upWh = {
      _id: MongoID(client.tbid.toString()),
      'playerInfo.seatIndex': Number(client.seatIndex),
    };

    await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });

    delete client.cardGroup;
    return true;
  } catch (e) {
    logger.error('gamePlay.js cardGroup error => ', e);
  }
};

module.exports.declare = async (requestData, client) => {
  try {
    if (!ifSocketDefine(requestData, client, CONST.DECLARE)) {
      return false;
    }

    if (typeof client.declare !== 'undefined' && client.declare) return false;

    client.declare = true;

    const wh = {
      _id: MongoID(client.tbid.toString()),
    };

    const project = {};
    const tableInfo = await PlayingTables.findOne(wh, project).lean();

    if (tableInfo === null) {
      logger.info('Player Declare user not turn ::', tableInfo);
      delete client.declare;
      return false;
    }
    if (tableInfo.turnDone) {
      logger.info('Player Declare : client.su ::', client.seatIndex);
      delete client.declare;
      commandAcions.sendDirectEvent(client.sck, CONST.DECLARE, requestData, false, 'Turn is already taken!');
      return false;
    }
    if (tableInfo.currentPlayerTurnIndex !== client.seatIndex) {
      logger.info('Player Declare : client.su ::', client.seatIndex);
      delete client.declare;
      commandAcions.sendDirectEvent(client.sck, CONST.DECLARE, requestData, false, "It's not your turn!");
      return false;
    }
    // eslint-disable-next-line no-unused-vars
    const playerInGame = await getPlayingUserInRound(tableInfo.playerInfo);

    let droppedCard = requestData.cardName;
    let playerDetails = tableInfo.playerInfo[client.seatIndex];
    let playersCards = playerDetails.cards;

    const droppedCardIndex = playersCards.indexOf(droppedCard);
    const disCard = playersCards[droppedCardIndex];

    playerDetails.cards.splice(droppedCardIndex, 1);
    tableInfo.openDeck.push(disCard);

    //Cancel the Scheduele job
    commandAcions.clearJob(tableInfo.jobId);

    let response = {
      playerId: playerDetails._id,
      disCard,
    };

    const upWh = {
      _id: MongoID(client.tbid.toString()),
      'playerInfo.seatIndex': Number(client.seatIndex),
    };

    const updateData = {
      $set: {
        discardCard: disCard,
      },
    };

    const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });

    commandAcions.sendEventInTable(tb._id.toString(), CONST.DECLARE, response);
    commandAcions.sendEventInTable(tb._id.toString(), CONST.DECLARE_TIMER_SET, { pi: playerDetails._id });

    logger.info("Deal - rummy playerInGame ", playerInGame)
    DealerRobotLogicCard(playerInGame, parseInt(tableInfo.wildCard.split("-")[1]), tb._id.toString())


    delete client.declare;

    let roundTime = CONST.finishTimer;
    let tableId = tb._id;
    let fnsJobId = CONST.DECLARE_TIMER_SET + ':' + tableId;
    let delay = commandAcions.AddTime(roundTime);

    await commandAcions.setDelay(fnsJobId, new Date(delay));

    logger.info(' ===> Pool Main Clear Job <===');
    await checkWinnerActions.winnercall(tb, client);

    return true;
  } catch (e) {
    logger.error('gamePlay.js declare error => ', e);
  }
};

module.exports.invalidDeclare = async (tbInfo, client) => {
  try {
    let table = tbInfo;

    if (typeof client.invalidDeclare !== 'undefined' && client.invalidDeclare) {
      logger.info('Invalid requestData False: ', table);
      return false;
    }

    client.invalidDeclare = true;

    const wh = {
      _id: MongoID(table._id.toString()),
    };

    const project = {};
    const tabInfo = await PlayingTables.findOne(wh, project).lean();

    if (tabInfo === null) {
      logger.info('InValid Declare user not turn ::', tabInfo);
      delete client.invalidDeclare;
      return false;
    }

    let playerInfo = tabInfo.playerInfo[tabInfo.currentPlayerTurnIndex];
    logger.info('playerInfo invalid Declare ==> ', JSON.stringify(playerInfo));

    //call update lost counter
    // eslint-disable-next-line no-unused-vars
    let res = await gameFinishActions.updateLostCounter(playerInfo._id);

    //Cancel the Scheduele job
    commandAcions.clearJob(tabInfo.jobId);

    const playersCards = playerInfo.cards;

    if (playerInfo.pickedCard !== '') {
      let pickedCard = playerInfo.pickedCard;
      let pickedCardIndex = playersCards.findIndex((card) => card === pickedCard);

      playersCards.splice(pickedCardIndex, 1);
      tabInfo.openDeck.push(pickedCard);
    }

    let userTrack = {
      _id: playerInfo._id,
      username: playerInfo.username,
      seatIndex: playerInfo.seatIndex,
      cards: playerInfo.cards,
      gCard: playerInfo.gCard,
      gameBet: tabInfo.entryFee,
      playerStatus: 'InvalidDeclare',
    };

    let lostChips = Number(CONST.PLAYER_SCORE);

    let response = {
      pi: playerInfo.playerId,
      name: playerInfo.name,
      point: CONST.PLAYER_SCORE,
      lostChips: lostChips,
      status: playerInfo.status,
      discardCard: tabInfo.discardCard,
    };
    commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.INVALID_DECLARE, response);

    const upWh = {
      _id: MongoID(client.tbid.toString()),
      'playerInfo.seatIndex': Number(client.seatIndex),
    };

    const updateData = {
      $set: {
        'playerInfo.$.status': CONST.INVALID_DECLARE,
        'playerInfo.$.playerStatus': CONST.INVALID_DECLARE,
        'playerInfo.$.cards': playersCards,
        'playerInfo.$.gCard': playerInfo.gCard,
        'playerInfo.$.currentGamePoint': lostChips,
        'playerInfo.$.pickedCard': '',
        'playerInfo.$.point': lostChips,
        discardCard: '',
        openDeck: tabInfo.openDeck,
        callFinalWinner: false,
      },
      $inc: {
        'playerInfo.$.gameChips': lostChips,
      },
      $push: {
        gameTracks: userTrack,
      },
    };

    const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });
    //logger.info('Player InValid tb : ', tb);

    let playerDetails = tb.playerInfo[client.seatIndex];

    // eslint-disable-next-line no-unused-vars
    await pushPlayerScoreToPlayerScoreBoard(tb, playerDetails);

    let activePlayerInRound = await getPlayingUserInRound(tb.playerDetails);
    logger.info('PACK activePlayerInRound :', activePlayerInRound, activePlayerInRound.length);

    let jobID = commandAcions.GetRandomString(10);
    let delay = commandAcions.AddTime(1);
    await commandAcions.setDelay(jobID, new Date(delay));

    delete client.invalidDeclare;

    await nextUserTurnstart(tb);

    return true;
  } catch (e) {
    logger.error('gamePlay.js invalidDeclare error => ', e);
  }
};

module.exports.playerFinish = async (requestData, client) => {
  try {
    if (!ifSocketDefine(requestData, client, CONST.FINISHED)) {
      return false;
    }

    if (typeof client.finish !== 'undefined' && client.finish) return false;

    client.finish = true;

    const wh = {
      _id: MongoID(client.tbid.toString()),
    };

    const project = {};

    const tabInfo = await PlayingTables.findOne(wh, project).lean();

    if (tabInfo === null) {
      logger.info('card Group user not turn ::', tabInfo);
      delete client.finish;
      return false;
    }

    let updateData = {
      $set: {},
      $inc: {},
    };
    updateData.$set['playerInfo.$.finished'] = true;

    const upWh = {
      _id: MongoID(client.tbid.toString()),
      'playerInfo.seatIndex': Number(client.seatIndex),
    };

    const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });

    let activePlayerInRound = await getPlayingUserInRound(tb.playerInfo);

    let ifAllPlayersHasFinished = true;

    activePlayerInRound.map((player) => {
      if (!player.finished) {
        ifAllPlayersHasFinished = false;
      }
    });
    //logger.info('Pool if All Players Has Finished --> ', ifAllPlayersHasFinished);

    delete client.finish;

    if (ifAllPlayersHasFinished) {
      let tableId = tb._id;
      let jobId = CONST.FINISH_TIMER_SET + ':' + tableId;

      await commandAcions.clearJob(jobId);

      await gameFinishActions.winnerDeclareCall(tb);
    } else {
      logger.info('Not Player Finished');
    }
    return true;
  } catch (e) {
    logger.error('gamePlay.js cardGroup error => ', e);
  }
};

module.exports.playerDrop = async (requestData, client) => {
  try {
    if (!ifSocketDefine(requestData, client, CONST.DROPPED)) {
      return false;
    }

    if (typeof client.drop !== 'undefined' && client.drop) {
      logger.info('playerDrop Invalid requestData False: ', requestData);
      return false;
    }

    client.drop = true;

    const wh = {
      _id: MongoID(client.tbid.toString()),
    };

    const project = {};
    const tabInfo = await PlayingTables.findOne(wh, project).lean();
    logger.info(' Player Drop FInd Table => ', tabInfo);

    if (tabInfo === null) {
      logger.info('playerDrop user not turn ::', tabInfo);
      delete client.drop;
      return false;
    }
    if (tabInfo.currentPlayerTurnIndex !== client.seatIndex) {
      logger.info('playerDrop : client.su ::', client.seatIndex);
      delete client.drop;
      commandAcions.sendDirectEvent(client.sck, CONST.DROPPED, requestData, false, "It's not your turn!", 'Error!');
      return false;
    }
    let playerInfo = tabInfo.playerInfo[tabInfo.currentPlayerTurnIndex];
    logger.info('playerInfo playerDrop ==> ', JSON.stringify(playerInfo));
    //call update lost counter
    // eslint-disable-next-line no-unused-vars
    let res = await gameFinishActions.updateLostCounter(playerInfo._id);

    //Cancel the Scheduele job
    commandAcions.clearJob(tabInfo.jobId);

    const playersCards = playerInfo.cards;
    if (playerInfo.pickedCard !== '') {
      let pickedCard = playerInfo.pickedCard;
      logger.info('player Drop picked Card => ', pickedCard);
      let pickedCardIndex = playersCards.findIndex((card) => card === pickedCard);
      logger.info('player Drop pickedCard Index => ', pickedCardIndex);

      playersCards.splice(pickedCardIndex, 1);
      logger.info('player Drop playerInfo ::--> ', tabInfo.openDeck);
      tabInfo.openDeck.push(pickedCard);

      logger.info('player Drop Cards =>', playersCards);
    }

    // let winner_state = checkUserCardActions.getWinState(playerInfo.cards, tabInfo.hukum);

    logger.info('playerInfo.turnCount  ->', playerInfo.turnCount);
    let turnCount = Number(playerInfo.turnCount + 1);
    let countScore = 16;
    if (turnCount === 0 || turnCount === 1) {
      logger.info('First DROP1');
      if (tabInfo.gameType === 101) {
        countScore = CONST.FIRST_DROP;
      } else if (tabInfo.gameType === 201) countScore = 20;
    } else if (turnCount > 1) {
      logger.info('First DROP2');
      if (tabInfo.gameType === 101) {
        countScore = CONST.SECOND_DROP;
      } else if (tabInfo.gameType === 201) countScore = 40;
    }

    let userTrack = {
      _id: playerInfo._id,
      username: playerInfo.username,
      seatIndex: playerInfo.seatIndex,
      cards: playerInfo.cards,
      gCard: playerInfo.gCard,
      gameBet: tabInfo.entryFee,
      gameChips: countScore,
      playerStatus: 'Dropped',
    };

    const upWh = {
      _id: MongoID(client.tbid.toString()),
      'playerInfo.seatIndex': Number(client.seatIndex),
    };

    const updateData = {
      $set: {
        'playerInfo.$.status': CONST.DROPPED,
        'playerInfo.$.playerStatus': CONST.DROPPED,
        'playerInfo.$.cards': playersCards,
        'playerInfo.$.gCard': playerInfo.gCard,
        'playerInfo.$.pickedCard': '',
        discardCard: '',
        openDeck: tabInfo.openDeck,
        callFinalWinner: false,
      },
      $inc: {
        'playerInfo.$.point': countScore,
        'playerInfo.$.gameChips': countScore,
      },
      $push: {
        gameTracks: userTrack,
      },
    };

    // eslint-disable-next-line no-unused-vars
    const playerInGame = await getPlayingUserInRound(tabInfo.playerInfo);

    logger.info("pool playerInGame ", playerInGame)
    await DealerRobotLogicCard(playerInGame, parseInt(tabInfo.wildCard.split("-")[1]), client.tbid.toString())
    const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });
    logger.info('Player DROPED tb : ', tb);

    let playerDetails = tb.playerInfo[client.seatIndex];

    let response = {
      pi: playerDetails.playerId,
      point: playerDetails.point,
      lostChips: countScore,
      gameChips: playerDetails.gameChips,
      status: playerDetails.status,
      discardCard: tabInfo.discardCard,
    };
    commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.DROPPED, response);

    // eslint-disable-next-line no-unused-vars
    await pushPlayerScoreToPlayerScoreBoard(tb, playerDetails);

    let activePlayerInRound = await getPlayingUserInRound(tb.playerDetails);
    logger.info('PACK activePlayerInRound :', activePlayerInRound, activePlayerInRound.length);

    let jobID = commandAcions.GetRandomString(10);
    let delay = commandAcions.AddTime(1);

    await commandAcions.setDelay(jobID, new Date(delay));

    delete client.drop;

    await nextUserTurnstart(tb);

    return true;
  } catch (e) {
    logger.error('gamePlay.js playerDrop error => ', e);
  }
};

module.exports.lastPointTable = async (requestData, client) => {
  try {
    logger.info('Request lastPointTable Data ', requestData);

    const wh = {
      _id: MongoID(client.tbid.toString()),
    };

    const tableInfo = await PlayingTables.findOne(wh, {}).lean();
    logger.info('lastPointTable Table Info =>', tableInfo);

    if (!tableInfo) {
      commandAcions.sendDirectEvent(client.id.toString(), CONST.LAST_POOL_POINT, { msg: 'Table not found' });
    }

    let response = {
      list: tableInfo.lastPointTable,
    };

    logger.info(' lastPointTable response --> ', JSON.stringify(response));
    commandAcions.sendDirectEvent(client.id.toString(), CONST.LAST_POOL_POINT, response);
  } catch (e) {
    logger.error('gamePlay.js pick Card error => ', e);
  }
};

module.exports.playerFinishDeclare = async (requestData, client) => {
  try {
    //logger.info('playerFinishDeclare client.tbid  Table Id -->', client.tbid, 'client Id -->', client.id);

    if (!ifSocketDefine(requestData, client, CONST.PLAYER_FINISH_DECLARE_TIMER)) {
      return false;
    }

    if (typeof client.finishTimer !== 'undefined' && client.finishTimer) return false;

    client.finishTimer = true;

    const wh = {
      _id: MongoID(client.tbid.toString()),
    };

    const project = {};

    const tabInfo = await PlayingTables.findOne(wh, project).lean();

    if (tabInfo === null) {
      logger.info('playerFinishDeclare Table is Null ::', tabInfo);
      delete client.finishTimer;
      return false;
    }

    let updateData = {
      $set: {},
      $inc: {},
    };
    updateData.$set['playerInfo.$.finished'] = true;

    const upWh = {
      _id: MongoID(client.tbid.toString()),
      'playerInfo.seatIndex': Number(client.seatIndex),
    };
    //logger.info('playerFinishDeclare Finish upWh :: ->  ', upWh, '\n player Finish upWh updateData :: -> ', updateData);

    const table = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });

    delete client.finishTimer;

    await checkWinnerActions.winnercall(table, client);

    return true;
  } catch (e) {
    logger.error('gamePlay.js cardGroup error => ', e);
  }
};
