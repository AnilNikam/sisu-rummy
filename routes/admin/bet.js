const mongoose = require('mongoose');
const BetLists = mongoose.model('betLists');
const express = require('express');
const router = express.Router();
const config = require('../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/mainController');
const logger = require('../../logger');
//const LOBBY_PRIFIX = 'point';

/**
 * @api {post} /admin/lobbies
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/', async (req, res) => {
  try {
    // console.info('requet => ', req);
    logger.info('admin/lobbies/req.body => ', req.body);
    const newData = {
      entryFee: req.body.entryFee,
      gamePlayType: 'pointrummy',
      tableName: req.body.tableName,
      commission: parseInt(req.body.commission),
      maxSeat: parseInt(req.body.maxSeat),
      tableName: req.body.tableName,
      status: req.body.status,
    };
    res.json(await mainCtrl.registerBetList(newData));
  } catch (error) {
    logger.error('admin/users.js post bet-list error => ', error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {get} /admin/lobbies
 * @apiName  bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/', async (req, res) => {
  res.json(await mainCtrl.getBetList());
});

/**
 * @api {delete} /admin/lobbies/:id
 * @apiName  delete the bet by betId
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.delete('/:id', async (req, res) => {
  try {
    const condition = { _id: commonHelper.strToMongoDb(req.params.id) };
    // console.info('condition => ', condition);

    const responseData = await commonHelper.deleteOne(BetLists, condition);
    // console.log('responseData => ', responseData);

    if (responseData.status === 1) {
      res.status(config.OK_STATUS).json(responseData);
    } else {
      res.status(config.DATABASE_ERROR_STATUS).json(responseData);
    }
  } catch (error) {
    logger.error('admin/users.js post bet-list error => ', error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {put} /admin/lobbies
 * @apiName  bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put('/', async (req, res) => {
  //logger.info('Update Bet List req.body => ', req.body);
  try {
    const { entryFee, betListId, maxSeat, status, tableName, commission } = req.body;
    // const entryFeexists = await BetLists.countDocuments({ entryFee });
    // logger.info('put entryFeexists', entryFeexists);
    // if (entryFeexists > 0) {
    //   res.status(config.OK_STATUS).json({ status: 0, message: 'Entry Fee Already Exists' });
    // } else {
    const newData = {
      entryFee: parseInt(entryFee),
      gamePlayType: 'pointrummy',
      modifiedAt: Date.now(),
      maxSeat: maxSeat,
      status: status,
      tableName: tableName,
      commission: commission
    };
    console.log('newData => ', newData);

    const condition = { _id: commonHelper.strToMongoDb(betListId) };
    console.log('condition => ', condition);

    const responseData = await commonHelper.update(BetLists, condition, newData);
    console.log('update response Data => ', responseData);

    if (responseData.status === 1) {
      res.status(config.OK_STATUS).json({
        status: 1,
        message: 'record Update',
        data: responseData.data,
      });
    } else {
      res.status(config.DATABASE_ERROR_STATUS).json({
        status: 0,
        message: 'record not Deleted',
      });
    }
    //}
  } catch (error) {
    logger.error('admin/users.js put bet-list error => ', error);
    return { status: 0, message: 'record not Found', data: null };
  }
});

/**
 * @api {get} /admin/lobbies/:id
 * @apiName  bet-details
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/:id', async (req, res) => {
  // console.log('req.params.id => ', req.params);
  res.json(await mainCtrl.getBetDetails(req.params));
});

module.exports = router;
