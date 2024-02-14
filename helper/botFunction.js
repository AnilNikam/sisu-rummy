const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const PlayingTables = mongoose.model("playingTable");
const joinTable = require("./rummy/joinTable");
const commandAcions = require('./socketFunctions');
const _ = require("underscore");
const logger = require("../logger");
const CONST = require("../constant");
const config = require("../config");
let io = require('socket.io-client')
const schedule = require('node-schedule');
const { getRandomNumber } = require("./helperFunction");
const roundStartActions = require('./rummy/roundStart');
const checkWinnerActions = require('./rummy/checkWinner');


let socket = io.connect(config.SOCKET_CONNECT, { reconnect: true });

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

const picOld = async (tableInfo, playerId, gamePlayType, deck) => {
    try {
        logger.info("tableInfo, playerId, gamePlayType, deckType", tableInfo, playerId, gamePlayType, deck)

        deck = ['close', 'open'];
        const randomIndex = Math.floor(Math.random() * deck.length);
        const deckType = deck[randomIndex];
        logger.info("open card deck Type ->", deckType, typeof deckType)

        const jobId = `BOTPIC+${tableInfo._id}`;
        let startPicScheduleTime = new Date(Date.now() + 5000);
        // let startPicScheduleTime = Date.now() + getRandomNumber(3000, 6500)
        logger.info("startPicScheduleTime ->", startPicScheduleTime)

        let playerIndex = tableInfo.playerInfo.findIndex(o => o.seatIndex === tableInfo.currentPlayerTurnIndex);
        logger.info('bot playerIndex: ', playerIndex);
        let pickedCard;

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
                    // let pickedCard;
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
                        // Use player object as needed

                        // let closeDeckCardIndex;
                        // let closeDeckCard;

                        // closeDeckCardIndex = table.closeDeck.length - 1;
                        // closeDeckCard = table.closeDeck[closeDeckCardIndex];

                        // logger.info('Bot Closed Deck Card Index=> ', closeDeckCardIndex);
                        // logger.info('Bot select Closed Deck Card => ', closeDeckCard);

                        pickedCard = tableInfo.closeDeck.pop();
                        logger.info("close deck picked card ->", pickedCard)
                        playerInfo.cards.push(pickedCard.toString());

                        if (playerInfo.playerStatus === 'PLAYING') {
                            updateData.$set['playerInfo.$.cards'] = playerInfo.cards;
                            updateData.$set['playerInfo.$.pickedCard'] = pickedCard;
                            updateData.$set['closeDeck'] = tableInfo.closeDeck;
                            updateData.$inc['playerInfo.$.turnCount'] = 1;
                        }

                        const upWh = {
                            _id: MongoID(tableInfo._id.toString()),
                            'playerInfo.seatIndex': Number(playerIndex),
                        };


                        tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                            new: true,
                        });

                        logger.info('Pic card Close Deck BOT ', tableInfo);

                    }

                    /////////////////////////////////////////////////////////////////



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
            // let qu = {
            //     _id: MongoID(tableInfo._id.toString()),
            // }
            // tableInfo = await PlayingTables.findOne(qu).lean;
            logger.info("find before discard table info", tableInfo);

            /*
            let playerInfo = tableInfo.playerInfo[playerIndex];

            // Bot Win Logic
            //Cancel the Scheduele job
            commandAcions.clearJob(tableInfo.jobId);

            let ress = checkWinCard(tableInfo.closeDeck, tableInfo.wildCard)
            console.log("ressss-->", ress);
            let updateData1 = {
                $set: {},
                $inc: {},
            };
            const upWh1 = {
                _id: MongoID(tableInfo._id.toString()),
                'playerInfo.seatIndex': Number(playerIndex),
            };
            updateData1.$set['playerInfo.$.gCard'] = ress;

            tableInfo = await PlayingTables.findOneAndUpdate(upWh1, updateData1, {
                new: true,
            });

            let response = {
                playerId: playerId,
                disCard: pickedCard,
            };

            const upWh2 = {
                _id: MongoID(tableInfo._id.toString()),
                'playerInfo.seatIndex': Number(playerIndex),
            };

            const updateData2 = {
                $set: {
                    discardCard: pickedCard,
                },
            };

            const tbl = await PlayingTables.findOneAndUpdate(upWh2, updateData2, {
                new: true,
            });
            logger.info('Declare tbl : ', tbl);

            commandAcions.sendEventInTable(tbl._id.toString(), CONST.DECLARE, response);

            commandAcions.sendEventInTable(tbl._id.toString(), CONST.DECLARE_TIMER_SET, { pi: playerId });

            delete client.declare;

            let roundTime = CONST.finishTimer;
            let tableId = tbl._id;
            let finishJobId = CONST.DECLARE_TIMER_SET + ':' + tableId;
            let delay = commandAcions.AddTime(roundTime);

            await commandAcions.setDelay(finishJobId, new Date(delay));

            //update user game finish status
            let updateStatus = {
                $set: {},
                $inc: {},
            };
            updateStatus.$set['playerInfo.$.finished'] = true;

            const qr = {
                _id: MongoID(tbl._id.toString()),
                'playerInfo.seatIndex': Number(playerIndex),
            };
            //logger.info('playerFinishDeclare Finish upWh :: ->  ', upWh, '\n player Finish upWh updateData :: -> ', updateData);

            const tabl = await PlayingTables.findOneAndUpdate(qr, updateStatus, {
                new: true,
            });

            logger.info('check status ==> and Table ', tabl);

            await checkWinnerActions.winnercall(tabl, { seatIndex: playerIndex });
            //finish Bot win logic
*/
            let startDiscScheduleTime = new Date(Date.now() + getRandomNumber(5000, 7500))
            schedule.scheduleJob(`table.tableId${tableInfo._id}`, startDiscScheduleTime, async function () {
                try {
                    logger.info("Bot DISCARD event call");

                    //cancel the Schedule
                    schedule.cancelJob(`table.tableId${tableInfo._id}`);
                    // console.log("Data ----->", playerId + "****" + gamePlayType + " ***" + table.tableId);
                    let playerIndex = tableInfo.playerInfo.findIndex(o => o.seatIndex === tableInfo.currentPlayerTurnIndex);
                    let player = tableInfo.playerInfo[playerIndex];
                    logger.info('userTurnSet playerIndex,player => ', playerIndex + "Player" + player);
                    logger.info("DISCARD Player Cards", player.cards);

                    //Select Card for Discard
                    if (player) {
                        let playerCards = player.cards

                        const randomIndex = Math.floor(Math.random() * playerCards.length);
                        const throwCard = playerCards[randomIndex];

                        // let selectDiscardCard = convertCardPairAndFollowers(playerCards);

                        // logger.info('selectDiscardCard => ', selectDiscardCard);
                        // logger.info('select Discard followers Card => ', selectDiscardCard.followers + ' select Discard followers Card => ' + selectDiscardCard.pair);

                        // const isWinner = checkPairAndFollowers(playerCards);
                        // console.info('isWinner => ', isWinner);

                        // const throwCard = selectThrowcard(playerCards, selectDiscardCard.followers, selectDiscardCard.pair)
                        logger.info('DIS throwCard => ', throwCard);

                        let droppedCard = throwCard//requestData.cardName;
                        let playerInfo = tableInfo.playerInfo[playerIndex];
                        let playersCards = playerInfo.cards;

                        const droppedCardIndex = playersCards.indexOf(droppedCard);
                        const disCard = playersCards[droppedCardIndex];

                        playerInfo.cards.splice(droppedCardIndex, 1);

                        //remove picCard
                        playerInfo.pickedCard = '';
                        tableInfo.openDeck.push(disCard);

                        let updateData = {
                            $set: {},
                            $inc: {},
                        };

                        if (playerInfo.playerStatus === 'PLAYING') {
                            updateData.$set['playerInfo.$.cards'] = playerInfo.cards;
                            updateData.$set['playerInfo.$.pickedCard'] = '';
                            updateData.$set['openDeck'] = tableInfo.openDeck;
                        }

                        //cancel Schedule job
                        commandAcions.clearJob(tableInfo.jobId);

                        const upWh = {
                            _id: MongoID(tableInfo._id.toString()),
                            'playerInfo.seatIndex': Number(playerIndex),
                        };

                        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                            new: true,
                        });

                        logger.info("final discard table =>", tb);

                        let responsee = {
                            playerId: playerInfo._id,
                            disCard: disCard,
                        };


                        commandAcions.sendEventInTable(tb._id.toString(), CONST.DISCARD, responsee);


                        let re = await roundStartActions.nextUserTurnstart(tb);


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

const pic = async (tableInfo, playerId, gamePlayType, deck) => {
    try {
        logger.info("tableInfo, playerId, gamePlayType, deckType", tableInfo, playerId, gamePlayType, deck)

        deck = ['close', 'open'];
        const randomIndex = Math.floor(Math.random() * deck.length);
        const deckType = deck[randomIndex];
        logger.info("open card deck Type ->", deckType, typeof deckType)

        const jobId = `BOTPIC+${tableInfo._id}`;
        let startPicScheduleTime = new Date(Date.now() + 5000);
        // let startPicScheduleTime = Date.now() + getRandomNumber(3000, 6500)
        logger.info("startPicScheduleTime ->", startPicScheduleTime)

        let playerIndex = tableInfo.playerInfo.findIndex(o => o.seatIndex === tableInfo.currentPlayerTurnIndex);
        logger.info('bot playerIndex: ', playerIndex);
        let pickedCard;

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
                    // let pickedCard;
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
                        // Use player object as needed

                        // let closeDeckCardIndex;
                        // let closeDeckCard;

                        // closeDeckCardIndex = table.closeDeck.length - 1;
                        // closeDeckCard = table.closeDeck[closeDeckCardIndex];

                        // logger.info('Bot Closed Deck Card Index=> ', closeDeckCardIndex);
                        // logger.info('Bot select Closed Deck Card => ', closeDeckCard);

                        pickedCard = tableInfo.closeDeck.pop();
                        logger.info("close deck picked card ->", pickedCard)
                        playerInfo.cards.push(pickedCard.toString());

                        if (playerInfo.playerStatus === 'PLAYING') {
                            updateData.$set['playerInfo.$.cards'] = playerInfo.cards;
                            updateData.$set['playerInfo.$.pickedCard'] = pickedCard;
                            updateData.$set['closeDeck'] = tableInfo.closeDeck;
                            updateData.$inc['playerInfo.$.turnCount'] = 1;
                        }

                        const upWh = {
                            _id: MongoID(tableInfo._id.toString()),
                            'playerInfo.seatIndex': Number(playerIndex),
                        };


                        tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                            new: true,
                        });

                        logger.info('Pic card Close Deck BOT ', tableInfo);

                    }

                    /////////////////////////////////////////////////////////////////



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
            // let qu = {
            //     _id: MongoID(tableInfo._id.toString()),
            // }
            // tableInfo = await PlayingTables.findOne(qu).lean;
            logger.info("find before discard table info", tableInfo);

            /*
            let playerInfo = tableInfo.playerInfo[playerIndex];

            // Bot Win Logic
            //Cancel the Scheduele job
            commandAcions.clearJob(tableInfo.jobId);

            let ress = checkWinCard(tableInfo.closeDeck, tableInfo.wildCard)
            console.log("ressss-->", ress);
            let updateData1 = {
                $set: {},
                $inc: {},
            };
            const upWh1 = {
                _id: MongoID(tableInfo._id.toString()),
                'playerInfo.seatIndex': Number(playerIndex),
            };
            updateData1.$set['playerInfo.$.gCard'] = ress;

            tableInfo = await PlayingTables.findOneAndUpdate(upWh1, updateData1, {
                new: true,
            });

            let response = {
                playerId: playerId,
                disCard: pickedCard,
            };

            const upWh2 = {
                _id: MongoID(tableInfo._id.toString()),
                'playerInfo.seatIndex': Number(playerIndex),
            };

            const updateData2 = {
                $set: {
                    discardCard: pickedCard,
                },
            };

            const tbl = await PlayingTables.findOneAndUpdate(upWh2, updateData2, {
                new: true,
            });
            logger.info('Declare tbl : ', tbl);

            commandAcions.sendEventInTable(tbl._id.toString(), CONST.DECLARE, response);

            commandAcions.sendEventInTable(tbl._id.toString(), CONST.DECLARE_TIMER_SET, { pi: playerId });

            delete client.declare;

            let roundTime = CONST.finishTimer;
            let tableId = tbl._id;
            let finishJobId = CONST.DECLARE_TIMER_SET + ':' + tableId;
            let delay = commandAcions.AddTime(roundTime);

            await commandAcions.setDelay(finishJobId, new Date(delay));

            //update user game finish status
            let updateStatus = {
                $set: {},
                $inc: {},
            };
            updateStatus.$set['playerInfo.$.finished'] = true;

            const qr = {
                _id: MongoID(tbl._id.toString()),
                'playerInfo.seatIndex': Number(playerIndex),
            };
            //logger.info('playerFinishDeclare Finish upWh :: ->  ', upWh, '\n player Finish upWh updateData :: -> ', updateData);

            const tabl = await PlayingTables.findOneAndUpdate(qr, updateStatus, {
                new: true,
            });

            logger.info('check status ==> and Table ', tabl);

            await checkWinnerActions.winnercall(tabl, { seatIndex: playerIndex });
            //finish Bot win logic
*/
            let startDiscScheduleTime = new Date(Date.now() + getRandomNumber(5000, 7500))
            schedule.scheduleJob(`table.tableId${tableInfo._id}`, startDiscScheduleTime, async function () {
                try {
                    logger.info("Bot DISCARD event call");

                    //cancel the Schedule
                    schedule.cancelJob(`table.tableId${tableInfo._id}`);
                    // console.log("Data ----->", playerId + "****" + gamePlayType + " ***" + table.tableId);
                    let playerIndex = tableInfo.playerInfo.findIndex(o => o.seatIndex === tableInfo.currentPlayerTurnIndex);
                    let player = tableInfo.playerInfo[playerIndex];
                    logger.info('userTurnSet playerIndex,player => ', playerIndex + "Player" + player);
                    logger.info("DISCARD Player Cards", player.cards);

                    //Select Card for Discard
                    if (player) {
                        let playerCards = player.cards

                        const randomIndex = Math.floor(Math.random() * playerCards.length);
                        const throwCard = playerCards[randomIndex];

                        // let selectDiscardCard = convertCardPairAndFollowers(playerCards);

                        // logger.info('selectDiscardCard => ', selectDiscardCard);
                        // logger.info('select Discard followers Card => ', selectDiscardCard.followers + ' select Discard followers Card => ' + selectDiscardCard.pair);

                        // const isWinner = checkPairAndFollowers(playerCards);
                        // console.info('isWinner => ', isWinner);

                        // const throwCard = selectThrowcard(playerCards, selectDiscardCard.followers, selectDiscardCard.pair)
                        logger.info('DIS throwCard => ', throwCard);

                        let droppedCard = throwCard//requestData.cardName;
                        let playerInfo = tableInfo.playerInfo[playerIndex];
                        let playersCards = playerInfo.cards;

                        const droppedCardIndex = playersCards.indexOf(droppedCard);
                        const disCard = playersCards[droppedCardIndex];

                        playerInfo.cards.splice(droppedCardIndex, 1);

                        //remove picCard
                        playerInfo.pickedCard = '';
                        tableInfo.openDeck.push(disCard);

                        let updateData = {
                            $set: {},
                            $inc: {},
                        };

                        if (playerInfo.playerStatus === 'PLAYING') {
                            updateData.$set['playerInfo.$.cards'] = playerInfo.cards;
                            updateData.$set['playerInfo.$.pickedCard'] = '';
                            updateData.$set['openDeck'] = tableInfo.openDeck;
                        }

                        //cancel Schedule job
                        commandAcions.clearJob(tableInfo.jobId);

                        const upWh = {
                            _id: MongoID(tableInfo._id.toString()),
                            'playerInfo.seatIndex': Number(playerIndex),
                        };

                        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                            new: true,
                        });

                        logger.info("final discard table =>", tb);

                        let responsee = {
                            playerId: playerInfo._id,
                            disCard: disCard,
                        };


                        commandAcions.sendEventInTable(tb._id.toString(), CONST.DISCARD, responsee);


                        let re = await roundStartActions.nextUserTurnstart(tb);


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
//     let min = Math.ceil(0);
//     let max = Math.floor(max);
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

                let dif = cardNumber[i] - checkCardNumber;

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
    logger.info("convertCardPairAndFollowers cards =>", cards)
    try {
        let cardType = []
        let cardNumber = []
        let pure = []
        let impure = []
        let set = []
        let dwd = []
        //let intDo=[]

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
            let dif = dwd[i] - dwd[i + 1];
            if (dif == 0) {

                pair.push(dwd[i], dwd[i + 1])
                let idx = cardNumber.indexOf(dwd[i]);
                cardNumber.splice(idx, 2)
                //i++
            } else { }

        }
        for (let i = 0; i < cardNumber.length - 1; i++) {
            let dif = cardNumber[i] - cardNumber[i + 1];
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
    //let intDo=[]

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
        let dif = dwd[i] - dwd[i + 1];
        if (dif == 0) {

            pair.push(dwd[i], dwd[i + 1])
            let idx = cardNumber.indexOf(dwd[i]);
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
        let dif = cardNumber[i] - cardNumber[i + 1];
        console.info('dif Followers=> ', dif);

        if (cardNumber[i] > 10) {
            if (dif == -1 || dif == -2) {
                followers.push(cardNumber[i], cardNumber[i + 1])
                let idx = cardNumber.indexOf(dwd[i]);
                cardNumber.splice(idx, 2)
            }
        } else if (dif == -1) {
            followers.push(cardNumber[i], cardNumber[i + 1])
            let idx = cardNumber.indexOf(dwd[i]);
            cardNumber.splice(idx, 2)
            // i++;
        } else {
            //dwd.push(cardNumber[i]);
        }

    }



    console.info('<= pair => ', pair);
    console.info('<= followers => ', followers);

    for (let i = 0; i < pair.length - 1; i++) {
        let dif = pair[i] - pair[i + 1];
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

const checkWinCard = (deck, wildCard) => {
    const jokers = ['J-0-0', 'J-1-1']
    const generatePureSequence = (deck) => {
        const suits = ['H', 'D', 'S', 'C']; // Hearts, Diamonds, Spades, Clubs
        const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']; // Card values

        // Shuffle the deck
        const shuffledDeck = shuffleArray(deck);

        // Choose a random suit
        const randomSuit = suits[Math.floor(Math.random() * suits.length)];

        // Filter cards with the chosen suit
        const suitCards = shuffledDeck.filter(card => card.startsWith(randomSuit));

        // Sort the suit cards based on their values
        suitCards.sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));

        // Check if there are at least three consecutive cards in the suit
        for (let i = 0; i <= suitCards.length - 3; i++) {
            const sequence = suitCards.slice(i, i + 3);
            const valuesDiff = sequence.map(card => parseInt(card.split('-')[1]) - 1);
            const isConsecutive = valuesDiff.every((val, index) => val === parseInt(sequence[0].split('-')[1]) - 1 + index);
            if (isConsecutive) {
                return sequence;
            }
        }

        // If no consecutive sequence found, try again
        return generatePureSequence(deck);
    };

    // Function to generate an impure sequence
    const generateImpureSequence = (deck, joker) => {
        const suits = ['H', 'D', 'S', 'C']; // Hearts, Diamonds, Spades, Clubs

        // Shuffle the deck
        const shuffledDeck = shuffleArray(deck);

        // Choose a random suit
        const randomSuit = suits[Math.floor(Math.random() * suits.length)];

        // Filter cards with the chosen suit
        const suitCards = shuffledDeck.filter(card => card.startsWith(randomSuit));

        // Sort the suit cards based on their values
        suitCards.sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));

        // Choose two cards randomly from the suit cards
        const chosenCards = [suitCards[0], suitCards[1]];

        // Insert the joker at a random position
        const randomIndex = Math.floor(Math.random() * 3);
        chosenCards.splice(randomIndex, 0, joker);

        return chosenCards;
    };

    // Function to generate a set
    // Function to generate a set
    const generateSet = (deck) => {
        // Shuffle the deck
        const shuffledDeck = shuffleArray(deck);

        // Choose a random rank (value)
        const randomRank = Math.floor(Math.random() * 13) + 1; // Random number from 1 to 13 representing card ranks

        // Choose three cards of the same rank from different suits
        const set = [];

        // Loop through the shuffled deck to find three cards of the chosen rank from different suits
        for (let i = 0; i < shuffledDeck.length; i++) {
            const card = shuffledDeck[i];
            const rank = parseInt(card.split('-')[1]);

            if (rank === randomRank && set.length < 3) {
                set.push(card);
            }
        }

        // If less than three cards of the same rank are found, try again recursively
        if (set.length < 3) {
            return generateSet(deck);
        }

        return set;
    };


    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Generate sequences
    const pureSequence = generatePureSequence(deck);
    const impureSequences = jokers.map(joker => generateImpureSequence(deck, joker));
    const cardSet = generateSet(deck);

    // Output the generated sequences
    const sequences = {
        pure: [pureSequence],
        impure: impureSequences,
        set: [cardSet]
    };
    return sequences
}

const findIndexesTeen = (cards, joker) => {
    let cardCount = {};
    console.log("CARDS :::::::::", cards)

    let jokers = cards.filter(item => item.startsWith("J") || parseInt(item.split("-")[1]) == joker);
    console.log("jokers.length", jokers)
    cards = _.difference(cards, jokers)

    for (const card of cards) {
        const index = card.split('-')[1];
        if (cardCount[`0${index}`]) {
            cardCount[`0${index}`].push(card);
        } else {
            cardCount[`0${index}`] = [card];
        }
    }
    console.log("cardCount *-*-*-*-* ", cardCount)

    let sortedArray = Object.entries(cardCount);
    sortedArray.sort((a, b) => b[1].length - a[1].length);
    // let sortedObject = {};
    for (let [key, value] of sortedArray) {
        // console.log(key, " ", value)
        cardCount[key] = value;
    }

    // console.log("sortedObject 555555555555555555555555555555555555555", cardCount)


    if (jokers.length > 0) {
        for (let key in cardCount) {
            if (cardCount[key].length < 3) {
                let jokersNeeded = 3 - cardCount[key].length;
                for (let i = 0; i < jokersNeeded; i++) {
                    if (jokers.length > 0) {
                        cardCount[key].push(jokers.shift());
                    }
                }
            }
        }
    } else {


    }
    let repeatedIndexes = Object.keys(cardCount).filter(index => cardCount[index].length >= 3);

    // console.log(" repeat++++++++++edIndexes ........... ", repeatedIndexes)


    if (repeatedIndexes.length > 0) {
        repeatedIndexes = repeatedIndexes.map(index => cardCount[index]);
    }
    // console.log(" repeat edIndexes ........... ", repeatedIndexes)
    return repeatedIndexes;
}

const findPureSequences = (cards) => {

    //pure seq
    // Sort the cards based on suit and rank
    cards.sort((a, b) => {
        const suitA = a.split('-')[0];
        const suitB = b.split('-')[0];
        const rankA = parseInt(a.split('-')[1]);
        const rankB = parseInt(b.split('-')[1]);
        if (suitA !== suitB) {
            return suitA.localeCompare(suitB); // Sort by suit first
        }
        return rankA - rankB; // Then by rank
    });

    // console.log("CARDS :::::", cards)
    let pureSequences = [];
    let currentSequence = [];
    // Iterate through the sorted cards
    for (let i = 0; i < cards.length; i++) {
        const currentCard = cards[i];
        const currentSuit = currentCard.split('-')[0];
        const currentRank = parseInt(currentCard.split('-')[1]);

        // console.log("SUIT ", currentSuit, "+++", currentRank, "[][][][][][][]", currentSequence[currentSequence.length - 1])
        // If current card has the same suit as the previous one and is consecutive in rank
        if (currentSequence.length === 0 || currentSequence[currentSequence.length - 1].split('-')[0] === currentSuit &&
            (parseInt(currentSequence[currentSequence.length - 1].split('-')[1]) === currentRank - 1)) {
            currentSequence.push(currentCard);
        } else {
            // If the sequence breaks, check if the current sequence is a pure sequence and reset it
            if (currentSequence.length >= 2) {
                pureSequences.push(currentSequence);
            }
            currentSequence = [currentCard];
        }
        // console.log("currentSequence /*/*", currentSequence)
    }
    // console.log("currentSequence ***********************************", currentSequence)
    // Check the last sequence
    if (currentSequence.length >= 2) {
        pureSequences.push(currentSequence);
    }
    let remainCard = _.difference(cards, _.flatten(pureSequences))
    // console.log("remainCard", remainCard);
    let getAce = remainCard.filter(item => parseInt(item.split("-")[1]) == 1 && item.split("-")[0] != "J")
    // console.log("GET ACE ===== ?", getAce)


    for (let i = 0; i < getAce.length; i++) {
        let [suit, index] = getAce[i].split('-');

        for (let j = 0; j < pureSequences.length; j++) {
            if (pureSequences[j].some(card => card.startsWith(suit))) {
                if (pureSequences[j].some(card => card.split('-')[1] === '13')) {
                    pureSequences[j].push(getAce[i]);
                }
            }
        }
    }

    pureSequences = pureSequences.filter(subArray => subArray.length >= 3);

    // console.log("pureSequences =====", pureSequences)
    return pureSequences;
}

const findImpureSequences = (cards, joker) => {
    // Sort the cards based on suit and rank
    cards.sort((a, b) => {
        const suitA = a.split('-')[0];
        const suitB = b.split('-')[0];
        const rankA = parseInt(a.split('-')[1]);
        const rankB = parseInt(b.split('-')[1]);
        if (rankA !== rankB) {
            return rankA - rankB; // Sort by rank
        }
        return suitA.localeCompare(suitB); // Then by suit
    });

    // console.log("AFTER SORTING CARD", cards)
    let impureSequences = [];


    let currentSequence = [];
    // Iterate through the sorted cards
    let jokers = cards.filter(item => item.startsWith("J") || parseInt(item.split("-")[1]) == joker);
    // console.log("jokers.length",jokers)

    cards = _.difference(cards, jokers)
    for (let i = 0; i < cards.length; i++) {
        const currentCard = cards[i];
        const currentRank = parseInt(currentCard.split('-')[1]);

        let InCurrentSequenceJoker = currentSequence.filter(item => item.startsWith("J") || parseInt(item.split("-")[1]) == joker).length == 1

        if (currentSequence.length === 0) {
            currentSequence.push(currentCard);

        } else if ((parseInt(currentSequence[currentSequence.length - 1].split('-')[1]) === currentRank - 1)) {
            currentSequence.push(currentCard);
        } else if ((jokers.length > 0 && !InCurrentSequenceJoker && (parseInt(currentSequence[currentSequence.length - 1].split('-')[1]) === currentRank - 2))) {
            // console.log("HERE +++++++++++++++++++",cards[i])
            // let result = currentSequence.some(element => element.startsWith("J") || element.split('-')[1] === joker);
            // if (!result) {

            currentSequence.push(jokers[0]);
            // console.log("INDEX 333333333333", jokers[0])
            jokers.splice(jokers.indexOf(jokers[0]), 1);
            // console.log("Jokers ", jokers)
            // }
            currentSequence.push(currentCard)
            // console.log("currentSequence 9888888888889989898989898",currentSequence);

        } else {
            // If the sequence breaks and it's not a pure sequence, add it to impure sequences
            if (currentSequence.length >= 2) {
                impureSequences.push(currentSequence);
            }
            currentSequence = [currentCard];
        }
        // console.log("currentSequence :::: ", currentSequence)
    }
    // console.log("JOKERSSSS", jokers)
    // Check the last sequence
    if (currentSequence.length >= 2) {
        impureSequences.push(currentSequence);
    }
    // console.log("impureSequences",impureSequences)
    // Iterate through impure sequences to add jokers if available
    for (let i = 0; i < impureSequences.length; i++) {
        const sequence = impureSequences[i];
        const jokerNeeded = 3 - sequence.length;
        for (let j = 0; j < jokerNeeded; j++) {
            if (jokers.length > 0) {
                sequence.push(jokers.shift());
            } else {
                break;
            }
        }
        // console.log("sequence",sequence)
    }
    // console.log("impureSequences 786",impureSequences)
    impureSequences = impureSequences.filter(subArray => subArray.length >= 3);

    return impureSequences;
}

const mycardGroup = async (myCard,wildcard,cb) => {
    console.log("Pure sequences:");
    const pureSeqs = findPureSequences(myCard);
    console.log("Pure sequences:", pureSeqs);

    let RemainCard = _.difference(myCard, _.flatten(pureSeqs))
    console.log("RemainCard ==============> ", RemainCard)


    // Example usage:
    const impureSequences = findImpureSequences(RemainCard, wildcard);
    console.log("impureSequences *-*-*-*-*-*-*", impureSequences)

    RemainCard = _.difference(RemainCard, _.flatten(impureSequences))
    console.log("RemainCard", RemainCard);

    const Teen = findIndexesTeen(RemainCard, wildcard);
    console.log("TEEN", Teen);
    RemainCard = _.difference(RemainCard, _.flatten(Teen))
    console.log("RemainCard", RemainCard);

    console.log("*********************************************")
    console.log("MYCARD **** ", myCard)
    let JSON = {
        pure: pureSeqs,
        impure: impureSequences,
        set: Teen,
        dwd: RemainCard
    }
    
    console.log("JSON +++ ", JSON)
    console.log("*********************************************")

    return cb(JSON)
    
}



module.exports = {
    findRoom,
    pic,
    checkCardMatched,
    checkCardFoundFollower,
    checkWinCard,
    mycardGroup,
    findIndexesTeen,
    findPureSequences,
    findImpureSequences
}
