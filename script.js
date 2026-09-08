/* =========================================================
   BIG BROTHER SIMULATOR
   CLEAN MASTER SCRIPT
   =========================================================

   This file contains the core simulator engine.

   IMPORTANT:
   - Do not load additional script.js versions.
   - Do not load script(1).js, script(2).js, script(3).js.
   - Do not load the old BrantSteele enhancement script.
   - This file is intended to be the ONE JavaScript file loaded
     by index.html.

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

let currentWeek = 1;

let currentCycle = 1;

let currentStage = "opening1";

let currentHOH = null;

let nominees = [];

let povPlayers = [];

let povWinner = null;

let hackerWinner = null;

let vetoUsed = false;

let replacementNominee = null;

let evictionVotes = {};

let currentEvictionTarget = null;

let evictionVoteRevealIndex = 0;

let juryVotes = {};

let juryVoteRevealIndex = 0;

let finalHOH = {
    part1: null,
    part2: null,
    part3: null,
    winner: null
};

let seasonStarted = false;

let seasonFinished = false;

let selectedSeasonTemplate = "bb20";

let seasonName = "Big Brother";

let seasonFormat = "bb20";

let seasonLog = [];

let savedGames = [];

let appStoreWinner = null;

let appStorePower = null;

let hackerPower = null;

let battleBackWinner = null;

let firstEvictionCompleted = false;

let currentEvictedPlayer = null;

let pendingEvictionNominees = [];

let currentVetoHolder = null;

let vetoReplacementRequired = false;


/* =========================================================
   DOM SHORTCUT
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   SAFE TEXT HELPERS
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
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
   PLAYER DISPLAY HELPERS
   ========================================================= */

function getDisplayName(player) {

    if (!player) {
        return "Unknown";
    }

    if (player.nickname && player.nickname.trim()) {
        return player.nickname.trim();
    }

    const first =
        player.firstName ||
        player.first ||
        "";

    const last =
        player.lastName ||
        player.last ||
        "";

    const full =
        `${first} ${last}`.trim();

    return full || player.name || "Unknown";
}


function getInitials(name) {

    const words =
        String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!words.length) {
        return "?";
    }

    if (words.length === 1) {
        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


function getPlayerImageHTML(player, className = "") {

    if (!player) {
        return `
            <div class="${className} player-image-placeholder">
                ?
            </div>
        `;
    }

    const image =
        player.image ||
        player.imageUrl ||
        "";

    if (image) {

        return `
            <img
                class="${className}"
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(getDisplayName(player))}"
                loading="lazy"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
            >
            <div
                class="${className} player-image-placeholder"
                style="display:none;"
            >
                ${escapeHTML(
                    getInitials(
                        getDisplayName(player)
                    )
                )}
            </div>
        `;
    }

    return `
        <div class="${className} player-image-placeholder">
            ${escapeHTML(
                getInitials(
                    getDisplayName(player)
                )
            )}
        </div>
    `;
}


/* =========================================================
   RANDOM HELPERS
   ========================================================= */

function randomNumber(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}


function randomChoice(array) {

    if (!array || !array.length) {
        return null;
    }

    return array[
        Math.floor(
            Math.random() *
            array.length
        )
    ];
}


function shuffle(array) {

    const result =
        Array.isArray(array)
            ? [...array]
            : [];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }

    return result;
}


/* =========================================================
   NUMERIC HELPERS
   ========================================================= */

function clamp(value, min, max) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return min;
    }

    return Math.max(
        min,
        Math.min(
            max,
            number
        )
    );
}


function normalizeStat(value) {

    return clamp(
        Number(value) || 50,
        1,
        100
    );
}


/* =========================================================
   PLAYER NORMALIZATION
   ========================================================= */

function normalizeHouseguest(player) {

    if (!player) {
        return null;
    }

    if (!player.id) {

        player.id =
            "hg_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2);
    }

    player.firstName =
        player.firstName ||
        player.first ||
        "";

    player.lastName =
        player.lastName ||
        player.last ||
        "";

    player.nickname =
        player.nickname ||
        "";

    player.image =
        player.image ||
        player.imageUrl ||
        "";

    player.physical =
        normalizeStat(
            player.physical
        );

    player.mental =
        normalizeStat(
            player.mental
        );

    player.social =
        normalizeStat(
            player.social
        );

    player.strategy =
        normalizeStat(
            player.strategy
        );

    if (
        typeof player.inGame ===
        "undefined"
    ) {
        player.inGame = true;
    }

    if (
        typeof player.evicted ===
        "undefined"
    ) {
        player.evicted = false;
    }

    if (
        typeof player.juryMember ===
        "undefined"
    ) {
        player.juryMember = false;
    }

    if (
        typeof player.safety ===
        "undefined"
    ) {
        player.safety = false;
    }

    if (
        typeof player.hohWins ===
        "undefined"
    ) {
        player.hohWins = 0;
    }

    if (
        typeof player.povWins ===
        "undefined"
    ) {
        player.povWins = 0;
    }

    if (
        typeof player.vetoesWon ===
        "undefined"
    ) {
        player.vetoesWon = 0;
    }

    if (
        typeof player.nominationCount ===
        "undefined"
    ) {
        player.nominationCount = 0;
    }

    if (
        typeof player.timesNominated ===
        "undefined"
    ) {
        player.timesNominated = 0;
    }

    if (
        typeof player.evictionVotesReceived ===
        "undefined"
    ) {
        player.evictionVotesReceived = 0;
    }

    if (
        typeof player.daysPlayed ===
        "undefined"
    ) {
        player.daysPlayed = 0;
    }

    return player;
}


function normalizeAllHouseguests() {

    houseguests =
        houseguests
            .map(normalizeHouseguest)
            .filter(Boolean);

    return houseguests;
}


/* =========================================================
   ACTIVE PLAYER HELPERS
   ========================================================= */

function getActivePlayers() {

    return houseguests.filter(
        player =>
            player &&
            player.inGame !== false &&
            player.evicted !== true
    );
}


function getEligiblePlayers() {

    return getActivePlayers().filter(
        player =>
            !player.safety
    );
}


function getNonNominees() {

    return getActivePlayers().filter(
        player =>
            !nominees.some(
                nominee =>
                    nominee.id === player.id
            )
    );
}


function getVoterEligiblePlayers() {

    return getActivePlayers().filter(
        player =>
            player.id !== currentHOH &&
            !nominees.some(
                nominee =>
                    nominee.id === player.id
            )
    );
}


/* =========================================================
   PLAYER LOOKUPS
   ========================================================= */

function getPlayerById(id) {

    if (!id) {
        return null;
    }

    return houseguests.find(
        player =>
            player.id === id
    ) || null;
}


function findHouseguestByName(name) {

    if (!name) {
        return null;
    }

    const normalized =
        String(name)
            .trim()
            .toLowerCase();

    return houseguests.find(
        player =>
            getDisplayName(player)
                .toLowerCase() === normalized
    ) || null;
}


/* =========================================================
   EVENT LOG
   ========================================================= */

function addEvent(message) {

    const text =
        String(message || "")
            .trim();

    if (!text) {
        return;
    }

    seasonLog.push({
        week: currentWeek,
        cycle: currentCycle,
        stage: currentStage,
        message: text,
        timestamp:
            new Date().toISOString()
    });

    renderEventLog();
}


function clearEventLog() {

    seasonLog = [];

    renderEventLog();
}


/* =========================================================
   GAME SAVE DATA
   ========================================================= */

function getGameState() {

    return {
        houseguests,
        evictedHouseguests,
        jury,
        alliances,
        relationships,
        customTwists,

        currentWeek,
        currentCycle,
        currentStage,

        currentHOH,
        nominees,

        povPlayers,
        povWinner,

        hackerWinner,

        vetoUsed,
        replacementNominee,

        evictionVotes,
        currentEvictionTarget,
        evictionVoteRevealIndex,

        juryVotes,
        juryVoteRevealIndex,

        finalHOH,

        seasonStarted,
        seasonFinished,

        selectedSeasonTemplate,
        seasonName,
        seasonFormat,

        seasonLog,

        appStoreWinner,
        appStorePower,

        hackerPower,

        battleBackWinner,

        firstEvictionCompleted,

        currentEvictedPlayer,

        pendingEvictionNominees,

        currentVetoHolder,

        vetoReplacementRequired
    };
}


/* =========================================================
   SAVE GAME
   ========================================================= */

function saveGameSilently() {

    try {

        localStorage.setItem(
            "bbSimulatorSave",
            JSON.stringify(
                getGameState()
            )
        );

        return true;

    } catch (error) {

        console.error(
            "Unable to save game:",
            error
        );

        return false;
    }
}


function saveGame() {

    if (
        saveGameSilently()
    ) {

        addEvent(
            "Season saved."
        );

        alert(
            "Your season has been saved."
        );

    } else {

        alert(
            "The season could not be saved."
        );
    }
}


/* =========================================================
   LOAD GAME
   ========================================================= */

function loadGame() {

    try {

        const saved =
            localStorage.getItem(
                "bbSimulatorSave"
            );

        if (!saved) {

            alert(
                "No saved season was found."
            );

            return;
        }

        const state =
            JSON.parse(saved);

        restoreGameState(state);

        updateAllDisplays();

        alert(
            "Your saved season has been loaded."
        );

    } catch (error) {

        console.error(
            "Unable to load game:",
            error
        );

        alert(
            "The saved season could not be loaded."
        );
    }
}


function restoreGameState(state) {

    if (!state) {
        return;
    }

    houseguests =
        Array.isArray(
            state.houseguests
        )
            ? state.houseguests
            : [];

    evictedHouseguests =
        Array.isArray(
            state.evictedHouseguests
        )
            ? state.evictedHouseguests
            : [];

    jury =
        Array.isArray(
            state.jury
        )
            ? state.jury
            : [];

    alliances =
        Array.isArray(
            state.alliances
        )
            ? state.alliances
            : [];

    relationships =
        Array.isArray(
            state.relationships
        )
            ? state.relationships
            : [];

    customTwists =
        Array.isArray(
            state.customTwists
        )
            ? state.customTwists
            : [];

    currentWeek =
        state.currentWeek || 1;

    currentCycle =
        state.currentCycle || 1;

    currentStage =
        state.currentStage ||
        "opening1";

    currentHOH =
        state.currentHOH ||
        null;

    nominees =
        Array.isArray(
            state.nominees
        )
            ? state.nominees
            : [];

    povPlayers =
        Array.isArray(
            state.povPlayers
        )
            ? state.povPlayers
            : [];

    povWinner =
        state.povWinner ||
        null;

    hackerWinner =
        state.hackerWinner ||
        null;

    vetoUsed =
        Boolean(
            state.vetoUsed
        );

    replacementNominee =
        state.replacementNominee ||
        null;

    evictionVotes =
        state.evictionVotes ||
        {};

    currentEvictionTarget =
        state.currentEvictionTarget ||
        null;

    evictionVoteRevealIndex =
        state.evictionVoteRevealIndex ||
        0;

    juryVotes =
        state.juryVotes ||
        {};

    juryVoteRevealIndex =
        state.juryVoteRevealIndex ||
        0;

    finalHOH =
        state.finalHOH ||
        {
            part1: null,
            part2: null,
            part3: null,
            winner: null
        };

    seasonStarted =
        Boolean(
            state.seasonStarted
        );

    seasonFinished =
        Boolean(
            state.seasonFinished
        );

    selectedSeasonTemplate =
        state.selectedSeasonTemplate ||
        "bb20";

    seasonName =
        state.seasonName ||
        "Big Brother";

    seasonFormat =
        state.seasonFormat ||
        selectedSeasonTemplate;

    seasonLog =
        Array.isArray(
            state.seasonLog
        )
            ? state.seasonLog
            : [];

    appStoreWinner =
        state.appStoreWinner ||
        null;

    appStorePower =
        state.appStorePower ||
        null;

    hackerPower =
        state.hackerPower ||
        null;

    battleBackWinner =
        state.battleBackWinner ||
        null;

    firstEvictionCompleted =
        Boolean(
            state.firstEvictionCompleted
        );

    currentEvictedPlayer =
        state.currentEvictedPlayer ||
        null;

    pendingEvictionNominees =
        Array.isArray(
            state.pendingEvictionNominees
        )
            ? state.pendingEvictionNominees
            : [];

    currentVetoHolder =
        state.currentVetoHolder ||
        null;

    vetoReplacementRequired =
        Boolean(
            state.vetoReplacementRequired
        );

    normalizeAllHouseguests();
}


/* =========================================================
   RESET SEASON
   ========================================================= */

