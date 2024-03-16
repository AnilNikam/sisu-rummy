const mongoose = require('mongoose');
const PlayingTables = mongoose.model('playingTable');
const Users = mongoose.model('users');
const MongoID = mongoose.Types.ObjectId;

const logger = require('../../logger');
const CONST = require('../../constant');
const commandAcions = require('../socketFunctions');
const gameStartActions = require('./gameStart');
const { getPlayingUserInTable, getPlayingUserInRound, filterBeforeSendSPEvent } = require('../common-function/manageUserFunction');

module.exports.roundFinish = async (tb) => {
  try {
    tb.playerInfo.forEach(async (player) => {
      player.playerStatus = CONST.WAITING;

      let uWh1 = {
        _id: MongoID(tb._id.toString()),
        'playerInfo.seatIndex': Number(player.seatIndex),
      };

      let dataUpdate = {
        $set: {
          'playerInfo.$.playerStatus': CONST.WAITING,
          'playerInfo.$.status': CONST.WAITING,
          'playerInfo.$.finished': false,
          'playerInfo.$.gameChips': 0,
          'playerInfo.$.point': 0,
          'playerInfo.$.currentGamePoint': 0,
        },
      };

      // logger.info(" === > State update  <== ", uWh1, dataUpdate)
      const restartTable = await PlayingTables.findOneAndUpdate(uWh1, dataUpdate, { new: true });
      logger.info(' === >Round Finish State update when game restart <== ', restartTable);

      let wh = {
        _id: MongoID(tb._id.toString()),
        'playerInfo._id': MongoID(player._id.toString()),
      };

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

      let response = {
        pi: player._id,
        score: tbInfo.entryFee,
        lostChips: tbInfo.entryFee,
        totalRewardCoins: tbInfo.tableAmount,
        ap: tbInfo.activePlayer,
      };

      commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.LEAVE, response);

      let userDetails = await Users.findOne({
        _id: MongoID(player._id.toString()),
      }).lean();

      let finaldata = await filterBeforeSendSPEvent(userDetails);

      commandAcions.sendDirectEvent(player.sck.toString(), CONST.DASHBOARD, finaldata);

      let whr = {
        _id: MongoID(tbInfo._id.toString()),
      };
      await PlayingTables.deleteOne(whr);
    });

    return true;
  } catch (err) {
    logger.error('roundEnd.js roundFinish error => ', err);
  }
};

