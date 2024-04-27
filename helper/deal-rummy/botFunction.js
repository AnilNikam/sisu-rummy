const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const PlayingTables = mongoose.model("playingTable");

const dealTableAction = require("./joinTable");
const commandAcions = require('../socketFunctions');

const logger = require("../../logger");
const CONST = require("../../constant");
const config = require("../../config");
const _ = require("underscore");
let io = require('socket.io-client')
const schedule = require('node-schedule');
const { getRandomNumber } = require("../helperFunction");
const roundStartActions = require('./roundStart');
const checkWinnerActions = require('./checkWinner');

const gamePlayActions = require('../rummy/gamePlay');
const dealGamePlayActions = require('./gamePlay');
const poolGamePlayActions = require('../pool-rummy/gamePlay');
const { getScore } = require('../common-function/cardFunction');

let socket = io.connect(config.SOCKET_CONNECT, { reconnect: true });

const findDealRoom = async (tableInfo, betInfo) => {
    try {

        let RealPlayer = []

        logger.info("rummy BOT call tableInfo playerInfo =>", tableInfo.playerInfo)
        logger.info("rummy BOT call tableInfo betInfo =>", betInfo)

        let whereCond = { _id: MongoID(tableInfo._id.toString()) };
        tableInfo = await PlayingTables.findOne(whereCond).lean();
        logger.info("botfunction tabInfo =>", tableInfo);

        tableInfo.playerInfo.forEach(e => {
            logger.info("tableInfo.playerInfo ", e)
            if (e.isBot == false) {
                RealPlayer.push(MongoID(e._id).toString())
            }
        })

        if (RealPlayer.length == 0) {
            logger.info("Real USer Leght zero ", RealPlayer.length);
            return false
        }

        let user_wh = {
            isBot: true,
            isfree: true,
            // "_id": { $nin: RobotPlayer }
        }

        logger.info(" JoinRobot ROBOT Not user_wh   : ", user_wh)


        //let robotInfo = await GameUser.findOne(user_wh, {});

        let robotInfo = await GameUser.aggregate([
            { $match: user_wh },
            { $sample: { size: 1 } }
        ]).exec()

        // console.log("JoinRobot ROBOT Info : ", robotInfo)

        if (robotInfo == null || robotInfo.length == 0) {
            logger.info("JoinRobot ROBOT Not Found  : ")
            return false
        }

        let up = await GameUser.updateOne({ _id: MongoID(robotInfo[0]._id.toString()) }, { $set: { "isfree": false } });
        logger.info("update robot isfree", up)

        dealTableAction.findEmptySeatAndUserSeat(tableInfo, betInfo, { uid: robotInfo[0]._id.toString(), isBot: robotInfo[0].isBot });

    } catch (error) {
        logger.info("Robot Logic Join", error);
    }

}