function resetSeason() {

    const confirmed =
        confirm(
            "Are you sure you want to reset the current season?"
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

    currentCycle = 1;

    currentStage = "opening1";

    currentHOH = null;

    nominees = [];

    povPlayers = [];

    povWinner = null;

    hackerWinner = null;

    vetoUsed = false;

    replacementNominee = null;

    evictionVotes = {};

    currentEvictionTarget = null;

    evictionVoteRevealIndex = 0;

    juryVotes = {};

    juryVoteRevealIndex = 0;

    finalHOH = {
        part1: null,
        part2: null,
        part3: null,
        winner: null
    };

    seasonStarted = false;

    seasonFinished = false;

    seasonLog = [];

    appStoreWinner = null;

    appStorePower = null;

    hackerPower = null;

    battleBackWinner = null;

    firstEvictionCompleted = false;

    currentEvictedPlayer = null;

    pendingEvictionNominees = [];

    currentVetoHolder = null;

    vetoReplacementRequired = false;

    localStorage.removeItem(
        "bbSimulatorSave"
    );

    showSection("home");

    updateAllDisplays();
}


/* =========================================================
   SECTION NAVIGATION
   ========================================================= */

function showSection(sectionId) {

    const sections =
        document.querySelectorAll(
            ".page-section"
        );

    sections.forEach(
        section => {

            section.classList.remove(
                "active-section"
            );

        }
    );

    const target =
        $(sectionId);

    if (target) {

        target.classList.add(
            "active-section"
        );
    }


    const navButtons =
        document.querySelectorAll(
            ".main-nav button"
        );

    navButtons.forEach(
        button => {

            button.classList.remove(
                "active"
            );

        }
    );


    const matchingButton =
        document.querySelector(
            `.main-nav button[data-section="${sectionId}"]`
        );

    if (matchingButton) {

        matchingButton.classList.add(
            "active"
        );
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   SEASON TEMPLATE HELPERS
   ========================================================= */

function getSelectedSeasonTemplate() {

    const select =
        $("seasonSelect");

    if (!select) {
        return selectedSeasonTemplate;
    }

    return (
        select.value ||
        "bb20"
    );
}


function getSeasonTemplate() {

    if (
        selectedSeasonTemplate ===
        "bb20" &&
        typeof BB20 !== "undefined"
    ) {

        return BB20;
    }

    return null;
}


/* =========================================================
   SEASON INFORMATION
   ========================================================= */

function updateSelectedSeasonInfo() {

    const info =
        $("selectedSeasonInfo");

    if (!info) {
        return;
    }

    const template =
        getSeasonTemplate();

    if (!template) {

        info.innerHTML = `
            <div class="empty-state">
                No season template selected.
            </div>
        `;

        return;
    }

    info.innerHTML = `
        <div class="season-template-card">

            <h3>
                ${escapeHTML(
                    template.name ||
                    "Big Brother"
                )}
            </h3>

            <p>
                ${escapeHTML(
                    template.description ||
                    ""
                )}
            </p>

        </div>
    `;
}


/* =========================================================
   START NEW SEASON
   ========================================================= */

function startNewSeason() {

    const templateId =
        getSelectedSeasonTemplate();

    const template =
        templateId === "bb20" &&
        typeof BB20 !== "undefined"
            ? BB20
            : null;

    if (!template) {

        alert(
            "The selected season template could not be loaded."
        );

        return;
    }

    if (
        houseguests.length < 2
    ) {

        alert(
            "Add at least two Houseguests before starting the season."
        );

        showSection("cast");

        return;
    }

    selectedSeasonTemplate =
        templateId;

    seasonFormat =
        templateId;

    seasonName =
        template.name ||
        "Big Brother";

    seasonStarted = true;

    seasonFinished = false;

    currentWeek = 1;

    currentCycle = 1;

    currentStage = "opening1";

    currentHOH = null;

    nominees = [];

    povPlayers = [];

    povWinner = null;

    hackerWinner = null;

    vetoUsed = false;

    replacementNominee = null;

    evictionVotes = {};

    currentEvictionTarget = null;

    evictionVoteRevealIndex = 0;

    juryVotes = {};

    juryVoteRevealIndex = 0;

    finalHOH = {
        part1: null,
        part2: null,
        part3: null,
        winner: null
    };

    evictedHouseguests = [];

    jury = [];

    seasonLog = [];

    currentEvictedPlayer = null;

    pendingEvictionNominees = [];

    currentVetoHolder = null;

    vetoReplacementRequired = false;

    normalizeAllHouseguests();

    houseguests.forEach(
        player => {

            player.inGame = true;

            player.evicted = false;

            player.juryMember = false;

            player.safety = false;

            player.hohWins = 0;

            player.povWins = 0;

            player.vetoesWon = 0;

            player.nominationCount = 0;

            player.timesNominated = 0;

            player.evictionVotesReceived = 0;

            player.daysPlayed = 0;

        }
    );

    addEvent(
        `Welcome to ${seasonName}!`
    );

    addEvent(
        `The season begins with ${houseguests.length} Houseguests.`
    );

    saveGameSilently();

    showSection("game");

    updateAllDisplays();
}


/* =========================================================
   CAST EDITOR
   ========================================================= */

function clearHouseguestForm() {

    if ($("editingHouseguestId")) {
        $("editingHouseguestId").value = "";
    }

    if ($("firstName")) {
        $("firstName").value = "";
    }

    if ($("lastName")) {
        $("lastName").value = "";
    }

    if ($("nickname")) {
        $("nickname").value = "";
    }

    if ($("imageUrl")) {
        $("imageUrl").value = "";
    }

    if ($("physical")) {
        $("physical").value = 50;
    }

    if ($("mental")) {
        $("mental").value = 50;
    }

    if ($("social")) {
        $("social").value = 50;
    }

    if ($("strategy")) {
        $("strategy").value = 50;
    }

    updateAllStatDisplays();
}


function updateAllStatDisplays() {

    const fields = [
        ["physical", "physicalValue"],
        ["mental", "mentalValue"],
        ["social", "socialValue"],
        ["strategy", "strategyValue"]
    ];

    fields.forEach(
        ([inputId, valueId]) => {

            const input =
                $(inputId);

            const output =
                $(valueId);

            if (
                input &&
                output
            ) {

                output.textContent =
                    input.value;

            }

        }
    );
}


function editHouseguest(id) {

    const player =
        getPlayerById(id);

    if (!player) {
        return;
    }

    if ($("editingHouseguestId")) {
        $("editingHouseguestId").value =
            player.id;
    }

    if ($("firstName")) {
        $("firstName").value =
            player.firstName || "";
    }

    if ($("lastName")) {
        $("lastName").value =
            player.lastName || "";
    }

    if ($("nickname")) {
        $("nickname").value =
            player.nickname || "";
    }

    if ($("imageUrl")) {
        $("imageUrl").value =
            player.image || "";
    }

    if ($("physical")) {
        $("physical").value =
            player.physical;
    }

    if ($("mental")) {
        $("mental").value =
            player.mental;
    }

    if ($("social")) {
        $("social").value =
            player.social;
    }

    if ($("strategy")) {
        $("strategy").value =
            player.strategy;
    }

    updateAllStatDisplays();

    const button =
        $("saveHouseguestButton");

    if (button) {
        button.textContent =
            "UPDATE HOUSEGUEST";
    }
}


function cancelEditHouseguest() {

    clearHouseguestForm();

    const button =
        $("saveHouseguestButton");

    if (button) {
        button.textContent =
            "ADD HOUSEGUEST";
    }
}


function saveHouseguest() {

    const firstName =
        $("firstName")?.value.trim() ||
        "";

    const lastName =
        $("lastName")?.value.trim() ||
        "";

    const nickname =
        $("nickname")?.value.trim() ||
        "";

    const image =
        $("imageUrl")?.value.trim() ||
        "";

    if (
        !firstName &&
        !lastName &&
        !nickname
    ) {

        alert(
            "Enter a Houseguest name."
        );

        return;
    }

    const editingId =
        $("editingHouseguestId")?.value ||
        "";

    const data = {

        firstName,

        lastName,

        nickname,

        image,

        physical:
            normalizeStat(
                $("physical")?.value
            ),

        mental:
            normalizeStat(
                $("mental")?.value
            ),

        social:
            normalizeStat(
                $("social")?.value
            ),

        strategy:
            normalizeStat(
                $("strategy")?.value
            )
    };

    if (editingId) {

        const player =
            getPlayerById(
                editingId
            );

        if (player) {

            Object.assign(
                player,
                data
            );

            addEvent(
                `${getDisplayName(player)} was updated in the cast.`
            );
        }

    } else {

        const player =
            normalizeHouseguest({
                id:
                    "hg_" +
                    Date.now() +
                    "_" +
                    Math.random()
                        .toString(36)
                        .slice(2),

                ...data,

                inGame: true,

                evicted: false,

                juryMember: false,

                safety: false
            });

        houseguests.push(
            player
        );
    }

    clearHouseguestForm();

    const button =
        $("saveHouseguestButton");

    if (button) {
        button.textContent =
            "ADD HOUSEGUEST";
    }

    renderCast();

    updateAllDisplays();
}


function deleteHouseguest(id) {

    const player =
        getPlayerById(id);

    if (!player) {
        return;
    }

    const confirmed =
        confirm(
            `Remove ${getDisplayName(player)} from the cast?`
        );

    if (!confirmed) {
        return;
    }

    houseguests =
        houseguests.filter(
            guest =>
                guest.id !== id
        );

    alliances =
        alliances.filter(
            alliance =>
                !alliance.members.includes(id)
        );

    relationships =
        relationships.filter(
            relationship =>
                relationship.from !== id &&
                relationship.to !== id
        );

    renderCast();

    updateAllDisplays();
}


/* =========================================================
   CAST RENDERING
   ========================================================= */

function renderCast() {

    const grid =
        $("castGrid");

    if (!grid) {
        return;
    }

    normalizeAllHouseguests();

    const count =
        $("castCount");

    if (count) {
        count.textContent =
            houseguests.length;
    }

    if (!houseguests.length) {

        grid.innerHTML = `
            <div class="empty-state">
                No Houseguests have been added yet.
            </div>
        `;

        return;
    }

    grid.innerHTML =
        houseguests
            .map(
                player => {

                    return `
                        <article
                            class="cast-card"
                            data-player-id="${escapeAttribute(player.id)}"
                        >

                            ${getPlayerImageHTML(
                                player,
                                "cast-photo"
                            )}

                            <div class="cast-card-content">

                                <h3>
                                    ${escapeHTML(
                                        getDisplayName(player)
                                    )}
                                </h3>

                                ${
                                    player.nickname
                                        ? `
                                            <p>
                                                <strong>Nickname:</strong>
                                                ${escapeHTML(
                                                    player.nickname
                                                )}
                                            </p>
                                        `
                                        : ""
                                }

                                <p>
                                    <strong>Physical:</strong>
                                    ${player.physical}
                                </p>

                                <div class="stat-bar">
                                    <span
                                        style="width:${player.physical}%"
                                    ></span>
                                </div>

                                <p>
                                    <strong>Mental:</strong>
                                    ${player.mental}
                                </p>

                                <div class="stat-bar">
                                    <span
                                        style="width:${player.mental}%"
                                    ></span>
                                </div>

                                <p>
                                    <strong>Social:</strong>
                                    ${player.social}
                                </p>

                                <div class="stat-bar">
                                    <span
                                        style="width:${player.social}%"
                                    ></span>
                                </div>

                                <p>
                                    <strong>Strategy:</strong>
                                    ${player.strategy}
                                </p>

                                <div class="stat-bar">
                                    <span
                                        style="width:${player.strategy}%"
                                    ></span>
                                </div>

                            </div>

                            <div class="card-actions">

                                <button
                                    type="button"
                                    onclick="editHouseguest('${escapeAttribute(player.id)}')"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onclick="deleteHouseguest('${escapeAttribute(player.id)}')"
                                >
                                    Delete
                                </button>

                            </div>

                        </article>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   RELATIONSHIP HELPERS
   ========================================================= */

function getRelationship(fromId, toId) {

    return relationships.find(
        relationship =>
            relationship.from === fromId &&
            relationship.to === toId
    ) || null;
}


function getRelationshipScore(fromId, toId) {

    const relationship =
        getRelationship(
            fromId,
            toId
        );

    if (!relationship) {
        return 50;
    }

    return clamp(
        Number(
            relationship.value ??
            relationship.score ??
            50
        ),
        0,
        100
    );
}


function setRelationship(
    fromId,
    toId,
    value,
    type = "neutral",
    note = ""
) {

    if (
        !fromId ||
        !toId ||
        fromId === toId
    ) {
        return;
    }

    let relationship =
        getRelationship(
            fromId,
            toId
        );

    if (!relationship) {

        relationship = {
            id:
                "rel_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2),

            from: fromId,

            to: toId,

            value:
                clamp(
                    Number(value) || 50,
                    0,
                    100
                ),

            type,

            note
        };

        relationships.push(
            relationship
        );

    } else {

        relationship.value =
            clamp(
                Number(value) || 50,
                0,
                100
            );

        relationship.type =
            type;

        relationship.note =
            note;
    }
}


function updateRelationshipPreviews() {

    const from =
        $("relationshipFrom")?.value ||
        "";

    const to =
        $("relationshipTo")?.value ||
        "";

    const fromPreview =
        $("relationshipFromPreview");

    const toPreview =
        $("relationshipToPreview");

    const relationship =
        getRelationship(
            from,
            to
        );

    if (fromPreview) {

        const player =
            getPlayerById(from);

        fromPreview.textContent =
            player
                ? getDisplayName(player)
                : "Select Houseguest";
    }

    if (toPreview) {

        const player =
            getPlayerById(to);

        toPreview.textContent =
            player
                ? getDisplayName(player)
                : "Select Houseguest";
    }

    if (
        relationship &&
        $("relationshipType")
    ) {

        $("relationshipType").value =
            relationship.type ||
            "neutral";
    }

    if (
        relationship &&
        $("relationshipNote")
    ) {

        $("relationshipNote").value =
            relationship.note ||
            "";
    }
}


/* =========================================================
   RELATIONSHIP DROPDOWNS
   ========================================================= */

function updateRelationshipDropdowns() {

    const from =
        $("relationshipFrom");

    const to =
        $("relationshipTo");

    if (!from && !to) {
        return;
    }

    const currentFrom =
        from?.value || "";

    const currentTo =
        to?.value || "";

    const options =
        houseguests
            .map(
                player => `
                    <option value="${escapeAttribute(player.id)}">
                        ${escapeHTML(
                            getDisplayName(player)
                        )}
                    </option>
                `
            )
            .join("");

    if (from) {

        from.innerHTML =
            `<option value="">Select Houseguest</option>` +
            options;

        from.value =
            currentFrom;
    }

    if (to) {

        to.innerHTML =
            `<option value="">Select Houseguest</option>` +
            options;

        to.value =
            currentTo;
    }

    updateRelationshipPreviews();
}


/* =========================================================
   ADD RELATIONSHIP
   ========================================================= */

function addRelationship() {

    const from =
        $("relationshipFrom")?.value ||
        "";

    const to =
        $("relationshipTo")?.value ||
        "";

    const type =
        $("relationshipType")?.value ||
        "neutral";

    const note =
        $("relationshipNote")?.value.trim() ||
        "";

    if (!from || !to) {

        alert(
            "Select both Houseguests."
        );

        return;
    }

    if (from === to) {

        alert(
            "A Houseguest cannot have a relationship with themselves."
        );

        return;
    }

    const existing =
        getRelationship(
            from,
            to
        );

    const value =
        existing
            ? existing.value
            : 50;

    setRelationship(
        from,
        to,
        value,
        type,
        note
    );

    renderRelationships();

    updateAllDisplays();
}


/* =========================================================
   RELATIONSHIP RENDERING
   ========================================================= */

function renderRelationships() {

    const list =
        $("relationshipsList");

    if (!list) {
        return;
    }

    if (!relationships.length) {

        list.innerHTML = `
            <div class="empty-state">
                No relationships have been created.
            </div>
        `;

        return;
    }

    list.innerHTML =
        relationships
            .map(
                relationship => {

                    const from =
                        getPlayerById(
                            relationship.from
                        );

                    const to =
                        getPlayerById(
                            relationship.to
                        );

                    if (
                        !from ||
                        !to
                    ) {
                        return "";
                    }

                    return `
                        <div class="relationship-item">

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(from)
                                )}
                                →
                                ${escapeHTML(
                                    getDisplayName(to)
                                )}
                            </strong>

                            <div>
                                Type:
                                ${escapeHTML(
                                    relationship.type ||
                                    "neutral"
                                )}
                            </div>

                            <div>
                                Score:
                                ${clamp(
                                    relationship.value,
                                    0,
                                    100
                                )}
                            </div>

                            ${
                                relationship.note
                                    ? `
                                        <div>
                                            ${escapeHTML(
                                                relationship.note
                                            )}
                                        </div>
                                    `
                                    : ""
                            }

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   ALLIANCE HELPERS
   ========================================================= */

function getAllianceById(id) {

    return alliances.find(
        alliance =>
            alliance.id === id
    ) || null;
}


function getPlayerAlliances(playerId) {

    return alliances.filter(
        alliance =>
            Array.isArray(
                alliance.members
            ) &&
            alliance.members.includes(
                playerId
            )
    );
}


function areAllied(
    playerA,
    playerB
) {

    if (
        !playerA ||
        !playerB
    ) {
        return false;
    }

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
   ALLIANCE DROPDOWN
   ========================================================= */

function updateAllianceDropdown() {

    const select =
        $("allianceMembers");

    if (!select) {
        return;
    }

    const selected =
        Array.from(
            select.selectedOptions || []
        ).map(
            option =>
                option.value
        );

    select.innerHTML =
        houseguests
            .map(
                player => `
                    <option
                        value="${escapeAttribute(player.id)}"
                    >
                        ${escapeHTML(
                            getDisplayName(player)
                        )}
                    </option>
                `
            )
            .join("");

    selected.forEach(
        id => {

            const option =
                Array.from(
                    select.options
                ).find(
                    option =>
                        option.value === id
                );

            if (option) {
                option.selected = true;
            }
        }
    );
}


/* =========================================================
   CREATE ALLIANCE
   ========================================================= */

function createAlliance() {

    const name =
        $("allianceName")?.value.trim() ||
        "";

    const select =
        $("allianceMembers");

    const members =
        select
            ? Array.from(
                select.selectedOptions
            ).map(
                option =>
                    option.value
            )
            : [];

    const strength =
        $("allianceStrength")?.value ||
        "moderate";

    if (!name) {

        alert(
            "Enter an alliance name."
        );

        return;
    }

    if (
        members.length < 2
    ) {

        alert(
            "Select at least two Houseguests."
        );

        return;
    }

    alliances.push({

        id:
            "alliance_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2),

        name,

        members,

        strength
    });

    if ($("allianceName")) {
        $("allianceName").value = "";
    }

    if ($("allianceStrength")) {
        $("allianceStrength").value =
            "moderate";
    }

    if (select) {

        Array.from(
            select.options
        ).forEach(
            option => {
                option.selected = false;
            }
        );
    }

    renderAlliances();

    addEvent(
        `Alliance created: ${name}.`
    );

    saveGameSilently();

    updateAllDisplays();
}


/* =========================================================
   ALLIANCE RENDERING
   ========================================================= */

function renderAlliances() {

    const list =
        $("allianceList");

    if (!list) {
        return;
    }

    if (!alliances.length) {

        list.innerHTML = `
            <div class="empty-state">
                No alliances have been created.
            </div>
        `;

        return;
    }

    list.innerHTML =
        alliances
            .map(
                alliance => {

                    const members =
                        alliance.members
                            .map(
                                id =>
                                    getPlayerById(id)
                            )
                            .filter(Boolean);

                    return `
                        <div class="alliance-item">

                            <h3>
                                ${escapeHTML(
                                    alliance.name
                                )}
                            </h3>

                            <p>
                                <strong>Strength:</strong>
                                ${escapeHTML(
                                    alliance.strength ||
                                    "moderate"
                                )}
                            </p>

                            <p>
                                <strong>Members:</strong>
                            </p>

                            <ul>
                                ${
                                    members
                                        .map(
                                            member =>
                                                `<li>
                                                    ${escapeHTML(
                                                        getDisplayName(member)
                                                    )}
                                                </li>`
                                        )
                                        .join("")
                                }
                            </ul>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   TWISTS
   ========================================================= */

function addTwist() {

    const name =
        $("twistName")?.value.trim() ||
        "";

    const description =
        $("twistDescription")?.value.trim() ||
        "";

    if (!name) {

        alert(
            "Enter a twist name."
        );

        return;
    }

    customTwists.push({

        id:
            "twist_" +
            Date.now(),

        name,

        description,

        active: true
    });

    if ($("twistName")) {
        $("twistName").value = "";
    }

    if ($("twistDescription")) {
        $("twistDescription").value = "";
    }

    renderTwists();

    updateAllDisplays();
}


function renderTwists() {

    const list =
        $("twistList");

    if (!list) {
        return;
    }

    if (!customTwists.length) {

        list.innerHTML = `
            <div class="empty-state">
                No custom twists have been added.
            </div>
        `;

    } else {

        list.innerHTML =
            customTwists
                .map(
                    twist => `
                        <div class="twist-item">

                            <h3>
                                ${escapeHTML(
                                    twist.name
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    twist.description ||
                                    ""
                                )}
                            </p>

                        </div>
                    `
                )
                .join("");
    }

    renderBuiltInTwists();
}


/* =========================================================
   BUILT-IN TWIST STATUS
   ========================================================= */

function renderBuiltInTwists() {

    const panel =
        $("bbTwistStatusPanel");

    if (!panel) {
        return;
    }

    const template =
        getSeasonTemplate();

    if (
        !template ||
        !template.twists
    ) {

        panel.innerHTML = `
            <h2>Active Season Twists</h2>
            <p>
                No built-in twists are active
                for this format.
            </p>
        `;

        return;
    }

    const twists =
        template.twists;

    const week =
        currentWeek || 1;

    const appActive =
        twists.appStore &&
        Array.isArray(
            twists.appStore.activeWeeks
        ) &&
        twists.appStore.activeWeeks.includes(
            week
        );

    const hackerActive =
        twists.hacker &&
        Array.isArray(
            twists.hacker.activeWeeks
        ) &&
        twists.hacker.activeWeeks.includes(
            week
        );

    const battleBackActive =
        week >= 10 &&
        Boolean(
            twists.juryBattleBack
        );

    panel.innerHTML = `

        <h2>
            Active Season Twists
        </h2>

        <div class="bb-active-twist-grid">

            <div
                class="bb-active-twist ${
                    appActive
                        ? "active"
                        : ""
                }"
            >
                <strong>
                    App Store
                </strong>

                <span>
                    ${
                        appActive
                            ? "ACTIVE THIS WEEK"
                            : "Not active this week"
                    }
                </span>
            </div>

            <div
                class="bb-active-twist ${
                    hackerActive
                        ? "active"
                        : ""
                }"
            >
                <strong>
                    Hacker Competition
                </strong>

                <span>
                    ${
                        hackerActive
                            ? "ACTIVE THIS WEEK"
                            : "Not active this week"
                    }
                </span>
            </div>

            <div
                class="bb-active-twist ${
                    battleBackActive
                        ? "active"
                        : ""
                }"
            >
                <strong>
                    Jury Battle Back
                </strong>

                <span>
                    ${
                        battleBackActive
                            ? "SCHEDULED"
                            : "Not active this week"
                    }
                </span>
            </div>

        </div>
    `;
}


/* =========================================================
   WEEK / CYCLE HELPERS
   ========================================================= */

function getWeekData() {

    const template =
        getSeasonTemplate();

    if (
        !template ||
        !template.competitions
    ) {
        return null;
    }

    return (
        template.competitions[
            currentWeek
        ] ||
        null
    );
}


function isDoubleEvictionWeek() {

    const data =
        getWeekData();

    if (!data) {
        return false;
    }

    return Boolean(
        data.doubleEviction
    );
}


/* =========================================================
   COMPETITION WEIGHTING
   ========================================================= */

function getCompetitionScore(
    player,
    type
) {

    if (!player) {
        return 0;
    }

    let base = 50;

    if (type === "physical") {

        base =
            player.physical;

    } else if (type === "mental") {

        base =
            player.mental;

    } else if (type === "social") {

        base =
            player.social;

    } else if (type === "strategy") {

        base =
            player.strategy;

    } else {

        base =
            (
                player.physical +
                player.mental +
                player.social +
                player.strategy
            ) / 4;
    }

    return (
        Number(base) +
        randomNumber(
            -20,
            20
        )
    );
}


/* =========================================================
   GENERIC COMPETITION WINNER
   ========================================================= */

function determineCompetitionWinner(
    players,
    type = "mixed"
) {

    if (
        !players ||
        !players.length
    ) {
        return null;
    }

    const scored =
        players.map(
            player => ({

                player,

                score:
                    getCompetitionScore(
                        player,
                        type
                    )

            })
        );

    scored.sort(
        (
            a,
            b
        ) =>
            b.score -
            a.score
    );

    return (
        scored[0]?.player ||
        null
    );
}


/* =========================================================
   HOH COMPETITION
   ========================================================= */

function runHOH() {

    const players =
        getEligiblePlayers();

    if (
        players.length < 2
    ) {

        addEvent(
            "There are not enough eligible Houseguests for an HOH competition."
        );

        setStage(
            "nominations"
        );

        return;
    }

    const data =
        getWeekData();

    let type =
        "mixed";

    if (
        data &&
        data.hohType
    ) {
        type =
            data.hohType;
    }

    const winner =
        determineCompetitionWinner(
            players,
            type
        );

    if (!winner) {
        return;
    }

    currentHOH =
        winner.id;

    winner.hohWins =
        (winner.hohWins || 0) + 1;

    winner.safety = true;

    addEvent(
        `${getDisplayName(winner)} wins Head of Household.`
    );

    setStage(
        "appstore"
    );
}


/* =========================================================
   APP STORE
   ========================================================= */

function runAppStore() {

    const template =
        getSeasonTemplate();

    const twists =
        template?.twists;

    if (
        !twists ||
        !twists.appStore
    ) {

        setStage(
            "nominations"
        );

        return;
    }

    const week =
        currentWeek;

    if (
        !twists.appStore.activeWeeks ||
        !twists.appStore.activeWeeks.includes(
            week
        )
    ) {

        setStage(
            "nominations"
        );

        return;
    }

    const players =
        getActivePlayers();

    if (!players.length) {
        return;
    }

    const winner =
        randomChoice(
            players
        );

    appStoreWinner =
        winner.id;

    appStorePower =
        randomChoice(
            twists.appStore.powers ||
            [
                "Power Vote",
                "Nomination Protection",
                "Veto Upgrade"
            ]
        );

    addEvent(
        `${getDisplayName(winner)} receives the BB App Store power: ${appStorePower}.`
    );

    setStage(
        "nominations"
    );
}


/* =========================================================
   NOMINATIONS
   ========================================================= */

function makeNominations() {

    const hoh =
        getPlayerById(
            currentHOH
        );

    if (!hoh) {

        addEvent(
            "No valid HOH was found."
        );

        return;
    }

    const candidates =
        getActivePlayers()
            .filter(
                player =>
                    player.id !==
                    currentHOH
            );

    if (
        candidates.length < 2
    ) {

        addEvent(
            "There are not enough Houseguests to make two nominations."
        );

        return;
    }

    const scored =
        candidates.map(
            player => {

                let targetScore = 0;

                const relationship =
                    getRelationshipScore(
                        currentHOH,
                        player.id
                    );

                targetScore +=
                    (
                        100 -
                        relationship
                    );

                if (
                    areAllied(
                        hoh,
                        player
                    )
                ) {
                    targetScore -= 45;
                }

                targetScore +=
                    (
                        50 -
                        player.social
                    ) * 0.2;

                targetScore +=
                    randomNumber(
                        0,
                        35
                    );

                return {
                    player,
                    score:
                        targetScore
                };
            }
        );

    scored.sort(
        (
            a,
            b
        ) =>
            b.score -
            a.score
    );

    nominees = [
        scored[0].player,
        scored[1].player
    ];

    nominees.forEach(
        nominee => {

            nominee.nominationCount =
                (nominee.nominationCount || 0) +
                1;

            nominee.timesNominated =
                (nominee.timesNominated || 0) +
                1;

        }
    );

    addEvent(
        `${getDisplayName(hoh)} nominates ${getDisplayName(nominees[0])} and ${getDisplayName(nominees[1])}.`
    );

    setStage(
        "hacker"
    );
}


/* =========================================================
   HACKER COMPETITION
   ========================================================= */

function runHackerCompetition() {

    const template =
        getSeasonTemplate();

    const twists =
        template?.twists;

    if (
        !twists ||
        !twists.hacker
    ) {

        setStage(
            "povDraw"
        );

        return;
    }

    const activeWeeks =
        twists.hacker.activeWeeks ||
        [];

    if (
        !activeWeeks.includes(
            currentWeek
        )
    ) {

        setStage(
            "povDraw"
        );

        return;
    }

    const players =
        getActivePlayers();

    const winner =
        determineCompetitionWinner(
            players,
            "mental"
        );

    hackerWinner =
        winner
            ? winner.id
            : null;

    if (winner) {

        addEvent(
            `${getDisplayName(winner)} wins the Hacker Competition.`
        );

        hackerPower =
            twists.hacker.power ||
            "Hacker Power";
    }

    setStage(
        "povDraw"
    );
}


/* =========================================================
   POV PLAYER DRAW
   ========================================================= */

function drawPOVPlayers() {

    const active =
        getActivePlayers();

    const selected = [];

    const addUnique =
        player => {

            if (
                player &&
                !selected.some(
                    p =>
                        p.id ===
                        player.id
                )
            ) {
                selected.push(
                    player
                );
            }
        };


    const hoh =
        getPlayerById(
            currentHOH
        );

    addUnique(hoh);

    nominees.forEach(
        nominee =>
            addUnique(
                nominee
            )
    );


    const remaining =
        shuffle(
            active.filter(
                player =>
                    !selected.some(
                        p =>
                            p.id ===
                            player.id
                    )
            )
        );


    while (
        selected.length < 6 &&
        remaining.length
    ) {

        addUnique(
            remaining.shift()
        );
    }


    povPlayers =
        selected.slice(
            0,
            Math.min(
                6,
                active.length
            )
        );


    addEvent(
        `POV players selected: ${povPlayers.map(getDisplayName).join(", ")}.`
    );

    setStage(
        "pov"
    );
}


/* =========================================================
   POWER OF VETO
   ========================================================= */

function runPOV() {

    const players =
        povPlayers.length
            ? povPlayers
            : getActivePlayers();

    const data =
        getWeekData();

    let type =
        "mixed";

    if (
        data &&
        data.povType
    ) {
        type =
            data.povType;
    }

    const winner =
        determineCompetitionWinner(
            players,
            type
        );

    if (!winner) {
        return;
    }

    povWinner =
        winner.id;

    winner.povWins =
        (winner.povWins || 0) + 1;

    winner.vetoesWon =
        (winner.vetoesWon || 0) + 1;

    currentVetoHolder =
        winner.id;

    addEvent(
        `${getDisplayName(winner)} wins the Power of Veto.`
    );

    setStage(
        "veto"
    );
}


/* =========================================================
   VETO CEREMONY
   ========================================================= */

function usePOV() {

    const winner =
        getPlayerById(
            povWinner
        );

    if (!winner) {

        setStage(
            "evictionVoting"
        );

        return;
    }

    const nomineeObjects =
        nominees
            .map(
                nominee =>
                    getPlayerById(
                        nominee.id
                    )
            )
            .filter(Boolean);

    const canUse =
        nomineeObjects.length >
        0;

    if (!canUse) {

        setStage(
            "evictionVoting"
        );

        return;
    }

    let useVeto = false;

    if (
        nomineeObjects.some(
            nominee =>
                getRelationshipScore(
                    winner.id,
                    nominee.id
                ) >= 60
        )
    ) {

        useVeto =
            Math.random() <
            0.45;

    } else {

        useVeto =
            Math.random() <
            0.18;
    }


    /*
       If the Veto holder is a nominee,
       they will always use the veto.
    */

    if (
        nomineeObjects.some(
            nominee =>
                nominee.id ===
                winner.id
        )
    ) {

        useVeto = true;
    }


    if (!useVeto) {

        vetoUsed = false;

        addEvent(
            `${getDisplayName(winner)} does not use the Power of Veto.`
        );

        setStage(
            "evictionVoting"
        );

        return;
    }


    const saveTarget =
        nomineeObjects
            .filter(
                nominee =>
                    nominee.id !==
                    winner.id
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    getRelationshipScore(
                        winner.id,
                        b.id
                    ) -
                    getRelationshipScore(
                        winner.id,
                        a.id
                    )
            )[0];


    if (!saveTarget) {

        setStage(
            "evictionVoting"
        );

        return;
    }


    vetoUsed = true;

    const savedId =
        saveTarget.id;

    nominees =
        nominees.filter(
            nominee =>
                nominee.id !==
                savedId
        );


    const candidates =
        getActivePlayers()
            .filter(
                player =>
                    player.id !==
                    currentHOH &&
                    player.id !==
                    savedId &&
                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )
            );


    const replacement =
        candidates
            .sort(
                (
                    a,
                    b
                ) =>
                    getRelationshipScore(
                        currentHOH,
                        a.id
                    ) -
                    getRelationshipScore(
                        currentHOH,
                        b.id
                    )
            )[0];


    if (replacement) {

        replacementNominee =
            replacement.id;

        replacement.nominationCount =
            (replacement.nominationCount || 0) +
            1;

        replacement.timesNominated =
            (replacement.timesNominated || 0) +
            1;

        nominees.push(
            replacement
        );

        addEvent(
            `${getDisplayName(winner)} uses the Power of Veto on ${getDisplayName(saveTarget)}.`
        );

        addEvent(
            `${getDisplayName(replacement)} is named as the replacement nominee.`
        );

    } else {

        addEvent(
            `${getDisplayName(winner)} uses the Power of Veto, but no replacement nominee is available.`
        );
    }


    setStage(
        "evictionVoting"
    );
}


/* =========================================================
   EVICTION VOTING
   ========================================================= */

function prepareEvictionVotes() {

    evictionVotes = {};

    evictionVoteRevealIndex = 0;

    currentEvictionTarget = null;

    const voters =
        getVoterEligiblePlayers();

    if (
        nominees.length < 2
    ) {

        addEvent(
            "There are not enough nominees for an eviction."
        );

        return;
    }


    const nomineeA =
        nominees[0];

    const nomineeB =
        nominees[1];


    voters.forEach(
        voter => {

            const scoreA =
                calculateEvictionTargetScore(
                    voter,
                    nomineeA
                );

            const scoreB =
                calculateEvictionTargetScore(
                    voter,
                    nomineeB
                );

            let target =
                scoreA >= scoreB
                    ? nomineeA
                    : nomineeB;


            /*
               Add a little randomness so
               votes do not become completely
               deterministic.
            */

            if (
                Math.random() <
                0.12
            ) {

                target =
                    target.id ===
                    nomineeA.id
                        ? nomineeB
                        : nomineeA;
            }


            evictionVotes[
                voter.id
            ] =
                target.id;
        }
    );


    const counts = {};

    Object.values(
        evictionVotes
    ).forEach(
        id => {

            counts[id] =
                (counts[id] || 0) + 1;
        }
    );


    const aVotes =
        counts[nomineeA.id] || 0;

    const bVotes =
        counts[nomineeB.id] || 0;


    if (
        aVotes === bVotes
    ) {

        const hoh =
            getPlayerById(
                currentHOH
            );

        if (hoh) {

            /*
               In a tie, the HOH breaks the tie.
            */

            const preferred =
                calculateEvictionTargetScore(
                    hoh,
                    nomineeA
                ) >=
                calculateEvictionTargetScore(
                    hoh,
                    nomineeB
                )
                    ? nomineeA
                    : nomineeB;

            currentEvictionTarget =
                preferred.id;

            addEvent(
                `The eviction vote is tied ${aVotes}-${bVotes}. The HOH breaks the tie.`
            );

        } else {

            currentEvictionTarget =
                nomineeA.id;
        }

    } else {

        currentEvictionTarget =
            aVotes >
            bVotes
                ? nomineeA.id
                : nomineeB.id;
    }


    setStage(
        "eviction"
    );
}


/* =========================================================
   EVICTION TARGET SCORE
   ========================================================= */

function calculateEvictionTargetScore(
    voter,
    nominee
) {

    if (
        !voter ||
        !nominee
    ) {
        return 50;
    }

    let score = 50;


    const relationship =
        getRelationshipScore(
            voter.id,
            nominee.id
        );


    /*
       Higher relationship = less
       likely to vote against them.
    */

    score +=
        (
            50 -
            relationship
        ) * 0.9;


    /*
       Stronger strategic threats are
       more likely to be targeted.
    */

    score +=
        nominee.strategy *
        0.20;


    /*
       Strong physical players can become
       bigger targets later in the game.
    */

    score +=
        nominee.physical *
        0.08;


    /*
       Social players can also become
       threats depending on the stage.
    */

    score +=
        nominee.social *
        0.05;


    /*
       Alliances protect players.
    */

    if (
        areAllied(
            voter,
            nominee
        )
    ) {

        score -= 40;
    }


    return (
        score +
        randomNumber(
            -12,
            12
        )
    );
}


/* =========================================================
   REVEAL EVICTION VOTE
   ========================================================= */

function revealNextEvictionVote() {

    const voters =
        getVoterEligiblePlayers();

    if (
        evictionVoteRevealIndex <
        voters.length
    ) {

        const voter =
            voters[
                evictionVoteRevealIndex
            ];

        const targetId =
            evictionVotes[
                voter.id
            ];

        const target =
            getPlayerById(
                targetId
            );

        if (
            voter &&
            target
        ) {

            target.evictionVotesReceived =
                (
                    target.evictionVotesReceived ||
                    0
                ) + 1;

            addEvent(
                `${getDisplayName(voter)} votes to evict ${getDisplayName(target)}.`
            );
        }

        evictionVoteRevealIndex++;

        updateGameDisplay();

        return;
    }


    completeEviction();
}


/* =========================================================
   COMPLETE EVICTION
   ========================================================= */

function completeEviction() {

    const evicted =
        getPlayerById(
            currentEvictionTarget
        );

    if (!evicted) {

        addEvent(
            "No eviction target was determined."
        );

        setStage(
            "nextcycle"
        );

        return;
    }


    evicted.inGame = false;

    evicted.evicted = true;

    currentEvictedPlayer =
        evicted.id;


    evictedHouseguests.push(
        evicted
    );


    const activeCount =
        getActivePlayers().length;


    /*
       Jury begins once the game reaches
       the configured jury threshold.

       BB20 uses a nine-person jury.
    */

    const template =
        getSeasonTemplate();

    const juryStart =
        Number(
            template?.juryStart ||
            9
        );


    if (
        activeCount <=
        juryStart &&
        !evicted.juryMember
    ) {

        evicted.juryMember =
            true;

        jury.push(
            evicted
        );

        addEvent(
            `${getDisplayName(evicted)} joins the jury.`
        );
    }


    addEvent(
        `${getDisplayName(evicted)} has been evicted from the Big Brother house.`
    );


    if (
        getActivePlayers().length <= 3
    ) {

        setStage(
            "finalHOH1"
        );

        return;
    }


    firstEvictionCompleted = true;

    setStage(
        "battleback"
    );
}


/* =========================================================
   BATTLE BACK
   ========================================================= */

function runBattleBack() {

    const template =
        getSeasonTemplate();

    const twists =
        template?.twists;

    const active =
        Boolean(
            twists?.juryBattleBack
        ) &&
        currentWeek >= 10;


    if (!active) {

        setStage(
            "nextcycle"
        );

        return;
    }


    const eligible =
        evictedHouseguests.filter(
            player =>
                !jury.some(
                    juror =>
                        juror.id ===
                        player.id
                )
        );


    if (
        eligible.length <
        2
    ) {

        setStage(
            "nextcycle"
        );

        return;
    }


    const winner =
        determineCompetitionWinner(
            eligible,
            "mixed"
        );


    if (!winner) {

        setStage(
            "nextcycle"
        );

        return;
    }


    winner.inGame = true;

    winner.evicted = false;

    battleBackWinner =
        winner.id;


    evictedHouseguests =
        evictedHouseguests.filter(
            player =>
                player.id !==
                winner.id
        );


    jury =
        jury.filter(
            player =>
                player.id !==
                winner.id
        );


    winner.juryMember =
        false;


    addEvent(
        `${getDisplayName(winner)} wins the Battle Back and returns to the game!`
    );


    setStage(
        "nextcycle"
    );
}


/* =========================================================
   NEXT CYCLE
   ========================================================= */

function beginNextCycleOrWeek() {

    currentCycle++;


    if (
        isDoubleEvictionWeek() &&
        currentCycle <= 2
    ) {

        currentStage =
            "hoh";

        currentHOH = null;

        nominees = [];

        povPlayers = [];

        povWinner = null;

        hackerWinner = null;

        vetoUsed = false;

        replacementNominee = null;

        evictionVotes = {};

        currentEvictionTarget = null;

        evictionVoteRevealIndex = 0;


        getActivePlayers().forEach(
            player => {
                player.safety = false;
            }
        );


        addEvent(
            `The second cycle of Week ${currentWeek} begins.`
        );


        updateAllDisplays();

        return;
    }


    currentWeek++;

    currentCycle = 1;


    getActivePlayers().forEach(
        player => {

            player.safety = false;

            player.daysPlayed =
                (
                    player.daysPlayed ||
                    0
                ) + 7;
        }
    );


    currentHOH = null;

    nominees = [];

    povPlayers = [];

    povWinner = null;

    hackerWinner = null;

    vetoUsed = false;

    replacementNominee = null;

    evictionVotes = {};

    currentEvictionTarget = null;

    evictionVoteRevealIndex = 0;


    if (
        getActivePlayers().length <=
        3
    ) {

        setStage(
            "finalHOH1"
        );

        return;
    }


    setStage(
        "hoh"
    );
}


/* =========================================================
   FINAL HOH PART 1
   ========================================================= */

function runFinalHOHPart(
    part
) {

    const finalists =
        getActivePlayers();


    if (
        finalists.length <= 1
    ) {

        setStage(
            "finished"
        );

        return;
    }


    const winner =
        determineCompetitionWinner(
            finalists,
            part === 1
                ? "physical"
                : part === 2
                    ? "mental"
                    : "strategy"
        );


    if (!winner) {
        return;
    }


    finalHOH[
        `part${part}`
    ] =
        winner.id;


    addEvent(
        `${getDisplayName(winner)} wins Final HOH Part ${part}.`
    );


    if (part === 1) {

        setStage(
            "finalHOH2"
        );

    } else if (part === 2) {

        setStage(
            "finalHOH3"
        );

    } else {

        finalHOH.winner =
            winner.id;

        setStage(
            "finalEviction"
        );
    }
}


/* =========================================================
   FINAL EVICTION
   ========================================================= */

function runFinalEviction() {

    const finalists =
        getActivePlayers();


    if (
        finalists.length <= 2
    ) {

        setStage(
            "juryVote"
        );

        return;
    }


    const winner =
        getPlayerById(
            finalHOH.winner
        );


    const candidates =
        finalists.filter(
            player =>
                player.id !==
                winner?.id
        );


    const evicted =
        candidates[
            0
        ];


    if (evicted) {

        evicted.inGame =
            false;

        evicted.evicted =
            true;

        evictedHouseguests.push(
            evicted
        );


        addEvent(
            `${getDisplayName(evicted)} is the final evicted Houseguest.`
        );
    }


    setStage(
        "juryVote"
    );
}


/* =========================================================
   JURY VOTE PREPARATION
   ========================================================= */

function prepareJuryVotes() {

    juryVotes = {};

    juryVoteRevealIndex = 0;

    const finalists =
        getActivePlayers();


    if (
        finalists.length <
        2
    ) {
        return;
    }


    const first =
        finalists[0];

    const second =
        finalists[1];

    const third =
        finalists[2] ||
        null;


    jury.forEach(
        juror => {

            const scores = [
                {
                    player: first,
                    score:
                        calculateJuryScore(
                            juror,
                            first
                        )
                },
                {
                    player: second,
                    score:
                        calculateJuryScore(
                            juror,
                            second
                        )
                }
            ];


            if (third) {

                scores.push({
                    player: third,
                    score:
                        calculateJuryScore(
                            juror,
                            third
                        )
                });
            }


            scores.sort(
                (
                    a,
                    b
                ) =>
                    b.score -
                    a.score
            );


            juryVotes[
                juror.id
            ] =
                scores[0]
                    .player
                    .id;
        }
    );


    setStage(
        "juryVote"
    );
}


/* =========================================================
   JURY SCORE
   ========================================================= */

function calculateJuryScore(
    juror,
    finalist
) {

    if (
        !juror ||
        !finalist
    ) {
        return 0;
    }


    let score = 50;


    score +=
        getRelationshipScore(
            juror.id,
            finalist.id
        ) * 0.35;


    score +=
        finalist.strategy *
        0.20;


    score +=
        finalist.social *
        0.20;


    score +=
        finalist.hohWins *
        4;


    score +=
        finalist.povWins *
        3;


    score +=
        randomNumber(
            -10,
            10
        );


    return score;
}


/* =========================================================
   REVEAL JURY VOTE
   ========================================================= */

function revealNextJuryVote() {

    if (
        !jury.length
    ) {

        showFinale();

        return;
    }


    if (
        juryVoteRevealIndex <
        jury.length
    ) {

        const juror =
            jury[
                juryVoteRevealIndex
            ];

        const voteId =
            juryVotes[
                juror.id
            ];


        const finalist =
            getPlayerById(
                voteId
            );


        if (finalist) {

            addEvent(
                `${getDisplayName(juror)} votes for ${getDisplayName(finalist)} to win.`
            );
        }


        juryVoteRevealIndex++;

        updateGameDisplay();

        return;
    }


    showFinale();
}


/* =========================================================
   FINALE
   ========================================================= */

function showFinale() {

    seasonFinished =
        true;

    seasonStarted =
        true;

    currentStage =
        "finished";


    const finalists =
        getActivePlayers();


    const voteCounts = {};


    Object.values(
        juryVotes
    ).forEach(
        finalistId => {

            voteCounts[
                finalistId
            ] =
                (
                    voteCounts[
                        finalistId
                    ] || 0
                ) + 1;
        }
    );


    let winner =
        finalists
            .slice()
            .sort(
                (
                    a,
                    b
                ) =>
                    (
                        voteCounts[b.id] || 0
                    ) -
                    (
                        voteCounts[a.id] || 0
                    )
            )[0] ||
        null;


    if (
        !winner &&
        finalists.length
    ) {
        winner =
            finalists[0];
    }


    if (winner) {

        addEvent(
            `${getDisplayName(winner)} wins the season!`
        );
    }


    finalHOH.winner =
        finalHOH.winner ||
        winner?.id ||
        null;


    renderFinale();

    updateAllDisplays();

    showSection(
        "finale"
    );


    saveGameSilently();
}


/* =========================================================
   SET STAGE
   ========================================================= */

function setStage(stage) {

    currentStage =
        stage;


    updateStageDisplay();

    updateGameDisplay();
}


/* =========================================================
   STAGE DISPLAY
   ========================================================= */

function updateStageDisplay() {

    const stageName =
        $("stageName");

    const stageTitle =
        $("stageTitle");

    const stageDescription =
        $("stageDescription");

    const stageIcon =
        $("stageIcon");


    const stages = {

        opening1: {
            name:
                "OPENING COMPETITION",

            title:
                "The Trash Folder",

            description:
                "Opening safety competition - Part 1.",

            icon:
                "★"
        },

        opening2: {
            name:
                "OPENING COMPETITION",

            title:
                "HouseGuest CAPTCHA",

            description:
                "Opening safety competition - Part 2.",

            icon:
                "★"
        },

        opening3: {
            name:
                "OPENING COMPETITION",

            title:
                "Surfing the BB Web",

            description:
                "Opening safety competition - Part 3.",

            icon:
                "★"
        },

        hoh: {
            name:
                "HEAD OF HOUSEHOLD",

            title:
                "HOH Competition",

            description:
                "Compete for the power to nominate two Houseguests.",

            icon:
                "♛"
        },

        appstore: {
            name:
                "BB APP STORE",

            title:
                "App Store",

            description:
                "Special powers are assigned for the week.",

            icon:
                "◆"
        },

        nominations: {
            name:
                "NOMINATION CEREMONY",

            title:
                "Nomination Ceremony",

            description:
                "The Head of Household nominates two Houseguests.",

            icon:
                "!"
        },

        hacker: {
            name:
                "HACKER COMPETITION",

            title:
                "Hacker Competition",

            description:
                "The Hacker competes for special powers.",

            icon:
                "⌘"
        },

        povDraw: {
            name:
                "POWER OF VETO",

            title:
                "Veto Player Selection",

            description:
                "Players are selected to compete for the Power of Veto.",

            icon:
                "◆"
        },

        pov: {
            name:
                "POWER OF VETO",

            title:
                "Power of Veto Competition",

            description:
                "Houseguests compete for the Power of Veto.",

            icon:
                "◆"
        },

        veto: {
            name:
                "VETO CEREMONY",

            title:
                "Veto Ceremony",

            description:
                "The Power of Veto holder decides whether to use the veto.",

            icon:
                "◆"
        },

        evictionVoting: {
            name:
                "EVICTION",

            title:
                "Eviction Voting",

            description:
                "The Houseguests cast their votes.",

            icon:
                "!"
        },

        eviction: {
            name:
                "LIVE EVICTION",

            title:
                "Eviction",

            description:
                "The eviction votes are revealed.",

            icon:
                "!"
        },

        battleback: {
            name:
                "BATTLE BACK",

            title:
                "Battle Back",

            description:
                "Evicted Houseguests compete for another chance.",

            icon:
                "↻"
        },

        nextcycle: {
            name:
                "NEXT CYCLE",

            title:
                "Next Cycle",

            description:
                "The game advances to the next cycle.",

            icon:
                "→"
        },

        finalHOH1: {
            name:
                "FINAL HOH",

            title:
                "Final HOH - Part 1",

            description:
                "The finalists compete in the first part of the Final HOH.",

            icon:
                "♛"
        },

        finalHOH2: {
            name:
                "FINAL HOH",

            title:
                "Final HOH - Part 2",

            description:
                "The finalists compete in the second part of the Final HOH.",

            icon:
                "♛"
        },

        finalHOH3: {
            name:
                "FINAL HOH",

            title:
                "Final HOH - Part 3",

            description:
                "The finalists compete in the final part of the Final HOH.",

            icon:
                "♛"
        },

        finalEviction: {
            name:
                "FINAL EVICTION",

            title:
                "Final Eviction",

            description:
                "The final Houseguest is evicted.",

            icon:
                "!"
        },

        juryVote: {
            name:
                "JURY VOTE",

            title:
                "Jury Vote",

            description:
                "The jury determines the winner.",

            icon:
                "★"
        },

        finished: {
            name:
                "FINALE",

            title:
                "Finale",

            description:
                "The winner of the season is revealed.",

            icon:
                "★"
        }

    };


    const data =
        stages[
            currentStage
        ] ||
        stages.opening1;


    if (stageName) {

        stageName.textContent =
            data.name;
    }


    if (stageTitle) {

        stageTitle.textContent =
            data.title;
    }


    if (stageDescription) {

        stageDescription.textContent =
            data.description;
    }


    if (stageIcon) {

        stageIcon.textContent =
            data.icon;
    }


    const badge =
        $("weekBadge");

    if (badge) {

        badge.textContent =
            `WEEK ${currentWeek}`;
    }


    const weekTitle =
        $("weekTitle");

    if (weekTitle) {

        weekTitle.textContent =
            `Week ${currentWeek}`;
    }
}


/* =========================================================
   PROCEED GAME
   ========================================================= */

function proceedGame() {

    if (!seasonStarted) {

        alert(
            "Start a season first."
        );

        return;
    }


    switch (
        currentStage
    ) {

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

            prepareEvictionVotes();

            break;


        case "eviction":

            revealNextEvictionVote();

            break;


        case "battleback":

            runBattleBack();

            break;


        case "nextcycle":

            beginNextCycleOrWeek();

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

            if (
                juryVoteRevealIndex === 0
            ) {
                prepareJuryVotes();
            } else {
                revealNextJuryVote();
            }

            break;


        case "finished":

            showFinale();

            break;


        default:

            setStage(
                "hoh"
            );

            break;
    }


    saveGameSilently();

    updateAllDisplays();
}

            .map(([week, data]) => {

                let text =
                    `<strong>Week ${week}</strong>: `;

                if (data.doubleEviction) {
                    text += "Double Eviction";
                }

                if (data.hoh) {
                    text += `HOH - ${escapeHTML(data.hoh)}`;
                }

                if (data.pov) {
                    text += ` | POV - ${escapeHTML(data.pov)}`;
                }

                return `<div>${text}</div>`;

            })
            .join("");

    }

    $("selectedSeasonInfo").innerHTML = `

        <h3>${escapeHTML(template.name)}</h3>

        <p>
            Starting Houseguests:
            <strong>${template.startingPlayers}</strong>
        </p>

        <p>
            Nominees:
            <strong>${template.nominationCount}</strong>
        </p>

        <p>
            Jury:
            <strong>${template.jurySize}</strong>
        </p>

        ${
            competitionsHTML
                ? `
                    <hr>
                    <h4>Competition Schedule</h4>
                    ${competitionsHTML}
                  `
                : ""
        }
    `;
}



/* =========================================================
   STAT DISPLAY
========================================================= */

function updateStatValue(stat) {

    const input = $(stat);
    const output = $(`${stat}Value`);

    if (input && output) {
        output.textContent = input.value;
    }
}


function updateAllStatDisplays() {

    [
        "physical",
        "mental",
        "social",
        "strategy"
    ].forEach(updateStatValue);
}



/* =========================================================
   ADD / EDIT HOUSEGUEST
========================================================= */

function saveHouseguest() {

    const firstName =
        $("firstName").value.trim();

    const lastName =
        $("lastName").value.trim();

    const nickname =
        $("nickname").value.trim();

    const image =
        $("imageUrl").value.trim();

    if (!firstName && !lastName && !nickname) {

        alert(
            "Please enter at least a first name, last name, or nickname."
        );

        return;
    }


    const physical =
        Number($("physical").value);

    const mental =
        Number($("mental").value);

    const social =
        Number($("social").value);

    const strategy =
        Number($("strategy").value);


    const editingId =
        $("editingHouseguestId").value;


    if (editingId) {

        const player =
            houseguests.find(
                p => p.id === editingId
            );

        if (!player) {
            cancelHouseguestEdit();
            return;
        }

        player.firstName = firstName;
        player.lastName = lastName;
        player.nickname = nickname;
        player.image = image;

        player.physical = physical;
        player.mental = mental;
        player.social = social;
        player.strategy = strategy;

        normalizeHouseguest(player);

        addEvent(
            `${getDisplayName(player)} was edited.`
        );

    } else {

        const player = {

            id:
                "hg_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2),

            firstName,
            lastName,
            nickname,
            image,

            physical,
            mental,
            social,
            strategy,

            name: nickname || firstName,

            status: "Active",

            app: null,
            punishment: null,

            appUsed: false,

            cloudAvailable: false,
            identityTheftAvailable: false,
            bonusLifeAvailable: false,

            hackerWins: 0,

            safety: false

        };

        normalizeHouseguest(player);

        houseguests.push(player);

        addEvent(
            `${getDisplayName(player)} was added to the cast.`
        );
    }


    clearHouseguestEditor();

    updateAllDisplays();

    saveGameSilently();
}


function editHouseguest(id) {

    const player =
        houseguests.find(
            p => p.id === id
        );

    if (!player) {
        return;
    }

    normalizeHouseguest(player);

    $("editingHouseguestId").value =
        player.id;

    $("firstName").value =
        player.firstName || "";

    $("lastName").value =
        player.lastName || "";

    $("nickname").value =
        player.nickname || "";

    $("imageUrl").value =
        player.image || "";

    $("physical").value =
        player.physical || 5;

    $("mental").value =
        player.mental || 5;

    $("social").value =
        player.social || 5;

    $("strategy").value =
        player.strategy || 5;

    updateAllStatDisplays();

    $("castEditorTitle").textContent =
        `Edit ${getDisplayName(player)}`;

    $("saveHouseguestButton").textContent =
        "SAVE CHANGES";

    $("cancelEditButton")
        .classList.remove("hidden");

    showSection("cast");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function cancelHouseguestEdit() {

    clearHouseguestEditor();
}


function clearHouseguestEditor() {

    $("editingHouseguestId").value = "";

    $("firstName").value = "";
    $("lastName").value = "";
    $("nickname").value = "";
    $("imageUrl").value = "";

    $("physical").value = 5;
    $("mental").value = 5;
    $("social").value = 5;
    $("strategy").value = 5;

    updateAllStatDisplays();

    $("castEditorTitle").textContent =
        "Add Houseguest";

    $("saveHouseguestButton").textContent =
        "ADD HOUSEGUEST";

    $("cancelEditButton")
        .classList.add("hidden");
}



/* =========================================================
   DELETE HOUSEGUEST
========================================================= */

function deleteHouseguest(id) {

    const player =
        houseguests.find(
            p => p.id === id
        );

    if (!player) {
        return;
    }


    if (seasonStarted) {

        alert(
            "You cannot permanently remove a Houseguest after the season has started. This protects the simulation history. Reset the season if you need to completely rebuild the cast."
        );

        return;
    }


    const confirmed =
        confirm(
            `Remove ${getDisplayName(player)} from the cast?`
        );

    if (!confirmed) {
        return;
    }


    houseguests =
        houseguests.filter(
            p => p.id !== id
        );


    /*
       Also remove their relationships.
    */

    relationships =
        relationships.filter(
            r =>
                r.from !== id &&
                r.to !== id
        );


    /*
       Remove them from alliances.
    */

    alliances.forEach(alliance => {

        alliance.members =
            alliance.members.filter(
                memberId =>
                    memberId !== id
            );

    });


    alliances =
        alliances.filter(
            alliance =>
                alliance.members.length > 0
        );


    addEvent(
        `${getDisplayName(player)} was removed from the cast.`
    );


    updateAllDisplays();

    saveGameSilently();
}



/* =========================================================
   CAST RENDER
========================================================= */

function renderCast() {

    const grid =
        $("castGrid");

    const count =
        $("castCount");

    if (!grid) {
        return;
    }


    if (count) {
        count.textContent =
            houseguests.length;
    }


    if (!houseguests.length) {

        grid.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    👤
                </div>

                <h3>No Houseguests Yet</h3>

                <p>
                    Add Houseguests above to build
                    your Big Brother cast.
                </p>

            </div>

        `;

        return;
    }


    grid.innerHTML =
        houseguests
            .map(player => {

                normalizeHouseguest(player);

                const imageHTML =
                    player.image
                        ? `
                            <img
                                src="${escapeAttribute(player.image)}"
                                alt="${escapeAttribute(getDisplayName(player))}"
                                class="cast-card-image"
                                onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                            >
                            <div
                                class="cast-card-placeholder"
                                style="display:none;"
                            >
                                ${escapeHTML(
                                    getInitials(player)
                                )}
                            </div>
                          `
                        : `
                            <div class="cast-card-placeholder">
                                ${escapeHTML(
                                    getInitials(player)
                                )}
                            </div>
                          `;


                return `

                    <article
                        class="cast-card"
                        data-player-id="${escapeAttribute(player.id)}"
                    >

                        <div class="cast-card-photo">

                            ${imageHTML}

                            ${
                                player.status !== "Active"
                                    ? `
                                        <span class="status-badge">
                                            ${escapeHTML(
                                                player.status
                                            )}
                                        </span>
                                      `
                                    : ""
                            }

                        </div>


                        <div class="cast-card-body">

                            <h3>
                                ${escapeHTML(
                                    getDisplayName(player)
                                )}
                            </h3>

                            ${
                                player.nickname
                                    ? `
                                        <div class="cast-card-fullname">
                                            ${escapeHTML(
                                                getFullName(player)
                                            )}
                                        </div>
                                      `
                                    : ""
                            }


                            <div class="cast-stat-grid">

                                <div class="cast-stat">

                                    <span>
                                        Physical
                                    </span>

                                    <strong>
                                        ${player.physical}
                                    </strong>

                                </div>


                                <div class="cast-stat">

                                    <span>
                                        Mental
                                    </span>

                                    <strong>
                                        ${player.mental}
                                    </strong>

                                </div>


                                <div class="cast-stat">

                                    <span>
                                        Social
                                    </span>

                                    <strong>
                                        ${player.social}
                                    </strong>

                                </div>


                                <div class="cast-stat">

                                    <span>
                                        Strategy
                                    </span>

                                    <strong>
                                        ${player.strategy}
                                    </strong>

                                </div>

                            </div>


                            <div class="cast-card-actions">

                                <button
                                    type="button"
                                    class="secondary-button"
                                    onclick="editHouseguest('${escapeAttribute(player.id)}')"
                                >
                                    EDIT
                                </button>

                                <button
                                    type="button"
                                    class="danger-button"
                                    onclick="deleteHouseguest('${escapeAttribute(player.id)}')"
                                >
                                    DELETE
                                </button>

                            </div>

                        </div>

                    </article>

                `;

            })
            .join("");
}



/* =========================================================
   HOUSEGUEST HELPERS
========================================================= */

function getInitials(player) {

    const first =
        (
            player.firstName ||
            ""
        ).trim();

    const last =
        (
            player.lastName ||
            ""
        ).trim();

    if (first && last) {

        return (
            first.charAt(0) +
            last.charAt(0)
        ).toUpperCase();
    }


    if (first) {

        return first
            .slice(0, 2)
            .toUpperCase();
    }


    if (player.nickname) {

        return player.nickname
            .slice(0, 2)
            .toUpperCase();
    }


    return "HG";
}


function getFullName(player) {

    const parts = [];

    if (player.firstName) {
        parts.push(player.firstName);
    }

    if (player.lastName) {
        parts.push(player.lastName);
    }

    return parts.join(" ").trim();
}


function getDisplayName(player) {

    if (!player) {
        return "Unknown";
    }

    if (player.nickname) {
        return player.nickname;
    }

    const fullName =
        getFullName(player);

    if (fullName) {
        return fullName;
    }

    if (player.name) {
        return player.name;
    }

    return "Houseguest";
}



/* =========================================================
   HOUSEGUEST NORMALIZATION
========================================================= */

function normalizeHouseguest(player) {

    if (!player) {
        return;
    }


    if (!player.id) {

        player.id =
            "hg_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2);
    }


    if (
        typeof player.firstName !== "string"
    ) {
        player.firstName = "";
    }


    if (
        typeof player.lastName !== "string"
    ) {
        player.lastName = "";
    }


    if (
        typeof player.nickname !== "string"
    ) {
        player.nickname = "";
    }


    if (
        typeof player.image !== "string"
    ) {
        player.image = "";
    }


    player.physical =
        clampStat(
            player.physical,
            5
        );

    player.mental =
        clampStat(
            player.mental,
            5
        );

    player.social =
        clampStat(
            player.social,
            5
        );

    player.strategy =
        clampStat(
            player.strategy,
            5
        );


    if (!player.name) {

        player.name =
            player.nickname ||
            getFullName(player) ||
            "Houseguest";
    }


    if (!player.status) {
        player.status = "Active";
    }


    if (
        typeof player.appUsed !== "boolean"
    ) {
        player.appUsed = false;
    }


    if (
        typeof player.cloudAvailable !== "boolean"
    ) {
        player.cloudAvailable = false;
    }


    if (
        typeof player.identityTheftAvailable !== "boolean"
    ) {
        player.identityTheftAvailable = false;
    }


    if (
        typeof player.bonusLifeAvailable !== "boolean"
    ) {
        player.bonusLifeAvailable = false;
    }


    if (
        typeof player.hackerWins !== "number"
    ) {
        player.hackerWins = 0;
    }


    if (
        typeof player.safety !== "boolean"
    ) {
        player.safety = false;
    }
}


function normalizeAllHouseguests() {

    houseguests.forEach(
        normalizeHouseguest
    );
}


function clampStat(value, fallback) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return fallback;
    }

    return Math.max(
        1,
        Math.min(
            10,
            Math.round(number)
        )
    );
}



/* =========================================================
   TWISTS
========================================================= */

function renderTwists() {

    const list =
        $("twistList");

    if (!list) {
        return;
    }


    const template =
        getCurrentSeasonTemplate();


    const twists =
        template &&
        Array.isArray(template.twists)
            ? template.twists
            : [];


    const activeTwists =
        Array.isArray(activeTwistsState)
            ? activeTwistsState
            : [];


    if (!twists.length) {

        list.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    ✦
                </div>

                <h3>No Twists Configured</h3>

                <p>
                    This season does not currently
                    have any twists configured.
                </p>

            </div>

        `;

        return;
    }


    list.innerHTML =
        twists
            .map((twist, index) => {

                const id =
                    twist.id ||
                    `twist_${index}`;


                const active =
                    activeTwists.includes(id);


                return `

                    <article
                        class="
                            twist-card
                            ${active ? "active" : ""}
                        "
                    >

                        <div class="twist-card-header">

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        twist.name ||
                                        "Untitled Twist"
                                    )}
                                </h3>

                                ${
                                    twist.week
                                        ? `
                                            <span class="twist-week">
                                                Week ${escapeHTML(
                                                    String(twist.week)
                                                )}
                                            </span>
                                          `
                                        : ""
                                }

                            </div>


                            <span
                                class="
                                    twist-status
                                    ${active ? "enabled" : ""}
                                "
                            >
                                ${
                                    active
                                        ? "ACTIVE"
                                        : "AVAILABLE"
                                }
                            </span>

                        </div>


                        <p>
                            ${escapeHTML(
                                twist.description ||
                                "No description provided."
                            )}
                        </p>


                        ${
                            twist.effect
                                ? `
                                    <div class="twist-effect">
                                        <strong>Effect:</strong>
                                        ${escapeHTML(
                                            twist.effect
                                        )}
                                    </div>
                                  `
                                : ""
                        }

                    </article>

                `;

            })
            .join("");
}



/* =========================================================
   ACTIVE TWIST PANEL
========================================================= */

function renderActiveTwistPanel() {

    const panel =
        $("bbTwistStatusPanel");

    if (!panel) {
        return;
    }


    const template =
        getCurrentSeasonTemplate();


    if (!template) {

        panel.innerHTML = `
            <div class="empty-state">
                Select a season to view twists.
            </div>
        `;

        return;
    }


    const twists =
        Array.isArray(template.twists)
            ? template.twists
            : [];


    const active =
        twists.filter(
            twist =>
                Array.isArray(activeTwistsState) &&
                activeTwistsState.includes(
                    twist.id
                )
        );


    if (!active.length) {

        panel.innerHTML = `

            <div class="twist-status-empty">

                <strong>
                    No active twists
                </strong>

                <span>
                    The current game state has
                    no active special powers.
                </span>

            </div>

        `;

        return;
    }


    panel.innerHTML = `

        <div class="active-twist-heading">
            ACTIVE TWISTS
        </div>

        <div class="bb-active-twist-grid">

            ${active
                .map(
                    twist => `

                        <div class="bb-active-twist">

                            <strong>
                                ${escapeHTML(
                                    twist.name
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    twist.description ||
                                    ""
                                )}
                            </span>

                        </div>

                    `
                )
                .join("")}

        </div>

    `;
}



/* =========================================================
   ALLIANCES
========================================================= */

function updateAllianceDropdown() {

    const container =
        $("allianceMembers");

    if (!container) {
        return;
    }


    if (!houseguests.length) {

        container.innerHTML =
            "<p>No Houseguests available.</p>";

        return;
    }


    container.innerHTML = `

        <div class="bb-alliance-checklist">

            ${houseguests
                .map(player => {

                    normalizeHouseguest(player);

                    return `

                        <label
                            class="bb-check-option"
                        >

                            <input
                                type="checkbox"
                                value="${escapeAttribute(player.id)}"
                                data-alliance-member="true"
                            >

                            <span>
                                ${escapeHTML(
                                    getDisplayName(player)
                                )}
                            </span>

                        </label>

                    `;

                })
                .join("")}

        </div>

    `;
}


function saveAlliance() {

    const nameInput =
        $("allianceName");

    const strengthInput =
        $("allianceStrength");


    if (!nameInput) {
        return;
    }


    const name =
        nameInput.value.trim();


    if (!name) {

        alert(
            "Please enter an alliance name."
        );

        return;
    }


    const selected =
        Array.from(
            document.querySelectorAll(
                'input[data-alliance-member="true"]:checked'
            )
        )
        .map(
            input => input.value
        );


    if (selected.length < 2) {

        alert(
            "An alliance must contain at least two Houseguests."
        );

        return;
    }


    const strength =
        strengthInput
            ? Number(strengthInput.value)
            : 5;


    alliances.push({

        id:
            "alliance_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2),

        name,

        members:
            selected,

        strength:
            clampStat(
                strength,
                5
            ),

        createdWeek:
            currentWeek

    });


    addEvent(
        `Alliance "${name}" was formed.`
    );


    if (nameInput) {
        nameInput.value = "";
    }

    if (strengthInput) {
        strengthInput.value = 5;
    }


    updateAllDisplays();

    saveGameSilently();
}


function deleteAlliance(id) {

    const alliance =
        alliances.find(
            item =>
                item.id === id
        );


    if (!alliance) {
        return;
    }


    const confirmed =
        confirm(
            `Delete the alliance "${alliance.name}"?`
        );


    if (!confirmed) {
        return;
    }


    alliances =
        alliances.filter(
            item =>
                item.id !== id
        );


    addEvent(
        `Alliance "${alliance.name}" was deleted.`
    );


    updateAllDisplays();

    saveGameSilently();
}



/* =========================================================
   ALLIANCE RENDER
========================================================= */

function renderAlliances() {

    const list =
        $("allianceList");

    if (!list) {
        return;
    }


    if (!alliances.length) {

        list.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    🤝
                </div>

                <h3>No Alliances</h3>

                <p>
                    Create alliances to track
                    the social structure of the house.
                </p>

            </div>

        `;

        return;
    }


    list.innerHTML =
        alliances
            .map(alliance => {

                const members =
                    Array.isArray(
                        alliance.members
                    )
                        ? alliance.members
                        : [];


                return `

                    <article
                        class="alliance-card"
                    >

                        <div
                            class="alliance-card-header"
                        >

                            <h3>
                                ${escapeHTML(
                                    alliance.name
                                )}
                            </h3>

                            <span
                                class="alliance-strength"
                            >
                                Strength:
                                ${Number(
                                    alliance.strength || 5
                                )}
                            </span>

                        </div>


                        <div
                            class="alliance-members"
                        >

                            ${members
                                .map(memberId => {

                                    const player =
                                        houseguests.find(
                                            p =>
                                                p.id ===
                                                memberId
                                        );

                                    if (!player) {
                                        return "";
                                    }

                                    return `
                                        <span
                                            class="member-pill"
                                        >
                                            ${escapeHTML(
                                                getDisplayName(
                                                    player
                                                )
                                            )}
                                        </span>
                                    `;

                                })
                                .join("")}

                        </div>


                        <div
                            class="alliance-card-footer"
                        >

                            <span>
                                Formed Week
                                ${Number(
                                    alliance.createdWeek ||
                                    currentWeek ||
                                    1
                                )}
                            </span>

                            <button
                                type="button"
                                class="danger-button"
                                onclick="deleteAlliance('${escapeAttribute(alliance.id)}')"
                            >
                                DELETE
                            </button>

                        </div>

                    </article>

                `;

            })
            .join("");
}



