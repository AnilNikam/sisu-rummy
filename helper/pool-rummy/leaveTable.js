const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const Users = mongoose.model('users');
const PlayingTables = mongoose.model('playingTable');

const logger = require('../../logger');
const CONST = require('../../constant');

const gameFinishActions = require('./gameFinish');
const { nextUserTurnstart } = require('./roundStart'); //import the spesific function
const { pushPlayerScoreToPlayerScoreBoard } = require('../common-function/cardFunction');
const { ifSocketDefine } = require('../helperFunction');
const { sendDirectEvent, clearJob, sendEventInTable, AddTime, setDelay } = require('../socketFunctions');
const { getPlayingUserInTable, getPlayingUserInRound, getWaitingUserInRound, filterBeforeSendSPEvent, getPlayingRealUserInRound } = require('../common-function/manageUserFunction');

module.exports.leaveTable = async (requestInfo, client) => {
  let requestData = requestInfo;
  try {
    logger.info('\n Pool leaveTable requestData : ', requestData);
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
    logger.info(' Check Leave Table =>', tb);

    if (!tb) return false;

    if (typeof client.id !== 'undefined') {
      logger.info('leaveTable client.id : ', client.id);
      client.leave(tb._id.toString());
    }

    let playerInfoStatus = tb.playerInfo[client.seatIndex];

    if (playerInfoStatus.playerStatus !== CONST.WATCHING && playerInfoStatus.status !== CONST.WATCHING && playerInfoStatus.status !== '' && playerInfoStatus.playerStatus !== CONST.WAITING) {
      logger.info('\nPool playerInfoStatus.playerStatus =>', playerInfoStatus.playerStatus);

      updateUserData.$set['playerInfo.$.playerStatus'] = CONST.LEFT;
      updateUserData.$set['playerInfo.$.lostChips'] = tb.entryFee;
      updateUserData.$set['playerInfo.$.point'] = CONST.PLAYER_SCORE;
      updateUserData.$inc['playerInfo.$.gameChips'] = CONST.PLAYER_SCORE;

      let tableUpdate = await PlayingTables.findOneAndUpdate(wh, updateUserData, {
        new: true,
      });
      logger.info('Pool AFter update player status', JSON.stringify(tableUpdate));

      playerInfoStatus = tableUpdate.playerInfo[client.seatIndex];
      let playerScoreBoard = await pushPlayerScoreToPlayerScoreBoard(tb, playerInfoStatus);
      logger.info('Leave Push Player Score Board : ', playerScoreBoard);

      //let updetUserChips = await gameFinishActions.updateUserScore(client.uid, playerInfoStatus.gameChips);
      //logger.info('upate leave user chips =>', updetUserChips);
    } else {
      logger.info('Not add Leave Push Player Score Board : ');
    }

    let tableDetails = await PlayingTables.findOne(wh, {});
    logger.info('Table Details after calculations -->', tableDetails);

    if (!tableDetails) return false;

    let playerInfo = tableDetails.playerInfo[client.seatIndex];
    const playersCards = playerInfo.cards;

    if (playerInfo.pickedCard !== '') {
      let pickedCard = playerInfo.pickedCard;
      logger.info('player Drop picked Card => ', pickedCard);
      let pickedCardIndex = playersCards.findIndex((card) => card === pickedCard);
      logger.info('player Drop pickedCard Index => ', pickedCardIndex);

      playersCards.splice(pickedCardIndex, 1);
      logger.info('player Drop playerInfo ::--> ', tb.openDeck);
      tb.openDeck.push(pickedCard);

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
    updateData['$set']['playerStatus'] = CONST.LEAVE;
    //Remove table id fro socket
    delete client.tbid;

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

      logger.info('Leave lost counter', resultLeave);

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
            playerStatus: 'leaveTable',
            result: playerInfo.playerStatus === CONST.WON ? CONST.WON : CONST.LEFT,
          };

          updateData['$push'] = {
            gameTracks: userTrack,
          };
        }
      }
    }

    // logger.info("leaveTable updateData : ", wh, updateData);
    let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
      new: true,
    });

    let activePlayerInRound = await getPlayingUserInTable(tbInfo.playerInfo);
    logger.info('Active Player In Round :', activePlayerInRound, activePlayerInRound.length);

    //send available plying player in table
    let response = {
      pi: playerInfo._id,
      score: tbInfo.entryFee,
      lostChips: tbInfo.entryFee,
      totalRewardCoins: tbInfo.tableAmount,
      ap: activePlayerInRound.length,
      // seatIndex: client.seatIndex
    };
    logger.info('pool Respons when user leave', response);
    logger.info('pool Leave Client Socket Id =>', client.sck);

    sendDirectEvent(client.sck.toString(), CONST.LEAVE, response);
    sendEventInTable(tbInfo._id.toString(), CONST.LEAVE, response);

    let userDetails = await Users.findOne({
      _id: MongoID(playerInfo._id.toString()),
    }).lean();

    let finaldata = await filterBeforeSendSPEvent(userDetails);

    finaldata.msg = requestData.autotimeout == true ? 'User Drop Out for Missed 3 turn' : ""
    sendDirectEvent(client.sck.toString(), CONST.DASHBOARD, finaldata);

    await this.manageOnUserLeave(tbInfo, client);
  } catch (err) {
    logger.error('leaveTable.js leavetable error => ', err);
  }
};

