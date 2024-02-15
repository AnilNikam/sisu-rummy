const mongoose = require('mongoose');

const User = mongoose.model('users');
const Admin = mongoose.model('admin');
const Wallet = mongoose.model('wallets');
const BetLists = mongoose.model('betLists');
const PoolBetLists = mongoose.model('poolbetLists');
const DealBetLists = mongoose.model('dealbetLists');
const ProblemReport = mongoose.model('problemReport');
const bcrypt = require('bcrypt');
const logger = require('../logger');


const usersHelper = {
  registerAdmin: async function (newData) {
    const newUser = new Admin(newData);
    const data = await newUser.save();

    if (data) {
      return {
        status: 1,
        message: 'record added',
        data: JSON.parse(JSON.stringify(data)),
      };
    } else {
      return { status: 0, message: 'record not added', data: null };
    }
  },

  registerUser: async function (newData) {
    console.log("newData ",newData)
    const newUser = new User(newData);

    const data = await newUser.save();

    if (data) {
      return {
        status: 1,
        message: 'record added',
        data: JSON.parse(JSON.stringify(data)),
      };
    } else {
      return { status: 0, message: 'record not added', data: null };
    }
  },

  forgotPassword: function (data) {
    logger.info('function called => ', data);
    return data;
  },

  autologin: async function (model, condition = {}) {
    try {
      const data = await model.findOne(condition).lean();

      if (data !== null) {
        return { status: 1, message: 'Login Succesfully', data };
      } else {
        return { status: 0, message: 'Id not Found' };
      }
    } catch (error) {
      return { status: 0, message: 'No data found' };
    }
  },

  login: async function (model, condition = {}) {
    const { email /*, password, */ } = condition;
    try {
      const dataF = await model.find(email).lean();
      bcrypt.compare();

      if (dataF !== null) {
        return { status: 1, message: 'Login Succesfully', data: dataF };
      } else {
        return { status: 0, message: 'Id not Found' };
      }
    } catch (error) {
      return { status: 0, message: 'No data found' };
    }
  },

  betLists: async function (newData) {
    logger.info(' batLists table newData => ', newData);

    const newUser = new BetLists(newData);
    const data = await newUser.save();

    if (data) {
      return {
        status: 1,
        message: 'record added',
        data: JSON.parse(JSON.stringify(data)),
      };
    } else {
      return { status: 0, message: 'record not added', data: null };
    }
  },

  poolBetLists: async function (newData) {
    logger.info(' Pool bat Lists table newData => ', newData);

    const newUser = new PoolBetLists(newData);
    const data = await newUser.save();

    if (data) {
      return {
        status: 1,
        message: 'record added',
        data: JSON.parse(JSON.stringify(data)),
      };
    } else {
      return { status: 0, message: 'record not added', data: null };
    }
  },

  dealBetLists: async function (newData) {
    logger.info(' Deal bat Lists table newData => ', newData);

    const newUser = new DealBetLists(newData);
    const data = await newUser.save();

    if (data) {
      return {
        status: 1,
        message: 'record added',
        data: JSON.parse(JSON.stringify(data)),
      };
    } else {
      return { status: 0, message: 'record not added', data: null };
    }
  },

  createProblemReprot: async function (newData) {
    const newUser = new ProblemReport(newData);
    const data = await newUser.save();

    if (data) {
      return {
        status: 1,
        message: 'record added',
        data: JSON.parse(JSON.stringify(data)),
      };
    } else {
      return { status: 0, message: 'record not added', data: null };
    }
  },

  wallet: async function (newData) {
    logger.info(' wallet table newData => ', newData);

    const newUser = new Wallet(newData);
    const data = await newUser.save();

    if (data) {
      return {
        status: 1,
        message: 'record added',
        data: JSON.parse(JSON.stringify(data)),
      };
    } else {
      return { status: 0, message: 'record not added', data: null };
    }
  },

};

module.exports = usersHelper;
