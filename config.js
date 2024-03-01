require('dotenv').config({});
module.exports = Object.freeze({

  DATABASE: process.env.MONGO_URL,
  // DATABASE: "mongodb+srv://connect2amitu:connect2amitu@cluster0.8rti2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",//Amit account login

  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PWD: process.env.REDIS_PWD,

  ENCRYPTION_TYPE: 'aes-256-cbc',
  ENCRYPTION_ENCODING: 'base64',
  BUFFER_ENCRYPTION: 'utf-8',

  AES_KEY: 'A60A5770FE5E7AB200BA9CFC94E4E8B0',
  AES_IV: '1234567887654321',

  // Flutterwave API KEYS
  FLUTTERWAVE: {
    PUBLIC_KEY: process.env.FLW_PUBLIC_KEY || 'FLWPUBK-76add612d5a07fe6b1ac1a210695c6a4-X',
    SECRET_KEY: process.env.FLW_SECRET_KEY || 'FLWSECK-3c6903f1256cefe44ce994462c8ddcb0-X',
  },

  OBJECT_ID: require('mongoose').Types.ObjectId,

  // HTTP Status
  OK_STATUS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  MEDIA_ERROR_STATUS: 415,
  VALIDATION_FAILURE_STATUS: 417,
  DATABASE_ERROR_STATUS: 422,
  INTERNAL_SERVER_ERROR: 500,

  MIME_TYPES: {
    image: ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/gif'],
  },

  // jwt
  SECRET_KEY: process.env.SECRET_KEY || 'rummy',
  EXPIRED_TIME: '7d',

  // Spenn API key
  API_KEY: process.env.SPENN_API_KEY || 'ameadCntAcaGosB57U4UhLZRn2KG27CMXDCtS+G1Q1jHEEGdeJzfcXTiLlwOxlGMDHidlmU2uEw=',
  // Twilio
  TWILIO_ACCOUNT_SID: 'AC379de81409c3d5b0ec9a1ea3b6cda7d0',
  TWILIO_AUTH_TOKEN: 'd110fbe0856bbf08d4a5cce4717602d2',
  TWILIO_NUMBER: +12543308140, //18482943406,

  SOCKET_CONNECT: 'http://localhost:2828/',

  MAIL_SERVICE: '',
  MAIL_ID: '',
  PASSWORD: '',
});
