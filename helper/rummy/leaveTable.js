const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const Users = mongoose.model('users');
const PlayingTables = mongoose.model('playingTable');

const roundStartActions = require('./roundStart');
const gameFinishActions = require('./gameFinish');
const logger = require('../../logger');
const CONST = require('../../constant');

const { ifSocketDefine } = require('../helperFunction');
const { pushPlayerScoreToPlayerScoreBoard } = require('../common-function/cardFunction');
const { sendDirectEvent, clearJob, sendEventInTable, AddTime, setDelay } = require('../socketFunctions');
const { getPlayingUserInTable, getPlayingUserInRound, filterBeforeSendSPEvent, getPlayingRealUserInRound } = require('../common-function/manageUserFunction');

module.exports.leaveTable = async (requestInfo, client) => {
  let requestData = requestInfo;
  try {
    requestData = requestData !== null ? requestData : {};

    if (!ifSocketDefine(requestData, client, CONST.LEAVE_TABLE)) {
      return false;
    }

    let wh = {
      _id: MongoID(client.tbid.toString()),
      'playerInfo._id': MongoID(client.uid.toString()),
    };

    let updateUserData = {
      $set: {},
      $inc: {},
    };

    let tb = await PlayingTables.findOne(wh, {});
    logger.info('\n  leavetable -->', tb);
    if (!tb) return false;

    if (typeof client.id !== 'undefined') {
      logger.info('leaveTable client.id : ', client.id);
      client.leave(tb._id.toString());
    }

    let playerLostChips = 0;
    let playerInfoStatus = tb.playerInfo[client.seatIndex];

    if (playerInfoStatus.playerStatus !== CONST.WATCHING && playerInfoStatus.status !== CONST.WATCHING && playerInfoStatus.playerStatus !== '' && playerInfoStatus.playerStatus !== CONST.WAITING) {
      logger.info(' check user status');
      playerLostChips = CONST.PLAYER_SCORE * tb.entryFee;
      updateUserData.$set['playerInfo.$.playerStatus'] = CONST.LEFT;
      updateUserData.$set['playerInfo.$.point'] = CONST.PLAYER_SCORE;
      updateUserData.$set['playerInfo.$.lostChips'] = playerLostChips;
      updateUserData.$inc['playerInfo.$.gameChips'] = -playerLostChips;
      updateUserData.$inc['tableAmount'] = playerLostChips;

      let tableUpdate = await PlayingTables.findOneAndUpdate(wh, updateUserData, {
        new: true,
      });

      playerInfoStatus = tableUpdate.playerInfo[client.seatIndex];
      let playerScoreBoard = await pushPlayerScoreToPlayerScoreBoard(tableUpdate, playerInfoStatus);
      logger.info('Leave Push Player Score Board : ', playerScoreBoard);
    } else {
      logger.info('Not add Leave Push Player Score Board : ');
    }

    let tableDetails = await PlayingTables.findOne(wh, {});
    logger.info('tableDetails =>', tableDetails);

    if (!tableDetails) return false;

    let playerInfo = tableDetails.playerInfo[client.seatIndex];
    const playersCards = playerInfo.cards;

    if (playerInfo.pickedCard !== '') {
      let pickedCard = playerInfo.pickedCard;
      let pickedCardIndex = playersCards.findIndex((card) => card === pickedCard);

      playersCards.splice(pickedCardIndex, 1);
      tableDetails.openDeck.push(pickedCard);
      logger.info('player Drop Cards =>', playersCards);
    }

    let updateData = {
      $set: {
        'playerInfo.$': {},
      },
      $inc: {
        activePlayer: -1,
      },
    };
    //Remove table id fro socket
    delete client.tbid;

    if (tableDetails.activePlayer === 2 && tableDetails.gameState === CONST.ROUND_START_TIMER) {
      let jobId = CONST.GAME_TIME_START + ':' + tableDetails._id.toString();
      clearJob(jobId);
      updateData['$set']['gameState'] = '';
    }

    if (tableDetails.activePlayer === 1) {
      let jobId = 'LEAVE_SINGLE_USER:' + tableDetails._id;
      clearJob(jobId);
    }

    if (tableDetails.gameState === 'RoundStated') {
      //loss counter after leave
      const resultLeave = await gameFinishActions.updateLostCounter(playerInfo._id);
      logger.info('Leave lost counter', resultLeave);

      if (client.seatIndex === tableDetails.currentPlayerTurnIndex) {
        clearJob(tableDetails.jobId);
      }

      if (playerInfo.cards.length === 14 || playerInfo.cards.length === 13) {
        logger.info('Input the user Track');
        if (['PLAYING'].indexOf(playerInfo.playerStatus) !== -1) {
          let userTrack = {
            _id: playerInfo._id,
            username: playerInfo.username,
            seatIndex: playerInfo.seatIndex,
            cards: playerInfo.cards,
            score: CONST.PLAYER_SCORE,
            point: CONST.PLAYER_SCORE,
            gameBet: tb.entryFee,
            playerStatus: 'leaveTable',
            result: playerInfo.playerStatus === CONST.WON ? CONST.WON : CONST.LEFT,
          };
          updateData['$push'] = {
            gameTracks: userTrack,
          };
        }
      }
    }

    //update user chips when they leave
    if (playerInfo.playerStatus !== '') {
      //logger.info(' Update User score When leave');
      let updetUserChips = await gameFinishActions.updateUserScore(client.uid, playerInfo.gameChips);
      logger.info('update leave user chips =>', updetUserChips);
    }

    let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
      new: true,
    });

    if (!tbInfo) return;

    let activePlayerInRound = await getPlayingUserInTable(tbInfo.playerInfo);

    //send available plying player in table
    let response = {
      pi: playerInfo._id,
      score: CONST.PLAYER_SCORE,
      lostChips: playerLostChips ? playerLostChips : 0,
      totalRewardCoins: tbInfo.tableAmount,
      ap: activePlayerInRound.length,
    };

    sendDirectEvent(client.sck.toString(), CONST.LEAVE, response);
    sendEventInTable(tbInfo._id.toString(), CONST.LEAVE, response);

    let userDetails = await Users.findOne({
      _id: MongoID(playerInfo._id.toString()),
    }).lean();

    let finaldata = await filterBeforeSendSPEvent(userDetails);
    logger.info()

    finaldata.msg = requestData.autotimeout == true ? 'User Drop Out for Missed 3 turn' : ""
    sendDirectEvent(client.sck.toString(), CONST.DASHBOARD, finaldata);

    // remove all the bot player when original user leave

    await this.manageOnUserLeave(tbInfo, client);
  } catch (err) {
    logger.error('leaveTable.js leavetable error => ', err);
  }
};