const pic = async (tableInfo, playerId, gamePlayType, deck) => {
    try {
        logger.info("Pool tableInfo, playerId, gamePlayType, deckType", tableInfo, playerId, gamePlayType, deck)

        deck = ['close', 'open'];
        const randomIndex = Math.floor(Math.random() * deck.length);
        if (tableInfo.playerInfo && tableInfo.playerInfo.length > 0) {
            let playerIndex = tableInfo.playerInfo.findIndex(o => o.seatIndex === tableInfo.currentPlayerTurnIndex);
            logger.info('playerIndex: ', playerIndex);
            if (playerIndex !== -1) {
                let playerInfo = tableInfo.playerInfo[playerIndex];
                logger.info('pool bot player cards => ', playerInfo.cards);

                PickCardcloseDeck_or_open_deck(playerInfo.cards.slice(0, playerInfo.cards.length), tableInfo.wildCard,
                    tableInfo.openDeck[tableInfo.openDeck.length - 1],
                    tableInfo.closeDeck[tableInfo.closeDeck.length - 1], (deckType1) => {

                        logger.info("deckType ::::::::::::::::::::", deckType1)
                        let deckType = deckType1 //|| deck[randomIndex];
                        if (playerInfo.isEasy) {
                            deckType = 'close' //|| deck[randomIndex];
                            logger.info("check a decktype when isEasy Card Bot turn")
                        }

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

                                        // logger.info("pickCard upWh updateData :: ", upWh, updateData);
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


                            let startDiscScheduleTime = new Date(Date.now() + getRandomNumber(5000, 7500))
                            schedule.scheduleJob(`table.tableId${tableInfo._id}`, startDiscScheduleTime, async function () {
                                try {
                                    logger.info("Bot DISCARD event call");

                                    //cancel the Schedule
                                    schedule.cancelJob(`table.tableId${tableInfo._id}`);
                                    // logger.info("Data ----->", playerId + "****" + gamePlayType + " ***" + table.tableId);
                                    let playerIndex = tableInfo.playerInfo.findIndex(o => o.seatIndex === tableInfo.currentPlayerTurnIndex);
                                    let player = tableInfo.playerInfo[playerIndex];
                                    logger.info('userTurnSet playerIndex,player => ', playerIndex + "Player" + player);
                                    logger.info("DISCARD Player Cards", player.cards);

                                    //Select Card for Discard
                                    if (player) {
                                        let playerCards = player.cards
                                        logger.info("tableInfo ", tableInfo.wildCard)

                                        if (player.isEasy && player.turnCount == tableInfo.winingDeclareCount) {
                                            logger.info("check win Bot ===>", tableInfo.gamePlayType)
                                            logger.info("player Card ===>", playerCards)
                                            let throwCard = pickedCard;
                                            switch (tableInfo.gamePlayType) {
                                                case CONST.GAME_TYPE.POINT_RUMMY:
                                                    await gamePlayActions.declare({ cardName: throwCard }, { seatIndex: playerIndex, isbot: true, tbid: tableInfo._id.toString() });
                                                    break;

                                                case CONST.GAME_TYPE.POOL_RUMMY:
                                                    await poolGamePlayActions.declare({ cardName: throwCard }, { seatIndex: playerIndex, isbot: true, tbid: tableInfo._id.toString() });
                                                    break;

                                                case CONST.GAME_TYPE.DEAL_RUMMY:
                                                    await dealGamePlayActions.declare({ cardName: throwCard }, { seatIndex: playerIndex, isbot: true, tbid: tableInfo._id.toString() });
                                                    break;
                                            }
                                            return false;
                                        }

                                        if (player.isEasy) {

                                            let droppedCard = pickedCard//requestData.cardName;
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

                                            if (tb) {
                                                let responsee = {
                                                    playerId: playerInfo._id,
                                                    disCard: disCard,
                                                };

                                                logger.info("check throw card ->", responsee)
                                                commandAcions.sendEventInTable(tb._id.toString(), CONST.DISCARD, responsee);


                                                let re = await roundStartActions.nextUserTurnstart(tb);
                                                return false
                                            } else {
                                                // The update failed
                                                return false;
                                            }

                                        }
                                        mycardGroup(player.cards, parseInt(tableInfo.wildCard.split("-")[1]), async (cardjson) => {
                                            let throwCard = "";
                                            let randomIndex = -1

                                            logger.info("cardjson ", cardjson)
                                            RemainCardTounusecardThrow(cardjson, tableInfo.wildCard, async (RemainCard) => {


                                                logger.info("RemainCard ", RemainCard)

                                                // pureSeqs: MycardSet.pure,
                                                // ImpureSeqs: unusedJoker.impureSequences,
                                                // Teen: unusedJoker.Teen,
                                                // possibilityCard1: possibiltyCard1,
                                                // RemainCard: RemainCard

                                                let Isdecalre = false;

                                                // RemainCard  {
                                                //     pureSeqs: [ 'S-11-0', 'S-12-0', 'S-13-0' ],
                                                //     ImpureSeqs: [
                                                //       'C-1-0', 'C-4-1',
                                                //       'C-3-0', 'S-5-0',
                                                //       'C-6-0', 'H-7-0',
                                                //       'S-7-1', 'D-8-0',
                                                //       'C-9-0', 'C-10-0'
                                                //     ],
                                                //     Teen: [],
                                                //     possibilityCard1: [],
                                                //     RemainCard: [ 'C-4-0' ]
                                                //   }
                                                if (RemainCard.RemainCard != undefined && RemainCard.RemainCard.length == 1
                                                    && RemainCard.RemainCard != undefined && RemainCard.possibilityCard1.length == 0
                                                    && RemainCard.pureSeqs != undefined && RemainCard.pureSeqs.length >= 1
                                                    && RemainCard.ImpureSeqs != undefined && RemainCard.ImpureSeqs.length >= 1

                                                ) {
                                                    Isdecalre = true
                                                }

                                                if (RemainCard.RemainCard != undefined && RemainCard.RemainCard.length > 0) {
                                                    logger.info("RemainCard  RemainCard  ", RemainCard.RemainCard)
                                                    RemainCard.RemainCard.sort((e, f) => {
                                                        return parseInt(f.split("-")[1]) - parseInt(e.split("-")[1])
                                                    })
                                                    //randomIndex = Math.floor(Math.random() * RemainCard.RemainCard.length);
                                                    throwCard = RemainCard.RemainCard[0];

                                                } else if (RemainCard.possibilityCard1 != undefined && RemainCard.possibilityCard1.length > 0) {
                                                    logger.info("RemainCard  possibilityCard1  ", RemainCard.possibilityCard1)

                                                    RemainCard.possibilityCard1 = _.flatten(RemainCard.possibilityCard1)

                                                    randomIndex = Math.floor(Math.random() * RemainCard.possibilityCard1.length);
                                                    throwCard = RemainCard.possibilityCard1[randomIndex];

                                                } else if (RemainCard.Teen != undefined && RemainCard.Teen.length > 0) {
                                                    logger.info("Teen  sequestion  ")


                                                    randomIndex = Math.floor(Math.random() * RemainCard.Teen.length);
                                                    throwCard = RemainCard.Teen[randomIndex];
                                                } else if (RemainCard.ImpureSeqs != undefined && RemainCard.ImpureSeqs.length > 0) {
                                                    logger.info("ImpureSeqs  sequestion  ")


                                                    randomIndex = Math.floor(Math.random() * RemainCard.ImpureSeqs.length);
                                                    throwCard = RemainCard.ImpureSeqs[randomIndex];
                                                } else if (RemainCard.pureSeqs != undefined && RemainCard.pureSeqs.length > 0) {

                                                    logger.info("pureSeqs  sequestion  ")
                                                    randomIndex = Math.floor(Math.random() * RemainCard.pureSeqs.length);
                                                    throwCard = RemainCard.pureSeqs[randomIndex];
                                                } else {
                                                    logger.info("else :::::::::::::::::: ")
                                                    randomIndex = Math.floor(Math.random() * playerCards.length);
                                                    throwCard = playerCards[randomIndex];
                                                }
                                                logger.info("dddddddddddddddddddddddddddddddddddddddddddddddddddddddddd")
                                                // let selectDiscardCard = convertCardPairAndFollowers(playerCards);

                                                // logger.info('selectDiscardCard => ', selectDiscardCard);
                                                // logger.info('select Discard followers Card => ', selectDiscardCard.followers + ' select Discard followers Card => ' + selectDiscardCard.pair);

                                                // const isWinner = checkPairAndFollowers(playerCards);
                                                // console.info('isWinner => ', isWinner);

                                                // const throwCard = selectThrowcard(playerCards, selectDiscardCard.followers, selectDiscardCard.pair)
                                                logger.info('DIS throwCard => ', throwCard);
                                                logger.info('DIS Isdecalre => ', Isdecalre);

                                                if (Isdecalre) {
                                                    let winner = await checkWinnerActions.getWinner(tableInfo);
                                                    if (winner === 0) {
                                                        Isdecalre = true
                                                    } else {
                                                        Isdecalre = false
                                                    }
                                                }

                                                if (Isdecalre) {
                                                    logger.info(tableInfo.gamePlayType)
                                                    switch (tableInfo.gamePlayType) {
                                                        case CONST.GAME_TYPE.POINT_RUMMY:
                                                            await gamePlayActions.declare({ cardName: throwCard }, { seatIndex: playerIndex, isbot: true, tbid: tableInfo._id.toString() });
                                                            break;

                                                        case CONST.GAME_TYPE.POOL_RUMMY:
                                                            await poolGamePlayActions.declare({ cardName: throwCard }, { seatIndex: playerIndex, isbot: true, tbid: tableInfo._id.toString() });
                                                            break;

                                                        case CONST.GAME_TYPE.DEAL_RUMMY:
                                                            await dealGamePlayActions.declare({ cardName: throwCard }, { seatIndex: playerIndex, isbot: true, tbid: tableInfo._id.toString() });
                                                            break;
                                                    }

                                                } else {
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


                                                    if (tb) {
                                                        // The update was successful
                                                        let responsee = {
                                                            playerId: playerInfo._id,
                                                            disCard: disCard,
                                                        };
                                                        commandAcions.sendEventInTable(tb._id.toString(), CONST.DISCARD, responsee);
                                                        await roundStartActions.nextUserTurnstart(tb);
                                                    } else {
                                                        // The update failed
                                                        logger.info("Deal table Not Found ->")
                                                        return false;
                                                    }

                                                }
                                            })
                                        })
                                    } else {
                                        logger.info('<= Player Not Found => ');

                                    }
                                } catch (error) {
                                    logger.error("Discard or Declare event of BOT", error);
                                }
                            })

                        })
                    })
            } else {
                logger.info('11111Player not found with seatIndex: ', tableInfo.currentPlayerTurnIndex);
            }
        } else {
            logger.info('22222Player not found with seatIndex: ', tableInfo.currentPlayerTurnIndex);
        }
    } catch (error) {
        logger.info("Bot try catch error in bot pic event", error);
    }


}

