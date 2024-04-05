const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const PlayingTables = mongoose.model("playingTable");

const dealTableAction = require("./joinTable");

const logger = require("../../logger");

const findRoom = async (tableInfo, betInfo) => {
    try {

        let RealPlayer = [];
        logger.info("deal rummy BOT call tableInfo playerInfo =>", tableInfo.playerInfo);
        logger.info("deal rummy BOT call tableInfo betInfo =>", betInfo);

        let whereCond = { _id: MongoID(tableInfo._id.toString()) };
        tableInfo = await PlayingTables.findOne(whereCond).lean();
        logger.info("botfunction tabInfo =>", tableInfo);

        tableInfo.playerInfo.forEach(e => {
            logger.info("tableInfo.playerInfo ", e);
            if (e.isBot == false) {
                RealPlayer.push(MongoID(e._id).toString());
            }
        });

        if (RealPlayer.length == 0) {
            logger.info("Real User Length is zero ", RealPlayer.length);
            return false;
        }

        let user_wh = {
            isBot: true,
            isfree: true,
            // "_id": { $nin: RobotPlayer }
        };

        logger.info("JoinRobot ROBOT Not user_wh   : ", user_wh);

        let robotInfo = await GameUser.findOne(user_wh, {});
        // logger.info("JoinRobot ROBOT Info : ", robotInfo);

        if (robotInfo == null) {
            logger.info("JoinRobot ROBOT Not Found  : ");
            return false;
        }

        let up = await GameUser.updateOne({ _id: MongoID(robotInfo._id.toString()) }, { $set: { "isfree": false } });
        logger.info("update robot isfree", up);


        dealTableAction.findEmptySeatAndUserSeat(tableInfo, betInfo, { uid: robotInfo._id.toString(), isBot: robotInfo.isBot });



    } catch (error) {
        logger.info("Robot Logic Join", error);
    }

}

module.exports = {
    findRoom
}