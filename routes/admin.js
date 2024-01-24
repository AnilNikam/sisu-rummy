const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const auth = require('./admin/auth');
const users = require('./admin/users');
const bet = require('./admin/bet');
const dashboard = require('./admin/dashboard');
const gametrack = require('./admin/gametrack');
const report = require('./admin/reports');
const poolbetLists = require('./admin/poolBetList');
const dealbetLists = require('./admin/dealBetList');
const deletePlayingTable = require('./admin/deletePlayingTable');

router.use('/', auth);
router.use('/lobbies', authMiddleware, bet);
router.use('/pool-lobbies', authMiddleware, poolbetLists);
router.use('/deal-lobbies', authMiddleware, dealbetLists);
router.use('/users', authMiddleware, users);
router.use('/dashboard', authMiddleware, dashboard);
router.use('/gametrack', authMiddleware, gametrack);
router.use('/report', authMiddleware, report);
router.use('/delete', deletePlayingTable);

module.exports = router;
