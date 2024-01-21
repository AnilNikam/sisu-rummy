const mongoose = require('mongoose');
const Friends = mongoose.model('friends');
const Users = mongoose.model('users');
const commonHelper = require('./commonHelper');
const constants = require('../constant');
const logger = require('../logger');
const friendHelper = {};

/*
 * get_friends is used to fetch all friends data
 * @return  status 0 - If any internal error occured while fetching friends data, with error
 *          status 1 - If friends data found, with friends object
 *          status 2 - If friends not found, with appropriate message
 */
friendHelper.get_friends = async (userId) => {
  try {
    logger.info('get_friends userId--=> ', userId);
    // console.log('commonHelper.strToMongoDb(userId) =>', commonHelper.strToMongoDb(userId))
    const friends = await Friends.aggregate([
      {
        $match: { userId: commonHelper.strToMongoDb(userId) },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'friendId',
          foreignField: '_id',
          as: 'friends',
        },
      },
      {
        $unwind: '$friends',
      },
      {
        $group: {
          _id: '$userId',
          friends: {
            $push: {
              avatar: '$friends.avatar',
              coins: '$friends.coins',
              name: '$friends.name',
              playerId: '$friends._id',
              status: '$$ROOT.status',
            },
          },
        },
      },
    ]);

    logger.info('get_friends Query data ------>', JSON.stringify(friends));

    if (friends && friends.length > 0) {
      return {
        status: 1,
        message: 'friends found',
        data: friends[0],
      };
    } else {
      return {
        status: 2,
        message: 'No friends available',
      };
    }
  } catch (err) {
    return {
      status: 0,
      message: 'Error occured while finding friends',
      error: err,
    };
  }
};

/*
 * send_friend_request is used to insert friends collection
 * @param   friendObj     JSON object consist of all property that need to insert in collection
 * @return  status  0 - If any error occur in inserting friend, with error
 *          status  1 - If friend inserted, with inserted friend document and appropriate message
 * @developed by "amc"
 */
friendHelper.send_friend_request = async (friendObj) => {
  const { friendId, userId } = friendObj;

  try {
    // const friendsExist = await Friends.countDocuments({ friendId });
    const friendsExist = await Friends.countDocuments({
      userId: friendId,
      friendId: userId,
    });
    // console.info('friend => ', friendsExist);

    if (friendsExist > 0) {
      return {
        message: 'Friend Request already exists',
        status: 0,
      };
    } else {
      const friend = new Friends(friendObj);
      const data = await friend.save();
      return {
        status: 1,
        message: 'friend request sent',
        data,
      };
    }
  } catch (err) {
    return {
      status: 0,
      message: 'Error occured while sending friend request',
      error: err,
    };
  }
};

/*
 * get_filtered_records is used to fetch all filtered data
 * @return  status 0 - If any internal error occured while fetching filtered data, with error
 *          status 1 - If filtered data found, with filtered object
 *          status 2 - If filtered not found, with appropriate message
 */
friendHelper.get_filtered_records = async (filterObj) => {
  const skip = filterObj.pageSize * filterObj.page;
  try {
    const searchedRecordCount = await Friends.aggregate([
      {
        $match: filterObj.columnFilter,
      },
    ]);

    const filteredData = await Friends.aggregate([
      {
        $match: filterObj.columnFilter,
      },
      {
        $sort: filterObj.columnSort,
      },
      {
        $skip: skip,
      },
      {
        $limit: filterObj.pageSize,
      },
    ]);

    if (filteredData) {
      return {
        status: 1,
        message: 'filtered data is found',
        count: searchedRecordCount.length,
        filtered_total_pages: Math.ceil(searchedRecordCount.length / filterObj.pageSize),
        filtered_badge_tasks: filteredData,
      };
    } else {
      return {
        status: 2,
        message: 'No filtered data available',
      };
    }
  } catch (err) {
    return {
      status: 0,
      message: 'Error occured while filtering data',
      error: err,
    };
  }
};

/*
 * count_friends is used to count all friends data
 * @return  status 0 - If any internal error occured while couting friends data, with error
 *          status 1 - If friends data found, with friends object
 *          status 2 - If friends not found, with appropriate message
 */
friendHelper.count_friends = async (id) => {
  try {
    const count = await Friends.find({
      friendId: id,
      status: 1,
    }).count();

    return {
      status: 1,
      message: `Total ${count} pending request `,
      count,
    };
  } catch (err) {
    return {
      status: 0,
      message: 'Error occured while couting friends',
      error: err,
    };
  }
};

/*
 * total_count_friends is used to count all friends data
 * @return  status 0 - If any internal error occured while couting friends data, with error
 *          status 1 - If friends data found, with friends object
 *          status 2 - If friends not found, with appropriate message
 */
friendHelper.total_count_friends = async (condititon) => {
  try {
    const count = await Friends.count(condititon);
    return {
      status: 1,
      message: `Total ${count} approved friends `,
      count,
    };
  } catch (err) {
    return {
      status: 0,
      message: 'Error occured while couting approved friends',
      error: err,
    };
  }
};

/*
 * find is used to fetch all friends data
 * @return  status 0 - If any internal error occured while fetching friends data, with error
 *          status 1 - If friends data found, with friends object
 *          status 2 - If friends not found, with appropriate message
 */
