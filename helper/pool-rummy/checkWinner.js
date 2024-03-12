const mongoose = require('mongoose');
const PlayingTables = mongoose.model('playingTable');
const MongoID = mongoose.Types.ObjectId;

const CONST = require('../../constant');
const gameFinishActions = require('./gameFinish');
const gamePlay = require('./gamePlay');
const logger = require('../../logger');
const commandAcions = require('../socketFunctions');
const { getScore } = require('../common-function/cardFunction');
const { getPlayingUserInRound } = require('../common-function/manageUserFunction');

module.exports.winnercall = async (tb, client) => {
  try {
    const wh = {
      _id: MongoID(tb._id.toString()),
    };

    const tabInfo = await PlayingTables.findOne(wh, {}).lean();

    if (tabInfo === null) {
      return false;
    }

    let tableId = tabInfo._id;
    let jobId = CONST.DECLARE_TIMER_SET + ':' + tableId;

    await commandAcions.clearJob(jobId);

    //when Invalid declare set the callFinalWinner to false
    if (tabInfo.callFinalWinner) return false;

    if (tabInfo.gameState !== 'RoundStated') return false;

    const upWh = {
      _id: MongoID(tb._id.toString()),
    };

    const updateData = {
      $set: {
        callFinalWinner: true,
      },
    };

    const tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
    let winner = await this.getWinner(tbInfo);

    if (winner === 0) {
      //Valid Declare
      let playerDetails = tbInfo.playerInfo[client.seatIndex];
      commandAcions.sendEventInTable(tb._id.toString(), CONST.FINISH_TIMER_SET, { pi: playerDetails._id, result: true });

      let declareJobId = CONST.FINISH_TIMER_SET + ':' + tb._id;
      let delay = commandAcions.AddTime(10);

      await commandAcions.setDelay(declareJobId, new Date(delay));
      await gameFinishActions.winnerDeclareCall(tbInfo);
    } else {
      //Invalid Declare
      await gamePlay.invalidDeclare(tbInfo, client);
    }
  } catch (e) {
    logger.error('checkWinner.js winnercall error => ', e);
  }
};

module.exports.getWinner = async (tb) => {
  try {
    await getPlayingUserInRound(tb.playerInfo);

    let playerDetails = tb.playerInfo[tb.currentPlayerTurnIndex];

    let gameResult;

    const isGCardEmpty = (gCard) => {
      return (
        gCard.pure.length === 0 &&
        gCard.impure.length === 0 &&
        gCard.set.length === 0 &&
        gCard.dwd.length === 0
      );
    };

    if (isGCardEmpty(playerDetails.gCard)) {
      gameResult = await getScore(playerDetails.cards, tb.wildCard);
    } else {
      gameResult = await getScore(playerDetails.gCard, tb.wildCard);
    }
    return gameResult;
  } catch (e) {
    logger.error('checkWinner.js getWinner error => ', e);
  }
};
