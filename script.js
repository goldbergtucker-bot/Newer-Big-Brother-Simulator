// ========================================
// BIG BROTHER CUSTOM SIMULATOR
// VERSION 2
// ========================================


// ========================================
// GAME DATA
// ========================================

let season = {
    name: "My Big Brother Season",
    format: "custom",
    jurySize: 9
};


let houseguests = [];

let relationships = [];

let currentWeek = 0;

let currentHOH = null;

let nominees = [];

let povWinner = null;

let seasonStarted = false;

let evictedHouseguests = [];

let jury = [];

let winner = null;


// ========================================
// NAVIGATION
// ========================================

function showPage(pageName) {

    const pages =
        document.querySelectorAll(".page");


    pages.forEach(function(page) {

        page.classList.remove("active");

    });


    const selectedPage =
        document.getElementById(pageName);


    if (selectedPage) {

        selectedPage.classList.add("active");

    }

}


// ========================================
// STAT DISPLAY
// ========================================

function updateStatValue(stat) {

    const slider =
        document.getElementById(stat);


    const display =
        document.getElementById(stat + "Value");


    if (slider && display) {

        display.textContent =
            slider.value;

    }

}


// ========================================
// SAVE SEASON SETUP
// ========================================

function saveSeasonSetup() {

    const name =
        document.getElementById("seasonName").value;


    const format =
        document.getElementById("seasonFormat").value;


    const jurySize =
        Number(
            document.getElementById("jurySize").value
        );


    season.name =
        name ||
        "My Big Brother Season";


    season.format =
        format;


    season.jurySize =
        jurySize;


    updateSeasonInfo();


    alert(
        "Season setup saved!"
    );

}


// ========================================
// UPDATE SEASON INFO
// ========================================

function updateSeasonInfo() {

    const info =
        document.getElementById("seasonInfo");


    if (!info) return;


    info.innerHTML = `

        <h3>
            ${season.name}
        </h3>

        <p>
            <strong>Format:</strong>
            ${season.format.toUpperCase()}
        </p>

        <p>
            <strong>Jury Size:</strong>
            ${season.jurySize}
        </p>

    `;

}


// ========================================
// ADD HOUSEGUEST
// ========================================

function addHouseguest() {

    const name =
        document.getElementById("hgName").value.trim();


    const age =
        document.getElementById("hgAge").value;


    const occupation =
        document.getElementById("hgOccupation").value.trim();


    const image =
        document.getElementById("hgImage").value.trim();


    if (!name) {

        alert(
            "Please enter a houseguest name."
        );

        return;

    }


    const houseguest = {

        id:
            Date.now(),

        name:
            name,

        age:
            age || "Unknown",

        occupation:
            occupation || "Unknown",

        image:
            image ||
            "https://placehold.co/400x500?text=" +
            encodeURIComponent(name),

        physical:
            Number(
                document.getElementById("physical").value
            ),

        mental:
            Number(
                document.getElementById("mental").value
            ),

        social:
            Number(
                document.getElementById("social").value
            ),

        strategy:
            Number(
                document.getElementById("strategy").value
            ),

        competition:
            Number(
                document.getElementById("competition").value
            ),

        status:
            "In House"

    };


    houseguests.push(
        houseguest
    );


    document.getElementById("hgName").value = "";

    document.getElementById("hgAge").value = "";

    document.getElementById("hgOccupation").value = "";

    document.getElementById("hgImage").value = "";


    updateAllDisplays();

}


// ========================================
// REMOVE HOUSEGUEST
// ========================================

function removeHouseguest(id) {

    houseguests =
        houseguests.filter(function(player) {

            return player.id !== id;

        });


    updateAllDisplays();

}


// ========================================
// CAST DISPLAY
// ========================================