module.exports.resetTable = async (tb) => {
  try {
    logger.info(' Tb --> Reset Table =>', tb);

    let table = await PlayingTables.findOne({
      _id: MongoID(tb._id.toString()),
    }).lean();

    const list = [CONST.WON, CONST.LOST, CONST.LEAVE, CONST.PLAYING, CONST.INVALID_DECLARE, CONST.DROPPED];
    let expledPlayer = [];

    let result = await this.checkExepledUser(table);
    logger.info('<----- Find result ------>', result);

    let countOfPlayer = await this.checkGameUser(table);

    let tableDetails = await PlayingTables.findOne({
      _id: MongoID(table._id.toString()),
    }).lean();

    //logger.info('after check reAssign point =>', tableDetails);

    const playerInGameDetails = await getPlayingUserInTable(tableDetails.playerInfo);
    //logger.info('Reset Table Get Winner Player In Game ------>', playerInGameDetails);

    playerInGameDetails.forEach(async (player) => {
      let tbInfo;
      logger.info('\n player.playerStatus   ----   ---  >', player.playerStatus);
      if (list.includes(player.playerStatus) && player.playerStatus !== CONST.EXPELED) {
        let uWh1 = {
          _id: MongoID(tb._id.toString()),
          'playerInfo.seatIndex': Number(player.seatIndex),
        };

        let dataUpdate = {
          $set: {
            'playerInfo.$.finished': false,
            'playerInfo.$.currentGamePoint': 0,
            //'playerInfo.$.point': 0,
          },
        };

        tbInfo = await PlayingTables.findOneAndUpdate(uWh1, dataUpdate, { new: true });
        //logger.info(' === > resetTable State update when game restart <== ', tbInfo);
      } else if (player.playerStatus === CONST.EXPELED) {
        logger.info('<= Player Expeled =>');
        expledPlayer.push(player.playerId);

        if (countOfPlayer >= 2 && player.chips > tableDetails.gameType) {
          logger.info(' Send Rejoin Table player Expeled');
          commandAcions.sendDirectEvent(player.sck.toString(), CONST.RE_JOIN, { pi: player._id, amount: tableDetails.reAssignPoint });

          let jobId = CONST.EXPELED + ':' + tbInfo._id;
          let delay = commandAcions.AddTime(6);
          await commandAcions.setDelay(jobId, new Date(delay));
        }

        logger.info('remove the user ');

        let wh = {
          _id: MongoID(tb._id.toString()),
          'playerInfo._id': MongoID(player._id.toString()),
        };

        let updateData = {
          $set: {
            'playerInfo.$': {},
          },
          $inc: {
            activePlayer: -1,
          },
        };

        tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
          new: true,
        });

        let activePlayerInRound = await getPlayingUserInRound(tbInfo.playerInfo);

        let response = {
          pi: player._id,
          score: tbInfo.entryFee,
          lostChips: tbInfo.entryFee,
          totalRewardCoins: tbInfo.tableAmount,
          ap: activePlayerInRound.length,
        };

        commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.LEAVE, response);

        let userDetails = await Users.findOne({
          _id: MongoID(player._id.toString()),
        }).lean();

        let finalData = await filterBeforeSendSPEvent(userDetails);

        commandAcions.sendDirectEvent(player.sck.toString(), CONST.DASHBOARD, finalData);

        commandAcions.sendDirectEvent(player.sck.toString(), CONST.REMOVE_USERSOCKET_FROM_TABLE);
      }
      //logger.info('After Player Loop Table Info : ', tbInfo);
    });

    let tableFinal = await PlayingTables.findOne({
      _id: MongoID(tb._id.toString()),
    }).lean();
    //logger.info('after restart player information Deails tableFinal : ', tableFinal);

    let wh = {
      _id: MongoID(tableFinal._id.toString()),
    };

    let update = {
      $set: {
        gameId: '',
        gameState: '',
        openDeck: [],
        currentPlayerTurnIndex: -1,
        turnDone: false,
        playersScoreBoard: [],
        jobId: '',
        isLastUserFinish: false,
        isFinalWinner: false,
        callFinalWinner: false,
      },
      $unset: {
        gameTimer: 1,
      },
    };
    // logger.info("roundFinish wh :: ", wh, update);

    let tbInfo = await PlayingTables.findOneAndUpdate(wh, update, {
      new: true,
    });
    //logger.info('Reset Table Round Finish tbInfo : ==> ', tbInfo);

    this.restartTable(tbInfo);

    return true;
  } catch (err) {
    logger.error('roundEnd.js roundFinish error => ', err);
  }
};

module.exports.restartTable = async (tbInfo) => {
  try {
    logger.info(' restartTable Table =>', tbInfo);

    let tableId = tbInfo._id;
    let jobId = CONST.RESTART + ':' + tableId.toString();

    let delay = commandAcions.AddTime(7);
    await commandAcions.setDelay(jobId, new Date(delay));

    const wh1 = {
      _id: MongoID(tableId.toString()),
    };

    const tabInfo = await PlayingTables.findOne(wh1, {}).lean();

    if (!tabInfo) {
      logger.info('roundEnd.js table is Null:', tabInfo);
      return false;
    }
    if (tabInfo.activePlayer >= 2) {
      await gameStartActions.gameRestartTimerStart(tabInfo);
    }
    return true;
  } catch (err) {
    logger.error('roundEnd.js roundFinish error => ', err);
  }
};

