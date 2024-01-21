const express = require('express');
const router = express.Router();

const auth = require('./users/auth');
const users = require('./users/users');
const friend = require('./users/friend');

router.use('/players', users);
router.use('/auth', auth);
router.use('/friends', friend);

module.exports = router;
