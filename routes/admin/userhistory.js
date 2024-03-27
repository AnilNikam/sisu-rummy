const mongoose = require('mongoose');

const MongoID = mongoose.Types.ObjectId;
const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();
const config = require('../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../logger');
const UserWalletTracks = mongoose.model("walletTrackTransaction");
const GameHistory = mongoose.model("tableHistory");

/**
* @api {get} /admin/rouletteHistory
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/rummyHistory', async (req, res) => {
    try {
        console.info('requet => ', req.query);

        console.info('rummyHistory  => ', req.query);
        if (req.query.userId == undefined) {
            res.json({ BlackandWhiteData: [] });
            return false
        }
        const BlackandWhiteData = await GameHistory.find({ userId: MongoID(req.query.userId), "game": "BlackandWhite" },
            { DateTime: 1, userId: 1, Name: 1, PhoneNumber: 1, RoomId: 1, Amount: 1, Type: 1, game:1 }).sort({ DateTime: -1 })


        console.log("rummyHistory ", BlackandWhiteData)


        res.json({ BlackandWhiteData });

    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});




/**
* @api {get} /admin/rouletteHistory
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/completeWithdrawal', async (req, res) => {
    try {
        console.info('completeWithdrawal  => ', req.query);
        if (req.query.userId == undefined) {
            res.json({ completeWithdrawalData: [] });
            return false
        }
        const completeWithdrawalData = await UserWalletTracks.find({ userId: MongoID(req.query.userId),transTypeText:"PayOut" },
        { createdAt: 1, userId: 1, uniqueId: 1, chips: 1, transAmount: 1, totalBucket: 1, transTypeText: 1 }).sort({ createdAt: -1 })

        console.log("completeWithdrawalData ", completeWithdrawalData)

        logger.info('admin/dahboard.js post dahboard  error => completeWithdrawalData ', completeWithdrawalData);

        res.json({ completeWithdrawalData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/completeDeposite
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/completeDeposite', async (req, res) => {
    try {
        
        if (req.query.userId == undefined) {
            res.json({ completeDepositeData: [] });
            return false
        }

        const completeDepositeData = await UserWalletTracks.find({ userId: MongoID(req.query.userId) , "trnxTypeTxt": "PayIn"},
        { createdAt: 1, userId: 1, uniqueId: 1, chips: 1, transAmount: 1, totalBucket: 1, transTypeText: 1  }).sort({ createdAt: -1 })

        logger.info('admin/dahboard.js post dahboard  error => ', completeDepositeData);

        res.json({ completeDepositeData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/completeDeposite
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/registerRaferralBonus', async (req, res) => {
    try {
        //console.info('requet => ', req);

        if (req.query.userId == undefined) {
            res.json({ registerRaferralBonusData: [] });
            return false
        }

        const registerRaferralBonusData = await UserWalletTracks.find({ userId: MongoID(req.query.userId) , "trnxTypeTxt": "PayIn"},
        { createdAt: 1, userId: 1, uniqueId: 1, chips: 1, transAmount: 1, totalBucket: 1, transTypeText: 1  }).sort({ createdAt: -1 })

        logger.info('admin/dahboard.js post registerRaferralBonusData  error => ', registerRaferralBonusData);

        res.json({ registerRaferralBonusData });

    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/completeDeposite
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/myRaferrals', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const myRaferralsData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "MRRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "MRRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "MRRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];


        logger.info('admin/dahboard.js post dahboard  error => ', myRaferralsData);

        res.json({ myRaferralsData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



module.exports = router;