module.exports.reJoinUser = async (requestData, client) => {
  try {
    logger.info('Request reJoinUser Data ', requestData);

    const { playerId, result } = requestData;
    // if user agree on play game in table
    if (result) {
      const wh = {
        _id: MongoID(client.tbid.toString()),
      };

      let tableInfo = await PlayingTables.findOne(wh, {}).lean();
      logger.info('reJoinUser Table Info 0=>', tableInfo);

      if (!tableInfo) {
        commandAcions.sendDirectEvent(client.id, CONST.RE_JOIN, { msg: 'Table not found' });
        return;
      }

      let jobId = CONST.EXPELED + ':' + tableInfo._id;
      commandAcions.clearJob(jobId);

      let jobIdx = CONST.GAME_TIME_START + ':' + tableInfo._id.toString();
      commandAcions.clearJob(jobIdx);

      const playerInGame = await getPlayingUserInTable(tableInfo.playerInfo);
      //logger.info('reJoinUser Player in Game ------>', playerInGame);

      let arr = [];
      let res = false;
      let dropAmount = CONST.FIRST_DROP;
      if (!tableInfo.gameType === 101) {
        dropAmount = 20;
      }
      playerInGame.forEach((player) => {
        logger.info('reJoinUser player gamechips => ', player.gameChips);
        //res = false;
        let score = player.gameChips + dropAmount;
        logger.info('reJoinUser check player score => ', score);

        if (CONST.EXPELED !== player.playerStatus) {
          if (tableInfo.gameType > Number(score)) {
            res = true;
            logger.info('reJoinUser Final player gameChips => ', player.gameChips);
            arr.push(player.gameChips);
          }
        } else {
          logger.info(' <== Player It self Check ==>', player.gameChips);
        }
      });

      let finalPoint = Math.max(...arr);
      finalPoint = Number(finalPoint + 1);

      logger.info('Re-Join final update score check', finalPoint);
      logger.info('Re-Join final update tableInfo.reAssignPoint check', tableInfo.reAssignPoint);

      if (res) {
        let data = await Users.findOneAndUpdate({ _id: MongoID(playerId) }, { $inc: { chips: Number(-tableInfo.entryFee) } });
        logger.info('Re-Join User Data  User Score =>', data);

        const whe = {
          _id: MongoID(tableInfo._id.toString()),
          'playerInfo._id': MongoID(playerId.toString()),
        };

        let dataUpdate = {
          $set: {
            'playerInfo.$.playerStatus': CONST.PLAYING,
            'playerInfo.$.status': CONST.PLAYING,
            'playerInfo.$.point': tableInfo.reAssignPoint, //finalPoint,
            'playerInfo.$.gameChips': tableInfo.reAssignPoint, //finalPoint,
          },
          $inc: {
            tableAmount: Number(tableInfo.entryFee),
          },
        };

        tableInfo = await PlayingTables.findOneAndUpdate(whe, dataUpdate, { new: true });
        //logger.info(' === > reJoinUser Update tableInfo <== 1', tableInfo);

        const playerInGame = await getPlayingUserInRound(tableInfo.playerInfo);

        let userGameChips = [];
        playerInGame.forEach((player) => {
          let data = {
            playerId: player._id,
            name: player.name,
            gameChips: player.gameChips,
          };
          userGameChips.push(data);
          logger.info('in loop User Game Chips -->', userGameChips);
        });

        logger.info(' User Game Chips -->', userGameChips);

        commandAcions.sendEventInTable(client.tbid.toString(), CONST.RE_JOIN_UPDATE_SCORE, { userGameChips, tableAmount: tableInfo.tableAmount, gamePlayType: tableInfo.gamePlayType });
      } else {
        logger.info('User removed ');
        this.removeUser({ playerId: playerId }, client);
      }

      logger.info(' === > reJoinUser Update tableInfo <== 2', tableInfo);

      let updateData = {
        $set: {
          gameId: '',
          gameState: '',
          openDeck: [],
          currentPlayerTurnIndex: -1,
          turnDone: false,
          playersScoreBoard: [],
          jobId: '',
          isLastUserFinish: false,
          isFinalWinner: false,
          callFinalWinner: false,
        },
        $unset: {
          gameTimer: 1,
        },
      };
      // logger.info("roundFinish wh :: ", wh, update);

      let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
        new: true,
      });

      logger.info('RESET TABLE WHILE REJOIN USER ==> ', tbInfo);
      this.restartTable(tbInfo);
      //this.resetTable(tbInfo);
    } else {
      logger.info('re join false answer');

      let jobId = CONST.EXPELED + ':' + client.tbid;
      commandAcions.clearJob(jobId);

      const whr = {
        _id: MongoID(client.tbid.toString()),
      };

      let tableInfo = await PlayingTables.findOne(whr, {}).lean();
      logger.info('reJoinUser Table Info =>', tableInfo);

      if (!tableInfo) {
        commandAcions.sendDirectEvent(client.id.toString(), CONST.RE_JOIN, { msg: 'Table not found' });
      }

      if (typeof client.id !== 'undefined') {
        logger.info('leaveTable client.id : ', client.id);
        client.leave(tableInfo._id.toString());
      }

      let wh = {
        _id: MongoID(tableInfo._id.toString()),
        'playerInfo._id': MongoID(playerId.toString()),
      };

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

      logger.info('Re Join User table Info', tbInfo);
      let activePlayerInRound = await getPlayingUserInRound(tbInfo.playerInfo);

      let response = {
        pi: playerId,
        score: tbInfo.entryFee,
        lostChips: tbInfo.entryFee,
        totalRewardCoins: tbInfo.tableAmount,
        ap: activePlayerInRound.length,
      };
      //commandAcions.sendDirectEvent(client.id, CONST.LEAVE, response);
      commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.LEAVE, response);

      let userDetails = await Users.findOne({
        _id: MongoID(playerId.toString()),
      }).lean();

      let finalData = await filterBeforeSendSPEvent(userDetails);

      commandAcions.sendDirectEvent(client.id, CONST.DASHBOARD, finalData);

      if (activePlayerInRound.length === 0 && tbInfo.activePlayer === 0) {
        let wh = {
          _id: MongoID(tbInfo._id.toString()),
        };
        await PlayingTables.deleteOne(wh);
      }
    }
  } catch (e) {
    logger.error('gamePlay.js reJoinUser error => ', e);
  }
};