module.exports.manageOnUserLeave = async (tb, client) => {
  try {
    const playerInGame = await getPlayingUserInRound(tb.playerInfo);

    const realPlayerInGame = await getPlayingRealUserInRound(tb.playerInfo);
    logger.info("playerInGame    manageOnUserLeave", playerInGame.length)
    logger.info("realPlayerInGame", realPlayerInGame)

    const list = ['RoundStated', 'CollectBoot', 'CardDealing'];

    if (list.includes(tb.gameState) && tb.currentPlayerTurnIndex === client.seatIndex) {
      if (realPlayerInGame.length == 0) {
        await this.leaveallrobot(tb._id)
      } else if (playerInGame.length >= 2) {
        await roundStartActions.nextUserTurnstart(tb, false);
      } else if (playerInGame.length === 1) {
        let wh = {
          _id: MongoID(tb._id.toString()),
          'playerInfo.isBot': true,
        };

        logger.info("check bot details remove ==>", wh)

        let updateData = {
          $set: {
            'playerInfo.$': {},
          },
          $inc: {
            activePlayer: -1,
          },
        };

        let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
          new: true,
        });
        logger.info("remove robot tbInfo", tbInfo)
        logger.info("Leave remove robot playerInGame[0] ", playerInGame[0])


        if (tbInfo) {

          await Users.updateOne({ _id: MongoID(playerInGame[0]._id.toString()) }, { $set: { "isfree": true } });

          if (tbInfo.activePlayer === 0) {
            let wh = {
              _id: MongoID(tbInfo._id.toString()),
            };
            await PlayingTables.deleteOne(wh);
          }
        } else {
          logger.info("tbInfo not found");
        }
        await roundStartActions.nextUserTurnstart(tb);
      }
    } else if (list.includes(tb.gameState) && tb.currentPlayerTurnIndex !== client.seatIndex) {
      if (realPlayerInGame.length == 0) {
        console.log("realPlayerInGame leaveallrobot")
        this.leaveallrobot(tb._id)
      } else if (playerInGame.length === 1) {
        await gameFinishActions.lastUserWinnerDeclareCall(tb);
      }
    } else if (['', 'GameStartTimer'].indexOf(tb.gameState) !== -1) {
      if (realPlayerInGame.length == 0) {
        console.log("realPlayerInGame leaveallrobot")
        this.leaveallrobot(tb._id)
      } else if (playerInGame.length === 0 && tb.activePlayer === 0) {
        let wh = {
          _id: MongoID(tb._id.toString()),
        };
        await PlayingTables.deleteOne(wh);
      } else if (tb.activePlayer === 0) {
        this.leaveSingleUser(tb._id);
      }
    }
  } catch (e) {
    logger.error('leaveTable.js manageOnUserLeave error : ', e);
  }
};

