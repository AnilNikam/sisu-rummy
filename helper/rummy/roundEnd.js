const mongoose = require('mongoose');
//const { omit } = require('lodash');

const PlayingTables = mongoose.model('playingTable');
const Users = mongoose.model('users');
const MongoID = mongoose.Types.ObjectId;

const logger = require('../../logger');
const CONST = require('../../constant');
const commandAcions = require('../socketFunctions');
const gameStartActions = require('./gameStart');
const { getPlayingUserInRound, getPlayingUserInTable, filterBeforeSendSPEvent } = require('../common-function/manageUserFunction');

module.exports.roundFinish = async (tb) => {
  try {
    const playerInGame = await getPlayingUserInTable(tb.playerInfo);
    //logger.info('Player In game =>', playerInGame);

    const list = [CONST.WON, CONST.LOST, CONST.LEAVE, CONST.PLAYING, CONST.INVALID_DECLARE, CONST.DROPPED];

    playerInGame.forEach(async (player) => {
      if (list.includes(player.playerStatus)) {
        //player.playerStatus = CONST.WAITING;

        let uWh1 = {
          _id: MongoID(tb._id.toString()),
          'playerInfo.seatIndex': Number(player.seatIndex),
        };

        let dataUpdate = {
          $set: {
            'playerInfo.$.playerStatus': CONST.WAITING,
            'playerInfo.$.status': CONST.WAITING,
            'playerInfo.$.finished': false,
          },
        };

        const restartTable = await PlayingTables.findOneAndUpdate(uWh1, dataUpdate, { new: true });
        logger.info('\n roundFinish restart Table ->', restartTable);

        let whr = { _id: player._id };
        let userInfo = await Users.findOne(whr, {}).lean();
        let totalWallet = Number(userInfo.chips);
        let requireGameChips = restartTable.entryFee * 80;

        if (player.gameChips > requireGameChips) {
          logger.info('sufficient local chips');
        } else {
          logger.info('insuffcient local chips to play');

          let diff = requireGameChips - player.gameChips;
          logger.info('diff ->', diff);
          if (totalWallet >= diff) {
            let finalGameChips = player.gameChips + Math.abs(diff);
            let remaningChip = totalWallet - Math.abs(diff);
            logger.info('remaningChip ->', remaningChip);

            let result = {
              pi: player.playerId,
              diffrence: Math.abs(diff),
              gameChips: finalGameChips,
              chips: Math.abs(remaningChip),
            };



            logger.info(' BORROW_USER_CHIPS Result ==>', result);
            commandAcions.sendDirectEvent(player.sck.toString(), CONST.BORROW_USER_CHIPS, result);


            logger.info('roundFinish update the gameChips -> ', tbInfo);

            let resp = await gameStartActions.RoundFinishdeduct(tb, player, Math.abs(diff));
            logger.info('checlll ===? Player Deduct Coins', resp);

            //let data = await Users.findOneAndUpdate(whr, { $inc: { chips: -diff } }, { new: true });
            // User track 
            // logger.info('Deduct diff from User chips =>', data);
          } else {
            logger.info(' Insufficient Balance..Please Add Wallet!!');

            let wh = {
              _id: MongoID(tb._id.toString()),
              'playerInfo._id': MongoID(player._id.toString()),
            };

            let updateData = {
              $set: {
                'playerInfo.$': {},
              },
              $inc: {
                activePlayer: -1,
              },
            };

            let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
              new: true,
            });

            let activePlayerInRound = await getPlayingUserInRound(tbInfo.playerInfo);

            let response = {
              pi: player._id,
              score: tbInfo.entryFee,
              lostChips: tbInfo.entryFee,
              totalRewardCoins: tbInfo.tableAmount,
              ap: activePlayerInRound.length,
            };
            //commandAcions.sendDirectEvent(player.sck.toString(), CONST.LEAVE, response);
            commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.LEAVE, response);

            let userDetails = await Users.findOne({
              _id: MongoID(player._id.toString()),
            }).lean();

            let finalData = await filterBeforeSendSPEvent(userDetails);

            commandAcions.sendDirectEvent(player.sck.toString(), CONST.DASHBOARD, finalData);

            commandAcions.sendDirectEvent(player.sck.toString(), CONST.REMOVE_USERSOCKET_FROM_TABLE);

            let jobId = commandAcions.GetRandomString(10);
            let delay = commandAcions.AddTime(2);
            await commandAcions.setDelay(jobId, new Date(delay));

            commandAcions.sendDirectEvent(player.sck.toString(), CONST.INSUFFICIENT_CHIPS, {
              flag: false,
              msg: 'Insufficient Balance..Please Add Wallet!!',
            });
          }
        }
      } else {
        logger.info('roundFinish player.playerStatus ------>', player.playerStatus);
      }
    });

    let tableFinal = await PlayingTables.findOne({
      _id: MongoID(tb._id.toString()),
    }).lean();

    let wh = {
      _id: MongoID(tableFinal._id.toString()),
    };

    let update = {
      $set: {
        gameId: '',
        gameState: '',
        openDeck: [],
        currentPlayerTurnIndex: -1,
        tableAmount: 0,
        turnDone: false,
        playersScoreBoard: [],
        gameTracks: [],
        jobId: '',
        isLastUserFinish: false,
        isFinalWinner: false,
        callFinalWinner: false,
      },
      $unset: {
        gameTimer: 1,
      },
    };

    let tbInfo = await PlayingTables.findOneAndUpdate(wh, update, {
      new: true,
    });

    let table_id = tbInfo._id;
    let jobId = commandAcions.GetRandomString(10);
    let delay = commandAcions.AddTime(5);

    await commandAcions.setDelay(jobId, new Date(delay));

    const wh1 = {
      _id: MongoID(table_id.toString()),
    };

    const tabInfo = await PlayingTables.findOne(wh1, {}).lean();
    //logger.info(' start re game new table ->', tabInfo);

    if (!tabInfo) {
      logger.info('roundEnd.js table is Null:', tabInfo);
      return false;
    }
    if (tabInfo.activePlayer >= 2) {
      await gameStartActions.gameTimerStart(tabInfo);
    }
    return true;
  } catch (err) {
    logger.error('roundEnd.js roundFinish error => ', err);
  }
};