/* =========================================================
   RELATIONSHIP DROPDOWNS
========================================================= */

function updateRelationshipDropdowns() {

    const from =
        $("relationshipFrom");

    const to =
        $("relationshipTo");


    if (!from || !to) {
        return;
    }


    const currentFrom =
        from.value;

    const currentTo =
        to.value;


    const options = [

        `<option value="">
            Select Houseguest
         </option>`,

        ...houseguests.map(player => `

            <option value="${escapeAttribute(player.id)}">
                ${escapeHTML(
                    getDisplayName(player)
                )}
            </option>

        `)

    ].join("");


    from.innerHTML =
        options;

    to.innerHTML =
        options;


    if (
        houseguests.some(
            p => p.id === currentFrom
        )
    ) {
        from.value = currentFrom;
    }


    if (
        houseguests.some(
            p => p.id === currentTo
        )
    ) {
        to.value = currentTo;
    }


    updateRelationshipPreviews();
}



/* =========================================================
   RELATIONSHIP PREVIEWS
========================================================= */

function updateRelationshipPreviews() {

    const from =
        $("relationshipFrom");

    const to =
        $("relationshipTo");

    const fromPreview =
        $("relationshipFromPreview");

    const toPreview =
        $("relationshipToPreview");


    if (!from || !to) {
        return;
    }


    const playerFrom =
        houseguests.find(
            p => p.id === from.value
        );

    const playerTo =
        houseguests.find(
            p => p.id === to.value
        );


    if (fromPreview) {

        fromPreview.textContent =
            playerFrom
                ? getDisplayName(playerFrom)
                : "Select Houseguest";
    }


    if (toPreview) {

        toPreview.textContent =
            playerTo
                ? getDisplayName(playerTo)
                : "Select Houseguest";
    }
}



