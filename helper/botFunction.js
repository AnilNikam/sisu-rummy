const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const PlayingTables = mongoose.model("playingTable");
const joinTable = require("./rummy/joinTable");
const commandAcions = require('./socketFunctions');

const logger = require("../logger");
const CONST = require("../constant");
const config = require("../config");
var io = require('socket.io-client')
const schedule = require('node-schedule');
const { getRandomNumber } = require("./helperFunction");
var socket = io.connect(config.SOCKET_CONNECT, { reconnect: true });

async function findRoom(tableInfo, betInfo) {
    try {

        let RobotPlayer = []

        logger.info("rummy tableInfo playerInfo =>", tableInfo.playerInfo)

        tableInfo.playerInfo.forEach(e => {
            logger.info("tableInfo.playerInfo ", e)
            if (e.isBot == true) {
                RobotPlayer.push(MongoID(e._id).toString())
            }
        })

        let user_wh = {
            isBot: true,
            "_id": { $nin: RobotPlayer }
        }

        logger.info(" JoinRobot ROBOT Not user_wh   : ", user_wh)


        let robotInfo = await GameUser.findOne(user_wh, {});
        logger.info("JoinRobot ROBOT Info : ", robotInfo)

        if (robotInfo == null) {
            logger.info("JoinRobot ROBOT Not Found  : ")
            return false
        }

        await joinTable.findEmptySeatAndUserSeat(tableInfo, betInfo, { uid: robotInfo._id.toString() });

    } catch (error) {
        logger.info("Robot Logic Join", error);
    }

}

