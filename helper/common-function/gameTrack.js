const mongoose = require('mongoose');
const GamePlayTracks = mongoose.model('gamePlayTracks');
const PlayingTables = mongoose.model('playingTable');
const CONST = require('../../constant');
const logger = require('../../logger');
const MongoID = mongoose.Types.ObjectId;

module.exports.gamePlayTracks = async (playersInfo, table) => {
  try {
    logger.info('gamePlayTracks => playersInfo =>', playersInfo);

    let pushData;
    for (let i = 0; i < playersInfo.length; i++) {
      pushData = {
        tableId: MongoID(table._id),
        gameId: Number(table.gameId),
        userId: MongoID(playersInfo[i]._id),
        gameType: table.gamePlayType,
        deductAmount: table.entryFee,
        winningAmount: playersInfo[i].playerStatus === CONST.WON ? table.tableAmount : 0,
        winningStatus: playersInfo[i].result,
        gCard: playersInfo[i].gCard,
        score: playersInfo[i].score,
        cards: playersInfo[i].cards,
      };
      await GamePlayTracks.create(pushData);
    }

    const qu = {
      _id: MongoID(table._id),
    };

    let updatedata = {
      $set: {
        gameTracks: pushData,
      },
    };

    let tblInfo = await PlayingTables.findOneAndUpdate(qu, updatedata, { new: true });

    return {
      winningAmount: tblInfo.tableAmount,
    };
  } catch (e) {
    logger.error('gameTrack.js gamePlayTracks => ', e);
    return {
      winningAmount: 0,
    };
  }
};
