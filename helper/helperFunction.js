const CONST = require('../constant');
const { findIndex } = require('lodash');
const logger = require('../logger');
const { sendDirectEvent } = require('./socketFunctions');

const sendEvent = (obj, socket) => {
  socket.emit('req', obj);
};

const sendTableEvent = (obj, tableId, io) => {
  io.to(tableId).emit('req', obj);
};

const GTIData = (seatIndex, gameStartTime, players, tableID, gamePlayType, rest = {}) => {
  logger.info(
    'GTI event ~~~>>',
    JSON.stringify({
      eventName: CONST.GAME_TABLE_INFO,
      data: {
        ssi: seatIndex,
        gst: gameStartTime,
        pi: [].concat(players),
        utt: CONST.userTurnTimer,
        fns: CONST.finishTimer,
        tableid: tableID,
        gamePlayType,
        ...rest,
      },
    })
  );
  return {
    eventName: CONST.GAME_TABLE_INFO,
    data: {
      ssi: seatIndex,
      gst: gameStartTime,
      pi: [].concat(players),
      utt: CONST.userTurnTimer,
      fns: CONST.finishTimer,
      tableid: tableID,
      gamePlayType,
      ...rest,
    },
  };
};

const JTData = (playerDetail, ap, rest = {}) => {
  return { eventName: CONST.JOIN_TABLE, data: { ap, playerDetail, ...rest } };
};

const ifTableAvailable = (table, chips) => {
  return table.players.length < CONST.TOTAL_PLAYER && table.entryFee === chips && (table.status === CONST.WAITING || table.status === CONST.GAME_START_TIMER);
};

const createDealer = (maximum) => {
  let max = maximum;
  try {
    const min = Math.ceil(0);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  } catch (error) {
    logger.info('error', error);
  }
};

const getRandomNumber = (min, max) => {
  return Math.random() * (max - min) + min;
};

const shuffle = (deck) => {
  // switch the values of two random cards

  const deckList = Object.assign([], deck);
  for (let i = 0; i < 120; i++) {
    const location1 = Math.floor(Math.random() * deckList.length);
    const location2 = Math.floor(Math.random() * deckList.length);
    const tmp = deckList[location1];

    deckList[location1] = deckList[location2];
    deckList[location2] = tmp;
  }
  return deckList;
};

const cardDistribute = (availableTablePlayerObj, callback) => {
  const availableTablePlayer = availableTablePlayerObj;
  try {
    const shuffleCards = Object.assign([], shuffle(CONST.deckOne));

    if (availableTablePlayer.length > 1) {
      for (let i = 0; i < availableTablePlayer.length; i++) {
        for (let j = 0; j < 3; j++) {
          const val = shuffleCards.pop();
          availableTablePlayer[i].cards[j] = val;
        }
        availableTablePlayer[i].status = CONST.PLAYING;
        logger.info('availableTablePlayer[i].cards => ', availableTablePlayer[i].name, '------->', availableTablePlayer[i].cards);
      }
      callback(availableTablePlayer, shuffleCards);
    }
  } catch (error) {
    logger.info('error', error);
  }
};

const findTable = (rooms, gamePlayType, tableId) => {
  const roomIndex = findIndex(rooms, { gamePlayType });
  try {
    const tableIndex = findIndex(rooms[roomIndex].availableTables, { tableId });
    if (tableIndex >= 0) {
      return rooms[roomIndex].availableTables[tableIndex];
    } else {
      return null;
    }
  } catch (error) {
    logger.error('Error in find table function', rooms);
  }
};

const findPlayer = (table, playerId) => {
  return findIndex(table.players, { playerId });
};

const assignUserTurn = (tbInfo) => {
  const table = tbInfo;
  try {
    const sortSeatIndex = table.players.sort(function (a, b) {
      return a.seatIndex - b.seatIndex;
    });
    logger.info('UTS sort Seat Index  = >', JSON.stringify(sortSeatIndex) + '      Table --> ', JSON.stringify(table));

    const playingPlayers = table.players.filter((player) => player.status === CONST.PLAYING);

    if (playingPlayers.length > 0) {
      let currentPlayingPlayerIndex = table.players.findIndex((player) => player.playerId === table.currentPlayingPlayerId);
      do {
        currentPlayingPlayerIndex++;

        if (currentPlayingPlayerIndex >= table.players.length) {
          currentPlayingPlayerIndex = 0;
        }
      } while (table.players[currentPlayingPlayerIndex].status !== CONST.PLAYING);

      table.currentPlayingPlayerId = table.players[currentPlayingPlayerIndex].playerId;
    } else {
      logger.info('Not Found Player');
    }
  } catch (error) {
    logger.info('assignUserTurn error => ', error);
  }
};

const countPlayingPlayers = (players) => {
  return players.reduce(
    // eslint-disable-next-line no-param-reassign
    (acc, curr) => (curr.status === CONST.PLAYING ? ++acc : acc),
    0
  );
};

let activeCount;

const countActiveUser = (count) => {
  activeCount = count;
};

const sendActiveUser = () => {
  return activeCount;
};

const ifSocketDefine = (requestData, socket, eventName) => {
  if (typeof socket.tbid === 'undefined' || typeof socket.uid === 'undefined' || typeof socket.seatIndex === 'undefined') {
    sendDirectEvent(socket.sck, eventName, requestData, false, 'User session not set, please restart game!');
    return false;
  }
  return true;
};

module.exports = {
  GTIData,
  sendEvent,
  sendTableEvent,
  JTData,
  ifTableAvailable,
  cardDistribute,
  createDealer,
  shuffle,
  assignUserTurn,
  findPlayer,
  findTable,
  countPlayingPlayers,
  getRandomNumber,
  countActiveUser,
  sendActiveUser,
  ifSocketDefine,
};
