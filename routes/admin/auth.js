const express = require('express');
const router = express.Router();
const mainCtrl = require('../../controller/mainController');
const userCtrl = require('../../helper/signups/signupValidation');
const { OK_STATUS, BAD_REQUEST } = require('../../config');
const logger = require('../../logger');
const mongoose = require('mongoose');
const Users = mongoose.model('users');
const paymentin = mongoose.model('paymentin');
const BankDetails = mongoose.model('bankDetails');

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
  console.log("signup-admin :::::::::::::::", req.body)
  res.json(await mainCtrl.registerAdminUpdate(req.body));
});

router.post('/signup-admin-profile-update', async (req, res) => {
  console.log("signup-admin :::::::::::::::", req.body)
  res.json(await mainCtrl.registerAdminProfileUpdate(req.body));
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
    console.log("fwwwwwwwwwffffffffffffffffffffffffffffffff")
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
  console.log("GAMELOGICCONFIG ", GAMELOGICCONFIG.DEPOSIT_BONUS_PER)
  res.send("ok")
});

//=====================New Pay In Payment 
router.post('/api/PayinAPI/newPayInNotify', async (req, res) => {
  logger.info("/api/PayinAPI/newPayInNotify  ->", req)
  // logger.info('::::::::::::: Response BODY ::::::::::::::::> ', req.body);
  // logger.info('::::::::::::: Response PARAMS::::::::::::::::> ', req.params);
  logger.info('::::::::::::: Response PARAMS::::::::::::::::> ', req.query);

  //Find Any reacod here 
  // {
  //   "EmailId": "test@gmail.com",
  //   "adf2": "NA",
  //   "CustRefNum": "4567898765456789098",
  //   "adf1": "NA",
  //   "PaymentDate": "2024-04-02 16:07:22",
  //   "PayAmount": "100.00",
  //   "resp_message": "Transaction Successful.",
  //   "serviceRRN": "9876545678987",
  //   "MOP": "UPI",
  //   "AuthID": "M00001234",
  //   "ContactNo": "1234567890",
  //   "AggRefNo": "10000987654567",
  //   "resp_code": "00000",
  //   "payrespDate": "2024-04-02 16:09:22",
  //   "payStatus": "Ok",
  //   "adf3": "1234567@axl"
  // }

  if (req.query != undefined && req.body.payStatus != undefined) {
    logger.info("res.body. ====>", req.body.OrderId)
    const PaymentIndata = await paymentin.findOneAndUpdate({ "OrderID": req.body.AggRefNo }, { $set: { webhook: req.body } }, {
      new: true,
    });
    logger.info("PaymentIndata ", PaymentIndata)
    if (PaymentIndata && PaymentIndata.userId && req.body.Status == "Success") {

      await walletActions.addWalletPayin(PaymentIndata.userId, Number(req.body.Amount), 'Credit', 'PayIn');


      await walletActions.locktounlockbonus(PaymentIndata.userId, ((Number(req.body.Amount) * 50) / 1000), 'Credit', 'LockBonustoUnlockBonus');


      //GAMELOGICCONFIG.DEPOSIT_BONUS_PER
      if (Number(req.body.Amount) >= 100 && Number(req.body.Amount) <= 50000) {
        const depositbonus = ((Number(req.body.Amount) * 5) / 100)

        await walletActions.addWalletBonusDeposit(PaymentIndata.userId, Number(depositbonus), 'Credit', 'Deposit Bonus');

        // //check reffreal date is validate or not
        // await walletActions.addWalletBonusDeposit(PaymentIndata.userId, Number(depositbonus), 'Credit', 'Reffral Bonus');

      }
    } else {
      logger.info("PaymentIndata ", PaymentIndata)
      logger.info("req.body Faild  ", req.body)
    }
  } else {
    logger.info("req.body ", req.body)
  }
  res.send("ok")
});