const pic = async (tableInfo, playerId, gamePlayType, deck) => {
    try {
        logger.info("tableInfo, playerId, gamePlayType, deckType", tableInfo, playerId, gamePlayType, deck)

        deck = ['close', 'open'];
        const randomIndex = Math.floor(Math.random() * deck.length);
        const deckType = deck[randomIndex];

        const jobId = `BOTPIC+${tableInfo._id}`;
        let startPicScheduleTime = new Date(Date.now() + 5000);
        // let startPicScheduleTime = Date.now() + getRandomNumber(3000, 6500)
        logger.info("startPicScheduleTime ->", startPicScheduleTime)

        schedule.scheduleJob(jobId, startPicScheduleTime, async () => {
            schedule.cancelJob(jobId);
            logger.info("Bot PIC event call");

            if (tableInfo.playerInfo && tableInfo.playerInfo.length > 0) {
                let playerIndex = tableInfo.playerInfo.findIndex(o => o.seatIndex === tableInfo.currentPlayerTurnIndex);
                logger.info('playerIndex: ', playerIndex);
                if (playerIndex !== -1) {
                    let playerInfo = tableInfo.playerInfo[playerIndex];
                    logger.info('bot player cards => ', playerInfo.cards);
                    let updateData = {
                        $set: {},
                        $inc: {},
                    };
                    /////////////////////////////////////////////////////////////////
                    let pickedCard;
                    if (deckType === 'open') {
                        pickedCard = tableInfo.openDeck.pop();
                        playerInfo.cards.push(pickedCard.toString());

                        if (playerInfo.playerStatus === 'PLAYING') {
                            updateData.$set['playerInfo.$.cards'] = playerInfo.cards;
                            updateData.$set['playerInfo.$.pickedCard'] = pickedCard;
                            updateData.$set['openDeck'] = tableInfo.openDeck;
                        }

                        //Cancel the Scheduele job
                        // commandAcions.clearJob(tabInfo.jobId);

                        const upWh = {
                            _id: MongoID(tableInfo._id.toString()),
                            'playerInfo.seatIndex': Number(playerIndex),
                        };

                        // console.log("pickCard upWh updateData :: ", upWh, updateData);
                        if (playerInfo.turnMissCounter > 0) {
                            playerInfo.turnMissCounter = 0;
                            updateData.$set['playerInfo.' + playerIndex + '.turnMissCounter'] = playerInfo.turnMissCounter;
                        }
                        tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                            new: true,
                        });
                        logger.info('Pic card Open Deck BOT ', tableInfo);
                    } else if (deckType === 'close') {
                        if (tableInfo.closeDeck.length === 0) {
                            let newOpenDeck = tableInfo.openDeck;
                            let newCloseDeck = newOpenDeck.slice(0, newOpenDeck.length - 5);

                            updateData.$set['closeDeck'] = shuffle(newCloseDeck);
                            updateData.$set['openDeck'] = newOpenDeck;

                            let upWh = {
                                _id: MongoID(tableInfo._id.toString()),
                            };

                            let tbl = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                                new: true,
                            });
                            logger.info('check Close Deck ', tbl);
                        }
                        pickedCard = tableInfo.closeDeck.pop();
                        playerInfo.cards.push(pickedCard.toString());

                        if (playerInfo.playerStatus === 'PLAYING') {
                            updateData.$set['playerInfo.$.cards'] = playerInfo.cards;
                            updateData.$set['playerInfo.$.pickedCard'] = pickedCard;
                            updateData.$set['closeDeck'] = tableInfo.closeDeck;
                            updateData.$inc['playerInfo.$.turnCount'] = 1;
                        }

                        const upWh = {
                            _id: MongoID(client.tbid.toString()),
                            'playerInfo.seatIndex': Number(client.seatIndex),
                        };

                        if (playerInfo.turnMissCounter > 0) {
                            playerInfo.turnMissCounter = 0;
                            updateData.$set['playerInfo.' + client.seatIndex + '.turnMissCounter'] = playerInfo.turnMissCounter;
                        }

                        tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                            new: true,
                        });
                    }

                    /////////////////////////////////////////////////////////////////


                    // Use player object as needed

                    // let closeDeckCardIndex;
                    // let closeDeckCard;

                    // closeDeckCardIndex = table.closeDeck.length - 1;
                    // closeDeckCard = table.closeDeck[closeDeckCardIndex];

                    // logger.info('Bot Closed Deck Card Index=> ', closeDeckCardIndex);
                    // logger.info('Bot select Closed Deck Card => ', closeDeckCard);

                    let response = {
                        pickedCard: pickedCard,
                        playerId: playerId,
                        deck: deckType,
                        closedecklength: tableInfo.closeDeck.length,
                    }

                    logger.info('Bot PIC card response  => ', response);
                    commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.PICK_CARD, response);

                } else {
                    logger.info('Player not found with seatIndex: ', tableInfo.currentPlayerTurnIndex);
                }
            } else {
                logger.info('No players found in the table.');
            }

            //DiscCard Logic

            let startDiscScheduleTime = new Date(Date.now() + getRandomNumber(5000, 7500))
            schedule.scheduleJob(`table.tableId${table._id}`, startDiscScheduleTime, async function () {
                try {
                    logger.info("Bot DISCARD event call");

                    //cancel the Schedule
                    schedule.cancelJob(`table.tableId${table._id}`);
                    // console.log("Data ----->", playerId + "****" + gamePlayType + " ***" + table.tableId);
                    let playerIndex = table.playerInfo.findIndex(o => o.playerId === table.currentPlayingPlayerId);
                    let player = table.playerInfo[playerIndex];
                    logger.info('userTurnSet playerIndex,player => ', playerIndex + "Player" + player);
                    // console.log("Player Cards", player.cards);
                    //Select Card for Discard
                    if (player) {
                        let playerCards = player.cards
                        let selectDiscardCard = convertCardPairAndFollowers(playerCards);

                        // logger.info('selectDiscardCard => ', selectDiscardCard);
                        // logger.info('select Discard followers Card => ', selectDiscardCard.followers + ' select Discard followers Card => ' + selectDiscardCard.pair);

                        // const isWinner = checkPairAndFollowers(playerCards);
                        // console.info('isWinner => ', isWinner);

                        const throwCard = selectThrowcard(playerCards, selectDiscardCard.followers, selectDiscardCard.pair)
                        logger.info('DIS throwCard => ', throwCard);

                        let droppedCard = requestData.cardName;
                        let playerInfo = tabInfo.playerInfo[client.seatIndex];
                        let playersCards = playerInfo.cards;

                        const droppedCardIndex = playersCards.indexOf(droppedCard);
                        const disCard = playersCards[droppedCardIndex];

                        playerInfo.cards.splice(droppedCardIndex, 1);

                        //remove picCard
                        playerInfo.pickedCard = '';
                        tabInfo.openDeck.push(disCard);

                        let updateData = {
                            $set: {},
                            $inc: {},
                        };

                        if (playerInfo.playerStatus === 'PLAYING') {
                            updateData.$set['playerInfo.$.cards'] = playerInfo.cards;
                            updateData.$set['playerInfo.$.pickedCard'] = '';
                            updateData.$set['openDeck'] = tabInfo.openDeck;
                        }

                        //cancel Schedule job
                        commandAcions.clearJob(tabInfo.jobId);

                        const upWh = {
                            _id: MongoID(client.tbid.toString()),
                            'playerInfo.seatIndex': Number(client.seatIndex),
                        };

                        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                            new: true,
                        });

                        let response = {
                            playerId: playerInfo._id,
                            disCard: disCard,
                        };


                        commandAcions.sendEventInTable(tb._id.toString(), CONST.DISCARD, response);

                        commandAcions.sendEventInTable(table._id.toString(), CONST.DISCARD, responsee);


                    } else {
                        logger.info('<= Player Not Found => ');

                    }
                } catch (error) {
                    logger.error("Discard or Declare event of BOT", error);
                }
            })

        })
    } catch (error) {
        logger.info("Bot try catch error in bot pic event", error);
    }


}

