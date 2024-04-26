const mongoose = require('mongoose');
const Users = mongoose.model('users');
const PlayingTables = mongoose.model('playingTable');
const IdCounter = mongoose.model('idCounter');
const MongoID = mongoose.Types.ObjectId;

const CONST = require('../../constant');
const commandAcions = require('../socketFunctions');
const cardDealActions = require('./cardDeal');
const logger = require('../../logger');

const { getPlayingUserInRound } = require('../common-function/manageUserFunction');
const walletActions = require('../common-function/walletTrackTransaction');


module.exports.gameTimerStart = async (tb) => {
  try {
    if (tb.gameState !== '') return false;

    let wh = { _id: tb._id };

    let update = {
      $set: {
        gameState: CONST.ROUND_START_TIMER,
        'gameTimer.GST': new Date(),
      },
    };

    const tableInfo = await PlayingTables.findOneAndUpdate(wh, update, {
      new: true,
    });

    let roundTime = CONST.gameStartTime;
    commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.GAME_TIME_START, { sec: CONST.gameStartTime });

    let tableId = tableInfo._id;
    let jobId = CONST.GAME_TIME_START + ':' + tableId;
    let delay = commandAcions.AddTime(roundTime);

    await commandAcions.setDelay(jobId, new Date(delay));

    await this.collectBoot(tableId);
  } catch (error) {
    logger.error('gameStart.js Game Timer Start Error -->', error);
  }
};

module.exports.collectBoot = async (tbId) => {
  try {
    let wh = { _id: tbId };

    let tb = await PlayingTables.findOne(wh, {}).lean();
    if (!tb) {
      return
    }

    let resetPlayerInfo = await this.resetUserData(tb._id, tb.playerInfo);
    let playerInfo = await this.checkUserInRound(resetPlayerInfo, tb);

    if (playerInfo.length < 2) {
      return false;
    }

    let gameId = await this.getCount('gameId');

    let update = {
      $set: {
        gameState: CONST.ROUND_COLLECT_BOOT,
        gameId: gameId.toString(),
        dealerSeatIndex: 0,
        tableLock: true,
      },
    };

    let tableInfo = await PlayingTables.findOneAndUpdate(wh, update, { new: true });

    let playerUgcInfo = this.deduct(tableInfo, playerInfo);
    logger.info(' Player UGC details =>', playerUgcInfo);

    let response = {
      playerUgcInfo,
      entryfee: tb.entryFee,
      gameId: gameId,
      tableId: tableInfo._id,
    };

    commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.UPDATE_GAME_COIN, response);

    let tbid = tableInfo._id;
    let jobId = commandAcions.GetRandomString(10);
    let delay = commandAcions.AddTime(3);

    await commandAcions.setDelay(jobId, new Date(delay));

    await cardDealActions.cardDealStart(tbid);
  } catch (error) {
    logger.error('gameStart.js collectBoot error :-> ', error);
  }
};

module.exports.resetUserData = async (tbId, playerDetail) => {
  const playerInfo = playerDetail;

  try {
    for (let i = 0; i < playerInfo.length; i++)
      if (typeof playerInfo[i].seatIndex !== 'undefined') {
        let update = {
          $set: {
            'playerInfo.$.status': 'PLAYING',
            'playerInfo.$.playerStatus': 'PLAYING',
            'playerInfo.$.cards': [],
            'playerInfo.$.turnMissCounter': 0,
            'playerInfo.$.turnDone': false,
            'playerInfo.$.turnCount': 0,
          },
        };
        playerInfo[i].status = 'PLAYING';

        let uWh = {
          _id: MongoID(tbId.toString()),
          'playerInfo.seatIndex': Number(playerInfo[i].seatIndex),
        };

        await PlayingTables.findOneAndUpdate(uWh, update, { new: true });
      } else {
        logger.info('\nresetUserData playerInfo[i] :-> ', playerInfo[i]);
      }

    let playerInfos = await getPlayingUserInRound(playerInfo);

    return playerInfos;
  } catch (error) {
    logger.error('gameStart.js resetUserData error :-> ', error);
  }
};

