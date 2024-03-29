const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameUser = require('./users');

const collectionName = 'collections';

const commisonDeatilsschema = new Schema(
    {
        tableId: { type: String, trim: true, default: 'N/A' },
        CommisonAmount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(collectionName, commisonDeatilsschema);