function updateCastDisplay() {

    const grid =
        document.getElementById("castGrid");


    const count =
        document.getElementById("castCount");


    if (!grid) return;


    grid.innerHTML = "";


    if (count) {

        count.textContent =
            houseguests.length +
            " Houseguests";

    }


    houseguests.forEach(function(player) {

        const card =
            document.createElement("div");


        card.className =
            "houseguest-card";


        card.innerHTML = `

            <img
                src="${player.image}"
                alt="${player.name}"
            >

            <div class="houseguest-info">

                <h3>
                    ${player.name}
                </h3>

                <p>
                    ${player.age}
                    •
                    ${player.occupation}
                </p>

                <div class="stat-row">
                    <span>💪 Physical</span>
                    <strong>${player.physical}</strong>
                </div>

                <div class="stat-row">
                    <span>🧠 Mental</span>
                    <strong>${player.mental}</strong>
                </div>

                <div class="stat-row">
                    <span>❤️ Social</span>
                    <strong>${player.social}</strong>
                </div>

                <div class="stat-row">
                    <span>♟ Strategy</span>
                    <strong>${player.strategy}</strong>
                </div>

                <div class="stat-row">
                    <span>🏆 Competition</span>
                    <strong>${player.competition}</strong>
                </div>

                <button
                    onclick="removeHouseguest(${player.id})"
                >
                    REMOVE
                </button>

            </div>

        `;


        grid.appendChild(card);

    });

}


// ========================================
// RELATIONSHIP DROPDOWNS
// ========================================

function updateRelationshipDropdowns() {

    const player1 =
        document.getElementById(
            "relationshipPlayer1"
        );


    const player2 =
        document.getElementById(
            "relationshipPlayer2"
        );


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

}


// ========================================
// ADD RELATIONSHIP
// ========================================