PickCardcloseDeck_or_open_deck = (cards, wildCard, opendeckcard, closecard, callback) => {
    let playerCards = cards
    logger.info("tableInfo ", wildCard)
    logger.info("opendeckcard ", opendeckcard)
    logger.info("closecard ", closecard)


    if (opendeckcard.split("-")[1] == wildCard.split("-")[1] || opendeckcard.split("-")[0] == "J") {
        return callback("open");
    }

    if (closecard.split("-")[1] == wildCard.split("-")[1] || closecard.split("-")[0] == "J") {
        return callback("close");
    }

    OpenDeckcardCheckUseOrnot(cards.slice(0, cards.length), wildCard, opendeckcard, (type) => {
        return callback(type)
    })


}

OpenDeckcardCheckUseOrnot = (cards, wildCard, opendeckcard, callback) => {
    cards.push(opendeckcard)

    mycardGroup(cards, parseInt(wildCard.split("-")[1]), async (cardjson) => {


        logger.info("cardjson ", cardjson)
        RemainCardTounusecardThrow(cardjson, wildCard, async (RemainCard) => {


            logger.info("OpenDeckcardCheckUseOrnot RemainCard", RemainCard)
            logger.info("OpenDeckcardCheckUseOrnot opendeckcard", opendeckcard)


            // pureSeqs: MycardSet.pure,
            // ImpureSeqs: unusedJoker.impureSequences,
            // Teen: unusedJoker.Teen,
            // possibilityCard1: possibiltyCard1,
            // RemainCard: RemainCard


            if (RemainCard.RemainCard != undefined && RemainCard.RemainCard.length > 0 && RemainCard.RemainCard.indexOf(opendeckcard) != -1) {
                return callback("close");
            } else if (RemainCard.possibilityCard1 != undefined && RemainCard.possibilityCard1.length > 0 && RemainCard.possibilityCard1.indexOf(opendeckcard) != -1) {
                return callback("open");
            } else if (RemainCard.Teen != undefined && RemainCard.Teen.length > 0 && RemainCard.Teen.indexOf(opendeckcard) != -1) {
                return callback("open");
            } else if (RemainCard.ImpureSeqs != undefined && RemainCard.ImpureSeqs.length > 0 && RemainCard.ImpureSeqs.indexOf(opendeckcard) != -1) {
                return callback("open");
            } else if (RemainCard.pureSeqs != undefined && RemainCard.pureSeqs.length > 0 && RemainCard.pureSeqs.indexOf(opendeckcard) != -1) {

                return callback("open");
            } else {
                return callback("close");
            }

        })
    })
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

        logger.info("checkFollowersSequence Cards", card);
        logger.info("check Card Number Card--->", checkCardNumber);
        logger.info("cardNumber Value==>", cardNumber);

        // check card suit
        for (let i = 0; i < cardNumber.length; i++) {
            // logger.info("Card check", cardNumber[i] + "|||" + checkCardNumber);
            if (checkCardNumber[0] === cardNumber[i]) {
                logger.info("Card Matched ", cardNumber[i] + "|*****************|" + checkCardNumber);
                status = true;
                logger.info("<===== Card Matched ======>");
            }

        }

        if (status == true) {
            logger.info("Card Matched or 1 Difference");
        }
        else {
            logger.info("Card Not Matched")
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
            //logger.info(words);
            cardType.push(words[0]);
            //logger.info("String Value==>", cardType);
            cardNumber.push(parseInt(words[1]));
            //logger.info("Integer Value==>",cardNumber);
        }

        logger.info("checkFollowersSequence Cards", card);

        if (status == false) {
            for (let i = 0; i < cardNumber.length - 1; i++) {

                let dif = cardNumber[i] - checkCardNumber;

                if (dif == -1 || dif == 1) {
                    status = true;
                }
            }

        }
        if (status == true) {
            logger.info("Followers Ready")
        }
        else {
            logger.info("Followers NOT Ready")
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
            //logger.info(words);
            cardType.push(words[0]);
            //logger.info("String Value==>", cardType);
            cardNumber.push(parseInt(words[1]));
            //logger.info("Integer Value==>",cardNumber);
        }
        logger.info("checkFollowersSequence Cards", cards);

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
        //logger.info(words);
        cardType.push(words[0]);
        //logger.info("String Value==>", cardType);
        cardNumber.push(parseInt(words[1]));
        //logger.info("Integer Value==>",cardNumber);
    }
    logger.info("checkFollowersSequence Cards", card);

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
        // logger.info("dif =>", dif)
        if (dif == 0) {
            // logger.info("Check Seqence Value Of True => " + dif)
            status = true;
        }
        else {
            // allCards = [...gcard.impure, ...gcard.set, ...gcard.dwd].flat(Infinity);
            // logger.info("Check Seqence Value Of False=>" + dif)
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
            logger.info("after adding 10+ -->");

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
        logger.info("Winner Ready")
    }
    else {
        logger.info("Winner NOT Ready")
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

const generatePureSequence = (deck, wildcard, callback) => {

    logger.info("before wild card ->", wildcard);

    // Convert wildcard to string if it's not already
    if (typeof wildcard !== 'string') {
        wildcard = String(wildcard);
    }

    let suits = ['H', 'D', 'S', 'C']; // Hearts, Diamonds, Spades, Clubs
    const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']; // Card values

    // Shuffle the deck
    const shuffledDeck = shuffleArray(deck);

    suits = _.difference(suits, [wildcard.split("-")[0]])

    // Choose a random suit

    logger.info("after Wild card Sgit ", suits)
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];

    // Filter cards with the chosen suit
    const suitCards = shuffledDeck.filter(card => card.startsWith(randomSuit) && card.split("-")[2] == "0");

    // Sort the suit cards based on their values
    suitCards.sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
    logger.info("suitCards ", suitCards)

    let temp = Math.floor(Math.random() * (suitCards.length - 3))
    logger.info("temp ", temp)

    // Check if there are at least three consecutive cards in the suit
    for (let i = temp; i <= suitCards.length - 3; i++) {
        const sequence = suitCards.slice(i, i + 3);
        logger.info(" sequence ---->", sequence)
        const valuesDiff = sequence.map(card => parseInt(card.split('-')[1]) - 1);
        const isConsecutive = valuesDiff.every((val, index) => val === parseInt(sequence[0].split('-')[1]) - 1 + index);

        if (isConsecutive) {
            return callback(sequence);
        }
    }

    // If no consecutive sequence is found, try again
    return generatePureSequence(deck, wildcard, callback);
};

