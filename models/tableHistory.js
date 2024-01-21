const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'tableHistory';

const TableHistorySchema = new Schema(
  {
    gameId: { type: String, default: '' },
    entryFee: { type: Number },
    gamePlayType: { type: String, default: '' },
    maxSeat: { type: Number, default: 4 },
    activePlayer: { type: Number, default: 0 },
    gameTimer: { type: Object, default: {} },
    startTimer: { type: String, default: -1 },
    tableAmount: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    currentPlayerTurnIndex: { type: Number, default: -1 },
    playerInfo: [],
    chatPanel: [],
    totalRewardCoins: { type: Number, default: 0 },
    playersScoreBoard: [],
    lastPointTable: [],
    gameState: { type: String, default: '' },
    tableId: { type: String },
    openCard: { type: String, default: '' },
    openDeck: [{ type: String, default: [] }],
    closeDeck: [{ type: String, default: [] }],
    turnDone: { type: Boolean, default: false },
    turnStartTimer: { type: Date },
    dealerSeatIndex: { type: Number, default: -1 },
    jobId: { type: String, default: '' },
    gameTracks: [],
    callFinalWinner: { type: Boolean, default: false },
    isLastUserFinish: { type: Boolean, default: false },
    isFinalWinner: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, TableHistorySchema, collectionName);
