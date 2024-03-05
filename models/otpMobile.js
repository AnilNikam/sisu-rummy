const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'otpMobile';

const OtpMobileSchema = new Schema(
  {
    mobileNumber: { type: String, required: true },
    email: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    otpCode: { type: Number, required: true }, // Ensure otpCode is required
    countryCode: { type: Number },
    otpType: {
      type: String,
      enum: ['VERIFY_NUMBER_FOR_SIGNUP', 'CHANGE_PASSWORD', 'VERIFY_NUMBER_FOR_LOGIN'],
    },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
  },
  { versionKey: false, timestamps: { createdAt: true } } // Combine timestamps option with other options
);

OtpMobileSchema.index({ createdAt: 1 }, { expireAfterSeconds: 20 }); // Use createdAt field for TTL index
module.exports = mongoose.model(collectionName, OtpMobileSchema, collectionName);
