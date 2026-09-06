// ======================================================
// BIG BROTHER SIMULATOR
// PART 1 + PART 2
// ======================================================

// ======================================================
// GAME DATA
// ======================================================

let houseguests = [];

let evictedHouseguests = [];

let jury = [];

let alliances = [];

let relationships = [];

let customTwists = [];

let currentWeek = 1;

let currentHOH = null;

let nominees = [];

let povWinner = null;

let seasonStarted = false;

let selectedSeasonTemplate = "custom";

// ======================================================
// SEASON TEMPLATES
// ======================================================

const seasonTemplates = {

```
custom: {

    name: "Custom Big Brother",

    year: "Custom Format",

    description:
        "Create your own Big Brother season with your own rules and twists.",

    startingPlayers: 16,

    nominationCount: 2,

    juryStartWeek: 5,

    twists: []

},


bb19: {

    name: "Big Brother 19",

    year: "2017",

    description:
        "A custom cast playing a format inspired by Big Brother 19 and its Summer of Temptation structure.",

    startingPlayers: 16,

    nominationCount: 2,

    juryStartWeek: 6,

    twists: [

        "Summer of Temptation",

        "Den of Temptation",

        "Temptation Competitions",

        "Halting Hex",

        "Battle Back"

    ]

},


bb20: {

    name: "Big Brother 20",

    year: "2018",

    description:
        "A custom cast playing a format inspired by Big Brother 20 and its technology twists.",

    startingPlayers: 16,

    nominationCount: 2,

    juryStartWeek: 6,

    twists: [

        "BB App Store",

        "Power Apps",

        "Hacker Competition",

        "Hacker Twist",

        "Battle Back"

    ]

},


bb23: {

    name: "Big Brother 23",

    year: "2021",

    description:
        "A custom cast playing a format inspired by Big Brother 23 with teams and Wildcard competitions.",

    startingPlayers: 16,

    nominationCount: 2,

    juryStartWeek: 6,

    twists: [

        "Teams",

        "Wildcard Competition",

        "Team Captains",

        "High Rollers Room",

        "BB Bucks"

    ]

},


bb24: {

    name: "Big Brother 24",

    year: "2022",

    description:
        "A custom cast playing a format inspired by Big Brother 24 and its major seasonal twists.",

    startingPlayers: 16,

    nominationCount: 2,

    juryStartWeek: 6,

    twists: [

        "Backstage Boss",

        "Backstage Pass",

        "Festie Besties",

        "Dyre Fest",

        "Split House"

    ]

},


bb25: {

    name: "Big Brother 25",

    year: "2023",

    description:
        "A custom cast playing a format inspired by Big Brother 25 and the BB Multiverse.",

    startingPlayers: 17,

    nominationCount: 2,

    juryStartWeek: 6,

    twists: [

        "BB Multiverse",

        "Comicverse",

        "Humiliverse",

        "Scaryverse",

        "Scrambleverse",

        "Power of Invincibility",

        "Zombie Week"

    ]

},


bb26: {

    name: "Big Brother 26",

    year: "2024",

    description:
        "A custom cast playing an AI-themed format with three nominees and the AI Arena.",

    startingPlayers: 16,

    nominationCount: 3,

    juryStartWeek: 5,

    twists: [

        "AINSLEY",

        "Three Nominees",

        "AI Arena",

        "AI Instigator",

        "BB AI"

    ]

}
```

};

// ======================================================
// NAVIGATION
// ======================================================

function showSection(sectionName) {

```
const sections =
    document.querySelectorAll(".page-section");


sections.forEach(function(section) {

    section.classList.remove("active");

});


const selected =
    document.getElementById(sectionName);


if (selected) {

    selected.classList.add("active");

}


updateAllDisplays();
```

}

// ======================================================
// SELECT SEASON TEMPLATE
// ======================================================

function selectSeasonTemplate() {

```
const selector =
    document.getElementById("seasonTemplate");


if (!selector) return;


selectedSeasonTemplate =
    selector.value;


const template =
    seasonTemplates[selectedSeasonTemplate];


updateSelectedSeasonInfo();

updateAllDisplays();


alert(
    template.name +
    " has been selected!"
);
```

}

