/*
 * BIG BROTHER SIMULATOR
 * COMPLETE GAME CONTROLLER
 *
 * Designed for the original Stage 4 index.html.
 *
 * Major features:
 * - BB20 automatically loads its built-in 16-person cast
 * - Week-by-week simulation
 * - Competition names are used in the actual game
 * - HOH / Nominations / H@cker / POV / Veto / Eviction
 * - BB App Store
 * - Bonus Life
 * - The Cloud
 * - Identity Theft
 * - H@cker powers
 * - Jury Battle Back
 * - Double Eviction
 * - Final HOH
 * - Jury voting
 * - Portrait/name cards throughout gameplay
 * - Save / Load / Reset
 */

"use strict";

/* =========================================================
   CORE CONSTANTS
========================================================= */

const STAT_KEYS = [
    "general",
    "physical",
    "endurance",
    "mental",
    "strategic",
    "loyalty",
    "social",
    "temperament"
];

const RELATIONSHIP_VALUES = {
    love: 100,
    like: 60,
    neutral: 0,
    dislike: -60,
    hate: -100
};

const RELATIONSHIP_LABELS = {
    love: "❤️ Love",
    like: "😊 Like",
    neutral: "😐 Neutral",
    dislike: "😒 Dislike",
    hate: "😡 Hate"
};

const STORAGE_KEY = "bb-simulator-stage5-v1";

/* =========================================================
   GAME STATE
========================================================= */

let houseguests = [];
let evictedHouseguests = [];
let jury = [];
let alliances = [];
let relationships = [];
let customTwists = [];
let eventLog = [];

let selectedSeasonTemplate = "bb20";
let seasonName = "Big Brother 20";
let seasonFormat = "bb20";

let seasonStarted = false;
let seasonFinished = false;

let currentWeek = 1;
let currentCycle = 1;
let currentStage = "opening";

let currentHOH = null;
let nominees = [];

let povPlayers = [];
let povWinner = null;

let hackerWinner = null;
let replacementNominee = null;

let evictionVotes = {};
let currentEvictionTarget = null;
let currentEvictedPlayer = null;

let finaleWinner = null;

let finalHOH = {
    part1: null,
    part2: null,
    part3: null,
    winner: null
};

let juryVotes = {};
let juryVoteRevealIndex = 0;

let outgoingHOH = null;

let hackerPower = {
    replacementUsed: false,
    vetoPickUsed: false,
    voteNullified: false
};

let appStoreHistory = [];
let bonusLifeEligible = null;

let battleBackCompleted = false;
let pendingSecondCycle = false;

/* =========================================================
   BASIC UTILITIES
========================================================= */

function $(id) {
    return document.getElementById(id);
}

function clamp(value, min = 1, max = 10) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
}

function normalizeStat(value) {
    return clamp(value, 1, 10);
}

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

function randomFloat(min = 0, max = 1) {
    return min + Math.random() * (max - min);
}

function randomInt(min, max) {
    return Math.floor(randomFloat(min, max + 1));
}

function makeId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getDisplayName(player) {
    if (!player) return "Unknown";

    if (player.nickname) {
        return player.nickname;
    }

    const fullName = [
        player.firstName,
        player.lastName
    ].filter(Boolean).join(" ");

    return fullName || player.name || "Houseguest";
}

function getInitials(player) {
    const name = getDisplayName(player).trim();

    const parts = name
        .split(/\s+/)
        .filter(Boolean);

    return parts
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join("") || "HG";
}

/* =========================================================
   HOUSEGUEST NORMALIZATION
========================================================= */

function normalizeHouseguest(player) {
    if (!player) return null;

    player.id ||= makeId("hg");

    player.firstName ||= player.first || "";
    player.lastName ||= player.last || "";
    player.nickname ||= "";

    player.imageUrl ||= player.image || "";
    player.image ||= player.imageUrl || "";

    const legacy = {
        general: player.general ?? player.overall,
        physical: player.physical,
        endurance: player.endurance,
        mental: player.mental,
        strategic: player.strategic ?? player.strategy,
        loyalty: player.loyalty,
        social: player.social,
        temperament: player.temperament
    };

    STAT_KEYS.forEach(key => {
        player[key] = normalizeStat(
            legacy[key] ?? 5
        );
    });

    player.status ||= "Active";

    player.inGame = player.status === "Active";
    player.evicted = player.status === "Evicted";

    player.juryMember = Boolean(player.juryMember);

    player.hohWins = Number(player.hohWins || 0);
    player.povWins = Number(player.povWins || 0);
    player.competitionWins = Number(player.competitionWins || 0);
    player.votesReceived = Number(player.votesReceived || 0);

    player.placement ??= null;
    player.evictionWeek ??= null;

    player.safety = Boolean(player.safety);

    player.app ||= null;
    player.appUsed = Boolean(player.appUsed);

    player.strategyProfile ||= {
        alliance: 0,
        threat: 0,
        target: 0
    };

    return player;
}

function normalizeAllHouseguests() {
    houseguests.forEach(normalizeHouseguest);
}

function getActiveHouseguests() {
    return houseguests.filter(
        player => player.status === "Active"
    );
}

function findPlayer(id) {
    if (!id) return null;

    return houseguests.find(
        player => player.id === id
    ) || null;
}

/* =========================================================
   SEASON REGISTRY
========================================================= */

function getCurrentSeasonTemplate() {
    const registry =
        window.BB_SEASON_REGISTRY || {};

    return registry[selectedSeasonTemplate] || null;
}

function getSelectedSeasonTemplate() {
    return $("seasonSelect")?.value ||
        selectedSeasonTemplate ||
        "bb20";
}

/* =========================================================
   EVENT LOG
========================================================= */

function addEvent(text, type = "general", extra = {}) {
    eventLog.push({
        week: currentWeek,
        cycle: currentCycle,
        type,
        text: String(text),
        ...extra
    });
}

/* =========================================================
   NAVIGATION
========================================================= */

