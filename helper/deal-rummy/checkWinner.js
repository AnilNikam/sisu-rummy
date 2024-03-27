const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const PlayingTables = mongoose.model('playingTable');
const BetLists = mongoose.model('dealbetLists');

const CONST = require('../../constant');
const gamePlay = require('./gamePlay');
const logger = require('../../logger');
const gameFinishActions = require('./gameFinish');
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

    let tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
    let winner = await this.getWinner(tbInfo);

    //check round or deal finish
    //find set winner player

    const betInfo = await BetLists.findOne({ _id: tbInfo.betId }, {}).lean();
    logger.info('\nDeal betInfo -->', betInfo);
    let betDetails = tbInfo.betId;

    logger.info('\n betDetails ==>', betDetails);
    logger.info('\n Round ==>', tbInfo.round);
    try {
      //await checkWinnerPoint(tbInfo);
      logger.info('finish the game');
      //check player is winner porperly
      let playerSeatIndex = tbInfo.playerInfo[tbInfo.currentPlayerTurnIndex].seatIndex;
      logger.info('playerSeatIndex=> ', playerSeatIndex);

      //check player gamechip
      let playerInGame = await getPlayingUserInRound(tbInfo.playerInfo);
      let table = await this.checkUserScore(playerInGame, tbInfo);
      logger.info('check table', table);

      tbInfo = table;
      if (betInfo.deal === tbInfo.round) {
        let minCoinHavingPlayer = null;
        tbInfo.playerInfo.forEach((player) => {
          if (player._id) {
            if (minCoinHavingPlayer) {
              if (minCoinHavingPlayer.point > player.point) {
                minCoinHavingPlayer = player;
              }
            } else {
              minCoinHavingPlayer = player;
            }
          }
        });

        logger.info('minCoinHavingPlayer =>', minCoinHavingPlayer.point);
        if (tbInfo.currentPlayerTurnIndex !== minCoinHavingPlayer.seatIndex) {
          const upWh = {
            _id: MongoID(tb._id.toString()),
          };

          const updateData = {
            $set: {
              currentPlayerTurnIndex: minCoinHavingPlayer.seatIndex,
            },
          };

          tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        }
      } else {
        logger.info('Else ------>');
      }
    } catch (error) {
      logger.error(' find error name ->', error);
    }

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
    logger.error('Deal checkWinner.js winnercall error => ', e);
  }
};

module.exports.getWinner = async (tb) => {
  try {
    await getPlayingUserInRound(tb.playerInfo);

    let playerDetails = tb.playerInfo[tb.currentPlayerTurnIndex];

    let gameResult;

    //const cards = playerDetails.gCard === [] ? playerDetails.cards : playerDetails.gCards;
    //return await getScore(cards, tb.wildCard);
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

module.exports.checkUserScore = async (playerInfo, tabInfo) => {
  let tableInfo = tabInfo;

  for (let i = 0; i < playerInfo.length; i++) {
    let pId = playerInfo[i].playerId;

    let updateData = {
      $set: {},
      $inc: {},
    };

    const upWh = {
      _id: MongoID(tableInfo._id),
      'playerInfo._id': MongoID(pId),
    };

    let playerScore = await getScore(playerInfo[i].gCard, tableInfo.wildCard);
    logger.info(' Player Score ==>', playerScore);

    //updateData.$set['playerInfo.$.finished'] = true;
    updateData.$inc['playerInfo.$.point'] = playerScore;
    //updateData.$inc['playerInfo.$.gameChips'] = lostChips;
    //updateData.$set['playerInfo.$.playerStatus'] = CONST.LOST;
    //updateData.$set['playerInfo.$.currentGamePoint'] = lostChips;

    tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });
    logger.info('check player point set and check', tableInfo);
  }
  return tableInfo;
};