// ======================================================
// SELECTED SEASON INFORMATION
// ======================================================

function updateSelectedSeasonInfo() {

```
const info =
    document.getElementById("selectedSeasonInfo");


if (!info) return;


const template =
    seasonTemplates[selectedSeasonTemplate];


let twistsHTML = "";


if (template.twists.length === 0) {

    twistsHTML =
        "<p>No built-in twists. Create your own!</p>";

} else {

    template.twists.forEach(function(twist) {

        twistsHTML +=
            '<span class="template-twist">' +
            escapeHTML(twist) +
            '</span>';

    });

}


info.innerHTML = `

    <h3>
        📺 ${escapeHTML(template.name)}
    </h3>

    <p>
        <strong>Season:</strong>
        ${escapeHTML(template.year)}
    </p>

    <p>
        ${escapeHTML(template.description)}
    </p>

    <p>
        <strong>Recommended Cast Size:</strong>
        ${template.startingPlayers}
    </p>

    <p>
        <strong>Starting Nominees:</strong>
        ${template.nominationCount}
    </p>

    <p>
        <strong>Season Twists:</strong>
    </p>

    <div>
        ${twistsHTML}
    </div>

`;
```

}

// ======================================================
// ADD HOUSEGUEST
// ======================================================

function addHouseguest() {

```
const name =
    document.getElementById("nameInput").value.trim();


const image =
    document.getElementById("imageInput").value.trim();


const physical =
    Number(
        document.getElementById("physicalInput").value
    ) || 5;


const mental =
    Number(
        document.getElementById("mentalInput").value
    ) || 5;


const social =
    Number(
        document.getElementById("socialInput").value
    ) || 5;


const strategy =
    Number(
        document.getElementById("strategyInput").value
    ) || 5;


if (!name) {

    alert("Please enter a houseguest name.");

    return;

}


const houseguest = {

    id: Date.now() + Math.random(),

    name: name,

    image:
        image ||
        "https://placehold.co/400x500?text=" +
        encodeURIComponent(name),

    physical:
        Math.min(10, Math.max(1, physical)),

    mental:
        Math.min(10, Math.max(1, mental)),

    social:
        Math.min(10, Math.max(1, social)),

    strategy:
        Math.min(10, Math.max(1, strategy)),

    status: "In House"

};


houseguests.push(houseguest);


document.getElementById("nameInput").value = "";

document.getElementById("imageInput").value = "";

document.getElementById("physicalInput").value = "";

document.getElementById("mentalInput").value = "";

document.getElementById("socialInput").value = "";

document.getElementById("strategyInput").value = "";


addEvent(
    "👤 " +
    name +
    " joined the cast."
);


updateAllDisplays();
```

}

// ======================================================
// REMOVE HOUSEGUEST
// ======================================================

function removeHouseguest(id) {

```
const player =
    houseguests.find(function(p) {

        return p.id === id;

    });


if (!player) return;


const confirmed =
    confirm(
        "Remove " +
        player.name +
        " from the cast?"
    );


if (!confirmed) return;


houseguests =
    houseguests.filter(function(p) {

        return p.id !== id;

    });


updateAllDisplays();
```

}

// ======================================================
// CAST DISPLAY
// ======================================================

