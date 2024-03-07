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
const user = require('./admin/user');

const games = require('./admin/games');
const userhistory = require('./admin/userhistory');
const social = require('./admin/social');
const noticetext = require('./admin/Noticetext');
const gamementenance = require('./admin/gamementenance');
const notification = require('./admin/notification');
const banner = require('./admin/banner');
const bot = require('./admin/bot');
const usertransction = require('./admin/usertransction');
//const upi = require('./admin/upi');
const mail = require('./admin/Mail');
const coin = require('./admin/coin');
const bank = require('./admin/bank');
const state = require('./admin/state');
const paymentconfig = require('./admin/paymentconfig');




router.use('/', auth);
router.use('/lobbies', authMiddleware, bet);
router.use('/pool-lobbies', authMiddleware, poolbetLists);
router.use('/deal-lobbies', authMiddleware, dealbetLists);
router.use('/users', authMiddleware, users);
router.use('/dashboard', authMiddleware, dashboard);
router.use('/gametrack', authMiddleware, gametrack);
router.use('/report', authMiddleware, report);
router.use('/delete', deletePlayingTable);
router.use('/user', user);
router.use('/games', authMiddleware, games);
router.use('/userhistory', authMiddleware, userhistory);
router.use('/social', authMiddleware, social);
router.use('/noticetext', authMiddleware, noticetext);
router.use('/gamementenance', authMiddleware, gamementenance);
router.use('/notification', authMiddleware, notification);
router.use('/banner', authMiddleware, banner);
router.use('/bot', authMiddleware, bot);
router.use('/usertransction', authMiddleware, usertransction);
//router.use('/upi', upi);

router.use('/mail', mail);
router.use('/coin',coin);

router.use('/bank', authMiddleware, bank);
router.use('/state', authMiddleware, state);
router.use('/payment', authMiddleware, paymentconfig);



module.exports = router;