function showSection(sectionId) {
    document
        .querySelectorAll(".page-section")
        .forEach(section => {
            section.classList.remove(
                "active-section"
            );
        });

    const section = $(sectionId);

    if (section) {
        section.classList.add(
            "active-section"
        );
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   BB20 DEFAULT CAST
========================================================= */

/*
 * This is the custom BB20 cast used by the project.
 *
 * If the user already has a cast saved in the browser,
 * that cast is preserved.
 *
 * If there is no cast when BB20 starts, these 16 players
 * are automatically loaded.
 */

function createDefaultBB20Cast() {

    const cast = [
        ["Antonio", "Ricciardi", 1, 1, 3, 5, 4, 6, 5, 6],
        ["Aly", "Cipro", 1, 1, 4, 6, 5, 7, 7, 7],
        ["Jake", "Randall", 8, 7, 8, 6, 6, 6, 6, 6],
        ["Becca", "Fisher", 5, 5, 5, 6, 5, 6, 7, 6],
        ["Joe", "Cappadonna", 2, 2, 4, 5, 5, 5, 5, 5],
        ["Emilee", "Aswad", 5, 5, 6, 6, 5, 6, 7, 7],
        ["Logan", "Salvi", 6, 6, 7, 6, 7, 7, 7, 6],
        ["Grace", "Pimental", 4, 4, 5, 9, 7, 7, 8, 7],
        ["Michael", "Senoff", 6, 6, 6, 6, 6, 5, 6, 6],
        ["Gracie", "O'Leary", 3, 3, 4, 7, 6, 7, 7, 7],
        ["Liz", "Sicard", 6, 6, 6, 7, 7, 6, 7, 6],
        ["TJ", "Scanlan", 10, 10, 9, 6, 6, 6, 6, 6],
        ["Molly", "Kueter", 5, 5, 6, 6, 6, 7, 7, 7],
        ["Tucker", "Goldberg", 7, 7, 8, 10, 9, 7, 8, 8],
        ["Riley", "Korengel", 3, 3, 5, 8, 8, 7, 8, 7],
        ["Zach", "Anson", 2, 2, 4, 5, 5, 5, 5, 5]
    ];

    return cast.map(data => {

        const [
            firstName,
            lastName,
            general,
            physical,
            endurance,
            mental,
            strategic,
            loyalty,
            social,
            temperament
        ] = data;

        return normalizeHouseguest({
            id: makeId("bb20"),
            firstName,
            lastName,
            nickname: "",
            imageUrl: "",
            general,
            physical,
            endurance,
            mental,
            strategic,
            loyalty,
            social,
            temperament,
            status: "Active"
        });
    });
}

function ensureBB20Cast() {

    const template =
        getCurrentSeasonTemplate();

    if (!template) return;

    if (
        template.id === "bb20" &&
        houseguests.length === 0
    ) {
        houseguests =
            createDefaultBB20Cast();

        addEvent(
            "The Big Brother 20 cast has been loaded.",
            "cast"
        );
    }
}

/* =========================================================
   SEASON SELECTION
========================================================= */

function selectSeasonTemplate() {

    selectedSeasonTemplate =
        getSelectedSeasonTemplate();

    const template =
        getCurrentSeasonTemplate();

    if (template) {

        seasonName = template.name;
        seasonFormat = template.id;

        addEvent(
            `${template.name} format selected.`,
            "format"
        );
    }

    updateAllDisplays();
}

/* =========================================================
   SEASON INFORMATION
========================================================= */

function getWeekData() {

    const template =
        getCurrentSeasonTemplate();

    if (!template) return null;

    return template.competitions?.[currentWeek] ||
        null;
}

function competitionName(event) {

    if (!event) return "Competition";

    if (typeof event === "string") {
        return event;
    }

    return event.name ||
        "Competition";
}

function updateSelectedSeasonInfo() {

    const info =
        $("selectedSeasonInfo");

    if (!info) return;

    const template =
        getCurrentSeasonTemplate();

    if (!template) {

        info.innerHTML = `
            <div class="empty-state">
                That season format has not been installed yet.
            </div>
        `;

        return;
    }

    const competitions =
        template.competitions || {};

    const weeks =
        Object.entries(competitions)
            .map(([week, data]) => {

                const pieces = [];

                if (data.hoh) {
                    pieces.push(
                        `HOH: ${escapeHTML(
                            competitionName(data.hoh)
                        )}`
                    );
                }

                if (data.pov) {
                    pieces.push(
                        `POV: ${escapeHTML(
                            competitionName(data.pov)
                        )}`
                    );
                }

                if (data.hacker) {
                    pieces.push(
                        `H@CKER: ${escapeHTML(
                            competitionName(data.hacker)
                        )}`
                    );
                }

                if (data.doubleEviction) {
                    pieces.push(
                        "DOUBLE EVICTION"
                    );
                }

                return `
                    <div class="season-schedule-row">
                        <strong>Week ${week}</strong>
                        <span>
                            ${pieces.join(" | ")}
                        </span>
                    </div>
                `;
            })
            .join("");

    info.innerHTML = `
        <div class="season-template-card">

            <h3>
                ${escapeHTML(template.name)}
            </h3>

            <p>
                ${escapeHTML(
                    template.description || ""
                )}
            </p>

            <p>
                <strong>
                    ${template.startingPlayers}
                </strong>
                starting Houseguests ·

                <strong>
                    ${template.nominationCount}
                </strong>
                nominees ·

                <strong>
                    ${template.jurySize}
                </strong>
                person jury
            </p>

            ${
                weeks
                    ? `
                        <hr>
                        <h4>
                            Competition Schedule
                        </h4>

                        <div class="season-schedule">
                            ${weeks}
                        </div>
                    `
                    : ""
            }

        </div>
    `;
}

/* =========================================================
   PLAYER SEASON RESET
========================================================= */

function resetPlayerSeasonStats(player) {

    normalizeHouseguest(player);

    player.status = "Active";
    player.inGame = true;
    player.evicted = false;

    player.juryMember = false;

    player.placement = null;
    player.evictionWeek = null;

    player.votesReceived = 0;

    player.hohWins = 0;
    player.povWins = 0;
    player.competitionWins = 0;

    player.safety = false;

    player.app = null;
    player.appUsed = false;

    player.strategyProfile = {
        alliance: 0,
        threat: 0,
        target: 0
    };
}

/* =========================================================
   SEASON START
========================================================= */

function validateSeasonStart() {

    const template =
        getCurrentSeasonTemplate();

    if (!template) {

        alert(
            "Please select an installed season format first."
        );

        return false;
    }

    if (
        houseguests.length <
        Number(template.startingPlayers || 2)
    ) {

        alert(
            `This season requires at least ${
                template.startingPlayers
            } Houseguests.`
        );

        showSection("cast");

        return false;
    }

    return true;
}

function startNewSeason() {

    ensureBB20Cast();

    if (!validateSeasonStart()) {
        return;
    }

    if (
        seasonStarted &&
        !confirm(
            "Starting a new season will reset the current game. Continue?"
        )
    ) {
        return;
    }

    const template =
        getCurrentSeasonTemplate();

    selectedSeasonTemplate =
        getSelectedSeasonTemplate();

    seasonName =
        template.name;

    seasonFormat =
        template.id;

    seasonStarted = true;
    seasonFinished = false;

    currentWeek = 1;
    currentCycle = 1;
    currentStage = "opening";

    currentHOH = null;
    outgoingHOH = null;

    nominees = [];

    povPlayers = [];
    povWinner = null;

    hackerWinner = null;
    replacementNominee = null;

    evictionVotes = {};
    currentEvictionTarget = null;
    currentEvictedPlayer = null;

    finaleWinner = null;

    finalHOH = {
        part1: null,
        part2: null,
        part3: null,
        winner: null
    };

    juryVotes = {};
    juryVoteRevealIndex = 0;

    hackerPower = {
        replacementUsed: false,
        vetoPickUsed: false,
        voteNullified: false
    };

    appStoreHistory = [];
    bonusLifeEligible = null;

    battleBackCompleted = false;
    pendingSecondCycle = false;

    evictedHouseguests = [];
    jury = [];
    eventLog = [];

    normalizeAllHouseguests();

    houseguests.forEach(
        resetPlayerSeasonStats
    );

    addEvent(
        `${seasonName} has begun with ${houseguests.length} Houseguests.`,
        "season"
    );

    addEvent(
        "The Houseguests move into the Big Brother house.",
        "season"
    );

    updateAllDisplays();

    showSection("game");

    saveGameSilently();
}

/* =========================================================
   RELATIONSHIPS
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
        getRelationship(fromId, toId);

    return relationship
        ? Number(relationship.score || 0)
        : 0;
}

function setRelationship(
    fromId,
    toId,
    type,
    note = "",
    scoreOverride = null
) {

    if (
        !fromId ||
        !toId ||
        fromId === toId
    ) {
        return false;
    }

    const score =
        scoreOverride === null
            ? (
                RELATIONSHIP_VALUES[type] ??
                0
            )
            : clamp(
                scoreOverride,
                -100,
                100
            );

    const existing =
        getRelationship(
            fromId,
            toId
        );

    if (existing) {

        existing.type = type;
        existing.score = score;
        existing.note = note;

    } else {

        relationships.push({
            id: makeId("rel"),
            from: fromId,
            to: toId,
            type,
            score,
            note
        });
    }

    return true;
}

function saveRelationship() {

    const from =
        $("relationshipFrom")?.value;

    const to =
        $("relationshipTo")?.value;

    const type =
        $("relationshipType")?.value ||
        "neutral";

    const note =
        $("relationshipNote")?.value.trim() ||
        "";

    if (
        !from ||
        !to ||
        from === to
    ) {
        alert(
            "Choose two different Houseguests."
        );

        return;
    }

    setRelationship(
        from,
        to,
        type,
        note
    );

    renderRelationships();
    updateRelationshipPreviews();

    saveGameSilently();
}

function loadSelectedRelationship() {

    const from =
        $("relationshipFrom")?.value;

    const to =
        $("relationshipTo")?.value;

    const relationship =
        getRelationship(
            from,
            to
        );

    if (!relationship) {

        alert(
            "No saved relationship was found."
        );

        return;
    }

    if ($("relationshipType")) {
        $("relationshipType").value =
            relationship.type;
    }

    if ($("relationshipNote")) {
        $("relationshipNote").value =
            relationship.note || "";
    }

    updateRelationshipPreviews();
}

function deleteSelectedRelationship() {

    const from =
        $("relationshipFrom")?.value;

    const to =
        $("relationshipTo")?.value;

    relationships =
        relationships.filter(
            relationship =>
                !(
                    relationship.from === from &&
                    relationship.to === to
                )
        );

    renderRelationships();
    saveGameSilently();
}

function updateRelationshipPreviews() {

    const container =
        $("relationshipPreviews");

    if (!container) return;

    const from =
        findPlayer(
            $("relationshipFrom")?.value
        );

    const to =
        findPlayer(
            $("relationshipTo")?.value
        );

    if (!from || !to) {

        container.innerHTML = "";

        return;
    }

    const score =
        getRelationshipScore(
            from.id,
            to.id
        );

    container.innerHTML = `
        <div class="relationship-preview">
            <strong>
                ${escapeHTML(
                    getDisplayName(from)
                )}
            </strong>

            →
            
            <strong>
                ${escapeHTML(
                    getDisplayName(to)
                )}
            </strong>

            <span>
                ${score}
            </span>
        </div>
    `;
}

/* =========================================================
   ALLIANCES
========================================================= */

function createAlliance() {

    const name =
        $("allianceName")?.value.trim();

    const strength =
        $("allianceStrength")?.value ||
        "moderate";

    const allianceSelect =
        $("allianceMembers");

    if (!name) {

        alert(
            "Enter an alliance name."
        );

        return;
    }

    let members = [];

    if (allianceSelect) {

        members =
            Array.from(
                allianceSelect.selectedOptions
            ).map(
                option => option.value
            );
    }

    if (!members.length) {

        members =
            getActiveHouseguests()
                .slice(0, 2)
                .map(player => player.id);
    }

    alliances.push({
        id: makeId("alliance"),
        name,
        strength,
        members,
        formedWeek: currentWeek,
        active: true
    });

    if ($("allianceName")) {
        $("allianceName").value = "";
    }

    renderAlliances();
    saveGameSilently();
}

/* =========================================================
   CUSTOM TWISTS
========================================================= */

function createTwist() {

    const name =
        $("twistName")?.value.trim();

    const description =
        $("twistDescription")?.value.trim();

    if (!name) {

        alert(
            "Enter a twist name."
        );

        return;
    }

    customTwists.push({
        id: makeId("twist"),
        name,
        description:
            description ||
            "Custom season twist."
    });

    if ($("twistName")) {
        $("twistName").value = "";
    }

    if ($("twistDescription")) {
        $("twistDescription").value = "";
    }

    renderTwists();

    saveGameSilently();
}

/* =========================================================
   PORTRAITS
========================================================= */

function getPlayerImageHTML(
    player,
    className = ""
) {

    if (!player) return "";

    const name =
        escapeHTML(
            getDisplayName(player)
        );

    const image =
        player.imageUrl ||
        player.image ||
        "";

    if (image) {

        return `
            <img
                src="${escapeAttribute(image)}"
                alt="${name}"
                class="${escapeAttribute(className)}"
                onerror="
                    this.style.display='none';
                    this.nextElementSibling.style.display='flex';
                "
            >

            <div
                class="${escapeAttribute(className)} portrait-placeholder"
                style="display:none"
            >
                ${escapeHTML(
                    getInitials(player)
                )}
            </div>
        `;
    }

    return `
        <div
            class="${escapeAttribute(className)} portrait-placeholder"
        >
            ${escapeHTML(
                getInitials(player)
            )}
        </div>
    `;
}

function personInlineHTML(player) {

    if (!player) return "";

    return `
        <div class="status-person-inline">
            ${getPlayerImageHTML(
                player,
                "status-player-image"
            )}

            <span>
                ${escapeHTML(
                    getDisplayName(player)
                )}
            </span>
        </div>
    `;
}

/* =========================================================
   CAST RENDERING
========================================================= */

function renderCast() {

    const grid =
        $("castGrid");

    const count =
        $("castCount");

    if (!grid) return;

    if (count) {
        count.textContent =
            houseguests.length;
    }

    if (!houseguests.length) {

        grid.innerHTML = `
            <div class="empty-state">
                No Houseguests yet.
            </div>
        `;

        return;
    }

    grid.innerHTML =
        houseguests.map(player => {

            const status =
                player.status;

            return `
                <article
                    class="
                        cast-card
                        ${status === "Evicted"
                            ? "evicted"
                            : ""}
                    "
                >

                    <div class="cast-card-photo">
                        ${getPlayerImageHTML(
                            player,
                            "cast-card-image"
                        )}
                    </div>

                    <div class="cast-card-info">

                        <h3>
                            ${escapeHTML(
                                getDisplayName(player)
                            )}
                        </h3>

                        <span>
                            ${escapeHTML(status)}
                        </span>

                    </div>

                    <div class="cast-card-actions">

                        <button
                            onclick="
                                editHouseguest('${escapeAttribute(player.id)}')
                            "
                        >
                            Edit
                        </button>

                        <button
                            class="danger-button"
                            onclick="
                                deleteHouseguest('${escapeAttribute(player.id)}')
                            "
                        >
                            Delete
                        </button>

                    </div>

                </article>
            `;
        }).join("");
}

/* =========================================================
   HOUSEGUEST EDITOR
========================================================= */

function saveHouseguest() {

    const editingId =
        $("editingHouseguestId")?.value;

    const firstName =
        $("firstName")?.value.trim();

    const lastName =
        $("lastName")?.value.trim();

    if (!firstName && !lastName) {

        alert(
            "Enter at least a first or last name."
        );

        return;
    }

    const playerData = {
        firstName,
        lastName,
        nickname:
            $("nickname")?.value.trim() || "",
        imageUrl:
            $("imageUrl")?.value.trim() || ""
    };

    STAT_KEYS.forEach(key => {

        playerData[key] =
            normalizeStat(
                $(key)?.value || 5
            );
    });

    if (editingId) {

        const player =
            findPlayer(editingId);

        if (player) {

            Object.assign(
                player,
                playerData
            );

            normalizeHouseguest(player);
        }

    } else {

        houseguests.push(
            normalizeHouseguest({
                id: makeId("hg"),
                ...playerData,
                status: "Active"
            })
        );
    }

    clearHouseguestEditor();

    renderCast();
    renderAllRelationshipControls();

    saveGameSilently();
}

function editHouseguest(id) {

    const player =
        findPlayer(id);

    if (!player) return;

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
            player.imageUrl || "";
    }

    STAT_KEYS.forEach(key => {

        if ($(key)) {
            $(key).value =
                player[key];
        }
    });

    updateAllStatDisplays();

    showSection("cast");
}

function clearHouseguestEditor() {

    if ($("editingHouseguestId")) {
        $("editingHouseguestId").value = "";
    }

    [
        "firstName",
        "lastName",
        "nickname",
        "imageUrl"
    ].forEach(id => {

        if ($(id)) {
            $(id).value = "";
        }
    });

    STAT_KEYS.forEach(key => {

        if ($(key)) {
            $(key).value = 5;
        }
    });

    updateAllStatDisplays();
}

function cancelHouseguestEdit() {
    clearHouseguestEditor();
}

function deleteHouseguest(id) {

    if (seasonStarted) {

        alert(
            "Reset the season before removing a Houseguest."
        );

        return;
    }

    const player =
        findPlayer(id);

    if (!player) return;

    if (
        !confirm(
            `Remove ${getDisplayName(player)} from the cast?`
        )
    ) {
        return;
    }

    houseguests =
        houseguests.filter(
            player => player.id !== id
        );

    renderCast();
    renderAllRelationshipControls();

    saveGameSilently();
}

function updateAllStatDisplays() {

    STAT_KEYS.forEach(key => {

        const input = $(key);
        const output =
            $(`${key}Value`);

        if (input && output) {
            output.textContent =
                input.value;
        }
    });
}

/* =========================================================
   RELATIONSHIP / ALLIANCE CONTROLS
========================================================= */

function renderAllRelationshipControls() {

    const from =
        $("relationshipFrom");

    const to =
        $("relationshipTo");

    const alliance =
        $("allianceMembers");

    const options =
        houseguests.map(player => `
            <option value="${escapeAttribute(player.id)}">
                ${escapeHTML(
                    getDisplayName(player)
                )}
            </option>
        `).join("");

    if (from) {
        from.innerHTML = options;
    }

    if (to) {
        to.innerHTML = options;
    }

    if (alliance) {

        alliance.innerHTML =
            houseguests.map(player => `
                <label class="bb-alliance-check">
                    <input
                        type="checkbox"
                        value="${escapeAttribute(player.id)}"
                    >

                    <span>
                        ${escapeHTML(
                            getDisplayName(player)
                        )}
                    </span>
                </label>
            `).join("");
    }

    updateRelationshipPreviews();
}

function renderAlliances() {

    const container =
        $("allianceList");

    if (!container) return;

    if (!alliances.length) {

        container.innerHTML = `
            <div class="empty-state">
                No alliances yet.
            </div>
        `;

        return;
    }

    container.innerHTML =
        alliances.map(alliance => `

            <div class="alliance-card">

                <h3>
                    ${escapeHTML(
                        alliance.name
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        alliance.strength
                    )}
                </p>

                <div>
                    ${
                        alliance.members
                            .map(id => findPlayer(id))
                            .filter(Boolean)
                            .map(personInlineHTML)
                            .join("")
                    }
                </div>

            </div>

        `).join("");
}

function renderRelationships() {

    const container =
        $("relationshipsList");

    if (!container) return;

    if (!relationships.length) {

        container.innerHTML = `
            <div class="empty-state">
                No starting relationships entered.
            </div>
        `;

        return;
    }

    container.innerHTML =
        relationships.map(r => {

            const from =
                findPlayer(r.from);

            const to =
                findPlayer(r.to);

            if (!from || !to) {
                return "";
            }

            return `
                <div class="relationship-row">

                    <strong>
                        ${escapeHTML(
                            getDisplayName(from)
                        )}
                    </strong>

                    <span>→</span>

                    <strong>
                        ${escapeHTML(
                            getDisplayName(to)
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            RELATIONSHIP_LABELS[r.type] ||
                            "Neutral"
                        )}
                    </span>

                    ${
                        r.note
                            ? `<small>
                                ${escapeHTML(r.note)}
                               </small>`
                            : ""
                    }

                </div>
            `;
        }).join("");
}

/* =========================================================
   TWISTS
========================================================= */

function renderTwists() {

    const container =
        $("twistList");

    if (!container) return;

    const template =
        getCurrentSeasonTemplate();

    let html = "";

    const twists =
        template?.twists;

    if (twists?.appStore) {

        html += `
            <div class="bb-active-twist active">

                <strong>
                    BB App Store — Weeks 1–3
                </strong>

                <span>
                    Power Apps:
                    ${
                        twists.appStore.powerApps
                            .map(app =>
                                escapeHTML(app.name)
                            )
                            .join(", ")
                    }

                    <br>

                    Crap Apps:
                    ${
                        twists.appStore.crapApps
                            .map(app =>
                                escapeHTML(app.name)
                            )
                            .join(", ")
                    }
                </span>

            </div>
        `;
    }

    if (twists?.hacker) {

        html += `
            <div class="bb-active-twist active">

                <strong>
                    H@cker Competition — Weeks 6–7
                </strong>

                <span>
                    ${
                        twists.hacker.abilities
                            .map(ability =>
                                escapeHTML(ability)
                            )
                            .join(" · ")
                    }
                </span>

            </div>
        `;
    }

    if (twists?.juryBattleBack) {

        html += `
            <div class="bb-active-twist active">

                <strong>
                    Jury Battle Back
                </strong>

                <span>
                    ${
                        escapeHTML(
                            twists.juryBattleBack.description ||
                            ""
                        )
                    }
                </span>

            </div>
        `;
    }

    const custom =
        customTwists.map(twist => `
            <div class="bb-active-twist">

                <strong>
                    ${escapeHTML(twist.name)}
                </strong>

                <span>
                    ${escapeHTML(
                        twist.description
                    )}
                </span>

            </div>
        `).join("");

    container.innerHTML =
        html + custom ||
        `<div class="empty-state">
            No twists configured.
         </div>`;
}

/* =========================================================
   MEMORY WALL
========================================================= */

function renderMemoryWall() {

    const container =
        $("memoryWall");

    if (!container) return;

    if (!houseguests.length) {

        container.innerHTML = `
            <div class="empty-state">
                Add Houseguests to build the Memory Wall.
            </div>
        `;

        return;
    }

    container.innerHTML =
        houseguests.map(player => `

            <div
                class="
                    memory-wall-card
                    ${player.status === "Evicted"
                        ? "evicted"
                        : ""}
                    ${finaleWinner?.id === player.id
                        ? "winner"
                        : ""}
                "
            >

                <div class="memory-wall-photo">

                    ${getPlayerImageHTML(
                        player,
                        "memory-wall-image"
                    )}

                </div>

                <div class="memory-wall-name">

                    ${escapeHTML(
                        getDisplayName(player)
                    )}

                </div>

                <div class="memory-wall-status">

                    ${escapeHTML(
                        finaleWinner?.id === player.id
                            ? "WINNER"
                            : player.juryMember
                                ? "JURY"
                                : player.status
                    )}

                </div>

            </div>
        `).join("");
}

/* =========================================================
   JURY
========================================================= */

function renderJury() {

    const juryList =
        $("juryList");

    const evicted =
        $("evictedPlayers");

    if (juryList) {

        juryList.innerHTML =
            jury.length
                ? jury.map((player, index) => `
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
                                    getDisplayName(player)
                                )}
                            </strong>

                            <span>
                                Jury Member
                            </span>

                        </div>

                    </div>
                `).join("")
                : `
                    <div class="empty-state">
                        No Jury members yet.
                    </div>
                `;
    }

    if (evicted) {

        evicted.innerHTML =
            evictedHouseguests.length
                ? evictedHouseguests.map((player, index) => `
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
                                    getDisplayName(player)
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    player.status
                                )}
                            </span>
                        </div>

                    </div>
                `).join("")
                : `
                    <div class="empty-state">
                        No evicted Houseguests yet.
                    </div>
                `;
    }
}

/* =========================================================
   GAME HOUSEGUEST GRID
========================================================= */

function renderGameHouseguests() {

    const container =
        $("gameHouseguests");

    if (!container) return;

    const active =
        getActiveHouseguests();

    if ($("gameHouseguestCount")) {

        $("gameHouseguestCount").textContent =
            `${active.length} remaining`;
    }

    if (!active.length) {

        container.innerHTML = `
            <div class="empty-state">
                No active Houseguests.
            </div>
        `;

        return;
    }

    container.innerHTML =
        active.map(player => {

            const tags = [];

            if (
                player.id === currentHOH
            ) {
                tags.push("HOH");
            }

            if (
                nominees.some(
                    nominee =>
                        nominee.id === player.id
                )
            ) {
                tags.push("NOMINEE");
            }

            if (
                povWinner?.id === player.id
            ) {
                tags.push("POV");
            }

            if (
                player.id === hackerWinner
            ) {
                tags.push("H@CKER");
            }

            return `
                <article
                    class="
                        game-houseguest-card
                        ${player.id === currentHOH
                            ? "is-hoh"
                            : ""}
                        ${nominees.some(
                            nominee =>
                                nominee.id === player.id
                        )
                            ? "is-nominee"
                            : ""}
                    "
                >

                    <div>
                        ${getPlayerImageHTML(
                            player,
                            "game-houseguest-photo"
                        )}
                    </div>

                    <div class="game-houseguest-info">

                        <strong>
                            ${escapeHTML(
                                getDisplayName(player)
                            )}
                        </strong>

                        <span>
                            ${
                                tags.length
                                    ? tags.join(" · ")
                                    : "ACTIVE"
                            }
                        </span>

                    </div>

                </article>
            `;
        }).join("");
}

/* =========================================================
   STATUS CARDS
========================================================= */

function renderStatusPeople(
    elementId,
    players
) {

    const container =
        $(elementId);

    if (!container) return;

    const valid =
        players.filter(Boolean);

    if (!valid.length) {

        container.innerHTML = `
            <div class="status-none">
                None
            </div>
        `;

        return;
    }

    container.innerHTML =
        valid.map(personInlineHTML).join("");
}

function renderGameStatus() {

    renderStatusPeople(
        "hohStatus",
        currentHOH
            ? [findPlayer(currentHOH)]
            : []
    );

    renderStatusPeople(
        "nomineesStatus",
        nominees
    );

    renderStatusPeople(
        "povStatus",
        povWinner
            ? [povWinner]
            : []
    );

    const format =
        $("formatStatus");

    if (format) {

        const data =
            getWeekData();

        if (data?.doubleEviction) {

            format.textContent =
                "DOUBLE EVICTION";

        } else if (currentCycle === 2) {

            format.textContent =
                "SECOND CYCLE";

        } else {

            format.textContent =
                "NORMAL WEEK";
        }
    }
}

/* =========================================================
   GAME STAGE DISPLAY
========================================================= */

function updateGameStageDisplay() {

    const stageMap = {

        opening: {
            name: "Opening",
            title: "The Houseguests Enter",
            icon: "🏠",
            description:
                "The season begins."
        },

        hoh: {
            name: "HOH Competition",
            title: "Head of Household",
            icon: "👑",
            description:
                "The Houseguests compete for HOH."
        },

        nominations: {
            name: "Nomination Ceremony",
            title: "Nominations",
            icon: "🎯",
            description:
                "The HOH nominates two Houseguests."
        },

        hacker: {
            name: "H@cker Competition",
            title: "H@cker Competition",
            icon: "💻",
            description:
                "The H@cker competes anonymously."
        },

        pov: {
            name: "Power of Veto Competition",
            title: "Power of Veto",
            icon: "🏆",
            description:
                "Six Houseguests compete for the POV."
        },

        veto: {
            name: "Veto Ceremony",
            title: "Veto Ceremony",
            icon: "💎",
            description:
                "The Power of Veto is either used or not used."
        },

        eviction: {
            name: "Eviction Vote",
            title: "Eviction",
            icon: "🗳️",
            description:
                "The Houseguests cast their votes."
        },

        evictionReveal: {
            name: "Eviction",
            title: "Eviction Results",
            icon: "🚪",
            description:
                "A Houseguest leaves the game."
        },

        finalHOH1: {
            name: "Final HOH Part 1",
            title: "Final HOH",
            icon: "🏆",
            description:
                "The final three begin the Final HOH competition."
        },

        finalHOH2: {
            name: "Final HOH Part 2",
            title: "Final HOH",
            icon: "🏆",
            description:
                "The remaining two Houseguests compete."
        },

        finalHOH3: {
            name: "Final HOH Part 3",
            title: "Final HOH",
            icon: "🏆",
            description:
                "The Part 1 and Part 2 winners face off."
        },

        finalVote: {
            name: "Final Eviction",
            title: "Final Eviction",
            icon: "🚪",
            description:
                "The Final HOH chooses who goes to the jury."
        },

        finale: {
            name: "Finale",
            title: "Jury Vote",
            icon: "🏆",
            description:
                "The Jury decides the winner."
        }
    };

    const stage =
        stageMap[currentStage] ||
        stageMap.opening;

    let title =
        stage.title;

    let description =
        stage.description;

    const competition =
        getCompetitionEvent(
            currentStage === "hoh"
                ? "hoh"
                : currentStage === "pov"
                    ? "pov"
                    : currentStage === "hacker"
                        ? "hacker"
                        : null
        );

    if (competition?.name) {

        title +=
            ` — ${competition.name}`;

        if (competition.description) {

            description =
                competition.description;
        }
    }

    if ($("weekBadge")) {

        $("weekBadge").textContent =
            `WEEK ${currentWeek}`;
    }

    if ($("weekTitle")) {

        $("weekTitle").textContent =
            title;
    }

    if ($("stageName")) {

        $("stageName").textContent =
            stage.name;
    }

    if ($("stageDescription")) {

        $("stageDescription").textContent =
            description;
    }

    if ($("stageIcon")) {

        $("stageIcon").textContent =
            stage.icon;
    }

    if ($("proceedButton")) {

        $("proceedButton").textContent =
            seasonFinished
                ? "VIEW FINALE"
                : "PROCEED";
    }
}

/* =========================================================
   COMPETITIONS
========================================================= */

function getCompetitionEvent(
    kind,
    week = currentWeek,
    cycle = currentCycle
) {

    const data =
        getCurrentSeasonTemplate()
            ?.competitions?.[week];

    if (!data) return null;

    if (kind === "hoh") {

        return (
            cycle === 2 &&
            data.secondHOH
        )
            ? data.secondHOH
            : data.hoh;
    }

    if (kind === "pov") {

        return (
            cycle === 2 &&
            data.secondPOV
        )
            ? data.secondPOV
            : data.pov;
    }

    if (kind === "hacker") {

        return data.hacker;
    }

    return null;
}

function getCompetitionWeights(
    category = "overall"
) {

    const weights = {

        general: {
            general: .45,
            mental: .15,
            physical: .10,
            endurance: .10,
            strategic: .10,
            temperament: .10
        },

        physical: {
            physical: .55,
            endurance: .25,
            general: .10,
            temperament: .10
        },

        endurance: {
            endurance: .60,
            physical: .20,
            temperament: .10,
            general: .10
        },

        mental: {
            mental: .60,
            strategic: .20,
            general: .10,
            temperament: .10
        },

        strategic: {
            strategic: .55,
            mental: .20,
            social: .10,
            general: .10,
            loyalty: .05
        },

        overall: {
            general: .20,
            physical: .12,
            endurance: .10,
            mental: .16,
            strategic: .16,
            social: .10,
            loyalty: .06,
            temperament: .10
        }
    };

    return weights[category] ||
        weights.overall;
}

function scoreCompetition(
    player,
    category = "overall",
    luck = true
) {

    const weights =
        getCompetitionWeights(
            category
        );

    let score = 0;
    let total = 0;

    Object.entries(weights)
        .forEach(([key, weight]) => {

            score +=
                normalizeStat(
                    player[key] ?? 5
                ) * weight;

            total += weight;
        });

    const base =
        (score / total) * 10;

    return base +
        (
            luck
                ? randomFloat(-6, 6)
                : 0
        );
}

function determineCompetitionWinner(
    players,
    category = "overall",
    eventName = "Competition"
) {

    if (!players.length) {
        return null;
    }

    const results =
        players.map(player => ({
            player,
            score:
                scoreCompetition(
                    player,
                    category,
                    true
                )
        }))
        .sort(
            (a, b) =>
                b.score - a.score
        );

    const winner =
        results[0]?.player || null;

    if (winner) {

        const resultText =
            results
                .slice(0, 3)
                .map(
                    (result, index) =>
                        `${index + 1}. ${
                            getDisplayName(
                                result.player
                            )
                        } (${result.score.toFixed(1)})`
                )
                .join(" • ");

        addEvent(
            `${eventName} results: ${resultText}.`,
            "competition-detail"
        );
    }

    return winner;
}

/* =========================================================
   HOH
========================================================= */

function getHOHEligible() {

    return getActiveHouseguests()
        .filter(
            player =>
                player.id !== outgoingHOH
        );
}

function runHOH() {

    const players =
        getHOHEligible();

    if (players.length < 2) {

        finishSeason();

        return;
    }

    const event =
        getCompetitionEvent("hoh");

    const name =
        competitionName(event);

    addEvent(
        `🏆 HOH COMPETITION: ${name}`,
        "competition"
    );

    if (event?.description) {

        addEvent(
            event.description,
            "competition-description"
        );
    }

    const winner =
        determineCompetitionWinner(
            players,
            event?.category ||
                "overall",
            name
        );

    if (!winner) return;

    currentHOH =
        winner.id;

    winner.hohWins++;
    winner.competitionWins++;
    winner.safety = true;

    addEvent(
        `👑 ${getDisplayName(winner)} won ${name} and is the new Head of Household.`,
        "competition"
    );

    currentStage =
        "nominations";
}

/* =========================================================
   THREAT / SOCIAL / ALLIANCE
========================================================= */

function getAllianceBetween(a, b) {

    if (!a || !b) return null;

    return alliances.find(
        alliance =>
            alliance.active !== false &&
            alliance.members.includes(a.id) &&
            alliance.members.includes(b.id)
    ) || null;
}

function getThreatScore(player) {

    if (!player) return 0;

    return (
        player.competitionWins * 5 +
        player.hohWins * 7 +
        player.povWins * 5 +
        player.strategic * 2.6 +
        player.social * 1.8 +
        player.physical * 1.4 +
        player.mental * 1.2
    );
}

function getSocialSafetyScore(player) {

    if (!player) return 0;

    const active =
        getActiveHouseguests()
            .filter(
                other =>
                    other.id !== player.id
            );

    if (!active.length) {
        return 0;
    }

    const positive =
        active.reduce(
            (sum, other) =>
                sum +
                Math.max(
                    0,
                    getRelationshipScore(
                        other.id,
                        player.id
                    )
                ),
            0
        );

    return positive /
        active.length;
}

function calculateNominationScore(
    hoh,
    target
) {

    const relationship =
        getRelationshipScore(
            hoh.id,
            target.id
        );

    const reverseRelationship =
        getRelationshipScore(
            target.id,
            hoh.id
        );

    const alliance =
        getAllianceBetween(
            hoh,
            target
        );

    const threat =
        getThreatScore(target);

    const socialSafety =
        getSocialSafetyScore(target);

    const strategic =
        target.strategic * 2.5;

    const volatility =
        (10 - target.temperament) *
        2.2;

    const revenge =
        Math.max(
            0,
            -reverseRelationship
        ) * .35;

    let alliancePenalty = 0;

    if (alliance) {

        if (
            alliance.strength ===
            "unbreakable"
        ) {

            alliancePenalty = 85;

        } else if (
            alliance.strength ===
            "strong"
        ) {

            alliancePenalty = 65;

        } else if (
            alliance.strength ===
            "moderate"
        ) {

            alliancePenalty = 45;

        } else {

            alliancePenalty = 20;
        }
    }

    return (
        threat * .65 +
        strategic +
        volatility +
        revenge -
        relationship * .7 -
        socialSafety * .4 -
        alliancePenalty +
        randomFloat(-7, 7)
    );
}

function rankNominationTargets(
    hoh,
    candidates
) {

    return candidates
        .map(player => ({
            player,
            score:
                calculateNominationScore(
                    hoh,
                    player
                )
        }))
        .sort(
            (a, b) =>
                b.score - a.score
        );
}

function isProtectedFromNomination(
    player
) {

    return (
        player.safety ||
        (
            player.app === "The Cloud" &&
            !player.appUsed
        )
    );
}

/* =========================================================
   NOMINATIONS
========================================================= */

function makeNominations() {

    const hoh =
        findPlayer(currentHOH);

    if (!hoh) return;

    /*
     * Safety is ceremony-specific.
     * Clear old HOH protection so old HOHs can be nominated.
     */
    getActiveHouseguests()
        .forEach(
            player =>
                player.safety = false
        );

    hoh.safety = true;

    const candidates =
        getActiveHouseguests()
            .filter(
                player =>
                    player.id !== hoh.id &&
                    !isProtectedFromNomination(
                        player
                    )
            );

    if (candidates.length < 2) {
        return;
    }

    const ranked =
        rankNominationTargets(
            hoh,
            candidates
        );

    nominees =
        ranked
            .slice(0, 2)
            .map(result => result.player);

    nominees.forEach(
        player =>
            player.safety = false
    );

    const nomineeNames =
        nominees
            .map(getDisplayName)
            .join(" and ");

    addEvent(
        `🎯 NOMINATION CEREMONY: ${getDisplayName(hoh)} nominated ${nomineeNames}.`,
        "nomination"
    );

    /*
     * BB App Store
     */
    if (
        getCurrentSeasonTemplate()
            ?.twists
            ?.appStore &&
        currentWeek <= 3
    ) {

        resolveAppStore();
    }

    /*
     * Identity Theft
     */
    const identity =
        getActiveHouseguests()
            .find(
                player =>
                    player.app ===
                        "Identity Theft" &&
                    !player.appUsed &&
                    player.id !== hoh.id
            );

    if (identity) {

        const alternativePool =
            getActiveHouseguests()
                .filter(
                    player =>
                        player.id !== hoh.id &&
                        player.id !== identity.id &&
                        !nominees.some(
                            nominee =>
                                nominee.id ===
                                player.id
                        ) &&
                        !isProtectedFromNomination(
                            player
                        )
                );

        const alternatives =
            rankNominationTargets(
                hoh,
                alternativePool
            );

        if (
            alternatives.length >= 2 &&
            randomFloat() < .65
        ) {

            nominees =
                alternatives
                    .slice(0, 2)
                    .map(
                        result =>
                            result.player
                    );

            identity.appUsed = true;

            addEvent(
                `🕵️ ${getDisplayName(identity)} secretly used Identity Theft and replaced the HOH's nominations.`,
                "twist"
            );

            addEvent(
                `The new nominees are ${getDisplayName(nominees[0])} and ${getDisplayName(nominees[1])}.`,
                "twist"
            );
        }
    }

    /*
     * The Cloud
     */
    const cloudHolder =
        getActiveHouseguests()
            .find(
                player =>
                    player.app ===
                        "The Cloud" &&
                    !player.appUsed &&
                    nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )
            );

    if (cloudHolder) {

        nominees =
            nominees.filter(
                nominee =>
                    nominee.id !==
                    cloudHolder.id
            );

        const replacementPool =
            getActiveHouseguests()
                .filter(
                    player =>
                        player.id !== hoh.id &&
                        !nominees.some(
                            nominee =>
                                nominee.id ===
                                player.id
                        ) &&
                        !isProtectedFromNomination(
                            player
                        )
                );

        const replacement =
            rankNominationTargets(
                hoh,
                replacementPool
            )[0]?.player;

        if (replacement) {

            nominees.push(
                replacement
            );
        }

        cloudHolder.appUsed = true;

        addEvent(
            `☁️ ${getDisplayName(cloudHolder)} used The Cloud and avoided the block.`,
            "twist"
        );
    }

    currentStage =
        currentWeek >= 6 &&
        currentWeek <= 7
            ? "hacker"
            : "pov";
}

