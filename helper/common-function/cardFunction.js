const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const PlayingTables = mongoose.model('playingTable');

const logger = require('../../logger');
const _ = require("underscore");
const { getPlayingUserInRound } = require('./manageUserFunction');

const checkPureSequence = (card) => {
  let cardType = [];
  let cardNumber = [];
  let status = false;

  for (let i = 0; i < card.length; i++) {
    const words = card[i].split('-');
    cardType.push(words[0]);
    cardNumber.push(parseInt(words[1]));
  }

  cardNumber.sort(function (a, b) {
    return a - b;
  });
  // check card suit
  for (let i = 0; i < cardType.length - 1; i++) {
    if (cardType[i] === cardType[i + 1]) {
      status = true;
    } else {
      status = false;
      break;
    }
  }

  if (status === true) {
    for (let i = 0; i < cardNumber.length - 1; i++) {
      if (cardNumber[i] - cardNumber[i + 1] === -1) {
        status = true;
      } else {
        status = false;
        break;
      }
    }
    if (status === false) {
      for (let i = 0; i < cardNumber.length - 1; i++) {
        if (cardNumber[i] === 1) {
          cardNumber[i] = 14;
        }
      }

      cardNumber.sort(function (a, b) {
        return a - b;
      });

      for (let i = 0; i < cardNumber.length - 1; i++) {
        let dif = cardNumber[i] - cardNumber[i + 1];
        if (dif === -1) {
          status = true;
        } else {
          status = false;
          break;
        }
      }
    }
  }

  return status;
};

const checkImpureSequence = (card, wildCard) => {
  const joker = [];
  let cardType = [];
  let cardNumber = [];
  let status = false;

  if (card.length > 2) {
    for (let i = 0; i < card.length; i++) {
      const words = card[i].split('-');
      if (words[0] === 'J' || wildCard.split('-')[1] === words[1]) {
        joker.push(words[0]);
      } else {
        cardType.push(words[0]);
        cardNumber.push(parseInt(words[1]));
      }
    }

    if (joker.length == 0) {
      status = false
      return status
    }

    cardNumber.sort(function (a, b) {
      return a - b;
    });

    joker.concat(wildCard);
    let statusFirst = true;
    for (let i = 0; i < cardType.length - 1; i++) {
      if (cardType[i] === cardType[i + 1]) {
        status = true;
      } else {
        status = false;
      }
    }


    let cardgroupCard = _.groupBy(cardNumber, function (num) { return Math.floor(num); })
    // logger.info("cardgroupCard", cardgroupCard);

    let cardLengthwise = _.mapObject(cardgroupCard, function (val, key) {
      return val.length;
    });

    let cardvalues = _.flatten(_.values(cardLengthwise));

    // logger.info("cardvalues", cardvalues)
    // logger.info("::::::::::", _.filter(cardvalues, function (num) { return num > 1; }))

    if (_.filter(cardvalues, function (num) { return num > 1; }).length > 0) {
      status = false
      return status
    }

    // logger.info("statusFirst", statusFirst)
    // logger.info("status", status)

    if (status === true) {
      for (let i = 0; i < cardNumber.length - 1; i++) {
        let dif = cardNumber[i] - cardNumber[i + 1];

        if (dif === -1) {
          status = true;
        } else if (joker.length != 0 && Math.abs(dif) - 1 <= joker.length) {
          status = true;
          joker.splice(Math.abs(dif) - 1);
        } else {
          statusFirst = false;
        }
      }
    }

    if (statusFirst === false) {
      for (let i = 0; i < cardNumber.length; i++) {
        if (cardNumber[i] === 1) {
          cardNumber[i] = 14;
        }
      }
      cardNumber.sort(function (a, b) {
        return a - b;
      });
      for (let i = 0; i < cardNumber.length - 1; i++) {
        let dif = cardNumber[i] - cardNumber[i + 1];

        if (dif === -1) {
          status = true;
        } else if (joker.length != 0 && Math.abs(dif) - 1 <= joker.length) {
          status = true;
          joker.splice(Math.abs(dif) - 1);
        } else {
          status = false;
          break;
        }
      }
    }
  }
  return status;
};