// const findDeclareCard = (max) => {
//     var min = Math.ceil(0);
//     var max = Math.floor(max);
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const checkCardMatched = (card, checkCard) => {
    try {

        console.info('checkCard => ', checkCard);
        let cardType = []
        let cardNumber = []
        let status = false;
        let checkCardNumber = []

        for (i = 0; i < card.length; i++) {
            const words = card[i].split('-');
            cardType.push(words[0]);
            cardNumber.push(parseInt(words[1]));
        }

        cardNumber.sort(function (a, b) { return a - b });

        let wordsC = checkCard.split('-');
        cardType.push(wordsC[0]);
        checkCardNumber.push(parseInt(wordsC[1]));

        console.log("checkFollowersSequence Cards", card);
        console.log("check Card Number Card--->", checkCardNumber);
        console.log("cardNumber Value==>", cardNumber);

        // check card suit
        for (let i = 0; i < cardNumber.length; i++) {
            // console.log("Card check", cardNumber[i] + "|||" + checkCardNumber);
            if (checkCardNumber[0] === cardNumber[i]) {
                console.log("Card Matched ", cardNumber[i] + "|*****************|" + checkCardNumber);
                status = true;
                console.log("<===== Card Matched ======>");
            }

        }

        if (status == true) {
            console.log("Card Matched or 1 Difference");
        }
        else {
            console.log("Card Not Matched")
        }
        return status;

    } catch (error) {
        logger.info("Card Not Matched")
        return false;
    }
}

const checkCardFoundFollower = (card, checkCard) => {
    try {

        let cardType = []
        let cardNumber = []
        let status = false;
        let checkCardNumber = []

        for (i = 0; i < card.length; i++) {
            const words = card[i].split('-');
            //console.log(words);
            cardType.push(words[0]);
            //console.log("String Value==>", cardType);
            cardNumber.push(parseInt(words[1]));
            //console.log("Integer Value==>",cardNumber);
        }

        console.log("checkFollowersSequence Cards", card);

        if (status == false) {
            for (let i = 0; i < cardNumber.length - 1; i++) {

                var dif = cardNumber[i] - checkCardNumber;

                if (dif == -1 || dif == 1) {
                    status = true;
                }
            }

        }
        if (status == true) {
            console.log("Followers Ready")
        }
        else {
            console.log("Followers NOT Ready")
        }
        return status;
    } catch (error) {
        logger.info("Followers NOT Ready")
        return false;
    }
}

const convertCardPairAndFollowers = (cards) => {
    try {
        let cardType = []
        let cardNumber = []
        let pair = []
        let followers = []
        let dwd = []
        //var intDo=[]

        for (i = 0; i < cards.length; i++) {
            const words = cards[i].split('-');
            //console.log(words);
            cardType.push(words[0]);
            //console.log("String Value==>", cardType);
            cardNumber.push(parseInt(words[1]));
            //console.log("Integer Value==>",cardNumber);
        }
        console.log("checkFollowersSequence Cards", cards);

        dwd = dwd.concat(cardNumber)
        dwd.sort(function (a, b) { return a - b });
        cardNumber.sort(function (a, b) { return a - b });
        console.info('After Copy and dwd => ', dwd);

        for (let i = 0; i < dwd.length - 1; i++) {
            var dif = dwd[i] - dwd[i + 1];
            if (dif == 0) {

                pair.push(dwd[i], dwd[i + 1])
                var idx = cardNumber.indexOf(dwd[i]);
                cardNumber.splice(idx, 2)
                //i++
            } else { }

        }
        for (let i = 0; i < cardNumber.length - 1; i++) {
            var dif = cardNumber[i] - cardNumber[i + 1];
            console.info('dif Followers=> ', dif);

            if (dif !== 0) {
                followers.push(cardNumber[i], cardNumber[i + 1])
                i++;
            } else {
                //dwd.push(cardNumber[i]);
            }

        }

        return {
            followers,
            pair,
            dwd
        };
    } catch (error) {
        logger.error("convertCardPairAndFollowers", error);
    }
}

