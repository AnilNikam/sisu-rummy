const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameUser = require('./users');

const collectionName = 'bankDetails';

const bankDeatilsschema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: GameUser },
        transactionId: { type: String, trim: true, default: 'N/A' },
        name: { type: String, required: true, trim: true },
        email: { type: String },
        // amount: { type: Number, required: true },
        phone: { type: String, required: true },
        accountNumber: { type: String, required: true },
        paymentStatus: {
            type: String,
            enum: ['successful', 'success', 'Pending', 'pending', 'failed', 'Successful', 'FAILED', 'approve', 'Cancelled', 'Approved', 'Rejected'],
            default: 'Pending', //Approved //Rejected  Must This String  
        },
        paymentreMark: { type: String, default: '' },
        IFSC: { type: String, default: '' },
        BeneficiaryName: { type: String, default: '' },
        adminStatus: {
            type: String,
            enum: ['successful', 'success', 'Pending', 'pending', 'failed', 'Successful', 'FAILED', 'approve', 'Cancelled', 'Approved', 'Rejected'],
            default: 'Pending', //Approved //Rejected  Must This String  
        },
        reMark: { type: String, default: '' },
        transferMode: { type: String, enum: ['NEFT', 'RTGS', 'IMPS'] },
        verify: { type: Boolean, default: false },
        webhook: {},
        
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(collectionName, bankDeatilsschema);
