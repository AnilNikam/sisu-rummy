const mongoose = require('mongoose');
const Notification = mongoose.model('notifications');

const logger = require('../logger');
const notificationsHelper = {};

notificationsHelper.insert = async (newData) => {
  logger.info('notificationsHelper.insert', newData);
  try {
    const newObj = new Notification(newData);
    const data = await newObj.save();

    if (data) {
      return {
        status: 1,
        message: 'notification added',
        data: JSON.parse(JSON.stringify(data)),
      };
    } else {
      return { status: 0, message: 'notification not added', data: null };
    }
  } catch (error) {
    return { status: 0, message: 'Something went wrong', error };
  }
};

notificationsHelper.findOneAndUpdate = async (condition = {}) => {
  try {
    const data = await Notification.findOneAndUpdate(condition);
    if (data !== null) {
      return { status: 1, message: 'Data found', data };
    } else {
      return { status: 0, message: 'No data found' };
    }
  } catch (error) {
    return { status: 0, message: 'No data found' };
  }
};

notificationsHelper.find = async (condition = {}) => {
  try {
    const data = await Notification.find(condition).sort({ createdAt: -1 });
    if (data !== null) {
      return { status: 1, message: 'Data found', data };
    } else {
      return { status: 0, message: 'No data found' };
    }
  } catch (error) {
    return { status: 0, message: 'No data found' };
  }
};

notificationsHelper.findOne = async (condition = {}) => {
  try {
    const data = await Notification.findOne(condition);
    if (data !== null) {
      return { status: 1, message: 'Data found', data };
    } else {
      return { status: 0, message: 'No data found' };
    }
  } catch (error) {
    return { status: 0, message: 'No data found' };
  }
};

notificationsHelper.deleteOne = async (condition = {}) => {
  try {
    const data = await Notification.deleteOne(condition).lean();
    if (data !== null) {
      return { status: 1, message: 'Data Deleted', data };
    } else {
      return { status: 0, message: 'No data Deleted' };
    }
  } catch (error) {
    return { status: 0, message: 'No data found' };
  }
};

module.exports = notificationsHelper;
