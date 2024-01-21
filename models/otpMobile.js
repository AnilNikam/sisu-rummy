const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'otpMobile';

const OtpMobileSchema = new Schema(
  {
    mobileNumber: { type: String, required: true },
    email: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    otpCode: { type: Number },
    countryCode: { type: Number },
    otpType: {
      type: String,
      enum: ['VERIFY_NUMBER', 'CHANGE_PASSWORD', 'VERIFY_NUMBER_FOR_LOGIN'],
    },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
  { timestamps: true }
);

OtpMobileSchema.index({ otpCode: 1 }, { expireAfterSeconds: 60 });
module.exports = mongoose.model(collectionName, OtpMobileSchema, collectionName);