// Function to generate an impure sequence
const generateImpureSequence = (deck, joker, wildcard) => {
    let suits = ['H', 'D', 'S', 'C']; // Hearts, Diamonds, Spades, Clubs

    // Make a copy of the deck
    const copiedDeck = [...deck];

    // Shuffle the copied deck
    const shuffledDeck = shuffleArray(copiedDeck);
    suits = _.difference(suits, [wildcard.split("-")[0]])
    // Choose a random suit

    // Choose a random suit
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];

    // Filter cards with the chosen suit from the shuffled deck
    const suitCards = shuffledDeck.filter(card => card.startsWith(randomSuit) && card.split("-")[2] == "0");

    // Sort the suit cards based on their values
    suitCards.sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));

    logger.info("suitCards ", suitCards)

    let temp = Math.floor((Math.random() * (suitCards.length - 1)))
    // Choose two cards randomly from the suit cards
    const chosenCards = [suitCards[temp], suitCards[temp + 1]];

    // Remove the chosen cards from the original deck
    deck = _.difference(deck, chosenCards);
    logger.info("Remove impre card ==>", deck)

    // Insert the joker at a random position
    const randomIndex = Math.floor(Math.random() * 3);
    chosenCards.splice(randomIndex, 0, joker);

    // Remove the joker from the original deck
    deck = _.without(deck, joker);

    return chosenCards;
};

