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
        };

        // Count the total number of documents that match the criteria
        let totalCount = await GameUser.countDocuments(user_wh);

        // Generate a random index within the range of totalCount
        let randomIndex = Math.floor(Math.random() * totalCount);

        // Aggregate pipeline to skip to the random index and limit to 1 document
        let pipeline = [
            { $match: user_wh },
            { $skip: randomIndex },
            { $limit: 1 }
        ];

        // Execute the aggregation pipeline
        let robotInfo = await GameUser.aggregate(pipeline).exec();
        logger.info("Deal JoinRobot ROBOT Info : ", robotInfo)

        if (robotInfo == null) {
            logger.info("JoinRobot ROBOT Not Found  : ");
            return false;
        }

        let up = await GameUser.updateOne({ _id: MongoID(robotInfo[0]._id.toString()) }, { $set: { "isfree": false } });
        logger.info("deal update robot isfree", up);


        dealTableAction.findEmptySeatAndUserSeat(tableInfo, betInfo, { uid: robotInfo[0]._id.toString(), isBot: robotInfo[0].isBot });



    } catch (error) {
        logger.info("Robot Logic Join", error);
    }

}

module.exports = {
    findRoom
}