/* =========================================================
   BIG BROTHER SIMULATOR
   COMPLETE GAME ENGINE
========================================================= */


/* =========================================================
   GLOBAL STATE
========================================================= */

let houseguests = [];
let evictedHouseguests = [];
let jury = [];

let alliances = [];
let relationships = [];
let customTwists = [];

let currentWeek = 0;
let cycleInWeek = 1;

let currentHOH = null;
let nominees = [];
let povWinner = null;
let povPlayers = [];

let hackerWinner = null;
let hackerVoteNullified = null;
let hackerSelectedVetoPlayer = null;

let seasonStarted = false;
let selectedSeasonTemplate = "bb20";
let currentStage = "ready";

let evictionHistory = [];
let voteHistory = [];

let appStoreRecipients = [];
let appStoreHistory = [];

let battleBackUsed = false;
let openingSafety = [];

let vetoUsed = false;

let finalHOHWinner = null;
let finalHOHPart1Winner = null;
let finalHOHPart2Winner = null;
let finalThree = [];

let finaleJuryVotes = {};
let seasonWinner = null;

let currentEvictionResult = null;
let voteRevealIndex = 0;

let doubleEvictionActive = false;

let events = [];


/* =========================================================
   SEASON TEMPLATES
========================================================= */

const SEASON_TEMPLATES = {

    custom: {
        name: "Custom Season",
        startingPlayers: 16,
        jurySize: 9,
        nominationCount: 2
    },

    bb19: {
        name: "Big Brother 19",
        startingPlayers: 16,
        jurySize: 9,
        nominationCount: 2
    },

    bb20: {
        name: "Big Brother 20",
        startingPlayers: 16,
        jurySize: 9,
        nominationCount: 2
    },

    bb23: {
        name: "Big Brother 23",
        startingPlayers: 16,
        jurySize: 9,
        nominationCount: 2
    },

    bb24: {
        name: "Big Brother 24",
        startingPlayers: 16,
        jurySize: 8,
        nominationCount: 2
    },

    bb25: {
        name: "Big Brother 25",
        startingPlayers: 17,
        jurySize: 7,
        nominationCount: 2
    },

    bb26: {
        name: "Big Brother 26",
        startingPlayers: 16,
        jurySize: 9,
        nominationCount: 3
    }

};


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(sectionId) {

    document.querySelectorAll(".page-section")
        .forEach(section => {
            section.classList.remove("active");
        });

    const section = document.getElementById(sectionId);

    if (section) {
        section.classList.add("active");
    }

}


/* =========================================================
   SEASON SELECTION
========================================================= */

function selectSeasonTemplate() {

    const selector =
        document.getElementById("seasonSelector");

    if (!selector) return;

    selectedSeasonTemplate =
        selector.value;

    updateSelectedSeasonInfo();

}


function updateSelectedSeasonInfo() {

    const info =
        document.getElementById("selectedSeasonInfo");

    if (!info) return;

    const template =
        SEASON_TEMPLATES[selectedSeasonTemplate]
        || SEASON_TEMPLATES.custom;

    let competitionHTML = "";

    if (selectedSeasonTemplate === "bb20") {

        const competitions =
            BB20.competitions;

        competitionHTML = Object.entries(competitions)
            .map(([week, data]) => {

                if (data.finalHOH) {

                    return `
                        <div class="competition-chip">
                            <strong>FINAL HOH</strong>
                            <span>
                                ${data.finalHOH.map(x => x.name).join(" • ")}
                            </span>
                        </div>
                    `;

                }

                return `
                    <div class="competition-chip">
                        <strong>WEEK ${week}</strong>
                        <span>HOH: ${escapeHTML(data.hoh)}</span>
                        <small>
                            POV: ${escapeHTML(data.pov || "—")}
                        </small>
                    </div>
                `;

            })
            .join("");

    }

    info.innerHTML = `

        <h3>
            ${escapeHTML(template.name)}
        </h3>

        <div class="summary-grid">

            <div>
                <span>STARTING CAST</span>
                <strong>${template.startingPlayers}</strong>
            </div>

            <div>
                <span>NOMINEES</span>
                <strong>${template.nominationCount}</strong>
            </div>

            <div>
                <span>JURY</span>
                <strong>${template.jurySize}</strong>
            </div>

        </div>

        ${
            competitionHTML
                ? `<div class="template-twist-grid" style="margin-top:15px">
                    ${competitionHTML}
                   </div>`
                : ""
        }

    `;

}


/* =========================================================
   CAST
========================================================= */

function addHouseguest() {

    const name =
        document.getElementById("playerName").value.trim();

    if (!name) {

        alert("Enter a houseguest name.");

        return;
    }


    const image =
        document.getElementById("playerImage").value.trim();

    const physical =
        clamp(
            Number(document.getElementById("playerPhysical").value) || 5,
            1,
            10
        );

    const mental =
        clamp(
            Number(document.getElementById("playerMental").value) || 5,
            1,
            10
        );

    const social =
        clamp(
            Number(document.getElementById("playerSocial").value) || 5,
            1,
            10
        );

    const strategy =
        clamp(
            Number(document.getElementById("playerStrategy").value) || 5,
            1,
            10
        );


    const player = {

        id:
            "player_" +
            Date.now() +
            "_" +
            Math.random().toString(36).slice(2, 8),

        name,

        image,

        physical,
        mental,
        social,
        strategy,

        status: "Active",

        app: null,
        punishment: null,

        appUsed: false,

        cloudAvailable: false,
        identityTheftAvailable: false,
        bonusLifeAvailable: false,

        hackerWins: 0,

        safety: false,

        returned: false,

        evictionOrder: null,

        placement: null

    };


    houseguests.push(player);

    clearCastForm();

    updateAllDisplays();

}


function clearCastForm() {

    [
        "playerName",
        "playerImage"
    ].forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.value = "";
        }

    });

}


function renderCast() {

    const grid =
        document.getElementById("castGrid");

    if (!grid) return;

    document.getElementById("castCount").textContent =
        houseguests.length;


    grid.innerHTML =
        houseguests.map(player => `

            <div class="cast-card">

                <div class="cast-image-wrapper">

                    ${getPlayerImageHTML(player)}

                </div>

                <h3>
                    ${escapeHTML(player.name)}
                </h3>

                <div class="player-stats">

                    <span>
                        Physical: ${player.physical}
                    </span>

                    <span>
                        Mental: ${player.mental}
                    </span>

                    <span>
                        Social: ${player.social}
                    </span>

                    <span>
                        Strategy: ${player.strategy}
                    </span>

                </div>

                ${
                    player.app
                    ? `<div class="player-status active">
                        ${escapeHTML(player.app)}
                       </div>`
                    : ""
                }

                ${
                    player.punishment
                    ? `<div class="player-status evicted">
                        ${escapeHTML(player.punishment)}
                       </div>`
                    : ""
                }

                <div class="
                    player-status
                    ${player.status === "Active"
                        ? "active"
                        : "evicted"}
                ">

                    ${escapeHTML(player.status)}

                </div>

            </div>

        `).join("");

}


/* =========================================================
   IMAGES
========================================================= */

function getPlayerImageHTML(player) {

    const initials =
        getInitials(player.name);

    if (!player.image) {

        return `
            <div class="image-placeholder">
                ${escapeHTML(initials)}
            </div>
        `;

    }

    return `

        <img
            class="player-photo"
            src="${escapeAttribute(player.image)}"
            alt="${escapeAttribute(player.name)}"
            onerror="
                this.outerHTML =
                '<div class=&quot;image-placeholder&quot;>${escapeHTML(initials)}</div>'
            "
        >

    `;

}


function getInitials(name) {

    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase();

}


/* =========================================================
   TWISTS
========================================================= */

function createTwist() {

    const name =
        document.getElementById("twistName").value.trim();

    const description =
        document.getElementById("twistDescription").value.trim();

    if (!name) return;

    customTwists.push({
        name,
        description
    });

    document.getElementById("twistName").value = "";
    document.getElementById("twistDescription").value = "";

    renderTwists();

}


function renderTwists() {

    const list =
        document.getElementById("twistList");

    if (!list) return;

    list.innerHTML =
        customTwists.length
        ? customTwists.map(twist => `

            <div class="player-item">

                <strong>
                    ${escapeHTML(twist.name)}
                </strong>

                <p>
                    ${escapeHTML(twist.description)}
                </p>

            </div>

        `).join("")
        : "<p>No custom twists.</p>";

}


/* =========================================================
   ALLIANCES
========================================================= */

function createAlliance() {

    const name =
        document.getElementById("allianceName")
            .value.trim();

    const select =
        document.getElementById("allianceMembers");

    if (!name || !select) return;

    const memberIds =
        Array.from(select.selectedOptions)
            .map(option => option.value);

    if (memberIds.length < 2) {

        alert("Choose at least two Houseguests.");

        return;
    }

    alliances.push({

        id:
            "alliance_" +
            Date.now(),

        name,

        members: memberIds

    });

    document.getElementById("allianceName").value = "";

    renderAlliances();

}


