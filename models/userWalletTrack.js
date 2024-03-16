const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameUser = require('./users');
const collectionName = 'walletTrackTransaction';

const UserWalletTracksSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
    uniqueId: { type: String },
    transType: { type: String },
    transTypeText: { type: String },
    transAmount: { type: Number },
    chips: { type: Number },
    winningChips: { type: Number },
    bonusChips: { type: Number },
    lockbonusChips: { type: Number },
    // referralChips: { type: Number }, // referarl Chips
    // unlockreferralChips: { type: Number }, // referarl Chips unlock Chips  
    // lockreferralChips: { type: Number }, // referarl Chips lock Chips 
    //withdrawableChips:{ type: Number},
    totalBucket: { type: Number, defualt: 0 },
    gameId: { type: String },
    gameType: { type: String },
    maxSeat: { type: Number },
    betValue: { type: Number },
    tableId: { type: String },
  },
  {
    timestamps: true,
  },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, UserWalletTracksSchema, collectionName);
