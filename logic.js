const _ = require("underscore");
//const { RemainCardTounusecardThrow } = require("./helper/botFunction");


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
        console.log("cardgroupCard", cardgroupCard);

        let cardLengthwise = _.mapObject(cardgroupCard, function (val, key) {
            return val.length;
        });

        let cardvalues = _.flatten(_.values(cardLengthwise));

        console.log("cardvalues", cardvalues)
        console.log("::::::::::", _.filter(cardvalues, function (num) { return num > 1; }))

        if (_.filter(cardvalues, function (num) { return num > 1; }).length > 0) {
            status = false
            return status
        }

        console.log("statusFirst", statusFirst)
        console.log("status", status)

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
            console.log(cardNumber)
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

// Test cases
let res1 = checkImpureSequence(["S-11-1", "S-12-0", "S-12-1", "S-3-1", "S-12-1"], 'C-3-1');
console.log("Res1:", res1); // Expected output: false

//let res2 = checkImpureSequence(["S-11-1","S-12-0","S-3-1","S-13-1"],'C-3-1');
//console.log("Res2:", res2); // Expected output: true



return false
let deckOne = _.shuffle([
    'H-1-0', 'H-2-0', 'H-3-0', 'H-4-0', 'H-5-0', 'H-6-0', 'H-7-0', 'H-8-0', 'H-9-0', 'H-10-0', 'H-11-0', 'H-12-0', 'H-13-0',
    'S-1-0', 'S-2-0', 'S-3-0', 'S-4-0', 'S-5-0', 'S-6-0', 'S-7-0', 'S-8-0', 'S-9-0', 'S-10-0', 'S-11-0', 'S-12-0', 'S-13-0',
    'D-1-0', 'D-2-0', 'D-3-0', 'D-4-0', 'D-5-0', 'D-6-0', 'D-7-0', 'D-8-0', 'D-9-0', 'D-10-0', 'D-11-0', 'D-12-0', 'D-13-0',
    'C-1-0', 'C-2-0', 'C-3-0', 'C-4-0', 'C-5-0', 'C-6-0', 'C-7-0', 'C-8-0', 'C-9-0', 'C-10-0', 'C-11-0', 'C-12-0', 'C-13-0',
    'J-0-0', 'J-1-0',
    'C-1-1', 'C-2-1', 'C-3-1', 'C-4-1', 'C-5-1', 'C-6-1', 'C-7-1', 'C-8-1', 'C-9-1', 'C-10-1', 'C-11-1', 'C-12-1', 'C-13-1',
    'S-1-1', 'S-2-1', 'S-3-1', 'S-4-1', 'S-5-1', 'S-6-1', 'S-7-1', 'S-8-1', 'S-9-1', 'S-10-1', 'S-11-1', 'S-12-1', 'S-13-1',
    'D-1-1', 'D-2-1', 'D-3-1', 'D-4-1', 'D-5-1', 'D-6-1', 'D-7-1', 'D-8-1', 'D-9-1', 'D-10-1', 'D-11-1', 'D-12-1', 'D-13-1',
    'J-0-1',
    'H-1-1', 'H-2-1', 'H-3-1', 'H-4-1', 'H-5-1', 'H-6-1', 'H-7-1', 'H-8-1', 'H-9-1', 'H-10-1', 'H-11-1', 'H-12-1', 'H-13-1',
    'J-1-1',
]);

let myCard = [

    'C-1-0', 'C-5-1',
    'C-6-0', 'C-7-0',
    'C-11-0', 'C-12-1',
    'D-1-1', 'H-1-0',
    'H-13-1', 'S-1-1',
    'S-3-1', 'S-12-0',
    'S-13-1', 'S-13-0'

]



const RemainCardTounusecardThrow = async (MycardSet, callback) => {

    console.log("MycardSet ", MycardSet)

    UnusedJoker(MycardSet.dwd, 3, MycardSet.impure, MycardSet.set, (unusedJokercards) => {


        console.log("unusedJoker *-*-*-*-*-*-* ", unusedJokercards)

        possibilityCard(unusedJokercards.RemainCard, (possibiltyCard1) => {



            RemainCard = _.difference(unusedJokercards.RemainCard, _.flatten(possibiltyCard1))

            console.log("unusedJokercards.impureSequences ", unusedJokercards)
            console.log("unusedJokercards.impureSequences ", unusedJokercards.impureSequences)
            console.log("unusedJokercards.impureSequences ", unusedJokercards.Teen)

            let JSON = {
                pureSeqs: _.flatten(MycardSet.pure),
                ImpureSeqs: _.flatten(unusedJokercards.impureSequences),
                Teen: _.flatten(unusedJokercards.Teen),
                possibilityCard1: _.flatten(possibiltyCard1),
                RemainCard: _.flatten(RemainCard)
            }

            console.log("JSON :::::::::::::::::", JSON)

            return callback(JSON)
        })
    })
}