function updateCastDisplay() {

```
const grid =
    document.getElementById("castGrid");


if (!grid) return;


if (houseguests.length === 0) {

    grid.innerHTML =
        '<div class="empty">No houseguests added yet.</div>';

    return;

}


grid.innerHTML = "";


houseguests.forEach(function(player) {

    const card =
        document.createElement("div");


    card.className =
        "houseguest-card";


    card.innerHTML = `

        <img
            src="${escapeHTML(player.image)}"
            alt="${escapeHTML(player.name)}"
            onerror="this.src='https://placehold.co/400x500?text=Houseguest'"
        >

        <div class="houseguest-info">

            <h3>
                ${escapeHTML(player.name)}
            </h3>

            <div class="stat">

                <span>💪 Physical</span>

                <strong>
                    ${player.physical}/10
                </strong>

            </div>

            <div class="stat">

                <span>🧠 Mental</span>

                <strong>
                    ${player.mental}/10
                </strong>

            </div>

            <div class="stat">

                <span>❤️ Social</span>

                <strong>
                    ${player.social}/10
                </strong>

            </div>

            <div class="stat">

                <span>♟ Strategy</span>

                <strong>
                    ${player.strategy}/10
                </strong>

            </div>

            <div class="stat">

                <span>Status</span>

                <strong>
                    ${escapeHTML(player.status)}
                </strong>

            </div>

            <button
                class="danger"
                onclick="removeHouseguest(${player.id})"
            >
                REMOVE
            </button>

        </div>

    `;


    grid.appendChild(card);

});
```

}

// ======================================================
// CREATE CUSTOM TWIST
// ======================================================

function createTwist() {

```
const name =
    document.getElementById("twistNameInput").value.trim();


const description =
    document.getElementById("twistDescriptionInput").value.trim();


if (!name) {

    alert("Please enter a twist name.");

    return;

}


customTwists.push({

    id: Date.now() + Math.random(),

    name: name,

    description:
        description ||
        "Custom Big Brother twist.",

    enabled: true

});


document.getElementById("twistNameInput").value = "";

document.getElementById("twistDescriptionInput").value = "";


addEvent(
    "🌀 Custom twist created: " +
    name
);


updateAllDisplays();
```

}

// ======================================================
// TWIST DISPLAY
// ======================================================

function updateTwistDisplay() {

```
const list =
    document.getElementById("twistList");


if (!list) return;


if (customTwists.length === 0) {

    list.innerHTML =
        '<div class="empty">No custom twists created.</div>';

    return;

}


list.innerHTML = "";


customTwists.forEach(function(twist) {

    const card =
        document.createElement("div");


    card.className =
        "twist-card" +
        (twist.enabled ? " enabled" : "");


    card.innerHTML = `

        <h3>
            ${escapeHTML(twist.name)}
        </h3>

        <p>
            ${escapeHTML(twist.description)}
        </p>

        <p>
            Status:
            <strong>
                ${twist.enabled ? "ACTIVE" : "OFF"}
            </strong>
        </p>

        <button
            onclick="toggleTwist(${twist.id})"
        >
            ${twist.enabled ? "DISABLE" : "ENABLE"}
        </button>

        <button
            class="danger"
            onclick="deleteTwist(${twist.id})"
        >
            DELETE
        </button>

    `;


    list.appendChild(card);

});
```

}

// ======================================================
// TOGGLE TWIST
// ======================================================

function toggleTwist(id) {

```
const twist =
    customTwists.find(function(t) {

        return t.id === id;

    });


if (!twist) return;


twist.enabled =
    !twist.enabled;


updateAllDisplays();
```

}

// ======================================================
// DELETE TWIST
// ======================================================

function deleteTwist(id) {

```
customTwists =
    customTwists.filter(function(t) {

        return t.id !== id;

    });


updateAllDisplays();
```

}

// ======================================================
// CREATE ALLIANCE
// ======================================================

function createAlliance() {

```
const name =
    document.getElementById("allianceNameInput").value.trim();


const membersText =
    document.getElementById("allianceMembersInput").value.trim();


if (!name) {

    alert("Please enter an alliance name.");

    return;

}


const members =
    membersText
        ? membersText
            .split(",")
            .map(function(member) {

                return member.trim();

            })
            .filter(function(member) {

                return member !== "";

            })
        : [];


alliances.push({

    id: Date.now() + Math.random(),

    name: name,

    members: members

});


document.getElementById("allianceNameInput").value = "";

document.getElementById("allianceMembersInput").value = "";


addEvent(
    "🤝 Alliance formed: " +
    name
);


updateAllDisplays();
```

}

// ======================================================
// ALLIANCE DISPLAY
// ======================================================