function renderAlliances() {

    const list =
        document.getElementById("allianceList");

    if (!list) return;

    if (!alliances.length) {

        list.innerHTML =
            "<p>No alliances created.</p>";

        return;
    }


    list.innerHTML =
        alliances.map(alliance => {

            const members =
                alliance.members
                    .map(id =>
                        houseguests.find(p => p.id === id)
                    )
                    .filter(Boolean);


            return `

                <div class="panel">

                    <h3>
                        ${escapeHTML(alliance.name)}
                    </h3>

                    <div class="game-houseguest-grid">

                        ${members.map(player => `

                            <div class="game-player-card">

                                <div class="game-player-photo">
                                    ${getPlayerImageHTML(player)}
                                </div>

                                <strong>
                                    ${escapeHTML(player.name)}
                                </strong>

                            </div>

                        `).join("")}

                    </div>

                </div>

            `;

        }).join("");

}


/* =========================================================
   RELATIONSHIPS
========================================================= */

function createRelationship() {

    const a =
        document.getElementById("relationshipA").value;

    const b =
        document.getElementById("relationshipB").value;

    const value =
        clamp(
            Number(
                document.getElementById("relationshipValue").value
            ) || 0,
            -100,
            100
        );

    if (!a || !b || a === b) return;

    relationships =
        relationships.filter(
            r =>
                !(
                    (r.a === a && r.b === b) ||
                    (r.a === b && r.b === a)
                )
        );

    relationships.push({
        a,
        b,
        value
    });

    renderRelationships();

}


function getRelationship(a, b) {

    const relation =
        relationships.find(
            r =>
                (r.a === a && r.b === b) ||
                (r.a === b && r.b === a)
        );

    return relation
        ? relation.value
        : 0;

}


function renderRelationships() {

    const list =
        document.getElementById("relationshipList");

    if (!list) return;

    list.innerHTML =
        relationships.length
        ? relationships.map(r => {

            const a =
                houseguests.find(p => p.id === r.a);

            const b =
                houseguests.find(p => p.id === r.b);

            return `

                <div class="player-item">

                    <strong>
                        ${escapeHTML(a?.name || "?")}
                        ↔
                        ${escapeHTML(b?.name || "?")}
                    </strong>

                    <div>
                        Relationship:
                        ${r.value}
                    </div>

                </div>

            `;

        }).join("")
        : "<p>No relationships created.</p>";

}


/* =========================================================
   RELATIONSHIP DROPDOWNS
========================================================= */

function updateRelationshipDropdowns() {

    const selects = [

        document.getElementById("relationshipA"),
        document.getElementById("relationshipB")

    ];

    selects.forEach(select => {

        if (!select) return;

        const old =
            select.value;

        select.innerHTML =
            houseguests.map(player => `

                <option value="${escapeAttribute(player.id)}">
                    ${escapeHTML(player.name)}
                </option>

            `).join("");

        if (
            houseguests.some(
                player => player.id === old
            )
        ) {
            select.value = old;
        }

    });


    const allianceSelect =
        document.getElementById("allianceMembers");

    if (allianceSelect) {

        allianceSelect.innerHTML =
            houseguests
                .filter(p => p.status === "Active")
                .map(player => `

                    <option value="${escapeAttribute(player.id)}">
                        ${escapeHTML(player.name)}
                    </option>

                `)
                .join("");

    }

}


/* =========================================================
   START SEASON
========================================================= */

function startNewSeason() {

    const template =
        SEASON_TEMPLATES[selectedSeasonTemplate]
        || SEASON_TEMPLATES.custom;


    if (
        houseguests.length !==
        template.startingPlayers
    ) {

        const proceed =
            confirm(
                `This format expects ${template.startingPlayers} Houseguests, but you have ${houseguests.length}. Continue anyway?`
            );

        if (!proceed) return;

    }


    currentWeek = 0;
    cycleInWeek = 1;

    currentHOH = null;
    nominees = [];
    povWinner = null;
    povPlayers = [];

    hackerWinner = null;
    hackerVoteNullified = null;
    hackerSelectedVetoPlayer = null;

    evictionHistory = [];
    voteHistory = [];

    appStoreRecipients = [];
    appStoreHistory = [];

    battleBackUsed = false;
    openingSafety = [];

    vetoUsed = false;

    finalHOHWinner = null;
    finalHOHPart1Winner = null;
    finalHOHPart2Winner = null;

    finalThree = [];

    finaleJuryVotes = {};
    seasonWinner = null;

    currentEvictionResult = null;
    voteRevealIndex = 0;

    doubleEvictionActive = false;

    events = [];

    houseguests.forEach(player => {

        player.status = "Active";

        player.app = null;
        player.punishment = null;

        player.appUsed = false;

        player.cloudAvailable = false;
        player.identityTheftAvailable = false;
        player.bonusLifeAvailable = false;

        player.hackerWins = 0;

        player.safety = false;

        player.returned = false;

        player.evictionOrder = null;
        player.placement = null;

    });


    evictedHouseguests = [];
    jury = [];

    seasonStarted = true;

    if (selectedSeasonTemplate === "bb20") {

        currentWeek = 1;

        currentStage = "opening1";

        addEvent(
            "The Big Brother 20 premiere has begun."
        );

        addEvent(
            "The Houseguests will compete in a three-part opening safety sequence."
        );

    } else {

        currentWeek = 1;

        currentStage = "hoh";

        addEvent(
            `${template.name} has begun.`
        );

    }


    updateAllDisplays();

    showSection("game");

}


/* =========================================================
   GAME ENGINE
========================================================= */

function proceedGame() {

    if (!seasonStarted) {

        startNewSeason();

        return;
    }


    switch (currentStage) {

        case "opening1":
            runOpeningSafetyPart(1);
            break;

        case "opening2":
            runOpeningSafetyPart(2);
            break;

        case "opening3":
            runOpeningSafetyPart(3);
            break;

        case "hoh":
            runHOH();
            break;

        case "appstore":
            runAppStore();
            break;

        case "nominations":
            makeNominations();
            break;

        case "hacker":
            runHackerCompetition();
            break;

        case "povDraw":
            drawPOVPlayers();
            break;

        case "pov":
            runPOV();
            break;

        case "veto":
            usePOV();
            break;

        case "evictionVoting":
            beginEvictionVoting();
            break;

        case "eviction":
            revealNextVote();
            break;

        case "battleback":
            runBattleBack();
            break;

        case "nextweek":
            beginNextWeek();
            break;

        case "finalHOH1":
            runFinalHOHPart(1);
            break;

        case "finalHOH2":
            runFinalHOHPart(2);
            break;

        case "finalHOH3":
            runFinalHOHPart(3);
            break;

        case "finalEviction":
            runFinalEviction();
            break;

        case "juryVote":
            runFinalJuryVote();
            break;

        case "finished":
            showFinale();
            break;

        default:

            if (selectedSeasonTemplate !== "bb20") {
                proceedGenericSeason();
            }

    }

}


/* =========================================================
   STAGE UI
========================================================= */

function setStage(stage) {

    currentStage = stage;

    updateStageDisplay();

}


function updateStageDisplay() {

    const title =
        document.getElementById("stageTitle");

    const description =
        document.getElementById("stageDescription");

    const button =
        document.getElementById("proceedButton");

    const icon =
        document.getElementById("stageIcon");


    if (!title || !description || !button) return;


    const stages = {

        ready: [
            "Ready",
            "Start the season.",
            "START SEASON",
            "▶"
        ],

        opening1: [
            "Premiere Safety — Part 1",
            "The Houseguests compete for safety.",
            "RUN PART 1",
            "1"
        ],

        opening2: [
            "Premiere Safety — Part 2",
            "The next safety competition begins.",
            "RUN PART 2",
            "2"
        ],

        opening3: [
            "Premiere Safety — Part 3",
            "The final premiere safety competition determines the protected Houseguests.",
            "RUN PART 3",
            "3"
        ],

        hoh: [
            "Head of Household",
            "Compete for the power to nominate two Houseguests.",
            "RUN HOH",
            "H"
        ],

        appstore: [
            "Big Brother App Store",
            "Houseguests receive the week's power and punishment apps.",
            "OPEN APP STORE",
            "A"
        ],

        nominations: [
            "Nomination Ceremony",
            "The HOH nominates two Houseguests.",
            "MAKE NOMINATIONS",
            "N"
        ],

        hacker: [
            "Hacker Competition",
            "An anonymous Hacker can alter the nominations, choose a Veto player and nullify an eviction vote.",
            "RUN HACKER",
            "?"
        ],

        povDraw: [
            "Power of Veto Draw",
            "The Veto players are selected.",
            "DRAW VETO PLAYERS",
            "V"
        ],

        pov: [
            "Power of Veto Competition",
            "The selected Houseguests compete for the Power of Veto.",
            "RUN POV",
            "V"
        ],

        veto: [
            "Veto Ceremony",
            "The Veto holder decides whether to use the Power of Veto.",
            "HOLD VETO CEREMONY",
            "✓"
        ],

        evictionVoting: [
            "Eviction Voting",
            "The eligible Houseguests prepare to cast their votes.",
            "BEGIN VOTING",
            "●"
        ],

        eviction: [
            "Live Eviction",
            "The eviction votes will be revealed one at a time.",
            "REVEAL NEXT VOTE",
            "!"
        ],

        battleback: [
            "Jury Battle Back",
            "The eligible jurors compete for a chance to return to the game.",
            "RUN BATTLE BACK",
            "↩"
        ],

        nextweek: [
            "Next Week",
            "Begin the next cycle of the season.",
            "BEGIN NEXT WEEK",
            "→"
        ],

        finalHOH1: [
            "Final Head of Household — Part 1",
            "The final three compete in the first part of the final HOH.",
            "RUN PART 1",
            "1"
        ],

        finalHOH2: [
            "Final Head of Household — Part 2",
            "The remaining two Houseguests compete in Part 2.",
            "RUN PART 2",
            "2"
        ],

        finalHOH3: [
            "Final Head of Household — Part 3",
            "The Part 1 and Part 2 winners face off.",
            "RUN PART 3",
            "3"
        ],

        finalEviction: [
            "Final Eviction",
            "The final HOH decides which Houseguest joins the jury as the final juror.",
            "EVICT THIRD PLACE",
            "!"
        ],

        juryVote: [
            "Jury Vote",
            "The jury votes to determine the winner.",
            "REVEAL JURY VOTES",
            "★"
        ],

        finished: [
            "Season Complete",
            "The Big Brother season has concluded.",
            "VIEW FINALE",
            "★"
        ]

    };


    const data =
        stages[currentStage] ||
        stages.ready;


    title.textContent = data[0];

    description.textContent = data[1];

    button.textContent = data[2];

    if (icon) {
        icon.textContent = data[3];
    }

}


