const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = mongoose.model('Transaction');
const playingTables = mongoose.model('playingTable');
const GamePlayTrack = mongoose.model('gamePlayTracks');
const TableHistory = mongoose.model('tableHistory');
const Users = mongoose.model('users');
const config = require('../../config');
const commonHelper = require('../../helper/commonHelper');
const logger = require('../../logger');
const UserWalletTracks = mongoose.model("walletTrackTransaction");
const otpAdharkyc = mongoose.model('otpAdharkyc');
/**
 * @api {get} /admin/dashboard
 * @apiName  get all playing List details
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

// router.get('/', async (req, res) => {
//   try {
//     const playingTableDetails = await playingTables.find();
//     // logger.info("playingTableDetails --> ", playingTableDetails);
//     if (playingTableDetails) {
//       res.status(config.OK_STATUS).json({
//         message: ' Details found',
//         status: 1,
//         data: { count: playingTableDetails.length },
//       });
//     } else {
//       // logger.info("withdraw Details Not found");
//       res.status(config.OK_STATUS).json({ message: ' Details Not found', status: 0 });
//     }
//   } catch (error) {
//     logger.error('dashboard.js something went wrong', error);
//     res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
//   }
// });

/**
 * @api {get} /admin/dashboard/gameplay-track
 * @apiName  get all Requet List details
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.get('/gameplay-track', async (req, res) => {
  // logger.info("gameplay-track id ---> ", req.params.id)
  try {
    const gamePlayTrackDetails = await GamePlayTrack.find();
    // logger.info('game Play Track Details => ', gamePlayTrackDetails);
    if (gamePlayTrackDetails) {
      res.status(config.OK_STATUS).json({
        message: 'Details found',
        status: 1,
        data: gamePlayTrackDetails,
      });
    } else {
      res.status(config.OK_STATUS).json({ message: ' Details Not found', status: 0 });
    }
  } catch (error) {
    logger.error('flutterwave.js gameplay-track error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

/**
 * @api {get} /admin/dashboard/gameplay-track/:id
 * @apiName  get all Requet List details
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.get('/gameplay-track/:id', async (req, res) => {
  // logger.info("gameplay-track id ---> ", req.params.id)
  const id = req.params.id;
  const condition = { tableId: commonHelper.strToMongoDb(id) };
  // console.info('condition => ', condition);

  try {
    const gamePlayTrackDetails = await GamePlayTrack.find(condition);
    // logger.info('game Play Track Details => ', gamePlayTrackDetails);
    if (gamePlayTrackDetails) {
      res.status(config.OK_STATUS).json({
        message: 'Details found',
        status: 1,
        data: gamePlayTrackDetails,
      });
    } else {
      res.status(config.OK_STATUS).json({ message: ' Details Not found', status: 0 });
    }
  } catch (error) {
    logger.error('flutterwave.js gameplay-track error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

/**
 * @api {get} /admin/dashboard/transaction-history
 * @apiName  get all Requet List details
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.get('/transaction-history', async (req, res) => {
  try {
    const transactionDetails = await Transaction.find().sort({ _id: -1 }).limit(5);

    // logger.info("transactionDetails fetchRecord --> ", transactionDetails);
    if (transactionDetails) {
      res.status(config.OK_STATUS).json({
        message: 'Details found',
        status: 1,
        data: transactionDetails,
      });
    } else {
      // logger.info("withdraw Details Not found");
      res.status(config.OK_STATUS).json({ message: ' Details Not found', status: 0 });
    }
  } catch (error) {
    logger.error('flutterwave.js fetch-transfer-details error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

/**
 * @api {get} /admin/dashboard/count-users
 * @apiName  get all count of users and active users
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.get('/count-users', async (req, res) => {
  try {
    const countUser = await Users.find({}).count();
    // logger.info("\nAll Registerd User Count ->  ", countUser);
    const activeCount = await Users.find({ 'flags.isOnline': 1 }).count();
    // logger.info("\nAll Active User Count ->  ", countUser);

    res.status(config.OK_STATUS).json({
      message: 'Details found',
      status: 1,
      data: { usersCount: countUser, activeUserCount: activeCount },
    });
    // if (countUser) {
    // }
    // else {
    // logger.info("withdraw Details Not found");
    //     res.status(config.OK_STATUS).json({ message: " Details Not found", status: 0 });
    // }
  } catch (error) {
    logger.error('flutterwave.js count-users error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

/**
 * @api {get} /admin/dashboard/commission
 * @apiName  get all count of users and active users
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.get('/commission', async (req, res) => {
  try {
    const countCommission = await TableHistory.aggregate([{ $group: { _id: null, gameCommissions: { $sum: '$commission' } } }]);

    // logger.info("\nTable history Count ->  ", countCommission);
    //const countPrivateCommission = await PrivateTableHistory.aggregate([{ $group: { _id: null, privateGameCommission: { $sum: '$commission' } } }]);

    // logger.info("\nPrivate table History commission Count ->  ", countPrivateCommission);
    //const totalCommission = Number(countCommission[0].gameCommissions + countPrivateCommission[0].privateGameCommission);
    res.status(config.OK_STATUS).json({
      message: 'total Game Commission found',
      status: 1,
      data: {
        gameCommission: countCommission[0].gameCommissions,
        //privateGameCommission: countPrivateCommission[0].privateGameCommission,
        //totalCommission,
      },
    });
  } catch (error) {
    logger.error('flutterwave.js commission error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

/**
 * @api {get} /admin/dashboard/statistics
 * @apiName  get all count of users and active users
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.get('/statistics', async (req, res) => {
  try {
    let totalCommission = 'N/A';
    const countUser = await Users.find({}).count();
    // logger.info("\nAll Registerd User Count ->  ", countUser);
    const activeCount = await Users.find({ 'flags.isOnline': 1 }).count();

    // logger.info("\nAll Active User Count ->  ", countUser);
    //const countCommission = await TableHistory.aggregate([{ $group: { _id: null, gameCommissions: { $sum: '$commission' } } }]);

    // logger.info("\nTable history Count ->  ", countCommission);
    //const countPrivateCommission = await PrivateTableHistory.aggregate([{ $group: { _id: null, privateGameCommission: { $sum: '$commission' } } }]);

    // logger.info("\nPrivate table History commission Count ->  ", countPrivateCommission);
    //const getGameCommission = countCommission.length > 0 ? countCommission[0].gameCommissions : 0;

    //const getPrivateGameCommission = countPrivateCommission.length > 0 ? countPrivateCommission[0].privateGameCommission : 0;
    //totalCommission = Number(getGameCommission + getPrivateGameCommission);
    //logger.info('totalCommission =>', totalCommission);

    const playingTableDetails = await playingTables.countDocuments({});
    // logger.info("playingTableDetails --> ", playingTableDetails);

    const response = {
      activeUsers: activeCount,
      totalUsers: countUser,
      currentPlayingTables: playingTableDetails,
      totalCommission,
    };

    res.status(config.OK_STATUS).json({ message: 'Game Statistics Details', status: 1, data: response });
  } catch (error) {
    logger.error('dashboard.js statistics error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});


/**
 * @api {post} /admin/lobbies
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/', async (req, res) => {
  try {
    console.log('requet => ');
    const totalUser = await Users.find().count()
    let lastdate = AddTime(-86000)
    console.log("lastdate ",new Date(lastdate))
    var totalDepositData = await UserWalletTracks.aggregate([
      {
        $match: {
          "trnxTypeTxt": "PayIn" 
        }
      },
      {
        $group: {
          _id: 'null',
          total: {
            $sum: '$transAmount'
          }
        }
      }
    ]);
    console.log("totalDepositData ", totalDepositData)

    const totalDeposit = totalDepositData.length > 0 ? totalDepositData[0].total : 0;

    var totalWithdrawData = await UserWalletTracks.aggregate([
      {
        $match: {
          "trnxTypeTxt":  "PayOut" 
        }
      },
      {
        $group: {
          _id: 'null',
          total: {
            $sum: '$transAmount'
          }
        }
      }
    ]);
    console.log("totalWithdrawData ", totalWithdrawData)


    const totalWithdraw = totalWithdrawData.length > 0 ? totalWithdrawData[0].total : 0

    var todayDepositDataToday = await UserWalletTracks.aggregate([
      {
        $match: {
          "createdAt":{$gte:new Date(lastdate),$lte:new Date()},
          "trnxTypeTxt":  "PayIn" 
        }
      },
      {
        $group: {
          _id: 'null',
          total: {
            $sum: '$transAmount'
          }
        }
      }
    ]);
    console.log("todayDepositDataToday ", todayDepositDataToday)

    const todayDeposit = todayDepositDataToday.length > 0 ? todayDepositDataToday[0].total : 0;

    var todayWithdrawDataToday = await UserWalletTracks.aggregate([
      {
        $match: {
          "createdAt":{$gte:new Date(lastdate),$lte:new Date()},
          "trnxTypeTxt":  "PayOut" 
        }
      },
      {
        $group: {
          _id: 'null',
          total: {
            $sum: '$transAmount'
          }
        }
      }
    ]);
    console.log("todayWithdrawDataToday ", todayWithdrawDataToday)

    const todayWithdraw = todayWithdrawDataToday.length > 0 ? todayWithdrawDataToday[0].total : 0

    const todayKYC = await otpAdharkyc.find({ "createdAt":{$gte:new Date(lastdate),$lte:new Date()} }).count();
    const totalGamePay = await TableHistory.find({ "date":{$gte:new Date(lastdate),$lte:new Date()} }).count();;
    const totalCommission = 0;


    logger.info('admin/dahboard.js post dahboard  error => ', totalUser);

    console.log("ggggggggg", { totalUser, totalDeposit, totalWithdraw, todayDeposit, todayWithdraw, todayKYC, totalGamePay, totalCommission })

    res.json({ totalUser, totalDeposit, totalWithdraw, todayDeposit, todayWithdraw, todayKYC, totalGamePay, totalCommission });
  } catch (error) {
    logger.error('admin/dahboard.js post bet-list error => ', error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});


/**
* @api {post} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/latatestUser', async (req, res) => {
  try {
    //console.info('requet => ', req);
    let t = new Date().setSeconds(new Date().getSeconds() - 604800);

    logger.info('admin/dahboard.js post dahboard  error => ', t);
    const RecentUser = await Users.find({ createdAt: { $gte: new Date(t) } }, { username: 1, id: 1, createdAt: 1 })

    logger.info('admin/dahboard.js post dahboard  error => ', RecentUser);

    res.json({ RecentUser });
  } catch (error) {
    logger.error('admin/dahboard.js post bet-list error => ', error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});


/**
* @api {post} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/latatestUserStatewise', async (req, res) => {
  try {
    //console.info('requet => ', req);
    let t = new Date().setSeconds(new Date().getSeconds() - 604800);

    // logger.info('admin/dahboard.js post dahboard  error => ', t);
    // const RecentUser = await Users.find({ createdAt: { $gte: new Date(t) } }, { username: 1, id: 1, createdAt: 1 })

    // logger.info('admin/dahboard.js post dahboard  error => ', RecentUser);

    res.json({
      statelist: [{
        _id: 12563,
        statename: "Goa",
        users: 100
      }, {
        _id: 122563,
        statename: "Gujarat",
        users: 59
      }]
    });
  } catch (error) {
    logger.error('admin/dahboard.js post bet-list error => ', error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

function AddTime (sec) {
  var t = new Date();
  return t.setSeconds(t.getSeconds() + sec);
}

module.exports = router;
