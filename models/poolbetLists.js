const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'poolbetLists';

const BetListSchema = new Schema(
  {
    gamePlayType: { type: String, default: "poolrummy" },
    type: { type: String, required: true },
    tableName: { type: String, default: '' },
    entryFee: { type: Number },//bet
    maxSeat: { type: Number, default: 6 },
    status: { type: String, default: 'Active' },
    commission: { type: Number, default: 15 },
    expireIn: { type: Number },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(collectionName, BetListSchema, collectionName);
