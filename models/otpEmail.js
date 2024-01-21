const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'otpEmail';

const OtpEmailSchema = new Schema(
  {
    email: { type: String, required: true },
    verified: { type: Boolean, default: false },
    otp: { type: Number },
    expireIn: { type: Number },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
  { timestamps: true }
);

module.exports = mongoose.model(collectionName, OtpEmailSchema, collectionName);
