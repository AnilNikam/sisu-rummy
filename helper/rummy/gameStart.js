const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const Users = mongoose.model('users');
const IdCounter = mongoose.model('idCounter');
const PlayingTables = mongoose.model('playingTable');
const CONST = require('../../constant');
const commandAcions = require('../socketFunctions');
const { getPlayingUserInRound } = require('../common-function/manageUserFunction');
const cardDealActions = require('./cardDeal');
const logger = require('../../logger');
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
    logger.info("Table -->", tb)

    if (tb == null) {
      return false;
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
      },
    };

    let tableInfo = await PlayingTables.findOneAndUpdate(wh, update, { new: true });

    //remove await bcz more time dealy 
    let playerUgcInfo = this.deduct(tableInfo, playerInfo);
    logger.info('Player Deduct Coins', playerUgcInfo);

    await cardDealActions.cardDealStart(tableInfo._id);
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
        logger.info('\nresetUserData playerInfo :-> ', playerInfo[i]);
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
    //Update the Cards of the user
    for (let i = 0; i < playerInfo.length; i++) {
      let pId = playerInfo[i].playerId;
      if (playerInfo[i].debitChips === false) {
        let wh = { _id: MongoID(pId.toString()) };
        let userInfo = await Users.findOne(wh, {}).lean();

        if (userInfo === null) {
          return;
        }

        let totalWallet = Number(userInfo.chips);
        let totalbonus = Number(userInfo.bonusChips);

        let playerGameChips = tabInfo.entryFee * 80;
        let gameDepositChips = playerGameChips;

        let perdecuct = GAMELOGICCONFIG.PLAYING_BONUS_DEDUCT_PER || 10
        let bonuscutchips = Number((gameDepositChips * perdecuct) / 100)
        let mainchipscut = Number(gameDepositChips - bonuscutchips)

        let bonuswalletdeduct = false;
        let mainwalletdeduct = false;


        if (totalbonus >= bonuscutchips && totalWallet >= mainchipscut) {
          bonuswalletdeduct = true
          mainwalletdeduct = true

        } else if (totalWallet >= mainchipscut) {
          mainwalletdeduct = true
        }
        // let playerGameChips = tabInfo.entryFee * 80;
        // let gameDepositChips = playerGameChips * 3;

        // if (userInfo.chips > gameDepositChips) {
        //   playerGameChips = gameDepositChips;
        //   totalWallet -= gameDepositChips;
        // } else if (userInfo.chips > playerGameChips * 2) {
        //   playerGameChips = playerGameChips * 2;
        //   totalWallet -= playerGameChips;
        // } else if (userInfo.chips > playerGameChips) {
        //   playerGameChips;
        //   totalWallet -= playerGameChips;
        // }

        // let userWalletUpdate = {
        //   $set: {
        //     chips: Number(totalWallet),
        //   },
        //   $inc: {
        //     'counters.totalMatch': 1,
        //   },
        // };

        // let uwh = { _id: MongoID(pId.toString()) };
        // let updateCounters = await Users.findOneAndUpdate(uwh, userWalletUpdate, { new: true });

        // logger.info('Wallet after deduct coins update in user and counter ::', updateCounters);

        console.log("bonuswalletdeduct ", bonuswalletdeduct)
        console.log("mainwalletdeduct ", mainwalletdeduct)


        if (bonuswalletdeduct && mainwalletdeduct) {
          await walletActions.addWalletPayin(pId, - Number(mainchipscut), 'Debit', 'Point Playing Entry Deduct Deposit');
          await walletActions.addWalletBonusDeposit(pId, - Number(bonuscutchips), 'Debit', 'Point Playing Entry Deduct bonus');

        } else if (mainwalletdeduct) {
          await walletActions.addWalletPayin(pId, - Number(gameDepositChips), 'Debit', 'Point Playing Entry Deduct Deposit');
        }

        const upWh = {
          _id: MongoID(tabInfo._id),
          'playerInfo.seatIndex': Number(playerInfo[i].seatIndex),
        };

        let userUpdate = {
          'playerInfo.$.debitChips': true,
        };

        await PlayingTables.findOneAndUpdate(upWh, userUpdate, {
          new: true,
        });
        //logger.info(' Detils tbInfo ->', tbInfo);
      } else {
        logger.info('User have sufficient chips  ', playerInfo[i]);
      }
    }
    return playerUgcInfo;
  } catch (error) {
    logger.error('\nngameStart.js deduct error :-> ', error);
  }
};



module.exports.RoundFinishdeduct = async (tbInfo, playerInfo, diff) => {
  const tabInfo = tbInfo;

  try {
    // let playerUgcInfo = [];
    //Update the Cards of the user

    let pId = playerInfo.playerId;

    let wh1 = { _id: MongoID(pId.toString()) };
    let userInfo = await Users.findOne(wh1, {}).lean();

    if (userInfo === null) {
      return;
    }

    let totalWallet = Number(userInfo.chips);
    let totalbonus = Number(userInfo.bonusChips);

    let playerGameChips = diff;
    let gameDepositChips = playerGameChips;

    let perdecuct = GAMELOGICCONFIG.PLAYING_BONUS_DEDUCT_PER || 10
    let bonuscutchips = Number((gameDepositChips * perdecuct) / 100)
    let mainchipscut = Number(gameDepositChips - bonuscutchips)

    let bonuswalletdeduct = false;
    let mainwalletdeduct = false;


    if (bonuscutchips != 0 && mainchipscut != 0 && totalbonus >= bonuscutchips && totalWallet >= mainchipscut) {
      bonuswalletdeduct = true
      mainwalletdeduct = true

    } else if (mainchipscut != 0 && totalWallet >= mainchipscut) {
      mainwalletdeduct = true
    }


    logger.info("point bonuswalletdeduct ", bonuswalletdeduct)
    logger.info("point mainwalletdeduct ", mainwalletdeduct)


    if (bonuswalletdeduct && mainwalletdeduct) {
      await walletActions.addWalletPayin(pId, - Number(mainchipscut), 'Debit', 'Point Playing Entry ReDeduct  Deposit');
      await walletActions.addWalletBonusDeposit(pId, - Number(bonuscutchips), 'Debit', 'Point Playing Entry ReDeduct bonus');

    } else if (mainwalletdeduct) {
      await walletActions.addWalletPayin(pId, - Number(gameDepositChips), 'Debit', 'Point Playing Entry ReDeduct Deposit');
    }

    let wh = {
      _id: MongoID(tabInfo._id.toString()),
      'playerInfo._id': MongoID(pId.toString()),
    };

    let updateUserData = {
      $set: {},
      $inc: {},
    };

    updateUserData.$inc['playerInfo.$.gameChips'] = diff;
    updateUserData.$inc['playerInfo.$.chips'] = -diff;

    let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateUserData, {
      new: true,
    });

    logger.info("tbInfo =>", tbInfo)

    return tbInfo;
  } catch (error) {
    logger.error('\nngameStart.js deduct error :-> ', error);
  }
};