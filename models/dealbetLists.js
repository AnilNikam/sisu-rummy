const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'dealbetLists';

const BetListSchema = new Schema(
  {
    gamePlayType: { type: String, default: 'dealrummy' },
    deal: { type: Number, required: true },
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
