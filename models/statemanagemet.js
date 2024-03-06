const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'statemanagemet';

const StateTextSchema = new Schema(
    {
        statename: { type: String },
        active: { type: Boolean },
    },
    { versionKey: false }
);

module.exports = mongoose.model(collectionName, StateTextSchema, collectionName);