/* =========================================================
   SAVE RELATIONSHIP
========================================================= */

function saveRelationship() {

    const from =
        $("relationshipFrom");

    const to =
        $("relationshipTo");

    const type =
        $("relationshipType");

    const note =
        $("relationshipNote");


    if (!from || !to) {
        return;
    }


    const fromId =
        from.value;

    const toId =
        to.value;


    if (!fromId || !toId) {

        alert(
            "Please select both Houseguests."
        );

        return;
    }


    if (fromId === toId) {

        alert(
            "A Houseguest cannot have a relationship with themselves."
        );

        return;
    }


    const relationshipType =
        type
            ? type.value
            : "Neutral";


    const relationshipNote =
        note
            ? note.value.trim()
            : "";


    const existing =
        relationships.find(
            relationship =>
                relationship.from === fromId &&
                relationship.to === toId
        );


    if (existing) {

        existing.type =
            relationshipType;

        existing.note =
            relationshipNote;

    } else {

        relationships.push({

            id:
                "relationship_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2),

            from:
                fromId,

            to:
                toId,

            type:
                relationshipType,

            note:
                relationshipNote

        });
    }


    const fromPlayer =
        houseguests.find(
            p => p.id === fromId
        );

    const toPlayer =
        houseguests.find(
            p => p.id === toId
        );


    addEvent(
        `Relationship updated: ${getDisplayName(fromPlayer)} → ${getDisplayName(toPlayer)} (${relationshipType}).`
    );


    if (type) {
        type.value = "Neutral";
    }

    if (note) {
        note.value = "";
    }


    renderRelationships();

    saveGameSilently();
}