function updateAllianceDisplay() {

```
const list =
    document.getElementById("allianceList");


if (!list) return;


if (alliances.length === 0) {

    list.innerHTML =
        '<div class="empty">No alliances created.</div>';

    return;

}


list.innerHTML = "";


alliances.forEach(function(alliance) {

    const card =
        document.createElement("div");


    card.className =
        "alliance-card";


    card.innerHTML = `

        <h3>
            🤝 ${escapeHTML(alliance.name)}
        </h3>

        <p>

            <strong>Members:</strong>

            ${
                alliance.members.length
                    ? alliance.members
                        .map(function(member) {

                            return escapeHTML(member);

                        })
                        .join(", ")
                    : "No members listed"
            }

        </p>

    `;


    list.appendChild(card);

});
```

}

// ======================================================
// RELATIONSHIP PLAYERS
// ======================================================

function updateRelationshipPlayers() {

```
const player1 =
    document.getElementById("relationshipPlayer1");


const player2 =
    document.getElementById("relationshipPlayer2");


if (!player1 || !player2) return;


player1.innerHTML = "";

player2.innerHTML = "";


houseguests.forEach(function(player) {

    const option1 =
        document.createElement("option");


    option1.value =
        player.id;


    option1.textContent =
        player.name;


    player1.appendChild(option1);


    const option2 =
        document.createElement("option");


    option2.value =
        player.id;


    option2.textContent =
        player.name;


    player2.appendChild(option2);

});
```

}

// ======================================================
// CREATE RELATIONSHIP
// ======================================================

function createRelationship() {

```
const player1Id =
    Number(
        document.getElementById(
            "relationshipPlayer1"
        ).value
    );


const player2Id =
    Number(
        document.getElementById(
            "relationshipPlayer2"
        ).value
    );


const score =
    Number(
        document.getElementById(
            "relationshipScore"
        ).value
    ) || 50;


if (!player1Id || !player2Id) {

    alert(
        "Add at least two houseguests first."
    );

    return;

}


if (player1Id === player2Id) {

    alert(
        "Choose two different houseguests."
    );

    return;

}


const player1 =
    houseguests.find(function(player) {

        return player.id === player1Id;

    });


const player2 =
    houseguests.find(function(player) {

        return player.id === player2Id;

    });


if (!player1 || !player2) return;


relationships.push({

    id: Date.now() + Math.random(),

    player1: player1.name,

    player2: player2.name,

    score:
        Math.min(
            100,
            Math.max(
                0,
                score
            )
        )

});


document.getElementById(
    "relationshipScore"
).value = "";


updateAllDisplays();
```

}

// ======================================================
// RELATIONSHIP DISPLAY
// ======================================================

function updateRelationshipDisplay() {

```
const list =
    document.getElementById(
        "relationshipList"
    );


if (!list) return;


if (relationships.length === 0) {

    list.innerHTML =
        '<div class="empty">No relationships created.</div>';

    return;

}


list.innerHTML = "";


relationships.forEach(function(rel) {

    const card =
        document.createElement("div");


    card.className =
        "relationship-card";


    card.innerHTML = `

        <strong>
            ${escapeHTML(rel.player1)}
        </strong>

        ↔

        <strong>
            ${escapeHTML(rel.player2)}
        </strong>

        <br><br>

        Relationship Score:

        <strong>
            ${rel.score}/100
        </strong>

    `;


    list.appendChild(card);

});
```

}

// ======================================================
// START NEW SEASON
// ======================================================

function startNewSeason() {

```
const template =
    seasonTemplates[
        selectedSeasonTemplate
    ];


if (houseguests.length < 4) {

    alert(
        "You need at least 4 houseguests to start."
    );

    return;

}


if (
    houseguests.length !==
    template.startingPlayers
) {

    const continueSeason =
        confirm(

            template.name +
            " normally uses " +
            template.startingPlayers +
            " houseguests.\n\n" +

            "Your cast has " +
            houseguests.length +
            ".\n\n" +

            "Continue anyway?"

        );


    if (!continueSeason) {

        return;

    }

}


houseguests.forEach(function(player) {

    player.status = "In House";

});


evictedHouseguests = [];

jury = [];


currentWeek = 1;

currentHOH = null;

nominees = [];

povWinner = null;


seasonStarted = true;


addEvent(
    "🏠 " +
    template.name +
    " has officially started!"
);


updateAllDisplays();


showSection("week");
```

}

