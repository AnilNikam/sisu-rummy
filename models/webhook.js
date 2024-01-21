const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'webhook';

const WebhookSchema = new Schema(
  {
    userId: { type: String },
    from: { type: String },
    transactionRef: { type: String },
    status: { type: String },
    amount: { type: Number },
    meta: { type: String },
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

module.exports = mongoose.model(collectionName, WebhookSchema, collectionName);
