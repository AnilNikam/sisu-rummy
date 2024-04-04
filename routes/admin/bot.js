const mongoose = require('mongoose');
const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();
const config = require('../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../logger');
const { registerUser, getRegisterUserDetails } = require('../../helper/signups/signupValidation');
const fs = require("fs")

/**
* @api {post} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/BotList', async (req, res) => {
    try {
        const userList = await Users.find({ isBot: true }, { username: 1, id: 1, mobileNumber: 1, avatar: 1, "counters.totalMatch": 1, isVIP: 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })
        logger.info('admin/BotList => ', userList);
        res.json({ userList });
    } catch (error) {
        logger.error('BotList  error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {post} /admin/UserData
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/BotData', async (req, res) => {
    try {
        const userInfo = await Users.findOne({ _id: new mongoose.Types.ObjectId(req.query.userId) }, { username: 1, id: 1, loginType: 1, avatar: 1, mobileNumber: 1, email: 1, uniqueId: 1, "counters.totalMatch": 1, deviceType: 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        logger.info('admin/BotData => ', userInfo);

        res.json({ userInfo });
    } catch (error) {
        logger.error('admin/BotData error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
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

        // let RecentUser = await registerUser(response)
        //let RecentUser = await registerUser(response)

        const user = new Users(response);
        const RecentUser = await user.save();

        if (RecentUser.username != undefined) {
            res.json({ status: 1, message: "" });
        } else {
            res.status(config.INTERNAL_SERVER_ERROR).json({ status: 1, message: "Data Proper Enter..!!" });
        }
    } catch (error) {
        logger.error('admin/BotAdd => ', error);
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

var multer = require('multer')
var storage1 = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("req", req.file)
        cb(null, 'public/upload/BotUpload')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.jpg') //Appending .jpg
    }
});
var upload = multer({ storage: storage1 })

router.post('/ProfileUpload', upload.single('image'), async (req, res) => {
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


/**
* @api {post} /admin/AddUser
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/BotUpdate', async (req, res) => {
    try {
        //currently send rendom number and generate 
        let response = {
            $set: {
                country: req.body.country,
                username: req.body.username,
                profileUrl: req.body.profileUrl,
                status: req.body.status
            }
        }

        const userInfo = await Users.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(req.body.userId) }, response, { new: true });
        logger.info('admin/dBotUpdate userInfo=> ', userInfo);

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/BotUpdate error => ', error);
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
router.delete('/BotDelete/:id', async (req, res) => {
    try {
        const RecentUser = await Users.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) })
        logger.info(' => ', RecentUser);

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/BotDelete/:id error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/Getpaymentconfig
* @apiName  Getpaymentconfig
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/Getbotconfig', async (req, res) => {
    try {
        logger.info('Getbotconfig => ', GAMELOGICCONFIG);
        res.json({
            botversion: GAMELOGICCONFIG.BOTVERSION,
            botmode: GAMELOGICCONFIG.BOTMODE,
            botdifficulty: GAMELOGICCONFIG.BOTDIFFICULTY
        });

    } catch (error) {
        logger.error('admin/Getbotconfig error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/lobbies
* @apiName  Botconfigset
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/Botconfigset', async (req, res) => {
    try {
        // logger.info('Botconfigset requet => ', req.body);

        // res.json({
        //     botversion: GAMELOGICCONFIG.BOTVERSION,
        //     botmode: GAMELOGICCONFIG.BOTMODE,
        //     botdifficulty: GAMELOGICCONFIG.BOTDIFFICULTY
        // });


        if (req.body.botversion != undefined
            && req.body.botmode != undefined
            && req.body.botdifficulty != undefined
        ) {
            GAMELOGICCONFIG.BOTVERSION = parseInt(req.body.botversion)
            GAMELOGICCONFIG.BOTMODE = req.body.botmode
            GAMELOGICCONFIG.BOTDIFFICULTY = req.body.botdifficulty

            // logger.info("GAMELOGICCONFIG ", GAMELOGICCONFIG)
            let link = "./gamelogic.json"
            // logger.info("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                // logger.info("erre", err)
                if (err) {
                    // logger.info(err);
                }
            });
            res.json({ falgs: true });
        } else {
            res.json({ falgs: false });
        }

    } catch (error) {
        logger.error('admin/Botconfigset error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



async function createPhoneNumber() {
    const countryCode = "91";
    // Generate a random 9-digit mobile number
    const randomMobileNumber = Math.floor(Math.random() * 9000000000) + 1000000000;
    // Concatenate the country code and the random mobile number
    const indianMobileNumber = countryCode + randomMobileNumber;

    return indianMobileNumber;
}


module.exports = router;