module.exports.checkUserInRound = async (playerInfo) => {
  try {
    let userIds = [];
    let userSeatIndexs = {};

    for (let i = 0; i < playerInfo.length; i++) {
      userIds.push(playerInfo[i]._id);
      userSeatIndexs[playerInfo[i]._id.toString()] = playerInfo[i].seatIndex;
    }

    let wh = { _id: { $in: userIds } };
    let project = { coins: 1, sck: 1 };
    let userInfos = await Users.find(wh, project);

    if (userInfos) {
      let userInfo = {};
      for (let i = 0; i < userInfos.length; i++)
        if (typeof userInfos[i]._id !== 'undefined') {
          userInfo[userInfos[i]._id] = {
            coins: userInfos[i].coins,
          };
        }
      return playerInfo;
    } else {
      logger.info('UserInfos Not Found');
    }
  } catch (error) {
    logger.error('gameStart.js checkUserInRound error :-> ', error);
  }
};

module.exports.getCount = async (type) => {
  try {
    let wh = { type: type };

    let update = {
      $set: {
        type: type,
      },
      $inc: {
        counter: 1,
      },
    };

    let resp2 = await IdCounter.findOneAndUpdate(wh, update, {
      upsert: true,
      new: true,
    });

    return resp2.counter;
  } catch (error) {
    logger.error('\ngameStart.js getCount error :-> ', error);
  }
};

module.exports.deduct = async (tbInfo, playerInfo) => {
  const tabInfo = tbInfo;

  try {
    let playerUgcInfo = [];
    for (let i = 0; i < playerInfo.length; i++) {
      let pId = playerInfo[i].playerId;

      let wh = { _id: MongoID(pId.toString()) };

      let userInfo = await Users.findOne(wh, {}).lean();

      if (userInfo === null) {
        return;
      }


      let totalWallet = Number(userInfo.chips); // 39
      let totalbonus = Number(userInfo.bonusChips); //9.8
      let totalWinWallet = Number(userInfo.winningChips); // 100


      let playerGameChips = tabInfo.entryFee;
      let gameDepositChips = playerGameChips;

      let perdecuct = GAMELOGICCONFIG.PLAYING_BONUS_DEDUCT_PER || 10
      let bonuscutchips = Number((gameDepositChips * perdecuct) / 100) // 10
      let mainchipscut = Number(gameDepositChips - bonuscutchips)     // 90 

      let bonuswalletdeduct = false;
      let mainwalletdeduct = false;
      let winwalletdeduct = false;



      if (totalbonus >= bonuscutchips && totalWallet >= mainchipscut) {
        bonuswalletdeduct = true
        mainwalletdeduct = true

      } else if (totalWallet >= mainchipscut) {
        mainwalletdeduct = true
      } 
      
      // else if (totalbonus >= bonuscutchips && totalWinWallet >= mainchipscut) {
      //   winwalletdeduct = true
      //   bonuswalletdeduct = true
      // } else if (totalWinWallet >= mainchipscut) {
      //   winwalletdeduct = true
      // }
       else if (totalbonus >= bonuscutchips) {
        console.log('5')
        bonuswalletdeduct = true
      }

      if (mainwalletdeduct === false && winwalletdeduct === false && bonuswalletdeduct === true) {
        console.log('6')

        let reminingAmount = mainchipscut - totalWallet
        if (reminingAmount <= totalWinWallet) {
          await walletActions.addWalletWinningPayin(pId, - Number(reminingAmount), 'Debit', 'Deal Playing Entry Deduct Deposit', 'Game');
          await walletActions.addWalletPayin(pId, - Number(totalWallet), 'Debit', 'Deal Playing Entry Deduct Deposit', 'Game');
        }
        await walletActions.addWalletBonusDeposit(pId, - Number(bonuscutchips), 'Debit', 'Deal Playing Entry Deduct bonus', 'Game');

        bonuswalletdeduct = false;
        mainwalletdeduct = false;
        winwalletdeduct = false;

      } else if (mainwalletdeduct === false && winwalletdeduct === false) {
        let reminingAmount = mainchipscut - totalWallet
        console.log('reminingAmount -->', reminingAmount)

        if (reminingAmount <= totalWinWallet) {
          await walletActions.addWalletWinningPayin(pId, - Number(reminingAmount), 'Debit', 'Deal Playing Entry Deduct Deposit', 'Game');
          await walletActions.addWalletPayin(pId, - Number(totalWallet), 'Debit', 'Deal Playing Entry Deduct Deposit', 'Game');
        }
        mainwalletdeduct = false;
        winwalletdeduct = false;
      }

      logger.info("deal bonuswalletdeduct ", bonuswalletdeduct)
      logger.info("deal mainwalletdeduct ", mainwalletdeduct)
      logger.info("deal winwalletdeduct ", winwalletdeduct)


      if (bonuswalletdeduct && mainwalletdeduct) {
        await walletActions.addWalletPayin(pId, - Number(mainchipscut), 'Debit', 'Deal Playing Entry Deduct Deposit', 'Game');
        await walletActions.addWalletBonusDeposit(pId, - Number(bonuscutchips), 'Debit', 'Deal Playing Entry Deduct bonus', 'Game');

      } else if (mainwalletdeduct) {
        await walletActions.addWalletPayin(pId, - Number(gameDepositChips), 'Debit', 'Deal Playing Entry Deduct Deposit', 'Game');
      } else if (bonuswalletdeduct && winwalletdeduct) {

        await walletActions.addWalletWinningPayin(pId, - Number(mainchipscut), 'Debit', 'Deal Playing Entry Deduct Deposit', 'Game');
        await walletActions.addWalletBonusDeposit(pId, - Number(bonuscutchips), 'Debit', 'Deal Playing Entry Deduct bonus', 'Game');


      } else if (winwalletdeduct) {
        await walletActions.addWalletWinningPayin(pId, - Number(gameDepositChips), 'Debit', 'Deal Playing Entry Deduct Deposit', 'Game');
      }


      // if (bonuswalletdeduct || mainwalletdeduct || winwalletdeduct) {

      let dataUpdate = {
        $inc: {
          tableAmount: Number(tabInfo.entryFee),
        },
      };

      let uWh1 = {
        _id: MongoID(tabInfo._id.toString()),
        'playerInfo.seatIndex': Number(playerInfo[i].seatIndex),
      };

      await PlayingTables.findOneAndUpdate(uWh1, dataUpdate, { new: true });
      // } else {
      //   logger.info('\n gameStart.js at 276 User Balance is not sufficient to play the game');
      // }
    }
    return playerUgcInfo;
  } catch (error) {
    logger.error('\nngameStart.js deduct error :-> ', error);
  }
};

