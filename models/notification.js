const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const collectionName = 'notifications';

const NotificationSchema = new Schema(
  {
    sender: { type: String, default: null },
    receiver: { type: Schema.Types.ObjectId, required: true },
    type: { type: String },
    body: { type: String, required: true },
    isSeen: { type: Boolean, default: 0 },
    paymentGateway: {
      type: String,
      required: true,
      default: 'Flutterwave',
      enum: ['Flutterwave', 'Spenn'], // Payment gateway might differs as the application grows
    },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, NotificationSchema, collectionName);