/* =========================================================
   PREMIERE SAFETY
========================================================= */

function runOpeningSafetyPart(part) {

    const active =
        getActivePlayers();

    if (!active.length) return;


    let winner;


    if (part === 1) {

        winner =
            competitionWinner(
                active,
                "mental"
            );

        winner.safety = true;

        addEvent(
            `${winner.name} won Part 1 of the premiere safety competition.`
        );

        currentStage = "opening2";

    }


    else if (part === 2) {

        const eligible =
            getActivePlayers()
                .filter(p => !p.safety);

        winner =
            competitionWinner(
                eligible,
                "mental"
            );

        winner.safety = true;

        addEvent(
            `${winner.name} won Part 2 of the premiere safety competition.`
        );

        currentStage = "opening3";

    }


    else {

        const eligible =
            getActivePlayers()
                .filter(p => !p.safety);

        winner =
            competitionWinner(
                eligible,
                "mixed"
            );

        winner.safety = true;

        const protectedPlayers =
            getActivePlayers()
                .filter(p => p.safety);

        openingSafety =
            protectedPlayers.map(p => p.id);

        addEvent(
            `${winner.name} won the final premiere safety competition.`
        );

        addEvent(
            `${protectedPlayers.length} Houseguests are protected from the opening eviction.`
        );

        currentStage = "hoh";

    }


    updateAllDisplays();

}


/* =========================================================
   COMPETITION DATA
========================================================= */

function getCurrentWeekData() {

    if (
        selectedSeasonTemplate === "bb20" &&
        BB20.competitions[currentWeek]
    ) {
        return BB20.competitions[currentWeek];
    }

    return null;

}


function getCurrentHOHCompetition() {

    const data =
        getCurrentWeekData();

    if (!data) return null;

    if (
        cycleInWeek === 2 &&
        data.secondHOH
    ) {

        return {
            name: data.secondHOH,
            type: data.secondHOHType || "mixed"
        };

    }

    return {
        name: data.hoh,
        type: data.hohType || "mixed"
    };

}


function getCurrentPOVCompetition() {

    const data =
        getCurrentWeekData();

    if (!data) return null;

    if (
        cycleInWeek === 2 &&
        data.secondPOV
    ) {

        return {
            name: data.secondPOV,
            type: data.secondPOVType || "mixed"
        };

    }

    return {
        name: data.pov,
        type: data.povType || "mixed"
    };

}


/* =========================================================
   HOH
========================================================= */

function runHOH() {

    const active =
        getActivePlayers();


    const eligible =
        active.filter(
            player =>
                player.id !== currentHOH?.id &&
                !player.safety
        );


    if (!eligible.length) return;


    const competition =
        getCurrentHOHCompetition();


    const winner =
        competitionWinner(
            eligible,
            competition?.type || "mixed"
        );


    currentHOH = winner;

    addEvent(
        `${winner.name} won HOH: ${competition?.name || "Head of Household"}.`
    );


    nominees = [];
    povWinner = null;
    povPlayers = [];

    hackerWinner = null;
    hackerVoteNullified = null;
    hackerSelectedVetoPlayer = null;

    vetoUsed = false;


    if (
        selectedSeasonTemplate === "bb20" &&
        BB20.twists.appStore.activeWeeks.includes(currentWeek)
    ) {

        currentStage = "appstore";

    } else {

        currentStage = "nominations";

    }


    updateAllDisplays();

}


/* =========================================================
   APP STORE
========================================================= */

function runAppStore() {

    if (
        selectedSeasonTemplate !== "bb20" ||
        !BB20.twists.appStore.activeWeeks.includes(currentWeek)
    ) {

        currentStage = "nominations";

        updateAllDisplays();

        return;
    }


    const available =
        getActivePlayers()
            .filter(
                player =>
                    !player.app &&
                    player.id !== currentHOH?.id
            );


    if (!available.length) {

        currentStage = "nominations";

        updateAllDisplays();

        return;
    }


    const ranked =
        [...available]
            .sort(
                (a, b) =>
                    (
                        b.social +
                        Math.random() * 4
                    ) -
                    (
                        a.social +
                        Math.random() * 4
                    )
            );


    const top =
        ranked[0];


    const bottom =
        ranked[ranked.length - 1];


    const weekPower =
        BB20.twists.appStore.powerApps[currentWeek - 1];


    const weekCrap =
        BB20.twists.appStore.crapApps[currentWeek - 1];


    if (top) {

        top.app =
            weekPower.name;

        if (weekPower.type === "bonusLife") {
            top.bonusLifeAvailable = true;
        }

        if (weekPower.type === "cloud") {
            top.cloudAvailable = true;
        }

        if (weekPower.type === "identityTheft") {
            top.identityTheftAvailable = true;
        }

    }


    if (
        bottom &&
        bottom.id !== top?.id
    ) {

        bottom.punishment =
            weekCrap.name;

    }


    appStoreRecipients.push({

        week: currentWeek,

        powerPlayer: top?.id || null,

        power: weekPower.name,

        punishmentPlayer: bottom?.id || null,

        punishment: weekCrap.name

    });


    appStoreHistory.push(
        appStoreRecipients[
            appStoreRecipients.length - 1
        ]
    );


    if (top) {

        addEvent(
            `${top.name} received ${weekPower.name} from the App Store.`
        );

    }


    if (bottom) {

        addEvent(
            `${bottom.name} received the ${weekCrap.name} punishment.`
        );

    }


    currentStage = "nominations";

    updateAllDisplays();

}


/* =========================================================
   NOMINATIONS
========================================================= */

function makeNominations() {

    const eligible =
        getActivePlayers()
            .filter(
                player =>
                    player.id !== currentHOH?.id &&
                    !player.cloudAvailable &&
                    !player.safety
            );


    if (eligible.length < 2) return;


    nominees =
        chooseNominees(
            eligible,
            2
        );


    /*
       Identity Theft
    */

    const identityHolder =
        getActivePlayers()
            .find(
                player =>
                    player.identityTheftAvailable
            );


    if (identityHolder) {

        const replacementPool =
            eligible.filter(
                player =>
                    player.id !== identityHolder.id
            );


        if (replacementPool.length >= 2) {

            const stolen =
                chooseNominees(
                    replacementPool,
                    2
                );


            nominees = stolen;

            identityHolder.identityTheftAvailable =
                false;

            addEvent(
                `${identityHolder.name} secretly used Identity Theft and replaced the HOH's nominations.`
            );

        }

    }


    addEvent(
        `${currentHOH.name} nominated ${nominees[0].name} and ${nominees[1].name}.`
    );


    if (
        selectedSeasonTemplate === "bb20" &&
        BB20.twists.hacker.activeWeeks.includes(currentWeek)
    ) {

        currentStage = "hacker";

    } else {

        currentStage = "povDraw";

    }


    updateAllDisplays();

}


/* =========================================================
   NOMINATION AI
========================================================= */

function chooseNominees(players, count) {

    const selected = [];

    const pool = [...players];

    while (
        selected.length < count &&
        pool.length
    ) {

        const chosen =
            weightedRandomPlayer(
                pool,
                player =>

                    10 +

                    player.strategy * 1.5 +

                    player.physical * .5 +

                    Math.random() * 10
            );


        if (!chosen) break;


        selected.push(chosen);

        const index =
            pool.findIndex(
                player =>
                    player.id === chosen.id
            );

        if (index >= 0) {
            pool.splice(index, 1);
        }

    }

    return selected;

}


/* =========================================================
   HACKER
========================================================= */

function runHackerCompetition() {

    const active =
        getActivePlayers();


    if (!active.length) return;


    const winner =
        competitionWinner(
            active,
            "mental"
        );


    hackerWinner = winner;

    winner.hackerWins =
        (winner.hackerWins || 0) + 1;


    addEvent(
        `${winner.name} secretly won the Hacker Competition.`
    );


    /*
       Replace one nominee
    */

    const replacementPool =
        active.filter(
            player =>
                player.id !== currentHOH?.id &&
                !nominees.some(
                    n => n.id === player.id
                )
        );


    if (
        replacementPool.length &&
        nominees.length
    ) {

        const removed =
            nominees[
                Math.floor(
                    Math.random() *
                    nominees.length
                )
            ];


        const replacement =
            weightedRandomPlayer(
                replacementPool,
                player =>
                    10 +
                    player.strategy * 2 +
                    Math.random() * 10
            );


        nominees =
            nominees.filter(
                n =>
                    n.id !== removed.id
            );


        nominees.push(replacement);


        addEvent(
            `The Hacker replaced ${removed.name} with ${replacement.name}.`
        );

    }


    /*
       Hacker chooses one Veto player.
    */

    const vetoPool =
        active.filter(
            player =>
                player.id !== currentHOH?.id &&
                !nominees.some(
                    n => n.id === player.id
                )
        );


    if (vetoPool.length) {

        hackerSelectedVetoPlayer =
            weightedRandomPlayer(
                vetoPool,
                player =>
                    player.mental * 2 +
                    player.strategy * 1.5 +
                    Math.random() * 10
            );

    }


    /*
       Hacker chooses a vote to nullify.
       The identity remains hidden from the game narrative,
       but the vote is recorded internally.
    */

    chooseHackerVoteNullification();


    currentStage = "povDraw";

    updateAllDisplays();

}


