const express = require('express');
const router = express.Router();
const mainCtrl = require('../../controller/mainController');
const userCtrl = require('../../helper/signups/signupValidation');
const { OK_STATUS, BAD_REQUEST } = require('../../config');
const logger = require('../../logger');
const mongoose = require('mongoose');
const paymentin = mongoose.model('paymentin');

const paymentout = mongoose.model('paymentout');
const walletActions = require('../../helper/common-function/walletTrackTransaction');


/**
 * @api {post} /admin/signup-admin
 * @apiName  register admin
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.post('/signup-admin', async (req, res) => {

  res.json(await mainCtrl.registerAdmin(req.body));
});


router.post('/signup-admin-update', async (req, res) => {
  console.log("signup-admin :::::::::::::::",req.body)
  res.json(await mainCtrl.registerAdminUpdate(req.body));
});


/**
 * @api {post} /admin/user
 * @apiName  register user for bot
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.post('/user-register', async (req, res) => {
  res.json(await userCtrl.registerUser(req.body));
});

/**
 * @api {post} /admin/login
 * @apiName  login for admin
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/login', async (req, res) => {
  try {
    console.log("fffffffffffffffffffffffffffffffff")
    // res.json(await mainCtrl.adminLogin(req.body));
    const data = await mainCtrl.adminLogin(req.body);
     console.log('data => ', data);
    res.status(OK_STATUS).json(data);
  } catch (err) {
    logger.error('admin/auth.js login error => ', err);
    res.status(BAD_REQUEST).json({ status: 0, message: 'Something went wrong' });
  }
});

router.get('/login1222', async (req, res) => {
  try {
    console.log("fffffffffffffffffffffffffffffffff")
    // res.json(await mainCtrl.adminLogin(req.body));
    const data = await mainCtrl.adminLogin(req.body);
     console.log('data => ', data);
    res.status(OK_STATUS).json(data);
  } catch (err) {
    logger.error('admin/auth.js login error => ', err);
    res.status(BAD_REQUEST).json({ status: 0, message: 'Something went wrong' });
  }
});


router.get('/responce', async (req, res) => {
  
  logger.info(':::::::::::::::::::::::::::::::::::::responce => ', req);
  console.log("GAMELOGICCONFIG ",GAMELOGICCONFIG.DEPOSIT_BONUS_PER)
  res.send("ok")
});


router.post('/api/PayinAPI/Payinnotify', async (req, res) => {
  console.log("sdddddddddddddddddddddd",req.body)
  logger.info(':::::::::::::::::::::::::::::::::::::responce => ', req.body);

  //Find Any reacod here 

  // if there 
  
  if(req.body != undefined && req.body.Status != undefined){
    console.log("res.body. ",req.body.OrderId)
      const PaymentIndata = await paymentin.findOneAndUpdate({"OrderID": req.body.OrderId}, {$set:{webhook:req.body}}, {
          new: true,
      }); 
      console.log("PaymentIndata ",PaymentIndata)
      if(PaymentIndata && PaymentIndata.userId && req.body.Status == "Success"){ 
        
        await walletActions.addWalletPayin(PaymentIndata.userId, Number(req.body.Amount), 'Credit', 'PayIn');

        //GAMELOGICCONFIG.DEPOSIT_BONUS_PER
        if(Number(req.body.Amount) >= 100 && Number(req.body.Amount) <= 50000){
          const depositbonus = ((Number(req.body.Amount) * 5)/100)

          await walletActions.addWalletBonusDeposit(PaymentIndata.userId, Number(depositbonus), 'Credit', 'Deposit Bonus');
        }
      }else{
        console.log("PaymentIndata ",PaymentIndata)
        console.log("req.body Faild  ",req.body)
      }
  }else{
    console.log("req.body ",req.body)
  }
  res.send("ok")
});


router.post('/api/PayoutAPI/Payoutnotify', async (req, res) => {
  console.log("sdddddddddddddddddddddd",req.body)
  logger.info(':::::::::::::::::::::::::::::::::::::responce => ', req.body);

  if(req.body != undefined && req.body.StatusCode != undefined){
    console.log("res.body. ",req.body.Data.ClientOrderId)
      const PaymentOutdata = await paymentout.findOneAndUpdate({"OrderID": req.body.Data.TransactionId.toString()}, {$set:{webhook:req.body}}, {
          new: true,
      }); 
      console.log("PaymentOutdata ",PaymentOutdata)
      if(PaymentOutdata && PaymentOutdata.userId && req.body.StatusCode == 1){ 
        
        await walletActions.deductWalletPayOut(PaymentOutdata.userId,-Number(req.body.Data.Amount), 'Debit', 'PayOut');
      }else{
        console.log("PaymentOutdata ",PaymentOutdata)
        console.log("req.body Faild  ",req.body)
      }
  }else{
    console.log("req.body ",req.body)
  }
  
  res.send("ok")
});


module.exports = router;
