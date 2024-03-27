const mongoose = require('mongoose');
const PlayingTables = mongoose.model('playingTable');
const Users = mongoose.model('users');
const TableHistory = mongoose.model('tableHistory');
const MongoID = mongoose.Types.ObjectId;

const { omit } = require('lodash');

const logger = require('../../logger');
const CONST = require('../../constant');
const commandAcions = require('../socketFunctions');
const roundEndActions = require('./roundEnd');
const commonHelper = require('../commonHelper');
const gameTrackActions = require('../common-function/gameTrack');
const { getPlayingUserInRound, winnerViewResponseFilter } = require('../common-function/manageUserFunction');
const { countPlayerScore, getScore } = require('../common-function/cardFunction');
const walletActions = require('../common-function/walletTrackTransaction');

module.exports.lastUserWinnerDeclareCall = async (tblInfo) => {
  const tb = tblInfo;
  try {
    let tbid = tb._id.toString();

    if (tb.isLastUserFinish) return false;
    if (tb.gameState === CONST.ROUND_END) return false;
    if (tb.isFinalWinner) return false;

    let updateData = {
      $set: {},
      $inc: {},
    };

    let amount = (tb.tableAmount * tb.commission) / 100;
    //tb.tableAmount -= Math.round(amount);
    tb.tableAmount -= parseFloat(amount.toFixed(2));

    updateData.$set['isFinalWinner'] = true;
    updateData.$set['gameState'] = CONST.ROUND_END;
    updateData.$set['tableAmount'] = tb.tableAmount;
    updateData.$set['playerInfo.$.playerStatus'] = CONST.WON;
    //updateData.$inc['playerInfo.$.gameChips'] = tb.tableAmount;

    const upWh = {
      _id: MongoID(tbid),
      'playerInfo.seatIndex': Number(tb.playerInfo[tb.currentPlayerTurnIndex].seatIndex),
    };

    const tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });

    const playerInGame = await getPlayingUserInRound(tbInfo.playerInfo);
    const tableInfo = await PlayingTables.findOne(upWh, {}).lean();
    logger.info('Last Winner Declare Call =>', tableInfo);

    for (let i = 0; i < playerInGame.length; i++) {
      tableInfo.gameTracks.push({
        _id: playerInGame[i]._id,
        username: playerInGame[i].username,
        seatIndex: playerInGame[i].seatIndex,
        cards: playerInGame[i].cards,
        gCard: playerInGame[i].gCard,
        point: playerInGame[i].point,
        gameChips: playerInGame[i].gameChips,
        gameBet: tableInfo.entryFee,
        result: playerInGame[i].playerStatus === CONST.WON ? CONST.WON : CONST.LOST,
      });
    }

    const winnerTrack = await gameTrackActions.gamePlayTracks(tableInfo.gameTracks, tableInfo);

    for (let i = 0; i < tableInfo.gameTracks.length; i++) {
      if (tableInfo.gameTracks[i].result === CONST.WON) {
        await walletActions.addWalletWinngChpis(tableInfo.gameTracks[i]._id, Number(winnerTrack.winningAmount), 'Credit', 'Win', tableInfo);
      }
    }

    const playersScoreBoard = await countPlayerScore(tableInfo);
    const winnerViewResponse = winnerViewResponseFilter(playersScoreBoard);

    const response = {
      playersScoreBoard: winnerViewResponse.userInfo,
      totalLostChips: tableInfo.tableAmount,
    };

    const GSBResponse = { ...response, wildCard: tableInfo.wildCard, gamePlayType: tableInfo.gamePlayType };

    const addLastScoreBoard = tableInfo.lastGameScoreBoard.push(GSBResponse);
    logger.info('lastUserWinnerDeclareCall Score board ==>', addLastScoreBoard);

    const qu = {
      _id: MongoID(tbid),
    };

    let updatedata = {
      $set: {
        gameTracks: tableInfo.gameTracks,
        lastGameScoreBoard: tableInfo.lastGameScoreBoard,
      },
    };

    let tblInfo = await PlayingTables.findOneAndUpdate(qu, updatedata, { new: true });
    logger.info('set gamePlaytracks and pointPoolTable =>', tblInfo);

    commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.WIN, response);

    const jobId = commandAcions.GetRandomString(10);
    const delay = commandAcions.AddTime(4);
    await commandAcions.setDelay(jobId, new Date(delay));

    commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.GAME_SCORE_BOARD, GSBResponse);

    const gamePlayData = JSON.parse(JSON.stringify(tableInfo));
    const rest = omit(gamePlayData, ['_id']);

    //save table history
    const tableHistory = { ...rest, tableId: tableInfo._id };

    const tableHistoryData = await commonHelper.insert(TableHistory, tableHistory);
    logger.info('gameFinish.js tableHistory Data => ', tableHistoryData);

    await roundEndActions.roundFinish(tableInfo);
  } catch (e) {
    logger.error('gameFinish.js lastUserWinnerDeclareCall error => ', e);
  }
};

