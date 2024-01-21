const express = require('express');
const router = express.Router();

const twilio = require('./twilio');

router.use('/twilio', twilio);

module.exports = router;