/* =========================================================
   HACKER VOTE NULLIFICATION
========================================================= */

function chooseHackerVoteNullification() {

    const voters =
        getActivePlayers()
            .filter(
                player =>
                    player.id !== currentHOH?.id &&
                    !nominees.some(
                        n => n.id === player.id
                    )
            );


    if (!voters.length) {

        hackerVoteNullified = null;

        return;
    }


    hackerVoteNullified =
        weightedRandomPlayer(
            voters,
            player =>
                10 +
                player.strategy * 2 +
                player.social +
                Math.random() * 10
        );


    addEvent(
        "The Hacker secretly selected an eviction vote to nullify."
    );

}


/* =========================================================
   POV DRAW
========================================================= */

function drawPOVPlayers() {

    const active =
        getActivePlayers();


    const selected = [];


    if (currentHOH) {

        selected.push(currentHOH);

    }


    nominees.forEach(
        nominee => {

            if (
                !selected.some(
                    p => p.id === nominee.id
                )
            ) {

                selected.push(nominee);

            }

        }
    );


    let available =
        active.filter(
            player =>
                !selected.some(
                    p => p.id === player.id
                )
        );


    /*
       Hacker-selected Veto player
    */

    if (
        hackerSelectedVetoPlayer &&
        available.some(
            p =>
                p.id === hackerSelectedVetoPlayer.id
        )
    ) {

        selected.push(
            hackerSelectedVetoPlayer
        );

        available =
            available.filter(
                p =>
                    p.id !==
                    hackerSelectedVetoPlayer.id
            );

    }


    while (
        selected.length < 6 &&
        available.length
    ) {

        const randomIndex =
            Math.floor(
                Math.random() *
                available.length
            );

        selected.push(
            available.splice(
                randomIndex,
                1
            )[0]
        );

    }


    povPlayers = selected;


    addEvent(
        `The Veto players are ${povPlayers.map(p => p.name).join(", ")}.`
    );


    currentStage = "pov";

    updateAllDisplays();

}


/* =========================================================
   POV
========================================================= */

function runPOV() {

    if (!povPlayers.length) {

        drawPOVPlayers();

        return;
    }


    const competition =
        getCurrentPOVCompetition();


    const winner =
        competitionWinner(
            povPlayers,
            competition?.type || "mixed"
        );


    povWinner = winner;


    addEvent(
        `${winner.name} won the Power of Veto: ${competition?.name || "Power of Veto"}.`
    );


    currentStage = "veto";

    updateAllDisplays();

}


/* =========================================================
   VETO CEREMONY
========================================================= */

function usePOV() {

    vetoUsed = false;


    if (!povWinner) {

        currentStage = "evictionVoting";

        updateAllDisplays();

        return;
    }


    /*
       Final 4:
       POV winner has automatic ability to save a nominee,
       and the POV holder becomes the sole voter.
    */

    if (
        getActivePlayers().length === 4
    ) {

        if (
            nominees.some(
                n => n.id === povWinner.id
            )
        ) {

            vetoUsed = true;

        } else {

            vetoUsed =
                Math.random() < .70;

        }

    } else {

        /*
           Nominee POV winners almost always use it.
        */

        if (
            nominees.some(
                n => n.id === povWinner.id
            )
        ) {

            vetoUsed = true;

        } else {

            vetoUsed =
                Math.random() < .38;

        }

    }


    if (vetoUsed) {

        const savedNominee =
            nominees.find(
                n =>
                    n.id === povWinner.id
            )
            ||
            nominees[
                Math.floor(
                    Math.random() *
                    nominees.length
                )
            ];


        const replacementPool =
            getActivePlayers()
                .filter(
                    player =>
                        player.id !== currentHOH?.id &&
                        player.id !== povWinner.id &&
                        !nominees.some(
                            n =>
                                n.id === player.id
                        )
                );


        let replacement = null;


        if (replacementPool.length) {

            replacement =
                chooseReplacementNominee(
                    replacementPool
                );

        }


        if (replacement) {

            nominees =
                nominees.filter(
                    n =>
                        n.id !==
                        savedNominee.id
                );


            nominees.push(
                replacement
            );


            addEvent(
                `${povWinner.name} used the Power of Veto on ${savedNominee.name}.`
            );


            addEvent(
                `${currentHOH.name} named ${replacement.name} as the replacement nominee.`
            );

        }

    } else {

        addEvent(
            `${povWinner.name} did not use the Power of Veto.`
        );

    }


    currentStage = "evictionVoting";

    updateAllDisplays();

}


function chooseReplacementNominee(pool) {

    return weightedRandomPlayer(
        pool,
        player =>
            10 +
            player.strategy * 2 +
            player.social +
            player.physical * .5 +
            Math.random() * 15
    );

}


/* =========================================================
   EVICTION VOTING
========================================================= */

function beginEvictionVoting() {

    currentEvictionResult = {

        week: currentWeek,

        cycle: cycleInWeek,

        nominees:
            nominees.map(
                n => n.id
            ),

        voters: [],

        voteTotals: {},

        votes: [],

        tieBreaker: null,

        evicted: null,

        nullifiedVoter:
            hackerVoteNullified?.id || null

    };


    voteRevealIndex = 0;


    const active =
        getActivePlayers();


    active.forEach(
        player => {

            const isHOH =
                currentHOH &&
                player.id === currentHOH.id;


            const isNominee =
                nominees.some(
                    n =>
                        n.id === player.id
                );


            currentEvictionResult.voters.push({

                playerId: player.id,

                eligible:
                    !isHOH &&
                    !isNominee,

                vote: null,

                nullified: false

            });

        }
    );


    addEvent(
        "The live eviction vote has begun."
    );


    currentStage = "eviction";

    updateAllDisplays();

}


/* =========================================================
   INDIVIDUAL VOTE REVEAL
========================================================= */

function revealNextVote() {

    if (!currentEvictionResult) {

        beginEvictionVoting();

        return;
    }


    const voters =
        currentEvictionResult.voters;


    /*
       Find next eligible voter.
    */

    while (
        voteRevealIndex <
        voters.length
    ) {

        const entry =
            voters[voteRevealIndex];


        voteRevealIndex++;


        if (!entry.eligible) {

            continue;

        }


        const voter =
            houseguests.find(
                p =>
                    p.id ===
                    entry.playerId
            );


        if (!voter) continue;


        /*
           Generate vote.
        */

        const vote =
            chooseEvictionVote(
                voter
            );


        entry.vote =
            vote.id;


        if (
            hackerVoteNullified &&
            voter.id ===
            hackerVoteNullified.id
        ) {

            entry.nullified = true;

            entry.originalVote = vote.id;

            addEvent(
                `The Hacker's selected vote was nullified.`
            );

        } else {

            if (
                !currentEvictionResult.voteTotals[vote.id]
            ) {

                currentEvictionResult.voteTotals[vote.id] = 0;

            }


            currentEvictionResult.voteTotals[vote.id]++;

        }


        currentEvictionResult.votes.push({

            voter: voter.id,

            target: vote.id,

            nullified: entry.nullified

        });


        displayCurrentVoteReveal(
            voter,
            vote,
            entry.nullified
        );


        updateAllDisplays();

        return;

    }


    finishEviction();


}


/* =========================================================
   VOTE AI
========================================================= */

function chooseEvictionVote(voter) {

    const targets =
        nominees.filter(
            nominee =>
                nominee.id !== voter.id
        );


    if (targets.length === 1) {

        return targets[0];

    }


    const scores =
        targets.map(
            target => ({

                player: target,

                score:
                    evictionTargetScore(
                        voter,
                        target
                    )

            })
        );


    scores.sort(
        (a, b) =>
            b.score - a.score
    );


    /*
       Add randomness so seasons don't
       produce the same result every time.
    */

    if (
        scores.length > 1 &&
        Math.random() < .28
    ) {

        return scores[
            Math.floor(
                Math.random() *
                Math.min(
                    2,
                    scores.length
                )
            )
        ].player;

    }


    return scores[0].player;

}


function evictionTargetScore(
    voter,
    target
) {

    let score = 0;


    /*
       Strong personal relationship
       makes a player less likely to
       vote against someone.
    */

    const relationship =
        getRelationship(
            voter.id,
            target.id
        );


    score -=
        relationship * .65;


    /*
       Strategy threat.
    */

    score +=
        target.strategy * 2;


    /*
       Social threat.
    */

    score +=
        target.social;


    /*
       Physical threat.
    */

    score +=
        target.physical * .5;


    /*
       Alliance protection.
    */

    if (
        areAllied(
            voter,
            target
        )
    ) {

        score -= 35;

    }


    /*
       Avoid voting against someone
       with a strong relationship.
    */

    score +=
        Math.random() * 30;


    return score;

}


