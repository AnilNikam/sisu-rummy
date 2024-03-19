const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'users';

const GameUserSchema = new Schema(
  {
    id: { type: Number },
    name: { type: String, required: true },
    username: { type: String },
    deviceId: { type: String, required: true },
    mobileNumber: { type: String },
    mobileVerify: { type: Boolean, default: false },
    uniqueId: { type: String },
    email: { type: String, default: '' },
    panNo: { type: String, default: '' },
    location: { type: String, default: '' },
    state: { type: String, default: '' },
    password: { type: String, default: '' },
    chips: { type: Number, required: true, default: 0 },       // Deposite 
    winningChips: { type: Number, required: true, default: 0 }, // Winning Chips 
    bonusChips: { type: Number, required: true, default: 0 },  // Sp && deposite Bonus 5% + referralChips
    lockbonusChips: { type: Number, required: true, default: 0 }, // lock Chips 
    //referralChips: { type: Number, required: true, default: 0 }, // referarl Chips
    // unlockreferralChips: { type: Number, required: true, default: 0 }, // referarl Chips unlock Chips  
    // lockreferralChips: { type: Number, required: true, default: 0 }, // referarl Chips lock Chips 
    //withdrawableChips: { type: Number, required: true, default: 0 },
    referralCode: { type: String },
    referredBy: { type: String },
    avatar: { type: String },
    deviceType: { type: String, default: 'Android' },
    loginType: { type: String, enum: ['Mobile', 'Guest', 'email', 'Google'], require: true, default: 'Guest' },
    flags: {
      isOnline: { type: Number, default: 0 },
    },
    counters: {
      gameWin: { type: Number, default: 0 },
      gameLoss: { type: Number, default: 0 },
      totalMatch: { type: Number, default: 0 },
    },
    tableId: { type: String, default: '' },
    sckId: { type: String },
    status: { type: String, default: '' },
    lastLoginDate: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
    isBot: { type: Boolean, default: false },
    isfree: { type: Boolean, default: true },
    lastTableId: []


  },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, GameUserSchema, collectionName);