/* =========================================================
   BB APP STORE
========================================================= */

function resolveAppStore() {

    const template =
        getCurrentSeasonTemplate();

    const appStore =
        template?.twists?.appStore;

    if (!appStore) return;

    const eligible =
        getActiveHouseguests()
            .filter(
                player =>
                    !player.app
            );

    if (!eligible.length) return;

    const unusedPowerApps =
        appStore.powerApps.filter(
            app =>
                !appStoreHistory.some(
                    history =>
                        history.name ===
                        app.name
                )
        );

    if (unusedPowerApps.length) {

        const recipient =
            eligible
                .slice()
                .sort(
                    (a, b) =>
                        (
                            b.social +
                            b.general +
                            b.loyalty
                        ) -
                        (
                            a.social +
                            a.general +
                            a.loyalty
                        )
                )[0];

        const app =
            unusedPowerApps[0];

        recipient.app =
            app.name;

        appStoreHistory.push({
            week: currentWeek,
            player: recipient.id,
            name: app.name
        });

        addEvent(
            `📱 BB APP STORE: ${getDisplayName(recipient)} received ${app.name}.`,
            "twist"
        );

        if (
            app.type === "bonusLife"
        ) {

            bonusLifeEligible =
                recipient.id;
        }
    }

    const crapEligible =
        eligible.filter(
            player =>
                !player.app
        );

    const unusedCrap =
        appStore.crapApps.filter(
            app =>
                !appStoreHistory.some(
                    history =>
                        history.name ===
                        app.name
                )
        );

    if (
        crapEligible.length &&
        unusedCrap.length
    ) {

        const recipient =
            crapEligible
                .slice()
                .sort(
                    (a, b) =>
                        (
                            a.social +
                            a.general
                        ) -
                        (
                            b.social +
                            b.general
                        )
                )[0];

        const app =
            unusedCrap[0];

        recipient.app =
            app.name;

        appStoreHistory.push({
            week: currentWeek,
            player: recipient.id,
            name: app.name
        });

        addEvent(
            `📱 BB APP STORE: ${getDisplayName(recipient)} received the ${app.name} punishment app.`,
            "twist"
        );
    }
}

