const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameUser = require('./users');

const collectionName = 'userReferTracks';

const UserReferTracksSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
    referalUserId: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
  },
  { versionKey: false },
  { timestamps: true }
);

const UserReferTracks = mongoose.model(collectionName, UserReferTracksSchema, collectionName);
module.exports = UserReferTracks;