router.post('/api/PayinAPI/Payinnotify', async (req, res) => {
  try {
    logger.info(':::::::::::::::::::::::::::::::::::::response request => ', req);
    // logger.info(":::::::::::::::::::::::::::::::::::::response Body => ", req.body)
    // logger.info(':::::::::::::::::::::::::::::::::::::response params => ', req.params);
    logger.info(':::::::::::::::::::::::::::::::::::::response query => ', req.query);

    // query: {
    //   AuthID: 'M00006500',
    //     respData: 'wzYceJ1DRMkQy2t9lX pQyPqmMrsezMlnkO9NFZWu/xQzfTTWCF9WImLXXjyJn1TQ0LXE3GbYUTI67gQqGrGj00153Z43fN8mbelZVs2w17MLBIwkFAcIFlnCe31Mfk0SmeNv8KI0w4BO2bpE3OKfUDckD4VRq0HYFFBUagMonObe/jY/z7ZE axGQto1ATWpqeQj MeFaPExneAUz3DY4t3LCzZzNkK ZDKygDURc9W6om eegkwzjMsgIDfcGBPnTx6Mes7 DFFixrjouKL8A8A kmbIVprXlqsv6ciMy3IbOkT0Sv0nWYDCH4ccUP4ayoGNBF2GIlIFP1aDFz16TJGMo xR7DhCkUklwi4C2SAPq5v7wtxHHMGsPAXJJQ8HH6MlZjCU8rrVUqeIL0px0XdaFliUlWHWRLyTbC1ThSV2M0GqYweI9ujyYMl2ZWef5596SIVRTC1mhgdRHxpmwS71v6JwyZI1xVoghS3pZngDo9CsEGW5gi mI9QYtgoOD5fZHs/QuiHI3qS0G4p62pTakkHvHwgEahugF5lSc=',
    //       AggRefNo: '1002409411270298546'
    // },

    const data = req.query.respData;
    const secretKey = 'WW0DN9DY8ji8mE0sx9Zf4Lg1sp9xY9wF';
    const initializationVector = 'WW0DN9DY8ji8mE0s';

    const decryptedData = decrypt(receivedEncryptedData, secretKey, initializationVector);
    logger.info("decryptedData   ==> API", decryptedData)


    //Find Any reacod here 
    // if there 

    if (req.body != undefined && req.body.Status != undefined) {
      console.log("res.body. ", req.body.OrderId)
      const PaymentIndata = await paymentin.findOneAndUpdate({ "OrderID": req.body.OrderId }, { $set: { webhook: req.body } }, {
        new: true,
      });
      console.log("PaymentIndata ", PaymentIndata)
      if (PaymentIndata && PaymentIndata.userId && req.body.Status == "Success") {

        await walletActions.addWalletPayin(PaymentIndata.userId, Number(req.body.Amount), 'Credit', 'PayIn');


        await walletActions.locktounlockbonus(PaymentIndata.userId, ((Number(req.body.Amount) * 50) / 1000), 'Credit', 'LockBonustoUnlockBonus');


        //GAMELOGICCONFIG.DEPOSIT_BONUS_PER
        if (Number(req.body.Amount) >= 100 && Number(req.body.Amount) <= 50000) {
          const depositbonus = ((Number(req.body.Amount) * 5) / 100)

          await walletActions.addWalletBonusDeposit(PaymentIndata.userId, Number(depositbonus), 'Credit', 'Deposit Bonus');

          // //check reffreal date is validate or not
          // await walletActions.addWalletBonusDeposit(PaymentIndata.userId, Number(depositbonus), 'Credit', 'Reffral Bonus');

        }
      } else {
        logger.info("PaymentIndata ", PaymentIndata)
        logger.info("req.body Faild  ", req.body)
      }
    } else {
      logger.info("req.body ", req.body)
    }
    res.send("check API ok")
  } catch (error) {
    res.send("check API ok / try catch error")
  }
});