const UnusedJoker = async (RemainCard, joker, impureSequences, Teen, callback) => {
    console.log("RemainCard ", RemainCard)
    console.log("joker ", joker)

    let remainjoker = RemainCard.filter(item => (item.split("-")[0] == "J") || (parseInt(item.split("-")[1]) === joker))
    console.log("remainjoker *-*-*--*-*-*-*-*--** ", remainjoker)

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
    console.log("possibilityCard cards ", cards)

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

    // console.log("AFTER SORTING CARD 8585", cards)

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
    // console.log("repeatedIndexes  *********************** 10", repeatedIndexes);

    let cards2 = _.difference(cards, _.flatten(repeatedIndexes))
    // console.log("CARDS 222222222222222222222222222222 ", cards2)

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
    // console.log("88888888888888888888888888888888888888888", impureSequences)
    let cards1 = _.difference(cards2, _.flatten(impureSequences))
    // console.log("cards 11111111111", cards1)

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
    // console.log("999999999999999999999999999999999999999999999999", impureSequences)

    // console.log("impureseq 858585", impureSequences)






    // console.log(" repeatedIndexes :::::::::::::::::: ", repeatedIndexes)
    if (repeatedIndexes.length > 0) {
        repeatedIndexes.forEach(element => {
            impureSequences.push(element);
        });
    }

    // console.log("impureSequences :::::::::::: ", impureSequences)
    return cb(impureSequences)
}

cardjson = {
    pure: [['C-5-1', 'C-6-0', 'C-7-0'], ['S-12-0', 'S-13-1', 'S-1-1']],
    impure: [['C-11-0', 'C-12-1', 'S-3-1']],
    set: [['C-1-0', 'D-1-1', 'H-1-0']],
    dwd: ['H-13-1', 'S-13-0']
}

RemainCardTounusecardThrow(cardjson, async (RemainCard) => {

    console.log(RemainCard)

})

return false
// deckOne.splice(0, 13);


// myCard = ['H-1-0', 'H-12-0', 'H-13-0', 'H-11-1', 'S-13-0', 'J-100-1', 'D-2-0', 'C-4-1', 'c-7-0', 'C-2-1', 'H-6-1'];
// myCard =
//     ['J-1-0', 'H-5-1',
//         'C-8-1', 'C-9-1',
//         'J-1-1', 'C-3-1',
//         'J-0-1', 'D-8-1',
//         'H-8-0', 'D-9-0',
//         'S-1-1', 'S-8-1',
//         'D-3-1']

//MycardGroup(myCard1, 9)

function MycardGroup(myCard, wildcard) {

    const pureSeqs = findPureSequences(myCard);
    // console.log("Pure sequences:", pureSeqs);

    let RemainCard = _.difference(myCard, _.flatten(pureSeqs))
    // console.log("RemainCard ==============> ", RemainCard)


    // Example usage:
    const impureSequences = findImpureSequences(RemainCard, wildcard);
    // console.log("impureSequences *-*-*-*-*-*-*", impureSequences)

    RemainCard = _.difference(RemainCard, _.flatten(impureSequences))
    // // console.log("RemainCard", RemainCard);

    const Teen = findIndexesTeen(RemainCard, wildcard);
    // console.log("TEEN", Teen);
    RemainCard = _.difference(RemainCard, _.flatten(Teen))
    // console.log("RemainCard", RemainCard);

    console.log("*********************************************")
    console.log("MYCARD **** ", myCard)
    let JSON = {
        pureSeqs: pureSeqs,
        ImpureSeqs: impureSequences,
        Teen: Teen,
        RemainCard: RemainCard
    }
    console.log("JSON +++ ", JSON)
    console.log("*********************************************")

}

// console.log("PURE LENGTH ",_.flatten(pureSeqs).length)
// console.log("IMPURE LENGTH ",_.flatten(impureSequences).length)
// console.log("TEEN LENGTH ",_.flatten(Teen).length)
// console.log("REMAIN LENGTH",_.flatten(RemainCard).length)
findIndexesTeen(['C-3-0', 'S-3-1', 'S-3-0'], 1)
function findIndexesTeen(cards, joker) {
    let cardCount = {};
    // console.log("CARDS :::::::::", cards)

    let jokers = cards.filter(item => item.startsWith("J") || parseInt(item.split("-")[1]) == joker);
    // console.log("jokers.length", jokers)
    cards = _.difference(cards, jokers)
    console.log("cards ", cards)
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
    console.log("sortedArray ", sortedArray)
    for (let [key, value] of sortedArray) {
        // console.log(key, " ", value)
        let filteredArray = value.filter((card, index, array) => array.findIndex(c => c[0] === card[0]) === index);
        cardCount[key] = filteredArray;
    }

    console.log("sortedObject 555555555555555555555555555555555555555", cardCount)


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
    console.log(" repeat edIndexes ........... ", repeatedIndexes)
    return repeatedIndexes;
}
function findPureSequences(cards) {

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
        const currentSuit = currentCard.split('-')[0];
        const currentRank = parseInt(currentCard.split('-')[1]);

        let InCurrentSequenceJoker = currentSequence.filter(item => item.startsWith("J") || parseInt(item.split("-")[1]) == joker).length == 1

        if (currentSequence.length === 0) {
            currentSequence.push(currentCard);

        } else if (currentSequence[currentSequence.length - 1].split('-')[0] === currentSuit && (parseInt(currentSequence[currentSequence.length - 1].split('-')[1]) === currentRank - 1)) {
            currentSequence.push(currentCard);
        } else if ((jokers.length > 0 && !InCurrentSequenceJoker && (currentSequence[currentSequence.length - 1].split('-')[0] === currentSuit && parseInt(currentSequence[currentSequence.length - 1].split('-')[1]) === currentRank - 2))) {
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


let CARD = [[
    'C-7-0', 'C-9-1',
    'D-13-1', 'D-13-0',
    'H-2-0', 'H-5-1',
    'H-6-1', 'H-7-0',
    'H-10-1', 'J-1-1',
    'S-4-0', 'S-7-1',
    'S-8-1'
]]