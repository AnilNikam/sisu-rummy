const mongoose = require('mongoose');
const BetLists = mongoose.model('dealbetLists');
const express = require('express');
const router = express.Router();
const config = require('../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/dealBetlistController');
const logger = require('../../logger');
//const LOBBY_PRIFIX = 'point';

/**
 * @api {post} /admin/deal-lobbies
 * @apiName  add-pool-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/', async (req, res) => {
  try {
    logger.info('admin/deal-lobbies/req.body => ', req.body);

    const newData = {
      entryFee: parseInt(req.body.entryFee),
      deal: parseInt(req.body.deal),
      gamePlayType: req.body.gamePlayType, //dealrummy
      tableName: req.body.tableName,
      status: req.body.status,
      commission: isNaN(parseInt(req.body.commission)) ? 15 : parseInt(req.body.commission),
      maxSeat: isNaN(parseInt(req.body.maxSeat)) ? 6 : parseInt(req.body.maxSeat),
    };
    console.log("11111111111111111111111111")
    res.json(await mainCtrl.registerBetList(newData));
  } catch (error) {
    logger.error('admin/users.js post bet-list error => ', error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {get} /admin/deal-lobbies
 * @apiName  pool-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/', async (req, res) => {
  res.json(await mainCtrl.getBetList());
});

/**
 * @api {delete} /admin/deal-lobbies/:id
 * @apiName  delete the bet by betId
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.delete('/:id', async (req, res) => {
  try {
    console.log("EAL :::::::::::::::::::::::::::::::::::")
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
 * @api {put} /admin/deal-lobbies
 * @apiName  bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put('/', async (req, res) => {
  //logger.info('Update Bet List req.body => ', req.body);
  try {
    const { entryFee, betListId, maxSeat, status, tableName,gamePlayType,deal,commission } = req.body;
    //const entryFeexists = await BetLists.countDocuments({ gamePlayType:gamePlayType,entryFee:entryFee,deal:deal });
    //logger.info('put entryFeexists deal ', entryFeexists);
    // if (entryFeexists > 0) {
    //   res.status(config.OK_STATUS).json({ status: 0, message: 'Deal Already Exists' });
    // } else {
      const newData = {
        entryFee: parseInt(entryFee),
        commission: parseInt(commission),
        deal: parseInt(deal),
        modifiedAt: Date.now(),
        maxSeat: parseInt(maxSeat),
        status: status,
        tableName: tableName,
      };
       logger.info('newData => ', newData);

      const condition = { _id: commonHelper.strToMongoDb(betListId) };
    logger.info('condition => ', condition);

      const responseData = await commonHelper.update(BetLists, condition, newData);
      logger.info('update response Data => ', responseData);

      if (responseData.status === 1) {
        res.status(config.OK_STATUS).json({
          status: 1,
          message: 'record Update',
          data: responseData.data,
        });
      } else {
        res.status(config.DATABASE_ERROR_STATUS).json({
          status: 0,
          message: 'record not Update',
        });
      }
    //}
  } catch (error) {
    logger.error('admin/users.js put bet-list error => ', error);
    return { status: 0, message: 'record not Found', data: null };
  }
});

/**
 * @api {get} /admin/deal-lobbies/:id
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