module.exports.winnerDeclareCall = async (tblInfo) => {
  const tabInfo = tblInfo;
  try {
    const tbid = tabInfo._id.toString();

    if (tabInfo.gameState === CONST.ROUND_END) return false;
    if (tabInfo.isFinalWinner) return false;

    let updateData = {
      $set: {},
      $inc: {},
    };

    updateData.$set['isFinalWinner'] = true;
    updateData.$set['gameState'] = CONST.ROUND_END;
    updateData.$set['playerInfo.$.playerStatus'] = CONST.WON;

    const upWh = {
      _id: MongoID(tbid),
      'playerInfo.seatIndex': Number(tabInfo.playerInfo[tabInfo.currentPlayerTurnIndex].seatIndex),
    };

    const tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });
    logger.info('\n winnerDeclareCall tbInfo  ==>', tbInfo);

    const playerInGame = await getPlayingUserInRound(tbInfo.playerInfo);
    const table = await this.manageUserScore(playerInGame, tabInfo);
    logger.info('\n Final winnerDeclareCall tbInfo  ==>', table);

    let amount = (table.tableAmount * table.commission) / 100;
    logger.info('\n Check Amount -->', amount);

    table.tableAmount -= parseFloat(amount.toFixed(2));
    logger.info('table.tableAmount ->', table.tableAmount);

    //updateData.$inc['playerInfo.$.gameChips'] = table.tableAmount;
    updateData.$set['tableAmount'] = table.tableAmount;

    const tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });
    logger.info('tableInfo.tableAmount ->', tableInfo.tableAmount);

    for (let i = 0; i < playerInGame.length; i++) {
      tableInfo.gameTracks.push({
        _id: playerInGame[i]._id,
        username: playerInGame[i].username,
        seatIndex: playerInGame[i].seatIndex,
        cards: playerInGame[i].cards,
        gCard: playerInGame[i].gCard,
        gameChips: playerInGame[i].gameChips,
        point: playerInGame[i].point,
        gameBet: tableInfo.entryFee,
        result: playerInGame[i].playerStatus === CONST.WON ? CONST.WON : CONST.LOST,
      });
    }

    const winnerTrack = await gameTrackActions.gamePlayTracks(tableInfo.gameTracks, tableInfo);
    logger.info(' Game Winner Track =>', winnerTrack);

    logger.info('tableInfo.gameTracks Game Winner Track =>', tableInfo.gameTracks);

    for (let i = 0; i < tableInfo.gameTracks.length; i++) {
      if (tableInfo.gameTracks[i].result === CONST.WON) {
        logger.info(' Add Win COunter');
        //await walletActions.addWallet(tableInfo.gameTracks[i]._id, Number(winnerTrack.winningAmount), 'Credit', 'Win', tableInfo);

        //let perdecuct = GAMELOGICCONFIG.PLAYING_WIN_PER || 5
        let winningwallet = Number(winnerTrack.winningAmount)
        //let TotalwithdrawableChips = Number(winnerTrack.winningAmount) - Number(winningwallet)



        //withdrawableChips Management Function name only 
        //await walletActions.deductWalletPayOut(tableInfo.gameTracks[i]._id, Number(TotalwithdrawableChips), 'Credit', 'Game Win', tableInfo);
        await walletActions.addWalletWinngChpis(tableInfo.gameTracks[i]._id, Number(winningwallet), 'Credit', 'Game Win', tableInfo);


      }
    }

    const playersScoreBoard = await countPlayerScore(tableInfo);
    let winnerViewResponse = winnerViewResponseFilter(playersScoreBoard);

    const response = {
      playersScoreBoard: winnerViewResponse.userInfo,
      totalLostChips: tableInfo.tableAmount,
    };

    commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.WIN, response);
    const gsbResponse = { ...response, wildCard: tableInfo.wildCard, gamePlayType: tableInfo.gamePlayType };

    const addLastScoreBoard = tableInfo.lastGameScoreBoard.push(gsbResponse);
    logger.info('addLastScoreBoard Score board ==>', addLastScoreBoard);

    const qu = {
      _id: MongoID(tbid),
    };

    let updatedata = {
      $set: {
        gameTracks: tableInfo.gameTracks,
        lastGameScoreBoard: tableInfo.lastGameScoreBoard,
      },
    };

    let tblInfo = await PlayingTables.findOneAndUpdate(qu, updatedata, { new: true });
    logger.info('set gamePlaytracks and pointPoolTable =>', tblInfo);

    let jobId = commandAcions.GetRandomString(10);
    let delay = commandAcions.AddTime(4);
    await commandAcions.setDelay(jobId, new Date(delay));

    commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.GAME_SCORE_BOARD, gsbResponse);

    let gamePlayData = JSON.parse(JSON.stringify(tableInfo));
    const rest = omit(gamePlayData, ['_id']);
    let tableHistory = { ...rest, tableId: tableInfo._id };

    let tableHistoryData = await commonHelper.insert(TableHistory, tableHistory);
    logger.info('gameFinish.js tableHistory Data => ', tableHistoryData);

    await roundEndActions.roundFinish(tableInfo);
  } catch (err) {
    logger.error('gameFinish.js  WinnerDeclareCall => ', err);
  }
};

