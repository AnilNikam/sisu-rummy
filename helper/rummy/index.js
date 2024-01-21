const { joinTable } = require('./joinTable');
const { reconnect } = require('../common-function/reconnect');
const { leaveTable, playerSwitch } = require('./leaveTable');
const { getBetList, getPoolBet, getDealList } = require('../common-function/betList');
const { getWalletDetails } = require('../common-function/walletTrackTransaction');
const { chatPanel, openChatPanel } = require('../common-function/chatPanel');
const { disconnectTableHandle, findDisconnectTable } = require('../disconnectHandle');
const { pickCard, disCard, cardGroup, declare, playerFinish, playerDrop, playerLastScoreBoard, playerFinishDeclare } = require('./gamePlay');

module.exports = {
  getBetList: getBetList,
  poolBetList: getPoolBet,
  dealBetList: getDealList,
  joinTable: joinTable,
  pickCard: pickCard,
  disCard: disCard,
  declare: declare,
  leaveTable: leaveTable,
  playerSwitch: playerSwitch,
  cardGroup: cardGroup,
  playerDrop: playerDrop,
  chatPanel: chatPanel,
  openChatPanel: openChatPanel,
  playerFinish: playerFinish,
  playerLastScoreBoard: playerLastScoreBoard,
  playerFinishDeclare: playerFinishDeclare,
  reconnect: reconnect,
  getWalletDetails: getWalletDetails,
  findDisconnectTable: findDisconnectTable,
  disconnectTableHandle: disconnectTableHandle,
};