const checkSet = (card, wildCard) => {
  const joker = [];
  let cardType = [];
  let cardNumber = [];
  let status = false;

  if (card.length - 1 >= 2 && card.length - 1 <= 4) {
    for (let i = 0; i < card.length; i++) {
      const words = card[i].split('-');

      if (words[0] === 'J' || wildCard.split('-')[1] === words[1]) {
        joker.push(words[0]);
      } else {
        cardType.push(words[0]);
        cardNumber.push(parseInt(words[1]));
      }
    }

    cardNumber.sort(function (a, b) {
      return a - b;
    });

    joker.concat(wildCard);

    for (let i = 0; i < cardType.length - 1; i++) {
      if (cardType[i] === cardType[i + 1]) {
        status = false;
        break;
      } else {
        status = true;
      }
    }

    if (status === true) {
      for (let i = 0; i < cardNumber.length - 1; i++) {
        let dif = cardNumber[i] - cardNumber[i + 1];

        if (dif !== 0) {
          status = false;
        }
      }
    } else {
      status = false;
    }
  }
  return status;
};

const checkAnyPure = (cards) => {
  for (let i = 0; i < cards.length; i++) {
    if (checkPureSequence(cards[i])) {
      return true;
    }
  }

  return false;
};

const checkAnyImpure = (cards, wildCard) => {
  let count = 0;
  for (let i = 0; i < cards.length; i++) {
    if (checkImpureSequence(cards[i], wildCard)) {
      count = count + 1;
      return true;
    }
  }

  return false;
};

const checkAnySet = (cards, wildCard) => {
  let count = 0;
  for (let i = 0; i < cards.length; i++) {
    let setSeq = checkSet(cards[i], wildCard);
    if (setSeq) {
      count = count + 1;
      return true;
    }
  }
  return false;
};

const getScore = async (gcard, wildCard) => {
  let totalScore = 0;
  let allCards = [];
  let anyPureSeq = checkAnyPure(gcard.pure);
  //let anyImpureSeq = checkAnyImpure(gcard.impure, wildCard);
  //let anySetSeq = checkAnySet(gcard.set, wildCard);

  //logger.info('anyImpureSeq,anySetSeq', anyImpureSeq, anySetSeq);

  if (anyPureSeq) {
    let int = gcard.pure.length + gcard.impure.length;
    if (int > 1) {
      allCards = [...gcard.dwd].flat(Infinity);
    } else {
      allCards = [...gcard.impure, ...gcard.set, ...gcard.dwd].flat(Infinity);
    }
    totalScore = checkCardScore(allCards, wildCard);
  } else {
    allCards = [...gcard.impure, ...gcard.set, ...gcard.dwd].flat(Infinity);
  }

  totalScore = checkCardScore(allCards, wildCard);
  return totalScore;
};

const checkCardScore = (allCards, wildCard) => {
  let cardNumber = [];
  let jokers = [];
  let totalScore = 0;

  allCards.forEach((card) => {
    const words = card.split('-');
    if (words[0] === 'J' || wildCard.split('-')[1] === words[1]) {
      jokers.push(words[0]);
    } else {
      let number = parseInt(words[1]);
      if (number === 1 || number > 10) {
        number = 10;
      }
      cardNumber.push(number);
    }
  });
  cardNumber.forEach((number) => {
    totalScore += parseInt(number);
  });

  if (totalScore > 80) {
    totalScore = 80;
  }
  return totalScore;
};

