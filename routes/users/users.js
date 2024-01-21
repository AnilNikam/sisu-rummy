const express = require('express');
const router = express.Router();
const mainCtrl = require('../../controller/mainController');

//@type     POST
//@route    /api/auth/profile
//@desc     route for user profile
//@access   PUBLIC

router.post('/profile', async (req, res) => {
  // start
  // 1. i will get device id
  // 2. I will fire query into mongodb
  // 3. i will check if the data exists or not
  // 4. If data exists then I will send success response
  // 5. if data not exists then i will send unsuccessfully response
  // 6. if any server error or database error I will throw database or server related error into response.
  // end

  // start
  // i will fetch username and password from req.body object
  // I will check if username and password exists within my user table
  // I will count number of record or existance of record
  // if record found then I will generate token using jwt
  // I will send Token into API response
  // if not auth user then I will throw unsucceessfull message
  // if any server error or database error I will throw database or server related error into response.
  res.json(await mainCtrl.findProfile(req.body));
});

//@type     PUT
//@route    /api/auth/updatecoin
//@desc     route for updatecoin
//@access   PRIVATE

router.put('/update-coin', async (req, res) => {
  res.json(await mainCtrl.updateCoin(req.body));
});

// @type     Get
//@route    /api/auth/playerDetails
//@desc     route for playerDetails
//@access   PUBLIC

router.post('/player-details', async (req, res) => {
  res.json(await mainCtrl.playerDetails(req.body));
});

//  @type     POST
//@route    /api/auth/leaderboard
//@desc     route for leaderboard
router.get('/leaderboard', async (req, res) => {
  res.json(await mainCtrl.leaderBoard(req.body));
});

//@type     POST
//@route   /user/players/email-send
//@desc     send email otp
//@access   PUBLIC

router.post('/email-send', async (req, res) => {
  res.json(await mainCtrl.emailSend(req.body));
});

//@type     POST
//@route    /user/players/otp-send
//@desc     send email otp
//@access   PUBLIC

router.post('/otp-send', async (req, res) => {
  res.json(await mainCtrl.otpSend(req.body));
});

//@type     POST
//@route    /user/players/inapp-purchase
//@desc     send email otp
//@access   PUBLIC

router.post('/inapp-purchase', async (req, res) => {
  res.json(await mainCtrl.inAppPurchase(req.body));
});

module.exports = router;
