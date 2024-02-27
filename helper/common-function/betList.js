const mongoose = require('mongoose');
const BetLists = mongoose.model('betLists');
const PoolBetLists = mongoose.model('poolbetLists');
const DealBetLists = mongoose.model('dealbetLists');

const CONST = require('../../constant');
const logger = require('../../logger');
const { sendEvent } = require('../socketFunctions');

module.exports.getPoolBet = async (requestData, socket) => {
  try {
    logger.info('requestData', requestData);
    let wh = {
      gameType: requestData.gameType,
      type: requestData.type,
    };

    let betInfo = await PoolBetLists.find(wh, {}).lean();
    logger.info('Pool bet list', betInfo);

    let response = {
      Type: requestData.type,
      List: betInfo,
    };
    logger.info('Pool bet list response', response);

    socket.uid = requestData.playerId;
    socket.sck = socket.id;
    sendEvent(socket, CONST.POOL_GET_BET_LIST, response);
  } catch (error) {
    logger.error('betList.js poolGetBetList error=> ', error, requestData);
  }
};

module.exports.getBetList = async (requestData, socket) => {
  try {
    let listInfo = await BetLists.aggregate([
      { $sort: { entryFee: 1 } },
      {
        $project: {
          entryFee: '$entryFee',
          gamePlayType: '$gamePlayType',
          maxSeat: '$maxSeat',
        },
      },
    ]);


    const parsedListInfo = listInfo.map(item => ({
      _id: item._id,
      entryFee: parseFloat(item.entryFee.toString()),
      gamePlayType: item.gamePlayType,
      maxSeat: item.maxSeat
    }));

    let response = {
      List: parsedListInfo,
    };

    socket.uid = requestData.playerId;
    socket.sck = socket.id;
    sendEvent(socket, CONST.GET_BET_LIST, response);
  } catch (error) {
    logger.error('betList.js getBetList error=> ', error, requestData);
  }
};

module.exports.getDealList = async (requestData, socket) => {
  try {
    let wh = {
      gameType: requestData.gameType,
      deal: requestData.type,
    };

    let listInfo = await DealBetLists.find(wh, {}).lean();

    //let listInfo = await DealBetLists.aggregate([
    //  { $sort: { deal: 1 } },
    //  {
    //    $project: {
    //      entryFee: '$entryFee',
    //      gamePlayType: '$gamePlayType',
    //      deal: '$deal',
    //    },
    //  },
    //]);

    let response = {
      Type: requestData.type,
      List: listInfo,
    };

    socket.uid = requestData.playerId;
    socket.sck = socket.id;
    sendEvent(socket, CONST.DEAL_BET_LIST, response);
  } catch (error) {
    logger.error('betList.js getBetList error=> ', error, requestData);
  }
};