/* =========================================================
   EVICTION REVEAL UI
========================================================= */

function displayCurrentVoteReveal(
    voter,
    target,
    nullified
) {

    const box =
        document.getElementById(
            "evictionResults"
        );


    if (!box) return;


    box.classList.remove("hidden");


    box.innerHTML = `

        <div class="eyebrow">
            LIVE EVICTION
        </div>

        <div class="vote-reveal-box">

            <h3>
                ${escapeHTML(voter.name)}
            </h3>

            <div class="vote-reveal-player">

                ${getPlayerImageHTML(voter)}

            </div>

            ${
                nullified

                ? `

                    <div class="nullified-vote">
                        HACKER VOTE NULLIFIED
                    </div>

                    <p>
                        ${escapeHTML(voter.name)}'s vote
                        was nullified.
                    </p>

                  `

                : `

                    <p>
                        ${escapeHTML(voter.name)}
                        voted to evict:
                    </p>

                    <div class="vote-reveal-player">

                        ${getPlayerImageHTML(target)}

                    </div>

                    <h3>
                        ${escapeHTML(target.name)}
                    </h3>

                  `

            }

        </div>

        <p style="text-align:center;color:#888894">
            Click PROCEED to reveal the next vote.
        </p>

    `;

}


/* =========================================================
   FINISH EVICTION
========================================================= */

function finishEviction() {

    const result =
        currentEvictionResult;


    /*
       Count totals.
    */

    const totals = {};


    nominees.forEach(
        nominee => {

            totals[nominee.id] =
                result.voteTotals[nominee.id]
                || 0;

        }
    );


    let evicted;


    const sorted =
        nominees
            .map(
                nominee => ({

                    player: nominee,

                    votes:
                        totals[nominee.id]

                })
            )
            .sort(
                (a, b) =>
                    b.votes - a.votes
            );


    if (
        sorted.length >= 2 &&
        sorted[0].votes ===
        sorted[1].votes
    ) {

        /*
           HOH breaks tie.
        */

        const preferred =
            chooseEvictionVote(
                currentHOH,
            );


        /*
           Ensure tie breaker selects
           one of the tied nominees.
        */

        if (
            sorted.some(
                x =>
                    x.player.id ===
                    preferred.id &&
                    x.votes ===
                    sorted[0].votes
            )
        ) {

            evicted =
                preferred;

        } else {

            evicted =
                sorted[0].player;

        }


        result.tieBreaker =
            currentHOH?.id || null;


        if (currentHOH) {

            addEvent(
                `${currentHOH.name} broke the tie and evicted ${evicted.name}.`
            );

        }

    } else {

        evicted =
            sorted[0]?.player;

    }


    if (!evicted) return;


    result.evicted =
        evicted.id;


    result.voteTotals =
        totals;


    result.nomineeObjects =
        nominees.map(
            n => n.id
        );


    voteHistory.push(
        JSON.parse(
            JSON.stringify(result)
        )
    );


    evictionHistory.push(
        JSON.parse(
            JSON.stringify(result)
        )
    );


    evicted.status = "Evicted";

    evicted.evictionOrder =
        evictedHouseguests.length + 1;


    evicted.placement =
        16 -
        evicted.evictionOrder +
        1;


    evictedHouseguests.push(
        evicted
    );


    addEvent(
        `${evicted.name} was evicted from the Big Brother house.`
    );


    /*
       Jury begins with the eighth evicted
       player in a 16-person BB20 format.
    */

    if (
        evictedHouseguests.length >=
        BB20.juryStartAfterEvictions
    ) {

        if (
            !jury.some(
                p => p.id === evicted.id
            )
        ) {

            jury.push(evicted);

        }

    }


    /*
       Bonus Life mechanic.
    */

    handleBonusLife(evicted);


    /*
       Display final results.
    */

    displayFinalEvictionResults(
        result,
        evicted
    );


    /*
       Battle Back becomes available
       after the fourth juror has entered
       the jury.
    */

    if (
        !battleBackUsed &&
        jury.length >=
        BB20.twists.juryBattleBack.jurors &&
        !getActivePlayers().some(
            p => p.returned
        )
    ) {

        /*
           Do not immediately interrupt an eviction.
           It occurs at the next stage.
        */

        currentStage =
            "battleback";

    } else {

        currentStage =
            "nextweek";

    }


    updateAllDisplays();

}


/* =========================================================
   BONUS LIFE
========================================================= */

function handleBonusLife(evicted) {

    const holder =
        houseguests.find(
            player =>
                player.bonusLifeAvailable
        );


    if (!holder) return;


    /*
       The Bonus Life expires after the
       third eviction. If unused, the
       fourth evicted player gets the
       opportunity.
    */

    const evictionNumber =
        evictedHouseguests.length;


    if (
        evictionNumber <= 3 ||
        evictionNumber === 4
    ) {

        const usePower =
            evictionNumber === 4
            ? true
            : Math.random() < .45;


        if (usePower) {

            holder.bonusLifeAvailable =
                false;


            const returnChance =
                Math.random() < .50;


            if (returnChance) {

                evicted.status = "Active";

                evicted.returned = true;

                evicted.evictionOrder =
                    null;

                evicted.placement =
                    null;


                evictedHouseguests =
                    evictedHouseguests.filter(
                        p =>
                            p.id !==
                            evicted.id
                    );


                if (
                    !jury.some(
                        p =>
                            p.id ===
                            evicted.id
                    )
                ) {

                    jury =
                        jury.filter(
                            p =>
                                p.id !==
                                evicted.id
                        );

                }


                addEvent(
                    `${evicted.name} won the Bonus Life return competition and returned to the game!`
                );

            } else {

                addEvent(
                    `${evicted.name} competed for the Bonus Life but failed to return.`
                );

            }

        }

    }

}


/* =========================================================
   FINAL EVICTION DISPLAY
========================================================= */

function displayFinalEvictionResults(
    result,
    evicted
) {

    const box =
        document.getElementById(
            "evictionResults"
        );


    if (!box) return;


    const rows =
        result.voters
            .map(entry => {

                const voter =
                    houseguests.find(
                        p =>
                            p.id ===
                            entry.playerId
                    );


                if (!voter) return "";


                const target =
                    entry.vote
                    ? houseguests.find(
                        p =>
                            p.id ===
                            entry.vote
                    )
                    : null;


                const isHOH =
                    currentHOH &&
                    voter.id ===
                    currentHOH.id;


                const isNominee =
                    nominees.some(
                        n =>
                            n.id ===
                            voter.id
                    );


                if (isHOH || isNominee) {

                    return `

                        <div class="vote-row">

                            <div class="vote-person">

                                ${getPlayerImageHTML(voter)}

                                <strong>
                                    ${escapeHTML(voter.name)}
                                </strong>

                            </div>

                            <div class="vote-arrow">
                                —
                            </div>

                            <div>
                                Does Not Vote
                            </div>

                        </div>

                    `;

                }


                if (entry.nullified) {

                    return `

                        <div class="vote-row">

                            <div class="vote-person">

                                ${getPlayerImageHTML(voter)}

                                <strong>
                                    ${escapeHTML(voter.name)}
                                </strong>

                            </div>

                            <div class="vote-arrow">
                                —
                            </div>

                            <div class="nullified-vote">
                                VOTE NULLIFIED
                            </div>

                        </div>

                    `;

                }


                return `

                    <div class="vote-row">

                        <div class="vote-person">

                            ${getPlayerImageHTML(voter)}

                            <strong>
                                ${escapeHTML(voter.name)}
                            </strong>

                        </div>

                        <div class="vote-arrow">
                            →
                        </div>

                        <div class="vote-choice">

                            ${
                                target
                                ? getPlayerImageHTML(target)
                                : ""
                            }

                            <strong>
                                ${target
                                    ? escapeHTML(target.name)
                                    : "No Vote"}
                            </strong>

                        </div>

                    </div>

                `;

            })
            .join("");


    const totals =
        nominees
            .map(nominee => `

                <div class="vote-total">

                    ${getPlayerImageHTML(nominee)}

                    <div>

                        <strong>
                            ${escapeHTML(nominee.name)}
                        </strong>

                        <span>
                            ${
                                result.voteTotals[nominee.id] || 0
                            }
                            vote(s)
                        </span>

                    </div>

                </div>

            `)
            .join("");


    box.classList.remove("hidden");


    box.innerHTML = `

        <div class="eyebrow">
            LIVE EVICTION COMPLETE
        </div>

        <h2>
            ${escapeHTML(evicted.name)}
            has been evicted.
        </h2>

        <div class="vote-total-grid">

            ${totals}

        </div>

        <div class="vote-breakdown">

            ${rows}

        </div>

    `;

}


/* =========================================================
   BATTLE BACK
========================================================= */

function runBattleBack() {

    if (battleBackUsed) {

        currentStage = "nextweek";

        updateAllDisplays();

        return;

    }


    const eligible =
        jury.slice(
            0,
            BB20.twists.juryBattleBack.jurors
        );


    if (!eligible.length) {

        currentStage = "nextweek";

        updateAllDisplays();

        return;

    }


    const winner =
        competitionWinner(
            eligible,
            "physical"
        );


    winner.status = "Active";

    winner.returned = true;


    /*
       Remove from jury.
    */

    jury =
        jury.filter(
            p =>
                p.id !==
                winner.id
        );


    evictedHouseguests =
        evictedHouseguests.filter(
            p =>
                p.id !==
                winner.id
        );


    battleBackUsed = true;


    addEvent(
        `${winner.name} won the ${BB20.twists.juryBattleBack.competition} Battle Back and returned to the game!`
    );


    currentStage = "nextweek";

    updateAllDisplays();

}


