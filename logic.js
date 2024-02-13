const _ = require("underscore");

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

let myCard1 = deckOne.splice(0, 13);


// myCard = ['H-1-0', 'H-12-0', 'H-13-0', 'H-11-1', 'S-13-0', 'J-100-1', 'D-2-0', 'C-4-1', 'c-7-0', 'C-2-1', 'H-6-1'];
// myCard =
//     ['J-1-0', 'H-5-1',
//         'C-8-1', 'C-9-1',
//         'J-1-1', 'C-3-1',
//         'J-0-1', 'D-8-1',
//         'H-8-0', 'D-9-0',
//         'S-1-1', 'S-8-1',
//         'D-3-1']

MycardGroup(myCard1, 12)

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








function findIndexesTeen(cards, joker) {
    let cardCount = {};
    // console.log("CARDS :::::::::", cards)

    let jokers = cards.filter(item => item.startsWith("J") || parseInt(item.split("-")[1]) == joker);
    // console.log("jokers.length", jokers)
    cards = _.difference(cards, jokers)

    for (const card of cards) {
        const index = card.split('-')[1];
        if (cardCount[`0${index}`]) {
            cardCount[`0${index}`].push(card);
        } else {
            cardCount[`0${index}`] = [card];
        }
    }
    // console.log("cardCount *-*-*-*-* ", cardCount)

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
function findImpureSequences(cards, joker) {
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


let CARD = [[
    'C-7-0', 'C-9-1',
    'D-13-1', 'D-13-0',
    'H-2-0', 'H-5-1',
    'H-6-1', 'H-7-0',
    'H-10-1', 'J-1-1',
    'S-4-0', 'S-7-1',
    'S-8-1'
]]