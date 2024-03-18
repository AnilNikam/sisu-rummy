const mongoose = require('mongoose');
const PlayingTables = mongoose.model('playingTable');
const MongoID = mongoose.Types.ObjectId;

const fortuna = require('javascript-fortuna');
fortuna.init();

const logger = require('../../logger');
const CONST = require('../../constant');
const commandAcions = require('../socketFunctions');
const roundStartActions = require('../rummy/roundStart');
const { createDealer } = require('../helperFunction');

module.exports.cardDealStart = async (tbid) => {
  try {
    let wh = { _id: tbid };
    let table = await PlayingTables.findOne(wh, {}).lean();
    let cardDetails = this.getCards(table.playerInfo);

    table.openDeck.push(cardDetails.openCard);
    let dealerSeatIndex = createDealer(table.activePlayer - 1);

    const update = {
      $set: {
        openCard: cardDetails.openCard,
        closeDeck: cardDetails.closeDeck,
        wildCard: cardDetails.wildCard,
        openDeck: table.openDeck,
        dealerSeatIndex,
        currentPlayerTurnIndex: dealerSeatIndex,
        gameState: CONST.CARD_DEALING,
      },
    };

    const cardDealIndexs = await this.setUserCards(cardDetails, table);

    const tableInfo = await PlayingTables.findOneAndUpdate(wh, update, {
      new: true,
    });

    const eventResponse = {
      si: cardDealIndexs,
      di: tableInfo.dealerSeatIndex,
      wd: tableInfo.wildCard,
      openCard: tableInfo.openCard,
      closeDeck: tableInfo.closeDeck,
      closedecklength: tableInfo.closeDeck.length,
    };

    logger.info("cardDealStart tableInfo.playerInfo ->", tableInfo.playerInfo)
    logger.info("cardDealStart tableInfo.playerInfo ->", new Date())

    tableInfo.playerInfo.forEach((player) => {
      if (player && typeof player.seatIndex !== 'undefined' && player.status === 'PLAYING' && player.isBot !== true) {
        eventResponse.card = player.cards;
        logger.info("cardDealStart tableInfo.playerInfo -> send Time ", new Date())

        commandAcions.sendDirectEvent(player.sck.toString(), CONST.GAME_CARD_DISTRIBUTION, eventResponse);
      }
    });
    logger.info("cardDealStart tableInfo.playerInfo after  ->", new Date())

    let tbId = tableInfo._id;
    // let jobId = commandAcions.GetRandomString(10);
    // let delay = commandAcions.AddTime(4);

    // await commandAcions.setDelay(jobId, new Date(delay));

    await roundStartActions.roundStarted(tbId);
  } catch (err) {
    logger.error('cardDeal.js cardDealStart error => ', err);
  }
};

module.exports.setUserCards = async (cardsInfo, tableInfo) => {
  try {
    const playerInfo = tableInfo.playerInfo;
    let activePlayer = 0;
    let cardDealIndexs = [];

    for (let i = 0; i < playerInfo.length; i++) {
      if (typeof playerInfo[i].seatIndex !== 'undefined' && playerInfo[i].status === 'PLAYING') {
        let update = {
          $set: {
            'playerInfo.$.cards': cardsInfo.cards[activePlayer],
          },
        };

        let uWh = {
          _id: MongoID(tableInfo._id.toString()),
          'playerInfo.seatIndex': Number(playerInfo[i].seatIndex),
        };

        await PlayingTables.updateOne(uWh, update);

        cardDealIndexs.push(Number(playerInfo[i].seatIndex));
        activePlayer++;
      }
    }

    return cardDealIndexs;
  } catch (err) {
    logger.error('cardDeal.js setUserCards error => ', err);
  }
};

module.exports.getCards = (playerInfo) => {
  try {
    let deckCards = Object.assign([], CONST.deckOne);
    deckCards = shuffle(deckCards);

    let ran = parseInt(fortuna.random() * deckCards.length);
    let openCard = deckCards[ran];

    deckCards.splice(ran, 1);

    let wildCardIndex = parseInt(fortuna.random() * deckCards.length);
    let wildCard = deckCards[wildCardIndex];

    while (wildCard === 'J-0-0' || wildCard === 'J-1-0' || wildCard === 'J-0-1' || wildCard === 'J-1-1') {
      wildCardIndex = parseInt(fortuna.random() * deckCards.length);
      wildCard = deckCards[wildCardIndex];
    }
    deckCards.splice(wildCardIndex, 1);

    let cards = [];

    for (let i = 0; i < playerInfo.length; i++) {
      if (typeof playerInfo[i].seatIndex !== 'undefined' && playerInfo[i].status === 'PLAYING') {
        let card = [];
        for (let i = 0; i < 13; i++) {
          let ran = parseInt(fortuna.random() * deckCards.length);
          card.push(deckCards[ran]);
          deckCards.splice(ran, 1);
        }
        cards.push(card);
      }
    }

    let shuffleDeack = shuffle(deckCards);

    return {
      openCard,
      cards,
      wildCard,
      closeDeck: shuffleDeack,
      openDeck: [],
    };
  } catch (err) {
    logger.error('cardDeal.js getCards error => ', err);
  }
};

