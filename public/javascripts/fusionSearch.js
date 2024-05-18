const nameInput = document.getElementById("cardname");
const outputLeft = document.getElementById("output-area-left");
const outputRight = document.getElementById("output-area-right");
const outputCard = document.getElementById("outputcard");
const searchMessage = document.getElementById("search-msg");
const resetBtn = document.getElementById("reset-btn");
const searchResultsBtn = document.getElementById("search-results-btn");
const searchNameBtn = document.getElementById("search-name-btn");

const cardsById = {};
const cardsByName = {};
const equipsList = [];
const resultsList = [];

const cardNameCompletion = new Awesomplete(nameInput, {
    autoFirst: true, // The first item in the list is selected
});

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
                resultsList[id].push(card.Id);
            });
        }
    });

    cardNameCompletion.list = cards.map((card) => card.Name);
});

// FUNCTIONS

function resultsClear() {
    outputLeft.replaceChildren();
    outputRight.replaceChildren();
    outputCard.replaceChildren();
    searchMessage.replaceChildren();
}

function createDangerMessage(input) {
    if (!input) {
        return `<div class="alert alert-danger" role="alert">Please enter a search term</div>`;
    } else {
        return `<div class="alert alert-danger" role="alert">No card for ${input} found</div>`;
    }
}

function createSideCard(card) {
    let modelCard = `<div class="card ml-1" style="max-width: 540px">
                    <div class="row no-gutters">
                    <div class="col">
                    <div class="card-body">
                    <h5 class="card-title">${card.Name}</h5>
                    <p class="card-text">${card.Description}</p>
                    <p class="card-text"><strong>ATK / DEF:</strong> ${card.Attack} / ${card.Defense}</p>
                    <p class="card-text"><strong>Type:</strong> ${cardTypes[card.Type]}</p>
                    <p class="card-text"><strong>Stars:</strong> ${card.Stars}</p>
                    <p class="card-text"><strong>Password:</strong> ${card.CardCode}</p>
                    </div>
                    </div>
                    </div>
                  </div>`;

    if (card.Type < 20) {
        return modelCard;
    } else {
        let notMonsterCard = modelCard.replace(
            `<p class="card-text"><strong>ATK / DEF:</strong> ${card.Attack} / ${card.Defense}</p>`,
            ""
        );
        return notMonsterCard;
    }
}

nameInput.addEventListener("change", function () {
    if (cardNameCompletion) {
        cardNameCompletion.select(); // select the currently highlighted item, e.g. if user tabs
        resultsClear();
        searchByName();
    }
});

nameInput.addEventListener("awesomplete-selectcomplete", function () {
    resultsClear();
    searchByName();
});

// Creates a div for each fusion
function fusesToHTML(fuselist) {
    return fuselist.map(function (fusion) {
        var res = `<div class="card border-dark mb-3" style="max-width: 18rem;">
        <div class="card-body text-dark"><p class="card-text"><strong>Input:</strong> ${fusion.card1.Name}
        <p class="card-text"><strong>Input:</strong> ${fusion.card2.Name}`;
        if (fusion.result) {
            // Equips and Results don't have a result field
            res += `<p class="card-text"><strong>Result:</strong> ` + fusion.result.Name;
            res += " (" + fusion.result.Attack + "/" + fusion.result.Defense + ")";
        }
        return res + `</div></div>`;
    });
}

function searchByName() {
    if (!nameInput.value) {
        searchMessage.innerHTML = createDangerMessage();
        return;
    } else {
        let card = cardsByName[nameInput.value.toLowerCase()]
        if (!card) {
            searchMessage.innerHTML = createDangerMessage(nameInput.value);
            return;
        } else {
            // Display card beside search bar
            outputCard.innerHTML = createSideCard(card);

            // Get the list of fusions and equips

            var fuses = card.Fusions.map((i) => {
                return { card1: card, card2: cardsById[i._card2], result: cardsById[i._result] };
            });
            var equips = equipsList[card.Id].map((e) => {
                return { card1: card, card2: cardsById[e] };
            });

            outputRight.innerHTML = "<h2 class='text-center my-4'>Can be equiped</h2>";
            outputRight.innerHTML += fusesToHTML(equips);

            outputLeft.innerHTML = "<h2 class='text-center my-4'>Fusions</h2>";
            outputLeft.innerHTML += fusesToHTML(fuses);
        }
    }
}

function searchForResult() {
    if (!nameInput.value) {
        searchMessage.innerHTML = createDangerMessage();
        return;
    } else {
        var card = cardsByName[nameInput.value.toLowerCase()];
        if (!card) {
            searchMessage.innerHTML = createDangerMessage(nameInput.value);
            return;
        } else {
            // Display card beside search bar
            outputCard.innerHTML = createSideCard(card);

            if (resultsList[card.Id].length > 0) {
                var results = resultsList[card.Id].map((f) => {
                    return { card1: cardsById[f.card1], card2: cardsById[f.card2] };
                });
                outputLeft.innerHTML = "<h2 class='text-center my-4'>Fusions</h2>";
                outputLeft.innerHTML += fusesToHTML(results);
            }
        }
    }
}

searchNameBtn.addEventListener("click", function () {
    if (cardNameCompletion) {
        cardNameCompletion.select(); // select the currently highlighted item
        resultsClear();
        searchByName();
    }
});

searchResultsBtn.addEventListener("click", function () {
    if (cardNameCompletion) {
        cardNameCompletion.select(); // select the currently highlighted item
        resultsClear();
        searchForResult();
    }
});

resetBtn.addEventListener("click", function () {
    resultsClear();
    nameInput.value = "";
});