module.exports.leaveallrobot = async (tbid) => {
  try {
    logger.info("chek all leave robot =>");
    let tbId = tbid;

    const wh1 = {
      _id: MongoID(tbId.toString()),
    };
    logger.info("chek all leave robot wh1=>", wh1);

    const tabInfo = await PlayingTables.findOne(wh1, {}).lean();
    logger.info("chek all leave robot tabInfo=>", tabInfo);

    //if (tabInfo.activePlayer === 1) {
    let playerInfos = tabInfo.playerInfo;
    for (let i = 0; i < playerInfos.length; i++) {
      logger.info("check loop", playerInfos[i]);
      if (typeof playerInfos[i].seatIndex !== 'undefined') {

        let wh = {
          _id: MongoID(tbId.toString()),
          'playerInfo.isBot': true,
        };

        // const res = await PlayingTables.findOne(whr, {}).lean();
        // logger.info("for bot details  ==> res", res)


        // let wh = { _id: MongoID(tb._id).toString(), isBot: true }
        // 'playerInfo._id': MongoID(client.uid.toString()),

        logger.info("check bot details remove ==>", wh)

        let updateData = {
          $set: {
            'playerInfo.$': {},
          },
          $inc: {
            activePlayer: -1,
          },
        };

        let tbInfo1 = await PlayingTables.findOneAndUpdate(wh, updateData, {
          new: true,
        });
        logger.info("remove robot tbInfo1", tbInfo1)


        await Users.updateOne({ _id: MongoID(playerInfos[i]._id.toString()) }, { $set: { "isfree": true } });

        if (tbInfo1.activePlayer === 0) {
          let wh = {
            _id: MongoID(tbInfo1._id.toString()),
          };
          await PlayingTables.deleteOne(wh);
        }

      }
    }
    //}
  } catch (e) {
    logger.error('leaveTable.js leaveallrobot error : ', e);
  }
};

module.exports.leaveSingleUser = async (tbid) => {
  try {
    let tbId = tbid;
    let jobId = 'LEAVE_SINGLE_USER:' + tbid;
    let delay = AddTime(120);
    await setDelay(jobId, new Date(delay));

    const wh1 = {
      _id: MongoID(tbId.toString()),
    };

    const tabInfo = await PlayingTables.findOne(wh1, {}).lean();

    if (tabInfo.activePlayer === 1) {
      let playerInfos = tabInfo.playerInfo;
      for (let i = 0; i < playerInfos.length; i++) {
        if (typeof playerInfos[i].seatIndex !== 'undefined') {
          await this.leaveTable(
            {
              reason: 'singleUserLeave',
            },
            {
              uid: playerInfos[i]._id.toString(),
              tbid: tabInfo._id.toString(),
              seatIndex: playerInfos[i].seatIndex,
              sck: playerInfos[i].sck,
            }
          );
        }
      }
    }
  } catch (e) {
    logger.error('leaveTable.js leaveSingleUser error : ', e);
  }
};