router.post('/api/PayoutAPI/Payoutnotify', async (req, res) => {
  console.log("sdddddddddddddddddddddd", req.body)
  logger.info(':::::::::::::::::::::::::::::::::::::responce => ', req.body);

  if (req.body != undefined && req.body.StatusCode != undefined) {
    if (req.body.Data.Amount == 1) {
      let paymentdata = await paymentout.findOne({ "OrderID": req.body.Data.TransactionId.toString() }).lean();
      logger.info("Bankpaymentdata ->", paymentdata);

      // Update 
      const bankDetailsData = await BankDetails.findOneAndUpdate({ userId: paymentdata.userId }, { $set: { verfiy: true } }, {
        new: true,
      });
      logger.info("Bank Details Data ->", bankDetailsData);

    }

    console.log("res.body. ", req.body.Data.ClientOrderId)
    const PaymentOutdata = await paymentout.findOneAndUpdate({ "OrderID": req.body.Data.TransactionId.toString() }, { $set: { webhook: req.body } }, {
      new: true,
    });
    console.log("PaymentOutdata ", PaymentOutdata)
    if (PaymentOutdata && PaymentOutdata.userId && req.body.StatusCode == 1 && req.body.Data.Amount != 1) {

      await walletActions.deductWalletPayOut(PaymentOutdata.userId, -Number(req.body.Data.Amount), 'Debit', 'PayOut');
    } else {
      console.log("PaymentOutdata ", PaymentOutdata)
      console.log("req.body Faild  ", req.body)
    }
  } else {
    console.log("req.body ", req.body)
    // 1 rs 
  }

  res.send("ok")
});

//===========================================================

//=========================== Player Upload 

/**
* @api {post} /admin/AddUser
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.post('/BotAdd', async (req, res) => {
  try {

    console.log("req ", req.body)
    //currently send rendom number and generate 
    let number = await createPhoneNumber()
    let response = {
      mobileNumber: Number(number),
      deviceId: `${number}`,
      isVIP: 0,
      country: req.body.country,
      username: req.body.name,
      isBot: true,
      avatar: req.body.profileUrl,
      status: req.body.status,
      loginType: "Guest",
      name: req.body.name,
      chips: 150000,
      winningChips: 0

    }


    console.log("response ", response)
    // let RecentUser = await registerUser(response)
    //let RecentUser = await registerUser(response)

    const user = new Users(response);
    const RecentUser = await user.save();

    logger.info('admBotAdd  error => ', RecentUser);
    if (RecentUser.username != undefined) {
      res.json({ status: 1, message: "" });
    } else {
      res.status(config.INTERNAL_SERVER_ERROR).json({ status: 1, message: "Data Proper Enter..!!" });
    }
  } catch (error) {
    logger.error('admin/dahboard.js post bet-list error => ', error);
    //res.send("error");

    res.status(config.INTERNAL_SERVER_ERROR).json({ status: 1, message: "Data Proper Enter..!!" });
  }
});


/**
* @api {post} /admin/AddUser
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/

var multer = require('multer');
const bankDetails = require('../../models/bankDetails');
const { tryEach } = require('async');
var storage1 = multer.diskStorage({
  destination: function (req, file, cb) {

    cb(null, 'public/upload/AdharCard')
  },
  filename: function (req, file, cb) {

    cb(null, Date.now() + '.jpg') //Appending .jpg
  }
});
var upload = multer({ storage: storage1 })

router.post('/AdharcardUpload', upload.single('image'), async (req, res) => {
  try {

    console.log("(req.file ::::::::::::::::", req.file)


    if (req.file != undefined && req.file.path != undefined && req.file.path != '' && req.file.path != null) {

      res.json({ flag: true, path: req.file.path.substr(7) });
    } else {
      res.json({ flag: false, path: "" });
    }

    logger.info('admin/dahboard.js post dahboard  inf o::: => ');

  } catch (error) {
    logger.error('admin/dahboard.js post bet-list error => ', error);
    //res.send("error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});


var storage2 = multer.diskStorage({
  destination: function (req, file, cb) {

    cb(null, 'public/upload/PanCard')
  },
  filename: function (req, file, cb) {

    cb(null, Date.now() + '.jpg') //Appending .jpg
  }
});
var upload = multer({ storage: storage2 })

router.post('/PancardUpload', upload.single('image'), async (req, res) => {
  try {

    console.log("(req.file ::::::::::::::::", req.file)


    if (req.file != undefined && req.file.path != undefined && req.file.path != '' && req.file.path != null) {

      res.json({ flag: true, path: req.file.path.substr(7) });
    } else {
      res.json({ flag: false, path: "" });
    }

    logger.info('admin/dahboard.js post dahboard  inf o::: => ');

  } catch (error) {
    logger.error('admin/dahboard.js post bet-list error => ', error);
    //res.send("error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});




module.exports = router;