// Function to generate a set
const generateSet = (deck, wildcard) => {
    logger.info("Wild card --==>", wildcard)
    // Shuffle the deck
    const shuffledDeck = shuffleArray(deck);

    let values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]; // Card values

    values = _.difference(values, [wildcard.split("-")[1]])

    // Choose a random rank (value)
    const randomRank = values[Math.floor(Math.random() * values.length)]; // Math.floor(Math.random() * 13) + 1; // Random number from 1 to 13 representing card ranks


    // Choose three cards of the same rank from different suits
    const set = [];

    // Loop through the shuffled deck to find three cards of the chosen rank from different suits
    for (let i = 0; i < shuffledDeck.length; i++) {

        if (parseInt(shuffledDeck[i].split('-')[2]) == 0) {

            const card = shuffledDeck[i];
            const rank = parseInt(card.split('-')[1]);

            if (rank === randomRank && set.length < 4) {
                set.push(card);
                deck.splice(deck.indexOf(card), 1);

            }
        }
    }

    // If less than three cards of the same rank are found, try again recursively
    if (set.length < 3) {
        return generateSet(deck, wildcard);
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

const checkWinCard = async (deck, wildCard, call) => {
    const jokers = ['J-0-0', 'J-1-1'];
    tempdeck = deck.slice(0, deck.length - 1)
    // Generate sequences
    generatePureSequence(deck, wildCard, async (pureSequence) => {
        logger.info("pureSequence ", pureSequence);
        deck = _.difference(deck, pureSequence.flat());
        logger.info("deck after removing pureSequence: ", deck);

        const impureSequences = jokers.map(joker => generateImpureSequence(deck, joker, wildCard));
        logger.info("impureSequences ", impureSequences);

        const impureCards = impureSequences.flat();
        deck = _.difference(deck, impureCards);
        logger.info("deck after removing impureCards: ", deck);

        const cardSet = generateSet(deck, wildCard);

        deck = _.difference(deck, cardSet);
        let checkCards = _.flatten([pureSequence, impureSequences, cardSet])
        logger.info(" check wining card --- Deal -->", checkCards)

        // Output the generated sequences
        const sequences = {
            pure: [pureSequence],
            impure: impureSequences,
            set: [cardSet],
            deck: deck,
            card: _.flatten([pureSequence, impureSequences, cardSet])
        };
        logger.info("sequences =>", sequences);
        logger.info("sequences deck =>", deck);

        const isValid = await getScore({
            pure: [pureSequence],
            impure: impureSequences,
            set: [cardSet],
            dwd: []
        }, wildCard);

        logger.info("check isvalid bot function ==>", isValid)

        if (isValid == 0) {
            return call(sequences); // Callback with valid cards
        } else {
            // Generate new cards and recursively call checkWinCard
            checkWinCard(tempdeck, wildCard, call);
        }
        // return call(sequences);
    });
};

const findIndexesTeen = (cards, joker) => {
    let cardCount = {};
    logger.info("CARDS :::::::::", cards)

    let jokers = cards.filter(item => item.startsWith("J") || parseInt(item.split("-")[1]) == joker);
    logger.info("jokers.length", jokers)
    cards = _.difference(cards, jokers)

    for (const card of cards) {
        const index = card.split('-')[1];
        if (cardCount[`0${index}`]) {
            cardCount[`0${index}`].push(card);
        } else {
            cardCount[`0${index}`] = [card];
        }
    }
    logger.info("cardCount *-*-*-*-* ", cardCount)

    let sortedArray = Object.entries(cardCount);
    sortedArray.sort((a, b) => b[1].length - a[1].length);
    // let sortedObject = {};
    for (let [key, value] of sortedArray) {
        // logger.info(key, " ", value)
        let filteredArray = value.filter((card, index, array) => array.findIndex(c => c[0] === card[0]) === index);
        cardCount[key] = filteredArray;
    }

    // logger.info("sortedObject 555555555555555555555555555555555555555", cardCount)


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

    // logger.info(" repeat++++++++++edIndexes ........... ", repeatedIndexes)


    if (repeatedIndexes.length > 0) {
        repeatedIndexes = repeatedIndexes.map(index => cardCount[index]);
    }
    // logger.info(" repeat edIndexes ........... ", repeatedIndexes)
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

    // logger.info("CARDS :::::", cards)
    let pureSequences = [];
    let currentSequence = [];
    // Iterate through the sorted cards
    for (let i = 0; i < cards.length; i++) {
        const currentCard = cards[i];
        const currentSuit = currentCard.split('-')[0];
        const currentRank = parseInt(currentCard.split('-')[1]);

        // logger.info("SUIT ", currentSuit, "+++", currentRank, "[][][][][][][]", currentSequence[currentSequence.length - 1])
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
        // logger.info("currentSequence /*/*", currentSequence)
    }
    // logger.info("currentSequence ***********************************", currentSequence)
    // Check the last sequence
    if (currentSequence.length >= 2) {
        pureSequences.push(currentSequence);
    }
    let remainCard = _.difference(cards, _.flatten(pureSequences))
    // logger.info("remainCard", remainCard);
    let getAce = remainCard.filter(item => parseInt(item.split("-")[1]) == 1 && item.split("-")[0] != "J")
    // logger.info("GET ACE ===== ?", getAce)


    for (let i = 0; i < getAce.length; i++) {
        let [suit, index] = getAce[i].split('-');
        for (let j = 0; j < pureSequences.length; j++) {
            if (pureSequences[j].some(card => card.startsWith(suit))) {
                if (pureSequences[j].some(card => card.split('-')[1] === '13') && pureSequences[j].some(card => card.split('-')[1] !== "1")) {
                    pureSequences[j].push(getAce[i]);;
                    getAce.splice(getAce.indexOf(getAce[i]), 1)
                }
            }
        }
    }

    pureSequences = pureSequences.filter(subArray => subArray.length >= 3);

    // logger.info("pureSequences =====", pureSequences)
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

    // logger.info("AFTER SORTING CARD", cards)
    let impureSequences = [];


    let currentSequence = [];
    // Iterate through the sorted cards
    let jokers = cards.filter(item => item.startsWith("J") || parseInt(item.split("-")[1]) == joker);
    // logger.info("jokers.length",jokers)

    cards = _.difference(cards, jokers)
    for (let i = 0; i < cards.length; i++) {
        const currentCard = cards[i];
        const currentSuit = currentCard.split('-')[0];
        const currentRank = parseInt(currentCard.split('-')[1]);

        let InCurrentSequenceJoker = currentSequence.filter(item => item.startsWith("J") || parseInt(item.split("-")[1]) == joker).length == 1

        if (currentSequence.length === 0) {
            currentSequence.push(currentCard);

        } else if (currentSequence[currentSequence.length - 1].split('-')[0] === currentSuit && (parseInt(currentSequence[currentSequence.length - 1].split('-')[1]) === currentRank - 1)) {
            currentSequence.push(currentCard);
        } else if ((jokers.length > 0 && !InCurrentSequenceJoker && (currentSequence[currentSequence.length - 1].split('-')[0] === currentSuit && parseInt(currentSequence[currentSequence.length - 1].split('-')[1]) === currentRank - 2))) {
            // logger.info("HERE +++++++++++++++++++",cards[i])
            // let result = currentSequence.some(element => element.startsWith("J") || element.split('-')[1] === joker);
            // if (!result) {

            currentSequence.push(jokers[0]);
            // logger.info("INDEX 333333333333", jokers[0])
            jokers.splice(jokers.indexOf(jokers[0]), 1);
            // logger.info("Jokers ", jokers)
            // }
            currentSequence.push(currentCard)
            // logger.info("currentSequence 9888888888889989898989898",currentSequence);

        } else {
            // If the sequence breaks and it's not a pure sequence, add it to impure sequences
            if (currentSequence.length >= 2) {
                impureSequences.push(currentSequence);
            }
            currentSequence = [currentCard];
        }
        // logger.info("currentSequence :::: ", currentSequence)
    }
    // logger.info("JOKERSSSS", jokers)
    // Check the last sequence
    if (currentSequence.length >= 2) {
        impureSequences.push(currentSequence);
    }
    // logger.info("impureSequences",impureSequences)
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
        // logger.info("sequence",sequence)
    }
    // logger.info("impureSequences 786",impureSequences)
    impureSequences = impureSequences.filter(subArray => subArray.length >= 3);

    return impureSequences;
}

