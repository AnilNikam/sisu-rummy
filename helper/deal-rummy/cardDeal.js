const mongoose = require('mongoose');
const PlayingTables = mongoose.model('playingTable');
const MongoID = mongoose.Types.ObjectId;

const fortuna = require('javascript-fortuna');
fortuna.init();

const logger = require('../../logger');
const CONST = require('../../constant');
const commandAcions = require('../socketFunctions');
const roundStartActions = require('../deal-rummy/roundStart');
const { createDealer } = require('../helperFunction');
const { checkWinCard } = require('./botFunction');

module.exports.cardDealStart = async (tbid) => {
  try {
    let wh = { _id: tbid };
    let table = await PlayingTables.findOne(wh, {}).lean();
    this.getCards(table.playerInfo, table, table.maxSeat, async (cardDetails) => {

      logger.info("deal cardDetails", cardDetails)

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

      logger.info("cardDealStart tableInfo =>", tableInfo);

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
    });
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

module.exports.getCards = async (playerInfo, table, maxSeat, callback) => {
  try {
    let deckCards = maxSeat == 6 ? Object.assign([], CONST.deckOne) : Object.assign([], CONST.singaldeckOne)
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

    // Array fillter si all robot asi 
    // rendom si 


    checkWinCard(deckCards, wildCard, async (ress) => {
      logger.info("deal BOT RES ::::::::::::::::::", ress)
      let cards = [];
      let deckCards = ress.deck;
      let issueEasyCard = true

      for (let i = 0; i < playerInfo.length; i++) {
        if (typeof playerInfo[i].seatIndex !== 'undefined' && playerInfo[i].status === 'PLAYING' && playerInfo[i].isBot && issueEasyCard) {

          cards.push(ress.card);
          issueEasyCard = false
          logger.info("Update a bot win status==>", playerInfo[i].playerId, playerInfo[i].name);

          // Update user bot state
          const upWh = {
            _id: MongoID(table._id.toString()),
            'playerInfo.seatIndex': Number(playerInfo[i].seatIndex), // Fixed variable name
          };

          const updateData = {
            $set: {
              'playerInfo.$.isEasy': true,
              "playerInfo.$.gCard": {
                pure: ress.pure,
                impure: ress.impure,
                set: ress.set,
                dwd: []
              }
            },
          };

          const tbl = await PlayingTables.findOneAndUpdate(upWh, updateData, {
            new: true,
          });
          logger.info('deal Declared table: ', tbl);
        } else if (typeof playerInfo[i].seatIndex !== 'undefined' && playerInfo[i].status === 'PLAYING') {
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
      logger.info("deal return ", {
        openCard,
        cards,
        wildCard,
        closeDeck: shuffleDeack,
        openDeck: [],
      })
      return callback({
        openCard,
        cards,
        wildCard,
        closeDeck: shuffleDeack,
        openDeck: [],
      });
    })
  } catch (err) {
    logger.error('cardDeal.js getCards error => ', err);
  }
};

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
