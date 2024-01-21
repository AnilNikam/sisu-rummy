const { joinTable } = require('./joinTable');
const { reconnect } = require('../common-function/reconnect');
const { reJoinUser, removePlayer } = require('./roundEnd');
const { leaveTable, playerSwitch } = require('./leaveTable');
const { getPoolBet } = require('../common-function/betList');
const { chatPanel, openChatPanel } = require('../common-function/chatPanel');
const { getWalletDetails } = require('../common-function/walletTrackTransaction');
const { disconnectTableHandle, findDisconnectTable } = require('../disconnectHandle');
const { pickCard, disCard, cardGroup, declare, playerFinish, playerDrop, lastPointTable, playerFinishDeclare } = require('./gamePlay');

module.exports = {
  getPoolBet: getPoolBet,
  joinTable: joinTable,
  pickCard: pickCard,
  disCard: disCard,
  declare: declare,
  leaveTable: leaveTable,
  playerSwitch: playerSwitch,
  cardGroup: cardGroup,
  playerDrop: playerDrop,
  chatPanel: chatPanel,
  reJoinUser: reJoinUser,
  openChatPanel: openChatPanel,
  playerFinish: playerFinish,
  lastPointTable: lastPointTable,
  reconnect: reconnect,
  playerFinishDeclare: playerFinishDeclare,
  getWalletDetails: getWalletDetails,
  findDisconnectTable: findDisconnectTable,
  removePlayer: removePlayer,
  disconnectTableHandle: disconnectTableHandle,
};
