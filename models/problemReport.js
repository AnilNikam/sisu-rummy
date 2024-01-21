const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'problemReport';

const ReportSchema = new Schema(
  {
    tableId: { type: String },
    playerId: { type: String },
    gamePlayType: { type: String },
    email: { type: String },
    issueType: { type: String },
    issueSubType: { type: String },
    comments: { type: String },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, ReportSchema, collectionName);