module.exports.removeUser = async (requestData, client) => {
  try {
    logger.info(' remove user Request data  -->', requestData);

    let { playerId } = requestData;
    let jobId = CONST.EXPELED + ':' + client.tbid;
    commandAcions.clearJob(jobId);

    const whr = {
      _id: MongoID(client.tbid.toString()),
    };

    let tableInfo = await PlayingTables.findOne(whr, {}).lean();

    if (!tableInfo) {
      commandAcions.sendDirectEvent(client.id.toString(), CONST.RE_JOIN, { msg: 'Table not found' });
    }

    let wh = {
      _id: MongoID(tableInfo._id.toString()),
      'playerInfo._id': MongoID(playerId.toString()),
    };

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

    let activePlayerInRound = getPlayingUserInRound(tbInfo.playerInfo);

    let response = {
      pi: playerId,
      score: tbInfo.entryFee,
      lostChips: tbInfo.entryFee,
      totalRewardCoins: tbInfo.tableAmount,
      ap: activePlayerInRound.length,
    };

    commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.LEAVE, response);

    let userDetails = await Users.findOne({
      _id: MongoID(playerId.toString()),
    }).lean();

    let finalData = await filterBeforeSendSPEvent(userDetails);

    commandAcions.sendDirectEvent(client.id, CONST.DASHBOARD, finalData);

    if (activePlayerInRound.length === 0 && tbInfo.activePlayer === 0) {
      let wh = {
        _id: MongoID(tbInfo._id.toString()),
      };
      await PlayingTables.deleteOne(wh);
    }
  } catch (error) {
    logger.info(' RJ removeUser Error --->', error);
  }
};

