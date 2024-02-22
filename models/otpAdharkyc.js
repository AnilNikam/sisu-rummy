const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameUser = require('./users');
const collectionName = 'otpAdharkyc';

const KycSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
    adharcard: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
    userInfo:{},
    Pancard:{ type: String, default: '' },
    Pancardverified:{ type: Boolean, default: false },
  },
  { versionKey: false },
  { timestamps: true }
);

KycSchema.index({ otpCode: 1 }, { expireAfterSeconds: 60 });
module.exports = mongoose.model(collectionName, KycSchema, collectionName);
