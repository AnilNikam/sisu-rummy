const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PlayingTables = require('./playingTables');
const Users = require('./users');

const collectionName = 'gamePlayTracks';

const GamePlayTracksSchema = new Schema(
  {
    gameId: { type: String, default: '' },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: PlayingTables },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: Users },
    gameType: { type: String, default: '' },
    deductAmount: { type: Number, default: 0 },
    winningAmount: { type: Number, default: 0 },
    winningStatus: { type: String, default: '' },
    cards: { type: Array, default: [] },
    gCard: { type: Array, default: [] },
    date: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, GamePlayTracksSchema, collectionName);