module.exports.removePlayer = async (requestData, client) => {
  try {
    let { playerId, result } = requestData;
    logger.info(' remove Player requestData =>', requestData);

    const whr = {
      _id: MongoID(client.tbid.toString()),
    };

    let tableInfo = await PlayingTables.findOne(whr, {}).lean();

    if (!tableInfo) {
      commandAcions.sendDirectEvent(client.id, CONST.RESTART_GAME_TABLE, { msg: 'Table not found' });
      return;
    }

    let wh = { _id: playerId };
    let userInfo = await Users.findOne(wh, {}).lean();
    let totalWallet = Number(userInfo.chips);
    let requireGameChips = tableInfo.entryFee;

    //logger.info(' User Info Final CHips -->', userInfo);
    //logger.info('removePlayer Fetch Total Wallet =>', totalWallet);
    //logger.info('require removePlayer game chips =>', requireGameChips);

    if (totalWallet < requireGameChips) {
      let table = await this.removeInsufficientPlayer(requestData, tableInfo, client);
      logger.info('insufficient wallet player =>', table);

      tableInfo = table;
    }
    if (result && totalWallet > requireGameChips) {
      let wh = {
        _id: MongoID(tableInfo._id.toString()),
        'playerInfo._id': MongoID(playerId.toString()),
      };

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

      let activePlayerLength;
      if (tbInfo === null) {
        activePlayerLength = 0;
      } else {
        let activePlayerInRound = await getPlayingUserInTable(tbInfo.playerInfo);
        activePlayerLength = activePlayerInRound.length;
        logger.info('Re start active Player In Round :', activePlayerInRound, activePlayerLength);
      }

      //send available plying player in table
      let result = {
        pi: client.uid,
        ap: activePlayerLength,
      };

      commandAcions.sendDirectEvent(client.sck, CONST.SWITCH_TABLE, result);

      if (tbInfo.activePlayer === 0) {
        let wh = {
          _id: MongoID(tbInfo._id.toString()),
        };
        await PlayingTables.deleteOne(wh);
      }
    } else if (!result) {
      if (typeof client.id !== 'undefined') {
        client.leave(tableInfo._id.toString());
      }

      let wh = {
        _id: MongoID(tableInfo._id.toString()),
        'playerInfo._id': MongoID(playerId.toString()),
      };

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

      let activePlayerInRound = await getPlayingUserInRound(tbInfo.playerInfo);

      let response = {
        pi: playerId,
        score: tbInfo.entryFee,
        lostChips: tbInfo.entryFee,
        totalRewardCoins: tbInfo.tableAmount,
        ap: activePlayerInRound.length,
      };

      commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.LEAVE, response);

      let userDetails = await Users.findOne({
        _id: MongoID(playerId.toString()),
      }).lean();

      let finalData = await filterBeforeSendSPEvent(userDetails);

      commandAcions.sendDirectEvent(client.id, CONST.DASHBOARD, finalData);

      if (tbInfo.activePlayer === 0) {
        let wh = {
          _id: MongoID(tbInfo._id.toString()),
        };
        await PlayingTables.deleteOne(wh);
      }
    }
  } catch (error) {
    logger.info(' RJ removeUser Error --->', error);
  }
};

module.exports.checkGameUser = async (table) => {
  try {
    const playerInGame = await getPlayingUserInTable(table.playerInfo);
    logger.info('checkGameUser Player Details ==>', JSON.stringify(playerInGame));

    const list = [CONST.WON, CONST.LOST, CONST.LEAVE, CONST.PLAYING, CONST.INVALID_DECLARE, CONST.DROPPED];
    //let arr = [];
    let countOfPlayer = 0;
    const promises = [];
    let maxPlayerScore = 0;
    let dropAmount = 16;
    if (table.gameType !== 101) {
      dropAmount = 20;
    }

    playerInGame.forEach(async (player) => {
      if (list.includes(player.playerStatus) && player.gameChips + dropAmount <= table.gameType) {
        countOfPlayer++;
        if (player.gameChips > maxPlayerScore) {
          maxPlayerScore = player.gameChips;
        }
      }
    });

    logger.info(' maxPlayerScore =>', { maxPlayerScore, dropAmount, countOfPlayer });

    playerInGame.forEach(async (player) => {
      if (list.includes(player.playerStatus) && player.gameChips <= table.gameType) {
        logger.info(' Player gameChips ->', player.gameChips);

        let score = player.gameChips + dropAmount;
        logger.info('checkGameUser Table get Player Score => ', score);

        if (table.gameType > score) {
          //countOfPlayer++;
          logger.info('checkGameUser Assign Final player gameChips => ', player.gameChips);
          //arr.push(player.gameChips);
          //}

          //let finalPoint = Math.max(...arr);
          const finalPoint = Number(maxPlayerScore + 1);
          logger.info('checkGameUser resetTable final update score', finalPoint);

          const wh = {
            _id: MongoID(table._id.toString()),
            'playerInfo.seatIndex': Number(player.seatIndex),
          };

          let dataUpdate = {
            $set: {
              reAssignPoint: finalPoint,
            },
          };

          promises.push(PlayingTables.findOneAndUpdate(wh, dataUpdate, { new: true }));
        } else {
          logger.info(' not eligible- insufficient balance');
          return (countOfPlayer = 1);
        }
      }
    });
    await Promise.allSettled(promises);
    logger.info(' Counts Player ==>', countOfPlayer);

    return countOfPlayer;
  } catch (error) {
    logger.info('Check Game User Error ==>', error);
  }
};