/* =========================================================
   DELETE RELATIONSHIP
========================================================= */

function deleteRelationship(id) {

    const relationship =
        relationships.find(
            item =>
                item.id === id
        );


    if (!relationship) {
        return;
    }


    relationships =
        relationships.filter(
            item =>
                item.id !== id
        );


    renderRelationships();

    saveGameSilently();
}



/* =========================================================
   RELATIONSHIP RENDER
========================================================= */

function renderRelationships() {

    const list =
        $("relationshipsList");

    if (!list) {
        return;
    }


    if (!relationships.length) {

        list.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    ♥
                </div>

                <h3>No Relationships</h3>

                <p>
                    Add relationships to influence
                    nominations, voting and strategy.
                </p>

            </div>

        `;

        return;
    }


    list.innerHTML =
        relationships
            .map(relationship => {

                const from =
                    houseguests.find(
                        p =>
                            p.id ===
                            relationship.from
                    );

                const to =
                    houseguests.find(
                        p =>
                            p.id ===
                            relationship.to
                    );


                if (!from || !to) {
                    return "";
                }


                const type =
                    relationship.type ||
                    "Neutral";


                const typeClass =
                    type
                        .toLowerCase()
                        .replace(
                            /[^a-z0-9]+/g,
                            "-"
                        );


                return `

                    <article
                        class="
                            relationship-card
                            relationship-${escapeAttribute(
                                typeClass
                            )}
                        "
                    >

                        <div
                            class="relationship-main"
                        >

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(from)
                                )}
                            </strong>

                            <span
                                class="relationship-arrow"
                            >
                                →
                            </span>

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(to)
                                )}
                            </strong>

                        </div>


                        <div
                            class="relationship-type"
                        >
                            ${escapeHTML(type)}
                        </div>


                        ${
                            relationship.note
                                ? `
                                    <p
                                        class="relationship-note"
                                    >
                                        ${escapeHTML(
                                            relationship.note
                                        )}
                                    </p>
                                  `
                                : ""
                        }


                        <button
                            type="button"
                            class="danger-button"
                            onclick="deleteRelationship('${escapeAttribute(relationship.id)}')"
                        >
                            DELETE
                        </button>

                    </article>

                `;

            })
            .join("");
}



/* =========================================================
   MEMORY WALL
========================================================= */

function renderMemoryWall() {

    const wall =
        $("memoryWall");

    if (!wall) {
        return;
    }


    normalizeAllHouseguests();


    wall.innerHTML =
        houseguests
            .map(player => {

                const eliminated =
                    player.status &&
                    player.status !== "Active";


                return `

                    <article
                        class="
                            memory-wall-card
                            ${eliminated ? "eliminated" : ""}
                        "
                        data-player-id="${escapeAttribute(player.id)}"
                    >

                        <div
                            class="memory-wall-photo"
                        >

                            ${
                                player.image
                                    ? `
                                        <img
                                            src="${escapeAttribute(player.image)}"
                                            alt="${escapeAttribute(
                                                getDisplayName(player)
                                            )}"
                                            onerror="this.style.display='none';"
                                        >
                                      `
                                    : `
                                        <div
                                            class="memory-wall-placeholder"
                                        >
                                            ${escapeHTML(
                                                getInitials(player)
                                            )}
                                        </div>
                                      `
                            }

                        </div>


                        <div
                            class="memory-wall-name"
                        >
                            ${escapeHTML(
                                getDisplayName(player)
                            )}
                        </div>


                        ${
                            eliminated
                                ? `
                                    <div
                                        class="memory-wall-status"
                                    >
                                        ${escapeHTML(
                                            player.status
                                        )}
                                    </div>
                                  `
                                : ""
                        }

                    </article>

                `;

            })
            .join("");
}



/* =========================================================
   JURY RENDER
========================================================= */

function renderJury() {

    const list =
        $("juryList");

    const evictedList =
        $("evictedPlayers");


    if (list) {

        if (!jury.length) {

            list.innerHTML = `

                <div class="empty-state">

                    <div class="empty-state-icon">
                        ⚖
                    </div>

                    <h3>Jury Is Empty</h3>

                    <p>
                        Evicted Houseguests who qualify
                        for jury will appear here.
                    </p>

                </div>

            `;

        } else {

            list.innerHTML =
                jury
                    .map(
                        playerId => {

                            const player =
                                houseguests.find(
                                    p =>
                                        p.id ===
                                        playerId
                                );

                            if (!player) {
                                return "";
                            }

                            return `

                                <article
                                    class="jury-card"
                                >

                                    <div
                                        class="jury-card-photo"
                                    >

                                        ${
                                            player.image
                                                ? `
                                                    <img
                                                        src="${escapeAttribute(player.image)}"
                                                        alt="${escapeAttribute(
                                                            getDisplayName(player)
                                                        )}"
                                                    >
                                                  `
                                                : `
                                                    <div
                                                        class="jury-placeholder"
                                                    >
                                                        ${escapeHTML(
                                                            getInitials(player)
                                                        )}
                                                    </div>
                                                  `
                                        }

                                    </div>


                                    <div
                                        class="jury-card-info"
                                    >

                                        <strong>
                                            ${escapeHTML(
                                                getDisplayName(player)
                                            )}
                                        </strong>

                                        <span>
                                            Jury Member
                                        </span>

                                    </div>

                                </article>

                            `;

                        }
                    )
                    .join("");
        }
    }


    if (evictedList) {

        const evicted =
            houseguests.filter(
                player =>
                    player.status ===
                    "Evicted"
            );


        if (!evicted.length) {

            evictedList.innerHTML =
                "<p>No evicted Houseguests yet.</p>";

        } else {

            evictedList.innerHTML =
                evicted
                    .map(
                        player => `

                            <div
                                class="evicted-player-row"
                            >

                                <span>
                                    ${escapeHTML(
                                        getDisplayName(player)
                                    )}
                                </span>

                                <span>
                                    ${escapeHTML(
                                        player.evictionWeek
                                            ? `Week ${player.evictionWeek}`
                                            : "Evicted"
                                    )}
                                </span>

                            </div>

                        `
                    )
                    .join("");
        }
    }
}



/* =========================================================
   GAME HOUSEGUEST RENDER
========================================================= */

function renderGameHouseguests() {

    const container =
        $("gameHouseguests");

    if (!container) {
        return;
    }


    const activePlayers =
        houseguests.filter(
            player =>
                player.status === "Active"
        );


    if (!activePlayers.length) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    No Active Houseguests
                </h3>

            </div>

        `;

        return;
    }


    container.innerHTML =
        activePlayers
            .map(player => {

                const isHOH =
                    currentHOH ===
                    player.id;

                const isNominee =
                    nominees.includes(
                        player.id
                    );

                const hasPOV =
                    povWinner ===
                    player.id;


                return `

                    <article
                        class="
                            game-houseguest-card
                            ${isHOH ? "is-hoh" : ""}
                            ${isNominee ? "is-nominee" : ""}
                            ${hasPOV ? "has-pov" : ""}
                        "
                    >

                        <div
                            class="game-houseguest-photo"
                        >

                            ${
                                player.image
                                    ? `
                                        <img
                                            src="${escapeAttribute(player.image)}"
                                            alt="${escapeAttribute(
                                                getDisplayName(player)
                                            )}"
                                            onerror="this.style.display='none';"
                                        >
                                      `
                                    : `
                                        <div
                                            class="game-houseguest-placeholder"
                                        >
                                            ${escapeHTML(
                                                getInitials(player)
                                            )}
                                        </div>
                                      `
                            }

                        </div>


                        <div
                            class="game-houseguest-name"
                        >
                            ${escapeHTML(
                                getDisplayName(player)
                            )}
                        </div>


                        <div
                            class="game-houseguest-tags"
                        >

                            ${
                                isHOH
                                    ? `
                                        <span
                                            class="game-tag hoh"
                                        >
                                            HOH
                                        </span>
                                      `
                                    : ""
                            }

                            ${
                                isNominee
                                    ? `
                                        <span
                                            class="game-tag nominee"
                                        >
                                            NOM
                                        </span>
                                      `
                                    : ""
                            }

                            ${
                                hasPOV
                                    ? `
                                        <span
                                            class="game-tag pov"
                                        >
                                            POV
                                        </span>
                                      `
                                    : ""
                            }

                        </div>

                    </article>

                `;

            })
            .join("");
}



/* =========================================================
   EVENT LOG
========================================================= */