const getScoreCard = (card) => {
  try {
    let cardType = [];
    let cardNumber = [];
    let pair = [];
    let followers = [];
    let dwd = [];
    let status = false;

    for (let i = 0; i < card.length; i++) {
      const words = card[i].split('-');
      cardType.push(words[0]);
      cardNumber.push(parseInt(words[1]));
    }

    dwd = dwd.concat(cardNumber);
    dwd.sort(function (a, b) {
      return a - b;
    });
    cardNumber.sort(function (a, b) {
      return a - b;
    });

    for (let i = 0; i < dwd.length - 1; i++) {
      let dif = dwd[i] - dwd[i + 1];
      if (dif === 0) {
        pair.push(dwd[i], dwd[i + 1]);
        let idx = cardNumber.indexOf(dwd[i]);
        cardNumber.splice(idx, 2);
        i++;
      }
    }

    for (let i = 0; i < cardNumber.length; i++) {
      if (cardNumber[i] > 10) {
        cardNumber[i] = cardNumber[i] + 10;
      }
    }

    for (let i = 0; i < cardNumber.length - 1; i++) {
      let dif = cardNumber[i] - cardNumber[i + 1];

      if (cardNumber[i] > 10) {
        if (dif === -1 || dif === -2) {
          followers.push(cardNumber[i], cardNumber[i + 1]);
          let idx = cardNumber.indexOf(dwd[i]);
          cardNumber.splice(idx, 2);
        }
      } else if (dif === -1) {
        followers.push(cardNumber[i], cardNumber[i + 1]);
        let idx = cardNumber.indexOf(dwd[i]);
        cardNumber.splice(idx, 2);
      } else {
        //dwd.push(cardNumber[i]);
      }
    }

    for (let i = 0; i < pair.length - 1; i++) {
      let dif = pair[i] - pair[i + 1];
      if (dif === 0) {
        status = true;
      } else {
        status = false;
        break;
      }
    }

    if (status === true) {
      if (followers.length === 2) {
        followers.sort(function (a, b) {
          return a - b;
        });
        for (let i = 0; i < followers.length - 1; i++) {
          if (followers[i] > 10) {
            followers[i] = followers[i] + 10;
          }
        }

        for (let i = 0; i < followers.length - 1; i++) {
          let dif = followers[i] - followers[i + 1];

          if (followers[i] === 10 && followers[i + 1] === 11) {
            status = false;
            break;
          }
          if (followers[i] > 10) {
            if (dif === -1 || dif === -2) {
              status = true;
            }
          } else if (dif === -1) {
            status = true;
          }
        }
      } else {
        status = false;
      }
    }

    return status;
  } catch (error) {
    logger.error('cardFunction.js getScoreCard error=> ', error);
    return false;
  }
};

const countPlayerScore = async (table) => {
  try {
    logger.info('countPlayerScore Table =>', table);
    let finalplayersScoreBoard = [];
    logger.info('\n countPlayerScore table.playerInfo =>', table.playerInfo);

    const playerInGame = await getPlayingUserInRound(table.playerInfo);

    let alreadyCalculatedScorePlayersIds = table.playersScoreBoard.map(({ playerId }) => playerId);

    playerInGame.map((player) => {
      logger.info('countPlayerScore Player =>', player);
      if (alreadyCalculatedScorePlayersIds.indexOf(player.playerId) < 0) {
        finalplayersScoreBoard.push({
          playerId: player._id,
          playerName: player.name,
          result: player.playerStatus,
          cards: player.cards,
          chips: player.point,
          point: player.point,
          //lostChips: player.point * table.entryFee,
          lostChips: player.playerLostChips,
          gameChips: player.gameChips,
          gCards: player.gCard,
          avatar: player.avatar,
        });
      }
    });

    logger.info('finalplayersScoreBoard', finalplayersScoreBoard);
    // eslint-disable-next-line no-param-reassign
    table.playersScoreBoard = table.playersScoreBoard.concat(finalplayersScoreBoard);

    let wh = {
      _id: MongoID(table._id),
    };

    let updateData = {
      $set: {
        playersScoreBoard: table.playersScoreBoard,
      },
    };

    let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
      new: true,
    });
    logger.info(' Table Info =>', tbInfo);

    return tbInfo.playersScoreBoard;
  } catch (error) {
    logger.error('cardFunction.js countPlayerScore error => ', error);
    return false;
  }
};

const pushPlayerScoreToPlayerScoreBoard = async (table, player) => {
  try {
    table.playersScoreBoard.push({
      playerId: player.playerId,
      playerName: player.name,
      result: player.playerStatus,
      cards: player.cards,
      point: player.point,
      gCards: player.gCard,
      gameChips: player.gameChips,
      debitChips: player.debitChips,
      lostChips: player.lostChips,
      avatar: player.avatar,
    });

    let wh = {
      _id: MongoID(table._id.toString()),
    };

    let updateData = {
      $set: {
        playersScoreBoard: table.playersScoreBoard,
      },
    };

    let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
      new: true,
    });

    return tbInfo.playersScoreBoard;
  } catch (error) {
    logger.error('cardFunction.jsr pushPlayerScoreToPlayerScoreBoard error=> ', error);
  }
};



module.exports = {
  checkPureSequence,
  checkCardScore,
  checkAnySet,
  checkAnyImpure,
  checkSet,
  checkImpureSequence,
  checkAnyPure,
  getScore,
  countPlayerScore,
  pushPlayerScoreToPlayerScoreBoard,
  getScoreCard,
};