// ======================================================
// COMPETITION WINNER
// ======================================================

function competitionWinner(type) {

```
const available =
    houseguests.filter(function(player) {

        return player.status === "In House";

    });


if (available.length === 0) {

    return null;

}


let winner = null;

let highestScore = -Infinity;


available.forEach(function(player) {

    let score =
        Math.random() * 10;


    if (type === "physical") {

        score +=
            player.physical * 2;

    }


    if (type === "mental") {

        score +=
            player.mental * 2;

    }


    if (type === "social") {

        score +=
            player.social * 2;

    }


    if (type === "strategy") {

        score +=
            player.strategy * 2;

    }


    if (score > highestScore) {

        highestScore = score;

        winner = player;

    }

});


return winner;
```

}

// ======================================================
// RUN HOH
// ======================================================

function runHOH() {

```
if (!seasonStarted) {

    alert(
        "Start a season first."
    );

    return;

}


const winner =
    competitionWinner("physical");


if (!winner) return;


currentHOH =
    winner;


addEvent(

    "🏆 " +
    winner.name +
    " won Head of Household!"

);


updateAllDisplays();
```

}

// ======================================================
// MAKE NOMINATIONS
// ======================================================

function makeNominations() {

```
if (!seasonStarted) {

    alert(
        "Start a season first."
    );

    return;

}


if (!currentHOH) {

    alert(
        "Run the HOH competition first."
    );

    return;

}


const template =
    seasonTemplates[
        selectedSeasonTemplate
    ];


const nominationCount =
    template.nominationCount;


const candidates =
    houseguests.filter(function(player) {

        return (
            player.status === "In House"
        ) && (
            player.id !== currentHOH.id
        );

    });


if (
    candidates.length <
    nominationCount
) {

    alert(
        "Not enough houseguests available."
    );

    return;

}


const shuffled =
    [...candidates];


shuffled.sort(function() {

    return Math.random() - 0.5;

});


nominees =
    shuffled.slice(
        0,
        nominationCount
    );


const nomineeNames =
    nominees
        .map(function(player) {

            return player.name;

        })
        .join(", ");


addEvent(

    "📋 " +
    currentHOH.name +
    " nominated: " +
    nomineeNames

);


updateAllDisplays();
```

}

// ======================================================
// RUN POV
// ======================================================

function runPOV() {

```
if (!seasonStarted) {

    alert(
        "Start a season first."
    );

    return;

}


if (nominees.length < 2) {

    alert(
        "Make nominations first."
    );

    return;

}


const winner =
    competitionWinner("mental");


if (!winner) return;


povWinner =
    winner;


addEvent(

    "🥇 " +
    winner.name +
    " won the Power of Veto!"

);


updateAllDisplays();
```

}

// ======================================================
// USE POV
// ======================================================