/* =========================================================
   H@CKER COMPETITION
========================================================= */

function runHacker() {

    const event =
        getCompetitionEvent(
            "hacker"
        );

    const name =
        competitionName(event);

    addEvent(
        `💻 H@CKER COMPETITION: ${name}`,
        "twist"
    );

    const eligible =
        getActiveHouseguests()
            .filter(
                player =>
                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )
            );

    if (eligible.length < 2) {

        currentStage = "pov";

        return;
    }

    const winner =
        determineCompetitionWinner(
            eligible,
            event?.category ||
                "mental",
            name
        );

    if (!winner) {

        currentStage = "pov";

        return;
    }

    hackerWinner =
        winner.id;

    hackerPower = {
        replacementUsed: false,
        vetoPickUsed: false,
        voteNullified: false
    };

    winner.competitionWins++;

    addEvent(
        `🕵️ ${getDisplayName(winner)} secretly won the H@cker Competition.`,
        "twist"
    );

    /*
     * H@cker replacement nominee power.
     */
    const hoh =
        findPlayer(currentHOH);

    const replacementPool =
        getActiveHouseguests()
            .filter(
                player =>
                    player.id !==
                        currentHOH &&
                    player.id !==
                        winner.id &&
                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    ) &&
                    !isProtectedFromNomination(
                        player
                    )
            );

    if (
        hoh &&
        replacementPool.length
    ) {

        const ranked =
            replacementPool
                .map(player => ({
                    player,
                    score:
                        calculateNominationScore(
                            hoh,
                            player
                        ) +
                        getThreatScore(
                            player
                        ) * .45
                }))
                .sort(
                    (a, b) =>
                        b.score -
                        a.score
                );

        const replacement =
            ranked[0]?.player;

        const saved =
            nominees
                .slice()
                .sort(
                    (a, b) =>
                        getThreatScore(a) -
                        getThreatScore(b)
                )[0];

        if (
            replacement &&
            saved &&
            (
                getThreatScore(
                    replacement
                ) >
                getThreatScore(saved)
            )
        ) {

            nominees =
                nominees.map(
                    nominee =>
                        nominee.id ===
                            saved.id
                            ? replacement
                            : nominee
                );

            replacementNominee =
                replacement;

            hackerPower.replacementUsed =
                true;

            addEvent(
                `💻 H@CKER POWER: ${getDisplayName(saved)} was replaced by ${getDisplayName(replacement)}.`,
                "twist"
            );
        }
    }

    currentStage =
        "pov";
}

