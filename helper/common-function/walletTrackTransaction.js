const mongoose = require('mongoose');
const UserWalletTracks = mongoose.model('walletTrackTransaction');
const UserReferTracks = mongoose.model('userReferTracks');
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

//withdrawableChips 
module.exports.deductWalletPayOut = async (id, deductChips, tType, t, tblInfo) => {
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

    let setInfo = {
      $inc: {
        winningChips: deductChips
      },
    };

    logger.info('\n Dedudct* Wallet setInfo :: ==>', setInfo);
    logger.info('\n Dedudct* Wallet deductChips :: ==>', deductChips);

    let tbl = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info('\n Dedudct Wallet up Reps :::: ', tbl);

    let totalRemaningAmount = Number(tbl.winningChips);
    logger.info('\n Dedudct Wallet total RemaningAmount :: ', Number(totalRemaningAmount));

    if (typeof tType !== 'undefined') {
      let walletTrack = {
        uniqueId: tbl.uniqueId,
        userId: tbl._id,
        transType: tType,
        transTypeText: t,
        transAmount: deductChips,
        chips: tbl.chips,
        winningChips: tbl.winningChips,
        bonusChips: tbl.bonusChips,
        lockbonusChips: tbl.lockbonusChips,

        // referralChips: tbl.referralChips, // referarl Chips
        // unlockreferralChips: tbl.unlockreferralChips, // referarl Chips unlock Chips  
        // lockreferralChips: tbl.lockreferralChips, // referarl Chips lock Chips 
        // withdrawableChips: tbl.withdrawableChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: '',
        gameType: '', //Game Type
        maxSeat: 0, //Maxumum Player.
        betValue: 0,
        tableId: '',
      };
      await this.trackUserWallet(walletTrack);
    }
    // console.log("tbl.sckId ", tbl.sckId)

    commandAcions.sendDirectEvent(tbl.sckId, CONST.PLAYER_BALANCE, { chips: tbl.chips });

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

//Winning Chips 
module.exports.addWalletWinngChpis = async (id, addCoins, tType, t, tabInfo) => {
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
        winningChips: addedCoins
      },
    };

    logger.info('\n Add* Wallet setInfo :: ==>', setInfo);
    logger.info('\n Add* Wallet addedCoins :: ==>', addedCoins);

    let tbl = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info('\n Add Wallet up Reps :::: ', tbl);

    let totalRemaningAmount = Number(tbl.winningChips);
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
        chips: tbl.chips,
        winningChips: tbl.winningChips,
        bonusChips: tbl.bonusChips,
        lockbonusChips: tbl.lockbonusChips,

        // referralChips: tbl.referralChips, // referarl Chips
        // unlockreferralChips: tbl.unlockreferralChips, // referarl Chips unlock Chips  
        // lockreferralChips: tbl.lockreferralChips, // referarl Chips lock Chips 
        // withdrawableChips: tbl.withdrawableChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: '',
        gameType: '', //Game Type
        maxSeat: 0, //Maxumum Player.
        betValue: 0,
        tableId: '',
      };
      await this.trackUserWallet(walletTrack);
    }
    // console.log("tbl.sckId ", tbl.sckId)

    commandAcions.sendDirectEvent(tbl.sckId, CONST.PLAYER_BALANCE, { chips: tbl.chips });

    return totalRemaningAmount;
  } catch (e) {
    logger.error('walletTrackTransaction.js addWallet error =>', e);
    return 0;
  }
};

//Depotit Chips 
module.exports.addWalletPayin = async (id, addCoins, tType, t, tabInfo) => {
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
        chips: addedCoins
      },
    };

    logger.info('\n Add* Wallet setInfo :: ==>', setInfo);
    logger.info('\n Add* Wallet addedCoins :: ==>', addedCoins);

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
        chips: tbl.chips,
        winningChips: tbl.winningChips,
        bonusChips: tbl.bonusChips,
        lockbonusChips: tbl.lockbonusChips,

        // referralChips: tbl.referralChips, // referarl Chips
        // unlockreferralChips: tbl.unlockreferralChips, // referarl Chips unlock Chips  
        // lockreferralChips: tbl.lockreferralChips, // referarl Chips lock Chips 
        // withdrawableChips: tbl.withdrawableChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: '',
        gameType: '', //Game Type
        maxSeat: 0, //Maxumum Player.
        betValue: 0,
        tableId: '',
      };
      await this.trackUserWallet(walletTrack);
    }
    // console.log("tbl.sckId ", tbl.sckId)

    commandAcions.sendDirectEvent(tbl.sckId, CONST.PLAYER_BALANCE, { chips: tbl.chips, addCoins: addCoins });

    return totalRemaningAmount;
  } catch (e) {
    logger.error('walletTrackTransaction.js addWallet error =>', e);
    return 0;
  }
};

