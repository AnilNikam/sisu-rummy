const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameUser = require('./users');
const collectionName = 'otpAdharkyc';

const KycSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
    userName: { type: String, default: ''},
    adharcard: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
    userInfo:{},
    adharcardfrontimages:{ type: String, default: '' },
    adharcardbackimages:{ type: String, default: '' },
    pancard:{ type: String, default: '' },
    pancardname:{ type: String, default: '' },
    pancardverified:{ type: Boolean, default: false },
    panInfo:{},
    pancardfrontimages:{ type: String, default: '' },
    pancardbackimages:{ type: String, default: '' },  
    adminremark:{ type: String, default: '' },  
    adminremarkcd:{ type: Date, default: Date.now  },
  },
  { versionKey: false },
  { timestamps: true }
);

KycSchema.index({ otpCode: 1 }, { expireAfterSeconds: 60 });
module.exports = mongoose.model(collectionName, KycSchema, collectionName);
