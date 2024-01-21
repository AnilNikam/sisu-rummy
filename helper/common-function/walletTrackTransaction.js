const mongoose = require('mongoose');
const UserWalletTracks = mongoose.model('walletTrackTransaction');
const GameUser = mongoose.model('users');
const CONST = require('../../constant');
const commandAcions = require('../socketFunctions');
const logger = require('../../logger');
const MongoID = mongoose.Types.ObjectId;

module.exports.deductWallet = async (id, deductChips, tType, t, tblInfo) => {
  let tbInfo = tblInfo;
  try {
    const wh = typeof id === 'string' ? { _id: MongoID(id).toString() } : { _id: id };

    if (typeof wh === 'undefined' || typeof wh._id === 'undefined' || wh._id === null || typeof tType === 'undefined') {
      return false;
    }

    let upReps = await GameUser.findOne(wh, {}).lean();

    if (upReps === null) {
      return false;
    }

    let totalRemaningAmount = Number(upReps.chips);

    if (typeof tType !== 'undefined') {
      let walletTrack = {
        uniqueId: upReps.uniqueId,
        userId: upReps._id,
        transType: tType,
        transTypeText: t,
        transAmount: deductChips,
        chips: upReps.chips,
        winningChips: upReps.winningChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: tbInfo && tbInfo.gameId ? tbInfo.gameId : '',
        gameType: tbInfo && tbInfo.gamePlayType ? tbInfo.gamePlayType : '', //Game Type
        maxSeat: tbInfo && tbInfo.maxSeat ? tbInfo.maxSeat : 0, //Maxumum Player.
        betValue: tbInfo && tbInfo.entryFee ? tbInfo.entryFee : 0,
        tableId: tbInfo && tbInfo._id ? tbInfo._id.toString() : '',
      };
      await this.trackUserWallet(walletTrack);
    }

    return totalRemaningAmount;
  } catch (e) {
    logger.error('walletTrackTransaction deductWallet Exception error => ', e);
    return 0;
  }
};

module.exports.addWallet = async (id, addCoins, tType, t, tabInfo) => {
  try {
    logger.info('\n add Wallet : call -->>>', id, addCoins, t);
    const wh = typeof id === 'string' ? { _id: MongoID(id).toString() } : { _id: id };
    logger.info('Wh  =  ==  ==>', wh);

    if (typeof wh === 'undefined' || typeof wh._id === 'undefined' || wh._id === null || typeof tType === 'undefined') {
      return false;
    }
    const addedCoins = Number(addCoins.toFixed(2));

    const userInfo = await GameUser.findOne(wh, {}).lean();
    logger.info('Add Wallet userInfo ::=> ', userInfo);
    if (userInfo === null) {
      return false;
    }

    let setInfo = {
      $inc: {
        winningChips: Number(tabInfo.tableAmount - tabInfo.entryFee),
        'counters.gameWin': 1,
      },
    };

    logger.info('\n Add* Wallet setInfo :: ==>', setInfo);
    logger.info('\n Add* Wallet addedCoins :: ==>', addedCoins, '\n tabInfo.tableAmount :: ==>', tabInfo.tableAmount);
    const uWh = {
      _id: MongoID(tabInfo.playerInfo[tabInfo.currentPlayerTurnIndex]._id),
    };
    logger.info('\n AddWallet wh ::---> ', uWh);
    let tbl = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info('\n Add Wallet up Reps :::: ', tbl);

    let totalRemaningAmount = Number(tbl.chips);
    logger.info('\n Dedudct Wallet total RemaningAmount :: ', Number(totalRemaningAmount));

    if (typeof tType !== 'undefined') {
      logger.info('\n AddWallet tType :: ', tType);

      let walletTrack = {
        // id: userInfo._id,
        uniqueId: tbl.uniqueId,
        userId: tbl._id,
        transType: tType,
        transTypeText: t,
        transAmount: addedCoins,
        chips: userInfo.chips,
        winningChips: userInfo.winningChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: tabInfo && tabInfo.gameId ? tabInfo.gameId : '',
        gameType: tabInfo && tabInfo.gamePlayType ? tabInfo.gamePlayType : '', //Game Type
        maxSeat: tabInfo && tabInfo.maxSeat ? tabInfo.maxSeat : 0, //Maxumum Player.
        betValue: tabInfo && tabInfo.entryFee ? tabInfo.entryFee : 0,
        tableId: tabInfo && tabInfo._id ? tabInfo._id.toString() : '',
      };
      await this.trackUserWallet(walletTrack);
    }
    return totalRemaningAmount;
  } catch (e) {
    logger.error('walletTrackTransaction.js addWallet error =>', e);
    return 0;
  }
};

module.exports.trackUserWallet = async (obj) => {
  try {
    logger.info('\ntrackUserWallet obj ::', obj);

    let insertInfo = await UserWalletTracks.create(obj);
    logger.info('createTable UserWalletTracks : ', insertInfo);
    return true;
  } catch (e) {
    logger.error('walletTrackTransaction.js trackUserWallet error=> ', e);
    return false;
  }
};

module.exports.getWalletDetails = async (obj, client) => {
  try {
    logger.info('\n get Wallet Details ::', obj);

    let wh = { _id: obj };

    let walletDetails = await GameUser.findOne(wh, {}).lean();
    logger.info('getWalletDetails walletDetails : ', walletDetails);

    //"wb":WinningsBalance ||    "db": DepositBalance ||tw: TotalWinningBalance
    let response;
    if (walletDetails !== null) {
      response = {
        db: Number(walletDetails.chips.toFixed(2)),
        // wb: userCoinInfoData.winningAmount,
        // tw: userCoinInfoData.balance + userCoinInfoData.winningAmount,
      };
      logger.info('get Wallet Details Response : ', response);
      commandAcions.sendDirectEvent(client.id, CONST.PLAYER_BALANCE, response);
    } else {
      logger.info('At walletTrackTransaction.js:182 getWalletDetails => ', JSON.stringify(obj));
      commandAcions.sendDirectEvent(client.id, CONST.PLAYER_BALANCE, {}, false, 'user data not found');
    }
    return response;
  } catch (e) {
    logger.error('walletTrackTransaction.js getWalletDetails error => ', e);
    return false;
  }
};
