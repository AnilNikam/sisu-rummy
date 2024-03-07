const mongoose = require('mongoose');
const Users = mongoose.model('users');
const BankDeatils = mongoose.model('bankDeatils');

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


module.exports = router;