/*
  lock bonus check 
  > 500 

  addCoins > lock bonus == lock bonus 
  
  unlock ma add thasse 


*/
module.exports.locktounlockbonus = async (id, addCoins, tType, t, tabInfo) => {
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
    logger.info('userInfo.lockbonusChips ', userInfo.lockbonusChips)

    if (userInfo.lockbonusChips < 500) {
      logger.info('return false ::::::::::::::::::::::::', userInfo.lockbonusChips)

      return false
    }
    addedCoins = (userInfo.lockbonusChips > addCoins) ? addCoins : userInfo.lockbonusChips;

    logger.info('addedCoins ::=> ', addedCoins)

    let setInfo = {
      $inc: {
        lockbonusChips: -addedCoins,
        bonusChips: addCoins
      }
    };

    logger.info('\n Add* Wallet setInfo :: ==>', setInfo);
    logger.info('\n Add* Wallet addedCoins :: ==>', addedCoins);

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
        chips: tbl.chips,
        winningChips: tbl.winningChips,
        bonusChips: tbl.bonusChips,
        lockbonusChips: tbl.lockbonusChips,

        // referralChips: tbl.referralChips, // referarl Chips
        // unlockreferralChips: tbl.unlockreferralChips, // referarl Chips unlock Chips  
        // lockreferralChips: tbl.lockreferralChips, // referarl Chips lock Chips 
        // withdrawableChips: tbl.withdrawableChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: '',
        gameType: '', //Game Type
        maxSeat: 0, //Maxumum Player.
        betValue: 0,
        tableId: '',
      };
      await this.trackUserWallet(walletTrack);
    }
    // console.log("tbl.sckId ", tbl.sckId)

    commandAcions.sendDirectEvent(tbl.sckId, CONST.PLAYER_BALANCE, { chips: tbl.chips, addCoins: addCoins });

    return totalRemaningAmount;
  } catch (e) {
    logger.error('walletTrackTransaction.js addWallet error =>', e);
    return 0;
  }
};

// //Sinup Bonus & Deposit Bonus 
// module.exports.addReffralBonusDeposit = async (id, addCoins, tType, t) => {
//   try {
//     logger.info('\n add addReffralBonusDeposit : call -->>>', id, addCoins, t);
//     const wh = typeof id === 'string' ? { _id: MongoID(id).toString() } : { _id: id };
//     logger.info('Wh  =  ==  ==>', wh);

//     if (typeof wh === 'undefined' || typeof wh._id === 'undefined' || wh._id === null || typeof tType === 'undefined') {
//       return false;
//     }
//     const addedCoins = Number(addCoins.toFixed(2));

//     const whr = typeof id === 'string' ? { referalUserId: MongoID(id).toString(), reffralStatus: false } : { _id: id };
//     const UserReferTrackInfo = await UserReferTracks.findOne(whr, {}).lean();
//     if (UserReferTrackInfo) {
//       const userInfo = await GameUser.findOne(wh, {}).lean();
//       logger.info('Add addReffralBonusDeposit userInfo ::=> ', userInfo);

//       if (userInfo === null) {
//         return false;
//       }

//       let setInfo = {
//         $inc: {
//           referralChips: addedCoins
//         },
//       };

//       logger.info('\n Add* addReffralBonusDeposit setInfo :: ==>', setInfo);
//       logger.info('\n Add* addReffralBonusDeposit addedCoins :: ==>', addedCoins);

//       let tbl = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
//       logger.info('\n Add addReffralBonusDeposit up Reps :::: ', tbl);

//       let setInfos = {
//         $set: {
//           reffralStatus: true
//         },
//       };
//       let updatereffralSatus = await UserReferTracks.findOneAndUpdate(wh, setInfos, { new: true });
//       logger.info('\n Add addReffralBonusDeposit updatereffralSatus Reps :::: ', updatereffralSatus);

//       let totalRemaningAmount = Number(tbl.chips);
//       logger.info('\n Dedudct addReffralBonusDeposit total RemaningAmount :: ', Number(totalRemaningAmount));

//       if (typeof tType !== 'undefined') {
//         logger.info('\n AddWallet tType :: ', tType);