module.exports.manageOnUserLeave = async (tb, client) => {
  try {
    const playerInGame = await getPlayingUserInRound(tb.playerInfo);
    logger.info('<== manage On UserLeave playerInGame : ==> ', playerInGame);

    const realPlayerInGame = await getPlayingRealUserInRound(tb.playerInfo);
    const list = ['RoundStated', 'CollectBoot', 'CardDealing'];

    if (list.includes(tb.gameState) && tb.currentPlayerTurnIndex === client.seatIndex) {
      if (realPlayerInGame.length == 0) {
        this.leaveallrobot(tb._id)
      } else if (playerInGame.length >= 2) {
        await nextUserTurnstart(tb);
      } else if (playerInGame.length === 1) {
        let wh = {
          _id: MongoID(tb._id.toString()),
          'playerInfo.isBot': true,
        };

        logger.info("Pool check bot details remove ==>", wh)

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
        logger.info("Pool remove robot tbInfo", tbInfo)
        logger.info("Pool Leave remove robot playerInGame[0] ", playerInGame[0])


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

        await nextUserTurnstart(tb);
      }
    } else if (list.includes(tb.gameState) && tb.currentPlayerTurnIndex !== client.seatIndex) {
      if (realPlayerInGame.length == 0) {
        this.leaveallrobot(tb._id)
      } else if (playerInGame.length === 1) {
        await gameFinishActions.lastUserWinnerDeclareCall(tb);
      }
    } else if (['', 'GameStartTimer'].indexOf(tb.gameState) !== -1) {
      if (playerInGame.length === 0 && tb.activePlayer === 0) {
        let wh = {
          _id: MongoID(tb._id.toString()),
        };
        await PlayingTables.deleteOne(wh);
      } else if (tb.activePlayer === 0) {
        this.leaveSingleUser(tb._id);
      } else if (tb.activePlayer === 1) {
        logger.info('check the waiting winner player');
        const playerDetail = await getWaitingUserInRound(tb.playerInfo);
        logger.info('<== manage On UserLeave playerDetail : ==> ', playerDetail);
        if (playerDetail.length === 1) {
          await gameFinishActions.waitingWinnerDeclareCall(tb, playerDetail[0].seatIndex);
        }
      }
    }
  } catch (e) {
    logger.error('leaveTable.js manageOnUserLeave error : ', e);
  }
};

module.exports.leaveSingleUser = async (tbid) => {
  try {
    //console.log('leaveSingleUser call tbid : ', tbid);
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
              reason: 'single_user_leave',
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
    logger.info('\n playerSwitch requestData : ', requestData);
    logger.info('\n playerSwitch requestData Table Id: ', client.tbid);

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

    logger.info('Pool AFter update player status', JSON.stringify(tableUpdate));
    let playerInfo = tableUpdate.playerInfo[client.seatIndex];

    if (playerInfo.playerStatus !== CONST.WATCHING && playerInfo.status !== CONST.WATCHING && playerInfo.status !== '' && playerInfo.playerStatus !== CONST.WAITING) {
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

      logger.info('Leave lost counter', resultLeave);

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
    logger.info('Invalid Declare active Player In Round :', activePlayerInRound, activePlayerInRound.length);

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

module.exports.leaveallrobot = async (tbid) => {
  try {
    logger.info("pool chek all leave robot =>");
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
  } catch (e) {
    logger.error('leaveTable.js leaveSingleUser error : ', e);
  }
};