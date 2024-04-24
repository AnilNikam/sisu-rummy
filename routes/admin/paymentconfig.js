const mongoose = require('mongoose');
const Users = mongoose.model('users');
const BankDetails = mongoose.model('bankDetails');

const express = require('express');
const router = express.Router();
const config = require('../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../logger');
const { registerUser } = require('../../helper/signups/signupValidation');
//const walletActions = require("../../aviator/updateWallet");
const { getUserDefaultFields, saveGameUser } = require('../../helper/signups/appStart');
const fs = require("fs")


/**
* @api {get} /admin/Getpaymentconfig
* @apiName  Getpaymentconfig
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/Getappversion', async (req, res) => {
    try {
        console.info('Getappversion => ', req.query);
        console.info('Getappversion => ', GAMELOGICCONFIG);

        res.json({
            "App_Version": GAMELOGICCONFIG.App_Version,
            "ForceUpdate": GAMELOGICCONFIG.ForceUpdate,
            "MaintenanceMode": GAMELOGICCONFIG.MaintenanceMode,
            "DeviceRestriction": GAMELOGICCONFIG.DeviceRestriction,
            "LocationRestriction": GAMELOGICCONFIG.LocationRestriction
        });



    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

/**
* @api {get} /admin/app-version-update
* @apiName  app-version-update
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/app-version-update', async (req, res) => {
    try {
        console.info('app-version-update requet => ', req.body);

        console.log("req.body.game.gamename  1", req.body)

     
        if (req.body.App_Version != undefined && 
            req.body.ForceUpdate != undefined && 
            req.body.MaintenanceMode != undefined && 
            req.body.DeviceRestriction != undefined && 
            req.body.LocationRestriction != undefined
        ) {
            GAMELOGICCONFIG.App_Version = req.body.App_Version.toString()
            GAMELOGICCONFIG.ForceUpdate= req.body.ForceUpdate,
            GAMELOGICCONFIG.MaintenanceMode= req.body.MaintenanceMode,
            GAMELOGICCONFIG.DeviceRestriction= req.body.DeviceRestriction,
            GAMELOGICCONFIG.LocationRestriction= req.body.LocationRestriction

            console.log("GAMELOGICCONFIG ", GAMELOGICCONFIG.App_Version)
            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });
            res.json({ falgs: true });
        } else {
            res.json({ falgs: false });
        }


    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
* @api {get} /admin/Getmatchmaking
* @apiName  Getmatchmaking
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/Getmatchmaking', async (req, res) => {
    try {
        console.info('Getmatchmaking => ', req.query);
        console.info('Getmatchmaking => ', GAMELOGICCONFIG);

        res.json({
            "LocationAlgorithm": GAMELOGICCONFIG.LocationAlgorithm,
            "IPBLOCKAlgorithm": GAMELOGICCONFIG.IPBLOCKAlgorithm,
            "ContactMatchAlgorithm": GAMELOGICCONFIG.ContactMatchAlgorithm,
            "MinimumDistance": GAMELOGICCONFIG.MinimumDistance
        });



    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

/**
* @api {get} /admin/match-making-update
* @apiName  match-making-update
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/match-making-update', async (req, res) => {
    try {
        console.info('app-version-update requet => ', req.body);

        console.log("req.body.game.gamename  1", req.body)
     
        if (req.body.LocationAlgorithm != undefined && 
            req.body.IPBLOCKAlgorithm != undefined && 
            req.body.ContactMatchAlgorithm != undefined && 
            req.body.MinimumDistance != undefined
        ) {
            GAMELOGICCONFIG.LocationAlgorithm = req.body.LocationAlgorithm
            GAMELOGICCONFIG.IPBLOCKAlgorithm= req.body.IPBLOCKAlgorithm,
            GAMELOGICCONFIG.ContactMatchAlgorithm= req.body.ContactMatchAlgorithm,
            GAMELOGICCONFIG.MinimumDistance= req.body.MinimumDistance.toString()

            console.log("GAMELOGICCONFIG ", GAMELOGICCONFIG.LocationAlgorithm)
            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });
            res.json({ falgs: true });
        } else {
            res.json({ falgs: false });
        }


    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
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
router.get('/Getpaymentconfig', async (req, res) => {
    try {
        console.info('requet => ', req.query);
        console.info('GAMELOGICCONFIG => ', GAMELOGICCONFIG);

        res.json({
            payingateway: GAMELOGICCONFIG.payingateway,
            payoutgateway: GAMELOGICCONFIG.payoutgateway,
            depositbonus: GAMELOGICCONFIG.depositbonus,
            depositbonusinr: GAMELOGICCONFIG.depositbonusinr,
            minimumdepositinr: GAMELOGICCONFIG.minimumdepositinr
        });



    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/lobbies
* @apiName  paymentconfigset
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/paymentconfigset', async (req, res) => {
    try {
        console.info('paymentconfigset requet => ', req.body);

        console.log("req.body.game.gamename  1", req.body)

        // payingateway: GAMELOGICCONFIG.payingateway,
        // payoutgateway:GAMELOGICCONFIG.payoutgateway,
        // depositbonus:GAMELOGICCONFIG.depositbonus,
        // depositbonusinr:GAMELOGICCONFIG.depositbonusinr,
        // minimumdepositinr:GAMELOGICCONFIG.minimumdepositinr

        if (req.body.payingateway != undefined
            && req.body.payoutgateway != undefined
            && req.body.depositbonus != undefined
            && req.body.depositbonusinr != undefined
            && req.body.minimumdepositinr != undefined
        ) {
            GAMELOGICCONFIG.payingateway = req.body.payingateway
            GAMELOGICCONFIG.payoutgateway = req.body.payoutgateway
            GAMELOGICCONFIG.depositbonus = parseInt(req.body.depositbonus)
            GAMELOGICCONFIG.depositbonusinr = parseInt(req.body.depositbonusinr)
            GAMELOGICCONFIG.minimumdepositinr = parseInt(req.body.minimumdepositinr)


            console.log("GAMELOGICCONFIG ", GAMELOGICCONFIG)
            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });
            res.json({ falgs: true });
        } else {
            res.json({ falgs: false });
        }


    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/Getwithdrawconfig
* @apiName  Getwithdrawconfig
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/Getwithdrawconfig', async (req, res) => {
    try {
        console.info('requet => ', req.query);
        console.info('GAMELOGICCONFIG => ', GAMELOGICCONFIG);

        res.json({
            autopay: GAMELOGICCONFIG.autopay,
            autopaymaxlimit: GAMELOGICCONFIG.autopaymaxlimit,
            minimumwithdrawalamount: GAMELOGICCONFIG.minimumwithdrawalamount,
            dailywithdrawallimit: GAMELOGICCONFIG.dailywithdrawallimit,
            dailytransactionlimit: GAMELOGICCONFIG.dailytransactionlimit
        });

    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/withdrawconfigset
* @apiName  withdrawconfigset
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/withdrawconfigset', async (req, res) => {
    try {
        console.info('withdrawconfigset requet => ', req.body);

        console.log("req.body.game.gamename  1", req.body)

        // payingateway: GAMELOGICCONFIG.payingateway,
        // payoutgateway:GAMELOGICCONFIG.payoutgateway,
        // depositbonus:GAMELOGICCONFIG.depositbonus,
        // depositbonusinr:GAMELOGICCONFIG.depositbonusinr,
        // minimumdepositinr:GAMELOGICCONFIG.minimumdepositinr

        if (req.body.autopay != undefined
            && req.body.autopaymaxlimit != undefined
            && req.body.minimumwithdrawalamount != undefined
            && req.body.dailywithdrawallimit != undefined
            && req.body.dailytransactionlimit != undefined
        ) {
            GAMELOGICCONFIG.autopay = req.body.autopay
            GAMELOGICCONFIG.autopaymaxlimit = req.body.autopaymaxlimit
            GAMELOGICCONFIG.minimumwithdrawalamount = parseInt(req.body.minimumwithdrawalamount)
            GAMELOGICCONFIG.dailywithdrawallimit = parseInt(req.body.dailywithdrawallimit)
            GAMELOGICCONFIG.dailytransactionlimit = parseInt(req.body.dailytransactionlimit)


            console.log("GAMELOGICCONFIG ", GAMELOGICCONFIG)
            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });
            res.json({ falgs: true });
        } else {
            res.json({ falgs: false });
        }


    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

module.exports = router;