function renderEventLog() {

    const log =
        $("eventLog");

    if (!log) {
        return;
    }


    if (!eventLog.length) {

        log.innerHTML = `

            <div class="event-log-empty">
                No events yet.
            </div>

        `;

        return;
    }


    log.innerHTML =
        eventLog
            .slice()
            .reverse()
            .map(event => {

                const text =
                    typeof event === "string"
                        ? event
                        : event.text || "";


                const week =
                    typeof event === "object"
                        ? event.week
                        : null;


                const type =
                    typeof event === "object"
                        ? event.type
                        : "general";


                return `

                    <div
                        class="
                            event-log-item
                            event-${escapeAttribute(
                                type || "general"
                            )}
                        "
                    >

                        ${
                            week
                                ? `
                                    <span
                                        class="event-week"
                                    >
                                        W${escapeHTML(
                                            String(week)
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                        <span
                            class="event-text"
                        >
                            ${escapeHTML(text)}
                        </span>

                    </div>

                `;

            })
            .join("");
}



/* =========================================================
   SEASON SUMMARY
========================================================= */

function updateSeasonSummary() {

    const summary =
        $("seasonSummary");

    if (!summary) {
        return;
    }


    const activeCount =
        houseguests.filter(
            player =>
                player.status === "Active"
        ).length;


    const evictedCount =
        houseguests.filter(
            player =>
                player.status === "Evicted"
        ).length;


    const juryCount =
        jury.length;


    const champion =
        winner
            ? houseguests.find(
                player =>
                    player.id === winner
            )
            : null;


    summary.innerHTML = `

        <div class="summary-card">

            <span class="summary-label">
                WEEK
            </span>

            <strong class="summary-value">
                ${Number(currentWeek || 1)}
            </strong>

        </div>


        <div class="summary-card">

            <span class="summary-label">
                ACTIVE
            </span>

            <strong class="summary-value">
                ${activeCount}
            </strong>

        </div>


        <div class="summary-card">

            <span class="summary-label">
                EVICTED
            </span>

            <strong class="summary-value">
                ${evictedCount}
            </strong>

        </div>


        <div class="summary-card">

            <span class="summary-label">
                JURY
            </span>

            <strong class="summary-value">
                ${juryCount}
            </strong>

        </div>


        <div class="summary-card">

            <span class="summary-label">
                HOH
            </span>

            <strong class="summary-value">
                ${
                    currentHOH
                        ? escapeHTML(
                            getDisplayNameById(
                                currentHOH
                            )
                        )
                        : "—"
                }
            </strong>

        </div>


        <div class="summary-card">

            <span class="summary-label">
                CHAMPION
            </span>

            <strong class="summary-value">
                ${
                    champion
                        ? escapeHTML(
                            getDisplayName(champion)
                        )
                        : "—"
                }
            </strong>

        </div>

    `;
}



/* =========================================================
   DISPLAY NAME BY ID
========================================================= */

function getDisplayNameById(id) {

    const player =
        houseguests.find(
            p =>
                p.id === id
        );


    return player
        ? getDisplayName(player)
        : "Unknown";
}



/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );
}


function escapeAttribute(value) {

    return escapeHTML(value);
}



/* =========================================================
   SEASON START VALIDATION
========================================================= */

function validateSeasonStart() {

    const template =
        getCurrentSeasonTemplate();


    if (!template) {

        alert(
            "Please select a season format first."
        );

        return false;
    }


    if (
        houseguests.length <
        Number(
            template.startingPlayers || 1
        )
    ) {

        alert(
            `This season requires at least ${template.startingPlayers} Houseguests. You currently have ${houseguests.length}.`
        );

        return false;
    }


    return true;
}



/* =========================================================
   START NEW SEASON
========================================================= */

function startNewSeason() {

    if (!validateSeasonStart()) {
        return;
    }


    const template =
        getCurrentSeasonTemplate();


    const confirmed =
        seasonStarted
            ? confirm(
                "Starting a new season will reset the current game. Continue?"
            )
            : true;


    if (!confirmed) {
        return;
    }


    resetGameState(false);


    seasonStarted = true;

    currentWeek = 1;

    currentStage =
        "opening1";


    normalizeAllHouseguests();


    houseguests.forEach(
        player => {

            player.status =
                "Active";

            player.evictionWeek =
                null;

            player.placement =
                null;

            player.jury =
                false;

            player.votesReceived =
                0;

            player.vetoWins =
                0;

            player.hohWins =
                0;

            player.safety =
                false;

            player.appUsed =
                false;

        }
    );


    const castSize =
        Number(
            template.startingPlayers ||
            houseguests.length
        );


    if (
        houseguests.length >
        castSize
    ) {

        houseguests =
            houseguests.slice(
                0,
                castSize
            );
    }


    addEvent(
        `${template.name} has officially begun.`
    );


    addEvent(
        `${houseguests.length} Houseguests have entered the Big Brother house.`
    );


    updateAllDisplays();

    saveGameSilently();


    showSection("game");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}



/* =========================================================
   RESET GAME STATE
========================================================= */

function resetGameState(
    preserveCast = true
) {

    seasonStarted =
        false;

    currentWeek =
        1;

    currentStage =
        "opening1";

    currentHOH =
        null;

    nominees =
        [];

    povWinner =
        null;

    povPlayers =
        [];

    vetoUsed =
        false;

    evictionTarget =
        null;

    evictionVotes =
        {};

    jury =
        [];

    evictedPlayers =
        [];

    winner =
        null;

    runnerUp =
        null;

    eventLog =
        [];

    weeklyResults =
        {};

    activeTwistsState =
        [];

    alliances =
        preserveCast
            ? alliances
            : [];

    relationships =
        preserveCast
            ? relationships
            : [];


    houseguests.forEach(
        player => {

            player.status =
                "Active";

            player.evictionWeek =
                null;

            player.placement =
                null;

            player.jury =
                false;

            player.votesReceived =
                0;

            player.vetoWins =
                0;

            player.hohWins =
                0;

            player.safety =
                false;

            player.appUsed =
                false;

        }
    );


    updateAllDisplays();
}



/* =========================================================
   SAVE / LOAD
========================================================= */

function saveGame() {

    const state =
        buildSaveState();


    try {

        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(state)
        );


        addEvent(
            "Game saved."
        );


        renderEventLog();

    } catch (error) {

        console.error(
            "Unable to save game:",
            error
        );


        alert(
            "The game could not be saved in this browser."
        );
    }
}


function saveGameSilently() {

    const state =
        buildSaveState();


    try {

        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(state)
        );

    } catch (error) {

        console.warn(
            "Silent save failed:",
            error
        );
    }
}


function buildSaveState() {

    return {

        version:
            1,

        seasonStarted,

        selectedSeason:
            $("seasonSelect")
                ? $("seasonSelect").value
                : "bb20",

        currentWeek,

        currentStage,

        currentHOH,

        nominees:
            [...nominees],

        povWinner,

        povPlayers:
            [...povPlayers],

        vetoUsed,

        evictionTarget,

        evictionVotes:
            {
                ...evictionVotes
            },

        jury:
            [...jury],

        evictedPlayers:
            [...evictedPlayers],

        winner,

        runnerUp,

        houseguests:
            JSON.parse(
                JSON.stringify(
                    houseguests
                )
            ),

        alliances:
            JSON.parse(
                JSON.stringify(
                    alliances
                )
            ),

        relationships:
            JSON.parse(
                JSON.stringify(
                    relationships
                )
            ),

        eventLog:
            JSON.parse(
                JSON.stringify(
                    eventLog
                )
            ),

        weeklyResults:
            JSON.parse(
                JSON.stringify(
                    weeklyResults
                )
            ),

        activeTwistsState:
            [...activeTwistsState]

    };
}


function loadGame() {

    try {

        const raw =
            localStorage.getItem(
                SAVE_KEY
            );


        if (!raw) {

            alert(
                "No saved Big Brother season was found."
            );

            return;
        }


        const state =
            JSON.parse(raw);


        applySaveState(state);


        addEvent(
            "Saved game loaded."
        );


        updateAllDisplays();

        showSection(
            seasonStarted
                ? "game"
                : "cast"
        );

    } catch (error) {

        console.error(
            "Unable to load game:",
            error
        );


        alert(
            "The saved game could not be loaded."
        );
    }
}


function applySaveState(state) {

    if (!state) {
        return;
    }


    seasonStarted =
        Boolean(
            state.seasonStarted
        );


    currentWeek =
        Number(
            state.currentWeek || 1
        );


    currentStage =
        state.currentStage ||
        "opening1";


    currentHOH =
        state.currentHOH ||
        null;


    nominees =
        Array.isArray(
            state.nominees
        )
            ? [...state.nominees]
            : [];


    povWinner =
        state.povWinner ||
        null;


    povPlayers =
        Array.isArray(
            state.povPlayers
        )
            ? [...state.povPlayers]
            : [];


    vetoUsed =
        Boolean(
            state.vetoUsed
        );


    evictionTarget =
        state.evictionTarget ||
        null;


    evictionVotes =
        state.evictionVotes &&
        typeof state.evictionVotes === "object"
            ? {
                ...state.evictionVotes
            }
            : {};


    jury =
        Array.isArray(
            state.jury
        )
            ? [...state.jury]
            : [];


    evictedPlayers =
        Array.isArray(
            state.evictedPlayers
        )
            ? [...state.evictedPlayers]
            : [];


    winner =
        state.winner ||
        null;


    runnerUp =
        state.runnerUp ||
        null;


    if (
        Array.isArray(
            state.houseguests
        )
    ) {

        houseguests =
            state.houseguests;

        normalizeAllHouseguests();
    }


    if (
        Array.isArray(
            state.alliances
        )
    ) {

        alliances =
            state.alliances;
    }


    if (
        Array.isArray(
            state.relationships
        )
    ) {

        relationships =
            state.relationships;
    }


    if (
        Array.isArray(
            state.eventLog
        )
    ) {

        eventLog =
            state.eventLog;
    }


    if (
        state.weeklyResults &&
        typeof state.weeklyResults === "object"
    ) {

        weeklyResults =
            state.weeklyResults;
    }


    if (
        Array.isArray(
            state.activeTwistsState
        )
    ) {

        activeTwistsState =
            [...state.activeTwistsState];
    }


    const seasonSelect =
        $("seasonSelect");


    if (
        seasonSelect &&
        state.selectedSeason
    ) {

        seasonSelect.value =
            state.selectedSeason;
    }
}



/* =========================================================
   RESET BUTTON
========================================================= */

function resetSeason() {

    const confirmed =
        confirm(
            "Reset the entire season? Your current simulation will be erased."
        );


    if (!confirmed) {
        return;
    }


    resetGameState(true);


    localStorage.removeItem(
        SAVE_KEY
    );


    addEvent(
        "Season reset."
    );


    updateAllDisplays();

    showSection("cast");
}



/* =========================================================
   GAME SECTION
========================================================= */

function updateGameDisplay() {

    renderGameHouseguests();

    updateStageDisplay();

    renderEventLog();

    updateSeasonSummary();

    updateEvictionResults();

    renderCeremonyDisplay();
}



/* =========================================================
   STAGE DISPLAY
========================================================= */

function updateStageDisplay() {

    const stage =
        STAGE_DATA[currentStage] ||
        STAGE_DATA.opening1;


    const title =
        $("stageTitle");

    const stageName =
        $("stageName");

    const description =
        $("stageDescription");

    const icon =
        $("stageIcon");

    const weekTitle =
        $("weekTitle");

    const weekBadge =
        $("weekBadge");

    const hohStatus =
        $("hohStatus");

    const nomineesStatus =
        $("nomineesStatus");

    const povStatus =
        $("povStatus");

    const formatStatus =
        $("formatStatus");


    if (title) {
        title.textContent =
            stage.title;
    }


    if (stageName) {
        stageName.textContent =
            stage.name;
    }


    if (description) {
        description.textContent =
            stage.description;
    }


    if (icon) {
        icon.textContent =
            stage.icon || "★";
    }


    if (weekTitle) {

        weekTitle.textContent =
            `WEEK ${currentWeek}`;
    }


    if (weekBadge) {

        weekBadge.textContent =
            `WEEK ${currentWeek}`;
    }


    if (hohStatus) {

        hohStatus.innerHTML =
            currentHOH
                ? `
                    <strong>
                        HOH
                    </strong>

                    <span>
                        ${escapeHTML(
                            getDisplayNameById(
                                currentHOH
                            )
                        )}
                    </span>
                  `
                : `
                    <strong>
                        HOH
                    </strong>

                    <span>
                        Not decided
                    </span>
                  `;
    }


    if (nomineesStatus) {

        nomineesStatus.innerHTML =
            nominees.length
                ? `
                    <strong>
                        NOMINEES
                    </strong>

                    <span>
                        ${nominees
                            .map(
                                id =>
                                    escapeHTML(
                                        getDisplayNameById(
                                            id
                                        )
                                    )
                            )
                            .join(" & ")}
                    </span>
                  `
                : `
                    <strong>
                        NOMINEES
                    </strong>

                    <span>
                        Not decided
                    </span>
                  `;
    }


    if (povStatus) {

        povStatus.innerHTML =
            povWinner
                ? `
                    <strong>
                        POV
                    </strong>

                    <span>
                        ${escapeHTML(
                            getDisplayNameById(
                                povWinner
                            )
                        )}
                    </span>
                  `
                : `
                    <strong>
                        POV
                    </strong>

                    <span>
                        Not decided
                    </span>
                  `;
    }


    if (formatStatus) {

        const template =
            getCurrentSeasonTemplate();


        formatStatus.innerHTML = `

            <strong>
                FORMAT
            </strong>

            <span>
                ${escapeHTML(
                    template
                        ? template.name
                        : "Big Brother"
                )}
            </span>

        `;
    }


    updateProceedButton();

    renderCeremonyDisplay();
}



/* =========================================================
   PROCEED BUTTON
========================================================= */

function updateProceedButton() {

    const button =
        $("proceedButton");

    if (!button) {
        return;
    }


    if (!seasonStarted) {

        button.textContent =
            "START SEASON";

        button.disabled =
            false;

        return;
    }


    const stage =
        STAGE_DATA[currentStage] ||
        STAGE_DATA.opening1;


    button.textContent =
        stage.button ||
        "PROCEED";


    button.disabled =
        currentStage === "finished";
}



/* =========================================================
   EVICTION RESULTS
========================================================= */

function updateEvictionResults() {

    const container =
        $("evictionResults");

    if (!container) {
        return;
    }


    if (
        !evictionTarget &&
        !Object.keys(
            evictionVotes
        ).length
    ) {

        container.innerHTML =
            "";

        return;
    }


    const target =
        evictionTarget
            ? houseguests.find(
                player =>
                    player.id ===
                    evictionTarget
            )
            : null;


    const votes =
        Object.entries(
            evictionVotes
        );


    container.innerHTML = `

        ${
            target
                ? `
                    <div
                        class="eviction-target"
                    >

                        <span>
                            Eviction Target
                        </span>

                        <strong>
                            ${escapeHTML(
                                getDisplayName(target)
                            )}
                        </strong>

                    </div>
                  `
                : ""
        }


        ${
            votes.length
                ? `
                    <div
                        class="eviction-vote-results"
                    >

                        ${votes
                            .map(
                                ([voter, vote]) => `

                                    <div
                                        class="eviction-vote-row"
                                    >

                                        <span>
                                            ${escapeHTML(
                                                getDisplayNameById(
                                                    voter
                                                )
                                            )}
                                        </span>

                                        <strong>
                                            ${escapeHTML(
                                                getDisplayNameById(
                                                    vote
                                                )
                                            )}
                                        </strong>

                                    </div>

                                `
                            )
                            .join("")}

                    </div>
                  `
                : ""
        }

    `;
}



/* =========================================================
   FINISHED STATE
========================================================= */

function showFinale() {

    currentStage =
        "finished";


    const finale =
        $("finaleContent");


    if (!finale) {
        return;
    }


    const champion =
        winner
            ? houseguests.find(
                player =>
                    player.id ===
                    winner
            )
            : null;


    const runner =
        runnerUp
            ? houseguests.find(
                player =>
                    player.id ===
                    runnerUp
            )
            : null;


    finale.innerHTML = `

        <div
            class="finale-winner"
        >

            <div
                class="finale-trophy"
            >
                🏆
            </div>

            <div
                class="finale-label"
            >
                THE WINNER OF
            </div>

            <h2>
                ${
                    champion
                        ? escapeHTML(
                            getDisplayName(
                                champion
                            )
                        )
                        : "UNKNOWN"
                }
            </h2>

            ${
                champion &&
                champion.image
                    ? `
                        <img
                            class="finale-winner-image"
                            src="${escapeAttribute(
                                champion.image
                            )}"
                            alt="${escapeAttribute(
                                getDisplayName(
                                    champion
                                )
                            )}"
                        >
                      `
                    : ""
            }

        </div>


        ${
            runner
                ? `
                    <div
                        class="finale-runner-up"
                    >

                        <span>
                            Runner-Up
                        </span>

                        <strong>
                            ${escapeHTML(
                                getDisplayName(
                                    runner
                                )
                            )}
                        </strong>

                    </div>
                  `
                : ""
        }


        <div
            class="finale-placements"
        >

            <h3>
                Final Placements
            </h3>

            ${
                houseguests
                    .slice()
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            Number(
                                a.placement ||
                                999
                            ) -
                            Number(
                                b.placement ||
                                999
                            )
                    )
                    .map(
                        player => `

                            <div
                                class="finale-placement-row"
                            >

                                <span
                                    class="placement-number"
                                >
                                    ${
                                        player.placement
                                            ? `#${player.placement}`
                                            : "—"
                                    }
                                </span>

                                <span
                                    class="placement-name"
                                >
                                    ${escapeHTML(
                                        getDisplayName(
                                            player
                                        )
                                    )}
                                </span>

                            </div>

                        `
                    )
                    .join("")
            }

        </div>

    `;


    updateAllDisplays();

    renderCeremonyDisplay();
}



/* =========================================================
   CEREMONY PRESENTATION
========================================================= */

function renderCeremonyDisplay() {

    const container =
        document.getElementById(
            "ceremonyContainer"
        );


    if (!container) {
        return;
    }


    const stage =
        STAGE_DATA[currentStage] ||
        STAGE_DATA.opening1;


    const title =
        stage.ceremonyTitle ||
        stage.title ||
        "BIG BROTHER";


    const description =
        stage.ceremonyDescription ||
        stage.description ||
        "";


    let image =
        "";


    if (
        currentStage === "hoh" &&
        currentHOH
    ) {

        const player =
            houseguests.find(
                p =>
                    p.id ===
                    currentHOH
            );


        if (player) {
            image =
                player.image || "";
        }
    }


    if (
        currentStage === "pov" &&
        povWinner
    ) {

        const player =
            houseguests.find(
                p =>
                    p.id ===
                    povWinner
            );


        if (player) {
            image =
                player.image || "";
        }
    }


    container.innerHTML = `

        <div
            class="bb-ceremony-panel"
        >

            <div
                class="bb-ceremony-heading"
            >
                ${escapeHTML(title)}
            </div>


            ${
                image
                    ? `
                        <div
                            class="bb-ceremony-image-wrap"
                        >

                            <img
                                src="${escapeAttribute(image)}"
                                class="bb-ceremony-image"
                                alt=""
                                onerror="this.parentElement.style.display='none';"
                            >

                        </div>
                      `
                    : ""
            }


            <div
                class="bb-ceremony-description"
            >
                ${escapeHTML(description)}
            </div>


            <div
                class="bb-ceremony-status"
            >

                ${
                    currentHOH
                        ? `
                            <span>
                                HOH:
                                <strong>
                                    ${escapeHTML(
                                        getDisplayNameById(
                                            currentHOH
                                        )
                                    )}
                                </strong>
                            </span>
                          `
                        : ""
                }


                ${
                    nominees.length
                        ? `
                            <span>
                                NOMINEES:
                                <strong>
                                    ${nominees
                                        .map(
                                            id =>
                                                escapeHTML(
                                                    getDisplayNameById(
                                                        id
                                                    )
                                                )
                                        )
                                        .join(
                                            " & "
                                        )}
                                </strong>
                            </span>
                          `
                        : ""
                }


                ${
                    povWinner
                        ? `
                            <span>
                                POV:
                                <strong>
                                    ${escapeHTML(
                                        getDisplayNameById(
                                            povWinner
                                        )
                                    )}
                                </strong>
                            </span>
                          `
                        : ""
                }

            </div>

        </div>

    `;
}



/* =========================================================
   PRESENTATION STYLES
========================================================= */

function addPresentationStyles() {

    if (
        document.getElementById(
            "bbPresentationStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "bbPresentationStyles";


    style.textContent = `

        .bb-ceremony-panel {
            border: 1px solid #c8c8c8;
            background: #ffffff;
            margin: 18px 0;
            padding: 20px;
            text-align: center;
        }

        .bb-ceremony-heading {
            font-size: 22px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .08em;
            margin-bottom: 14px;
        }

        .bb-ceremony-image-wrap {
            width: 150px;
            height: 150px;
            margin: 0 auto 14px;
            overflow: hidden;
            border: 1px solid #aaa;
            background: #eee;
        }

        .bb-ceremony-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .bb-ceremony-description {
            color: #444;
            line-height: 1.55;
            margin-bottom: 15px;
        }

        .bb-ceremony-status {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 10px;
        }

        .bb-ceremony-status span {
            border: 1px solid #ccc;
            background: #f7f7f7;
            padding: 7px 10px;
            font-size: 13px;
        }

        .bb-active-twist-grid {
            display: grid;
            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(200px, 1fr)
                );
            gap: 10px;
        }

        .bb-active-twist {
            border: 1px solid #ccc;
            background: #fafafa;
            padding: 12px;
        }

        .bb-active-twist strong {
            display: block;
            margin-bottom: 5px;
        }

        .bb-active-twist span {
            display: block;
            font-size: 13px;
            color: #555;
            line-height: 1.4;
        }

        .bb-alliance-checklist {
            display: grid;
            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(180px, 1fr)
                );
            gap: 8px;
            margin-top: 8px;
        }

        .bb-check-option {
            display: flex;
            align-items: center;
            gap: 8px;
            border: 1px solid #ddd;
            background: #fafafa;
            padding: 8px;
            cursor: pointer;
        }

        .bb-check-option:hover {
            background: #f0f0f0;
        }

        .bb-check-option input {
            margin: 0;
        }

    `;


    document.head.appendChild(
        style
    );
}



/* =========================================================
   CLEAN STAGE PRESENTATION
========================================================= */

function cleanStagePresentation() {

    addPresentationStyles();

    renderCeremonyDisplay();

    renderActiveTwistPanel();

    updateProceedButton();
}



/* =========================================================
   SKIP TO END
========================================================= */

function skipToEnd() {

    if (!seasonStarted) {

        alert(
            "Start a season before skipping to the end."
        );

        return;
    }


    const confirmed =
        confirm(
            "Skip the remaining simulation and generate a completed season?"
        );


    if (!confirmed) {
        return;
    }


    /*
       Continue running the real simulation
       rather than creating a fake result.
    */

    let safetyCounter = 0;


    while (
        currentStage !== "finished" &&
        safetyCounter < 1000
    ) {

        safetyCounter++;


        const previousStage =
            currentStage;

        const previousWeek =
            currentWeek;


        try {

            proceedGame();

        } catch (error) {

            console.error(
                "Simulation error:",
                error
            );

            break;
        }


        if (
            currentStage ===
                previousStage &&
            currentWeek ===
                previousWeek
        ) {
            break;
        }
    }


    updateAllDisplays();

    showSection("finale");
}



/* =========================================================
   GLOBAL PRESENTATION API
========================================================= */

window.renderCeremonyDisplay =
    renderCeremonyDisplay;

window.cleanStagePresentation =
    cleanStagePresentation;

window.skipToEnd =
    skipToEnd;



/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        addPresentationStyles();

        normalizeAllHouseguests();

        updateAllDisplays();

        renderCeremonyDisplay();

        renderActiveTwistPanel();

    }
);

/* =========================================================
   SIMULATION ENGINE HELPERS
========================================================= */

function getActiveHouseguests() {

    return houseguests.filter(
        player =>
            player.status === "Active"
    );
}


function getEligiblePlayers() {

    return getActiveHouseguests()
        .filter(
            player =>
                !player.safety
        );
}


function getRandomItem(array) {

    if (
        !Array.isArray(array) ||
        !array.length
    ) {
        return null;
    }

    return array[
        Math.floor(
            Math.random() *
            array.length
        )
    ];
}


function shuffle(array) {

    const result =
        Array.isArray(array)
            ? [...array]
            : [];


    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }


    return result;
}



/* =========================================================
   PLAYER STRENGTH CALCULATIONS
========================================================= */

function getCompetitionScore(
    player,
    category = "overall"
) {

    if (!player) {
        return 0;
    }


    normalizeHouseguest(player);


    let score = 0;


    switch (category) {

        case "physical":

            score =
                player.physical * 1.0 +
                player.mental * 0.15 +
                player.social * 0.10 +
                player.strategy * 0.10;

            break;


        case "mental":

            score =
                player.mental * 1.0 +
                player.strategy * 0.30 +
                player.social * 0.10 +
                player.physical * 0.05;

            break;


        case "social":

            score =
                player.social * 1.0 +
                player.strategy * 0.25 +
                player.mental * 0.10;

            break;


        case "strategy":

            score =
                player.strategy * 1.0 +
                player.social * 0.30 +
                player.mental * 0.20;

            break;


        default:

            score =
                player.physical * 0.25 +
                player.mental * 0.25 +
                player.social * 0.25 +
                player.strategy * 0.25;

            break;
    }


    /*
       Small randomness prevents the highest-rated
       player from automatically winning every time.
    */

    const variance =
        Math.random() * 5;


    return score + variance;
}


function getBestCompetitionPlayer(
    players,
    category = "overall"
) {

    if (
        !Array.isArray(players) ||
        !players.length
    ) {
        return null;
    }


    let best =
        players[0];

    let bestScore =
        getCompetitionScore(
            best,
            category
        );


    for (
        let i = 1;
        i < players.length;
        i++
    ) {

        const score =
            getCompetitionScore(
                players[i],
                category
            );


        if (
            score >
            bestScore
        ) {

            best =
                players[i];

            bestScore =
                score;
        }
    }


    return best;
}



/* =========================================================
   SOCIAL / STRATEGIC SCORING
========================================================= */

function getRelationshipValue(
    fromId,
    toId
) {

    if (
        !fromId ||
        !toId
    ) {
        return 0;
    }


    const relationship =
        relationships.find(
            item =>
                item.from === fromId &&
                item.to === toId
        );


    if (!relationship) {
        return 0;
    }


    const type =
        String(
            relationship.type ||
            "Neutral"
        )
        .toLowerCase();


    if (
        type.includes("love") ||
        type.includes("showmance")
    ) {
        return 8;
    }


    if (
        type.includes("friend") ||
        type.includes("ally")
    ) {
        return 5;
    }


    if (
        type.includes("like")
    ) {
        return 3;
    }


    if (
        type.includes("enemy") ||
        type.includes("hate")
    ) {
        return -8;
    }


    if (
        type.includes("dislike")
    ) {
        return -4;
    }


    return 0;
}


function getAllianceValue(
    fromId,
    toId
) {

    if (
        !fromId ||
        !toId
    ) {
        return 0;
    }


    const alliance =
        alliances.find(
            item =>
                Array.isArray(
                    item.members
                ) &&
                item.members.includes(
                    fromId
                ) &&
                item.members.includes(
                    toId
                )
        );


    if (!alliance) {
        return 0;
    }


    return Number(
        alliance.strength || 5
    );
}


function getStrategicScore(
    player,
    targetId = null
) {

    if (!player) {
        return 0;
    }


    let score =
        player.strategy * 2;


    score +=
        player.social;


    if (
        targetId &&
        targetId !== player.id
    ) {

        score +=
            getRelationshipValue(
                player.id,
                targetId
            );

        score +=
            getRelationshipValue(
                targetId,
                player.id
            );

        score +=
            getAllianceValue(
                player.id,
                targetId
            );
    }


    score +=
        Math.random() * 8;


    return score;
}



/* =========================================================
   HOH COMPETITION
========================================================= */

function runHOH() {

    const players =
        getActiveHouseguests();


    if (players.length < 2) {

        setStage(
            "finished"
        );

        return;
    }


    const template =
        getCurrentSeasonTemplate();


    const category =
        getCompetitionCategory(
            "hoh"
        );


    const winnerPlayer =
        getBestCompetitionPlayer(
            players,
            category
        );


    if (!winnerPlayer) {
        return;
    }


    currentHOH =
        winnerPlayer.id;


    winnerPlayer.hohWins =
        Number(
            winnerPlayer.hohWins || 0
        ) + 1;


    /*
       HOH cannot nominate themselves.
    */

    winnerPlayer.safety =
        true;


    addEvent({

        week:
            currentWeek,

        type:
            "competition",

        text:
            `${getDisplayName(winnerPlayer)} won Head of Household.`

    });


    if (
        template &&
        Array.isArray(
            template.competitions
        )
    ) {

        const competition =
            template.competitions.find(
                item =>
                    Number(item.week) ===
                    Number(currentWeek) &&
                    (
                        item.type ===
                        "HOH"
                    )
            );


        if (
            competition &&
            competition.name
        ) {

            addEvent({

                week:
                    currentWeek,

                type:
                    "competition",

                text:
                    `The HOH competition was "${competition.name}".`

            });
        }
    }


    setStage(
        "appstore"
    );
}



/* =========================================================
   COMPETITION CATEGORY
========================================================= */

function getCompetitionCategory(
    type
) {

    const template =
        getCurrentSeasonTemplate();


    if (
        template &&
        template.competitionCategories &&
        template.competitionCategories[type]
    ) {

        return (
            template.competitionCategories[type]
        );
    }


    const random =
        Math.random();


    if (
        type === "hoh"
    ) {

        if (
            random < 0.35
        ) {
            return "physical";
        }

        if (
            random < 0.70
        ) {
            return "mental";
        }

        if (
            random < 0.88
        ) {
            return "strategy";
        }

        return "overall";
    }


    if (
        type === "pov"
    ) {

        if (
            random < 0.30
        ) {
            return "physical";
        }

        if (
            random < 0.65
        ) {
            return "mental";
        }

        if (
            random < 0.82
        ) {
            return "strategy";
        }

        return "overall";
    }


    return "overall";
}



/* =========================================================
   APP STORE / SPECIAL POWER STAGE
========================================================= */

function runAppStore() {

    const players =
        getActiveHouseguests();


    if (!players.length) {

        setStage(
            "nominations"
        );

        return;
    }


    const eligible =
        players.filter(
            player =>
                !player.appUsed
        );


    /*
       The app store is optional. Most weeks nobody
       receives a power unless the season format
       explicitly enables one.
    */

    const template =
        getCurrentSeasonTemplate();


    const enabled =
        Boolean(
            template &&
            template.appStore
        );


    if (
        enabled &&
        eligible.length &&
        Math.random() < 0.20
    ) {

        const player =
            getRandomItem(
                eligible
            );


        if (player) {

            player.appUsed =
                true;

            player.safety =
                true;


            addEvent({

                week:
                    currentWeek,

                type:
                    "twist",

                text:
                    `${getDisplayName(player)} received temporary safety from the App Store.`

            });
        }
    }


    setStage(
        "nominations"
    );
}



/* =========================================================
   NOMINATION ENGINE
========================================================= */

function makeNominations() {

    const players =
        getActiveHouseguests();


    if (
        players.length <= 3
    ) {

        /*
           Endgame nomination logic.
        */

        makeEndgameNominations();

        return;
    }


    if (!currentHOH) {

        const fallback =
            getBestCompetitionPlayer(
                players,
                "overall"
            );


        if (fallback) {
            currentHOH =
                fallback.id;
        }
    }


    const eligible =
        players.filter(
            player =>
                player.id !==
                currentHOH &&
                !player.safety
        );


    if (
        eligible.length < 2
    ) {

        nominees =
            eligible.map(
                player =>
                    player.id
            );

        setStage(
            "povDraw"
        );

        return;
    }


    const scored =
        eligible
            .map(player => {

                let score =
                    0;


                /*
                   Strategic targeting:
                   high strategy players can be
                   targeted as threats.
                */

                score +=
                    player.strategy *
                    1.5;


                score +=
                    player.social *
                    0.4;


                /*
                   Strong enemies of the HOH are
                   more likely to be nominated.
                */

                if (currentHOH) {

                    score -=
                        getRelationshipValue(
                            currentHOH,
                            player.id
                        ) * 0.8;

                    score -=
                        getAllianceValue(
                            currentHOH,
                            player.id
                        ) * 0.5;
                }


                /*
                   Randomness creates organic nominations.
                */

                score +=
                    Math.random() * 15;


                return {
                    player,
                    score
                };

            })
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            );


    nominees =
        scored
            .slice(
                0,
                2
            )
            .map(
                item =>
                    item.player.id
            );


    nominees.forEach(
        id => {

            const player =
                houseguests.find(
                    p =>
                        p.id === id
                );


            if (player) {

                player.safety =
                    false;
            }
        }
    );


    const nomineeNames =
        nominees
            .map(
                id =>
                    getDisplayNameById(id)
            );


    addEvent({

        week:
            currentWeek,

        type:
            "nomination",

        text:
            `${getDisplayNameById(currentHOH)} nominated ${nomineeNames.join(" and ")} for eviction.`

    });


    setStage(
        "hacker"
    );
}



/* =========================================================
   ENDGAME NOMINATIONS
========================================================= */

function makeEndgameNominations() {

    const players =
        getActiveHouseguests();


    if (
        players.length === 3
    ) {

        nominees =
            players
                .filter(
                    p =>
                        p.id !==
                        currentHOH
                )
                .map(
                    p =>
                        p.id
                );


        addEvent({

            week:
                currentWeek,

            type:
                "nomination",

            text:
                "With only three Houseguests remaining, the two non-HOH players are automatically nominated."

        });


        setStage(
            "povDraw"
        );

        return;
    }


    if (
        players.length === 2
    ) {

        nominees =
            players
                .filter(
                    p =>
                        p.id !==
                        currentHOH
                )
                .map(
                    p =>
                        p.id
                );


        setStage(
            "finalEviction"
        );

        return;
    }


    nominees =
        [];


    setStage(
        "povDraw"
    );
}



/* =========================================================
   HACKER COMPETITION
========================================================= */

function runHackerCompetition() {

    const template =
        getCurrentSeasonTemplate();


    const enabled =
        Boolean(
            template &&
            template.hackerCompetition
        );


    if (!enabled) {

        setStage(
            "povDraw"
        );

        return;
    }


    const players =
        getActiveHouseguests()
            .filter(
                player =>
                    player.id !==
                    currentHOH
            );


    if (!players.length) {

        setStage(
            "povDraw"
        );

        return;
    }


    const winnerPlayer =
        getBestCompetitionPlayer(
            players,
            "mental"
        );


    if (!winnerPlayer) {

        setStage(
            "povDraw"
        );

        return;
    }


    winnerPlayer.hackerWins =
        Number(
            winnerPlayer.hackerWins || 0
        ) + 1;


    addEvent({

        week:
            currentWeek,

        type:
            "competition",

        text:
            `${getDisplayName(winnerPlayer)} won the Hacker Competition.`

    });


    /*
       In this clean version the Hacker Competition
       does not automatically rewrite nominations.
       The format can add that behavior later.
    */


    setStage(
        "povDraw"
    );
}



/* =========================================================
   POV PLAYER DRAW
========================================================= */

function drawPOVPlayers() {

    const players =
        getActiveHouseguests();


    if (
        players.length <= 3
    ) {

        povPlayers =
            [...players]
                .map(
                    player =>
                        player.id
                );


        setStage(
            "pov"
        );

        return;
    }


    const selected =
        [];


    /*
       HOH participates.
    */

    if (currentHOH) {

        selected.push(
            currentHOH
        );
    }


    /*
       Both nominees participate.
    */

    nominees.forEach(
        id => {

            if (
                !selected.includes(id)
            ) {

                selected.push(id);
            }

        }
    );


    const remaining =
        players
            .filter(
                player =>
                    !selected.includes(
                        player.id
                    )
            );


    const randomPlayers =
        shuffle(
            remaining
        );


    /*
       Standard six-player POV field.
    */

    while (
        selected.length < 6 &&
        randomPlayers.length
    ) {

        selected.push(
            randomPlayers.shift().id
        );
    }


    povPlayers =
        selected;


    const names =
        povPlayers
            .map(
                id =>
                    getDisplayNameById(id)
            );


    addEvent({

        week:
            currentWeek,

        type:
            "pov",

        text:
            `The Power of Veto players were drawn: ${names.join(", ")}.`

    });


    setStage(
        "pov"
    );
}



/* =========================================================
   POWER OF VETO
========================================================= */

function runPOV() {

    const players =
        povPlayers
            .map(
                id =>
                    houseguests.find(
                        player =>
                            player.id === id
                    )
            )
            .filter(Boolean);


    if (!players.length) {

        setStage(
            "veto"
        );

        return;
    }


    const winnerPlayer =
        getBestCompetitionPlayer(
            players,
            getCompetitionCategory(
                "pov"
            )
        );


    if (!winnerPlayer) {

        setStage(
            "veto"
        );

        return;
    }


    povWinner =
        winnerPlayer.id;


    winnerPlayer.vetoWins =
        Number(
            winnerPlayer.vetoWins || 0
        ) + 1;


    vetoUsed =
        false;


    addEvent({

        week:
            currentWeek,

        type:
            "competition",

        text:
            `${getDisplayName(winnerPlayer)} won the Power of Veto.`

    });


    setStage(
        "veto"
    );
}



/* =========================================================
   USE POWER OF VETO
========================================================= */

function usePOV() {

    if (!povWinner) {

        setStage(
            "evictionVoting"
        );

        return;
    }


    const winnerPlayer =
        houseguests.find(
            player =>
                player.id ===
                povWinner
        );


    if (!winnerPlayer) {

        setStage(
            "evictionVoting"
        );

        return;
    }


    const canUse =
        nominees.includes(
            povWinner
        )
        ||
        shouldUseVeto(
            winnerPlayer
        );


    if (!canUse) {

        addEvent({

            week:
                currentWeek,

            type:
                "veto",

            text:
                `${getDisplayName(winnerPlayer)} chose not to use the Power of Veto.`

        });


        vetoUsed =
            false;


        setStage(
            "evictionVoting"
        );

        return;
    }


    /*
       If the veto winner is a nominee,
       they automatically remove themselves.
    */

    let removedNominee =
        null;


    if (
        nominees.includes(
            povWinner
        )
    ) {

        removedNominee =
            povWinner;

    } else {

        /*
           Otherwise remove the nominee with the
           weakest relationship to the veto winner.
        */

        const ranked =
            nominees
                .map(id => {

                    const player =
                        houseguests.find(
                            p =>
                                p.id === id
                        );


                    let score =
                        0;


                    if (player) {

                        score +=
                            getRelationshipValue(
                                povWinner,
                                player.id
                            );

                        score +=
                            getAllianceValue(
                                povWinner,
                                player.id
                            );
                    }


                    score +=
                        Math.random() * 5;


                    return {
                        id,
                        score
                    };

                })
                .sort(
                    (a, b) =>
                        a.score -
                        b.score
                );


        removedNominee =
            ranked.length
                ? ranked[0].id
                : nominees[0];
    }


    nominees =
        nominees.filter(
            id =>
                id !==
                removedNominee
        );


    vetoUsed =
        true;


    addEvent({

        week:
            currentWeek,

        type:
            "veto",

        text:
            `${getDisplayName(winnerPlayer)} used the Power of Veto on ${getDisplayNameById(removedNominee)}.`

    });


    replaceNominee(
        removedNominee
    );


    setStage(
        "evictionVoting"
    );
}



/* =========================================================
   VETO DECISION
========================================================= */

function shouldUseVeto(
    player
) {

    if (!player) {
        return false;
    }


    /*
       Higher strategic players are more likely
       to use the veto when they or an ally is
       threatened.
    */

    let chance =
        0.25;


    chance +=
        player.strategy *
        0.035;


    chance +=
        player.social *
        0.015;


    const threatened =
        nominees.some(
            nomineeId => {

                return (
                    getRelationshipValue(
                        player.id,
                        nomineeId
                    ) > 3
                );
            }
        );


    if (threatened) {
        chance += 0.30;
    }


    return (
        Math.random() <
        Math.min(
            0.90,
            chance
        )
    );
}



/* =========================================================
   NOMINEE REPLACEMENT
========================================================= */

function replaceNominee(
    removedNominee
) {

    const players =
        getActiveHouseguests();


    const eligible =
        players.filter(
            player =>
                player.id !==
                    currentHOH &&
                !nominees.includes(
                    player.id
                ) &&
                player.id !==
                    povWinner &&
                player.id !==
                    removedNominee &&
                !player.safety
        );


    if (!eligible.length) {
        return;
    }


    const ranked =
        eligible
            .map(player => {

                let score =
                    player.strategy;


                score +=
                    player.social *
                    0.5;


                score +=
                    Math.random() *
                    10;


                return {
                    player,
                    score
                };

            })
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            );


    const replacement =
        ranked[0].player;


    nominees.push(
        replacement.id
    );


    addEvent({

        week:
            currentWeek,

        type:
            "nomination",

        text:
            `${getDisplayName(replacement)} became the replacement nominee.`

    });
}



/* =========================================================
   EVICTION VOTE PREPARATION
========================================================= */

function prepareEvictionVotes() {

    const players =
        getActiveHouseguests();


    if (
        nominees.length <= 1
    ) {

        evictionTarget =
            nominees[0] ||
            null;


        setStage(
            "eviction"
        );

        return;
    }


    const eligibleVoters =
        players.filter(
            player =>
                player.id !==
                currentHOH &&
                !nominees.includes(
                    player.id
                )
        );


    evictionVotes =
        {};


    /*
       Each voter chooses between nominees based
       on relationships, alliances and strategy.
    */

    eligibleVoters.forEach(
        voter => {

            const choices =
                nominees
                    .map(
                        nomineeId => {

                            const nominee =
                                houseguests.find(
                                    player =>
                                        player.id ===
                                        nomineeId
                                );


                            if (!nominee) {
                                return null;
                            }


                            let score =
                                0;


                            /*
                               Positive relationship
                               makes eviction less likely.
                            */

                            score +=
                                getRelationshipValue(
                                    voter.id,
                                    nominee.id
                                ) * 1.5;


                            score +=
                                getRelationshipValue(
                                    nominee.id,
                                    voter.id
                                );


                            /*
                               Alliance members are
                               less likely to evict one
                               another.
                            */

                            score +=
                                getAllianceValue(
                                    voter.id,
                                    nominee.id
                                ) * 1.2;


                            /*
                               Strategic threats are
                               more likely to be evicted.
                            */

                            score -=
                                nominee.strategy *
                                0.75;


                            score -=
                                nominee.social *
                                0.25;


                            score +=
                                Math.random() *
                                12;


                            return {
                                nominee,
                                score
                            };

                        }
                    )
                    .filter(Boolean)
                    .sort(
                        (a, b) =>
                            b.score -
                            a.score
                    );


            if (
                choices.length
            ) {

                /*
                   The lowest score is the player
                   the voter wants out.
                */

                const vote =
                    choices[
                        choices.length - 1
                    ];


                if (vote) {

                    evictionVotes[
                        voter.id
                    ] =
                        vote.nominee.id;
                }
            }

        }
    );


    const voteCounts =
        {};


    Object.values(
        evictionVotes
    ).forEach(
        targetId => {

            voteCounts[targetId] =
                Number(
                    voteCounts[targetId] || 0
                ) + 1;

        }
    );


    const ranked =
        Object.entries(
            voteCounts
        )
        .sort(
            (a, b) =>
                b[1] -
                a[1]
        );


    if (ranked.length) {

        evictionTarget =
            ranked[0][0];

    } else {

        evictionTarget =
            nominees[0];
    }


    addEvent({

        week:
            currentWeek,

        type:
            "eviction",

        text:
            "The Houseguests have cast their eviction votes."

    });


    setStage(
        "eviction"
    );
}



/* =========================================================
   REVEAL NEXT EVICTION VOTE
========================================================= */

function revealNextEvictionVote() {

    /*
       All votes have already been determined.
       This stage reveals the result and advances
       the simulation.
    */

    if (!evictionTarget) {

        const targets =
            Object.values(
                evictionVotes
            );


        if (targets.length) {

            const counts =
                {};


            targets.forEach(
                id => {

                    counts[id] =
                        Number(
                            counts[id] || 0
                        ) + 1;

                }
            );


            evictionTarget =
                Object.entries(
                    counts
                )
                .sort(
                    (a, b) =>
                        b[1] -
                        a[1]
                )[0][0];

        } else {

            evictionTarget =
                nominees[0] ||
                null;
        }
    }


    if (!evictionTarget) {

        setStage(
            "nextcycle"
        );

        return;
    }


    const evicted =
        houseguests.find(
            player =>
                player.id ===
                evictionTarget
        );


    if (!evicted) {

        setStage(
            "nextcycle"
        );

        return;
    }


    evicted.status =
        "Evicted";


    evicted.evictionWeek =
        currentWeek;


    evicted.placement =
        getActiveHouseguests().length +
        1;


    evicted.jury =
        shouldEnterJury(
            evicted
        );


    evictedPlayers.push(
        evicted.id
    );


    if (
        evicted.jury &&
        !jury.includes(
            evicted.id
        )
    ) {

        jury.push(
            evicted.id
        );
    }


    const voteCount =
        Object.values(
            evictionVotes
        )
        .filter(
            id =>
                id ===
                evicted.id
        )
        .length;


    addEvent({

        week:
            currentWeek,

        type:
            "eviction",

        text:
            `${getDisplayName(evicted)} was evicted by a vote of ${voteCount}.`

    });


    weeklyResults[
        currentWeek
    ] = {

        ...(weeklyResults[
            currentWeek
        ] || {}),

        hoh:
            currentHOH,

        nominees:
            [...nominees],

        pov:
            povWinner,

        evicted:
            evicted.id,

        evictionVotes:
            {
                ...evictionVotes
            }

    };


    nominees =
        [];


    povPlayers =
        [];


    povWinner =
        null;


    vetoUsed =
        false;


    evictionTarget =
        null;


    evictionVotes =
        {};


    /*
       Reset temporary safety.
    */

    houseguests.forEach(
        player => {

            if (
                player.status ===
                "Active"
            ) {

                player.safety =
                    false;
            }

        }
    );


    /*
       If enough players remain, continue.
    */

    const remaining =
        getActiveHouseguests();


    if (
        remaining.length <= 3
    ) {

        setStage(
            "finalHOH1"
        );

        return;
    }


    setStage(
        "nextcycle"
    );
}



/* =========================================================
   JURY ELIGIBILITY
========================================================= */

function shouldEnterJury(
    player
) {

    const template =
        getCurrentSeasonTemplate();


    if (!template) {
        return false;
    }


    const jurySize =
        Number(
            template.jurySize || 9
        );


    /*
       The last N evicted players become jury members.
       Since placement is calculated from the remaining
       active players, we use the season size to determine
       whether this player is within the jury range.
    */

    const totalPlayers =
        houseguests.length;


    const minimumJuryPlacement =
        Math.max(
            3,
            totalPlayers -
            jurySize
        );


    const placement =
        Number(
            player.placement || 999
        );


    return (
        placement >=
        minimumJuryPlacement
    );
}



/* =========================================================
   NEXT WEEK / CYCLE
========================================================= */

function beginNextCycleOrWeek() {

    const remaining =
        getActiveHouseguests();


    if (
        remaining.length <= 3
    ) {

        setStage(
            "finalHOH1"
        );

        return;
    }


    currentWeek =
        Number(
            currentWeek || 1
        ) + 1;


    currentHOH =
        null;


    nominees =
        [];


    povWinner =
        null;


    povPlayers =
        [];


    vetoUsed =
        false;


    evictionTarget =
        null;


    evictionVotes =
        {};


    houseguests.forEach(
        player => {

            if (
                player.status ===
                "Active"
            ) {

                player.safety =
                    false;
            }

        }
    );


    addEvent({

        week:
            currentWeek,

        type:
            "week",

        text:
            `Week ${currentWeek} has begun.`

    });


    const template =
        getCurrentSeasonTemplate();


    const totalWeeks =
        Number(
            template &&
            template.weeks
                ? template.weeks
                : 13
        );


    if (
        currentWeek >
        totalWeeks
    ) {

        setStage(
            "finalHOH1"
        );

        return;
    }


    setStage(
        "hoh"
    );
}



/* =========================================================
   FINAL THREE — HOH PART 1
========================================================= */

function runFinalHOHPart(
    part
) {

    const players =
        getActiveHouseguests();


    if (
        players.length >
        3
    ) {

        setStage(
            "hoh"
        );

        return;
    }


    if (
        part === 1
    ) {

        const winnerPlayer =
            getBestCompetitionPlayer(
                players,
                "physical"
            );


        if (winnerPlayer) {

            winnerPlayer.finalHOHPart1 =
                true;


            addEvent({

                week:
                    currentWeek,

                type:
                    "competition",

                text:
                    `${getDisplayName(winnerPlayer)} won Part 1 of the Final HOH.`

            });
        }


        setStage(
            "finalHOH2"
        );

        return;
    }


    if (
        part === 2
    ) {

        const remaining =
            players.filter(
                player =>
                    !player.finalHOHPart1
            );


        const winnerPlayer =
            getBestCompetitionPlayer(
                remaining,
                "mental"
            );


        if (winnerPlayer) {

            winnerPlayer.finalHOHPart2 =
                true;


            addEvent({

                week:
                    currentWeek,

                type:
                    "competition",

                text:
                    `${getDisplayName(winnerPlayer)} won Part 2 of the Final HOH.`

            });
        }


        setStage(
            "finalHOH3"
        );

        return;
    }


    if (
        part === 3
    ) {

        const eligible =
            players.filter(
                player =>
                    !player.finalHOHPart1 &&
                    !player.finalHOHPart2
            );


        const combined =
            players
                .filter(
                    player =>
                        player.finalHOHPart1 ||
                        player.finalHOHPart2
                );


        let winnerPlayer =
            getBestCompetitionPlayer(
                eligible.length
                    ? eligible
                    : combined,
                "mental"
            );


        if (!winnerPlayer) {

            winnerPlayer =
                getBestCompetitionPlayer(
                    players,
                    "overall"
                );
        }


        if (winnerPlayer) {

            currentHOH =
                winnerPlayer.id;


            winnerPlayer.hohWins =
                Number(
                    winnerPlayer.hohWins || 0
                ) + 1;


            addEvent({

                week:
                    currentWeek,

                type:
                    "competition",

                text:
                    `${getDisplayName(winnerPlayer)} won the Final HOH.`

            });
        }


        setStage(
            "finalEviction"
        );
    }
}



/* =========================================================
   FINAL EVICTION
========================================================= */

function runFinalEviction() {

    const players =
        getActiveHouseguests();


    if (
        players.length <= 2
    ) {

        setStage(
            "juryVote"
        );

        return;
    }


    const nonHOH =
        players.filter(
            player =>
                player.id !==
                currentHOH
        );


    if (!nonHOH.length) {

        setStage(
            "juryVote"
        );

        return;
    }


    const scores =
        nonHOH
            .map(player => {

                let score =
                    player.strategy *
                    1.5;


                score +=
                    player.social;


                score +=
                    Math.random() *
                    10;


                return {
                    player,
                    score
                };

            })
            .sort(
                (a, b) =>
                    a.score -
                    b.score
            );


    const eliminated =
        scores[0].player;


    eliminated.status =
        "Evicted";


    eliminated.evictionWeek =
        currentWeek;


    eliminated.placement =
        3;


    eliminated.jury =
        true;


    if (
        !jury.includes(
            eliminated.id
        )
    ) {

        jury.push(
            eliminated.id
        );
    }


    evictedPlayers.push(
        eliminated.id
    );


    addEvent({

        week:
            currentWeek,

        type:
            "eviction",

        text:
            `${getDisplayNameById(currentHOH)} evicted ${getDisplayName(eliminated)} at Final Three.`

    });


    const finalTwo =
        getActiveHouseguests();


    finalTwo.forEach(
        player => {

            player.placement =
                player.id ===
                currentHOH
                    ? 1
                    : 2;

        }
    );


    setStage(
        "juryVote"
    );
}



/* =========================================================
   JURY VOTE
========================================================= */

function revealNextJuryVote() {

    const finalists =
        getActiveHouseguests();


    if (
        finalists.length !== 2
    ) {

        finishSeason(
            finalists
        );

        return;
    }


    const scores =
        finalists.map(
            finalist => {

                let score =
                    finalist.strategy *
                    1.25;


                score +=
                    finalist.social *
                    1.5;


                score +=
                    finalist.mental *
                    0.5;


                score +=
                    finalist.physical *
                    0.25;


                /*
                   Jury relationships strongly affect
                   the final vote.
                */

                jury.forEach(
                    jurorId => {

                        score +=
                            getRelationshipValue(
                                jurorId,
                                finalist.id
                            );

                        score +=
                            getAllianceValue(
                                jurorId,
                                finalist.id
                            ) * 0.5;

                    }
                );


                score +=
                    Math.random() *
                    15;


                return {
                    finalist,
                    score
                };

            }
        )
        .sort(
            (a, b) =>
                b.score -
                a.score
        );


    const champion =
        scores[0].finalist;

    const runner =
        scores[1].finalist;


    winner =
        champion.id;


    runnerUp =
        runner.id;


    champion.placement =
        1;


    runner.placement =
        2;


    addEvent({

        week:
            currentWeek,

        type:
            "finale",

        text:
            `${getDisplayName(champion)} won the Big Brother season!`

    });


    addEvent({

        week:
            currentWeek,

        type:
            "finale",

        text:
            `${getDisplayName(runner)} finished as the runner-up.`

    });


    finishSeason(
        finalists
    );
}



/* =========================================================
   FINISH SEASON
========================================================= */

function finishSeason(
    finalists
) {

    const players =
        Array.isArray(
            finalists
        )
            ? finalists
            : getActiveHouseguests();


    if (
        !winner &&
        players.length
    ) {

        const sorted =
            [...players]
                .sort(
                    (a, b) =>
                        getStrategicScore(
                            b
                        ) -
                        getStrategicScore(
                            a
                        )
                );


        winner =
            sorted[0]
                ? sorted[0].id
                : null;


        runnerUp =
            sorted[1]
                ? sorted[1].id
                : null;
    }


    players.forEach(
        player => {

            if (
                player.id ===
                winner
            ) {

                player.placement =
                    1;

            } else if (
                player.id ===
                runnerUp
            ) {

                player.placement =
                    2;
            }

        }
    );


    seasonStarted =
        true;


    currentStage =
        "finished";


    updateAllDisplays();

    showSection(
        "finale"
    );


    saveGameSilently();
}



/* =========================================================
   ADD EVENT
========================================================= */

function addEvent(
    event
) {

    if (
        typeof event ===
        "string"
    ) {

        eventLog.push({
            week:
                currentWeek,

            type:
                "general",

            text:
                event
        });

        return;
    }


    if (!event) {
        return;
    }


    eventLog.push({

        week:
            event.week ??
            currentWeek,

        type:
            event.type ||
            "general",

        text:
            event.text ||
            ""

    });


    /*
       Keep the log manageable.
    */

    if (
        eventLog.length >
        500
    ) {

        eventLog =
            eventLog.slice(
                -500
            );
    }
}



/* =========================================================
   GLOBAL ENGINE API
========================================================= */

window.runHOH =
    runHOH;

window.makeNominations =
    makeNominations;

window.drawPOVPlayers =
    drawPOVPlayers;

window.runPOV =
    runPOV;

window.usePOV =
    usePOV;

window.prepareEvictionVotes =
    prepareEvictionVotes;

window.revealNextEvictionVote =
    revealNextEvictionVote;

window.beginNextCycleOrWeek =
    beginNextCycleOrWeek;

window.runFinalHOHPart =
    runFinalHOHPart;

window.runFinalEviction =
    runFinalEviction;

window.revealNextJuryVote =
    revealNextJuryVote;

            .join("");
}