//         let walletTrack = {
//           // id: userInfo._id,
//           uniqueId: tbl.uniqueId,
//           userId: tbl._id,
//           transType: tType,
//           transTypeText: t,
//           transAmount: addedCoins,
//           chips: tbl.chips,
//           winningChips: tbl.winningChips,
//           bonusChips: tbl.bonusChips,
//           referralChips: tbl.referralChips, // referarl Chips
//           unlockreferralChips: tbl.unlockreferralChips, // referarl Chips unlock Chips  
//           lockreferralChips: tbl.lockreferralChips, // referarl Chips lock Chips 
//           // withdrawableChips: tbl.withdrawableChips,
//           totalBucket: Number(totalRemaningAmount),
//           gameId: '',
//           gameType: '', //Game Type
//           maxSeat: 0, //Maxumum Player.
//           betValue: 0,
//           tableId: '',
//         };
//         await this.trackUserWallet(walletTrack);
//       }
//       console.log("tbl.sckId ", tbl.sckId)

//       commandAcions.sendDirectEvent(tbl.sckId, CONST.PLAYER_BALANCE, { chips: tbl.chips, addCoins: addCoins });

//       return totalRemaningAmount;
//     } else {
//       logger.info("reffral id or user not found")
//     }

//   } catch (e) {
//     logger.error('walletTrackTransaction.js addWallet error =>', e);
//     return 0;
//   }
// };

//Sinup Bonus & Deposit Bonus 
module.exports.addWalletBonusDeposit = async (id, addCoins, tType, t) => {
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

    }
    if (userInfo.bonusChips + userInfo.lockbonusChips + addedCoins >= 500) {
      setInfo = {
        $inc: {
          lockbonusChips: addedCoins
        }
      };
    } else {
      setInfo = {
        $inc: {
          bonusChips: addedCoins
        }
      };
    }

    logger.info('\n Add* Wallet setInfo :: ==>', setInfo);
    logger.info('\n Add* Wallet addedCoins :: ==>', addedCoins);

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
        chips: tbl.chips,
        winningChips: tbl.winningChips,
        bonusChips: tbl.bonusChips,
        lockbonusChips: tbl.lockbonusChips,

        //referralChips: tbl.referralChips, // referarl Chips
        //unlockreferralChips: tbl.unlockreferralChips, // referarl Chips unlock Chips  
        //lockreferralChips: tbl.lockreferralChips, // referarl Chips lock Chips 
        //withdrawableChips: tbl.withdrawableChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: '',
        gameType: '', //Game Type
        maxSeat: 0, //Maxumum Player.
        betValue: 0,
        tableId: '',
      };
      await this.trackUserWallet(walletTrack);
    }
    // console.log("tbl.sckId ", tbl.sckId)

    commandAcions.sendDirectEvent(tbl.sckId, CONST.PLAYER_BALANCE, { chips: tbl.chips, addCoins: addCoins });

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
        wb: Number(walletDetails.winningChips.toFixed(2)),
        // wb: userCoinInfoData.winningAmount,
        tw: (walletDetails.chips.toFixed(2) + walletDetails.winningChips.toFixed(2)),
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


module.exports.getWalletDetailsNew = async (obj, client) => {
  try {
    logger.info('\n MYWALLET get Wallet Details ::', obj);

    let wh = { _id: obj };

    let walletDetails = await GameUser.findOne(wh, {}).lean();
    logger.info('MYWALLET getWalletDetails walletDetails : ', walletDetails);

    //"wb":WinningsBalance ||    "db": DepositBalance ||tw: TotalWinningBalance
    let response;
    console.log(" walletDetails.bonusChips ", walletDetails)
    //+ walletDetails.withdrawableChips //+ walletDetails.referralChips
    if (walletDetails !== null) {
      response = {
        tb: Number(Number(walletDetails.chips + walletDetails.winningChips + walletDetails.bonusChips).toFixed(2)),
        mb: Number(walletDetails.chips.toFixed(2)),
        sb_db: Number(walletDetails.bonusChips.toFixed(2)),
        wb: Number(walletDetails.winningChips.toFixed(2)),
        ulb: Number(walletDetails.lockbonusChips)
        //wc: (walletDetails.withdrawableChips.toFixed(2)),
      };
      logger.info('get MYWALLET Wallet Details Response : ', response);
      commandAcions.sendDirectEvent(client.id, CONST.MYWALLET, response);
    } else {
      logger.info('At MYWALLET walletTrackTransaction.js:182 getWalletDetails => ', JSON.stringify(obj));
      commandAcions.sendDirectEvent(client.id, CONST.MYWALLET, {}, false, 'user data not found');
    }
    return response;
  } catch (e) {
    logger.error('MYWALLET walletTrackTransaction.js getWalletDetails error => ', e);
    return false;
  }
};
