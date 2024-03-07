const mongoose = require('mongoose');

const express = require('express');
const router = express.Router();
const config = require('../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../logger');
const statemanagemet = mongoose.model('statemanagemet');


/**
* @api {get} /admin/stateList
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/stateList', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const statelist = await statemanagemet.find({}, {})

        logger.info('admin/dahboard.js stateList stateList  error => ', statelist);

        res.json({ statelist });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});




/**
* @api {get} /admin/statemanagemet
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/statemanagemetput', async (req, res) => {
    try {
        console.info('requet statemanagemetput => ', req.body);
        const { Id, active } = req.body;
        //await Users.find({}, { username: 1, id: 1, mobileNumber: 1, "counters.totalMatch": 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        const updateData = await statemanagemet.updateOne({ _id: new mongoose.Types.ObjectId(Id) },{$set:{active:active}})


        console.log('admin/dahboard.js post dahboard  error => ',updateData);
       
        res.json({ falgs: true });
        
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



module.exports = router;