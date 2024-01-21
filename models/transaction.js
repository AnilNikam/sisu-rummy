const mongoose = require('mongoose');
const GameUser = require('./users');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: GameUser },
    transactionId: { type: String, trim: true, default: 'N/A' },
    reference: { type: String, trim: true, default: 'N/A' },
    type: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: Number },
    amount: { type: Number, required: true },
    currency: {
      type: String,
      required: true,
      enum: ['NGN', 'USD', 'EUR', 'ZMW'],
    },
    paymentStatus: {
      type: String,
      enum: ['successful', 'success', 'Pending', 'pending', 'failed', 'Successful', 'FAILED', 'approve', 'Cancelled', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    paymentGateway: {
      type: String,
      required: true,
      enum: ['Flutterwave', 'Spenn'], // Payment gateway might differs as the application grows
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
