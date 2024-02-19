const mongoose = require('mongoose');
const Users = mongoose.model('users');
const BetLists = mongoose.model('poolbetLists');

const logger = require('../logger');
const usersHelper = require('../helper/usersHelper');
const commonHelper = require('../helper/commonHelper');

/**
 * @description . Add betlist
 * @param {Object} requestBody
 * @returns {Object}
 */
async function registerBetList(requestBody) {
  // logger.info('Pool Bet List Request Body => ', requestBody);
  const { gamePlayType, entryFee, type, status, commission, maxSeat, tableName } = requestBody;
  try {
    const entryFeexists = await BetLists.countDocuments({ type });
    if (entryFeexists > 0) {
      return { status: 0, message: 'Game Type Already Exists' };
    }

    const newData = { gamePlayType, entryFee, type, status, commission, maxSeat, tableName };
    const response = await usersHelper.poolBetLists(newData);

    if (response.status) {
      response.message = 'Register Success';
    } else {
      response.message = 'Invalid Credential';
    }

    return response;
  } catch (error) {
    logger.error('mainController.js Pool Bet List error=> ', error, requestBody);
    return {
      message: 'something went wrong while registering, please try again',
      status: 0,
    };
  }
}

/**
 * @description . updateBetList
 * @param {Object} requestBody
 * @returns {Object}
 */
async function updateBetList(requestBody) {
  const { entryFee, gamePlayType } = requestBody;
  try {
    const data = await Users.findOne({
      entryFee: commonHelper.strToMongoDb(entryFee),
    }).lean();

    if (data !== null) {
      const res = { entryFee, gamePlayType };
      const result = await commonHelper.update(BetLists, { entryFee: commonHelper.strToMongoDb(entryFee) }, res);

      if (result.status === 1) {
        return { status: true, message: 'Update User Details Succesfully' };
      } else {
        return { status: false, message: 'Details not Updated' };
      }
    } else {
      return { status: 0, message: 'Id Not Found' };
    }
  } catch (error) {
    logger.error('mainController.js update Pool Bet List error=> ', error, requestBody);
    return { status: 0, message: 'No data found' };
  }
}

/**
 * @description . getBetList
 * @param {Object} requestBody
 * @returns {Object}
 */
async function getBetList(requestBody) {
  try {
    const responseData = await BetLists.aggregate([
      { $sort: { entryFee: 1 } },
      {
        $project: {
          entryFee: '$entryFee',
          gamePlayType: '$gamePlayType',
          type: '$type',
          status: '$status',
          tableName: '$tableName',
          maxSeat:'$maxSeat',
          commission:'$commission'
        },
      },
    ]);
    console.log("responseData ",responseData)
    if (responseData.length !== 0) {
      return { status: 1, message: 'result sucessfully ', data: responseData };
    } else {
      return { status: 0, message: 'data not find' };
    }
  } catch (error) {
    logger.error('mainController.js get Pool Bet List error=> ', error, requestBody);
  }
}

/**
 * @description . getBetDetails
 * @param {Object} requestBody
 * @returns {Object}
 */
async function getBetDetails(requestBody) {
  const { id } = requestBody;
  try {
    const responseData = await BetLists.findOne({
      _id: commonHelper.strToMongoDb(id),
    }).lean();

    if (responseData !== null) {
      return { status: 1, message: 'result sucessfully ', data: responseData };
    } else {
      return { status: 0, message: 'data not find' };
    }
  } catch (error) {
    logger.error('mainController.js get Pool Bet List error=> ', error, requestBody);
  }
}

module.exports = {
  updateBetList,
  registerBetList,
  getBetList,
  getBetDetails,
};