/*
module.exports.getCards = (playerInfo) => {
  try {
    let openCard = 'D-6-1';

    let cards = [
      ['D-9-1', 'D-10-0', 'D-8-1', 'H-8-0', 'H-9-0', 'H-10-0', 'C-6-1', 'C-11-0', 'D-11-1', 'H-11-1', 'D-3-0', 'H-6-0', 'D-4-0'],
      ['C-7-0', 'J-0-1', 'S-7-0', 'D-13-1', 'C-3-0', 'S-4-0', 'H-4-1', 'S-2-0', 'D-3-1', 'H-5-1', 'H-7-0', 'H-3-0', 'D-5-1'],
    ];

    let wildCard = 'D-6-0';

    let closeDeck = [
      'S-4-1',
      'S-3-1',
      'H-4-0',
      'C-2-0',
      'H-8-1',
      'D-2-1',
      'C-8-0',
      'J-1-1',
      'C-1-1',
      'H-12-0',
      'C-10-1',
      'C-8-1',
      'S-6-0',
      'C-7-1',
      'D-2-0',
      'S-10-0',
      'C-12-0',
      'H-12-1',
      'C-9-0',
      'D-7-1',
      'S-8-1',
      'S-13-1',
      'D-1-1',
      'S-3-0',
      'C-5-0',
      'S-10-1',
      'S-2-1',
      'S-13-0',
      'S-1-0',
      'H-7-1',
      'H-1-0',
      'D-7-0',
      'J-0-0',
      'S-12-0',
      'D-9-0',
      'C-12-1',
      'C-4-1',
      'D-10-1',
      'D-13-0',
      'S-1-1',
      'C-5-1',
      'S-11-1',
      'S-5-1',
      'S-12-1',
      'H-5-0',
      'H-3-1',
      'D-5-0',
      'D-12-0',
      'H-1-1',
      'S-11-0',
      'C-3-1',
      'C-13-1',
      'C-4-0',
      'C-13-0',
      'C-11-1',
      'H-13-0',
      'H-13-1',
      'D-11-0',
      'S-8-0',
      'C-9-1',
      'D-8-0',
      'D-12-1',
      'C-6-0',
      'C-2-1',
      'S-5-0',
      'D-1-0',
      'S-9-0',
      'S-6-1',
      'C-1-0',
      'D-4-1',
      'H-10-1',
      'C-10-0',
      'H-6-1',
      'H-2-0',
      'S-7-1',
      'H-11-0',
      'H-2-1',
      'H-9-1',
      'J-1-0',
      'S-9-1',
    ];

    let openDeck = [];
    /*
    let deckCards = Object.assign([], CONST.deckOne);
    deckCards = shuffle(deckCards);

    let ran = parseInt(fortuna.random() * deckCards.length);
    let openCard = deckCards[ran];

    deckCards.splice(ran, 1);

    let wildCardIndex = parseInt(fortuna.random() * deckCards.length);
    let wildCard = deckCards[wildCardIndex];

    while (wildCard === 'J-0-0' || wildCard === 'J-1-0' || wildCard === 'J-0-1' || wildCard === 'J-1-1') {
      wildCardIndex = parseInt(fortuna.random() * deckCards.length);
      wildCard = deckCards[wildCardIndex];
    }
    deckCards.splice(wildCardIndex, 1);

    let cards = [];

    for (let i = 0; i < playerInfo.length; i++) {
      if (typeof playerInfo[i].seatIndex !== 'undefined' && playerInfo[i].status === 'PLAYING') {
        let card = [];
        for (let i = 0; i < 13; i++) {
          let ran = parseInt(fortuna.random() * deckCards.length);
          card.push(deckCards[ran]);
          deckCards.splice(ran, 1);
        }
        cards.push(card);
      }
    }

    let shuffleDeack = shuffle(deckCards);
*/
/*   
return {
      openCard,
      cards,
      wildCard,
      closeDeck: closeDeck, //shuffleDeack,
      openDeck: openDeck, //[],
    };
  } catch (err) {
    logger.error('cardDeal.js getCards error => ', err);
  }
};
*/
const shuffle = (deck) => {
  // switch the values of two random cards
  try {
    let deckList = Object.assign([], deck);
    for (let i = 0; i < 100; i++) {
      let location1 = Math.floor(Math.random() * deckList.length);
      let location2 = Math.floor(Math.random() * deckList.length);
      let tmp = deckList[location1];

      deckList[location1] = deckList[location2];
      deckList[location2] = tmp;
    }
    return deckList;
  } catch (err) {
    logger.error('cardDeal.js shuffle error => ', err);
  }
};