/* =========================================================
   ALLIANCES
========================================================= */

function createAlliance() {

    const name =
        $("allianceName").value.trim();

    const members =
        Array.from(
            $("allianceMembers").selectedOptions
        ).map(option => option.value);


    if (!name) {
        alert("Enter an alliance name.");
        return;
    }

    if (members.length < 2) {
        alert("An alliance needs at least two Houseguests.");
        return;
    }


    alliances.push({

        id:
            "alliance_" +
            Date.now(),

        name,

        members

    });


    $("allianceName").value = "";

    updateAllDisplays();

    saveGameSilently();
}


function renderAlliances() {

    if (!alliances.length) {

        $("allianceList").innerHTML =
            `<div class="panel">
                No alliances created yet.
             </div>`;

        return;
    }


    $("allianceList").innerHTML =
        alliances
            .map(alliance => {

                const members =
                    alliance.members
                        .map(id =>
                            houseguests.find(
                                p => p.id === id
                            )
                        )
                        .filter(Boolean);


                return `

                    <div class="alliance-card">

                        <h3>
                            ${escapeHTML(
                                alliance.name
                            )}
                        </h3>


                        <div class="alliance-members">

                            ${members
                                .map(player => `

                                    <div class="alliance-member">

                                        ${getPlayerImageHTML(
                                            player,
                                            ""
                                        )}

                                        <div class="alliance-member-name">

                                            ${escapeHTML(
                                                getDisplayName(player)
                                            )}

                                        </div>

                                    </div>

                                `)
                                .join("")}

                        </div>

                    </div>

                `;

            })
            .join("");
}


