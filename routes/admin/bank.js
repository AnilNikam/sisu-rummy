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

/**
* @api {post} /admin/Bank
* @apiName  bank
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/BankList', async (req, res) => {
    try {
        //console.info('requet => ', req);
        let wh = {}
        if (req.query != undefined && req.query.status != undefined && req.query.status == "Pending") {
            wh = { paymentStatus: "Pending" }
        } else if (req.query != undefined && req.query.status != undefined && req.query.status == "Approved") {
            wh = { paymentStatus: "Approved" }
        } else {
            wh = { paymentStatus: "Rejected" }
        }

        const bankList = await BankDetails.find(wh, { name: 1, email: 1, reMark: 1, phone: 1, accountNumber: 1, IFSC: 1, createdAt: 1, userId: 1, BeneficiaryName: 1, paymentStatus: 1 })
        logger.info('BankList => ', bankList);

        res.json({ bankList });
    } catch (error) {
        logger.error('admin/BankList error => ', error);
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
router.put('/BankUpdate', async (req, res) => {
    try {
        if (req.body.reMark == null || req.body.paymentStatus == null) {
            res.json({ status: false });
            return false
        }
        //currently send rendom number and generate 
        let response = {
            $set: {
                reMark: req.body.reMark,
                paymentStatus: req.body.paymentStatus
            }
        }
        const userInfo = await BankDetails.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(req.body.Id) }, response, { new: true });
        logger.info('BankUpdate userInfo => ', userInfo);

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/dBankUpdate error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

module.exports = router;