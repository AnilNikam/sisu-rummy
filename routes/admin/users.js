const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Users = mongoose.model('users');
const Wallet = mongoose.model('wallets');
const MongoID = mongoose.Types.ObjectId;
const Transaction = mongoose.model('Transaction');
const PlayingTables = mongoose.model('playingTable');
const config = require('../../config');
const logger = require('../../logger');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/mainController');
const { getPaymentHistory } = require('../../helper/walletFunction');
const { sendActiveUser } = require('../../helper/helperFunction');
const { OBJECT_ID } = require('../../config');

/**
 * @api {get} /admin/users/:userId
 * @apiName  get player details by playerId
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/:userId', async (req, res) => {
  logger.info('/player/:userId req------=> ', req.params);
  const { userId } = req.params;
  try {
    const user = await Users.findOne({ _id: MongoID(userId) }).lean();
    logger.info('userId user---- => ', user);

    if (user) {
      res.status(config.OK_STATUS).json({
        data: user,
        message: 'Record found',
        status: 1,
      });
    } else {
      res.status(config.NOT_FOUND).json({
        data: null,
        message: 'Record Not found',
        status: 0,
      });
    }
    // return user;
  } catch (error) {
    logger.error('admin/users.js player/:userId error => ', error);
    return {
      message: 'something went wrong while Find Profile, please try again',
      status: 0,
    };
  }
});

/**
 * @api {get} /admin/users/
 * @apiName  get all playing tables details
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.get('/playingtables', async (req, res) => {
  logger.info('Plying tables Req Query => ', req.query);
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let search = req.query.search || '';

  try {
    const counts = await PlayingTables.countDocuments();
    const aggregateArray = [];

    if (search) {
      const searchPattern = new RegExp(search, 'i');
      const searchId = commonHelper.strToMongoDb(search);

      const orCondition = [];

      if (OBJECT_ID.isValid(searchId)) {
        orCondition.push({ _id: searchId });
      }

      orCondition.push({ gamePlayType: searchPattern });

      aggregateArray.push({
        $match: {
          $or: orCondition,
        },
      });
    }

    aggregateArray.push({ $sort: { createdAt: -1 } });
    aggregateArray.push({ $skip: (page - 1) * limit });
    aggregateArray.push({ $limit: limit });
    const plyingTablesList = await PlayingTables.aggregate(aggregateArray);
    logger.info('Plying tables List => ', plyingTablesList);

    if (plyingTablesList) {
      res.status(config.OK_STATUS).json({
        message: 'deta found',
        status: 1,
        data: plyingTablesList,
        counts,
        totalPage: Math.ceil(counts / limit),
      });
    } else {
      logger.info('User Not Authenticate');
      res.status(config.OK_STATUS).json({
        message: 'No Users found',
        status: 0,
        counts: 0,
        totalPage: Math.ceil(counts / limit),
      });
    }
  } catch (error) {
    logger.error('admin/users.js get method error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

/**
 * @api {get} /admin/users/active-user
 * @apiName  get count all online player
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/active-user', async (req, res) => {
  let count = sendActiveUser();
  logger.info('count => ', count);
  res.status(config.OK_STATUS).json({ message: 'Active Users', count: count });
});

/**
 * @api {get} /admin/users/transaction/:playerId
 * @apiName  get player Transaction details by playerId
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.get('/transaction/:playerId', async (req, res) => {
  logger.info('/admin/users/transaction/req------=> ', req.params);
  const { playerId } = req.params;
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;

  try {
    let getPaymentHistoryData = await getPaymentHistory({ playerId: req.params.playerId });

    const transactions = await Transaction.aggregate([
      {
        $match: {
          userId: commonHelper.strToMongoDb(req.params.playerId),
        },
      },
      {
        $skip: page * limit,
      },
      {
        $limit: limit,
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    logger.info('getPaymentHistory transactions => ', transactions);
    let TransactionData = [];
    transactions.forEach((element) => {
      TransactionData.push({
        transactionId: element.transactionId || 'N/A',
        amount: element.amount,
        type: element.type,
        paymentStatus: element.paymentStatus,
        paymentMode: element.paymentGateway,
        date: element.createdAt.getDate() + '/' + (element.createdAt.getMonth() + 1) + '/' + element.createdAt.getFullYear(),
        time: element.createdAt.getHours() + ':' + element.createdAt.getMinutes() + ':' + element.createdAt.getSeconds(),
      });
    });
    logger.info('getPaymentHistory TransactionData => ', TransactionData);
    const userWalletData = await Wallet.findOne({
      userId: commonHelper.strToMongoDb(playerId),
    });
    logger.info('USER_UPDATE_PROFILE userWallet => ', userWalletData);

    let response;
    if (userWalletData) {
      response = {
        th: TransactionData,
        db: Number(userWalletData.balance.toFixed(2)),
      };
      logger.info('wlletFunction.js getPaymentHistory Response : ', response);
    }

    logger.info('get Payment History Response  ==> ', response);
    let counts = getPaymentHistoryData.th.length;
    logger.info('Counts == >', counts);
    if (response) {
      res.status(config.OK_STATUS).json({
        data: response.th,
        depositBalance: response.db,
        message: 'Record found',
        status: 1,
        counts,
        totalPage: Math.ceil(counts / limit),
      });
    } else {
      res.status(config.OK_STATUS).json({
        data: [],
        depositBalance: 'N/A',
        message: 'Record not found',
        status: 0,
      });
    }
  } catch (error) {
    logger.error('admin/users.js transaction/:playerId error => ', error);
    return {
      message: 'something went wrong while Find Profile, please try again',
      status: 0,
    };
  }
});

/**
 * @api {get} /admin/users/
 * @apiName  get all player details
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.get('/', async (req, res) => {
  let page = parseInt(req.query.page);
  let limit = parseInt(req.query.limit);
  let search = req.query.search || '';
  //logger.info('req.query => ', req.query);

  try {
    const counts = await Users.countDocuments();

    let searchPattern = new RegExp(search, 'i');
    logger.info('searchPattern => ', searchPattern);

    //const users = await Users.aggregate([
    //  {
    //    $lookup: {
    //      from: 'wallets',
    //      localField: '_id',
    //      foreignField: 'userId',
    //      as: 'userData',
    //    },
    //  },
    //  {
    //    $unwind: '$userData',
    //  },
    //  { $match: { name: { $regex: searchPattern } } },
    //  {
    //    $skip: page * limit,
    //  },
    //  {
    //    $limit: limit,
    //  },
    //]);

    const users = await Users.find()
      .limit(limit)
      .skip(page * limit)
      .lean();

    logger.info('get all user => ', users);
    // logger.info('get all user userData=> ', users.userData);
    if (users) {
      res.status(config.OK_STATUS).json({
        message: 'Users found',
        status: 1,
        data: users,
        counts,
        totalPage: Math.ceil(counts / limit),
      });

      res.end();
    } else {
      logger.info('User Not Authenticate');
      res.status(config.NOT_FOUND).json({
        message: 'No Users found',
        status: 0,
        counts: 0,
        totalPage: Math.ceil(counts / limit),
      });
    }
  } catch (error) {
    logger.error('admin/users.js get method error => ', error);
    res.status(config.INTERNAL_SERVER_ERROR).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

/**
 * @api {put} /admin/users/
 * @apiName  update the coins
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.put('/', async (req, res) => {
  try {
    logger.info('Req body put =>', req.body);
    let newData = {
      chips: Number(req.body.chips),
      modifiedAt: Date.now(),
    };
    logger.info('newData => ', newData);

    let condition = { _id: commonHelper.strToMongoDb(req.body.playerId) };
    logger.info('condition => ', condition);

    let responseData = await commonHelper.update(Users, condition, newData);
    logger.info('responseData => ', responseData);

    if (responseData.status === 1) {
      // delete responseData.data.password;
      res.status(config.OK_STATUS).json(responseData);
    } else {
      res.status(config.DATABASE_ERROR_STATUS).json(responseData);
    }
  } catch (error) {
    logger.error('admin/users.js put method error => ', error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {delete} /admin/users/
 * @apiName  delete the user by userId
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key;
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.delete('/:playerId', async (req, res) => {
  let condition = { _id: commonHelper.strToMongoDb(req.params.playerId) };
  logger.info('condition => ', condition);

  try {
    let responseData = await commonHelper.deleteOne(Users, condition);

    let responseDeleteWallet = await commonHelper.deleteOne(Wallet, {
      userId: commonHelper.strToMongoDb(req.params.playerId),
    });
    logger.info('responseData => ', responseData);
    logger.info('responseDeleteWallet => ', responseDeleteWallet);

    if (responseData.status === 1) {
      res.status(config.OK_STATUS).json(responseData);
    } else {
      res.status(config.DATABASE_ERROR_STATUS).json(responseData);
    }
  } catch (error) {
    logger.error('admin/users.js :playerId error => ', error);

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {get} /admin/users/leaderboard
 * @apiName  leaderboard
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/leaderboard', async (req, res) => {
  res.json(await mainCtrl.leaderBoard());
});

module.exports = router;
