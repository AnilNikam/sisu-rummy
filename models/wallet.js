const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./users');

const collectionName = 'wallets';

const WalletSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: User },
    balance: { type: Number, default: 0 },
    winningAmount: { type: Number, default: 0 },
    // bonus: { type: Number, default: 0 },
  },
  { timestamps: true },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, WalletSchema, collectionName);
