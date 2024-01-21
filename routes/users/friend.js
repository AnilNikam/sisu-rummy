const express = require('express');
const router = express.Router();
const friendHelper = require('../../helper/friendHelper');
const CONST = require('../../constant');
const logger = require('../../logger');

/**
 * @api {get} /user/friends/get-friends
 * @apiName Get all Friends
 * @apiGroup  User
 * @apiBody {String} playerId Player Id.
 * @apiBody {String} [playerId] Player Id.
 * @apiSuccess (Success 200) {Array} user Array of user document
 * @apiError (Error 4xx) {String} message Validation or error message.
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "firstname": "John",
 *       "lastname": "Doe"
 *     }
 */

router.get('/get-friends', async (req) => {
  try {
    logger.info('req.body.playerId =****=> ', req.body.playerId);
    // const users = new Map();
    // users.set("6123d901e784bf337cb5f7aa", "6123d901e784bf337cb5f7aa");
    // users.set("615b458ee1df2f41a88508cc", "615b458ee1df2f41a88508cc");
    // users.set("615b45a6e1df2f41a88508cf", "615b45a6e1df2f41a88508cf");

    const result = await friendHelper.get_friends(req.body.playerId);
    logger.info('result => ', result);
    if (result.status === 1) {
      result.data.friends.forEach((user) => {
        user.isOnline = false;
        // users.forEach((value, key) => {
        //  if (String(user.playerId) === key) {
        //    user.isOnline = true;
        //  }
        // });
      });
    }
    logger.info('result last => ', JSON.stringify(result, null, 2));
  } catch (error) {
    logger.error('admin/friend.js get-friends error => ', error);
  }
});

/**
 * @api {get} /user/friends/id
 * @apiName Get Perticuler Friend Details
 * @apiGroup  User
 * @apiBody {String} playerId Player Id.
 * @apiSuccess (Success 200) {Array} user Array of user document
 * @apiError (Error 4xx) {String} message Validation or error message.
 * @apiSuccessExample {json} Success-Response:
 */
router.get('/:id', async (req, res) => {
  res.json(await friendHelper.get_friends(req.params.id));
});

/**
 * @api {post} /user/friends/add-friend
 * @apiName Friend Request to add
 * @apiGroup  User
 * @apiBody {String} playerId Player Id.
 * @apiSuccess (Success 200) {Array} user Array of user document
 * @apiError (Error 4xx) {String} message Validation or error message.
 * @apiSuccessExample {json} Success-Response:
 */
router.post('/add-friend', async (req, res) => {
  try {
    const newData = {
      userId: req.body.SPId,
      friendId: req.body.OPId,
      status: CONST.FRIENDSHIP.PENDING,
    };
    res.json(await friendHelper.send_friend_request(newData));
  } catch (error) {
    logger.error('admin/friend.js add-friend error => ', error);
  }
});

/**
 * @api {post} /user/friends/approve-friend
 * @apiName Friend Request to Accept
 * @apiGroup  User
 * @apiBody {String} playerId Player Id.
 * @apiSuccess (Success 200) {Array} user Array of user document
 * @apiError (Error 4xx) {String} message Validation or error message.
 * @apiSuccessExample {json} Success-Response:
 */
router.put('/approve-friend', async (req, res) => {
  try {
    const { OPId, SPId } = req.body;

    const condition = {
      userId: OPId,
      friendId: SPId,
    };

    const newData = {
      status: CONST.FRIENDSHIP.APPROVED,
      modifiedAt: Date.now(),
    };

    const data = await friendHelper.approveFriend(condition, newData);
    res.json(data);
  } catch (error) {
    logger.error('admin/friend.js approve-friend error => ', error);
    // res.json(data);
  }
});

/**
 * @api {post} /user/friends/reject-friend
 * @apiName Friend Request to Accept
 * @apiGroup  User
 * @apiBody {String} playerId Player Id.
 * @apiSuccess (Success 200) {Array} user Array of user document
 * @apiError (Error 4xx) {String} message Validation or error message.
 * @apiSuccessExample {json} Success-Response:
 */
router.put('/reject-friend', async (req, res) => {
  try {
    const { OPId, SPId } = req.body;

    const condition = {
      userId: SPId,
      friendId: OPId,
    };

    const newData = {
      status: CONST.FRIENDSHIP.REJECT,
      modifiedAt: Date.now(),
    };

    const data = await friendHelper.rejectFriend(condition, newData);
    res.json(data);
  } catch (error) {
    logger.error('admin/friend.js reject-friend error => ', error);
    // res.json(data);
  }
});

module.exports = router;