module.exports.updateLostCounter = async (playerId) => {
  try {
    let data = await Users.findOneAndUpdate({ _id: MongoID(playerId) }, { $inc: { 'counters.gameLoss': 1 } });

    if (data) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logger.info('gameFinish.js updateLostCounter error => ', error);
  }
};

module.exports.updateUserScore = async (playerId, gameChips) => {
  try {
    logger.info('update User Score payload =>', gameChips);
    logger.info('playerId payload =>', playerId);
    // + - 
    // gameChips + hoi to 10 bonus 90 Chips 
    // gameChips - hoi chips 100 
    let data;
    if (gameChips > 0) {
      let bonusChips = Number((gameChips * 10) / 100);
      let finalGameChips = gameChips - bonusChips
      logger.info('bonusChips  =>', bonusChips);

      logger.info('finalGameChips', finalGameChips);


      data = await Users.findOneAndUpdate({ _id: MongoID(playerId) }, { $inc: { chips: finalGameChips, bonusChips: bonusChips } }, { new: true });
      logger.info('Update User Score =>', data);
    } else {
      data = await Users.findOneAndUpdate({ _id: MongoID(playerId) }, { $inc: { chips: gameChips } }, { new: true });
      logger.info('Update User Score =>', data);
    }


    if (data) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logger.info('gameFinish.js updateUserScore error => ', error);
  }
};

module.exports.manageUserScore = async (playerInfo, tabInfo) => {
  let tableInfo;
  logger.info('\n Manage User Score Player Info ==>', playerInfo);

  for (let i = 0; i < playerInfo.length; i++) {
    if (playerInfo[i].playerStatus !== CONST.WON) {
      let pId = playerInfo[i].playerId;

      let updateData = {
        $set: {},
        $inc: {},
      };

      const upWh = {
        _id: MongoID(tabInfo._id),
        'playerInfo._id': MongoID(pId),
      };

      let playerScore = await getScore(playerInfo[i].gCard, tabInfo.wildCard);
      let lostChips;
      logger.info('before deduct user Game Chips ->', playerInfo[i].gameChips);

      if (playerScore === 0) {
        lostChips = Number(2 * tabInfo.entryFee);
      } else if (playerInfo[i].turnCount === 0) {
        lostChips = Number(playerScore * tabInfo.entryFee) / 2;
      } else {
        lostChips = Number(playerScore * tabInfo.entryFee);
      }

      logger.info('Lost Chips =>', lostChips);

      let userGameChips = playerInfo[i].gameChips - lostChips;
      logger.info('after deduct user Game Chips ->', userGameChips);

      updateData.$set['playerInfo.$.finished'] = true;
      updateData.$set['playerInfo.$.point'] = playerScore;
      updateData.$set['playerInfo.$.playerStatus'] = CONST.LOST;
      updateData.$set['playerInfo.$.playerLostChips'] = lostChips;
      updateData.$inc['tableAmount'] = lostChips;
      updateData.$set['playerInfo.$.gameChips'] = userGameChips;

      tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
        new: true,
      });

      logger.info('update table and check user count', tableInfo);

      this.updateLostCounter(playerInfo[i].playerId);

      //promises.push(this.updateUserScore(playerInfo[i].playerId, userGameChips));
    } else {
      logger.info('not find won');
    }
  }
  //await Promise.allSettled(promises);

  logger.info('\n Manage User Score ->', tableInfo);
  return tableInfo;
};
