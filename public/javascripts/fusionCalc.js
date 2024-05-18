const resetBtn = document.getElementById("resetBtn");
const outputLeft = document.getElementById("outputarealeft");
const outputRight = document.getElementById("outputarearight");

const cardsById = {};
const cardsByName = {};
const equipsList = [];
const resultsList = []; 

const handCompletions = {};
for (let i = 1; i <= 5; i++) {
    const hand = document.getElementById("hand" + i);
    handCompletions["hand" + i] = hand;
}

fetch("data/Cards.json").then((req) => req.json()).then((cards) => {
    cards.forEach((card) => {
        cardsById[card.Id] = card;
        cardsByName[card.Name.toLowerCase()] = card;

        if (card.Equip) {
            card.Equip.forEach((id) => {
                equipsList[id] = equipsList[id] || [];
                equipsList[id].push(card.Id);
            });
        }
        if (card.Fusions) {
            card.Fusions.forEach((fusion) => {
                const id = fusion._result;
                resultsList[id] = resultsList[id] || [];
                resultsList[id].push(fusion._card1, fusion._card2);
            });
        }
    });

    // Initialize Awesomplete
    const names = cards.map((card) => card.Name)
    Object.values(handCompletions).forEach(
        (input) => new Awesomplete(input, { autoFirst: true, list: names })
    );
});

// Creates a div for each fusion
function fusesToHTML(fuselist) {
    return fuselist
        .map(function (fusion) {
            var res = "<div class='result-div'>";
            if (fusion.result) {
                // Equips and Results don't have a result field
                res += "<br>Result: " + fusion.result.Name;
                if (isMonster(fusion.result)) {
                    res += " " + formatStats(fusion.result.Attack, fusion.result.Defense);
                } else {
                    res += " [" + cardTypes[fusion.result.Type] + "]";
                }
            }
            res += `<br>Input: ${fusion.card1.Name}`;
            res += `<br>Input: ${fusion.card2.Name}`;
            return res + "<br><br></div>";
        })
        .join("\n");
}

function getCardByName(cardname) {
    return cardsByName[(cardname || "").toLowerCase()];
}

function formatStats(attack, defense) {
    return `(${attack}/${defense})`;
}

// Returns true if the given card is a monster, false if it is magic, ritual,
// trap or equip
function isMonster(card) {
    return card.Type < 20;
}

function checkCard(cardname, infoname) {
    var info = document.getElementById(infoname);
    var card = getCardByName(cardname);
    if (!card) {
        info.replaceChildren("Invalid card name");
    } else if (isMonster(card)) {
        info.replaceChildren(formatStats(card.Attack, card.Defense) + " [" + cardTypes[card.Type] + "]");
    } else {
        info.replaceChildren("[" + cardTypes[card.Type] + "]");
    }
}

function findFusions() {
    const cards = Object.values(handCompletions).map((input) => getCardByName(input.value));

    const hands = [cards];

    outputLeft.replaceChildren();
    outputRight.replaceChildren();

    const fuses = [];
    const equips = [];

    while (hands.length) {
        const hand = hands.shift();
        hand.sort((a, b) => a.Id - b.Id);

        hand.forEach((card1, i, a) => {
            if (!card1) return;

            const card1Equips = equipsList[card1.Id] || [];
            const card1Fuses = card1.Fusions || [];

            const rest = a.slice(i + 1);

            card1Equips.forEach((e) => {
                const match = rest.find((c) => c && c.Id === e);
                if (match) equips.push([card1.Id, match.Id].join(","));
            });

            card1Fuses.forEach((f) => {
                const match = rest.findIndex((c) => c && f._card2 === c.Id);

                if (match !== -1) {
                    fuses.push([f._card1, f._card2, f._result].join(","));
                    hands.push([cardsById[f._result]].concat(hand.filter((_, j) => j !== i && j !== (match + i + 1))));
                }
            });
        });
    }

    if (fuses.length) {
        const fusePairs = fuses.filter((e, i, a) => a.indexOf(e) == i).map((fuse) => {
            const trio = fuse.split(",");
            return {
                card1: cardsById[trio[0]],
                card2: cardsById[trio[1]],
                result: cardsById[trio[2]],
            };
        });
        outputLeft.innerHTML += `\n<h2 class="center">Fusions:</h2>`;
        outputLeft.innerHTML += fusesToHTML(fusePairs.sort((a, b) => b.result.Attack - a.result.Attack));
    }
    if (equips.length) {
        const equipPairs = equips.filter((e, i, a) => a.indexOf(e) == i).map((equip) => {
            const duo = equip.split(",");
            return {
                card1: cardsById[duo[0]],
                card2: cardsById[duo[1]],
            };
        });
        outputRight.innerHTML += `\n<h2 class="center">Equips:</h2>`;
        outputRight.innerHTML += fusesToHTML(equipPairs);
    }
}

function resultsClear() {
    outputLeft.replaceChildren();
    outputRight.replaceChildren();
}

function inputsClear() {
    Object.values(handCompletions).forEach((input) => {
        input.value = "";
        document.getElementById(input.id + "-info").replaceChildren();
    });
}

// Set up event listeners for each card input
for (let i = 1; i <= 5; i++) {
    Object.values(handCompletions).forEach((input) => {
        input.addEventListener("change", function (e) {
            input.select(); // select the currently highlighted element
            if (!this.value) {
                // If the box is cleared, remove the card info
                document.getElementById(input.id + "-info").replaceChildren();
            } else {
                checkCard(e.currentTarget.value, e.currentTarget.id + "-info");
            }
            resultsClear();
            findFusions();
        });
        input.addEventListener("awesomplete-selectcomplete", function (e) {
            checkCard(e.currentTarget.value, e.currentTarget.id + "-info");
            resultsClear();
            findFusions();
        });

    });
}

resetBtn.addEventListener("click", function () {
    resultsClear();
    inputsClear();
});
