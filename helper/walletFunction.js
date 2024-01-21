const mongoose = require('mongoose');
const Wallet = mongoose.model('wallets');
const Transaction = mongoose.model('Transaction');
const Users = mongoose.model('users');
const MongoID = mongoose.Types.ObjectId;

const logger = require('../logger');
const commonHelper = require('./commonHelper');

// Create Transaction
module.exports.createTransaction = async (userId, id, reference, status, type, currency, amount, name, email, phoneNumber, gatewayType) => {
  try {
    // create transaction
    const transaction = await Transaction.create({
      userId,
      transactionId: id,
      reference,
      type,
      name,
      email,
      phone: phoneNumber,
      amount,
      currency,
      paymentStatus: status,
      paymentGateway: gatewayType, // "flutterwave",
    });
    logger.info(' ==> create Transaction transaction => ', transaction);
    return transaction;
  } catch (error) {
    logger.error('walletFunction.js createTransaction error => ', error);
  }
};

// Update wallet
module.exports.updateWallet = async (payload) => {
  logger.info(' Check payload =>', payload);
  try {
    let { playerId, coin } = payload;
    logger.info(' Check payload  playerId  =>', playerId);
    logger.info(' Check payload  coin  =>', coin);

    let updateData = {
      $set: {},
      $inc: {},
    };

    const query = {
      _id: MongoID(playerId),
    };
    updateData.$inc['chips'] = coin;

    // update wallet
    const wallet = await Users.findOneAndUpdate(query, updateData, {
      new: true,
    });
    logger.info(' ==> update Wallet Chips => ', wallet);
    let response = {
      chips: Number(wallet.chips.toFixed(2)),
      coin: coin,
    };
    logger.info('Update Balance Response : ', response);

    return response;
  } catch (error) {
    logger.error('walletFunction.js updateWallet error => ', error);
    return error;
  }
};

module.exports.getPaymentHistory = async (obj) => {
  logger.info('getPaymentHistory obj => ', obj);
  const { playerId } = obj;
  try {
    const transactions = await Transaction.find({
      userId: commonHelper.strToMongoDb(playerId),
    }).sort({ createdAt: -1 });

    // logger.info("getPaymentHistory transactions => ", transactions);
    let TransactionData = [];
    transactions.forEach((element) => {
      TransactionData.push({
        // "paymentStatus": element.paymentStatus,
        transactionId: element.transactionId || 'N/A',
        amount: element.amount,
        type: element.type,
        paymentStatus: element.paymentStatus,
        paymentMode: element.paymentGateway,
        date: element.createdAt.getDate() + '/' + (element.createdAt.getMonth() + 1) + '/' + element.createdAt.getFullYear(),
        time: element.createdAt.getHours() + ':' + element.createdAt.getMinutes() + ':' + element.createdAt.getSeconds(),
      });
    });
    // logger.info("getPaymentHistory TransactionData => ", TransactionData);
    const userWalletData = await Wallet.findOne({
      userId: commonHelper.strToMongoDb(playerId),
    });
    logger.info('USER_UPDATE_PROFILE userWallet => ', userWalletData);

    if (userWalletData) {
      let response = {
        th: TransactionData,
        db: Number(userWalletData.balance.toFixed(2)),
        // wb: userWalletData.winningAmount,
        // tw: userWalletData.balance + userWalletData.winningAmount,
      };
      logger.info('wlletFunction.js getPaymentHistory Response : ', response);
      // sendDirectEvent(socket.id, CONST.PLAYER_PAYMENT_HISTORY, response);
      return response;
    } else {
      logger.info('wlletFunction.js at 115getPaymentHistory not found walletData : ', userWalletData);
      return;
    }
  } catch (error) {
    logger.error('walletTrackTransaction getPaymentHistory', error);
  }
};

module.exports.withdrawUpdateWallet = async (userId, amount) => {
  try {
    // update wallet
    const wallet = await Wallet.findOneAndUpdate({ userId }, { $inc: { balance: Number(-amount) } }, { new: true });

    logger.info(' ==> update Wallet wallet => ', wallet);
    let response = {
      db: Number(wallet.balance.toFixed(2)),
      // wb: wallet.winningAmount,
      // tw: wallet.balance + wallet.winningAmount,
    };

    // logger.info("Update Balance Response : ", response);
    return response;
  } catch (error) {
    logger.error('walletFunction.js withdrawUpdateWallet error => ', error);
  }
};
