const mongoose = require('mongoose');
const PlayingTable = mongoose.model('playingTable');
const Users = mongoose.model('users');

const express = require('express');
const router = express.Router();
const config = require('../../config');
const logger = require('../../logger');

/**
* @api {get} /admin/delete/DeletePlaying
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/DeletePlaying', async (req, res) => {
    try {
        await Users.updateMany(
            { "isfree": false }, // Filter to match documents where isfree is false
            { $set: { "isfree": true } } // Update to set isfree to true
        );

        await PlayingTable.deleteMany({})

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/DeletePlaying.js  error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


module.exports = router;
