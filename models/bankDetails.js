const mongoose = require('mongoose');
const GameUser = require('./users');
const Schema = mongoose.Schema;

const BankDeatils = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: GameUser },
        transactionId: { type: String, trim: true, default: 'N/A' },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        amount: { type: Number, required: true },
        phone: { type: String },
        amountNumber: { type: Number, required: true },
        paymentStatus: {
            type: String,
            enum: ['successful', 'success', 'Pending', 'pending', 'failed', 'Successful', 'FAILED', 'approve', 'Cancelled', 'Approved', 'Rejected'],
            default: 'Pending',
        },
        IFSC: { type: String, default: '' },
        BeneficiaryName: { type: String, default: '' },
        transferMode: { type: String, enum: ['NEFT', 'RTGS'] },
        webhook: {}
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('bankDeatils', BankDeatils);