function updateAllianceDropdown() {

    const select =
        $("allianceMembers");

    if (!select) {
        return;
    }


    const selected =
        Array.from(
            select.selectedOptions
        ).map(option => option.value);


    select.innerHTML =
        houseguests
            .map(player => {

                return `
                    <option
                        value="${player.id}"
                        ${
                            selected.includes(player.id)
                                ? "selected"
                                : ""
                        }>

                        ${escapeHTML(
                            getDisplayName(player)
                        )}

                    </option>
                `;

            })
            .join("");
}



/* =========================================================
   RELATIONSHIP SYSTEM
========================================================= */


/*
   This is the critical change.

   The user chooses:

   Houseguest A
   ↓
   Houseguest B
   ↓
   Love / Like / Neutral / Dislike / Hate

   The simulator internally converts those labels into
   numerical values for the AI.
*/

const relationshipValues = {

    love: 100,
    like: 65,
    neutral: 0,
    dislike: -65,
    hate: -100

};


const relationshipLabels = {

    love: "Love",

    like: "Like",

    neutral: "Neutral",

    dislike: "Dislike",

    hate: "Hate"

};


function findRelationship(
    fromId,
    toId
) {

    return relationships.find(
        relationship =>
            relationship.from === fromId &&
            relationship.to === toId
    );

}


function getRelationshipValue(
    fromId,
    toId
) {

    if (fromId === toId) {
        return 0;
    }


    const relationship =
        findRelationship(
            fromId,
            toId
        );


    if (!relationship) {
        return 0;
    }


    if (
        typeof relationship.value ===
        "number"
    ) {
        return relationship.value;
    }


    if (
        relationship.type &&
        relationshipValues[
            relationship.type
        ] !== undefined
    ) {

        return relationshipValues[
            relationship.type
        ];

    }


    return 0;
}


function getRelationshipType(
    fromId,
    toId
) {

    const relationship =
        findRelationship(
            fromId,
            toId
        );


    if (!relationship) {
        return "neutral";
    }


    if (
        relationship.type &&
        relationshipValues[
            relationship.type
        ] !== undefined
    ) {

        return relationship.type;

    }


    const value =
        Number(
            relationship.value || 0
        );


    if (value >= 80) {
        return "love";
    }

    if (value >= 30) {
        return "like";
    }

    if (value <= -80) {
        return "hate";
    }

    if (value <= -30) {
        return "dislike";
    }


    return "neutral";
}


function setRelationship(
    fromId,
    toId,
    type
) {

    if (
        !fromId ||
        !toId ||
        fromId === toId
    ) {
        return;
    }


    const value =
        relationshipValues[type] ??
        0;


    const existing =
        findRelationship(
            fromId,
            toId
        );


    if (existing) {

        existing.type =
            type;

        existing.value =
            value;

    } else {

        relationships.push({

            id:
                "relationship_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2),

            from:
                fromId,

            to:
                toId,

            type,

            value,

            note: ""

        });

    }


    renderRelationships();

    updateRelationshipPreviews();

    saveGameSilently();
}


function updateRelationshipPreviews() {

    const fromSelect =
        $("relationshipFrom");

    const toSelect =
        $("relationshipTo");


    if (
        !fromSelect ||
        !toSelect
    ) {
        return;
    }


    const fromId =
        fromSelect.value;

    const toId =
        toSelect.value;


    const fromPreview =
        $("relationshipFromPreview");

    const toPreview =
        $("relationshipToPreview");


    const fromPlayer =
        houseguests.find(
            player =>
                player.id === fromId
        );


    const toPlayer =
        houseguests.find(
            player =>
                player.id === toId
        );


    if (fromPreview) {

        fromPreview.innerHTML =
            fromPlayer
                ? getPlayerImageHTML(
                    fromPlayer,
                    "relationship-preview-image"
                )
                : "";

    }


    if (toPreview) {

        toPreview.innerHTML =
            toPlayer
                ? getPlayerImageHTML(
                    toPlayer,
                    "relationship-preview-image"
                )
                : "";

    }


    const typeSelect =
        $("relationshipType");


    if (
        typeSelect &&
        fromId &&
        toId
    ) {

        typeSelect.value =
            getRelationshipType(
                fromId,
                toId
            );

    }

}


function saveRelationship() {

    const fromId =
        $("relationshipFrom").value;

    const toId =
        $("relationshipTo").value;

    const type =
        $("relationshipType").value;

    const note =
        $("relationshipNote")
            ? $("relationshipNote").value.trim()
            : "";


    if (!fromId || !toId) {

        alert(
            "Select both Houseguests."
        );

        return;
    }


    if (fromId === toId) {

        alert(
            "A Houseguest cannot have a relationship with themselves."
        );

        return;
    }


    if (
        !relationshipValues.hasOwnProperty(
            type
        )
    ) {

        alert(
            "Select a valid relationship type."
        );

        return;
    }


    const value =
        relationshipValues[type];


    const existing =
        findRelationship(
            fromId,
            toId
        );


    if (existing) {

        existing.type =
            type;

        existing.value =
            value;

        existing.note =
            note;

    } else {

        relationships.push({

            id:
                "relationship_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2),

            from:
                fromId,

            to:
                toId,

            type,

            value,

            note

        });

    }


    renderRelationships();

    saveGameSilently();

    updateAllDisplays();
}


function deleteRelationship(
    relationshipId
) {

    relationships =
        relationships.filter(
            relationship =>
                relationship.id !==
                relationshipId
        );


    renderRelationships();

    saveGameSilently();

    updateAllDisplays();
}


function renderRelationships() {

    const container =
        $("relationshipsList");


    if (!container) {
        return;
    }


    if (!relationships.length) {

        container.innerHTML = `
            <div class="empty-state">
                No relationships created yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        relationships
            .map(relationship => {

                const fromPlayer =
                    houseguests.find(
                        player =>
                            player.id ===
                            relationship.from
                    );


                const toPlayer =
                    houseguests.find(
                        player =>
                            player.id ===
                            relationship.to
                    );


                if (
                    !fromPlayer ||
                    !toPlayer
                ) {
                    return "";
                }


                const type =
                    relationship.type ||
                    getRelationshipType(
                        relationship.from,
                        relationship.to
                    );


                const label =
                    relationshipLabels[
                        type
                    ] ||
                    "Neutral";


                const value =
                    relationship.value ??
                    relationshipValues[type] ??
                    0;


                return `

                    <div class="relationship-card">

                        <div class="relationship-person">

                            ${getPlayerImageHTML(
                                fromPlayer,
                                "relationship-avatar"
                            )}

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(
                                        fromPlayer
                                    )
                                )}
                            </strong>

                        </div>


                        <div class="relationship-middle">

                            <div class="relationship-type">
                                ${escapeHTML(label)}
                            </div>

                            <div class="relationship-value">
                                ${value > 0 ? "+" : ""}${value}
                            </div>

                            ${
                                relationship.note
                                    ? `
                                        <div class="relationship-note">
                                            ${escapeHTML(
                                                relationship.note
                                            )}
                                        </div>
                                      `
                                    : ""
                            }

                        </div>


                        <div class="relationship-person">

                            ${getPlayerImageHTML(
                                toPlayer,
                                "relationship-avatar"
                            )}

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(
                                        toPlayer
                                    )
                                )}
                            </strong>

                        </div>


                        <button
                            class="danger-button"
                            onclick="deleteRelationship('${relationship.id}')">

                            DELETE

                        </button>

                    </div>

                `;

            })
            .join("");
}


function updateRelationshipDropdowns() {

    const fromSelect =
        $("relationshipFrom");

    const toSelect =
        $("relationshipTo");


    if (
        !fromSelect ||
        !toSelect
    ) {
        return;
    }


    const oldFrom =
        fromSelect.value;

    const oldTo =
        toSelect.value;


    const options =
        houseguests
            .map(player => {

                return `
                    <option value="${player.id}">
                        ${escapeHTML(
                            getDisplayName(player)
                        )}
                    </option>
                `;

            })
            .join("");


    fromSelect.innerHTML =
        `<option value="">
            Select Houseguest
         </option>` +
        options;


    toSelect.innerHTML =
        `<option value="">
            Select Houseguest
         </option>` +
        options;


    if (
        houseguests.some(
            player =>
                player.id === oldFrom
        )
    ) {

        fromSelect.value =
            oldFrom;

    }


    if (
        houseguests.some(
            player =>
                player.id === oldTo
        )
    ) {

        toSelect.value =
            oldTo;

    }


    updateRelationshipPreviews();
}



/* =========================================================
   MEMORY WALL
========================================================= */

function renderMemoryWall() {

    const container =
        $("memoryWall");


    if (!container) {
        return;
    }


    if (!houseguests.length) {

        container.innerHTML = `
            <div class="empty-state">
                Add Houseguests to build the Memory Wall.
            </div>
        `;

        return;
    }


    container.innerHTML =
        houseguests
            .map(player => {

                const isEvicted =
                    player.status ===
                    "Evicted";


                const isJury =
                    jury.some(
                        juror =>
                            juror.id ===
                            player.id
                    );


                const isWinner =
                    finaleWinner &&
                    finaleWinner.id ===
                    player.id;


                let statusText =
                    player.status ||
                    "Active";


                if (isWinner) {

                    statusText =
                        "WINNER";

                } else if (isJury) {

                    statusText =
                        "JURY";

                } else if (isEvicted) {

                    statusText =
                        "EVICTED";

                }


                return `

                    <div class="
                        memory-wall-card
                        ${isEvicted ? "evicted" : ""}
                        ${isWinner ? "winner" : ""}
                    ">

                        <div class="memory-wall-photo">

                            ${getPlayerImageHTML(
                                player,
                                "memory-wall-image"
                            )}

                        </div>


                        <div class="memory-wall-name">

                            ${escapeHTML(
                                getDisplayName(
                                    player
                                )
                            )}

                        </div>


                        <div class="memory-wall-status">

                            ${escapeHTML(
                                statusText
                            )}

                        </div>

                    </div>

                `;

            })
            .join("");
}



/* =========================================================
   JURY
========================================================= */

function renderJury() {

    const container =
        $("juryList");

    const evictedContainer =
        $("evictedPlayers");


    if (container) {

        if (!jury.length) {

            container.innerHTML = `
                <div class="empty-state">
                    No Jury members yet.
                </div>
            `;

        } else {

            container.innerHTML =
                jury
                    .map((player, index) => {

                        return `

                            <div class="jury-card">

                                <div class="jury-order">
                                    ${index + 1}
                                </div>

                                ${getPlayerImageHTML(
                                    player,
                                    "jury-photo"
                                )}

                                <div class="jury-info">

                                    <strong>
                                        ${escapeHTML(
                                            getDisplayName(
                                                player
                                            )
                                        )}
                                    </strong>

                                    <span>
                                        Jury Member
                                    </span>

                                </div>

                            </div>

                        `;

                    })
                    .join("");

        }

    }


    if (evictedContainer) {

        const evicted =
            evictedHouseguests
                .filter(Boolean);


        if (!evicted.length) {

            evictedContainer.innerHTML =
                `<div class="empty-state">
                    No evicted Houseguests yet.
                 </div>`;

        } else {

            evictedContainer.innerHTML =
                evicted
                    .map((player, index) => {

                        return `

                            <div class="evicted-player-card">

                                <div class="eviction-number">
                                    ${index + 1}
                                </div>

                                ${getPlayerImageHTML(
                                    player,
                                    "evicted-photo"
                                )}

                                <div>
                                    <strong>
                                        ${escapeHTML(
                                            getDisplayName(
                                                player
                                            )
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            player.status ||
                                            "Evicted"
                                        )}
                                    </span>
                                </div>

                            </div>

                        `;

                    })
                    .join("");

        }

    }

}



/* =========================================================
   GAME HOUSEGUEST DISPLAY
========================================================= */

function renderGameHouseguests() {

    const container =
        $("gameHouseguests");


    if (!container) {
        return;
    }


    const activePlayers =
        getActivePlayers();


    if (!activePlayers.length) {

        container.innerHTML = `
            <div class="empty-state">
                No active Houseguests.
            </div>
        `;

        return;
    }


    container.innerHTML =
        activePlayers
            .map(player => {

                const classes = [

                    "game-houseguest-card",

                    player.id === currentHOH
                        ? "is-hoh"
                        : "",

                    nominees.includes(player)
                        ? "is-nominee"
                        : "",

                    povWinner &&
                    player.id === povWinner.id
                        ? "is-pov"
                        : ""

                ]
                    .filter(Boolean)
                    .join(" ");


                return `

                    <div class="${classes}">

                        ${getPlayerImageHTML(
                            player,
                            "game-houseguest-photo"
                        )}

                        <div class="game-houseguest-info">

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(
                                        player
                                    )
                                )}
                            </strong>

                            <span>
                                ${player.id === currentHOH
                                    ? "HOH"
                                    : nominees.includes(player)
                                        ? "NOMINEE"
                                        : "ACTIVE"}
                            </span>

                        </div>

                    </div>

                `;

            })
            .join("");
}



/* =========================================================
   EVENT LOG
========================================================= */

function renderEventLog() {

    const container =
        $("eventLog");


    if (!container) {
        return;
    }


    if (!eventLog.length) {

        container.innerHTML = `
            <div class="empty-state">
                No events yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        eventLog
            .slice()
            .reverse()
            .map((event, index) => {

                return `

                    <div class="event-log-entry">

                        <div class="event-log-number">
                            ${eventLog.length - index}
                        </div>

                        <div class="event-log-text">

                            ${escapeHTML(
                                typeof event === "string"
                                    ? event
                                    : event.text ||
                                      event.message ||
                                      ""
                            )}

                        </div>

                    </div>

                `;

            })
            .join("");
}



/* =========================================================
   SEASON SUMMARY
========================================================= */

function updateSeasonSummary() {

    const container =
        $("seasonSummary");


    if (!container) {
        return;
    }


    const active =
        getActivePlayers();


    container.innerHTML = `

        <div class="summary-card">

            <span>
                HOUSEGUESTS
            </span>

            <strong>
                ${houseguests.length}
            </strong>

        </div>


        <div class="summary-card">

            <span>
                ACTIVE
            </span>

            <strong>
                ${active.length}
            </strong>

        </div>


        <div class="summary-card">

            <span>
                EVICTED
            </span>

            <strong>
                ${evictedHouseguests.length}
            </strong>

        </div>


        <div class="summary-card">

            <span>
                JURY
            </span>

            <strong>
                ${jury.length}
            </strong>

        </div>

    `;
}
