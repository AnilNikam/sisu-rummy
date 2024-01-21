const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TableHistory = mongoose.model('tableHistory');
const config = require('../../config');
const logger = require('../../logger');
//const commonHelper = require('../../helper/commonHelper');

/**
 * @api {get} /admin/gametrack
 * @apiName  get all history of plying details
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.get('/', async (req, res) => {
  try {
    logger.info(' Request gametrek API =>', req.query);
    let search = req.query.search || '';
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const key = req.query.key;
    const gameType = req.query.gameType;
    const orderBy = parseInt(req.query.orderBy);
    logger.info('\npage', page, '\nlimit', limit);
    const aggregateArray = [];

    if (search) {
      const searchPattern = new RegExp(search, 'i');

      aggregateArray.push({
        $match: { tableId: searchPattern },
      });
    }

    aggregateArray.push(
      { $match: { gamePlayType: gameType } },
      {
        $group: {
          _id: '$tableId',
          gamePlayType: {
            $first: '$gamePlayType',
          },
          entryFee: { $first: '$entryFee' },
          date: { $first: '$date' },
        },
      }
    );

    logger.info('\n Aggrigate Array  =>', JSON.stringify(aggregateArray));

    const gamePlayTrackInfo = await TableHistory.aggregate(aggregateArray);
    logger.info('game Table History gamePlayTrackInfo => ', gamePlayTrackInfo);

    aggregateArray.push(
      {
        $sort: {
          [key]: orderBy,
        },
      },
      {
        $skip: page * limit,
      },
      {
        $limit: limit,
      }
    );
    logger.info('TableHistory aggregateArray => ', JSON.stringify(aggregateArray));
    const gamePlayTrackDetails = await TableHistory.aggregate(aggregateArray);
    //logger.info('game Table History Details => ', gamePlayTrackDetails);

    let counts = gamePlayTrackInfo.length;

    if (gamePlayTrackDetails.length > 0) {
      res.status(config.OK_STATUS).json({
        message: 'Details found',
        status: 1,
        data: gamePlayTrackDetails,
        counts,
        totalPage: Math.ceil(counts / limit),
      });
    } else {
      res.status(config.OK_STATUS).json({ message: ' Details Not found', status: 0 });
    }
  } catch (error) {
    logger.error('gametrack.js gameplay-track error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});

router.get('/:id', async (req, res) => {
  try {
    logger.info('/admin/gametrack/req.params.id --> ', req.params.id);
    //let gamePlayTrack = await TableHistory.findOne({ tableId: commonHelper.strToMongoDb(req.params.id) }).lean();
    //logger.info('gamePlayTrack ==>', gamePlayTrack);

    const gamePlayTrackDetails = await TableHistory.aggregate([
      {
        $match: { tableId: req.params.id },
      },
      {
        $group: {
          _id: '$tableId',
          commission: { $sum: '$commission' },
          date: { $first: '$date' },
          entryFee: { $first: '$entryFee' },
          rounds: {
            $push: {
              gameId: '$gameId',
              commission: '$commission',
              entryFee: '$entryFee',
              gamePlayType: '$gamePlayType',
              activePlayer: '$activePlayer',
              gCard: '$gCard',
              jobId: '$jobId',
              date: '$date',
              gameTracks: '$gameTracks',
              tableAmount: '$tableAmount',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          tableId: '$_id',
          commission: 1,
          date: 1,
          entryFee: 1,
          rounds: 1,
        },
      },
    ]);

    logger.info('/:id game Table History Details => ', JSON.stringify(gamePlayTrackDetails));
    //let counts = gamePlayTrackDetails.length;
    if (gamePlayTrackDetails.length > 0) {
      res.status(config.OK_STATUS).json({
        message: 'Details found',
        status: 1,
        data: gamePlayTrackDetails[0],
      });
    } else {
      res.status(config.OK_STATUS).json({ message: ' Details Not found', status: 0 });
    }
  } catch (error) {
    logger.error('gametrack.js /:id error => ', error);
    res.status(config.OK_STATUS).json({ message: 'something went wrong, please try again', status: 0 });
  }
});


module.exports = router;