function usePOV() {

```
if (!povWinner) {

    alert(
        "Run the POV competition first."
    );

    return;

}


const wantsToUse =
    confirm(

        povWinner.name +
        " won the Power of Veto.\n\n" +
        "Use the POV?"

    );


if (!wantsToUse) {

    addEvent(

        "🦸 " +
        povWinner.name +
        " did not use the Power of Veto."

    );


    updateAllDisplays();

    return;

}


let nomineeToRemove =
    null;


if (
    nominees.some(function(player) {

        return player.id === povWinner.id;

    })
) {

    nomineeToRemove =
        povWinner;

} else {

    nomineeToRemove =
        nominees[
            Math.floor(
                Math.random() *
                nominees.length
            )
        ];

}


nominees =
    nominees.filter(function(player) {

        return player.id !== nomineeToRemove.id;

    });


const replacementCandidates =
    houseguests.filter(function(player) {

        if (
            player.status !== "In House"
        ) {

            return false;

        }


        if (
            player.id === currentHOH.id
        ) {

            return false;

        }


        if (
            player.id === povWinner.id
        ) {

            return false;

        }


        return !nominees.some(function(nominee) {

            return nominee.id === player.id;

        });

    });


if (replacementCandidates.length === 0) {

    alert(
        "No replacement nominee is available."
    );

    return;

}


const replacement =
    replacementCandidates[
        Math.floor(
            Math.random() *
            replacementCandidates.length
        )
    ];


nominees.push(replacement);


addEvent(

    "🦸 " +
    povWinner.name +
    " used the POV on " +
    nomineeToRemove.name +
    "."

);


addEvent(

    "📋 " +
    currentHOH.name +
    " nominated " +
    replacement.name +
    " as the replacement nominee."

);


updateAllDisplays();
```

}

// ======================================================
// BB26 AI ARENA
// ======================================================

function runAIArena() {

```
if (
    selectedSeasonTemplate !== "bb26"
) {

    alert(
        "The AI Arena is only available in the BB26 format."
    );

    return;

}


if (nominees.length !== 3) {

    alert(
        "The AI Arena requires three nominees."
    );

    return;

}


const winner =
    nominees[
        Math.floor(
            Math.random() *
            nominees.length
        )
    ];


nominees =
    nominees.filter(function(player) {

        return player.id !== winner.id;

    });


addEvent(

    "🤖 AI ARENA: " +
    winner.name +
    " won and is SAFE!"

);


updateAllDisplays();
```

}

// ======================================================
// RUN EVICTION
// ======================================================

function runEviction() {

```
if (!seasonStarted) {

    alert(
        "Start a season first."
    );

    return;

}


if (nominees.length !== 2) {

    alert(

        selectedSeasonTemplate === "bb26"
            ? "For BB26, run the AI Arena first so only two nominees remain."
            : "There must be two nominees for eviction."

    );

    return;

}


const evicted =
    nominees[
        Math.floor(
            Math.random() *
            nominees.length
        )
    ];


evicted.status =
    "Evicted";


evictedHouseguests.push(
    evicted
);


const template =
    seasonTemplates[
        selectedSeasonTemplate
    ];


if (
    currentWeek >=
    template.juryStartWeek
) {

    jury.push(
        evicted
    );

}


addEvent(

    "🚪 " +
    evicted.name +
    " was evicted from the Big Brother house!"

);


nominees = [];

povWinner = null;

currentHOH = null;


currentWeek++;


checkForFinale();


updateAllDisplays();
```

}

// ======================================================
// CHECK FOR FINALE
// ======================================================

function checkForFinale() {

```
const remaining =
    houseguests.filter(function(player) {

        return player.status === "In House";

    });


if (remaining.length <= 2) {

    seasonStarted = false;


    const finale =
        document.getElementById(
            "finaleContent"
        );


    if (finale) {

        finale.innerHTML = `

            <h2>
                🎉 FINAL TWO!
            </h2>

            <h3>

                ${remaining
                    .map(function(player) {

                        return escapeHTML(player.name);

                    })
                    .join(" vs. ")}

            </h3>

            <p>
                Your custom season has reached the finale!
            </p>

        `;

    }


    addEvent(
        "👑 The Final Two has been reached!"
    );


    showSection("finale");

}
```

}

// ======================================================
// EVENT LOG
// ======================================================

function addEvent(message) {

```
const eventLog =
    document.getElementById(
        "eventLog"
    );


if (!eventLog) return;


const event =
    document.createElement("div");


event.className =
    "event";


event.textContent =
    "Week " +
    currentWeek +
    ": " +
    message;


eventLog.prepend(event);
```

}

// ======================================================
// MEMORY WALL
// ======================================================