/* =========================================================
   NEXT WEEK
========================================================= */

function beginNextWeek() {

    const active =
        getActivePlayers();


    /*
       Final 3
    */

    if (active.length === 3) {

        finalThree =
            [...active];

        currentStage = "finalHOH1";

        currentHOH = null;

        addEvent(
            "The game has reached the Final 3."
        );

        updateAllDisplays();

        return;

    }


    /*
       Final 4
    */

    if (active.length === 4) {

        currentWeek = 12;

        cycleInWeek = 2;

    }


    else {

        /*
           Double eviction structure.
        */

        if (
            currentWeek === 11 &&
            cycleInWeek === 1
        ) {

            cycleInWeek = 2;

            doubleEvictionActive = true;

        }

        else {

            currentWeek++;

            cycleInWeek = 1;

        }

    }


    currentHOH = null;
    nominees = [];
    povWinner = null;
    povPlayers = [];

    hackerWinner = null;
    hackerVoteNullified = null;
    hackerSelectedVetoPlayer = null;

    vetoUsed = false;

    currentEvictionResult = null;
    voteRevealIndex = 0;


    houseguests.forEach(
        player => {

            player.safety = false;

        }
    );


    /*
       If Week 11 second cycle, run HOH immediately.
    */

    currentStage = "hoh";


    addEvent(
        `Week ${currentWeek}${cycleInWeek === 2 ? " — Second Cycle" : ""} has begun.`
    );


    updateAllDisplays();

}


/* =========================================================
   FINAL HOH
========================================================= */

function runFinalHOHPart(part) {

    const active =
        getActivePlayers();


    if (active.length !== 3) {

        return;

    }


    if (part === 1) {

        finalHOHPart1Winner =
            competitionWinner(
                active,
                "physical"
            );


        addEvent(
            `${finalHOHPart1Winner.name} won Final HOH Part 1: Jetpack Attack.`
        );


        currentStage = "finalHOH2";

    }


    else if (part === 2) {

        const competitors =
            active.filter(
                p =>
                    p.id !==
                    finalHOHPart1Winner.id
            );


        finalHOHPart2Winner =
            competitionWinner(
                competitors,
                "mental"
            );


        addEvent(
            `${finalHOHPart2Winner.name} won Final HOH Part 2: Mount Evictus.`
        );


        currentStage = "finalHOH3";

    }


    else {

        const competitors = [

            finalHOHPart1Winner,

            finalHOHPart2Winner

        ];


        finalHOHWinner =
            competitionWinner(
                competitors,
                "mental"
            );


        currentHOH =
            finalHOHWinner;


        addEvent(
            `${finalHOHWinner.name} won Final HOH Part 3: Jury Oddcasts and became the final HOH.`
        );


        currentStage =
            "finalEviction";

    }


    updateAllDisplays();

}


/* =========================================================
   FINAL EVICTION
========================================================= */

function runFinalEviction() {

    const finalists =
        getActivePlayers();


    if (
        finalists.length !== 3 ||
        !finalHOHWinner
    ) {

        return;

    }


    const eligible =
        finalists.filter(
            p =>
                p.id !==
                finalHOHWinner.id
        );


    const target =
        weightedRandomPlayer(
            eligible,
            player =>
                player.strategy * 2 +
                player.social +
                Math.random() * 20
        );


    target.status = "Evicted";

    target.placement = 3;

    target.evictionOrder =
        evictedHouseguests.length + 1;


    evictedHouseguests.push(
        target
    );


    if (
        !jury.some(
            p =>
                p.id ===
                target.id
        )
    ) {

        jury.push(target);

    }


    finalThree =
        finalists.filter(
            p =>
                p.id !==
                target.id
        );


    addEvent(
        `${finalHOHWinner.name} evicted ${target.name}. ${target.name} finished in third place.`
    );


    currentStage = "juryVote";

    updateAllDisplays();

}


/* =========================================================
   FINAL JURY VOTE
========================================================= */

function runFinalJuryVote() {

    const finalists =
        getActivePlayers();


    if (finalists.length !== 2) {

        return;

    }


    finaleJuryVotes = {};


    let voteTotals = {};


    finalists.forEach(
        finalist => {

            voteTotals[finalist.id] = 0;

        }
    );


    jury.forEach(
        juror => {

            const choice =
                chooseFinalistVote(
                    juror,
                    finalists
                );


            finaleJuryVotes[juror.id] =
                choice.id;


            voteTotals[choice.id]++;

        }
    );


    const winner =
        finalists.sort(
            (a, b) =>
                voteTotals[b.id] -
                voteTotals[a.id]
        )[0];


    seasonWinner =
        winner;


    winner.placement = 1;


    finalists
        .filter(
            p =>
                p.id !==
                winner.id
        )
        .forEach(
            p =>
                p.placement = 2
        );


    addEvent(
        `${winner.name} won Big Brother!`
    );


    currentStage = "finished";


    updateAllDisplays();


    showFinale();

}


/* =========================================================
   FINAL VOTE AI
========================================================= */

function chooseFinalistVote(
    juror,
    finalists
) {

    const scores =
        finalists.map(
            finalist => ({

                player: finalist,

                score:

                    finalist.social * 2 +

                    finalist.strategy * 2 +

                    finalist.mental +

                    getRelationship(
                        juror.id,
                        finalist.id
                    ) +

                    Math.random() * 25

            })
        );


    scores.sort(
        (a, b) =>
            b.score - a.score
    );


    return scores[0].player;

}


/* =========================================================
   GENERIC SEASON
========================================================= */

function proceedGenericSeason() {

    if (!seasonStarted) return;


    if (!currentHOH) {

        runGenericHOH();

        return;

    }


    if (!nominees.length) {

        makeGenericNominations();

        return;

    }


    if (!povWinner) {

        runGenericPOV();

        return;

    }


    runGenericEviction();

}


function runGenericHOH() {

    const winner =
        competitionWinner(
            getActivePlayers(),
            "mixed"
        );

    currentHOH = winner;

    addEvent(
        `${winner.name} won HOH.`
    );

    updateAllDisplays();

}


function makeGenericNominations() {

    nominees =
        chooseNominees(
            getActivePlayers()
                .filter(
                    p =>
                        p.id !==
                        currentHOH.id
                ),
            2
        );

    addEvent(
        `${currentHOH.name} nominated ${nominees.map(p => p.name).join(" and ")}.`
    );

    updateAllDisplays();

}


function runGenericPOV() {

    povPlayers =
        getActivePlayers()
            .slice(
                0,
                Math.min(
                    6,
                    getActivePlayers().length
                )
            );


    povWinner =
        competitionWinner(
            povPlayers,
            "mixed"
        );


    addEvent(
        `${povWinner.name} won the Power of Veto.`
    );


    updateAllDisplays();

}


function runGenericEviction() {

    const eligible =
        getActivePlayers()
            .filter(
                p =>
                    p.id !==
                    currentHOH.id &&
                    !nominees.some(
                        n =>
                            n.id ===
                            p.id
                    )
            );


    const votes =
        nominees.map(
            nominee => ({

                nominee,

                votes:
                    eligible.filter(
                        voter =>
                            chooseEvictionVote(
                                voter
                            ).id ===
                            nominee.id
                    ).length

            })
        );


    votes.sort(
        (a, b) =>
            b.votes - a.votes
    );


    const evicted =
        votes[0].nominee;


    evicted.status =
        "Evicted";


    evictedHouseguests.push(
        evicted
    );


    addEvent(
        `${evicted.name} was evicted.`
    );


    currentHOH = null;
    nominees = [];
    povWinner = null;
    povPlayers = [];

    currentWeek++;


    updateAllDisplays();

}


/* =========================================================
   FINALE DISPLAY
========================================================= */

function showFinale() {

    const container =
        document.getElementById(
            "finaleContent"
        );


    if (!container) return;


    const active =
        getActivePlayers();


    const finalists =
        active.length
        ? active
        : houseguests.filter(
            p =>
                p.placement === 1 ||
                p.placement === 2
        );


    let juryVotesHTML = "";


    if (
        seasonWinner &&
        jury.length
    ) {

        juryVotesHTML = `

            <div class="final-stage-box">

                <h3>
                    Jury Vote
                </h3>

                <div class="final-vote-grid">

                    ${
                        jury.map(
                            juror => {

                                const voteId =
                                    finaleJuryVotes[
                                        juror.id
                                    ];

                                const votedFor =
                                    houseguests.find(
                                        p =>
                                            p.id ===
                                            voteId
                                    );


                                return `

                                    <div class="final-juror-vote">

                                        ${getPlayerImageHTML(juror)}

                                        <strong>
                                            ${escapeHTML(juror.name)}
                                        </strong>

                                        <p>
                                            Voted for
                                            <strong>
                                                ${
                                                    votedFor
                                                    ? escapeHTML(votedFor.name)
                                                    : "—"
                                                }
                                            </strong>
                                        </p>

                                    </div>

                                `;

                            }
                        ).join("")
                    }

                </div>

            </div>

        `;

    }


    container.innerHTML = `

        <div class="finale-crown">
            ★
        </div>

        <div class="eyebrow">
            BIG BROTHER
        </div>

        <h1>
            FINALE
        </h1>

        <div class="finalists">

            ${
                finalists.map(
                    finalist => `

                        <div class="finalist-card">

                            ${getPlayerImageHTML(finalist)}

                            <strong>
                                ${escapeHTML(finalist.name)}
                            </strong>

                            ${
                                finalist === seasonWinner
                                ? `<div class="player-status active">
                                    WINNER
                                   </div>`
                                : ""
                            }

                        </div>

                    `
                ).join("")
            }

        </div>

        ${
            seasonWinner
            ? `

                <div class="winner-announcement">

                    <span>
                        THE WINNER OF BIG BROTHER IS
                    </span>

                    ${getPlayerImageHTML(seasonWinner)}

                    <h2>
                        ${escapeHTML(seasonWinner.name)}
                    </h2>

                    <p>
                        Congratulations!
                    </p>

                </div>

              `
            : `

                <div class="final-stage-box">

                    <h3>
                        The Finale Has Not Been Completed
                    </h3>

                    <p>
                        Continue the game from the Game tab.
                    </p>

                </div>

              `
        }

        ${juryVotesHTML}

    `;

}


