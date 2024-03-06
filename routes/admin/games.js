const mongoose = require('mongoose');
const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();

const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../logger');
const config = require('../../config');
const GameHistory = mongoose.model("tableHistory");
const fs = require("fs")

/**
* @api {get} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/rummygamehistory', async (req, res) => {
    try {
        console.log('requet => ', req);

        let gameHistoryData = await GameHistory.find({  },
            { gameId:1,gamePlayType:1,maxSeat:1,tableAmount:1,date:1,playerInfo:1,entryFee:1}).sort({ date: -1 })
            
      

            console.log("completeWithdrawalData ", gameHistoryData)

        res.json({ gameHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/aviatorGameHistory', async (req, res) => {
    try {

        const gameHistoryData = await GameHistory.find({ "game": "aviator" },
            { DateTime: 1, userId: 1, Name: 1, PhoneNumber: 1, RoomId: 1, Amount: 1, Type: 1, game: 1 }).sort({ DateTime: -1 })

        console.log("completeWithdrawalData ", gameHistoryData)

        res.json({ gameHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
* @api {get} /admin/lobbies
* @apiName  gameLogicSet
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/gameLogicSet', async (req, res) => {
    try {
        console.info('requet => ', req.body);
        // console.log("req.body.gamelogic", CONST.AVIATORLOGIC)

        console.log("dddddddddddddddddddd 1", process.env.AVIATORLOGIC)

        console.log("req.body.game.gamename  1", req.body.game.gameName )

        if (req.body.game.gameName == "aviator") {
            GAMELOGICCONFIG.AVIATORLOGIC = req.body.gamelogic

            console.log("GAMELOGICCONFIG ", GAMELOGICCONFIG)

            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });

        } else if (req.body.game.gameName == "balckandwhite") {
            GAMELOGICCONFIG.BLACKANDWHITE = req.body.gamelogic


            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });

        }


        res.json({ falgs: true });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/lobbies
* @apiName  gameLogicSet
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/getgamelogic', async (req, res) => {
    try {
        console.info('requet => ', req.query);
        // console.log("req.body.gamelogic", CONST.AVIATORLOGIC)

        console.log("dddddddddddddddddddd 1", process.env.AVIATORLOGIC)

        console.log("req.query.gameName", req.query.gamename )

        if (req.query.gamename == "aviator") {
          
            res.json({ logic: GAMELOGICCONFIG.AVIATORLOGIC });

        } else if (req.query.gamename == "balckandwhite") {
            

            res.json({ logic: GAMELOGICCONFIG.BLACKANDWHITE });

        }else{
            res.json({ logic: "" });
        }


        
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});




/**
* @api {get} /admin/lobbies
* @apiName  gameLogicSet
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/GetWelComeBonus', async (req, res) => {
    try {
        console.info('requet => ', req.query);
        console.info('GAMELOGICCONFIG => ', GAMELOGICCONFIG);

        
        res.json({ welcomebonus: GAMELOGICCONFIG.welcomebonus,welcomebonusamount:GAMELOGICCONFIG.welcomebonusamount});


        
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/lobbies
* @apiName  GetWelComeBonus
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/WelComeBonusset', async (req, res) => {
    try {
        console.info('requet => ', req.body);
    
        console.log("req.body.game.gamename  1", req.body )

        if (req.body.welcomebonus != undefined && req.body.welcomebonusamount != undefined ) {
            GAMELOGICCONFIG.welcomebonus = req.body.welcomebonus
            GAMELOGICCONFIG.welcomebonusamount = parseInt(req.body.welcomebonusamount)

            console.log("GAMELOGICCONFIG ",GAMELOGICCONFIG)
            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });
            res.json({ falgs: true });
        } else{
            res.json({ falgs: false });
        }

       
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
 * 
 * referral (First deposit)
 * 
* @api {get} /admin/lobbies
* @apiName  gameLogicSet
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/GetreferralBonus', async (req, res) => {
    try {
        console.info('requet => ', req.query);
        console.info('GAMELOGICCONFIG => ', GAMELOGICCONFIG);

        
        res.json({ 
            referralbonus: GAMELOGICCONFIG.referralDepositbonus,
            referralbonusrate:GAMELOGICCONFIG.referralDepositbonusrate,
            referralbonusamount:GAMELOGICCONFIG.referralDepositbonusamount});


        
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
 * referral (First deposit)
* @api {get} /admin/lobbies
* @apiName  GetWelComeBonus
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/referralBonusset', async (req, res) => {
    try {
        console.info('requet => ', req.body);
    
        console.log("req.body.game.gamename  1", req.body )

        if (req.body.referralbonus != undefined && req.body.referralbonusrate != undefined && req.body.referralbonusamount != undefined ) {
            GAMELOGICCONFIG.referralDepositbonus = req.body.referralbonus
            GAMELOGICCONFIG.referralDepositbonusrate = parseFloat(req.body.referralbonusrate)
            GAMELOGICCONFIG.referralDepositbonusamount = parseInt(req.body.referralbonusamount)


            console.log("GAMELOGICCONFIG ",GAMELOGICCONFIG)
            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });
            res.json({ falgs: true });
        } else{
            res.json({ falgs: false });
        }

       
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
 * 
 * referral (First deposit)
 * 
* @api {get} /admin/lobbies
* @apiName  gameLogicSet
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/GetreferralgameBonus', async (req, res) => {
    try {
        console.info('requet => ', req.query);
        console.info('GAMELOGICCONFIG => ', GAMELOGICCONFIG);

        
        res.json({ 
            referralgamebonus: GAMELOGICCONFIG.referralgamebonus,
            referralgamebonusrate:GAMELOGICCONFIG.referralgamebonusrate,
            referralgamebonusamount:GAMELOGICCONFIG.referralgamebonusamount,
            platformfee:GAMELOGICCONFIG.platformfee
        });


        
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
 * referral (First deposit)
* @api {get} /admin/lobbies
* @apiName  GetWelComeBonus
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/referralgameBonusset', async (req, res) => {
    try {
        console.info('requet => ', req.body);
    
        console.log("req.body.game.gamename  1", req.body )

        if (req.body.referralgamebonus != undefined && req.body.referralgamebonusrate != undefined && req.body.referralgamebonusamount != undefined &&  req.body.platformfee != undefined) {
            GAMELOGICCONFIG.referralgamebonus = req.body.referralgamebonus
            GAMELOGICCONFIG.referralgamebonusrate = req.body.referralgamebonusrate
            GAMELOGICCONFIG.referralgamebonusamount = parseInt(req.body.referralgamebonusamount)
            GAMELOGICCONFIG.platformfee = req.body.platformfee



            console.log("GAMELOGICCONFIG ",GAMELOGICCONFIG)
            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });
            res.json({ falgs: true });
        } else{
            res.json({ falgs: false });
        }

       
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

module.exports = router;