const mycardGroup = async (myCard, wildcard, cb) => {
    logger.info("DealerRobotLogicCard my Crard group ", wildcard);
    logger.info("Pure sequences:");
    const pureSeqs = findPureSequences(myCard);
    logger.info("Pure sequences:", pureSeqs);

    let RemainCard = _.difference(myCard, _.flatten(pureSeqs))
    logger.info("RemainCard ==============> ", RemainCard)

    // Example usage:
    const impureSequences = findImpureSequences(RemainCard, wildcard);
    logger.info("impureSequences *-*-*-*-*-*-*", impureSequences)

    RemainCard = _.difference(RemainCard, _.flatten(impureSequences))
    logger.info("RemainCard", RemainCard);

    const Teen = findIndexesTeen(RemainCard, wildcard);
    logger.info("TEEN", Teen);
    RemainCard = _.difference(RemainCard, _.flatten(Teen))
    logger.info("RemainCard", RemainCard);

    logger.info("*********************************************")
    logger.info("MYCARD **** ", myCard)
    let JSON = {
        pure: pureSeqs,
        impure: impureSequences,
        set: Teen,
        dwd: RemainCard
    }

    logger.info("JSON +++ ", JSON)
    logger.info("*********************************************")

    return cb(JSON)

}

const RemainCardTounusecardThrow = async (MycardSet, wildCard, callback) => {

    logger.info("MycardSet ", MycardSet)
    let cardNu = parseInt(wildCard.split("-")[1])
    logger.info("MycardSet ", cardNu)

    UnusedJoker(MycardSet.dwd, cardNu, MycardSet.impure, MycardSet.set, (unusedJokercards) => {

        logger.info("unusedJoker *-*-*-*-*-*-* ", unusedJokercards)

        possibilityCard(unusedJokercards.RemainCard, (possibiltyCard1) => {

            RemainCard = _.difference(unusedJokercards.RemainCard, _.flatten(possibiltyCard1))

            logger.info("unusedJokercards.impureSequences ", unusedJokercards)
            logger.info("unusedJokercards.impureSequences ", unusedJokercards.impureSequences)
            logger.info("unusedJokercards.impureSequences ", unusedJokercards.Teen)

            let JSON = {
                pureSeqs: _.flatten(MycardSet.pure),
                ImpureSeqs: _.flatten(unusedJokercards.impureSequences),
                Teen: _.flatten(unusedJokercards.Teen),
                possibilityCard1: _.flatten(possibiltyCard1),
                RemainCard: _.flatten(RemainCard)
            }

            logger.info("JSON :::::::::::::::::", JSON)

            return callback(JSON)
        })
    })
}