function updateMemoryWall() {

```
const wall =
    document.getElementById(
        "memoryWall"
    );


if (!wall) return;


wall.innerHTML = "";


houseguests.forEach(function(player) {

    const card =
        document.createElement("div");


    card.className =
        "memory-card";


    card.innerHTML = `

        <img
            src="${escapeHTML(player.image)}"
            alt="${escapeHTML(player.name)}"
            onerror="this.src='https://placehold.co/400x500?text=Houseguest'"
        >

        <div>

            <strong>
                ${escapeHTML(player.name)}
            </strong>

            <br>

            <small>
                ${escapeHTML(player.status)}
            </small>

        </div>

    `;


    wall.appendChild(card);

});
```

}

// ======================================================
// JURY DISPLAY
// ======================================================

function updateJuryDisplay() {

```
const list =
    document.getElementById(
        "juryList"
    );


if (!list) return;


if (jury.length === 0) {

    list.innerHTML =
        '<div class="empty">No jury members yet.</div>';

    return;

}


list.innerHTML = "";


jury.forEach(function(player) {

    const row =
        document.createElement("div");


    row.className =
        "player-row";


    row.textContent =
        player.name;


    list.appendChild(row);

});
```

}

// ======================================================
// EVICTED DISPLAY
// ======================================================

function updateEvictedDisplay() {

```
const list =
    document.getElementById(
        "evictedPlayers"
    );


if (!list) return;


if (evictedHouseguests.length === 0) {

    list.innerHTML =
        '<div class="empty">No evicted houseguests yet.</div>';

    return;

}


list.innerHTML = "";


evictedHouseguests.forEach(function(player) {

    const row =
        document.createElement("div");


    row.className =
        "player-row";


    row.textContent =
        player.name +
        " — Evicted";


    list.appendChild(row);

});
```

}

// ======================================================
// GAME DISPLAY
// ======================================================

function updateGameDisplay() {

```
const template =
    seasonTemplates[
        selectedSeasonTemplate
    ];


const weekTitle =
    document.getElementById(
        "weekTitle"
    );


const formatDisplay =
    document.getElementById(
        "formatDisplay"
    );


const hohDisplay =
    document.getElementById(
        "hohDisplay"
    );


const nomineesDisplay =
    document.getElementById(
        "nomineesDisplay"
    );


const povDisplay =
    document.getElementById(
        "povDisplay"
    );


const weekDisplay =
    document.getElementById(
        "weekDisplay"
    );


if (weekTitle) {

    weekTitle.textContent =
        "Week " +
        currentWeek;

}


if (formatDisplay) {

    formatDisplay.textContent =
        template.name;

}


if (hohDisplay) {

    hohDisplay.textContent =
        currentHOH
            ? currentHOH.name
            : "Not Played";

}


if (nomineesDisplay) {

    nomineesDisplay.textContent =
        nominees.length
            ? nominees
                .map(function(player) {

                    return player.name;

                })
                .join(" & ")
            : "None";

}


if (povDisplay) {

    povDisplay.textContent =
        povWinner
            ? povWinner.name
            : "Not Played";

}


if (weekDisplay) {

    weekDisplay.textContent =
        currentWeek;

}
```

}

// ======================================================
// SEASON SUMMARY
// ======================================================

function updateSeasonSummary() {

```
const summary =
    document.getElementById(
        "seasonSummary"
    );


if (!summary) return;


const template =
    seasonTemplates[
        selectedSeasonTemplate
    ];


const remaining =
    houseguests.filter(function(player) {

        return player.status === "In House";

    });


summary.innerHTML = `

    <p>

        <strong>Season Format:</strong>

        ${escapeHTML(template.name)}

    </p>

    <p>

        <strong>Season Started:</strong>

        ${seasonStarted ? "Yes" : "No"}

    </p>

    <p>

        <strong>Current Week:</strong>

        ${currentWeek}

    </p>

    <p>

        <strong>Total Cast:</strong>

        ${houseguests.length}

    </p>

    <p>

        <strong>Still in House:</strong>

        ${remaining.length}

    </p>

    <p>

        <strong>Evicted:</strong>

        ${evictedHouseguests.length}

    </p>

    <p>

        <strong>Jury:</strong>

        ${jury.length}

    </p>

    <p>

        <strong>Active Custom Twists:</strong>

        ${customTwists.filter(function(twist) {

            return twist.enabled;

        }).length}

    </p>

`;
```

}