module.exports.playerSwitch = async (requestInfo, client) => {
  try {
    let requestData = requestInfo;
    requestData = requestData !== null ? requestData : {};
    if (!ifSocketDefine(requestData, client, CONST.LEAVE_TABLE)) {
      return false;
    }

    let wh = {
      _id: MongoID(client.tbid.toString()),
      'playerInfo._id': MongoID(client.uid.toString()),
    };

    let updateData = {
      $set: {},
      $inc: {},
    };

    let tb = await PlayingTables.findOne(wh, {});

    if (!tb) return false;

    if (typeof client.id !== 'undefined') {
      logger.info('Switch client.id : ', client.id);
      client.leave(tb._id.toString());
    }

    let playerLostChips = CONST.PLAYER_SCORE * tb.entryFee;

    updateData.$set['playerInfo.$.playerStatus'] = CONST.SWITCH_TABLE;
    updateData.$set['playerInfo.$.point'] = CONST.PLAYER_SCORE;
    updateData.$set['playerInfo.$.lostChips'] = playerLostChips;
    updateData.$inc['playerInfo.$.gameChips'] = -playerLostChips;

    let updetUserChips = await gameFinishActions.updateUserScore(client.id, -playerLostChips);
    logger.info('upate Switch user chips =>', updetUserChips);

    let tableUpdate = await PlayingTables.findOneAndUpdate(wh, updateData, {
      new: true,
    });

    let playerInfo = tableUpdate.playerInfo[client.seatIndex];

    if (playerInfo.playerStatus !== CONST.WATCHING && playerInfo.status !== CONST.WATCHING && playerInfo.playerStatus !== '' && playerInfo.playerStatus !== CONST.WAITING) {
      let playerScoreBoard = await pushPlayerScoreToPlayerScoreBoard(tableUpdate, playerInfo);
      logger.info('Leave Push Player Score Board : ', playerScoreBoard);
    } else {
      logger.info('Not add Leave Push Player Score Board : ');
    }

    updateData = {
      $set: {
        'playerInfo.$': {},
      },
      $inc: {
        activePlayer: -1,
      },
    };

    if (tb.activePlayer === 2 && tb.gameState === CONST.ROUND_START_TIMER) {
      let jobId = CONST.GAME_TIME_START + ':' + tb._id.toString();
      clearJob(jobId);
      updateData['$set']['gameState'] = '';
    }

    if (tb.activePlayer === 1) {
      let jobId = 'LEAVE_SINGLE_USER:' + tb._id;
      clearJob(jobId);
    }

    if (tb.gameState === 'RoundStated') {
      //loss counter after leave
      const resultLeave = await gameFinishActions.updateLostCounter(playerInfo._id);
      logger.info('Switch lost counter', resultLeave);

      if (client.seatIndex === tb.currentPlayerTurnIndex) {
        clearJob(tb.jobId);
      }

      if (playerInfo.cards.length === 14 || playerInfo.cards.length === 13) {
        logger.info('Input the user Track');
        if (['PLAYING'].indexOf(playerInfo.playerStatus) !== -1) {
          let userTrack = {
            _id: playerInfo._id,
            username: playerInfo.username,
            seatIndex: playerInfo.seatIndex,
            cards: playerInfo.cards,
            score: CONST.PLAYER_SCORE,
            point: CONST.PLAYER_SCORE,
            gameBet: tb.entryFee,
            playerStatus: 'SwitchTable',
            result: playerInfo.playerStatus === CONST.WON ? CONST.WON : CONST.SWITCH_TABLE,
          };
          updateData['$push'] = {
            gameTracks: userTrack,
          };
        }
      }
    }

    updateData.$inc['tableAmount'] = CONST.PLAYER_SCORE * tb.entryFee;

    let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
      new: true,
    });

    let activePlayerInRound = await getPlayingUserInTable(tbInfo.playerInfo);
    //logger.info('Invalid Declare active Player In Round :', activePlayerInRound, activePlayerInRound.length);

    //send available plying player in table
    let response = {
      pi: playerInfo._id,
      score: CONST.PLAYER_SCORE,
      lostChips: playerLostChips,
      totalRewardCoins: tbInfo.tableAmount,
      ap: activePlayerInRound.length,
    };

    sendDirectEvent(client.sck.toString(), CONST.SWITCH_TABLE, response);
    sendEventInTable(tbInfo._id.toString(), CONST.SWITCH_TABLE, response);

    await this.manageOnUserLeave(tbInfo, client);
  } catch (err) {
    logger.error('leaveTable.js leavetable error => ', err);
  }
};