const UnusedJoker = async (RemainCard, joker, impureSequences, Teen, callback) => {
    let remainjoker = RemainCard.filter(item => (item.split("-")[0] == "J") || (parseInt(item.split("-")[1]) === joker))
    // logger.info("remainjoker *-*-*--*-*-*-*-*--** ", remainjoker)

    if (remainjoker.length > 0 && (impureSequences.length > 0 || Teen.length > 0)) {


        if (impureSequences.length > 0) {

            for (let j = 0; j < remainjoker.length; j++) {
                for (let i = 0; i < impureSequences.length; i++) {
                    if (!impureSequences[i].includes(remainjoker[0])) {
                        impureSequences[i].push(remainjoker[0]);
                        RemainCard.splice(RemainCard.indexOf(remainjoker[0]), 1)
                        remainjoker.splice(remainjoker.indexOf(remainjoker[0]), 1);

                        if (remainjoker.length == 0) {
                            break;
                        }
                        // Break to avoid pushing the same remainjoker card multiple times
                    }
                }
            }
        } else {
            for (let j = 0; j < remainjoker.length; j++) {
                for (let i = 0; i < Teen.length; i++) {
                    if (!Teen[i].includes(remainjoker[0])) {
                        Teen[i].push(remainjoker[0]);
                        RemainCard.splice(RemainCard.indexOf(remainjoker[0]), 1)
                        remainjoker.splice(remainjoker.indexOf(remainjoker[0]), 1);

                        if (remainjoker.length == 0) {
                            break;
                        }
                        // Break to avoid pushing the same joker card multiple times
                    }
                }
            }

        }

    }
    return callback({ impureSequences: impureSequences, Teen: Teen, RemainCard: RemainCard })

}