/* =========================================================
   GAME HOUSEGUESTS
========================================================= */

function renderGameHouseguests() {

    const grid =
        document.getElementById(
            "gameHouseguestGrid"
        );


    if (!grid) return;


    const active =
        getActivePlayers();


    grid.innerHTML =
        active.map(
            player => {

                const badges = [];


                if (
                    currentHOH &&
                    player.id ===
                    currentHOH.id
                ) {

                    badges.push(
                        `<span class="role-badge hoh">
                            HOH
                         </span>`
                    );

                }


                if (
                    nominees.some(
                        n =>
                            n.id ===
                            player.id
                    )
                ) {

                    badges.push(
                        `<span class="role-badge nominee">
                            NOMINEE
                         </span>`
                    );

                }


                if (
                    povPlayers.some(
                        p =>
                            p.id ===
                            player.id
                    )
                ) {

                    badges.push(
                        `<span class="role-badge pov">
                            POV
                         </span>`
                    );

                }


                if (player.safety) {

                    badges.push(
                        `<span class="role-badge safety">
                            SAFE
                         </span>`
                    );

                }


                if (
                    hackerWinner &&
                    player.id ===
                    hackerWinner.id
                ) {

                    badges.push(
                        `<span class="role-badge hacker">
                            HACKER
                         </span>`
                    );

                }


                return `

                    <div class="game-player-card">

                        <div class="game-player-photo">

                            ${getPlayerImageHTML(player)}

                        </div>

                        <strong>
                            ${escapeHTML(player.name)}
                        </strong>

                        <div>
                            ${badges.join("")}
                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================================
   STATUS DISPLAY
========================================================= */

function updateGameStatus() {

    const grid =
        document.getElementById(
            "gameStatusGrid"
        );


    if (!grid) return;


    const hoh =
        currentHOH
        ? getPlayerStatusHTML(
            currentHOH
        )
        : "—";


    const nom =
        nominees.length
        ? nominees
            .map(
                p =>
                    getPlayerStatusHTML(p)
            )
            .join("")
        : "—";


    const pov =
        povWinner
        ? getPlayerStatusHTML(
            povWinner
        )
        : "—";


    const format =
        selectedSeasonTemplate === "bb20"
        ? `BB20 — ${getCompetitionNameForDisplay()}`
        : SEASON_TEMPLATES[selectedSeasonTemplate]?.name;


    grid.innerHTML = `

        <div class="game-status-card">

            <span>
                HOH
            </span>

            <strong>
                ${hoh}
            </strong>

        </div>

        <div class="game-status-card">

            <span>
                NOMINEES
            </span>

            <strong>
                ${nom}
            </strong>

        </div>

        <div class="game-status-card">

            <span>
                POV
            </span>

            <strong>
                ${pov}
            </strong>

        </div>

        <div class="game-status-card">

            <span>
                FORMAT
            </span>

            <strong>
                ${escapeHTML(format || "Custom")}
            </strong>

        </div>

    `;

}


function getPlayerStatusHTML(player) {

    return `

        <span class="status-player">

            ${getPlayerImageHTML(player)}

            <span>
                ${escapeHTML(player.name)}
            </span>

        </span>

    `;

}


function getCompetitionNameForDisplay() {

    if (currentStage === "hoh") {

        return (
            getCurrentHOHCompetition()?.name ||
            "HOH"
        );

    }


    if (
        currentStage === "pov" ||
        currentStage === "povDraw"
    ) {

        return (
            getCurrentPOVCompetition()?.name ||
            "POV"
        );

    }


    if (currentStage === "hacker") {

        return (
            BB20.competitions[currentWeek]?.hacker ||
            "Hacker"
        );

    }


    return "Live Game";

}


/* =========================================================
   MEMORY WALL
========================================================= */

function renderMemoryWall() {

    const wall =
        document.getElementById(
            "memoryWall"
        );


    if (!wall) return;


    /*
       Always render every original Houseguest.
       This keeps the wall fixed at 16 positions.
    */

    wall.innerHTML =
        houseguests.map(
            player => {

                const active =
                    player.status === "Active";


                const returned =
                    player.returned;


                const classes =
                    active
                    ? (
                        returned
                        ? "memory-card returned-memory-card"
                        : "memory-card"
                      )
                    : "memory-card evicted-memory-card";


                return `

                    <div class="${classes}">

                        <div class="memory-photo">

                            ${getPlayerImageHTML(player)}

                            ${
                                active
                                ? ""
                                : `
                                    <div class="evicted-overlay">
                                        EVICTED
                                    </div>
                                  `
                            }

                        </div>

                        <strong>
                            ${escapeHTML(player.name)}
                        </strong>

                        <span class="
                            memory-status
                            ${active ? "" : "evicted"}
                        ">

                            ${
                                active
                                ? (
                                    returned
                                    ? "RETURNED"
                                    : "ACTIVE"
                                  )
                                : "EVICTED"
                            }

                        </span>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================================
   JURY
========================================================= */

function renderJury() {

    const list =
        document.getElementById(
            "juryList"
        );


    const evicted =
        document.getElementById(
            "evictedPlayers"
        );


    if (list) {

        list.innerHTML =
            jury.length
            ? jury.map(
                (player, index) => `

                    <div class="jury-player">

                        ${getPlayerImageHTML(player)}

                        <div>

                            <strong>
                                ${escapeHTML(player.name)}
                            </strong>

                            <span>
                                JUROR ${index + 1}
                            </span>

                        </div>

                    </div>

                `
            ).join("")
            : "<p>No jury members yet.</p>";

    }


    if (evicted) {

        evicted.innerHTML =
            evictedHouseguests.length
            ? evictedHouseguests
                .map(
                    player => `

                        <div class="jury-player">

                            ${getPlayerImageHTML(player)}

                            <div>

                                <strong>
                                    ${escapeHTML(player.name)}
                                </strong>

                                <span>
                                    ${
                                        player.returned
                                        ? "RETURNED"
                                        : "EVICTED"
                                    }
                                </span>

                            </div>

                        </div>

                    `
                ).join("")
            : "<p>No evictions yet.</p>";

    }

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const summary =
        document.getElementById(
            "seasonSummary"
        );


    if (!summary) return;


    summary.innerHTML = `

        <div>
            <span>CAST</span>
            <strong>
                ${houseguests.length}
            </strong>
        </div>

        <div>
            <span>ACTIVE</span>
            <strong>
                ${getActivePlayers().length}
            </strong>
        </div>

        <div>
            <span>EVICTED</span>
            <strong>
                ${evictedHouseguests.length}
            </strong>
        </div>

        <div>
            <span>JURY</span>
            <strong>
                ${jury.length}
            </strong>
        </div>

        <div>
            <span>WEEK</span>
            <strong>
                ${currentWeek}
            </strong>
        </div>

        <div>
            <span>STAGE</span>
            <strong>
                ${escapeHTML(currentStage)}
            </strong>
        </div>

        <div>
            <span>WINNER</span>
            <strong>
                ${
                    seasonWinner
                    ? escapeHTML(seasonWinner.name)
                    : "—"
                }
            </strong>
        </div>

    `;


    const homeSeason =
        document.getElementById(
            "homeSeasonName"
        );


    if (homeSeason) {

        homeSeason.textContent =
            SEASON_TEMPLATES[
                selectedSeasonTemplate
            ]?.name
            || "Custom Season";

    }

}


/* =========================================================
   EVENT LOG
========================================================= */

function addEvent(message) {

    events.unshift({

        message,

        time:
            new Date().toLocaleTimeString()

    });


    renderEvents();

}


function renderEvents() {

    const log =
        document.getElementById(
            "eventLog"
        );


    if (!log) return;


    log.innerHTML =
        events.map(
            event => `

                <div class="event">

                    <strong>
                        ${escapeHTML(event.time)}
                    </strong>

                    <br>

                    ${escapeHTML(event.message)}

                </div>

            `
        ).join("");

}


/* =========================================================
   SAVE
========================================================= */

function saveSeason() {

    const saveData = {

        houseguests,

        evictedHouseguests,

        jury,

        alliances,

        relationships,

        customTwists,

        currentWeek,

        cycleInWeek,

        currentHOH,

        nominees,

        povWinner,

        povPlayers,

        hackerWinner,

        hackerVoteNullified,

        hackerSelectedVetoPlayer,

        seasonStarted,

        selectedSeasonTemplate,

        currentStage,

        evictionHistory,

        voteHistory,

        appStoreRecipients,

        appStoreHistory,

        battleBackUsed,

        openingSafety,

        vetoUsed,

        finalHOHWinner,

        finalHOHPart1Winner,

        finalHOHPart2Winner,

        finalThree,

        finaleJuryVotes,

        seasonWinner,

        currentEvictionResult,

        voteRevealIndex,

        doubleEvictionActive,

        events

    };


    localStorage.setItem(
        "bigBrotherSimulatorSave",
        JSON.stringify(saveData)
    );


    alert("Season saved.");

}


/* =========================================================
   LOAD
========================================================= */

function loadSeason() {

    const raw =
        localStorage.getItem(
            "bigBrotherSimulatorSave"
        );


    if (!raw) {

        alert("No saved season found.");

        return;

    }


    try {

        const data =
            JSON.parse(raw);


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
            data.currentWeek || 0;


        cycleInWeek =
            data.cycleInWeek || 1;


        currentHOH =
            data.currentHOH || null;


        nominees =
            data.nominees || [];


        povWinner =
            data.povWinner || null;


        povPlayers =
            data.povPlayers || [];


        hackerWinner =
            data.hackerWinner || null;


        hackerVoteNullified =
            data.hackerVoteNullified || null;


        hackerSelectedVetoPlayer =
            data.hackerSelectedVetoPlayer || null;


        seasonStarted =
            data.seasonStarted || false;


        selectedSeasonTemplate =
            data.selectedSeasonTemplate ||
            "bb20";


        currentStage =
            data.currentStage ||
            "ready";


        evictionHistory =
            data.evictionHistory || [];


        voteHistory =
            data.voteHistory || [];


        appStoreRecipients =
            data.appStoreRecipients || [];


        appStoreHistory =
            data.appStoreHistory || [];


        battleBackUsed =
            data.battleBackUsed || false;


        openingSafety =
            data.openingSafety || [];


        vetoUsed =
            data.vetoUsed || false;


        finalHOHWinner =
            data.finalHOHWinner || null;


        finalHOHPart1Winner =
            data.finalHOHPart1Winner || null;


        finalHOHPart2Winner =
            data.finalHOHPart2Winner || null;


        finalThree =
            data.finalThree || [];


        finaleJuryVotes =
            data.finaleJuryVotes || {};


        seasonWinner =
            data.seasonWinner || null;


        currentEvictionResult =
            data.currentEvictionResult || null;


        voteRevealIndex =
            data.voteRevealIndex || 0;


        doubleEvictionActive =
            data.doubleEvictionActive || false;


        events =
            data.events || [];


        /*
           Migration defaults for older saves.
        */

        houseguests.forEach(
            player => {

                player.safety =
                    player.safety || false;

                player.returned =
                    player.returned || false;

                player.hackerWins =
                    player.hackerWins || 0;

                player.cloudAvailable =
                    player.cloudAvailable || false;

                player.identityTheftAvailable =
                    player.identityTheftAvailable || false;

                player.bonusLifeAvailable =
                    player.bonusLifeAvailable || false;

            }
        );


        const selector =
            document.getElementById(
                "seasonSelector"
            );


        if (selector) {

            selector.value =
                selectedSeasonTemplate;

        }


        updateAllDisplays();


        alert("Season loaded.");


    } catch (error) {

        console.error(error);

        alert(
            "The saved season could not be loaded."
        );

    }

}


/* =========================================================
   RESET
========================================================= */

function resetSeason() {

    const confirmed =
        confirm(
            "Reset the entire simulator?"
        );


    if (!confirmed) return;


    localStorage.removeItem(
        "bigBrotherSimulatorSave"
    );


    houseguests = [];
    evictedHouseguests = [];
    jury = [];

    alliances = [];
    relationships = [];
    customTwists = [];

    currentWeek = 0;
    cycleInWeek = 1;

    currentHOH = null;
    nominees = [];
    povWinner = null;
    povPlayers = [];

    hackerWinner = null;
    hackerVoteNullified = null;
    hackerSelectedVetoPlayer = null;

    seasonStarted = false;
    currentStage = "ready";

    evictionHistory = [];
    voteHistory = [];

    appStoreRecipients = [];
    appStoreHistory = [];

    battleBackUsed = false;
    openingSafety = [];

    vetoUsed = false;

    finalHOHWinner = null;
    finalHOHPart1Winner = null;
    finalHOHPart2Winner = null;

    finalThree = [];

    finaleJuryVotes = {};
    seasonWinner = null;

    currentEvictionResult = null;
    voteRevealIndex = 0;

    doubleEvictionActive = false;

    events = [];


    updateAllDisplays();

    showSection("home");

}


/* =========================================================
   COMPETITION ENGINE
========================================================= */

function competitionWinner(
    players,
    type = "mixed"
) {

    if (!players || !players.length) {
        return null;
    }


    const scores =
        players.map(
            player => {

                let score;


                if (type === "physical") {

                    score =
                        player.physical * 6 +
                        player.mental * 1 +
                        Math.random() * 30;

                }


                else if (type === "mental") {

                    score =
                        player.mental * 6 +
                        player.strategy * 2 +
                        Math.random() * 30;

                }


                else if (type === "social") {

                    score =
                        player.social * 6 +
                        player.strategy * 2 +
                        Math.random() * 30;

                }


                else {

                    score =
                        (
                            player.physical +
                            player.mental +
                            player.social +
                            player.strategy
                        ) * 2 +
                        Math.random() * 35;

                }


                return {
                    player,
                    score
                };

            }
        );


    scores.sort(
        (a, b) =>
            b.score - a.score
    );


    return scores[0].player;

}


/* =========================================================
   GENERAL COMPETITION TYPE
========================================================= */

function getCompetitionType(name) {

    const physical = [

        "Microchip Mayhem",
        "Land a Job",
        "Out on a Limb",
        "Mamma Mia! Madness",
        "Chop, Bonk, Spank",
        "Glow & Flow",
        "Zing Force",
        "Sweet Shot",
        "High in the Sky",
        "Shell or Highwater",
        "Block and Roll",
        "Down to the Wires",
        "Jetpack Attack"

    ];


    const mental = [

        "Product Launch",
        "HouseGuestsOnly.com",
        "Perfect Timing",
        "GIF That Keeps on Giving",
        "Crack The Code",
        "Hack the House",
        "OTEV the Sneezy Skunk",
        "Mission to Planet Veto",
        "Control Your Emojis",
        "BB Comics",
        "Buffering",
        "BBFlix & Chill",
        "What the Bleep",
        "Your Mazes are Numbered",
        "Mount Evictus",
        "Jury Oddcasts"

    ];


    if (
        physical.includes(name)
    ) {

        return "physical";

    }


    if (
        mental.includes(name)
    ) {

        return "mental";

    }


    return "mixed";

}


/* =========================================================
   RANDOM HELPERS
========================================================= */

function weightedRandomPlayer(
    players,
    weightFunction
) {

    if (!players || !players.length) {
        return null;
    }


    const weights =
        players.map(
            player =>
                Math.max(
                    .01,
                    Number(
                        weightFunction(player)
                    ) || .01
                )
        );


    const total =
        weights.reduce(
            (sum, value) =>
                sum + value,
            0
        );


    let random =
        Math.random() * total;


    for (
        let i = 0;
        i < players.length;
        i++
    ) {

        random -= weights[i];


        if (random <= 0) {

            return players[i];

        }

    }


    return players[
        players.length - 1
    ];

}


/* =========================================================
   ALLIANCE CHECK
========================================================= */

function areAllied(
    playerA,
    playerB
) {

    return alliances.some(
        alliance =>
            alliance.members.includes(
                playerA.id
            ) &&
            alliance.members.includes(
                playerB.id
            )
    );

}


/* =========================================================
   ACTIVE PLAYERS
========================================================= */

function getActivePlayers() {

    return houseguests.filter(
        player =>
            player.status ===
            "Active"
    );

}


/* =========================================================
   DISPLAY UPDATE
========================================================= */

function updateAllDisplays() {

    renderCast();

    renderTwists();

    updateRelationshipDropdowns();

    renderAlliances();

    renderRelationships();

    renderMemoryWall();

    renderJury();

    renderGameHouseguests();

    updateGameStatus();

    updateSummary();

    renderEvents();

    updateStageDisplay();

    updateGameHeader();

    updateFinaleIfNeeded();

}


/* =========================================================
   GAME HEADER
========================================================= */

function updateGameHeader() {

    const week =
        document.getElementById(
            "gameWeek"
        );


    const title =
        document.getElementById(
            "gameWeekTitle"
        );


    const stage =
        document.getElementById(
            "gameStageTitle"
        );


    if (week) {

        week.textContent =
            currentWeek || "—";

    }


    if (title) {

        title.textContent =
            SEASON_TEMPLATES[
                selectedSeasonTemplate
            ]?.name
            || "Big Brother Simulator";

    }


    if (stage) {

        stage.textContent =
            currentStage
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, c => c.toUpperCase());

    }

}


function updateFinaleIfNeeded() {

    if (
        currentStage === "finished" ||
        seasonWinner
    ) {

        showFinale();

    }

}


/* =========================================================
   UTILITIES
========================================================= */

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const selector =
            document.getElementById(
                "seasonSelector"
            );


        if (selector) {

            selector.value =
                "bb20";

            selectedSeasonTemplate =
                "bb20";

        }


        updateSelectedSeasonInfo();

        updateAllDisplays();

    }
);