module.exports.gameRestartTimerStart = async (tb) => {
  try {
    if (tb.gameState !== '') return false;

    let wh = { _id: tb._id };

    let update = {
      $set: {
        gameState: CONST.ROUND_START_TIMER,
        'gameTimer.GST': new Date(),
      },
    };

    const table = await PlayingTables.findOneAndUpdate(wh, update, {
      new: true,
    });

    let roundTime = CONST.gameStartTime;
    commandAcions.sendEventInTable(table._id.toString(), CONST.GAME_TIME_START, { sec: CONST.gameStartTime });

    let tableId = table._id;
    let jobId = CONST.GAME_TIME_START + ':' + tableId;
    let delay = commandAcions.AddTime(roundTime);

    await commandAcions.setDelay(jobId, new Date(delay));

    let resetPlayerInfo = await this.resetUserData(table._id, table.playerInfo);
    let playerInfo = await this.checkUserInRound(resetPlayerInfo, table);

    if (playerInfo.length < 2) {
      return false;
    }

    let gameId = await this.getCount('gameId');

    update = {
      $set: {
        gameState: CONST.ROUND_COLLECT_BOOT,
        gameId: gameId.toString(),
        dealerSeatIndex: 0,
      },
    };

    let tableInfo = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
    await cardDealActions.cardDealStart(tableInfo._id);
  } catch (error) {
    logger.error('gameStart.js Game Timer Start Error -->', error);
  }
};
