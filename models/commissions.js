const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameUser = require('./users');

const collectionName = 'commissions';

const commisonDeatilsschema = new Schema(
    {
        tableId: { type: String, trim: true, default: 'N/A' },
        gamePlayType: { type: String, default: '' },
        CommisonAmount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(collectionName, commisonDeatilsschema);
