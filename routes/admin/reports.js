const express = require('express');
const router = express.Router();
const moment = require('moment');
const mongoose = require('mongoose');
const Transaction = mongoose.model('Transaction');
const TableHistory = mongoose.model('tableHistory');
const Users = mongoose.model('users');
const config = require('../../config');
const CONST = require('../../constant');
const logger = require('../../logger');

/**
 * @api {post} /admin/report/balance-report
 * @apiName  get all count of users and active users
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
// 8
router.post('/balance-report', async (req, res) => {
  try {
    //logger.info('balance report', req.body);
    const { data } = req.body;
    let startDate = moment().startOf('day').format();
    let endDate = moment().endOf('day');
    switch (data) {
      case 'today':
        startDate = moment().startOf('day').format();
        break;
      case '7-days':
        startDate = moment().subtract(7, 'days').format();
        break;
      case 'this-month':
        startDate = moment().startOf('month').format();
        break;
      case 'last-month':
        startDate = moment().subtract(1, 'months').startOf('month').format();
        endDate = moment().subtract(1, 'months').endOf('month').format();
        break;
      case '6-month':
        startDate = moment().subtract(180, 'days').startOf('day').format();
        break;
      case 'this-year':
        startDate = moment().startOf('year');
        break;
      default:
        startDate = moment().startOf('day').format();
        endDate = moment().endOf('day');
    }
    logger.info('\n startDay', startDate, '\nEnd Day', endDate);
    let totalDepositBalance = await Transaction.aggregate([
      {
        $match: {
          $and: [
            { type: 'Deposit' },
            {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
            { paymentStatus: 'successful' },
          ],
        },
      },
      {
        $group: {
          _id: '$userId',
          name: {
            $first: '$name',
          },
          amount: {
            $sum: '$amount',
          },
          type: {
            $first: '$type',
          },
        },
      },
      {
        $sort: {
          amount: -1,
        },
      },
      {
        $project: {
          _id: 1,
          amount: 1,
        },
      },
      {
        $group: {
          _id: null,
          totalDepositBalance: {
            $sum: '$amount',
          },
        },
      },
    ]);
    logger.info('\ntotalDepositBalance ->', totalDepositBalance);

    let totalWithdrawBalance = await Transaction.aggregate([
      {
        $match: {
          $and: [
            { type: 'Withdraw' },
            {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
            { paymentStatus: 'successful' },
          ],
        },
      },
      {
        $group: {
          _id: '$userId',
          name: {
            $first: '$name',
          },
          amount: {
            $sum: '$amount',
          },
          type: {
            $first: '$type',
          },
          data: {
            $push: '$$ROOT',
          },
        },
      },
      {
        $project: {
          _id: 1,
          amount: 1,
        },
      },
      {
        $group: {
          _id: null,
          totalWithdrawBalance: {
            $sum: '$amount',
          },
        },
      },
    ]);

    //logger.info('Total Withdraw balance', totalWithdrawBalance);
    let biggestDeposit = await Transaction.aggregate([
      {
        $match: {
          $and: [
            { type: 'Deposit' },
            {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
            { paymentStatus: 'successful' },
          ],
        },
      },
      {
        $project: {
          name: 1,
          amount: 1,
          type: 1,
        },
      },
      {
        $sort: {
          amount: -1,
        },
      },
      {
        $limit: 5,
      },
    ]);

    let biggestWithdraw = await Transaction.aggregate([
      {
        $match: {
          $and: [
            { type: 'Withdraw' },
            {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
            { paymentStatus: 'successful' },
          ],
        },
      },
      {
        $project: {
          name: 1,
          amount: 1,
          type: 1,
        },
      },
      {
        $sort: {
          amount: -1,
        },
      },
      {
        $limit: 5,
      },
    ]);

    let mostWins = await Users.aggregate([
      {
        $lookup: {
          from: 'gamePlayTracks',
          localField: '_id',
          foreignField: 'userId',
          as: 'result',
        },
      },
      {
        $unwind: {
          path: '$result',
        },
      },
      {
        $match: {
          'result.date': {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          winningAmount: '$result.winningAmount',
        },
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          winningAmount: { $sum: '$winningAmount' },
        },
      },
      {
        $sort: {
          winningAmount: -1,
        },
      },
      {
        $limit: 5,
      },
    ]);

    const gameCommission = await TableHistory.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalgameCommission: { $sum: '$commission' },
        },
      },
    ]);

    const totalGameComm = gameCommission.length > 0 ? gameCommission[0].totalgameCommission : 0;

    let response = {
      totalDepositBalance: totalDepositBalance.length > 0 ? totalDepositBalance[0].totalDepositBalance : 0,
      biggestDeposit: biggestDeposit,
      mostWins: mostWins,
      totalWithdrawBalance: totalWithdrawBalance.length > 0 ? totalWithdrawBalance[0].totalWithdrawBalance : 0,
      totalCommission: totalGameComm,
      biggestWithdraw,
    };
    res.status(config.OK_STATUS).json({ message: 'Game Statistics Details', status: 1, data: response });
  } catch (error) {
    logger.error('report.js balance-report error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

/**
 * @api {get} /admin/report/userbalance-report
 * @apiName  get all count of users and active users
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
// 9
router.get('/userbalance-report', async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  //logger.info('req.query => ', req.query);

  try {
    const counts = await Users.countDocuments();

    const searchPattern = new RegExp(search, 'i');
    // logger.info('searchPattern => ', searchPattern);

    const users = await Users.aggregate([
      {
        $lookup: {
          from: 'wallets',
          localField: '_id',
          foreignField: 'userId',
          as: 'userData',
        },
      },
      {
        $unwind: '$userData',
      },
      { $match: { name: { $regex: searchPattern } } },
      {
        $skip: page * limit,
      },
      {
        $limit: limit,
      },
      {
        $sort: {
          'userData.balance': -1,
        },
      },
    ]);

    logger.info('users -->', users);
    if (users.length > 0) {
      res.status(config.OK_STATUS).json({
        message: 'Users found',
        status: 1,
        data: users,
        counts,
        totalPage: Math.ceil(counts / limit),
      });
    } else {
      res.status(config.OK_STATUS).json({
        message: 'No Users found',
        status: 0,
        counts: 0,
        totalPage: Math.ceil(counts / limit),
      });
    }
  } catch (error) {
    logger.error('admin/reports.js userbalance-report error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

/**
 * @api {post} /admin/report/transaction-report
 * @apiName  post all count of users and active users
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
// 9
router.post('/transaction-report', async (req, res) => {
  try {
    logger.info('/transaction-report req.body =>', req.body);
    const { days, paymentType } = req.body;
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    //logger.info('/transaction-report req.query =>', req.query, page, limit);
    let startDate = moment().startOf('day').format();
    let endDate = moment().endOf('day').format();
    switch (days) {
      case 'today':
        startDate = moment().startOf('day').format();
        break;
      case '7-days':
        startDate = moment().subtract(7, 'days').format();
        break;
      case 'this-month':
        startDate = moment().startOf('month').format();
        break;
      case 'last-month':
        startDate = moment().subtract(1, 'months').startOf('month').format();
        endDate = moment().subtract(1, 'months').endOf('month').format();
        break;
      case '6-month':
        startDate = moment().subtract(180, 'days').startOf('day').format();
        break;
      case 'this-year':
        startDate = moment().startOf('year').format();
        break;
      default:
        startDate = moment().startOf('day').format();
        endDate = moment().endOf('day');
    }
    logger.info('\n StartDay', startDate, '\nEndDate', endDate);

    const transactionDetails = await Transaction.aggregate([
      {
        $match: {
          $and: [
            { type: paymentType },
            {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
            { paymentStatus: 'successful' },
          ],
        },
      },
      {
        $skip: page * limit,
      },
      {
        $limit: limit,
      },
    ]);

    logger.info('transaction Details =>', transactionDetails);

    const transactionDetailsCount = await Transaction.aggregate([
      {
        $match: {
          $and: [
            { type: paymentType },
            {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
            { paymentStatus: 'successful' },
          ],
        },
      },
    ]);
    logger.info('transaction Details Count =>', transactionDetailsCount);

    let transactionCounts = transactionDetailsCount.length;

    const response = {
      transactionDetails,
    };

    res.status(config.OK_STATUS).json({
      message: 'transaction-report Statistics Details',
      status: 1,
      data: response,
      transactionCounts,
      totalTransactionPage: Math.ceil(transactionCounts / limit),
    });
  } catch (error) {
    logger.error('report.js transaction-report error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

/**
 * @api {get} /admin/report/monthly-report
 * @apiName  get all count of users and active users
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.get('/monthly-report', async (req, res) => {
  const { year } = req.query;
  const startDate = moment({ year: year, month: 0, day: 1 }).startOf('day');
  const endDate = moment({ year: year, month: 11, day: 1 }).endOf('month').endOf('day');
  logger.info('report.js monthly-report info => ', year, startDate, endDate);

  try {
    const totalCommission = await TableHistory.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            month: {
              $month: '$date',
            },
            year: {
              $year: '$date',
            },
          },
          publicGameCommission: {
            $sum: '$commission',
          },
          countPublicGameplayed: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          year: '$_id.year',
          publicGameCommission: 1,
          countPublicGameplayed: 1,
        },
      },
    ]);
    //logger.info('/monthly-report totalCommission ->', totalCommission);

    const totalTransactions = await Transaction.aggregate([
      {
        $match: {
          paymentStatus: 'successful',
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            type: '$type',
            month: {
              $month: '$createdAt',
            },
            year: {
              $year: '$createdAt',
            },
          },
          amount: {
            $sum: '$amount',
          },
          createdAt: {
            $first: '$createdAt',
          },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          type: '$_id.type',
          amount: 1,
          year: '$_id.year',
        },
      },
    ]);
    //logger.info(' totalTransactions=> ', totalTransactions);

    const report = CONST.MONTHS.map((month, index) => {
      return {
        month,
        index: index + 1,
        year: parseInt(year),
        publicGameCommission: 0,
        countPublicGameplayed: 0,
        privateGameCommission: 0,
        countPrivateGamePlayed: 0,
        withdrawAmount: 0,
        depositAmount: 0,
      };
    });

    totalCommission.forEach((o) => {
      const index = report.findIndex((cal) => cal.index === o.month && cal.year === o.year);
      if (index >= 0) {
        report[index].publicGameCommission = o.publicGameCommission;
        report[index].countPublicGameplayed = o.countPublicGameplayed;
      }
    });

    //totalPrivateCommission.forEach((o) => {
    //  const index = report.findIndex((cal) => cal.index === o.month && cal.year === o.year);
    //  if (index >= 0) {
    //    report[index].privateGameCommission = o.privateGameCommission;
    //    report[index].countPrivateGamePlayed = o.countPrivateGamePlayed;
    //  }
    //});

    totalTransactions.forEach((o) => {
      const index = report.findIndex((cal) => cal.index === o.month && cal.year === o.year);
      if (index >= 0) {
        if (o.type === 'Deposit') {
          report[index].depositAmount = o.amount;
        } else {
          report[index].withdrawAmount = o.amount;
        }
      }
    });

    res.status(config.OK_STATUS).json({
      message: 'Yearly Report Statistics',
      status: 1,
      currentYear: parseInt(moment().format('YYYY')),
      minYear: 2022,
      data: report,
    });
  } catch (error) {
    logger.error('report.js monthly-report error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

/**
 * @api {post} /admin/report/betting-report
 * @apiName  post all count of users and active users
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
// 9
router.post('/betting-report', async (req, res) => {
  logger.info('/betting-report req.body =>', req.body);
  const { days, search } = req.body;
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  // eslint-disable-next-line no-unused-vars
  const searchPattern = new RegExp(search, 'i');
  try {
    let startDate = moment().startOf('day').format();
    let endDate = moment().endOf('day').format();
    switch (days) {
      case 'today':
        startDate = moment().startOf('day').format();
        break;
      case '7-days':
        startDate = moment().subtract(7, 'days').format();
        break;
      case 'this-month':
        startDate = moment().startOf('month').format();
        break;
      case 'last-month':
        startDate = moment().subtract(1, 'months').startOf('month').format();
        endDate = moment().subtract(1, 'months').endOf('month').format();
        break;
      case '6-month':
        startDate = moment().subtract(180, 'days').startOf('day').format();
        break;
      case 'this-year':
        startDate = moment().startOf('year');
        break;
      default:
        startDate = moment().startOf('day').format();
        endDate = moment().endOf('day');
    }
    logger.info('\n StartDay', startDate, '\nEndDate', endDate);
    /*
    const bettingReport = await TableHistory.aggregate([
      {
        $match: {
          $or: [
            {
              date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
            {
              tableId: searchPattern,
            },
          ],
        },
      },
      {
        $group: {
          _id: '$tableId',
          commission: { $sum: '$commission' },
          date: { $first: '$date' },
          entryFee: { $first: '$entryFee' },
          rounds: {
            $push: {
              gameId: '$gameId',
              commission: '$commission',
              entryFee: '$entryFee',
              gamePlayType: '$gamePlayType',
              activePlayer: '$activePlayer',
              jobId: '$jobId',
              date: '$date',
              gameTracks: '$gameTracks',
              tableAmount: '$tableAmount',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          tableId: '$_id',
          commission: 1,
          date: 1,
          entryFee: 1,
          rounds: 1,
        },
      },
      {
        $skip: page * limit,
      },
      {
        $limit: limit,
      },
    ]);

    logger.info('bettingReport =>', JSON.stringify(bettingReport));

    let bettingReportCount = await TableHistory.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            tableId: '$tableId',
          },
        },
      },
    ]);

    let bettingReportCounts = bettingReportCount.length;
    */

    const downloadBettingReport = await TableHistory.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: 1,
          tableId: 1,
          gameId: 1,
          gamePlayType: 1,
          entryFee: 1,
          tableAmount: 1,
          commission: 1,
          rounds: 1,
          gameTracks: 1,
        },
      },
      {
        $skip: page * limit,
      },
      {
        $limit: limit,
      },
    ]);

    const bettingReportCount = await TableHistory.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: 1,
          tableId: 1,
          gameId: 1,
          gamePlayType: 1,
          entryFee: 1,
          tableAmount: 1,
          commission: 1,
          rounds: 1,
          gameTracks: 1,
        },
      },
    ]);

    logger.info('download Detting Report ==>', JSON.stringify(downloadBettingReport));
    let bettingReportCounts = bettingReportCount.length;

    const response = {
      download: downloadBettingReport,
    };

    res.status(config.OK_STATUS).json({
      message: 'transaction-report Statistics Details',
      status: 1,
      data: response,
      bettingReportCount: bettingReportCounts,
      totalBettingPage: Math.ceil(bettingReportCounts / limit),
    });
  } catch (error) {
    logger.error('report.js betting-report error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

module.exports = router;
