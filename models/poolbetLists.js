const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'poolbetLists';

const BetListSchema = new Schema(
  {
    gamePlayType: { type: String, required: true },
    type: { type: String, required: true },
    entryFee: { type: Number },
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
