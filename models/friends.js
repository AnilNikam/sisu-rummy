const mongoose = require('mongoose');
const { FRIENDSHIP } = require('../constant');
const Schema = mongoose.Schema;

const collectionName = 'friends';

const FriendSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    friendId: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    status: {
      type: String,
      enum: [FRIENDSHIP.PENDING, FRIENDSHIP.APPROVED, FRIENDSHIP.REJECT],
      required: true,
      default: FRIENDSHIP.PENDING,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    modifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false },
  { timestamps: true }
);

module.exports = mongoose.model(collectionName, FriendSchema, collectionName);