friendHelper.find = async (id) => {
  try {
    const friends = await Users.findOne(id);
    if (friends && friends !== null) {
      return {
        status: 1,
        message: 'friends found',
        friends,
      };
    } else {
      return {
        status: 2,
        message: 'No friends available',
        friends: [],
      };
    }
  } catch (err) {
    return {
      status: 0,
      message: 'Error occured while finding friends',
      error: err,
    };
  }
};

/*
 * checkFriend is used to check friend
 * @return  status 0 - If any internal error occured while checking friend data, with error
 *          status 1 - If checking friend data found, with checking friend object
 *          status 2 - If checking friend not found, with appropriate message
 */
friendHelper.checkFriend = async (id) => {
  try {
    const friends = await Friends.findOne(id);
    if (friends) {
      return {
        status: 1,
        message: 'friends found',
        friends,
      };
    } else {
      return {
        status: 2,
        message: 'No friends available',
        friends: [],
      };
    }
  } catch (err) {
    return {
      status: 0,
      message: 'Error occured while finding friends',
      error: err,
      count: 0,
    };
  }
};

/*
 * friends_leaderboard is used to fetch all friends perticular data
 * @return  status 0 - If any internal error occured while fetching friends data, with error
 *          status 1 - If friends data found, with friends object
 *          status 2 - If friends not found, with appropriate message
 */
friendHelper.friends_leaderboard = async (userId) => {
  try {
    // console.info('data for friend leaderboard=> ', userId);
    // console.log('commonHelper.strToMongoDb(userId) =>', commonHelper.strToMongoDb(userId))
    const friendsQuery = [
      {
        $match: { userId: commonHelper.strToMongoDb(userId) },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'friendId',
          foreignField: '_id',
          as: 'friends',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'myrecord',
        },
      },
      {
        $unwind: '$friends',
      },
      {
        $group: {
          _id: '$userId',
          myrecord: { $first: '$myrecord' },
          friends: {
            $push: {
              avatar: '$friends.avatar',
              coins: '$friends.coins',
              name: '$friends.name',
            },
          },
        },
      },
      {
        $addFields: {
          friends: { $concatArrays: ['$friends', '$myrecord'] },
        },
      },
      {
        $project: { friends: 1 },
      },
      {
        $unwind: '$friends',
      },
      {
        $sort: { 'friends.coins': -1 },
      },
      {
        $group: {
          _id: '$_id',
          friends: {
            $push: {
              avatar: '$friends.avatar',
              coins: '$friends.coins',
              name: '$friends.name',
            },
          },
        },
      },
    ];

    // console.info("Query data ------>", JSON.stringify(friendsQuery));
    const friends = await Friends.aggregate(friendsQuery);

    if (friends && friends.length > 0) {
      return {
        status: 1,
        message: 'friends found',
        data: friends[0],
      };
    } else {
      return {
        status: 2,
        message: 'No friends available',
      };
    }
  } catch (err) {
    return {
      status: 0,
      message: 'Error occured while finding friends',
      error: err,
    };
  }
};

/*
 * approve_friend is used to approve friend
 * @param   id         id of friend that need to be update
 * @param   friendObj     JSON    object consist of all property that need to update
 * @return  status  0 - If any error occur in approving friend request, with error
 *          status  1 - If approving friend request updated successfully, with appropriate message
 *          status  2 - If approving friend request not updated, with appropriate message
 * @developed by "amc"
 */
friendHelper.approveFriend = async (condition, friendObj) => {
  try {
    try {
      const friend = await Friends.findOneAndUpdate(condition, friendObj, {
        new: true,
      });

      if (!friend) {
        return {
          status: 2,
          message: 'Friend request not found',
        };
      } else {
        const friend = new Friends({
          userId: condition.friendId,
          friendId: condition.userId,
          status: constants.FRIENDSHIP.APPROVED,
        });

        const data = await friend.save();

        if (data) {
          return {
            status: 1,
            message: 'Friend request approved',
            friend,
          };
        } else {
          return {
            status: 0,
            message: 'Error occured while friend request approve',
          };
        }
      }
    } catch (err) {
      return {
        status: 0,
        message: 'Error occured while friend request approve',
        error: err,
      };
    }
  } catch (error) {
    logger.info('error in approve friend=> ', error);
  }
};

friendHelper.rejectFriend = async (condition) => {
  try {
    const friends = await Friends.findOne(condition);

    if (friends) {
      // remove self record and op friend record
      await Friends.deleteOne(condition);
      await Friends.deleteOne({ userId: condition.friendId, friendId: condition.userId });
      try {
        if (!friends) {
          return {
            status: 2,
            message: 'Friend request not found',
          };
        } else {
          return {
            status: 1,
            message: 'Friend request Delete',
            // data: friends
          };
        }
      } catch (err) {
        return {
          status: 0,
          message: 'Error occured while friend request approve',
          error: err,
        };
      }
    } else {
      return {
        status: 0,
        message: 'Request not found',
      };
    }
  } catch (error) {
    return {
      status: 0,
      message: 'Friend request Delete',
      friend: error,
    };
  }
};

module.exports = friendHelper;
