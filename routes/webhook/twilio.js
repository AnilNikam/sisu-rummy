const express = require('express');
const router = express.Router();
const logger = require('../../logger');

router.get('/', async (req, res) => {
  try {
    logger.info('twilio webhook req.body', JSON.stringify(req.body));
    res.send('twilio webhook');
  } catch (error) {
    logger.info('error', error);
  }
});

module.exports = router;
