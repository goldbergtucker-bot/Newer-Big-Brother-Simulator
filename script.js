// ======================================================
// BIG BROTHER SIMULATOR
// CLEAN WORKING VERSION
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
            "A custom cast playing a format inspired by Big Brother 19.",
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
            "A custom cast playing a format inspired by Big Brother 20.",
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
            "A custom cast playing a format inspired by Big Brother 23.",
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
            "A custom cast playing a format inspired by Big Brother 24.",
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
            "A custom cast playing a format inspired by Big Brother 25.",
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
            "A custom cast playing a format inspired by Big Brother 26.",
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

};


// ======================================================
// NAVIGATION
// ======================================================

function showSection(sectionName) {

    const sections = document.querySelectorAll(".page-section");

    sections.forEach(function(section) {
        section.classList.remove("active");
    });

    const selected = document.getElementById(sectionName);

    if (selected) {
        selected.classList.add("active");
    }

    updateAllDisplays();
}


// ======================================================
// SEASON SELECTION
// ======================================================

function selectSeasonTemplate() {

    const selector = document.getElementById("seasonTemplate");

    if (!selector) {
        return;
    }

    selectedSeasonTemplate = selector.value;

    updateSelectedSeasonInfo();
    updateAllDisplays();

    const template = seasonTemplates[selectedSeasonTemplate];

    if (template) {
        addEvent(
            "Season format selected: " + template.name
        );
    }
}


