const logger = require("../logger");
const CONST = require("../constant");
const config = require("../config");
var io = require('socket.io-client')
const schedule = require('node-schedule');
const cardFunction = require('./cardFunction');
const { getRandomNumber } = require("./helperFunction");
const { BOT_USERS } = require("../constant");
var socket = io.connect(config.SOCKET_CONNECT, { reconnect: true });

function findRoom(botGamePlayType, botEntryFee) {

    console.log("Funcion in find room............");
    // const myIo = {}
    // myIo.init = function (server) {
    // io.on("connection", (socket) => {

    console.log("Bot Player Function call======================>");
    var userame = "@appsomania@";
    var entryFee = botEntryFee;
    var gamePlayType = botGamePlayType;

    // var randomPlayerIndex = Math.floor(Math.random() * users.length - 1);
    var randomPlayerIndex = Math.floor(Math.random() * (BOT_USERS.length - 1 - 0) + 0)
    console.log('randomPlayerIndex => ', randomPlayerIndex);

    console.log('users[randomPlayerIndex] => ', BOT_USERS[randomPlayerIndex]);

    //Search room
    return socket.emit("req", {
        eventName: 'SP',
        data: {
            entryFee,
            gamePlayType,
            deviceId: "deviceAsBOT",
            playerDetail: BOT_USERS[randomPlayerIndex],
            playerId: "61bd9cd637d40aa7d470d7ca",

        }
    })

}

const pic = async (table, playerId, gamePlayType, deckType) => {
    try {

        let Pictimer = [3, 4];
        let findPicTimeIndex = findDeclareCard(Pictimer.length - 1);
        var startPicScheduleTime = Date.now() + Pictimer[findPicTimeIndex] * 1000
        schedule.scheduleJob(table.tableId, startPicScheduleTime, function () {
            schedule.cancelJob(table.tableId);
            logger.info("Bot PIC event call");
            let playerIndex = table.players.findIndex(o => o.playerId === table.currentPlayingPlayerId);
            let player = table.players[playerIndex];
            // console.info('bot player cards => ', player.cards);

            let closeDeckCardIndex;
            let closeDeckCard;

            closeDeckCardIndex = table.closedDeck.length - 1;
            closeDeckCard = table.closedDeck[closeDeckCardIndex];

            console.info('Bot Closed Deck Card Index=> ', closeDeckCardIndex);
            console.info('Bot select Closed Deck Card => ', closeDeckCard);



            socket.emit("req", {
                eventName: CONST.PICK_CARD,
                data: {
                    deck: deckType,
                    tableId: table.tableId,
                    playerId: playerId,
                    gamePlayType: gamePlayType,
                }
            })




            var startPicScheduleTime = Date.now() + getRandomNumber(3000, 6500)
            schedule.scheduleJob(table.tableId, startPicScheduleTime, function () {
                try {

                    //cancel the Schedule
                    schedule.cancelJob(table.tableId);
                    // console.log("Data ----->", playerId + "****" + gamePlayType + " ***" + table.tableId);
                    let playerIndex = table.players.findIndex(o => o.playerId === table.currentPlayingPlayerId);
                    let player = table.players[playerIndex];
                    console.info('userTurnSet playerIndex,player => ', playerIndex + "Player" + player);
                    // console.log("Player Cards", player.cards);
                    //Select Card for Discard
                    if (player) {
                        playerCards = player.cards
                        let selectDiscardCard = convertCardPairAndFollowers(playerCards);

                        logger.info('selectDiscardCard => ', selectDiscardCard);
                        logger.info('select Discard followers Card => ', selectDiscardCard.followers + ' select Discard followers Card => ' + selectDiscardCard.pair);

                        const isWinner = checkPairAndFollowers(playerCards);
                        console.info('isWinner => ', isWinner);

                        if (isWinner.status) {
                            socket.emit("req", {
                                eventName: CONST.DECLARE,
                                data: {
                                    tableId: table.tableId,
                                    playerId: playerId,
                                    gamePlayType: gamePlayType,
                                }
                            })
                        } else {
                            const throwCard = selectThrowcard(playerCards, selectDiscardCard.followers, selectDiscardCard.pair)
                            console.info('throwCard => ', throwCard);

                            socket.emit("req", {
                                eventName: CONST.DISCARD,
                                data: {
                                    cardName: throwCard,
                                    tableId: table.tableId,
                                    playerId: playerId,
                                    gamePlayType: gamePlayType,
                                }
                            })
                        }
                    } else {
                        console.info('<= Player Not Found => ');

                    }
                } catch (error) {
                    logger.error("Discard or Declare event of BOT", error);
                }
            })
        })
    } catch (error) {
        console.log("try catch error in bot pic event");
    }


}

const findDeclareCard = (max) => {
    var min = Math.ceil(0);
    var max = Math.floor(max);
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
