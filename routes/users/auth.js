const express = require('express');
const router = express.Router();
const config = require('../../config');
const commonHelper = require('../../helper/commonHelper');
const auth = require('../../middleware/auth');
const mongoose = require('mongoose');
const Users = mongoose.model('users');
const mainCtrl = require('../../controller/mainController');
const logger = require('../../logger');

/**
 * @api {get} /user/auth
 * @apiName  check API
 * @apiGroup  PUBLIC
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/', (req, res) => res.json({ test: 'Auth is success' }));

// Import schema for users to register
/**
 * @api {post} /user/auth/register
 * @apiName  register user
 * @apiGroup  PRIVATE
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.post('/register', async (req, res) => {
  res.json(await mainCtrl.registerUser(req.body));
});

/**
 * @api {post} /user/auth/login
 * @apiName  login user
 * @apiGroup  PRIVATE
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/login', async (req, res) => {
  res.json(await mainCtrl.logIn(req.body));
});

/**
 * @api {post} /user/auth/auto-login
 * @apiName  auto login user
 * @apiGroup  PRIVATE
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.post('/auto-login', async (req, res) => {
  res.json(await mainCtrl.autoLogin(req.body));
});

/**
 * @api {put} /user/auth/update-profile
 * @apiName  update the user profile
 * @apiGroup  PRIVATE
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put('/update-profile', auth, async (req, res) => {
  let newData = {
    name: req.body.name,
    modifiedAt: Date.now(),
  };

  if (req.files && req.files['avatar']) {
    const avatar = await commonHelper.upload(req.files['avatar'], 'upload/avatar');

    //logger.info('avatar => ', avatar);
    if (avatar && avatar.data && avatar.data.length > 0 && avatar.data[0].path) {
      newData.avatar = avatar.data[0].path;
    }
  }
  let condition = { _id: req.body.playerId };
  try {
    let responseData = await commonHelper.update(Users, condition, newData);
    logger.info('responseData => ', responseData);

    if (responseData.status === 1) {
      delete responseData.data.password;
      res.status(config.OK_STATUS).json(responseData);
    } else {
      res.status(config.DATABASE_ERROR_STATUS).json(responseData);
    }
  } catch (error) {
    logger.error('users/auth.js update-profile error => ', error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /user/auth/change-password
 * @apiName  change the password
 * @apiGroup  PRIVATE
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/change-password', async (req, res) => {
  res.json(await mainCtrl.forgotPassword(req.body));
});

module.exports = router;