function updateSelectedSeasonInfo() {

    const info = document.getElementById("selectedSeasonInfo");

    if (!info) {
        return;
    }

    const template = seasonTemplates[selectedSeasonTemplate];

    if (!template) {
        return;
    }

    let twistsHTML = "";

    if (template.twists.length === 0) {

        twistsHTML =
            "<p>No built-in twists. Create your own!</p>";

    } else {

        template.twists.forEach(function(twist) {

            twistsHTML +=
                '<span class="template-twist">' +
                escapeHTML(twist) +
                "</span>";

        });
    }

    info.innerHTML = `
        <h3>📺 ${escapeHTML(template.name)}</h3>

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
}


// ======================================================
// CAST MANAGEMENT
// ======================================================

function addHouseguest() {

    const name = document.getElementById("nameInput").value.trim();

    if (!name) {
        alert("Please enter a houseguest name.");
        return;
    }

    const image =
        document.getElementById("imageInput").value.trim();

    const physical =
        Number(document.getElementById("physicalInput").value) || 5;

    const mental =
        Number(document.getElementById("mentalInput").value) || 5;

    const social =
        Number(document.getElementById("socialInput").value) || 5;

    const strategy =
        Number(document.getElementById("strategyInput").value) || 5;

    const player = {

        id: Date.now(),

        name: name,

        image: image,

        physical: clamp(physical, 1, 10),

        mental: clamp(mental, 1, 10),

        social: clamp(social, 1, 10),

        strategy: clamp(strategy, 1, 10),

        status: "Active"

    };

    houseguests.push(player);

    document.getElementById("nameInput").value = "";
    document.getElementById("imageInput").value = "";
    document.getElementById("physicalInput").value = "";
    document.getElementById("mentalInput").value = "";
    document.getElementById("socialInput").value = "";
    document.getElementById("strategyInput").value = "";

    addEvent(name + " has joined the Big Brother house.");

    updateAllDisplays();
}


function renderCast() {

    const grid = document.getElementById("castGrid");

    if (!grid) {
        return;
    }

    grid.innerHTML = "";

    houseguests.forEach(function(player) {

        const card = document.createElement("div");

        card.className = "cast-card";

        const imageHTML = player.image
            ? `<img src="${escapeAttribute(player.image)}" alt="${escapeAttribute(player.name)}">`
            : `<div class="no-image">👤</div>`;

        card.innerHTML = `
            ${imageHTML}

            <h3>${escapeHTML(player.name)}</h3>

            <div class="player-stats">
                Physical: ${player.physical}<br>
                Mental: ${player.mental}<br>
                Social: ${player.social}<br>
                Strategy: ${player.strategy}
            </div>
        `;

        grid.appendChild(card);

    });
}


// ======================================================
// TWISTS
// ======================================================

function createTwist() {

    const name =
        document.getElementById("twistNameInput").value.trim();

    const description =
        document.getElementById("twistDescriptionInput").value.trim();

    if (!name) {
        alert("Enter a twist name.");
        return;
    }

    customTwists.push({
        name: name,
        description: description
    });

    document.getElementById("twistNameInput").value = "";
    document.getElementById("twistDescriptionInput").value = "";

    addEvent("Custom twist created: " + name);

    updateAllDisplays();
}


function renderTwists() {

    const list = document.getElementById("twistList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    customTwists.forEach(function(twist) {

        const div = document.createElement("div");

        div.className = "player-item";

        div.innerHTML = `
            <strong>${escapeHTML(twist.name)}</strong>
            <p>${escapeHTML(twist.description)}</p>
        `;

        list.appendChild(div);

    });
}


// ======================================================
// ALLIANCES
// ======================================================

function createAlliance() {

    const name =
        document.getElementById("allianceNameInput").value.trim();

    const membersText =
        document.getElementById("allianceMembersInput").value.trim();

    if (!name) {
        alert("Enter an alliance name.");
        return;
    }

    const members = membersText
        .split(",")
        .map(function(member) {
            return member.trim();
        })
        .filter(Boolean);

    alliances.push({
        name: name,
        members: members
    });

    document.getElementById("allianceNameInput").value = "";
    document.getElementById("allianceMembersInput").value = "";

    addEvent("Alliance created: " + name);

    updateAllDisplays();
}


function renderAlliances() {

    const list = document.getElementById("allianceList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    alliances.forEach(function(alliance) {

        const div = document.createElement("div");

        div.className = "player-item";

        div.innerHTML = `
            <strong>${escapeHTML(alliance.name)}</strong>

            <p>
                ${alliance.members
                    .map(function(member) {
                        return escapeHTML(member);
                    })
                    .join(", ")}
            </p>
        `;

        list.appendChild(div);

    });
}


// ======================================================
// RELATIONSHIPS
// ======================================================

function createRelationship() {

    const player1 =
        document.getElementById("relationshipPlayer1").value;

    const player2 =
        document.getElementById("relationshipPlayer2").value;

    const score =
        Number(document.getElementById("relationshipScore").value);

    if (!player1 || !player2) {
        alert("Select both houseguests.");
        return;
    }

    if (player1 === player2) {
        alert("Choose two different houseguests.");
        return;
    }

    relationships.push({
        player1: player1,
        player2: player2,
        score: clamp(score || 0, 0, 100)
    });

    document.getElementById("relationshipScore").value = "";

    addEvent(
        "Relationship saved between " +
        player1 +
        " and " +
        player2 +
        "."
    );

    updateAllDisplays();
}


function renderRelationships() {

    const list =
        document.getElementById("relationshipList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    relationships.forEach(function(rel) {

        const div = document.createElement("div");

        div.className = "player-item";

        div.innerHTML = `
            ${escapeHTML(rel.player1)}
            ❤️
            ${escapeHTML(rel.player2)}
            — ${rel.score}/100
        `;

        list.appendChild(div);

    });
}


// ======================================================
// START SEASON
// ======================================================

function startNewSeason() {

    const template =
        seasonTemplates[selectedSeasonTemplate];

    if (!template) {
        alert("Please select a season.");
        return;
    }

    if (houseguests.length < 2) {
        alert("You need at least 2 houseguests to start.");
        showSection("cast");
        return;
    }

    currentWeek = 1;

    currentHOH = null;

    nominees = [];

    povWinner = null;

    evictedHouseguests = [];

    jury = [];

    seasonStarted = true;

    addEvent(
        "🎬 The season has officially started!"
    );

    addEvent(
        "Format: " + template.name
    );

    addEvent(
        houseguests.length +
        " houseguests are competing."
    );

    showSection("week");

    updateAllDisplays();
}


// ======================================================
// COMPETITION ENGINE
// ======================================================

function competitionWinner(players, type) {

    if (!players || players.length === 0) {
        return null;
    }

    let weightedPlayers = [];

    players.forEach(function(player) {

        let score = 0;

        if (type === "physical") {
            score = player.physical;
        }

        else if (type === "mental") {
            score = player.mental;
        }

        else if (type === "social") {
            score = player.social;
        }

        else if (type === "strategy") {
            score = player.strategy;
        }

        else {
            score =
                player.physical +
                player.mental +
                player.social +
                player.strategy;
        }

        score += Math.random() * 5;

        weightedPlayers.push({
            player: player,
            score: score
        });

    });

    weightedPlayers.sort(function(a, b) {
        return b.score - a.score;
    });

    return weightedPlayers[0].player;
}


// ======================================================
// HOH
// ======================================================

function runHOH() {

    if (!seasonStarted) {
        alert("Start a season first.");
        return;
    }

    const players = houseguests.filter(function(player) {
        return player.status === "Active";
    });

    if (players.length < 2) {
        alert("Not enough players.");
        return;
    }

    const winner =
        competitionWinner(players, "physical");

    currentHOH = winner;

    addEvent(
        "🏆 " +
        winner.name +
        " has won the HOH competition!"
    );

    updateAllDisplays();
}


// ======================================================
// NOMINATIONS
// ======================================================

function makeNominations() {

    if (!seasonStarted) {
        alert("Start a season first.");
        return;
    }

    if (!currentHOH) {
        alert("Run the HOH competition first.");
        return;
    }

    const template =
        seasonTemplates[selectedSeasonTemplate];

    const nominationCount =
        template.nominationCount;

    const eligible = houseguests.filter(function(player) {

        return (
            player.status === "Active" &&
            player.id !== currentHOH.id
        );

    });

    eligible.sort(function() {
        return Math.random() - 0.5;
    });

    nominees =
        eligible.slice(0, nominationCount);

    addEvent(
        "📋 " +
        currentHOH.name +
        " nominated " +
        nominees.map(function(player) {
            return player.name;
        }).join(" and ") +
        "."
    );

    updateAllDisplays();
}


// ======================================================
// POV
// ======================================================

function runPOV() {

    if (!seasonStarted) {
        alert("Start a season first.");
        return;
    }

    if (nominees.length === 0) {
        alert("Make nominations first.");
        return;
    }

    const players =
        houseguests.filter(function(player) {

            return player.status === "Active";

        });

    povWinner =
        competitionWinner(players, "mental");

    addEvent(
        "🥇 " +
        povWinner.name +
        " has won the Power of Veto!"
    );

    updateAllDisplays();
}


// ======================================================
// USE POV
// ======================================================

function usePOV() {

    if (!povWinner) {
        alert("Run the POV first.");
        return;
    }

    const canUse =
        nominees.some(function(player) {
            return player.id === povWinner.id;
        });

    if (!canUse) {

        addEvent(
            "🦸 " +
            povWinner.name +
            " chose not to use the Power of Veto."
        );

        return;
    }

    const replacementCandidates =
        houseguests.filter(function(player) {

            return (
                player.status === "Active" &&
                player.id !== currentHOH.id &&
                !nominees.some(function(nominee) {
                    return nominee.id === player.id;
                }) &&
                player.id !== povWinner.id
            );

        });

    if (replacementCandidates.length === 0) {
        return;
    }

    const replacement =
        replacementCandidates[
            Math.floor(
                Math.random() *
                replacementCandidates.length
            )
        ];

    nominees =
        nominees.filter(function(player) {
            return player.id !== povWinner.id;
        });

    nominees.push(replacement);

    addEvent(
        "🦸 " +
        povWinner.name +
        " used the Power of Veto!"
    );

    addEvent(
        replacement.name +
        " is the replacement nominee."
    );

    updateAllDisplays();
}


// ======================================================
// AI ARENA
// ======================================================

function runAIArena() {

    if (selectedSeasonTemplate !== "bb26") {

        addEvent(
            "🤖 The AI Arena is only active in the BB26 format."
        );

        return;
    }

    const players =
        houseguests.filter(function(player) {
            return player.status === "Active";
        });

    if (players.length < 3) {
        alert("You need at least three active players.");
        return;
    }

    const participants =
        players.slice(0, 3);

    const winner =
        competitionWinner(participants, "mental");

    addEvent(
        "🤖 " +
        winner.name +
        " has won the AI Arena and is safe!"
    );

    updateAllDisplays();
}


// ======================================================
// EVICTION
// ======================================================

function runEviction() {

    if (!seasonStarted) {
        alert("Start a season first.");
        return;
    }

    if (nominees.length === 0) {
        alert("You need nominees first.");
        return;
    }

    let evicted;

    if (nominees.length === 1) {

        evicted = nominees[0];

    } else {

        evicted =
            nominees[
                Math.floor(
                    Math.random() *
                    nominees.length
                )
            ];

    }

    evicted.status = "Evicted";

    evictedHouseguests.push(evicted);

    const template =
        seasonTemplates[selectedSeasonTemplate];

    if (currentWeek >= template.juryStartWeek) {
        jury.push(evicted);
    }

    addEvent(
        "🚪 " +
        evicted.name +
        " has been evicted from the Big Brother house!"
    );

    currentWeek++;

    currentHOH = null;

    nominees = [];

    povWinner = null;

    if (houseguests.filter(function(player) {
        return player.status === "Active";
    }).length <= 2) {

        showFinale();

    }

    updateAllDisplays();
}


// ======================================================
// FINALE
// ======================================================

function showFinale() {

    const finalists =
        houseguests.filter(function(player) {
            return player.status === "Active";
        });

    const finale =
        document.getElementById("finaleContent");

    if (!finale) {
        return;
    }

    finale.innerHTML = `
        <h3>🎉 Finalists</h3>

        <p>
            ${finalists.map(function(player) {
                return escapeHTML(player.name);
            }).join(" vs. ")}
        </p>

        <p>
            The season has reached the finale!
        </p>
    `;

    showSection("finale");
}


// ======================================================
// EVENT LOG
// ======================================================

function addEvent(message) {

    const log =
        document.getElementById("eventLog");

    if (!log) {
        return;
    }

    const event =
        document.createElement("div");

    event.className = "event";

    event.textContent = message;

    log.prepend(event);
}


// ======================================================
// MEMORY WALL
// ======================================================

function renderMemoryWall() {

    const wall =
        document.getElementById("memoryWall");

    if (!wall) {
        return;
    }

    wall.innerHTML = "";

    houseguests.forEach(function(player) {

        const card =
            document.createElement("div");

        card.className = "memory-card";

        if (player.image) {

            card.innerHTML = `
                <img
                    src="${escapeAttribute(player.image)}"
                    alt="${escapeAttribute(player.name)}"
                >

                <strong>
                    ${escapeHTML(player.name)}
                </strong>
            `;

        } else {

            card.innerHTML = `
                <div style="font-size:70px;">👤</div>

                <strong>
                    ${escapeHTML(player.name)}
                </strong>
            `;

        }

        wall.appendChild(card);

    });
}


// ======================================================
// JURY
// ======================================================

function renderJury() {

    const list =
        document.getElementById("juryList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    jury.forEach(function(player) {

        const item =
            document.createElement("div");

        item.className = "player-item";

        item.textContent = player.name;

        list.appendChild(item);

    });
}


// ======================================================
// EVICTED
// ======================================================

function renderEvicted() {

    const list =
        document.getElementById("evictedPlayers");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    evictedHouseguests.forEach(function(player) {

        const item =
            document.createElement("div");

        item.className = "player-item";

        item.textContent = player.name;

        list.appendChild(item);

    });
}


// ======================================================
// RELATIONSHIP DROPDOWNS
// ======================================================

function updateRelationshipDropdowns() {

    const first =
        document.getElementById("relationshipPlayer1");

    const second =
        document.getElementById("relationshipPlayer2");

    if (!first || !second) {
        return;
    }

    first.innerHTML = "";
    second.innerHTML = "";

    houseguests.forEach(function(player) {

        const option1 =
            document.createElement("option");

        option1.value = player.name;

        option1.textContent = player.name;

        first.appendChild(option1);


        const option2 =
            document.createElement("option");

        option2.value = player.name;

        option2.textContent = player.name;

        second.appendChild(option2);

    });
}


// ======================================================
// GAME DISPLAY
// ======================================================

function updateGameDisplay() {

    const template =
        seasonTemplates[selectedSeasonTemplate];

    const format =
        document.getElementById("formatDisplay");

    const hoh =
        document.getElementById("hohDisplay");

    const nomineesDisplay =
        document.getElementById("nomineesDisplay");

    const pov =
        document.getElementById("povDisplay");

    const week =
        document.getElementById("weekDisplay");

    const title =
        document.getElementById("weekTitle");

    if (format) {
        format.textContent = template
            ? template.name
            : "Custom Big Brother";
    }

    if (hoh) {
        hoh.textContent =
            currentHOH
                ? currentHOH.name
                : "Not Played";
    }

    if (nomineesDisplay) {

        nomineesDisplay.textContent =
            nominees.length
                ? nominees.map(function(player) {
                    return player.name;
                }).join(", ")
                : "None";

    }

    if (pov) {
        pov.textContent =
            povWinner
                ? povWinner.name
                : "Not Played";
    }

    if (week) {
        week.textContent = currentWeek;
    }

    if (title) {
        title.textContent =
            "Week " + currentWeek;
    }
}


// ======================================================
// SEASON SUMMARY
// ======================================================

function updateSeasonSummary() {

    const summary =
        document.getElementById("seasonSummary");

    if (!summary) {
        return;
    }

    const active =
        houseguests.filter(function(player) {
            return player.status === "Active";
        }).length;

    const template =
        seasonTemplates[selectedSeasonTemplate];

    if (!seasonStarted) {

        summary.innerHTML =
            "Your season has not started yet.";

        return;
    }

    summary.innerHTML = `
        <strong>${escapeHTML(template.name)}</strong>

        <p>
            Week: ${currentWeek}
        </p>

        <p>
            Active Houseguests: ${active}
        </p>

        <p>
            Evicted: ${evictedHouseguests.length}
        </p>

        <p>
            Jury Members: ${jury.length}
        </p>
    `;
}


// ======================================================
// UPDATE EVERYTHING
// ======================================================

function updateAllDisplays() {

    renderCast();

    renderTwists();

    renderAlliances();

    renderRelationships();

    renderMemoryWall();

    renderJury();

    renderEvicted();

    updateRelationshipDropdowns();

    updateGameDisplay();

    updateSeasonSummary();

    updateSelectedSeasonInfo();
}


// ======================================================
// SAVE GAME
// ======================================================

function saveGame() {

    const data = {

        houseguests: houseguests,

        evictedHouseguests:
            evictedHouseguests,

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
        JSON.stringify(data)
    );

    alert("Season saved successfully!");
}


// ======================================================
// LOAD GAME
// ======================================================

function loadGame() {

    const saved =
        localStorage.getItem(
            "bigBrotherSimulatorSave"
        );

    if (!saved) {
        alert("No saved season found.");
        return;
    }

    try {

        const data =
            JSON.parse(saved);

        houseguests =
            data.houseguests || [];

        evictedHouseguests =
            data.evictedHouseguests || [];

        jury =
            data.jury || [];

        alliances =
            data.alliances || [];

        relationships =
            data.relationships || [];

        customTwists =
            data.customTwists || [];

        currentWeek =
            data.currentWeek || 1;

        currentHOH =
            data.currentHOH || null;

        nominees =
            data.nominees || [];

        povWinner =
            data.povWinner || null;

        seasonStarted =
            data.seasonStarted || false;

        selectedSeasonTemplate =
            data.selectedSeasonTemplate || "custom";

        const selector =
            document.getElementById("seasonTemplate");

        if (selector) {
            selector.value =
                selectedSeasonTemplate;
        }

        addEvent("💾 Saved season loaded.");

        updateAllDisplays();

    } catch (error) {

        console.error(error);

        alert(
            "The saved season could not be loaded."
        );

    }
}


// ======================================================
// RESET
// ======================================================

function resetGame() {

    const confirmed =
        confirm(
            "Are you sure you want to erase everything?"
        );

    if (!confirmed) {
        return;
    }

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
        document.getElementById("seasonTemplate");

    if (selector) {
        selector.value = "custom";
    }

    const log =
        document.getElementById("eventLog");

    if (log) {

        log.innerHTML =
            '<div class="event">Simulator reset.</div>';

    }

    updateAllDisplays();

    showSection("home");
}


// ======================================================
// HELPERS
// ======================================================

function clamp(value, min, max) {

    return Math.min(
        Math.max(value, min),
        max
    );

}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateAllDisplays();

    }
);