// ======================================================
// UPDATE EVERYTHING
// ======================================================

function updateAllDisplays() {

```
updateSelectedSeasonInfo();

updateCastDisplay();

updateTwistDisplay();

updateAllianceDisplay();

updateRelationshipPlayers();

updateRelationshipDisplay();

updateMemoryWall();

updateJuryDisplay();

updateEvictedDisplay();

updateGameDisplay();

updateSeasonSummary();
```

}

// ======================================================
// SAVE GAME
// ======================================================

function saveGame() {

```
const gameState = {

    houseguests: houseguests,

    evictedHouseguests: evictedHouseguests,

    jury: jury,

    alliances: alliances,

    relationships: relationships,

    customTwists: customTwists,

    currentWeek: currentWeek,

    currentHOH: currentHOH,

    nominees: nominees,

    povWinner: povWinner,

    seasonStarted: seasonStarted,

    selectedSeasonTemplate:
        selectedSeasonTemplate

};


localStorage.setItem(

    "bigBrotherSimulatorSave",

    JSON.stringify(gameState)

);


alert(
    "Your season has been saved!"
);
```

}

// ======================================================
// LOAD GAME
// ======================================================

function loadGame() {

```
const saved =
    localStorage.getItem(
        "bigBrotherSimulatorSave"
    );


if (!saved) {

    alert(
        "No saved season was found."
    );

    return;

}


try {

    const gameState =
        JSON.parse(saved);


    houseguests =
        gameState.houseguests || [];


    evictedHouseguests =
        gameState.evictedHouseguests || [];


    jury =
        gameState.jury || [];


    alliances =
        gameState.alliances || [];


    relationships =
        gameState.relationships || [];


    customTwists =
        gameState.customTwists || [];


    currentWeek =
        gameState.currentWeek || 1;


    currentHOH =
        gameState.currentHOH || null;


    nominees =
        gameState.nominees || [];


    povWinner =
        gameState.povWinner || null;


    seasonStarted =
        gameState.seasonStarted || false;


    selectedSeasonTemplate =
        gameState.selectedSeasonTemplate ||
        "custom";


    const selector =
        document.getElementById(
            "seasonTemplate"
        );


    if (selector) {

        selector.value =
            selectedSeasonTemplate;

    }


    updateAllDisplays();


    alert(
        "Your saved season has been loaded!"
    );

} catch (error) {

    console.error(error);


    alert(
        "There was a problem loading the saved season."
    );

}
```

}

// ======================================================
// RESET GAME
// ======================================================

function resetGame() {

```
const confirmed =
    confirm(

        "Are you sure you want to delete everything?"

    );


if (!confirmed) return;


houseguests = [];

evictedHouseguests = [];

jury = [];

alliances = [];

relationships = [];

customTwists = [];


currentWeek = 1;

currentHOH = null;

nominees = [];

povWinner = null;

seasonStarted = false;

selectedSeasonTemplate = "custom";


localStorage.removeItem(
    "bigBrotherSimulatorSave"
);


const selector =
    document.getElementById(
        "seasonTemplate"
    );


if (selector) {

    selector.value = "custom";

}


const eventLog =
    document.getElementById(
        "eventLog"
    );


if (eventLog) {

    eventLog.innerHTML = `

        <div class="event">
            Your simulator is ready.
        </div>

    `;

}


const finale =
    document.getElementById(
        "finaleContent"
    );


if (finale) {

    finale.textContent =
        "The finale will appear here when your season reaches the end.";

}


updateAllDisplays();


showSection("home");


alert(
    "Everything has been reset."
);
```

}

// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

```
return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");
```

}

// ======================================================
// STARTUP
// ======================================================

document.addEventListener(
"DOMContentLoaded",
function() {

```
    console.log(
        "Big Brother Simulator loaded successfully!"
    );


    updateAllDisplays();

}
```

);
