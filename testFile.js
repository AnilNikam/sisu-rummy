
const _ = require("underscore");


let deck = [
    'H-1-0', 'H-2-0', 'H-3-0', 'H-4-0', 'H-5-0', 'H-6-0', 'H-7-0', 'H-8-0', 'H-9-0', 'H-10-0', 'H-11-0', 'H-12-0', 'H-13-0',
    'S-1-0', 'S-2-0', 'S-3-0', 'S-4-0', 'S-5-0', 'S-6-0', 'S-7-0', 'S-8-0', 'S-9-0', 'S-10-0', 'S-11-0', 'S-12-0', 'S-13-0',
    'D-1-0', 'D-2-0', 'D-3-0', 'D-4-0', 'D-5-0', 'D-6-0', 'D-7-0', 'D-8-0', 'D-9-0', 'D-10-0', 'D-11-0', 'D-12-0', 'D-13-0',
    'C-1-0', 'C-2-0', 'C-3-0', 'C-4-0', 'C-5-0', 'C-6-0', 'C-7-0', 'C-8-0', 'C-9-0', 'C-10-0', 'C-11-0', 'C-12-0', 'C-13-0',
    'J-0-0', 'J-1-0'
]


const generatePureSequence = (deck, callback) => {
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
    console.log("suitCards ", suitCards)

    // Check if there are at least three consecutive cards in the suit
    for (let i = 0; i <= suitCards.length - 3; i++) {
        const sequence = suitCards.slice(i, i + 3);
        const valuesDiff = sequence.map(card => parseInt(card.split('-')[1]) - 1);
        const isConsecutive = valuesDiff.every((val, index) => val === parseInt(sequence[0].split('-')[1]) - 1 + index);

        if (isConsecutive) {

            return callback(sequence);
        }
    }

    // If no consecutive sequence found, try again
    return callback(generatePureSequence(deck, callback))
};

// Function to generate an impure sequence
const generateImpureSequence = (deck, joker) => {
    const suits = ['H', 'D', 'S', 'C']; // Hearts, Diamonds, Spades, Clubs

    // Make a copy of the deck
    const copiedDeck = [...deck];

    // Shuffle the copied deck
    const shuffledDeck = shuffleArray(copiedDeck);

    // Choose a random suit
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];

    // Filter cards with the chosen suit from the shuffled deck
    const suitCards = shuffledDeck.filter(card => card.startsWith(randomSuit));

    // Sort the suit cards based on their values
    suitCards.sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));

    // Choose two cards randomly from the suit cards
    const chosenCards = [suitCards[0], suitCards[1]];

    // Remove the chosen cards from the original deck
    deck = _.difference(deck, chosenCards);
    console.log("Remove impre card ==>", deck)

    // Insert the joker at a random position
    const randomIndex = Math.floor(Math.random() * 3);
    chosenCards.splice(randomIndex, 0, joker);

    // Remove the joker from the original deck
    deck = _.without(deck, joker);

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

        if (rank === randomRank && set.length < 4) {
            set.push(card);
            deck.splice(deck.indexOf(card), 1);

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

const checkWinCard = (deck, wildCard, call) => {
    const jokers = ['J-0-0', 'J-1-1'];

    // Generate sequences
    generatePureSequence(deck, (pureSequence) => {
        console.log("pureSequence ", pureSequence);
        deck = _.difference(deck, pureSequence.flat());
        console.log("deck after removing pureSequence: ", deck);

        const impureSequences = jokers.map(joker => generateImpureSequence(deck, joker));
        console.log("impureSequences ", impureSequences);

        const impureCards = impureSequences.flat();
        deck = _.difference(deck, impureCards);
        console.log("deck after removing impureCards: ", deck);

        const cardSet = generateSet(deck);

        // Output the generated sequences
        const sequences = {
            pure: [pureSequence],
            impure: impureSequences,
            set: [cardSet]
        };
        console.log("sequences =>", sequences);
        return call(sequences);
    });
};


checkWinCard(deck, "H-13-0", (ress) => {
    console.log("ress ", ress)
    console.log("after impure deck ", deck)

})