/* =========================================================
   POV
========================================================= */

function runPOV() {

    const event =
        getCompetitionEvent(
            "pov"
        );

    const name =
        competitionName(event);

    addEvent(
        `🏆 POWER OF VETO COMPETITION: ${name}`,
        "competition"
    );

    const active =
        getActiveHouseguests();

    const guaranteed =
        [
            findPlayer(currentHOH),
            ...nominees
        ].filter(Boolean);

    const randomPool =
        active.filter(
            player =>
                !guaranteed.some(
                    guaranteedPlayer =>
                        guaranteedPlayer.id ===
                        player.id
                )
        );

    const extraCount =
        Math.max(
            0,
            6 - guaranteed.length
        );

    const extras =
        randomPool
            .slice()
            .sort(
                () =>
                    Math.random() -
                    .5
            )
            .slice(
                0,
                extraCount
            );

    povPlayers = [
        ...guaranteed,
        ...extras
    ];

    /*
     * H@cker chooses one of the
     * three random POV players.
     */
    if (
        hackerWinner &&
        !hackerPower.vetoPickUsed &&
        currentWeek >= 6 &&
        currentWeek <= 7
    ) {

        const hacker =
            findPlayer(
                hackerWinner
            );

        const hackerEligible =
            randomPool.filter(
                player =>
                    !extras.some(
                        extra =>
                            extra.id ===
                            player.id
                    )
            );

        if (
            hacker &&
            hackerEligible.length &&
            extras.length >= 1
        ) {

            const selected =
                hackerEligible
                    .slice()
                    .sort(
                        (a, b) =>
                            scoreCompetition(
                                b,
                                event?.category ||
                                    "overall",
                                false
                            ) -
                            scoreCompetition(
                                a,
                                event?.category ||
                                    "overall",
                                false
                            )
                    )[0];

            const weakest =
                extras
                    .slice()
                    .sort(
                        (a, b) =>
                            scoreCompetition(
                                a,
                                event?.category ||
                                    "overall",
                                false
                            ) -
                            scoreCompetition(
                                b,
                                event?.category ||
                                    "overall",
                                false
                            )
                    )[0];

            if (
                selected &&
                weakest
            ) {

                povPlayers =
                    povPlayers.map(
                        player =>
                            player.id ===
                                weakest.id
                                ? selected
                                : player
                    );

                hackerPower.vetoPickUsed =
                    true;

                addEvent(
                    `💻 H@CKER POWER: ${getDisplayName(hacker)} selected ${getDisplayName(selected)} to replace ${getDisplayName(weakest)} as a Veto player.`,
                    "twist"
                );
            }
        }
    }

    addEvent(
        `POV Players: ${povPlayers.map(getDisplayName).join(", ")}.`,
        "veto-draw"
    );

    povWinner =
        determineCompetitionWinner(
            povPlayers,
            event?.category ||
                "overall",
            name
        );

    if (!povWinner) {

        currentStage =
            "eviction";

        return;
    }

    povWinner.povWins++;
    povWinner.competitionWins++;

    addEvent(
        `💎 ${getDisplayName(povWinner)} won the Power of Veto.`,
        "competition"
    );

    currentStage =
        "veto";
}

/* =========================================================
   VETO CEREMONY
========================================================= */

function usePOV() {

    if (
        !nominees.length ||
        !povWinner
    ) {

        currentStage =
            "eviction";

        return;
    }

    const nomineeWinner =
        nominees.find(
            nominee =>
                nominee.id ===
                povWinner.id
        );

    if (!nomineeWinner) {

        addEvent(
            `${getDisplayName(povWinner)} chose not to use the Power of Veto.`,
            "veto"
        );

        currentStage =
            "eviction";

        return;
    }

    const hoh =
        findPlayer(currentHOH);

    const replacementCandidates =
        getActiveHouseguests()
            .filter(
                player =>
                    player.id !==
                        currentHOH &&
                    player.id !==
                        povWinner.id &&
                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    ) &&
                    !isProtectedFromNomination(
                        player
                    )
            );

    const replacement =
        hoh
            ? rankNominationTargets(
                hoh,
                replacementCandidates
            )[0]?.player
            : null;

    const usesVeto =
        Boolean(
            replacement &&
            (
                povWinner.loyalty +
                povWinner.social +
                povWinner.strategic >=
                    20 ||
                getThreatScore(
                    nomineeWinner
                ) >
                    getThreatScore(
                        replacement
                    ) + 8 ||
                getRelationshipScore(
                    povWinner.id,
                    nomineeWinner.id
                ) > 30
            )
        );

    if (usesVeto) {

        nominees =
            nominees.map(
                nominee =>
                    nominee.id ===
                        nomineeWinner.id
                        ? replacement
                        : nominee
            );

        replacementNominee =
            replacement;

        addEvent(
            `💎 ${getDisplayName(povWinner)} used the Power of Veto on ${getDisplayName(nomineeWinner)}.`,
            "veto"
        );

        addEvent(
            `${getDisplayName(replacement)} is the replacement nominee.`,
            "nomination"
        );

    } else {

        addEvent(
            `💎 ${getDisplayName(povWinner)} did not use the Power of Veto.`,
            "veto"
        );
    }

    currentStage =
        "eviction";
}