function addRelationship() {

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


    const type =
        document.getElementById(
            "relationshipType"
        ).value;


    if (
        !player1Id ||
        !player2Id
    ) {

        alert(
            "Add houseguests first."
        );

        return;

    }


    if (
        player1Id === player2Id
    ) {

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


    relationships.push({

        id:
            Date.now(),

        player1:
            player1.name,

        player2:
            player2.name,

        type:
            type

    });


    updateRelationshipDisplay();

}


// ========================================
// RELATIONSHIP DISPLAY
// ========================================

function updateRelationshipDisplay() {

    const list =
        document.getElementById(
            "relationshipList"
        );


    if (!list) return;


    list.innerHTML = "";


    relationships.forEach(function(relationship) {

        const card =
            document.createElement("div");


        card.className =
            "relationship-card";


        card.innerHTML = `

            <strong>
                ${relationship.player1}
            </strong>

            ↔

            <strong>
                ${relationship.player2}
            </strong>

            <br>

            ${relationship.type.toUpperCase()}

        `;


        list.appendChild(card);

    });

}


// ========================================
// START SEASON
// ========================================

function startSeason() {

    if (
        houseguests.length < 4
    ) {

        alert(
            "You need at least 4 houseguests to start."
        );

        return;

    }


    seasonStarted =
        true;


    currentWeek =
        1;


    currentHOH =
        null;


    nominees =
        [];


    povWinner =
        null;


    evictedHouseguests =
        [];


    jury =
        [];


    winner =
        null;


    houseguests.forEach(function(player) {

        player.status =
            "In House";

    });


    addEvent(
        "🏠 " +
        season.name +
        " has officially begun!"
    );


    updateAllDisplays();

}


// ========================================
// ACTIVE PLAYERS
// ========================================

function getActivePlayers() {

    return houseguests.filter(function(player) {

        return player.status ===
            "In House";

    });

}


// ========================================
// COMPETITION
// ========================================

function runCompetition(type) {

    const players =
        getActivePlayers();


    if (
        players.length === 0
    ) {

        return null;

    }


    let weightedPlayers =
        [];


    players.forEach(function(player) {

        let score = 5;


        if (
            type === "physical"
        ) {

            score =
                player.physical +
                player.competition;

        }


        if (
            type === "mental"
        ) {

            score =
                player.mental +
                player.competition;

        }


        score =
            Math.max(
                1,
                Math.round(score)
            );


        for (
            let i = 0;
            i < score;
            i++
        ) {

            weightedPlayers.push(
                player
            );

        }

    });


    return weightedPlayers[
        Math.floor(
            Math.random() *
            weightedPlayers.length
        )
    ];

}


// ========================================
// HOH
// ========================================

function runHOH() {

    if (!seasonStarted) {

        alert(
            "Start the season first."
        );

        return;

    }


    if (currentHOH) {

        alert(
            currentHOH.name +
            " is already the HOH."
        );

        return;

    }


    const winner =
        runCompetition("physical");


    currentHOH =
        winner;


    addEvent(

        "👑 " +
        winner.name +
        " has won the Head of Household!"

    );


    updateGameDisplay();

}


// ========================================
// NOMINATIONS
// ========================================

function makeNominations() {

    if (!currentHOH) {

        alert(
            "Run the HOH competition first."
        );

        return;

    }


    if (
        nominees.length > 0
    ) {

        alert(
            "Nominations have already happened."
        );

        return;

    }


    let available =
        getActivePlayers()
        .filter(function(player) {

            return player.id !==
                currentHOH.id;

        });


    available =
        available.sort(function() {

            return Math.random() - 0.5;

        });


    nominees =
        [
            available[0],
            available[1]
        ];


    addEvent(

        "🎯 " +
        currentHOH.name +
        " nominated " +
        nominees[0].name +
        " and " +
        nominees[1].name +
        " for eviction."

    );


    updateGameDisplay();

}


// ========================================
// POWER OF VETO
// ========================================

function runPOV() {

    if (
        nominees.length !== 2
    ) {

        alert(
            "Nominations must happen first."
        );

        return;

    }


    if (povWinner) {

        alert(
            "The POV has already been played."
        );

        return;

    }


    const winner =
        runCompetition("mental");


    povWinner =
        winner;


    addEvent(

        "🏆 " +
        winner.name +
        " has won the Power of Veto!"

    );


    updateGameDisplay();

}


// ========================================
// VETO CEREMONY
// ========================================

function vetoCeremony() {

    if (!povWinner) {

        alert(
            "Run the POV competition first."
        );

        return;

    }


    if (
        nominees.length !== 2
    ) {

        return;

    }


    const isNominee =
        nominees.some(function(player) {

            return player.id ===
                povWinner.id;

        });


    if (!isNominee) {

        addEvent(

            "🏆 " +
            povWinner.name +
            " decided not to use the Power of Veto."

        );

        return;

    }


    const savedPlayer =
        povWinner;


    nominees =
        nominees.filter(function(player) {

            return player.id !==
                savedPlayer.id;

        });


    const possibleReplacements =
        getActivePlayers()
        .filter(function(player) {

            return (
                player.id !== currentHOH.id &&
                player.id !== savedPlayer.id &&
                player.id !== nominees[0].id
            );

        });


    const replacement =
        possibleReplacements[
            Math.floor(
                Math.random() *
                possibleReplacements.length
            )
        ];


    nominees.push(
        replacement
    );


    addEvent(

        "🛡️ " +
        povWinner.name +
        " used the Power of Veto on themselves!"

    );


    addEvent(

        "🎯 " +
        currentHOH.name +
        " nominated " +
        replacement.name +
        " as the replacement nominee."

    );


    updateGameDisplay();

}


// ========================================
// EVICTION
// ========================================

function runEviction() {

    if (
        nominees.length !== 2
    ) {

        alert(
            "You need two nominees."
        );

        return;

    }


    const evicted =
        nominees[
            Math.floor(
                Math.random() * 2
            )
        ];


    evicted.status =
        "Evicted";


    evictedHouseguests.push(
        evicted
    );


    const activePlayers =
        getActivePlayers();


    /*
    Add players to jury once the
    number remaining reaches the jury.
    */

    if (
        activePlayers.length <=
        season.jurySize + 2
    ) {

        jury.push(
            evicted
        );

    }


    addEvent(

        "🚪 " +
        evicted.name +
        " has been evicted from the Big Brother house!"

    );


    nominees =
        [];


    currentHOH =
        null;


    povWinner =
        null;


    currentWeek++;


    updateAllDisplays();


    checkForFinale();

}


// ========================================
// FINALE
// ========================================

function checkForFinale() {

    const remaining =
        getActivePlayers();


    if (
        remaining.length <= 2
    ) {

        seasonStarted =
            false;


        if (
            remaining.length === 2
        ) {

            winner =
                remaining[
                    Math.floor(
                        Math.random() * 2
                    )
                ];


            addEvent(

                "👑 " +
                winner.name +
                " has won " +
                season.name +
                "!"

            );


        }


        updateWinnerDisplay();

        showPage(
            "results"
        );

    }

}


// ========================================
// EVENT LOG
// ========================================

function addEvent(message) {

    const log =
        document.getElementById(
            "eventLog"
        );


    if (!log) return;


    const event =
        document.createElement("div");


    event.className =
        "event";


    event.innerHTML =

        "<strong>Week " +
        currentWeek +
        "</strong><br>" +
        message;


    log.prepend(
        event
    );

}


// ========================================
// GAME DISPLAY
// ========================================

function updateGameDisplay() {

    const title =
        document.getElementById(
            "weekTitle"
        );


    if (title) {

        title.textContent =

            seasonStarted

            ? "WEEK " +
              currentWeek

            : "READY TO START";

    }


    document.getElementById(
        "hohDisplay"
    ).textContent =

        currentHOH
        ? currentHOH.name
        : "None";


    document.getElementById(
        "nomineesDisplay"
    ).textContent =

        nominees.length

        ? nominees.map(function(player) {

            return player.name;

        }).join(" & ")

        : "None";


    document.getElementById(
        "povDisplay"
    ).textContent =

        povWinner
        ? povWinner.name
        : "None";

}


// ========================================
// RESULTS
// ========================================

function updateResults() {

    const list =
        document.getElementById(
            "resultsList"
        );


    if (!list) return;


    list.innerHTML = "";


    houseguests.forEach(function(player) {

        const item =
            document.createElement("div");


        item.className =

            "result-player " +

            (
                player.status === "In House"

                ? "in-house"

                : "evicted"
            );


        item.textContent =

            player.name +

            " — " +

            player.status;


        list.appendChild(item);

    });

}


// ========================================
// JURY DISPLAY
// ========================================

function updateJuryDisplay() {

    const list =
        document.getElementById(
            "juryList"
        );


    if (!list) return;


    if (
        jury.length === 0
    ) {

        list.innerHTML =
            "No jury members yet.";

        return;

    }


    list.innerHTML = "";


    jury.forEach(function(player) {

        const item =
            document.createElement("div");


        item.className =
            "result-player";


        item.textContent =
            player.name;


        list.appendChild(item);

    });

}


// ========================================
// WINNER DISPLAY
// ========================================

function updateWinnerDisplay() {

    const display =
        document.getElementById(
            "winnerDisplay"
        );


    if (!display) return;


    if (winner) {

        display.innerHTML =

            "<h1>👑 " +
            winner.name +
            "</h1>" +

            "<h2>WINNER!</h2>";

    }

}


// ========================================
// UPDATE EVERYTHING
// ========================================

function updateAllDisplays() {

    updateSeasonInfo();

    updateCastDisplay();

    updateRelationshipDropdowns();

    updateRelationshipDisplay();

    updateGameDisplay();

    updateResults();

    updateJuryDisplay();

    updateWinnerDisplay();

}


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
    "DOMContentLoaded",

    function() {

        updateAllDisplays();

    }

);
