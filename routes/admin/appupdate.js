const express = require('express');
const router = express.Router();
const config = require('../../config');
const logger = require('../../logger');


/**
* @api {get} /admin/app-version-update
* @apiName  Getpaymentconfig
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/app-version-update', async (req, res) => {
    try {
        logger.info('request app-version-update => ', req.body);
        logger.info('\n GAMELOGICCONFIG => ', GAMELOGICCONFIG);

        // Assuming the body parameter is named "App_Version"
        const appVersion = req.body.App_Version;

        if (appVersion) {
            // Update the App_Version property of GAMELOGICCONFIG
            GAMELOGICCONFIG.App_Version = req.body.App_Version;

            res.json({
                App_Version: GAMELOGICCONFIG.App_Version,
            });
        } else {
            // If App_Version parameter is missing in the request, return a 400 Bad Request response
            res.status(400).json({ error: 'App_Version parameter missing in the request' });
        }
    } catch (error) {
        logger.error('app-version-update => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

module.exports = router;