const possibilityCard = async (cards, cb) => {
    logger.info("possibilityCard cards ", cards)

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

    // logger.info("AFTER SORTING CARD 8585", cards)

    let impureSequences = [];
    let currentSequence = [];

    let cardCount = {}
    for (const card of cards) {
        const index = card.split('-')[1];
        if (cardCount[index]) {
            cardCount[index].push(card);
        } else {
            cardCount[index] = [card];
        }
    }
    let repeatedIndexes = Object.keys(cardCount).filter(index => cardCount[index].length >= 2);


    if (repeatedIndexes.length > 0) {
        repeatedIndexes = repeatedIndexes.map(index => cardCount[index]);
    }
    // logger.info("repeatedIndexes  *********************** 10", repeatedIndexes);

    let cards2 = _.difference(cards, _.flatten(repeatedIndexes))
    // logger.info("CARDS 222222222222222222222222222222 ", cards2)

    for (let i = 0; i < cards2.length; i++) {
        const currentCard = cards2[i];
        const currentRank = parseInt(currentCard.split('-')[1]);

        if (currentSequence.length == 0 || (parseInt(currentSequence[currentSequence.length - 1].split('-')[1]) === currentRank - 1)) {
            currentSequence.push(currentCard);
        } else {
            if (currentSequence.length >= 2) {
                impureSequences.push(currentSequence);
            }
            currentSequence = [currentCard];
        }
    }
    if (currentSequence.length >= 2) {
        impureSequences.push(currentSequence);
    }
    // logger.info("88888888888888888888888888888888888888888", impureSequences)
    let cards1 = _.difference(cards2, _.flatten(impureSequences))
    // logger.info("cards 11111111111", cards1)

    let currentSequence2 = []
    for (let i = 0; i < cards1.length; i++) {
        const currentCard = cards1[i];
        const currentRank = parseInt(currentCard.split('-')[1]);

        if (currentSequence2.length == 0 || (parseInt(currentSequence2[currentSequence2.length - 1].split('-')[1]) === currentRank + 1)) {
            currentSequence2.push(currentCard);
        } else {
            if (currentSequence2.length >= 2) {
                impureSequences.push(currentSequence2);
            }
            currentSequence2 = [currentCard];
        }
    }

    if (currentSequence2.length >= 2) {
        impureSequences.push(currentSequence2);
    }
    // logger.info("999999999999999999999999999999999999999999999999", impureSequences)

    // logger.info("impureseq 858585", impureSequences)

    // logger.info(" repeatedIndexes :::::::::::::::::: ", repeatedIndexes)
    if (repeatedIndexes.length > 0) {
        repeatedIndexes.forEach(element => {
            impureSequences.push(element);
        });
    }

    // logger.info("impureSequences :::::::::::: ", impureSequences)
    return cb(impureSequences)
}

module.exports = {
    findDealRoom,
    pic,
    checkCardMatched,
    checkCardFoundFollower,
    checkWinCard,
    mycardGroup,
    findIndexesTeen,
    findPureSequences,
    findImpureSequences,
    UnusedJoker,
    possibilityCard,
    RemainCardTounusecardThrow
}
