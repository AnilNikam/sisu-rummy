const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'playingTable';
const BetLists = mongoose.model('betLists');

const PlayingTablesSchema = new Schema(
  {
    gameId: { type: String, default: '' },
    entryFee: { type: Number },
    gameType: { type: Number },
    deal: { type: Number },
    gamePlayType: { type: String, enum: ['pointrummy', 'poolrummy', 'dealrummy'], require: true, default: 'pointrummy' },
    betId: { type: mongoose.Schema.Types.ObjectId, ref: BetLists },
    maxSeat: { type: Number, default: 6 },
    activePlayer: { type: Number, default: 0 },
    gameTimer: { type: Object, default: {} },
    startTimer: { type: String, default: -1 },
    tableAmount: { type: Number, default: 0 },
    commission: { type: Number, default: 10 },
    currentPlayerTurnIndex: { type: Number, default: -1 },
    tableLock: { type: Boolean, default: false },
    gameTracks: [],
    lastPointTable: [],
    playerInfo: [],
    chatPanel: [],
    round: { type: Number, default: 0 },
    reAssignPoint: { type: Number, default: 0 },
    totalRewardCoins: { type: Number, default: 0 },
    playersScoreBoard: [],
    lastGameScoreBoard: [],
    gameState: { type: String, default: '' },
    wildCard: { type: String, default: '' },
    openCard: { type: String, default: '' },
    discardCard: { type: String, default: '' },
    openDeck: [{ type: String, default: [] }],
    closeDeck: [{ type: String, default: [] }],
    turnDone: { type: Boolean, default: false },
    turnStartTimer: { type: Date },
    dealerSeatIndex: { type: Number, default: -1 },
    jobId: { type: String, default: '' },
    callFinalWinner: { type: Boolean, default: false },
    isLastUserFinish: { type: Boolean, default: false },
    isFinalWinner: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, PlayingTablesSchema, collectionName);
