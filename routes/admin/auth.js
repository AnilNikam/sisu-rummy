const express = require('express');
const router = express.Router();
const mainCtrl = require('../../controller/mainController');
const userCtrl = require('../../helper/signups/signupValidation');
const { OK_STATUS, BAD_REQUEST } = require('../../config');
// const { decrypt } = require('../../controller/paymentController,js');
const logger = require('../../logger');
const crypto = require('crypto');
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
  res.json(await mainCtrl.registerAdminUpdate(req.body));
});

router.post('/signup-admin-profile-update', async (req, res) => {
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
    // res.json(await mainCtrl.adminLogin(req.body));
    const data = await mainCtrl.adminLogin(req.body);
    res.status(OK_STATUS).json(data);
  } catch (err) {
    logger.error('admin/auth.js login error => ', err);
    res.status(BAD_REQUEST).json({ status: 0, message: 'Something went wrong' });
  }
});

router.get('/login1222', async (req, res) => {
  try {
    // res.json(await mainCtrl.adminLogin(req.body));
    const data = await mainCtrl.adminLogin(req.body);
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
  try {
    logger.info('\n::::::::::::::::::::::::::::::::::::: Request Request => ', req);
    logger.info('\n::::::::::::::::::::::::::::::::::::: Request Body => ', req.body);

    if (req.body && req.body.respData) {
      const data = req.body.respData;
      logger.info("modifiedRespData data=>", data)
      const modifiedRespData = data.replace(/ {1}/g, '+').replace(/ {2}/g, '++');
      logger.info("modifiedRespData =>", modifiedRespData)


      const secretKey = 'WW0DN9DY8ji8mE0sx9Zf4Lg1sp9xY9wF';
      const initializationVector = 'WW0DN9DY8ji8mE0s';

      const decryptedData1 = decrypt(modifiedRespData, secretKey, initializationVector);
      logger.info("decryptedData   ==> API", decryptedData1);

      const decryptedData = JSON.parse(decryptedData1);
      logger.info("final Response decryptedData-> ", decryptedData);

      logger.info("decryptedData   OrderID==> API", decryptedData.AggRefNo);

      const PaymentIndata = await paymentin.findOneAndUpdate({ "OrderID": decryptedData.AggRefNo }, { $set: { webhook: req.body } }, {
        new: true,
      });

      logger.info("PaymentIndata ==>", PaymentIndata);

      if (PaymentIndata && PaymentIndata.userId) {
        let res = await walletActions.addWalletPayin(PaymentIndata.userId, Number(PaymentIndata.amount), 'Credit', 'PayIn');
        logger.info("addWalletPayin res ->", res);

        await walletActions.locktounlockbonus(PaymentIndata.userId, ((Number(PaymentIndata.amount) * 50) / 1000), 'Credit', 'LockBonustoUnlockBonus');

        if (Number(req.body.Amount) >= 100 && Number(req.body.Amount) <= 50000) {
          const depositbonus = ((Number(req.body.Amount) * 5) / 100);
          await walletActions.addWalletBonusDeposit(PaymentIndata.userId, Number(depositbonus), 'Credit', 'Deposit Bonus');
        }


        await paymentin.findOneAndUpdate({ "OrderID": decryptedData.AggRefNo }, { $set: { paymentStatus: "Approved" } }, {
          new: true,
        });


      } else {
        logger.info("PaymentIndata ", PaymentIndata);
        logger.info("req.body Failed ", req.body);
      }
    } else {
      logger.info("Invalid request body: ", req.body);
    }

    res.send("ok");
  } catch (error) {
    logger.error("Error processing webhook request: ", error);
    res.status(500).send("Internal Server Error");
  }
});


router.post('/api/PayinAPI/Payinnotify', async (req, res) => {
  try {
    logger.info(':::::::::::::::::::::::::::::::::::::responce => ', req.body);
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
  logger.info("check payout recive data", req.body)
  logger.info(':api/PayoutAPI/Payoutnotify WEBHOOK Response => ', req.body);

  if (req.body != undefined && req.body.StatusCode == 1) {
    if (req.body.Status == 1) {
      let paymentdata = await paymentout.findOne({ "OrderID": req.body.ClientOrderId.toString() }).lean();
      logger.info("Bank payment data ---->", paymentdata);

      // Update 
      const bankDetailsData = await BankDetails.findOneAndUpdate({ userId: paymentdata.userId }, { $set: { verfiy: true } }, {
        new: true,
      });
      logger.info("Bank Details Data ->", bankDetailsData);

      await walletActions.deductWalletPayOut(paymentdata.userId, -Number(req.body.Amount), 'Debit', 'PayOut');


      // logger.info("res.body. ====>", req.body.Data.ClientOrderId)  
      const PaymentOutdata = await paymentout.findOneAndUpdate({ "OrderID": req.body.ClientOrderId.toString() }, { $set: { webhook: req.body, "paymentStatus": "Approved" } }, {
        new: true,
      });
      logger.info("PaymentOutdata ======> check ==>", PaymentOutdata)

      // if (PaymentOutdata /*&& PaymentOutdata.userId && req.body.StatusCode == 1 && req.body.Data.Status == 1*/) {

      //   await walletActions.deductWalletPayOut(PaymentOutdata.userId, -Number(req.body.Data.Amount), 'Debit', 'PayOut');
      // } else {
      //   //check status code 2 then its pending stage
      //   logger.info("PaymentOutdata ", PaymentOutdata)
      // }
    } else {
      logger.info("req.body.Data.Status Else ", req.body.Data.Status)
    }
  } else {
    logger.info(" check  req.body  =>", req.body)
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
// const bankDetails = require('../../models/bankDetails');
// const { tryEach } = require('async');
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

function decrypt(encryptedData, key, iv) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error; // Re-throw for handling in caller
  }
}


module.exports = router;