/* =========================================================
   VOTING
========================================================= */

function voteScore(
    voter,
    target
) {

    const relationship =
        getRelationshipScore(
            voter.id,
            target.id
        );

    const reverseRelationship =
        getRelationshipScore(
            target.id,
            voter.id
        );

    const alliance =
        getAllianceBetween(
            voter,
            target
        );

    const threat =
        getThreatScore(target);

    const social =
        getSocialSafetyScore(target);

    const fear =
        voter.temperament < 5
            ? Math.max(
                0,
                threat - 45
            ) * .45
            : Math.max(
                0,
                threat - 60
            ) * .25;

    const betrayal =
        Math.max(
            0,
            -relationship
        ) * .8 +
        Math.max(
            0,
            -reverseRelationship
        ) * .25;

    let allianceBonus = 0;

    if (alliance) {

        if (
            alliance.strength ===
            "unbreakable"
        ) {

            allianceBonus = 75;

        } else if (
            alliance.strength ===
            "strong"
        ) {

            allianceBonus = 55;

        } else if (
            alliance.strength ===
            "moderate"
        ) {

            allianceBonus = 35;

        } else {

            allianceBonus = 20;
        }
    }

    return (
        betrayal +
        fear +
        social * .25 -
        allianceBonus -
        target.loyalty * 1.3 +
        relationship * .2 +
        randomFloat(-8, 8)
    );
}

function prepareEvictionVotes() {

    if (nominees.length < 2) {

        currentStage =
            "evictionReveal";

        return;
    }

    const voters =
        getActiveHouseguests()
            .filter(
                player =>
                    player.id !==
                        currentHOH &&
                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )
            );

    const counts =
        Object.fromEntries(
            nominees.map(
                nominee => [
                    nominee.id,
                    0
                ]
            )
        );

    evictionVotes = {};

    addEvent(
        "🗳️ EVICTION VOTE",
        "eviction"
    );

    voters.forEach(voter => {

        const ranked =
            nominees
                .map(target => ({
                    target,
                    score:
                        voteScore(
                            voter,
                            target
                        )
                }))
                .sort(
                    (a, b) =>
                        b.score -
                        a.score
                );

        const target =
            ranked[0]?.target;

        if (!target) return;

        evictionVotes[
            voter.id
        ] = target.id;

        counts[
            target.id
        ]++;

        addEvent(
            `${getDisplayName(voter)} voted to evict ${getDisplayName(target)}.`,
            "vote-detail"
        );
    });

    /*
     * H@cker can nullify one vote.
     */
    if (
        hackerWinner &&
        !hackerPower.voteNullified &&
        currentWeek >= 6 &&
        currentWeek <= 7
    ) {

        const hacker =
            findPlayer(
                hackerWinner
            );

        if (
            hacker &&
            evictionVotes[hacker.id]
        ) {

            const vote =
                evictionVotes[
                    hacker.id
                ];

            counts[vote] =
                Math.max(
                    0,
                    counts[vote] - 1
                );

            delete evictionVotes[
                hacker.id
            ];

            hackerPower.voteNullified =
                true;

            addEvent(
                `💻 H@CKER POWER: ${getDisplayName(hacker)} nullified one eviction vote.`,
                "twist"
            );
        }
    }

    const first =
        counts[nominees[0].id] ||
        0;

    const second =
        counts[nominees[1].id] ||
        0;

    let target;

    if (first === second) {

        const hoh =
            findPlayer(currentHOH);

        target =
            [nominees[0], nominees[1]]
                .sort(
                    (a, b) =>
                        voteScore(
                            hoh,
                            b
                        ) -
                        voteScore(
                            hoh,
                            a
                        )
                )[0];

        addEvent(
            `The vote is tied ${first}-${second}.`,
            "eviction"
        );

        addEvent(
            `${getDisplayName(hoh)} cast the deciding vote to evict ${getDisplayName(target)}.`,
            "vote"
        );

    } else {

        target =
            first > second
                ? nominees[0]
                : nominees[1];
    }

    currentEvictionTarget =
        target.id;

    addEvent(
        `Eviction vote: ${getDisplayName(nominees[0])} received ${first} vote(s); ${getDisplayName(nominees[1])} received ${second} vote(s).`,
        "vote-summary"
    );

    addEvent(
        `🚪 ${getDisplayName(target)} has been evicted.`,
        "vote-result"
    );

    currentStage =
        "evictionReveal";
}

/* =========================================================
   JURY BATTLE BACK
========================================================= */

function maybeRunBattleBack() {

    if (battleBackCompleted) {
        return;
    }

    const template =
        getCurrentSeasonTemplate();

    const required =
        Number(
            template?.twists
                ?.juryBattleBack
                ?.jurors || 4
        );

    if (jury.length !== required) {
        return;
    }

    const candidates =
        jury
            .slice()
            .filter(
                player =>
                    player.status ===
                    "Evicted"
            );

    if (candidates.length < 4) {
        return;
    }

    battleBackCompleted =
        true;

    addEvent(
        "🏆 JURY BATTLE BACK: The first four Jurors compete for a chance to return.",
        "twist"
    );

    const event =
        template.twists.juryBattleBack;

    const winner =
        determineCompetitionWinner(
            candidates,
            "physical",
            event?.competition ||
                "Big Top Drop"
        );

    if (!winner) return;

    winner.status = "Active";
    winner.inGame = true;
    winner.evicted = false;
    winner.juryMember = false;
    winner.placement = null;
    winner.evictionWeek = null;

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

    addEvent(
        `🎉 ${getDisplayName(winner)} won the Jury Battle Back and returned to the game!`,
        "twist"
    );
}

/* =========================================================
   EVICTION
========================================================= */

function executeEviction() {

    const target =
        findPlayer(
            currentEvictionTarget
        );

    if (!target) return;

    const remainingBefore =
        getActiveHouseguests().length;

    target.status =
        "Evicted";

    target.inGame =
        false;

    target.evicted =
        true;

    target.evictionWeek =
        currentWeek;

    target.placement =
        remainingBefore;

    target.safety =
        false;

    evictedHouseguests.push(
        target
    );

    const template =
        getCurrentSeasonTemplate();

    /*
     * Nine-person jury.
     *
     * With 16 starting players and
     * 2 finalists, the 6th eviction
     * starts a 9-person jury.
     */
    const juryThreshold =
        Number(
            template?.juryStartAfterEvictions ??
            5
        );

    if (
        evictedHouseguests.length >
            juryThreshold &&
        jury.length <
            Number(
                template?.jurySize ||
                9
            )
    ) {

        target.juryMember =
            true;

        jury.push(
            target
        );

        addEvent(
            `⚖️ ${getDisplayName(target)} joined the Jury.`,
            "jury"
        );

        maybeRunBattleBack();
    }

    currentEvictedPlayer =
        target;

    addEvent(
        `🚪 ${getDisplayName(target)} leaves the Big Brother house.`,
        "eviction"
    );

    /*
     * Bonus Life.
     */
    if (
        bonusLifeEligible ===
            target.id &&
        evictedHouseguests.length <= 4
    ) {

        const returnScore =
            scoreCompetition(
                target,
                "overall"
            );

        if (
            returnScore > 58 ||
            randomFloat() < .35
        ) {

            target.status =
                "Active";

            target.inGame =
                true;

            target.evicted =
                false;

            target.placement =
                null;

            evictedHouseguests =
                evictedHouseguests.filter(
                    player =>
                        player.id !==
                        target.id
                );

            addEvent(
                `🎁 BONUS LIFE: ${getDisplayName(target)} returned to the game!`,
                "twist"
            );
        }

        bonusLifeEligible =
            null;
    }

    nominees = [];
    povPlayers = [];
    povWinner = null;
    replacementNominee = null;

    currentEvictionTarget =
        null;

    outgoingHOH =
        currentHOH;

    currentHOH =
        null;

    /*
     * Final 2.
     */
    if (
        getActiveHouseguests().length === 2
    ) {

        currentStage =
            "finale";

        finishSeason();

        return;
    }

    /*
     * Final 3.
     */
    if (
        getActiveHouseguests().length === 3
    ) {

        currentStage =
            "finalHOH1";

        return;
    }

    /*
     * Double eviction.
     */
    const weekData =
        template?.competitions?.[
            currentWeek
        ];

    if (
        (
            weekData?.doubleEviction ||
            weekData?.secondHOH
        ) &&
        currentCycle === 1
    ) {

        pendingSecondCycle =
            true;

        currentCycle =
            2;

        currentStage =
            "hoh";

        addEvent(
            "⚡ DOUBLE EVICTION: The second cycle begins immediately.",
            "season"
        );

        return;
    }

    /*
     * New week.
     */
    currentCycle =
        1;

    pendingSecondCycle =
        false;

    currentWeek++;

    currentStage =
        "hoh";

    outgoingHOH =
        null;

    addEvent(
        `📅 Week ${currentWeek} begins.`,
        "season"
    );
}

/* =========================================================
   RELATIONSHIP EVOLUTION
========================================================= */

function evolveRelationshipsAfterEvent() {

    const active =
        getActiveHouseguests();

    active.forEach(a => {

        active.forEach(b => {

            if (a.id === b.id) {
                return;
            }

            let relationship =
                getRelationship(
                    a.id,
                    b.id
                );

            if (!relationship) {

                if (
                    Math.random() < .18
                ) {

                    relationships.push({
                        id: makeId("rel"),
                        from: a.id,
                        to: b.id,
                        type: "neutral",
                        score: 0,
                        note:
                            "Naturally evolving"
                    });
                }

                return;
            }

            const alliance =
                getAllianceBetween(
                    a,
                    b
                );

            let delta =
                randomInt(-5, 5);

            if (alliance) {
                delta += 2;
            }

            if (
                a.id === currentHOH
            ) {
                delta += randomInt(
                    -2,
                    3
                );
            }

            relationship.score =
                Math.max(
                    -100,
                    Math.min(
                        100,
                        Number(
                            relationship.score ||
                            0
                        ) + delta
                    )
                );

            if (
                relationship.score >= 75
            ) {

                relationship.type =
                    "love";

            } else if (
                relationship.score >= 25
            ) {

                relationship.type =
                    "like";

            } else if (
                relationship.score <= -75
            ) {

                relationship.type =
                    "hate";

            } else if (
                relationship.score <= -25
            ) {

                relationship.type =
                    "dislike";

            } else {

                relationship.type =
                    "neutral";
            }
        });
    });
}

/* =========================================================
   FINAL HOH
========================================================= */