const checkPairAndFollowers = (card) => {
    let cardType = []
    let cardNumber = []
    let pair = []
    let followers = []
    let dwd = []
    let status = false;
    //var intDo=[]

    for (i = 0; i < card.length; i++) {
        const words = card[i].split('-');
        //console.log(words);
        cardType.push(words[0]);
        //console.log("String Value==>", cardType);
        cardNumber.push(parseInt(words[1]));
        //console.log("Integer Value==>",cardNumber);
    }
    console.log("checkFollowersSequence Cards", card);

    dwd = dwd.concat(cardNumber)
    dwd.sort(function (a, b) { return a - b });
    cardNumber.sort(function (a, b) { return a - b });
    console.info('After Copy and dwd => ', dwd);

    for (let i = 0; i < dwd.length - 1; i++) {
        var dif = dwd[i] - dwd[i + 1];
        if (dif == 0) {

            pair.push(dwd[i], dwd[i + 1])
            var idx = cardNumber.indexOf(dwd[i]);
            cardNumber.splice(idx, 2)
            //i++
        } else { }

    }

    for (let i = 0; i < cardNumber.length; i++) {

        if (cardNumber[i] > 10) {
            cardNumber[i] = cardNumber[i] + 10
        }
    }

    for (let i = 0; i < cardNumber.length - 1; i++) {
        var dif = cardNumber[i] - cardNumber[i + 1];
        console.info('dif Followers=> ', dif);

        if (cardNumber[i] > 10) {
            if (dif == -1 || dif == -2) {
                followers.push(cardNumber[i], cardNumber[i + 1])
                var idx = cardNumber.indexOf(dwd[i]);
                cardNumber.splice(idx, 2)
            }
        } else if (dif == -1) {
            followers.push(cardNumber[i], cardNumber[i + 1])
            var idx = cardNumber.indexOf(dwd[i]);
            cardNumber.splice(idx, 2)
            // i++;
        } else {
            //dwd.push(cardNumber[i]);
        }

    }



    console.info('<= pair => ', pair);
    console.info('<= followers => ', followers);

    for (let i = 0; i < pair.length - 1; i++) {
        var dif = pair[i] - pair[i + 1];
        // console.log("dif =>", dif)
        if (dif == 0) {
            // console.log("Check Seqence Value Of True => " + dif)
            status = true;
        }
        else {
            // allCards = [...gcard.impure, ...gcard.set, ...gcard.dwd].flat(Infinity);
            // console.log("Check Seqence Value Of False=>" + dif)
            status = false;
            break;
        }
    }

    if (status == true) {
        if (followers.length == 2) {
            followers.sort(function (a, b) { return a - b });
            for (let i = 0; i < followers.length - 1; i++) {
                if (followers[i] > 10) {
                    followers[i] = followers[i] + 10
                }
            }
            console.log("after adding 10+ -->");

            for (let i = 0; i < followers.length - 1; i++) {

                let dif = followers[i] - followers[i + 1];

                if (followers[i] === 10 && followers[i + 1] === 11) {
                    status = false;
                    break;
                }
                if (followers[i] > 10) {
                    if (dif == -1 || dif == -2) {
                        status = true;
                    }
                } else if (dif == -1) {
                    status = true;
                }


            }
        } else {
            status = false;
        }
    }

    if (status) {
        console.log("Winner Ready")
    }
    else {
        console.log("Winner NOT Ready")
    }
    return {
        ...convertCardPairAndFollowers(card),
        status
    };
}

const selectThrowcard = (playerCards, followersCard, pair) => {
    let throwCard = ""
    console.info('followersCard.length => ', followersCard.length + "| followersCard |" + followersCard);

    if (followersCard.length !== 0) {
        console.info('Thorw card select by followers=> ');
        for (let i = 0; i < playerCards.length; i++) {

            let facevalue = parseInt(playerCards[i].split("-")[1]);

            if (followersCard.indexOf(facevalue) >= 0) {
                throwCard = playerCards[i]
                break;
            }
        }
    } else {
        console.info('Thorw card select by pair=> ');
        for (let i = 0; i < playerCards.length; i++) {
            let facevalue = parseInt(playerCards[i].split("-")[1]);

            if (pair.indexOf(facevalue) >= 0) {
                throwCard = playerCards[i]
                break;
            }
        }
    }
    console.info('Select throw Card => ', throwCard);

    return throwCard;
}

module.exports = {
    findRoom,
    pic,
    checkCardMatched,
    checkCardFoundFollower,
}