module.exports.checkExepledUser = async (table) => {
  try {
    //logger.info('checkExepledUser Table Details -->', table);

    const playerInGame = await getPlayingUserInTable(table.playerInfo);
    //logger.info('checkExepledUser Player Details ==>', JSON.stringify(playerInGame));

    const promises = [];

    playerInGame.forEach(async (player) => {
      if (player.gameChips >= table.gameType) {
        //logger.info(' EX Player Status ->', player.playerStatus, '\n Player name', player.name);
        //logger.info('EX Player gameChips ->', player.gameChips);

        const wh = {
          _id: MongoID(table._id.toString()),
          'playerInfo.seatIndex': Number(player.seatIndex),
        };

        let updateUserData = {
          $set: {
            'playerInfo.$.playerStatus': CONST.EXPELED,
          },
        };

        logger.info('wh ->', wh, '\n updateUserData =>', updateUserData);
        promises.push(
          PlayingTables.findOneAndUpdate(wh, updateUserData, {
            new: true,
          })
        );
        //logger.info('<--- checkExepledUser Set EXPELED Player in Reset table Info ---> ', table);
      }
    });

    await Promise.allSettled(promises);
    //let finalTable = await PlayingTables.findOne({
    //  _id: MongoID(tb._id.toString()),
    //}).lean();

    //logger.info('check a Expled player and Table ReAssign Amount  =>', table);
    return true;
  } catch (error) {
    logger.info('checkExepledUser Error ->', error);
  }
  return true;
};

module.exports.removeInsufficientPlayer = async (requestData, table, client) => {
  try {
    let { playerId } = requestData;
    logger.info(' removeInsufficientPlayer =>', requestData);

    if (!table) {
      commandAcions.sendDirectEvent(client.id, CONST.RESTART_GAME_TABLE, { msg: 'Table not found' });
      return;
    }
    let tableInfo = table;

    if (typeof client.id !== 'undefined') {
      client.leave(tableInfo._id.toString());
    }

    let wh = {
      _id: MongoID(tableInfo._id.toString()),
      'playerInfo._id': MongoID(playerId.toString()),
    };

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

    let activePlayerInRound = await getPlayingUserInRound(tbInfo.playerInfo);

    let response = {
      pi: playerId,
      score: tbInfo.entryFee,
      lostChips: tbInfo.entryFee,
      totalRewardCoins: tbInfo.tableAmount,
      ap: activePlayerInRound.length,
    };

    //commandAcions.sendDirectEvent(player.sck.toString(), CONST.LEAVE, response);
    commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.LEAVE, response);

    let userDetails = await Users.findOne({
      _id: MongoID(playerId.toString()),
    }).lean();

    let finalData = await filterBeforeSendSPEvent(userDetails);

    commandAcions.sendDirectEvent(client.id, CONST.DASHBOARD, finalData);

    let jobId = commandAcions.GetRandomString(10);
    let delay = commandAcions.AddTime(2);
    await commandAcions.setDelay(jobId, new Date(delay));

    commandAcions.sendDirectEvent(client.id, CONST.INSUFFICIENT_CHIPS, {
      flag: false,
      msg: 'Insufficient Balance..Please Add Wallet!!',
    });
    return tbInfo;
  } catch (error) {
    logger.info(' RJ removeUser Error --->', error);
  }
};