function runFinalHOHPart(part) {

    const finalists =
        getActiveHouseguests();

    if (
        finalists.length !== 3 &&
        part < 3
    ) {
        return;
    }

    const event =
        getCurrentSeasonTemplate()
            ?.competitions?.[13]
            ?.finalHOH?.[
                part - 1
            ];

    const name =
        competitionName(event);

    addEvent(
        `🏆 FINAL HOH PART ${part}: ${name}`,
        "finale"
    );

    if (part === 1) {

        finalHOH.part1 =
            determineCompetitionWinner(
                finalists,
                event?.category ||
                    "endurance",
                name
            );
    }

    if (part === 2) {

        const players =
            finalists.filter(
                player =>
                    player.id !==
                    finalHOH.part1?.id
            );

        finalHOH.part2 =
            determineCompetitionWinner(
                players,
                event?.category ||
                    "mental",
                name
            );
    }

    if (part === 3) {

        const players =
            finalists.filter(
                player =>
                    player.id !==
                    finalHOH.part2?.id
            );

        finalHOH.part3 =
            determineCompetitionWinner(
                players,
                event?.category ||
                    "strategic",
                name
            );

        finalHOH.winner =
            finalHOH.part3;

        addEvent(
            `👑 ${getDisplayName(finalHOH.winner)} won Final HOH Part 3.`,
            "finale"
        );

        currentStage =
            "finalVote";

        return;
    }

    const winner =
        part === 1
            ? finalHOH.part1
            : finalHOH.part2;

    addEvent(
        `${getDisplayName(winner)} won Final HOH Part ${part}.`,
        "finale"
    );

    currentStage =
        part === 1
            ? "finalHOH2"
            : "finalHOH3";
}

/* =========================================================
   FINALE
========================================================= */

function finishSeason() {

    const finalists =
        getActiveHouseguests();

    if (finalists.length === 3) {

        if (!finalHOH.winner) {

            currentStage =
                "finalHOH1";

            return;
        }
    }

    if (
        finalists.length <= 2 &&
        !finaleWinner
    ) {

        const ordered =
            finalists
                .slice()
                .sort(
                    (a, b) =>
                        (
                            b.strategic +
                            b.social +
                            b.loyalty
                        ) -
                        (
                            a.strategic +
                            a.social +
                            a.loyalty
                        )
                );

        finaleWinner =
            ordered[0] || null;
    }

    if (!finaleWinner) {
        return;
    }

    finaleWinner.status =
        "Winner";

    finaleWinner.inGame =
        false;

    finaleWinner.placement =
        1;

    const finalistsRemaining =
        getActiveHouseguests();

    finalistsRemaining.forEach(
        player => {

            if (
                player.id !==
                finaleWinner.id
            ) {

                player.status =
                    "Finalist";

                player.inGame =
                    false;

                player.placement =
                    2;
            }
        }
    );

    /*
     * Jury vote.
     */
    const juryPool =
        jury.filter(
            juror =>
                juror.id !==
                finaleWinner.id
        );

    const candidates = [
        finaleWinner,
        ...finalistsRemaining
            .filter(
                player =>
                    player.id !==
                    finaleWinner.id
            )
    ];

    juryVotes = {};

    juryPool.forEach(juror => {

        const ranked =
            candidates
                .map(candidate => {

                    const relationship =
                        getRelationshipScore(
                            juror.id,
                            candidate.id
                        );

                    const reverse =
                        getRelationshipScore(
                            candidate.id,
                            juror.id
                        );

                    const resume =
                        candidate.strategic * 1.5 +
                        candidate.social * 1.4 +
                        candidate.loyalty * .7;

                    const threat =
                        getThreatScore(
                            candidate
                        ) * .12;

                    return {
                        candidate,
                        score:
                            relationship * .65 +
                            reverse * .25 +
                            resume +
                            threat +
                            randomFloat(
                                -5,
                                5
                            )
                    };
                })
                .sort(
                    (a, b) =>
                        b.score -
                        a.score
                );

        const vote =
            ranked[0]?.candidate;

        if (vote) {

            juryVotes[
                juror.id
            ] =
                vote.id;
        }
    });

    const counts = {};

    Object.values(
        juryVotes
    ).forEach(id => {

        counts[id] =
            (counts[id] || 0) + 1;
    });

    const winner =
        candidates
            .slice()
            .sort(
                (a, b) =>
                    (counts[b.id] || 0) -
                    (counts[a.id] || 0)
            )[0];

    /*
     * The jury determines the actual winner.
     */
    if (
        winner &&
        winner.id !==
            finaleWinner.id
    ) {

        finaleWinner.status =
            "Finalist";

        finaleWinner.placement =
            2;

        winner.status =
            "Winner";

        winner.placement =
            1;

        finaleWinner =
            winner;
    }

    seasonFinished =
        true;

    currentStage =
        "finished";

    addEvent(
        `🏆 ${getDisplayName(finaleWinner)} has won ${seasonName}!`,
        "finale"
    );

    addEvent(
        `The Jury has awarded ${counts[finaleWinner.id] || 0} vote(s) to ${getDisplayName(finaleWinner)}.`,
        "finale"
    );

    renderFinale();
}

/* =========================================================
   WEEKLY SIMULATION FEED
========================================================= */

function renderWeeklySimulationFeed() {

    const container =
        $("weeklySimulationFeed");

    if (!container) return;

    if (!eventLog.length) {

        container.innerHTML = `
            <div class="empty-state">
                Start the season to see the week-by-week simulation.
            </div>
        `;

        return;
    }

    /*
     * Group events by week/cycle.
     */
    const groups = {};

    eventLog.forEach(event => {

        const key =
            `${event.week}-${event.cycle}`;

        if (!groups[key]) {
            groups[key] = [];
        }

        groups[key].push(event);
    });

    const groupHTML =
        Object.entries(groups)
            .reverse()
            .map(([key, events]) => {

                const [
                    week,
                    cycle
                ] = key.split("-");

                return `
                    <section class="weekly-feed-week">

                        <div class="weekly-feed-week-title">

                            <strong>
                                WEEK ${week}
                            </strong>

                            ${
                                Number(cycle) > 1
                                    ? `<span>
                                        CYCLE ${cycle}
                                       </span>`
                                    : ""
                            }

                        </div>

                        <div class="weekly-feed-events">

                            ${
                                events
                                    .map(
                                        renderFeedEvent
                                    )
                                    .join("")
                            }

                        </div>

                    </section>
                `;
            })
            .join("");

    container.innerHTML =
        groupHTML;
}

function renderFeedEvent(event) {

    const text =
        escapeHTML(
            event.text
        );

    /*
     * Find every Houseguest mentioned
     * in this event.
     */
    const mentioned =
        houseguests.filter(
            player =>
                event.text.includes(
                    getDisplayName(player)
                )
        );

    const unique =
        [
            ...new Map(
                mentioned.map(
                    player => [
                        player.id,
                        player
                    ]
                )
            ).values()
        ].slice(0, 6);

    const portraits =
        unique.map(player => `
            <div class="feed-person">

                ${getPlayerImageHTML(
                    player,
                    "feed-person-photo"
                )}

                <span>
                    ${escapeHTML(
                        getDisplayName(player)
                    )}
                </span>

            </div>
        `).join("");

    return `
        <article
            class="
                weekly-feed-event
                event-${escapeAttribute(
                    event.type || "general"
                )}
            "
        >

            <div class="weekly-feed-text">
                ${text}
            </div>

            ${
                portraits
                    ? `
                        <div class="weekly-feed-people">
                            ${portraits}
                        </div>
                    `
                    : ""
            }

        </article>
    `;
}

/* =========================================================
   EVENT LOG
========================================================= */

function renderEventLog() {

    const container =
        $("eventLog");

    if (!container) return;

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
            .map(event => `
                <div class="event-log-entry">

                    <span class="event-log-week">
                        W${event.week}
                        ${
                            event.cycle > 1
                                ? ` C${event.cycle}`
                                : ""
                        }
                    </span>

                    <span class="event-log-text">
                        ${escapeHTML(
                            event.text
                        )}
                    </span>

                </div>
            `)
            .join("");
}

/* =========================================================
   FINALE DISPLAY
========================================================= */

function renderFinale() {

    const container =
        $("finaleContent");

    if (!container) return;

    if (!seasonFinished) {

        container.innerHTML = `
            <div class="empty-state">
                The finale will appear here when the season is complete.
            </div>
        `;

        return;
    }

    const winner =
        finaleWinner;

    const voteRows =
        Object.entries(
            juryVotes || {}
        ).map(
            ([jurorId, candidateId]) => {

                const juror =
                    findPlayer(jurorId);

                const candidate =
                    findPlayer(candidateId);

                return `
                    <div class="jury-vote-row">

                        ${getPlayerImageHTML(
                            juror,
                            "jury-vote-photo"
                        )}

                        <strong>
                            ${escapeHTML(
                                getDisplayName(juror)
                            )}
                        </strong>

                        <span>
                            voted for
                        </span>

                        ${getPlayerImageHTML(
                            candidate,
                            "jury-vote-photo"
                        )}

                        <strong>
                            ${escapeHTML(
                                getDisplayName(candidate)
                            )}
                        </strong>

                    </div>
                `;
            }
        ).join("");

    container.innerHTML = `

        <div class="final-stage-card">

            <h2>
                🏆 ${escapeHTML(
                    getDisplayName(winner)
                )} is the winner!
            </h2>

            <div class="final-winner">

                ${getPlayerImageHTML(
                    winner,
                    "final-winner-photo"
                )}

                <h3>
                    ${escapeHTML(
                        getDisplayName(winner)
                    )}
                </h3>

            </div>

            <h3>
                Final Jury Vote
            </h3>

            <div class="jury-votes">

                ${
                    voteRows ||
                    `<p>
                        No Jury votes recorded.
                     </p>`
                }

            </div>

        </div>
    `;
}

/* =========================================================
   UPDATE EVERYTHING
========================================================= */

function updateAllDisplays() {

    normalizeAllHouseguests();

    renderCast();
    renderAllRelationshipControls();
    renderAlliances();
    renderRelationships();
    renderTwists();
    renderMemoryWall();
    renderJury();
    renderGameHouseguests();
    renderGameStatus();
    renderEventLog();
    renderWeeklySimulationFeed();
    renderFinale();

    updateGameStageDisplay();
    updateSelectedSeasonInfo();
    updateSeasonSummary();
}

/* =========================================================
   SEASON SUMMARY
========================================================= */

function updateSeasonSummary() {

    const summary =
        $("seasonSummary");

    if (!summary) return;

    const active =
        getActiveHouseguests()
            .length;

    summary.innerHTML = `

        <div>
            <strong>
                Format
            </strong>

            <span>
                ${escapeHTML(
                    seasonName
                )}
            </span>
        </div>

        <div>
            <strong>
                Houseguests
            </strong>

            <span>
                ${houseguests.length}
            </span>
        </div>

        <div>
            <strong>
                Active
            </strong>

            <span>
                ${active}
            </span>
        </div>

        <div>
            <strong>
                Evicted
            </strong>

            <span>
                ${evictedHouseguests.length}
            </span>
        </div>

        <div>
            <strong>
                Jury
            </strong>

            <span>
                ${jury.length}
            </span>
        </div>

        <div>
            <strong>
                Status
            </strong>

            <span>
                ${
                    seasonFinished
                        ? "Finished"
                        : seasonStarted
                            ? `Week ${currentWeek}`
                            : "Not Started"
                }
            </span>
        </div>
    `;
}

/* =========================================================
   MAIN GAME ENGINE
========================================================= */

function proceedGame() {

    if (!seasonStarted) {

        alert(
            "Start a season first."
        );

        return;
    }

    if (seasonFinished) {

        showSection("finale");

        return;
    }

    switch (currentStage) {

        case "opening":

            addEvent(
                `🏠 ${seasonName} begins.`,
                "season"
            );

            currentStage =
                "hoh";

            break;

        case "hoh":

            runHOH();

            break;

        case "nominations":

            makeNominations();

            break;

        case "hacker":

            runHacker();

            break;

        case "pov":

            runPOV();

            break;

        case "veto":

            usePOV();

            break;

        case "eviction":

            prepareEvictionVotes();

            break;

        case "evictionReveal":

            executeEviction();

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

        case "finalVote": {

            const winner =
                finalHOH.winner;

            const others =
                getActiveHouseguests()
                    .filter(
                        player =>
                            player.id !==
                            winner.id
                    );

            if (others.length) {

                const evicted =
                    others
                        .slice()
                        .sort(
                            (a, b) =>
                                voteScore(
                                    winner,
                                    b
                                ) -
                                voteScore(
                                    winner,
                                    a
                                )
                        )[0];

                evicted.status =
                    "Evicted";

                evicted.inGame =
                    false;

                evicted.evicted =
                    true;

                evicted.placement =
                    3;

                if (
                    !evictedHouseguests.some(
                        player =>
                            player.id ===
                            evicted.id
                    )
                ) {

                    evictedHouseguests.push(
                        evicted
                    );
                }

                addEvent(
                    `🚪 ${getDisplayName(winner)} evicted ${getDisplayName(evicted)} at the Final 3.`,
                    "finale"
                );
            }

            currentStage =
                "finale";

            break;
        }

        case "finale":

            finishSeason();

            break;

        default:

            currentStage =
                "hoh";

            break;
    }

    evolveRelationshipsAfterEvent();

    updateAllDisplays();

    saveGameSilently();
}

/* =========================================================
   SIMULATE TO END
========================================================= */

function skipToEnd() {

    if (!seasonStarted) {

        alert(
            "Start a season first."
        );

        return;
    }

    let guard = 0;

    while (
        !seasonFinished &&
        guard < 500
    ) {

        guard++;

        const before =
            currentStage;

        proceedGame();

        if (
            currentStage === before &&
            !seasonFinished
        ) {

            /*
             * Prevent an accidental
             * infinite loop.
             */
            if (
                currentStage !==
                "hoh"
            ) {

                currentStage =
                    "hoh";
            }
        }
    }

    updateAllDisplays();

    saveGameSilently();

    if (seasonFinished) {
        showSection("finale");
    }
}

/* =========================================================
   SAVE / LOAD
========================================================= */

function getSaveState() {

    return {
        version: 5,

        houseguests,
        evictedHouseguests,
        jury,

        alliances,
        relationships,
        customTwists,
        eventLog,

        selectedSeasonTemplate,
        seasonName,
        seasonFormat,

        seasonStarted,
        seasonFinished,

        currentWeek,
        currentCycle,
        currentStage,

        currentHOH,

        nominees:
            nominees.map(
                player =>
                    player.id
            ),

        povPlayers:
            povPlayers.map(
                player =>
                    player.id
            ),

        povWinner:
            povWinner?.id ||
            null,

        hackerWinner,

        replacementNominee:
            replacementNominee?.id ||
            null,

        evictionVotes,

        currentEvictionTarget,

        currentEvictedPlayer:
            currentEvictedPlayer?.id ||
            null,

        finaleWinner:
            finaleWinner?.id ||
            null,

        finalHOH: {
            part1:
                finalHOH.part1?.id ||
                null,

            part2:
                finalHOH.part2?.id ||
                null,

            part3:
                finalHOH.part3?.id ||
                null,

            winner:
                finalHOH.winner?.id ||
                null
        },

        juryVotes,
        juryVoteRevealIndex,

        outgoingHOH,

        hackerPower,

        appStoreHistory,
        bonusLifeEligible,

        battleBackCompleted,
        pendingSecondCycle
    };
}

function saveGameSilently() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                getSaveState()
            )
        );

    } catch (error) {

        console.warn(
            "Could not save game.",
            error
        );
    }
}

function saveGame() {

    saveGameSilently();

    alert(
        "Game saved in this browser."
    );
}

/* =========================================================
   LOAD
========================================================= */

function loadGame() {

    try {

        const raw =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!raw) {

            /*
             * If there is no saved game,
             * load BB20 cast instead of
             * leaving the page empty.
             */
            ensureBB20Cast();

            updateAllDisplays();

            alert(
                "No saved game was found. The BB20 cast has been loaded."
            );

            return;
        }

        const state =
            JSON.parse(raw);

        houseguests =
            (state.houseguests || [])
                .map(
                    normalizeHouseguest
                );

        /*
         * Reconnect jury and evicted
         * players to the actual
         * houseguest objects.
         */
        const evictedIds =
            (state.evictedHouseguests || [])
                .map(
                    player =>
                        typeof player ===
                            "string"
                            ? player
                            : player.id
                )
                .filter(Boolean);

        const juryIds =
            (state.jury || [])
                .map(
                    player =>
                        typeof player ===
                            "string"
                            ? player
                            : player.id
                )
                .filter(Boolean);

        evictedHouseguests =
            evictedIds
                .map(findPlayer)
                .filter(Boolean);

        jury =
            juryIds
                .map(findPlayer)
                .filter(Boolean);

        alliances =
            state.alliances ||
            [];

        relationships =
            state.relationships ||
            [];

        customTwists =
            state.customTwists ||
            [];

        eventLog =
            state.eventLog ||
            [];

        selectedSeasonTemplate =
            state.selectedSeasonTemplate ||
            "bb20";

        if ($("seasonSelect")) {

            $("seasonSelect").value =
                selectedSeasonTemplate;
        }

        seasonName =
            state.seasonName ||
            "Big Brother 20";

        seasonFormat =
            state.seasonFormat ||
            selectedSeasonTemplate;

        seasonStarted =
            Boolean(
                state.seasonStarted
            );

        seasonFinished =
            Boolean(
                state.seasonFinished
            );

        currentWeek =
            Number(
                state.currentWeek ||
                1
            );

        currentCycle =
            Number(
                state.currentCycle ||
                1
            );

        currentStage =
            state.currentStage ||
            "opening";

        currentHOH =
            state.currentHOH ||
            null;

        hackerWinner =
            state.hackerWinner ||
            null;

        evictionVotes =
            state.evictionVotes ||
            {};

        currentEvictionTarget =
            state.currentEvictionTarget ||
            null;

        finalHOH = {
            part1:
                findPlayer(
                    state.finalHOH?.part1
                ),

            part2:
                findPlayer(
                    state.finalHOH?.part2
                ),

            part3:
                findPlayer(
                    state.finalHOH?.part3
                ),

            winner:
                findPlayer(
                    state.finalHOH?.winner
                )
        };

        juryVotes =
            state.juryVotes ||
            {};

        juryVoteRevealIndex =
            Number(
                state.juryVoteRevealIndex ||
                0
            );

        outgoingHOH =
            state.outgoingHOH ||
            null;

        hackerPower =
            state.hackerPower ||
            {
                replacementUsed: false,
                vetoPickUsed: false,
                voteNullified: false
            };

        appStoreHistory =
            state.appStoreHistory ||
            [];

        bonusLifeEligible =
            state.bonusLifeEligible ||
            null;

        battleBackCompleted =
            Boolean(
                state.battleBackCompleted
            );

        pendingSecondCycle =
            Boolean(
                state.pendingSecondCycle
            );

        nominees =
            (state.nominees || [])
                .map(findPlayer)
                .filter(Boolean);

        povPlayers =
            (state.povPlayers || [])
                .map(findPlayer)
                .filter(Boolean);

        povWinner =
            findPlayer(
                state.povWinner
            );

        replacementNominee =
            findPlayer(
                state.replacementNominee
            );

        currentEvictedPlayer =
            findPlayer(
                state.currentEvictedPlayer
            );

        finaleWinner =
            findPlayer(
                state.finaleWinner
            );

        updateAllDisplays();

        alert(
            "Saved game loaded."
        );

    } catch (error) {

        console.error(
            error
        );

        alert(
            "The saved game could not be loaded."
        );
    }
}

/* =========================================================
   RESET
========================================================= */

function resetGame() {

    if (
        !confirm(
            "Reset the entire simulator, including the cast and saved game?"
        )
    ) {
        return;
    }

    localStorage.removeItem(
        STORAGE_KEY
    );

    houseguests = [];
    evictedHouseguests = [];
    jury = [];

    alliances = [];
    relationships = [];
    customTwists = [];
    eventLog = [];

    selectedSeasonTemplate =
        "bb20";

    if ($("seasonSelect")) {

        $("seasonSelect").value =
            "bb20";
    }

    seasonName =
        "Big Brother 20";

    seasonFormat =
        "bb20";

    seasonStarted =
        false;

    seasonFinished =
        false;

    currentWeek =
        1;

    currentCycle =
        1;

    currentStage =
        "opening";

    currentHOH =
        null;

    outgoingHOH =
        null;

    nominees = [];

    povPlayers = [];
    povWinner = null;

    hackerWinner = null;
    replacementNominee = null;

    evictionVotes = {};

    currentEvictionTarget =
        null;

    currentEvictedPlayer =
        null;

    finaleWinner =
        null;

    finalHOH = {
        part1: null,
        part2: null,
        part3: null,
        winner: null
    };

    juryVotes = {};
    juryVoteRevealIndex = 0;

    hackerPower = {
        replacementUsed: false,
        vetoPickUsed: false,
        voteNullified: false
    };

    appStoreHistory = [];
    bonusLifeEligible = null;

    battleBackCompleted =
        false;

    pendingSecondCycle =
        false;

    clearHouseguestEditor();

    updateAllDisplays();

    showSection("home");
}

/* =========================================================
   INITIALIZATION
========================================================= */

function initialize() {

    /*
     * Ensure the BB20 registry exists.
     */
    if (
        !window.BB_SEASON_REGISTRY &&
        window.BB20
    ) {

        window.BB_SEASON_REGISTRY = {
            bb20: window.BB20
        };
    }

    /*
     * Default season selector.
     */
    if ($("seasonSelect")) {

        $("seasonSelect").value =
            selectedSeasonTemplate;
    }

    /*
     * Stat slider displays.
     */
    STAT_KEYS.forEach(
        key => {

            const input =
                $(key);

            if (input) {

                input.addEventListener(
                    "input",
                    () => {

                        const output =
                            $(`${key}Value`);

                        if (output) {

                            output.textContent =
                                input.value;
                        }
                    }
                );
            }
        }
    );

    /*
     * Relationship controls.
     */
    $("relationshipFrom")
        ?.addEventListener(
            "change",
            updateRelationshipPreviews
        );

    $("relationshipTo")
        ?.addEventListener(
            "change",
            updateRelationshipPreviews
        );

    /*
     * Load saved cast editor data,
     * but do not automatically start
     * the saved season.
     */
    try {

        const raw =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (raw) {

            const state =
                JSON.parse(raw);

            if (
                state?.houseguests?.length
            ) {

                houseguests =
                    state.houseguests.map(
                        normalizeHouseguest
                    );

                relationships =
                    state.relationships ||
                    [];

                alliances =
                    state.alliances ||
                    [];

                customTwists =
                    state.customTwists ||
                    [];
            }
        }

    } catch (error) {

        console.warn(
            "Saved editor data could not be read.",
            error
        );
    }

    updateAllStatDisplays();

    updateAllDisplays();
}

/* =========================================================
   STARTUP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);
