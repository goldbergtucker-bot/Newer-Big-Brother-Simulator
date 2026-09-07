/* =========================================================
   BIG BROTHER SIMULATOR
   CAST / RELATIONSHIP MANAGEMENT
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

let currentHOH = null;
let nominees = [];
let povWinner = null;
let povPlayers = [];

let hackerWinner = null;
let hackerVoteNullified = null;
let hackerSelectedVetoPlayer = null;

let seasonStarted = false;
let selectedSeasonTemplate = "bb20";
let currentStage = "idle";

let evictionHistory = [];
let voteHistory = [];

let currentVoteRevealIndex = 0;

let appStoreRecipients = [];
let appStoreHistory = [];

let battleBackUsed = false;

let openingSafety = {
    completed: false,
    protectedIds: []
};

let finalHOH = {
    part1: null,
    part2: null,
    part3: null,
    winner: null
};

let finaleWinner = null;



/* =========================================================
   SEASON TEMPLATES
========================================================= */

const seasonTemplates = {

    custom: {
        name: "Custom Season",
        startingPlayers: 16,
        nominationCount: 2,
        jurySize: 9
    },

    bb19: {
        name: "Big Brother 19",
        startingPlayers: 16,
        nominationCount: 2,
        jurySize: 9
    },

    bb20: {
        name: "Big Brother 20",
        startingPlayers: 16,
        nominationCount: 2,
        jurySize: 9,
        juryStartAfterEvictions: 7
    },

    bb23: {
        name: "Big Brother 23",
        startingPlayers: 16,
        nominationCount: 2,
        jurySize: 9
    },

    bb24: {
        name: "Big Brother 24",
        startingPlayers: 16,
        nominationCount: 2,
        jurySize: 7
    },

    bb25: {
        name: "Big Brother 25",
        startingPlayers: 16,
        nominationCount: 2,
        jurySize: 7
    },

    bb26: {
        name: "Big Brother 26",
        startingPlayers: 16,
        nominationCount: 3,
        jurySize: 7
    }

};



/* =========================================================
   UTILITY
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}


function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

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


function getInitials(name) {

    if (!name) {
        return "?";
    }

    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();
}



/* =========================================================
   NEW HOUSEGUEST IDENTITY SYSTEM
========================================================= */

function getDisplayName(player) {

    if (!player) {
        return "";
    }

    if (player.nickname && player.nickname.trim()) {
        return player.nickname.trim();
    }

    if (player.firstName && player.firstName.trim()) {
        return player.firstName.trim();
    }

    if (player.name && player.name.trim()) {
        return player.name.trim();
    }

    return "Houseguest";
}


function getFullName(player) {

    if (!player) {

    if (!player) {
        return "";
    }

    const first = player.firstName ? player.firstName.trim() : "";
    const last = player.lastName ? player.lastName.trim() : "";

    if (first && last) {
        return `${first} ${last}`;
    }

    if (first) {
        return first;
    }

    if (last) {
        return last;
    }

    if (player.name && player.name.trim()) {
        return player.name.trim();
    }

    return getDisplayName(player);
}


function getPlayerImageHTML(player, className = "") {

    if (!player) {
        return "";
    }

    const name = getDisplayName(player);
    const initials = getInitials(name);

    if (player.image && player.image.trim()) {

        return `
            <div class="player-image ${className}">
                <img
                    src="${escapeAttribute(player.image.trim())}"
                    alt="${escapeAttribute(name)}"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >
                <div class="player-image-placeholder" style="display:none;">
                    ${escapeHTML(initials)}
                </div>
            </div>
        `;

    }

    return `
        <div class="player-image ${className}">
            <div class="player-image-placeholder">
                ${escapeHTML(initials)}
            </div>
        </div>
    `;
}


function getPlayerById(id) {

    if (!id) {
        return null;
    }

    return houseguests.find(player => player.id === id)
        || evictedHouseguests.find(player => player.id === id)
        || jury.find(player => player.id === id)
        || null;
}


function getActiveHouseguests() {
    return houseguests.filter(player => !player.evicted);
}


function getHouseguestByName(name) {

    if (!name) {
        return null;
    }

    const normalized = String(name).trim().toLowerCase();

    return houseguests.find(player => {

        const display = getDisplayName(player).toLowerCase();
        const full = getFullName(player).toLowerCase();

        return display === normalized || full === normalized;

    }) || null;
}


function createHouseguestId() {

    return "hg_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).substring(2, 8);
}



/* =========================================================
   NAVIGATION
========================================================= */

function showSection(sectionId) {

    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.remove("active");
    });

    const section = $(sectionId);

    if (section) {
        section.classList.add("active");
    }

    document.querySelectorAll(".nav-button").forEach(button => {
        button.classList.remove("active");
    });

    const matchingButton = document.querySelector(
        `.nav-button[data-section="${sectionId}"]`
    );

    if (matchingButton) {
        matchingButton.classList.add("active");
    }

    if (sectionId === "cast") {
        renderCast();
    }

    if (sectionId === "twists") {
        renderTwists();
    }

    if (sectionId === "house") {
        renderHouse();
    }

    if (sectionId === "game") {
        updateGameDisplay();
        renderGameHouseguests();
    }

    if (sectionId === "memoryWall") {
        renderMemoryWall();
    }

    if (sectionId === "jury") {
        renderJury();
    }

    if (sectionId === "finale") {
        showFinale();
    }

}


function setupNavigation() {

    document.querySelectorAll(".nav-button").forEach(button => {

        button.addEventListener("click", () => {

            const sectionId = button.dataset.section;

            if (sectionId) {
                showSection(sectionId);
            }

        });

    });

}



/* =========================================================
   SEASON SELECTION
========================================================= */

function getSelectedSeasonTemplate() {

    const selector = $("seasonSelect");

    if (!selector) {
        return selectedSeasonTemplate;
    }

    return selector.value || selectedSeasonTemplate;
}


function selectSeasonTemplate() {

    const selector = $("seasonSelect");

    if (!selector) {
        return;
    }

    selectedSeasonTemplate = selector.value;

    const template = seasonTemplates[selectedSeasonTemplate];

    if (!template) {
        return;
    }

    const seasonName = $("selectedSeasonName");

    if (seasonName) {
        seasonName.textContent = template.name;
    }

    const formatStatus = $("formatStatus");

    if (formatStatus && !seasonStarted) {
        formatStatus.textContent = template.name;
    }

}


function updateSeasonTemplateDisplay() {

    const template = seasonTemplates[selectedSeasonTemplate];

    if (!template) {
        return;
    }

    const nameElement = $("selectedSeasonName");

    if (nameElement) {
        nameElement.textContent = template.name;
    }

}



/* =========================================================
   HOUSEGUEST STATS
========================================================= */

function getStatValue(id, fallback = 5) {

    const element = $(id);

    if (!element) {
        return fallback;
    }

    const value = parseInt(element.value, 10);

    if (Number.isNaN(value)) {
        return fallback;
    }

    return clamp(value, 1, 10);
}


function getDefaultStats() {

    return {
        physical: 5,
        mental: 5,
        social: 5,
        strategy: 5
    };

}


function getHouseguestStats(player) {

    const stats = player && player.stats
        ? player.stats
        : getDefaultStats();

    return {
        physical: clamp(Number(stats.physical) || 5, 1, 10),
        mental: clamp(Number(stats.mental) || 5, 1, 10),
        social: clamp(Number(stats.social) || 5, 1, 10),
        strategy: clamp(Number(stats.strategy) || 5, 1, 10)
    };

}


function calculateOverall(player) {

    const stats = getHouseguestStats(player);

    return Math.round(
        (
            stats.physical +
            stats.mental +
            stats.social +
            stats.strategy
        ) / 4
    );

}


function getRandomStat() {
    return Math.floor(Math.random() * 10) + 1;
}



/* =========================================================
   HOUSEGUEST CREATION
========================================================= */

function buildHouseguestFromForm() {

    const firstNameElement = $("firstName");
    const lastNameElement = $("lastName");
    const nicknameElement = $("nickname");
    const imageElement = $("imageUrl");

    const firstName = firstNameElement
        ? firstNameElement.value.trim()
        : "";

    const lastName = lastNameElement
        ? lastNameElement.value.trim()
        : "";

    const nickname = nicknameElement
        ? nicknameElement.value.trim()
        : "";

    const image = imageElement
        ? imageElement.value.trim()
        : "";

    const name =
        nickname ||
        [firstName, lastName].filter(Boolean).join(" ") ||
        "Houseguest";

    return {

        id: createHouseguestId(),

        name,
        firstName,
        lastName,
        nickname,
        image,

        stats: {
            physical: getStatValue("physicalStat"),
            mental: getStatValue("mentalStat"),
            social: getStatValue("socialStat"),
            strategy: getStatValue("strategyStat")
        },

        evicted: false,
        evictionWeek: null,
        jury: false,
        juryVote: null,

        wins: {
            hoh: 0,
            pov: 0
        },

        daysInHouse: 0,

        relationshipStrength: 50

    };

}



/* =========================================================
   ADD HOUSEGUEST
========================================================= */

function addHouseguest() {

    const player = buildHouseguestFromForm();

    if (!player.firstName && !player.lastName && !player.nickname) {
        alert("Please enter a houseguest name.");
        return;
    }

    houseguests.push(player);

    clearHouseguestForm();
    renderCast();

}


function clearHouseguestForm() {

    [
        "firstName",
        "lastName",
        "nickname",
        "imageUrl"
    ].forEach(id => {

        const element = $(id);

        if (element) {
            element.value = "";
        }

    });

    [
        "physicalStat",
        "mentalStat",
        "socialStat",
        "strategyStat"
    ].forEach(id => {

        const element = $(id);

        if (element) {
            element.value = "5";
        }

    });

}



/* =========================================================
   EDIT HOUSEGUEST
========================================================= */

let editingHouseguestId = null;


function editHouseguest(id) {

    const player = getPlayerById(id);

    if (!player) {
        return;
    }

    editingHouseguestId = id;

    const firstName = $("firstName");
    const lastName = $("lastName");
    const nickname = $("nickname");
    const imageUrl = $("imageUrl");

    if (firstName) {
        firstName.value = player.firstName || "";
    }

    if (lastName) {
        lastName.value = player.lastName || "";
    }

    if (nickname) {
        nickname.value = player.nickname || "";
    }

    if (imageUrl) {
        imageUrl.value = player.image || "";
    }

    const stats = getHouseguestStats(player);

    const physical = $("physicalStat");
    const mental = $("mentalStat");
    const social = $("socialStat");
    const strategy = $("strategyStat");

    if (physical) physical.value = stats.physical;
    if (mental) mental.value = stats.mental;
    if (social) social.value = stats.social;
    if (strategy) strategy.value = stats.strategy;

    const button = $("addHouseguestButton");

    if (button) {
        button.textContent = "UPDATE HOUSEGUEST";
    }

    showSection("cast");

}



/* =========================================================
   DELETE HOUSEGUEST
========================================================= */

function deleteHouseguest(id) {

    const player = getPlayerById(id);

    if (!player) {
        return;
    }

    const confirmed = confirm(
        `Remove ${getDisplayName(player)} from the cast?`
    );

    if (!confirmed) {
        return;
    }

    houseguests = houseguests.filter(
        houseguest => houseguest.id !== id
    );

    evictedHouseguests = evictedHouseguests.filter(
        houseguest => houseguest.id !== id
    );

    jury = jury.filter(
        houseguest => houseguest.id !== id
    );

    relationships = relationships.filter(
        relationship =>
            relationship.player1 !== id &&
            relationship.player2 !== id
    );

    alliances.forEach(alliance => {
        alliance.members = alliance.members.filter(
            memberId => memberId !== id
        );
    });

    renderCast();
    renderHouse();
    renderJury();

}

        return "";
    }

    const first = (player.firstName || "").trim();
    const last = (player.lastName || "").trim();

    if (first && last) {
        return `${first} ${last}`;
    }

    if (first) {
        return first;
    }

    if (last) {
        return last;
    }

    if (player.fullName) {
        return player.fullName;
    }

    if (player.name) {
        return player.name;
    }

    return getDisplayName(player);
}


function normalizeHouseguest(player) {

    if (!player) {
        return player;
    }

    /*
       Compatibility with the old system.

       Old cast members only had:

       name

       New cast members use:

       firstName
       lastName
       nickname
    */

    if (!player.firstName) {

        const oldName = player.name || "";

        const pieces = oldName.trim().split(/\s+/);

        if (pieces.length > 1) {

            player.firstName = pieces.shift();
            player.lastName = pieces.join(" ");

        } else {

            player.firstName = oldName;

        }
    }

    if (!player.lastName) {
        player.lastName = "";
    }

    if (!player.nickname) {
        player.nickname = "";
    }

    if (!player.image) {
        player.image = "";
    }

    player.physical = Number(player.physical) || 5;
    player.mental = Number(player.mental) || 5;
    player.social = Number(player.social) || 5;
    player.strategy = Number(player.strategy) || 5;

    player.name = getDisplayName(player);
    player.fullName = getFullName(player);

    if (!player.status) {
        player.status = "Active";
    }

    return player;
}


function normalizeAllHouseguests() {
    houseguests.forEach(normalizeHouseguest);
}



/* =========================================================
   IMAGE SYSTEM
========================================================= */

function getPlayerImageHTML(player, className = "") {

    if (!player) {
        return `<div class="${className} player-placeholder">?</div>`;
    }

    const displayName = escapeAttribute(getDisplayName(player));
    const initials = escapeHTML(getInitials(getDisplayName(player)));

    if (player.image && player.image.trim()) {

        return `
            <img
                class="${className}"
                src="${escapeAttribute(player.image)}"
                alt="${displayName}"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div
                class="${className} player-placeholder"
                style="display:none;">
                ${initials}
            </div>
        `;

    }

    return `
        <div class="${className} player-placeholder">
            ${initials}
        </div>
    `;
}



/* =========================================================
   NAVIGATION
========================================================= */

function showSection(sectionId) {

    document
        .querySelectorAll(".page-section")
        .forEach(section => {
            section.classList.remove("active-section");
        });

    const section = $(sectionId);

    if (section) {
        section.classList.add("active-section");
    }
}



/* =========================================================
   SEASON SELECTION
========================================================= */

function selectSeasonTemplate() {

    selectedSeasonTemplate = $("seasonSelect").value;

    updateSelectedSeasonInfo();

    if (selectedSeasonTemplate === "bb20") {

        addEvent(
            "Big Brother 20 format selected."
        );

    }
}


function updateSelectedSeasonInfo() {

    const template =
        seasonTemplates[selectedSeasonTemplate];

    if (!template) {
        return;
    }

    let competitionsHTML = "";

    if (
        selectedSeasonTemplate === "bb20" &&
        typeof BB20 !== "undefined"
    ) {

        competitionsHTML = Object.entries(BB20.competitions)
            .map(([week, data]) => {

                if (week === "13") {
                    return `
                        <div>
                            <strong>Finale:</strong>
                            ${data.finalHOH.join(", ")}
                        </div>
                    `;
                }

                return `
                    <div>
                        <strong>Week ${week}:</strong>
                        HOH — ${data.hoh}
                        | POV — ${data.pov}
                    </div>
                `;

            })
            .join("");

    }

    const info = $("seasonInfo");

    if (info) {

        info.innerHTML = `
            <h3>${escapeHTML(template.name)}</h3>

            <p>
                Starting Players:
                <strong>${template.startingPlayers}</strong>
            </p>

            <p>
                Jury Size:
                <strong>${template.jurySize}</strong>
            </p>

            ${
                competitionsHTML
                    ? `
                        <div class="competition-list">
                            ${competitionsHTML}
                        </div>
                    `
                    : ""
            }
        `;

    }
}



/* =========================================================
   STATS FORM
========================================================= */

function updateStatValue(statName, value) {

    const output = $(`${statName}Value`);

    if (output) {
        output.textContent = value;
    }

}


function setupStatInputs() {

    const stats = [
        "physical",
        "mental",
        "social",
        "strategy"
    ];

    stats.forEach(stat => {

        const input = $(`${stat}Stat`);

        if (!input) {
            return;
        }

        input.addEventListener("input", () => {

            updateStatValue(
                stat,
                input.value
            );

        });

        updateStatValue(
            stat,
            input.value
        );

    });

}



/* =========================================================
   CAST MANAGEMENT
========================================================= */

function addHouseguest() {

    const firstName =
        $("firstName").value.trim();

    const lastName =
        $("lastName").value.trim();

    const nickname =
        $("nickname").value.trim();

    const image =
        $("imageUrl").value.trim();

    if (!firstName && !nickname) {

        alert(
            "Please enter at least a first name or nickname."
        );

        return;
    }

    const houseguest = {

        id: crypto.randomUUID
            ? crypto.randomUUID()
            : "hg_" + Date.now() + Math.random(),

        firstName,
        lastName,
        nickname,
        image,

        name:
            nickname ||
            [firstName, lastName]
                .filter(Boolean)
                .join(" "),

        fullName:
            [firstName, lastName]
                .filter(Boolean)
                .join(" "),

        physical:
            Number($("physicalStat").value) || 5,

        mental:
            Number($("mentalStat").value) || 5,

        social:
            Number($("socialStat").value) || 5,

        strategy:
            Number($("strategyStat").value) || 5,

        status: "Active",

        wins: {
            hoh: 0,
            pov: 0
        },

        nominations: 0,

        votesAgainst: 0,

        evictionWeek: null,

        juryMember: false,

        juryVote: null
    };

    houseguests.push(houseguest);

    renderCast();

    clearCastForm();

}



/* =========================================================
   CLEAR CAST FORM
========================================================= */

function clearCastForm() {

    $("firstName").value = "";
    $("lastName").value = "";
    $("nickname").value = "";
    $("imageUrl").value = "";

    $("physicalStat").value = 5;
    $("mentalStat").value = 5;
    $("socialStat").value = 5;
    $("strategyStat").value = 5;

    updateStatValue("physical", 5);
    updateStatValue("mental", 5);
    updateStatValue("social", 5);
    updateStatValue("strategy", 5);

}



/* =========================================================
   EDIT CAST MEMBER
========================================================= */

function editHouseguest(id) {

    const player =
        houseguests.find(
            houseguest => houseguest.id === id
        );

    if (!player) {
        return;
    }

    $("firstName").value =
        player.firstName || "";

    $("lastName").value =
        player.lastName || "";

    $("nickname").value =
        player.nickname || "";

    $("imageUrl").value =
        player.image || "";

    $("physicalStat").value =
        player.physical || 5;

    $("mentalStat").value =
        player.mental || 5;

    $("socialStat").value =
        player.social || 5;

    $("strategyStat").value =
        player.strategy || 5;

    updateStatValue(
        "physical",
        $("physicalStat").value
    );

    updateStatValue(
        "mental",
        $("mentalStat").value
    );

    updateStatValue(
        "social",
        $("socialStat").value
    );

    updateStatValue(
        "strategy",
        $("strategyStat").value
    );

    player._editing = true;

    renderCast();

}



/* =========================================================
   DELETE CAST MEMBER
========================================================= */

function deleteHouseguest(id) {

    const player =
        houseguests.find(
            houseguest => houseguest.id === id
        );

    if (!player) {
        return;
    }

    if (
        !confirm(
            `Are you sure you want to remove ${getDisplayName(player)} from the cast?`
        )
    ) {
        return;
    }

    houseguests =
        houseguests.filter(
            houseguest => houseguest.id !== id
        );

    relationships =
        relationships.filter(
            relationship =>
                relationship.player1 !== id &&
                relationship.player2 !== id
        );

    alliances =
        alliances.map(alliance => ({
            ...alliance,
            members:
                alliance.members.filter(
                    memberId => memberId !== id
                )
        }));

    renderCast();

}

            .map(([week, data]) => {

                let text =
                    `<strong>Week ${week}</strong>: `;

                if (data.doubleEviction) {
                    text += "Double Eviction";
                }

                if (data.hoh) {
                    text += `HOH — ${escapeHTML(data.hoh)}`;
                }

                if (data.pov) {
                    text += ` | POV — ${escapeHTML(data.pov)}`;
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

    const container =
        $("castList");

    if (!container) {
        return;
    }

    normalizeAllHouseguests();

    if (houseguests.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No Houseguests added yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        houseguests
            .map(player => {

                const editing =
                    player._editing === true;

                return `

                    <div
                        class="cast-card ${
                            editing
                                ? "editing"
                                : ""
                        }"
                    >

                        <div class="cast-card-image">

                            ${getPlayerImageHTML(
                                player,
                                "cast-photo"
                            )}

                        </div>


                        <div class="cast-card-info">

                            <h3>
                                ${escapeHTML(
                                    getDisplayName(player)
                                )}
                            </h3>

                            ${
                                player.fullName &&
                                player.nickname
                                    ? `
                                        <div class="cast-full-name">
                                            ${escapeHTML(
                                                player.fullName
                                            )}
                                        </div>
                                      `
                                    : ""
                            }


                            <div class="cast-stats">

                                <span>
                                    Physical:
                                    <strong>
                                        ${player.physical}
                                    </strong>
                                </span>

                                <span>
                                    Mental:
                                    <strong>
                                        ${player.mental}
                                    </strong>
                                </span>

                                <span>
                                    Social:
                                    <strong>
                                        ${player.social}
                                    </strong>
                                </span>

                                <span>
                                    Strategy:
                                    <strong>
                                        ${player.strategy}
                                    </strong>
                                </span>

                            </div>


                            <div class="cast-status">

                                <span>
                                    Status:
                                    <strong>
                                        ${escapeHTML(
                                            player.status || "Active"
                                        )}
                                    </strong>
                                </span>

                            </div>

                        </div>


                        <div class="cast-card-actions">

                            <button
                                class="secondary-button"
                                onclick="editHouseguest('${player.id}')"
                            >
                                EDIT
                            </button>

                            <button
                                class="danger-button"
                                onclick="deleteHouseguest('${player.id}')"
                            >
                                DELETE
                            </button>

                        </div>

                    </div>

                `;

            })
            .join("");

}



/* =========================================================
   ALLIANCE MANAGEMENT
========================================================= */

function renderAllianceEditor() {

    const container =
        $("allianceEditor");

    if (!container) {
        return;
    }

    if (houseguests.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Add Houseguests before creating alliances.
            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div class="alliance-form">

            <input
                type="text"
                id="allianceNameInput"
                placeholder="Alliance name"
            >


            <div class="alliance-members">

                ${houseguests
                    .map(player => `
                        <label
                            class="alliance-member-option"
                        >

                            <input
                                type="checkbox"
                                value="${player.id}"
                                class="alliance-member-checkbox"
                            >

                            ${getPlayerImageHTML(
                                player,
                                "alliance-member-photo"
                            )}

                            <span>
                                ${escapeHTML(
                                    getDisplayName(player)
                                )}
                            </span>

                        </label>
                    `)
                    .join("")}

            </div>


            <button
                class="primary-button"
                onclick="createAlliance()"
            >
                CREATE ALLIANCE
            </button>

        </div>

    `;

}

/* =========================================================
   CAST RENDER
========================================================= */

function renderCast() {

    normalizeAllHouseguests();

    $("castCount").textContent =
        houseguests.length;


    if (!houseguests.length) {

        $("castGrid").innerHTML = `
            <div class="empty-state">
                No Houseguests added yet.
            </div>
        `;

        return;
    }


    $("castGrid").innerHTML =
        houseguests
            .map(player => {

                return `

                    <div class="cast-card">

                        <div class="cast-photo">

                            ${getPlayerImageHTML(
                                player,
                                "player-photo"
                            )}

                        </div>


                        <div class="cast-info">

                            <div class="cast-display-name">

                                ${escapeHTML(
                                    getDisplayName(player)
                                )}

                            </div>


                            <div class="cast-full-name">

                                ${escapeHTML(
                                    getFullName(player)
                                )}

                                ${
                                    player.nickname
                                        ? `
                                            ·
                                            Goes by
                                            "${escapeHTML(
                                                player.nickname
                                            )}"
                                          `
                                        : ""
                                }

                            </div>


                            <div class="cast-stats">

                                <div class="cast-stat">

                                    <span>Physical</span>

                                    <strong>
                                        ${player.physical}
                                    </strong>

                                </div>


                                <div class="cast-stat">

                                    <span>Mental</span>

                                    <strong>
                                        ${player.mental}
                                    </strong>

                                </div>


                                <div class="cast-stat">

                                    <span>Social</span>

                                    <strong>
                                        ${player.social}
                                    </strong>

                                </div>


                                <div class="cast-stat">

                                    <span>Strategy</span>

                                    <strong>
                                        ${player.strategy}
                                    </strong>

                                </div>

                            </div>

                        </div>


                        <div class="cast-actions">

                            <button
                                onclick="editHouseguest('${player.id}')">
                                EDIT
                            </button>

                            <button
                                class="delete"
                                onclick="deleteHouseguest('${player.id}')">
                                DELETE
                            </button>

                        </div>

                    </div>

                `;

            })
            .join("");
}



/* =========================================================
   TWISTS
========================================================= */

function createTwist() {

    const name =
        $("twistName").value.trim();

    const description =
        $("twistDescription").value.trim();

    if (!name) {

        alert("Enter a twist name.");

        return;
    }


    customTwists.push({

        id:
            "twist_" +
            Date.now(),

        name,
        description

    });


    $("twistName").value = "";
    $("twistDescription").value = "";


    renderTwists();

    saveGameSilently();

}


function renderTwists() {

    if (!customTwists.length) {

        $("twistList").innerHTML =
            `<p>No custom twists created.</p>`;

        return;
    }


    $("twistList").innerHTML =
        customTwists
            .map(twist => {

                return `

                    <div class="panel">

                        <h3>
                            ${escapeHTML(twist.name)}
                        </h3>

                        <p>
                            ${escapeHTML(
                                twist.description
                            )}
                        </p>

                    </div>

                `;
            })
            .join("");

            })
            .join("");

}


/* =========================================================
   ALLIANCE CREATION
========================================================= */

function createAlliance() {

    const name =
        $("allianceNameInput").value.trim();

    if (!name) {

        alert(
            "Please enter an alliance name."
        );

        return;
    }


    const members =
        Array.from(
            document.querySelectorAll(
                ".alliance-member-checkbox:checked"
            )
        )
        .map(
            checkbox =>
                checkbox.value
        );


    if (members.length < 2) {

        alert(
            "An alliance needs at least two members."
        );

        return;
    }


    alliances.push({

        id:
            "alliance_" +
            Date.now(),

        name,

        members

    });


    renderAlliances();

    renderAllianceEditor();

    saveGameSilently();

}


function renderAlliances() {

    const container =
        $("allianceList");

    if (!container) {
        return;
    }


    if (!alliances.length) {

        container.innerHTML = `
            <div class="empty-state">
                No alliances created yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        alliances
            .map(alliance => {

                const memberNames =
                    alliance.members
                        .map(id => {

                            const player =
                                houseguests.find(
                                    p => p.id === id
                                );

                            return player
                                ? getDisplayName(player)
                                : "Unknown";

                        });


                return `

                    <div class="alliance-card">

                        <div class="alliance-header">

                            <h3>
                                ${escapeHTML(
                                    alliance.name
                                )}
                            </h3>

                            <button
                                class="delete"
                                onclick="deleteAlliance('${alliance.id}')"
                            >
                                DELETE
                            </button>

                        </div>


                        <div class="alliance-members-display">

                            ${memberNames
                                .map(name => `
                                    <span class="alliance-member-tag">
                                        ${escapeHTML(name)}
                                    </span>
                                `)
                                .join("")}

                        </div>

                    </div>

                `;

            })
            .join("");

}


function deleteAlliance(id) {

    const alliance =
        alliances.find(
            a => a.id === id
        );

    if (!alliance) {
        return;
    }


    if (
        !confirm(
            `Delete the ${alliance.name} alliance?`
        )
    ) {
        return;
    }


    alliances =
        alliances.filter(
            a => a.id !== id
        );


    renderAlliances();

    renderAllianceEditor();

    saveGameSilently();

}



/* =========================================================
   RELATIONSHIPS
========================================================= */

function renderRelationshipEditor() {

    const container =
        $("relationshipEditor");

    if (!container) {
        return;
    }


    if (houseguests.length < 2) {

        container.innerHTML = `
            <div class="empty-state">
                Add at least two Houseguests to create relationships.
            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div class="relationship-form">

            <div class="relationship-row">

                <div class="relationship-person">

                    <label>
                        Houseguest 1
                    </label>

                    <select id="relationshipFrom">

                        <option value="">
                            Select Houseguest
                        </option>

                        ${houseguests
                            .map(player => `
                                <option
                                    value="${player.id}"
                                >
                                    ${escapeHTML(
                                        getDisplayName(player)
                                    )}
                                </option>
                            `)
                            .join("")}

                    </select>

                </div>


                <div class="relationship-person">

                    <label>
                        Houseguest 2
                    </label>

                    <select id="relationshipTo">

                        <option value="">
                            Select Houseguest
                        </option>

                        ${houseguests
                            .map(player => `
                                <option
                                    value="${player.id}"
                                >
                                    ${escapeHTML(
                                        getDisplayName(player)
                                    )}
                                </option>
                            `)
                            .join("")}

                    </select>

                </div>

            </div>


            <div class="relationship-row">

                <div>

                    <label>
                        Relationship
                    </label>

                    <select id="relationshipType">

                        <option value="bestFriends">
                            Best Friends
                        </option>

                        <option value="friends">
                            Friends
                        </option>

                        <option value="allies">
                            Allies
                        </option>

                        <option value="neutral">
                            Neutral
                        </option>

                        <option value="rivals">
                            Rivals
                        </option>

                        <option value="enemies">
                            Enemies
                        </option>

                    </select>

                </div>


                <div>

                    <label>
                        Strength
                    </label>

                    <select id="relationshipStrength">

                        <option value="1">
                            1 — Very Weak
                        </option>

                        <option value="2">
                            2 — Weak
                        </option>

                        <option value="3" selected>
                            3 — Moderate
                        </option>

                        <option value="4">
                            4 — Strong
                        </option>

                        <option value="5">
                            5 — Very Strong
                        </option>

                    </select>

                </div>

            </div>


            <button
                class="primary-button"
                onclick="createRelationship()"
            >
                SAVE RELATIONSHIP
            </button>

        </div>

    `;

}


function createRelationship() {

    const from =
        $("relationshipFrom").value;

    const to =
        $("relationshipTo").value;

    const type =
        $("relationshipType").value;

    const strength =
        Number(
            $("relationshipStrength").value
        );


    if (!from || !to) {

        alert(
            "Please select both Houseguests."
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
        relationships.find(
            relationship =>
                relationship.from === from &&
                relationship.to === to
        );


    if (existing) {

        existing.type = type;
        existing.strength = strength;

    } else {

        relationships.push({

            id:
                "relationship_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2),

            from,
            to,
            type,
            strength

        });

    }


    renderRelationships();

    saveGameSilently();

}


function renderRelationships() {

    const container =
        $("relationshipList");

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
                        p =>
                            p.id === relationship.from
                    );

                const toPlayer =
                    houseguests.find(
                        p =>
                            p.id === relationship.to
                    );


                if (!fromPlayer || !toPlayer) {
                    return "";
                }


                return `

                    <div class="relationship-card">

                        <div class="relationship-people">

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(fromPlayer)
                                )}
                            </strong>

                            <span>
                                →
                            </span>

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(toPlayer)
                                )}
                            </strong>

                        </div>


                        <div class="relationship-details">

                            <span>
                                ${escapeHTML(
                                    relationship.type
                                )}
                            </span>

                            <span>
                                Strength:
                                ${relationship.strength}/5
                            </span>

                        </div>


                        <button
                            class="delete"
                            onclick="deleteRelationship('${relationship.id}')"
                        >
                            DELETE
                        </button>

                    </div>

                `;

            })
            .join("");

}


function deleteRelationship(id) {

    relationships =
        relationships.filter(
            relationship =>
                relationship.id !== id
        );


    renderRelationships();

    saveGameSilently();

}

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

    love: "❤️ Love",
    like: "😊 Like",
    neutral: "😐 Neutral",
    dislike: "😒 Dislike",
    hate: "😡 Hate"

};


function getRelationship(fromId, toId) {

    return relationships.find(
        relationship =>
            relationship.from === fromId &&
            relationship.to === toId
    );
}


function getRelationshipValue(fromId, toId) {

    const relationship =
        getRelationship(
            fromId,
            toId
        );

    if (!relationship) {
        return 0;
    }

    return relationshipValues[
        relationship.type
    ] ?? 0;
}


function saveRelationship() {

    const from =
        $("relationshipFrom").value;

    const to =
        $("relationshipTo").value;

    const type =
        $("relationshipType").value;

    const note =
        $("relationshipNote").value.trim();


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


    if (existing) {

        existing.type = type;
        existing.note = note;

    } else {

        relationships.push({

            id:
                "relationship_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2),

            from,
            to,
            type,
            note

        });

    }


    renderRelationships();

    clearRelationshipEditor();

    saveGameSilently();
}


function loadSelectedRelationship() {

    const from =
        $("relationshipFrom").value;

    const to =
        $("relationshipTo").value;

    const relationship =
        getRelationship(
            from,
            to
        );


    if (!relationship) {

        alert(
            "No relationship has been created for this pair."
        );

        return;
    }


    $("relationshipType").value =
        relationship.type;

    $("relationshipNote").value =
        relationship.note || "";
}


function deleteSelectedRelationship() {

    const from =
        $("relationshipFrom").value;

    const to =
        $("relationshipTo").value;


    relationships =
        relationships.filter(
            relationship =>
                !(
                    relationship.from === from &&
                    relationship.to === to
                )
        );


    renderRelationships();

    clearRelationshipEditor();

    saveGameSilently();
}


function clearRelationshipEditor() {

    $("relationshipType").value =
        "neutral";

    $("relationshipNote").value =
        "";
}


function updateRelationshipDropdowns() {

    const fromSelect =
        $("relationshipFrom");

    const toSelect =
        $("relationshipTo");


    if (!fromSelect || !toSelect) {
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
        options;

    toSelect.innerHTML =
        options;


    if (
        houseguests.some(
            player =>
                player.id === oldFrom
        )
    ) {
        fromSelect.value = oldFrom;
    }


    if (
        houseguests.some(
            player =>
                player.id === oldTo
        )
    ) {
        toSelect.value = oldTo;
    }


    if (
        fromSelect.value ===
        toSelect.value &&
        houseguests.length > 1
    ) {

        const alternative =
            houseguests.find(
                player =>
                    player.id !==
                    fromSelect.value
            );

        if (alternative) {
            toSelect.value =
                alternative.id;
        }
    }


    updateRelationshipPreviews();
}


function updateRelationshipPreviews() {

    renderRelationshipPreview(
        "relationshipFromPreview",
        $("relationshipFrom").value
    );


    renderRelationshipPreview(
        "relationshipToPreview",
        $("relationshipTo").value
    );
}


function renderRelationshipPreview(
    elementId,
    playerId
) {

    const element =
        $(elementId);

    if (!element) {
        return;
    }


    const player =
        houseguests.find(
            p => p.id === playerId
        );


    if (!player) {

        element.innerHTML = "";

        return;
    }


    element.innerHTML = `

        <div class="relationship-preview-card">

            ${getPlayerImageHTML(
                player,
                ""
            )}

            <div>

                <div class="relationship-preview-name">

                    ${escapeHTML(
                        getDisplayName(player)
                    )}

                </div>

                <div class="relationship-preview-full">

                    ${escapeHTML(
                        getFullName(player)
                    )}

                </div>

            </div>

        </div>

    `;
}


function renderRelationships() {

    const container =
        $("relationshipsList");


    if (!relationships.length) {

        container.innerHTML = `
            <p>
                No relationships have been created yet.
            </p>
        `;

        return;
    }


    container.innerHTML =
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


                return `

                    <div class="relationship-card">

                        <div class="relationship-person-card">

                            ${getPlayerImageHTML(
                                from,
                                ""
                            )}

                            )}

                            <div>
                                <strong>
                                    ${escapeHTML(
                                        getDisplayName(from)
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        getFullName(from)
                                    )}
                                </small>

                            </div>

                        </div>


                        <div class="relationship-type">

                            ${relationshipLabels[
                                relationship.type
                            ] || "Neutral"}

                        </div>


                        <div class="relationship-person-card">

                            ${getPlayerImageHTML(
                                to,
                                ""
                            )}

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        getDisplayName(to)
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        getFullName(to)
                                    )}
                                </small>

                            </div>

                        </div>


                        <button
                            class="secondary-button"
                            onclick="
                                selectRelationshipForEditing(
                                    '${relationship.from}',
                                    '${relationship.to}'
                                )
                            ">

                            EDIT

                        </button>

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

                `;

            })
            .join("");
}


function selectRelationshipForEditing(
    fromId,
    toId
) {

    $("relationshipFrom").value =
        fromId;

    $("relationshipTo").value =
        toId;

    const relationship =
        getRelationship(
            fromId,
            toId
        );


    if (relationship) {

        $("relationshipType").value =
            relationship.type;

        $("relationshipNote").value =
            relationship.note || "";

    }


    updateRelationshipPreviews();

    showSection("house");
}



/* =========================================================
   RELATIONSHIP AI
========================================================= */

function getRelationshipScore(
    fromId,
    toId
) {

    return getRelationshipValue(
        fromId,
        toId
    );
}


function areAllied(
    playerA,
    playerB
) {

    if (!playerA || !playerB) {
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
   START SEASON
========================================================= */

function startNewSeason() {

    normalizeAllHouseguests();


    const template =
        seasonTemplates[
            selectedSeasonTemplate
        ];


    if (!template) {

        alert("Invalid season format.");

        return;
    }


    if (
        houseguests.length !==
        template.startingPlayers
    ) {

        const continueAnyway =
            confirm(
                `This format expects ${template.startingPlayers} Houseguests, but you currently have ${houseguests.length}. Continue anyway?`
            );

        if (!continueAnyway) {
            return;
        }
    }

    seasonStarted = true;

    currentWeek = 1;
    currentCycle = 1;

    currentHOH = null;
    nominees = [];
    povWinner = null;
    povPlayers = [];

    hackerWinner = null;
    hackerVoteNullified = null;
    hackerSelectedVetoPlayer = null;

    evictedHouseguests = [];
    jury = [];

    evictionHistory = [];
    voteHistory = [];

    appStoreRecipients = [];
    appStoreHistory = [];

    battleBackUsed = false;

    finaleWinner = null;

    finalHOH = {
        part1: null,
        part2: null,
        part3: null,
        winner: null
    };


    openingSafety = {
        completed: false,
        protectedIds: []
    };


    houseguests.forEach(player => {

        player.status = "Active";
        player.safety = false;

        player.app = null;
        player.punishment = null;

        player.appUsed = false;

        player.cloudAvailable = false;
        player.identityTheftAvailable = false;
        player.bonusLifeAvailable = false;

        player.hackerWins = 0;

    });


    addEvent(
        `The ${template.name} season has begun.`
    );


    if (
        selectedSeasonTemplate === "bb20"
    ) {

        currentStage =
            "opening1";

        addEvent(
            "The Big Brother 20 opening safety competition is beginning."
        );

    } else {

        currentStage =
            "hoh";

        addEvent(
            "The first Head of Household competition is beginning."
        );

    }


    updateAllDisplays();

    showSection("game");

    saveGameSilently();
}



/* =========================================================
   STAGE ENGINE
========================================================= */

function proceedGame() {

    if (!seasonStarted) {

        alert(
            "Start a season first."
        );

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
            revealNextJuryVote();
            break;

        case "finished":
            showFinale();
            break;

        default:
            alert(

                "The simulator is not currently at a playable stage."
            );

    }
}


/* =========================================================
   STAGE DISPLAY
========================================================= */

function setStage(stage) {

    currentStage = stage;

    updateStageDisplay();

    updateGameDisplay();
}


function updateStageDisplay() {

    const stageData = {

        opening1: [
            "OPENING SAFETY",
            "The Trash Folder",
            "Opening safety competition — Part 1."
        ],

        opening2: [
            "OPENING SAFETY",
            "HouseGuest CAPTCHA",
            "Opening safety competition — Part 2."
        ],

        opening3: [
            "OPENING SAFETY",
            "Surfing the BB Web",
            "Opening safety competition — Part 3."
        ],

        hoh: [
            "HEAD OF HOUSEHOLD",
            "HOH Competition",
            "Compete for the power to nominate two Houseguests."
        ],

        appstore: [
            "BB APP STORE",
            "App Store",
            "Houseguests receive the week's App Store powers."
        ],

        nominations: [
            "NOMINATIONS",
            "Nomination Ceremony",
            "The HOH selects the nominees."
        ],

        hacker: [
            "HACKER",
            "Hacker Competition",
            "A secret Hacker gains the power to alter the week."
        ],

        povDraw: [
            "POWER OF VETO",
            "Veto Player Draw",
            "The six Power of Veto players are selected."
        ],

        pov: [
            "POWER OF VETO",
            "Veto Competition",
            "The Houseguests compete for the Power of Veto."
        ],

        veto: [
            "POWER OF VETO",
            "Veto Ceremony",
            "The POV holder decides whether to use the Veto."
        ],

        evictionVoting: [
            "EVICTION",
            "Prepare Votes",
            "The eligible Houseguests secretly cast their votes."
        ],

        eviction: [
            "EVICTION",
            "Vote Reveal",
            "Reveal each eviction vote individually."
        ],

        battleback: [
            "BATTLE BACK",
            "Big Top Drop",
            "The first four jury members compete to return."
        ],

        nextcycle: [
            "NEXT ROUND",
            "Continue",
            "Move to the next competition cycle."
        ],

        finalHOH1: [
            "FINAL HOH",
            "Part 1",
            "The Final 3 compete in Part 1 of the Final HOH."
        ],

        finalHOH2: [
            "FINAL HOH",
            "Part 2",
            "The remaining Final 3 compete in Part 2."
        ],

        finalHOH3: [
            "FINAL HOH",
            "Part 3",
            "The Part 1 and Part 2 winners face off."
        ],

        finalEviction: [
            "FINAL EVICTION",
            "Final 3 Eviction",
            "The Final HOH chooses who goes to the Final 2."
        ],

        juryVote: [
            "JURY",
            "Final Vote",
            "The jury votes for the winner."
        ],

        finished: [
            "FINALE",
            "Season Complete",
            "The season is complete."
        ]

    };


    const data =
        stageData[currentStage];


    if (!data) {
        return;
    }


    $("stageName").textContent =
        data[0];

    $("stageTitle").textContent =
        data[1];

    $("stageDescription").textContent =
        data[2];


    const buttonLabels = {

        opening1: "PROCEED",
        opening2: "PROCEED",
        opening3: "PROCEED",

        hoh: "RUN HOH",

        appstore: "RUN APP STORE",

        nominations: "MAKE NOMINATIONS",

        hacker: "RUN HACKER",

        povDraw: "DRAW POV PLAYERS",

        pov: "RUN POV",

        veto: "USE / DO NOT USE POV",

        evictionVoting: "CAST EVICTION VOTES",

        eviction: "REVEAL NEXT VOTE",

        battleback: "RUN BATTLE BACK",

        nextcycle: "CONTINUE",

        finalHOH1: "RUN FINAL HOH PART 1",

        finalHOH2: "RUN FINAL HOH PART 2",

        finalHOH3: "RUN FINAL HOH PART 3",

        finalEviction: "EVICT TO FINAL 2",

        juryVote: "REVEAL NEXT JURY VOTE",

        finished: "VIEW FINALE"

    };


    $("proceedButton").textContent =
        buttonLabels[currentStage]
        || "PROCEED";
}



/* =========================================================
   OPENING SAFETY
========================================================= */

let openingSafetyScores = {};


function runOpeningSafetyPart(part) {

    const active =
        getActivePlayers();


    if (part === 1) {
        openingSafetyScores = {};
    }


    active.forEach(player => {

        if (
            !openingSafetyScores[player.id]
        ) {
            openingSafetyScores[player.id] = 0;
        }


        let score = 0;


        if (part === 1) {

            score =
                player.mental * 2 +
                player.social +
                Math.random() * 10;

        }


        if (part === 2) {

            score =
                player.mental * 2 +
                player.strategy * 1.5 +
                Math.random() * 10;

        }


        if (part === 3) {

            score =
                player.social +
                player.physical +
                player.strategy +
                Math.random() * 10;

        }


        openingSafetyScores[player.id] +=
            score;

    });


    const partNames = {

        1: "The Trash Folder",

        2: "HouseGuest CAPTCHA",

        3: "Surfing the BB Web"

    };


    const winner =
        active
            .slice()
            .sort(
                (a, b) =>
                    openingSafetyScores[b.id] -
                    openingSafetyScores[a.id]
            )[0];


    addEvent(
        `Opening Safety Part ${part}: ${partNames[part]} was completed. ${getDisplayName(winner)} had the strongest performance in this part.`
    );


    if (part < 3) {

        setStage(
            `opening${part + 1}`
        );

        return;
    }


    /*
       The eight highest cumulative performers
       receive first-eviction safety.
    */

    const protectedPlayers =
        active
            .slice()
            .sort(
                (a, b) =>
                    openingSafetyScores[b.id] -
                    openingSafetyScores[a.id]
            )
            .slice(0, 8);


    openingSafety.protectedIds =
        protectedPlayers.map(
            player => player.id
        );

    openingSafety.completed = true;


    protectedPlayers.forEach(
        player => {
            player.safety = true;
        }
    );


    addEvent(
        `The opening safety competition is complete. ${protectedPlayers.map(getDisplayName).join(", ")} are safe from the first eviction.`
    );


    setStage("hoh");
}



/* =========================================================
   COMPETITIONS
========================================================= */

function getCurrentWeekData() {

    if (
        selectedSeasonTemplate !==
        "bb20"
    ) {
        return null;
    }


    if (
        typeof BB20 === "undefined"
    ) {
        return null;
    }


    return BB20.competitions[
        currentWeek
    ];
}


function getCurrentHOHCompetition() {

    const data =
        getCurrentWeekData();


    if (!data) {
        return "Head of Household";
    }


    if (
        currentCycle === 2 &&
        data.secondHOH
    ) {
        return data.secondHOH;
    }


    return data.hoh || "Head of Household";
}

function getCurrentPOVCompetition() {

    const data =
        getCurrentWeekData();


    if (!data) {
        return "Power of Veto";
    }


    return data.pov || "Power of Veto";
}


function getCurrentCompetitionName(type) {

    if (type === "hoh") {
        return getCurrentHOHCompetition();
    }

    if (type === "pov") {
        return getCurrentPOVCompetition();
    }

    return "";
}



/* =========================================================
   HOH
========================================================= */

function runHOH() {

    const active =
        getActivePlayers();


    if (active.length < 2) {

        alert(
            "There are not enough Houseguests to run an HOH competition."
        );

        return;
    }


    const competition =
        getCurrentHOHCompetition();


    const winner =
        weightedCompetitionWinner(
            active,
            "hoh"
        );


    if (!winner) {
        return;
    }


    currentHOH =
        winner;


    winner.wins.hoh =
        (winner.wins.hoh || 0) + 1;


    addEvent(
        `${getDisplayName(winner)} won the HOH competition: ${competition}.`
    );


    setStage("appstore");
}



/* =========================================================
   BB APP STORE
========================================================= */

function runAppStore() {

    const active =
        getActivePlayers();


    if (!active.length) {
        setStage("nominations");
        return;
    }


    appStoreRecipients = [];


    active.forEach(player => {

        player.app = null;

    });


    /*
       The HOH receives a random App Store power.
    */

    if (currentHOH) {

        const powers = [
            "Cloud",
            "Identity Theft",
            "Bonus Life",
            "Safety Suite",
            "Power Swap"
        ];


        const power =
            powers[
                Math.floor(
                    Math.random() *
                    powers.length
                )
            ];


        currentHOH.app =
            power;


        appStoreRecipients.push({

            playerId:
                currentHOH.id,

            power

        });


        addEvent(
            `${getDisplayName(currentHOH)} received the ${power} App Store power.`
        );

    }


    /*
       Other Houseguests have a smaller chance
       of receiving an App Store power.
    */

    active.forEach(player => {

        if (
            currentHOH &&
            player.id === currentHOH.id
        ) {
            return;
        }


        if (
            Math.random() <
            0.20
        ) {

            const powers = [
                "Cloud",
                "Identity Theft",
                "Bonus Life"
            ];


            const power =
                powers[
                    Math.floor(
                        Math.random() *
                        powers.length
                    )
                ];


            player.app =
                power;


            appStoreRecipients.push({

                playerId:
                    player.id,

                power

            });


            addEvent(
                `${getDisplayName(player)} received the ${power} App Store power.`
            );

        }

    });


    appStoreHistory.push({

        week:
            currentWeek,

        cycle:
            currentCycle,

        recipients:
            appStoreRecipients.map(
                entry => ({
                    ...entry
                })
            )

    });


    setStage("nominations");
}



/* =========================================================
   NOMINATIONS
========================================================= */

function makeNominations() {

    const active =
        getActivePlayers();


    if (
        !currentHOH ||
        !active.includes(currentHOH)
    ) {

        alert(
            "There is no valid HOH available for nominations."
        );

        return;
    }


    const nominationCount =
        seasonTemplates[
            selectedSeasonTemplate
        ]?.nominationCount || 2;


    const candidates =
        active.filter(
            player =>
                player.id !==
                currentHOH.id &&
                !player.safety
        );


    if (
        candidates.length <
        nominationCount
    ) {

        alert(
            "There are not enough eligible Houseguests to make nominations."
        );

        return;
    }


    /*
       The HOH tries to nominate players
       with the lowest relationship scores
       and strong strategic threat levels.
    */

    const scored =
        candidates
            .map(player => {

                let score = 0;


                score +=
                    Math.random() * 50;


                score +=
                    player.strategy * 5;


                score +=
                    player.physical * 2;


                if (
                    areAllied(
                        currentHOH,
                        player
                    )
                ) {

                    score -= 60;

                }


                score -=
                    getRelationshipScore(
                        currentHOH.id,
                        player.id
                    ) * 0.20;


                return {
                    player,
                    score
                };

            })
            .sort(
                (a, b) =>
                    b.score - a.score
            );


    nominees =
        scored
            .slice(
                0,
                nominationCount
            )
            .map(
                entry =>
                    entry.player
            );


    nominees.forEach(
        player => {

            player.nominations =
                (player.nominations || 0) + 1;

        }
    );


    addEvent(
        `${getDisplayName(currentHOH)} nominated ${nominees.map(getDisplayName).join(" and ")} for eviction.`
    );


    setStage("hacker");
}



/* =========================================================
   HACKER COMPETITION
========================================================= */

function runHackerCompetition() {

    const active =
        getActivePlayers()
            .filter(
                player =>
                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )
            );


    if (!active.length) {
        setStage("povDraw");
        return;
    }


    /*
       The Hacker is selected based primarily
       on mental and strategy ability.
    */

    const winner =
        weightedCompetitionWinner(
            active,
            "hacker"
        );


    hackerWinner =
        winner;


    if (winner) {

        winner.hackerWins =
            (winner.hackerWins || 0) + 1;


        addEvent(
            `${getDisplayName(winner)} won the Hacker Competition.`
        );

    }


    setStage("povDraw");
}



/* =========================================================
   POV PLAYER DRAW
========================================================= */

function drawPOVPlayers() {

    const active =
        getActivePlayers();


    if (!nominees.length) {

        alert(
            "There are no nominees available for the POV draw."
        );

        return;
    }


    const eligible =
        active.filter(
            player =>
                !nominees.some(
                    nominee =>
                        nominee.id ===
                        player.id
                )
        );


    povPlayers = [
        ...nominees
    ];


    while (
        povPlayers.length < 6 &&
        eligible.length
    ) {

        const index =
            Math.floor(
                Math.random() *
                eligible.length
            );


        const player =
            eligible.splice(
                index,
                1
            )[0];


        povPlayers.push(player);

    }


    addEvent(
        `The Power of Veto players were selected: ${povPlayers.map(getDisplayName).join(", ")}.`
    );


    setStage("pov");
}



/* =========================================================
   POV COMPETITION
========================================================= */

function runPOV() {

    if (!povPlayers.length) {

        alert(
            "The POV player draw has not been completed."
        );

        return;
    }


    const competition =
        getCurrentPOVCompetition();


    const winner =
        weightedCompetitionWinner(
            povPlayers,
            "pov"
        );


    if (!winner) {
        return;
    }


    povWinner =
        winner;


    winner.wins.pov =
        (winner.wins.pov || 0) + 1;


    addEvent(
        `${getDisplayName(winner)} won the Power of Veto competition: ${competition}.`
    );


    setStage("veto");
}

function getCurrentPOVCompetition() {

    const data =
        getCurrentWeekData();

    if (!data) {
        return "Power of Veto";
    }


    if (
        currentCycle === 2 &&
        data.secondPOV
    ) {
        return data.secondPOV;
    }


    return data.pov || "Power of Veto";
}


function getCompetitionType(name) {

    const lower =
        String(name || "")
            .toLowerCase();


    if (
        lower.includes("comic") ||
        lower.includes("hashtag") ||
        lower.includes("code") ||
        lower.includes("captcha") ||
        lower.includes("launch") ||
        lower.includes("product") ||
        lower.includes("bloop") ||
        lower.includes("bleep") ||
        lower.includes("maze") ||
        lower.includes("oddcast") ||
        lower.includes("gif") ||
        lower.includes("emojis")
    ) {
        return "mental";
    }


    if (
        lower.includes("limb") ||
        lower.includes("shot") ||
        lower.includes("sky") ||
        lower.includes("jetpack") ||
        lower.includes("shell") ||
        lower.includes("flow") ||
        lower.includes("drop") ||
        lower.includes("timing") ||
        lower.includes("top")
    ) {
        return "physical";
    }


    return "mixed";
}


function competitionWinner(
    players,
    competitionName
) {

    if (!players.length) {
        return null;
    }


    const type =
        getCompetitionType(
            competitionName
        );


    const scored =
        players.map(player => {

            let score;


            if (type === "physical") {

                score =
                    player.physical * 3 +
                    player.social +
                    Math.random() * 15;

            } else if (type === "mental") {

                score =
                    player.mental * 3 +
                    player.strategy +
                    Math.random() * 15;

            } else {

                score =
                    player.physical +
                    player.mental +
                    player.strategy +
                    player.social +
                    Math.random() * 20;

            }


            return {
                player,
                score
            };

        });


    scored.sort(
        (a, b) =>
            b.score -
            a.score
    );


    return scored[0].player;
}



/* =========================================================
   HOH
========================================================= */

function runHOH() {

    const players =
        getActivePlayers()
            .filter(
                player =>
                    !player.safety
            );


    /*
       Safety only applies to the opening
       eviction.
    */

    if (currentWeek > 1) {

        houseguests.forEach(
            player =>
                player.safety = false
        );

    }


    const competition =
        getCurrentHOHCompetition();


    const winner =
        competitionWinner(
            players,
            competition
        );


    currentHOH =
        winner.id;


    addEvent(
        `${getDisplayName(winner)} won the HOH competition: ${competition}.`
    );


    if (
        currentWeek <= 3 &&
        currentCycle === 1 &&
        selectedSeasonTemplate === "bb20"
    ) {

        setStage("appstore");

    } else {

        setStage("nominations");

    }
}

/* =========================================================
   APP STORE
========================================================= */

function runAppStore() {

    if (
        selectedSeasonTemplate !==
        "bb20" ||
        typeof BB20 === "undefined"
    ) {

        setStage("nominations");

        return;
    }


    const twist =
        BB20.twists.appStore;


    if (
        !twist ||
        !twist.activeWeeks.includes(
            currentWeek
        )
    ) {

        setStage("nominations");

        return;
    }


    const available =
        getActivePlayers()
            .filter(
                player =>
                    !player.appUsed
            );


    if (!available.length) {

        setStage("nominations");

        return;
    }


    const topTrending =
        weightedRandomPlayer(
            available,
            player =>
                player.social * 2 +
                Math.random() * 10
        );


    const remaining =
        available.filter(
            player =>
                player.id !==
                topTrending.id
        );


    const leastTrending =
        remaining.length
            ? weightedRandomPlayer(
                remaining,
                player =>
                    20 -
                    player.social * 2 +
                    Math.random() * 10
            )
            : null;


    const powerByWeek = {

        1: twist.powerApps.find(
            app =>
                app.type === "bonusLife"
        ),

        2: twist.powerApps.find(
            app =>
                app.type === "cloud"
        ),

        3: twist.powerApps.find(
            app =>
                app.type === "identityTheft"
        )

    };


    const crapByWeek = {

        1: twist.crapApps[0],

        2: twist.crapApps[1],

        3: twist.crapApps[2]

    };


    const power =
        powerByWeek[currentWeek];


    const crap =
        crapByWeek[currentWeek];


    if (topTrending && power) {

        topTrending.appUsed = true;

        topTrending.app = power.name;


        if (
            power.type ===
            "bonusLife"
        ) {

            topTrending.bonusLifeAvailable =
                true;

        }


        if (
            power.type ===
            "cloud"
        ) {

            topTrending.cloudAvailable =
                true;

        }


        if (
            power.type ===
            "identityTheft"
        ) {

            topTrending.identityTheftAvailable =
                true;

        }


        appStoreRecipients.push({

            playerId: topTrending.id,

            app: power.name,

            type: power.type

        });


        addEvent(
            `${getDisplayName(topTrending)} received the ${power.name} App.`
        );

    }


    if (leastTrending && crap) {

        leastTrending.appUsed = true;

        leastTrending.punishment =
            crap.name;


        appStoreRecipients.push({

            playerId: leastTrending.id,

            app: crap.name,

            type: "punishment"

        });


        addEvent(
            `${getDisplayName(leastTrending)} received the ${crap.name} punishment.`
        );

    }


    appStoreHistory.push({

        week: currentWeek,

        week: currentWeek,

        cycle: currentCycle,

        recipients:
            appStoreRecipients.map(
                recipient => ({
                    ...recipient
                })
            )

    });


    setStage("nominations");

}



/* =========================================================
   NOMINATIONS
========================================================= */

function makeNominations() {

    const active =
        getActivePlayers();


    if (!currentHOH) {

        alert(
            "There is no current HOH."
        );

        return;
    }


    const hoh =
        houseguests.find(
            player =>
                player.id === currentHOH
        );


    if (!hoh) {

        alert(
            "The current HOH could not be found."
        );

        return;
    }


    const eligible =
        active.filter(
            player =>
                player.id !==
                hoh.id &&
                !player.safety
        );


    const nominationCount =
        seasonTemplates[
            selectedSeasonTemplate
        ]?.nominationCount || 2;


    if (
        eligible.length <
        nominationCount
    ) {

        alert(
            "There are not enough eligible Houseguests to make nominations."
        );

        return;
    }


    /*
       Score each eligible player.

       Lower relationships with the HOH increase
       the likelihood of nomination.

       Strong strategic players are also more
       likely to be targeted.
    */

    const scored =
        eligible.map(player => {

            let score =
                Math.random() * 40;


            const relationship =
                getRelationshipValue(
                    hoh.id,
                    player.id
                );


            score -=
                relationship * 0.35;


            score +=
                player.strategy * 4;


            score +=
                player.physical * 1.5;


            if (
                areAllied(
                    hoh,
                    player
                )
            ) {

                score -= 45;

            }


            return {
                player,
                score
            };

        });


    scored.sort(
        (a, b) =>
            b.score -
            a.score
    );


    nominees =
        scored
            .slice(
                0,
                nominationCount
            )
            .map(
                entry =>
                    entry.player
            );


    nominees.forEach(
        nominee => {

            nominee.nominations =
                (nominee.nominations || 0) + 1;

        }
    );


    addEvent(
        `${getDisplayName(hoh)} nominated ${nominees.map(getDisplayName).join(" and ")} for eviction.`
    );


    setStage("hacker");

}



/* =========================================================
   HACKER
========================================================= */

function runHackerCompetition() {

    if (
        selectedSeasonTemplate !==
        "bb20"
    ) {

        setStage("povDraw");

        return;
    }


    if (
        typeof BB20 ===
        "undefined"
    ) {

        setStage("povDraw");

        return;
    }


    const hackerTwist =
        BB20.twists?.hacker;


    if (!hackerTwist) {

        setStage("povDraw");

        return;
    }


    if (
        !hackerTwist.activeWeeks.includes(
            currentWeek
        )
    ) {

        setStage("povDraw");

        return;
    }


    const eligible =
        getActivePlayers()
            .filter(
                player =>
                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )
            );


    if (!eligible.length) {

        setStage("povDraw");

        return;
    }


    const winner =
        competitionWinner(
            eligible,
            hackerTwist.name ||
            "Hacker Competition"
        );


    if (winner) {

        hackerWinner =
            winner.id;


        winner.hackerWins =
            (winner.hackerWins || 0) + 1;


        addEvent(
            `${getDisplayName(winner)} won the Hacker Competition.`
        );


        /*
           The Hacker may select one POV player
           to replace the original draw.
        */

        hackerSelectedVetoPlayer =
            null;

    }


    setStage("povDraw");

}



/* =========================================================
   POV DRAW
========================================================= */

function drawPOVPlayers() {

    const active =
        getActivePlayers();


    if (!nominees.length) {

        alert(
            "There are currently no nominees."
        );

        return;
    }


    const eligible =
        active.filter(
            player =>
                !nominees.some(
                    nominee =>
                        nominee.id ===
                        player.id
                )
        );


    povPlayers =
        [...nominees];


    /*
       Randomly select additional Houseguests
       until there are six POV players.
    */

    while (
        povPlayers.length < 6 &&
        eligible.length
    ) {

        const index =
            Math.floor(
                Math.random() *
                eligible.length
            );


        const selected =
            eligible.splice(
                index,
                1
            )[0];


        povPlayers.push(
            selected
        );

    }


    /*
       If the Hacker has the power to alter
       the POV draw, apply the replacement.
    */

    if (
        hackerWinner &&
        currentWeek <= 3 &&
        selectedSeasonTemplate === "bb20"
    ) {

        const hacker =
            houseguests.find(
                player =>
                    player.id ===
                    hackerWinner
            );


        if (
            hacker &&
            !nominees.some(
                nominee =>
                    nominee.id ===
                    hacker.id
            )
        ) {

            const possibleTargets =
                povPlayers.filter(
                    player =>
                        !nominees.some(
                            nominee =>
                                nominee.id ===
                                player.id
                        ) &&
                        player.id !==
                        hacker.id
                );


            if (
                possibleTargets.length
            ) {

                const replaceIndex =
                    Math.floor(
                        Math.random() *
                        possibleTargets.length
                    );


                const playerToReplace =
                    possibleTargets[
                        replaceIndex
                    ];


                const available =
                    active.filter(
                        player =>
                            !povPlayers.some(
                                selected =>
                                    selected.id ===
                                    player.id
                            ) &&
                            player.id !==
                            hacker.id
                    );


                if (
                    available.length
                ) {

                    const replacement =
                        available[
                            Math.floor(
                                Math.random() *
                                available.length
                            )
                        ];


                    const index =
                        povPlayers.findIndex(
                            player =>
                                player.id ===
                                playerToReplace.id
                        );


                    if (index !== -1) {

                        povPlayers[index] =
                            replacement;

                        hackerSelectedVetoPlayer =
                            replacement.id;


                        addEvent(
                            `${getDisplayName(hacker)} used the Hacker power to add ${getDisplayName(replacement)} to the Power of Veto competition.`
                        );

                    }

                }

            }

        }

    }


    addEvent(
        `The Power of Veto players are ${povPlayers.map(getDisplayName).join(", ")}.`
    );


    setStage("pov");

}



/* =========================================================
   POWER OF VETO
========================================================= */

function runPOV() {

    if (!povPlayers.length) {

        alert(
            "The POV player draw has not been completed."
        );

        return;
    }


    const competition =
        getCurrentPOVCompetition();


    const winner =
        competitionWinner(
            povPlayers,
            competition
        );


    if (!winner) {

        alert(
            "No POV winner could be determined."
        );

        return;
    }


    povWinner =
        winner.id;


    winner.wins =
        winner.wins || {
            hoh: 0,
            pov: 0
        };


    winner.wins.pov =
        (winner.wins.pov || 0) + 1;


    addEvent(
        `${getDisplayName(winner)} won the Power of Veto competition: ${competition}.`
    );


    setStage("veto");

}

/* =========================================================
   APP STORE
========================================================= */

function runAppStore() {

    if (
        selectedSeasonTemplate !==
        "bb20" ||
        typeof BB20 === "undefined"
    ) {

        setStage("nominations");

        return;
    }


    const twist =
        BB20.twists.appStore;


    if (
        !twist ||
        !twist.activeWeeks.includes(
            currentWeek
        )
    ) {

        setStage("nominations");

        return;
    }


    const available =
        getActivePlayers()
            .filter(
                player =>
                    !player.appUsed
            );


    if (!available.length) {

        setStage("nominations");

        return;
    }


    const topTrending =
        weightedRandomPlayer(
            available,
            player =>
                player.social * 2 +
                Math.random() * 10
        );


    const remaining =
        available.filter(
            player =>
                player.id !==
                topTrending.id
        );


    const leastTrending =
        remaining.length
            ? weightedRandomPlayer(
                remaining,
                player =>
                    20 -
                    player.social * 2 +
                    Math.random() * 10
            )
            : null;


    const powerByWeek = {

        1: twist.powerApps.find(
            app =>
                app.type === "bonusLife"
        ),

        2: twist.powerApps.find(
            app =>
                app.type === "cloud"
        ),

        3: twist.powerApps.find(
            app =>
                app.type === "identityTheft"
        )

    };


    const crapByWeek = {

        1: twist.crapApps[0],

        2: twist.crapApps[1],

        3: twist.crapApps[2]

    };


    const power =
        powerByWeek[currentWeek];


    const crap =
        crapByWeek[currentWeek];


    if (topTrending && power) {

        topTrending.appUsed = true;

        topTrending.app = power.name;


        if (
            power.type ===
            "bonusLife"
        ) {

            topTrending.bonusLifeAvailable =
                true;

        }


        if (
            power.type ===
            "cloud"
        ) {

            topTrending.cloudAvailable =
                true;

        }


        if (
            power.type ===
            "identityTheft"
        ) {

            topTrending.identityTheftAvailable =
                true;

        }


        appStoreRecipients.push({

            playerId: topTrending.id,

            app: power.name,

            type: power.type

        });


        addEvent(
            `${getDisplayName(topTrending)} received the ${power.name} App.`
        );

    }


    if (leastTrending && crap) {

        leastTrending.appUsed = true;

        leastTrending.punishment =
            crap.name;


        appStoreRecipients.push({

            playerId: leastTrending.id,

            app: crap.name,

            type: "punishment"

        });


        addEvent(
            `${getDisplayName(leastTrending)} received the ${crap.name} punishment.`
        );

    }


    appStoreHistory.push({

        week: currentWeek,

    if (
        weekData &&
        weekData.hacker
    ) {

        setStage("hacker");

    } else {

        setStage("povDraw");

    }
}


function chooseNominees(
    eligible,
    decisionMaker
) {

    if (eligible.length <= 2) {
        return eligible.slice();
    }


    const first =
        weightedRandomPlayer(
            eligible,
            player =>
                evictionTargetScore(
                    decisionMaker,
                    player
                )
        );


    const remaining =
        eligible.filter(
            player =>
                player.id !==
                first.id
        );


    const second =
        weightedRandomPlayer(
            remaining,
            player =>
                evictionTargetScore(
                    decisionMaker,
                    player
                )
        );


    return [
        first,
        second
    ];
}



/* =========================================================
   HACKER
========================================================= */

function runHackerCompetition() {

    const active =
        getActivePlayers();


    const competition =
        getCurrentWeekData().hacker;


    hackerWinner =
        competitionWinner(
            active,
            competition
        );


    hackerWinner.hackerWins =
        (hackerWinner.hackerWins || 0) + 1;


    addEvent(
        `${getDisplayName(hackerWinner)} secretly won the Hacker Competition: ${competition}.`
    );


    /*
       Replace one nominee.
    */

    const replaceableNominee =
        weightedRandomPlayer(
            nominees,
            player =>
                5 +
                player.social +
                Math.random() * 10
        );


    const replacementPool =
        active.filter(
            player =>
                player.id !==
                currentHOH &&
                !nominees.some(
                    nominee =>
                        nominee.id ===
                        player.id
                )
        );


    if (
        replaceableNominee &&
        replacementPool.length
    ) {

        const replacement =
            weightedRandomPlayer(
                replacementPool,
                player =>
                    player.strategy +
                    player.social +
                    Math.random() * 10
            );


        nominees =
            nominees.filter(
                player =>
                    player.id !==
                    replaceableNominee.id
            );


        nominees.push(
            replacement
        );


        addEvent(
            `The Hacker secretly replaced ${getDisplayName(replaceableNominee)} with ${getDisplayName(replacement)}.`
        );

    }


    /*
       Choose one POV player.
    */

    const povPool =
        active.filter(
            player =>
                !nominees.some(
                    nominee =>
                        nominee.id ===
                        player.id
                ) &&
                player.id !==
                currentHOH
        );


    if (povPool.length) {

        hackerSelectedVetoPlayer =
            weightedRandomPlayer(
                povPool,
                player =>
                    player.strategy +
                    player.mental +
                    Math.random() * 10
            );


        addEvent(
            `The Hacker secretly selected ${getDisplayName(hackerSelectedVetoPlayer)} to play in the POV.`
        );

    }


    /*
       Nullify one eviction vote.
    */

    hackerVoteNullified =
        chooseHackerVoteNullification();


    if (hackerVoteNullified) {

    if (hackerVoteNullified) {

        addEvent(
            `The Hacker secretly nullified ${getDisplayName(hackerVoteNullified)}'s eviction vote.`
        );

    }

}


/* =========================================================
   POV DRAW
========================================================= */

function drawPOVPlayers() {

    const active =
        getActivePlayers();

    const pool =
        active.filter(
            player =>
                player.id !== currentHOH &&
                !nominees.some(
                    nominee =>
                        nominee.id ===
                        player.id
                )
        );

    povPlayers = [
        ...nominees
    ];

    if (
        hackerSelectedVetoPlayer &&
        !povPlayers.some(
            player =>
                player.id ===
                hackerSelectedVetoPlayer.id
        )
    ) {

        povPlayers.push(
            hackerSelectedVetoPlayer
        );

    }


    const remainingSlots =
        6 - povPlayers.length;


    if (remainingSlots > 0) {

        const randomPlayers =
            weightedRandomPlayers(
                pool.filter(
                    player =>
                        !povPlayers.some(
                            selected =>
                                selected.id ===
                                player.id
                        )
                ),
                player =>
                    player.competition +
                    player.mental +
                    Math.random() * 10,
                remainingSlots
            );


        povPlayers.push(
            ...randomPlayers
        );

    }


    povPlayers =
        povPlayers.slice(
            0,
            Math.min(
                6,
                active.length
            )
        );


    addEvent(
        `The Power of Veto players are: ${povPlayers.map(getDisplayName).join(", ")}.`
    );

}


/* =========================================================
   POV
========================================================= */

function runPOV() {

    const competition =
        getCurrentPOVCompetition();


    povWinner =
        competitionWinner(
            povPlayers,
            competition
        );


    povWinner.povWins =
        (povWinner.povWins || 0) + 1;


    addEvent(
        `${getDisplayName(povWinner)} won the Power of Veto: ${competition}.`
    );


    /*
       Decide whether the POV is used.
    */

    const nomineeTargets =
        nominees.filter(
            nominee =>
                nominee.id !==
                povWinner.id
        );


    let useVeto = false;


    if (
        nominees.some(
            nominee =>
                nominee.id ===
                povWinner.id
        )
    ) {

        useVeto = true;

    } else {

        const bestNominee =
            nominees
                .slice()
                .sort(
                    (a, b) =>
                        evictionTargetScore(
                            b,
                            povWinner
                        ) -
                        evictionTargetScore(
                            a,
                            povWinner
                        )
                )[0];


        if (
            bestNominee &&
            Math.random() <
                0.25
        ) {

            useVeto = true;

        }

    }


    if (
        useVeto &&
        nominees.length
    ) {

        const removedNominee =
            nominees.find(
                nominee =>
                    nominee.id !==
                    povWinner.id
            ) ||
            nominees[0];


        const replacementPool =
            getActivePlayers().filter(
                player =>
                    player.id !==
                    currentHOH &&
                    player.id !==
                    povWinner.id &&
                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )
            );


        if (replacementPool.length) {

            const replacement =
                weightedRandomPlayer(
                    replacementPool,
                    player =>
                        evictionTargetScore(
                            currentHOH,
                            player
                        )
                );


            nominees =
                nominees.filter(
                    nominee =>
                        nominee.id !==
                        removedNominee.id
                );


            nominees.push(
                replacement
            );


            addEvent(
                `${getDisplayName(povWinner)} used the Power of Veto on ${getDisplayName(removedNominee)}, and ${getDisplayName(replacement)} was named as the replacement nominee.`
            );

        }

    } else {

        addEvent(
            `${getDisplayName(povWinner)} chose not to use the Power of Veto.`
        );

    }

}


/* =========================================================
   VETO CEREMONY
========================================================= */

function runVetoCeremony() {

    /*
       In the standard format, the veto ceremony simply
       finalizes the nominations before the eviction.
    */

    addEvent(
        `The Power of Veto ceremony is complete. The nominees are ${nominees.map(getDisplayName).join(" and ")}.`
    );


    setStage("evictionVoting");

}


/* =========================================================
   EVICTION VOTING
========================================================= */

function chooseEvictionVote(
    voter,
    nomineeOptions
) {

    if (!nomineeOptions.length) {
        return null;
    }


    if (nomineeOptions.length === 1) {
        return nomineeOptions[0];
    }


    const scores =
        nomineeOptions.map(
            nominee => {

                let score =
                    10;


                /*
                   Stronger relationships make
                   the voter less likely to evict.
                */

                score +=
                    getRelationship(
                        voter.id,
                        nominee.id
                    ) *
                    1.5;


                /*
                   Strategic targeting.
                */

                score +=
                    nominee.competition *
                    0.8;


                score +=
                    nominee.strategy *
                    0.8;


                /*
                   Social players are sometimes
                   protected by the house.
                */

                score +=
                    nominee.social *
                    0.4;


                /*
                   Randomness.
                */

                score +=
                    Math.random() *
                    20;


                return {
                    nominee,
                    score
                };

            }
        );


    scores.sort(
        (a, b) =>
            b.score -
            a.score
    );


    /*
       The highest score represents
       the most likely eviction target.
    */

    return scores[0].nominee;

}


/* =========================================================
   EVICTION
========================================================= */

function runEvictionVoting() {

    const active =
        getActivePlayers();


    const voters =
        active.filter(
            player =>
                player.id !==
                currentHOH &&
                !nominees.some(
                    nominee =>
                        nominee.id ===
                        player.id
                )
        );


    const votes = [];


    voters.forEach(
        voter => {

            let target =
                chooseEvictionVote(
                    voter,
                    nominees
                );


            if (
                hackerVoteNullified &&
                voter.id ===
                hackerVoteNullified.id
            ) {

                addEvent(
                    `${getDisplayName(voter)}'s eviction vote was nullified by the Hacker.`
                );


                target = null;

            }


            votes.push({
                voter,
                target
            });

        }
    );


    voteHistory =
        votes;


    currentVoteRevealIndex =
        0;


    setStage("eviction");

}


function countEvictionVotes() {

    const counts = {};


    nominees.forEach(
        nominee => {
            counts[nominee.id] = 0;
        }
    );


    voteHistory.forEach(
        vote => {

            if (
                vote.target &&
                counts[vote.target.id] !==
                    undefined
            ) {

                counts[vote.target.id]++;

            }

        }
    );


    return counts;

}


/* =========================================================
   EVICTION CEREMONY
========================================================= */

function completeEviction() {

    const counts =
        countEvictionVotes();


    let evicted =
        nominees[0];


    if (
        nominees[1] &&
        counts[nominees[1].id] >
            counts[nominees[0].id]
    ) {

        evicted =
            nominees[1];

    }


    if (!evicted) {
        return;
    }


    /*
       Remove from active houseguests.
    */

    houseguests =
        houseguests.filter(
            player =>
                player.id !==
                evicted.id
        );


    evicted.status =
        "Evicted";


    evicted.evictionWeek =
        currentWeek;


    evicted.evictionCycle =
        currentCycle;


    evictedHouseguests.push(
        evicted
    );


    /*
       Add to jury when appropriate.
    */

    const template =
        seasonTemplates[
            selectedSeasonTemplate
        ];


    const juryStart =
        template &&
        template.juryStartAfterEvictions !==
            undefined
            ? template.juryStartAfterEvictions
            : 7;


    if (
        evictedHouseguests.length >
            juryStart &&
        evictedHouseguests.length <=
            juryStart +
            (template?.jurySize || 9)
    ) {

        jury.push(
            evicted
        );

        evicted.isJury =
            true;

    }


    /*
       Record eviction history.
    */

    evictionHistory.push({
        week: currentWeek,
        cycle: currentCycle,
        player: evicted,
        votes: counts
    });


    addEvent(
        `${getDisplayName(evicted)} was evicted from the Big Brother house.`
    );


    /*
       Clear temporary week data.
    */

    nominees = [];
    povWinner = null;
    povPlayers = [];
    hackerWinner = null;
    hackerVoteNullified = null;
    hackerSelectedVetoPlayer = null;


    /*
       Check whether the season is ready
       for the next stage.
    */

    if (
        houseguests.length <=
        3
    ) {

        setStage("finalHOH1");

        return;

    }


    setStage("battleback");

}

function usePOV() {

    if (!povWinner) {

        setStage("evictionVoting");

        return;
    }


    /*
       A nominee is more likely to use POV on themselves.
    */

    const nomineeWinner =
        nominees.some(
            nominee =>
                nominee.id ===
                povWinner.id
        );


    let useVeto;


    if (nomineeWinner) {

        useVeto = true;

    } else {

        useVeto =
            Math.random() <
            (
                0.25 +
                povWinner.social / 30
            );

    }


    if (!useVeto) {

        addEvent(
            `${getDisplayName(povWinner)} chose not to use the Power of Veto.`
        );


        setStage("evictionVoting");

        return;
    }


    const removableNominees =
        nominees.slice();


    let savedNominee =
        removableNominees[0];


    if (
        removableNominees.length > 1 &&
        !nomineeWinner
    ) {

        savedNominee =
            weightedRandomPlayer(
                removableNominees,
                player =>
                    player.social +
                    player.strategy +
                    Math.random() * 15
            );

    } else {

        savedNominee =
            nominees.find(
                nominee =>
                    nominee.id ===
                    povWinner.id
            ) ||
            nominees[0];

    }


    nominees =
        nominees.filter(
            nominee =>
                nominee.id !==
                savedNominee.id
        );


    const replacementPool =
        getActivePlayers()
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
                    )
            );


    if (replacementPool.length) {

        const replacement =
            weightedRandomPlayer(
                replacementPool,
                player =>
                    player.strategy +
                    player.social +
                    Math.random() * 15
            );


        nominees.push(
            replacement
        );


        addEvent(
            `${getDisplayName(povWinner)} used the POV to save ${getDisplayName(savedNominee)}. ${getDisplayName(replacement)} was named as the replacement nominee.`
        );

    }


    setStage("evictionVoting");
}


/* =========================================================
   EVICTION VOTING
========================================================= */

let currentEvictionVotes = {};
let currentTieBreaker = null;
let evictionVotePhase = "regular";


function prepareEvictionVotes() {

    currentEvictionVotes = {};
    currentTieBreaker = null;

    currentVoteRevealIndex = 0;

    evictionVotePhase = "regular";


    const voters =
        getActivePlayers();


    voters.forEach(voter => {

        if (
            voter.id ===
            currentHOH
        ) {

            currentEvictionVotes[
                voter.id
            ] = {
                type: "no-vote",
                target: null
            };

            return;
        }


        if (
            nominees.some(
                nominee =>
                    nominee.id ===
                    voter.id
            )
        ) {

            currentEvictionVotes[
                voter.id
            ] = {
                type: "no-vote",
                target: null
            };

            return;
        }

function usePOV() {

    if (!povWinner) {

        setStage("evictionVoting");

        return;
    }


    /*
       A nominee is more likely to use POV on themselves.
    */

    const nomineeWinner =
        nominees.some(
            nominee =>
                nominee.id ===
                povWinner.id
        );


    let useVeto;


    if (nomineeWinner) {

        useVeto = true;

    } else {

        useVeto =
            Math.random() <
            (
                0.25 +
                povWinner.social / 30
            );

    }


    if (!useVeto) {

        addEvent(
            `${getDisplayName(povWinner)} chose not to use the Power of Veto.`
        );


        setStage("evictionVoting");

        return;
    }


    const removableNominees =
        nominees.slice();


    let savedNominee =
        removableNominees[0];


    if (
        removableNominees.length > 1 &&
        !nomineeWinner
    ) {

        savedNominee =
            weightedRandomPlayer(
                removableNominees,
                player =>
                    player.social +
                    player.strategy +
                    Math.random() * 15
            );

    } else {

        savedNominee =
            nominees.find(
                nominee =>
                    nominee.id ===
                    povWinner.id
            ) ||
            nominees[0];

    }


    nominees =
        nominees.filter(
            nominee =>
                nominee.id !==
                savedNominee.id
        );


    const replacementPool =
        getActivePlayers()
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
                    )
            );


    if (replacementPool.length) {

        const replacement =
            weightedRandomPlayer(
                replacementPool,
                player =>
                    player.strategy +
                    player.social +
                    Math.random() * 15
            );


        nominees.push(
            replacement
        );


        addEvent(
            `${getDisplayName(povWinner)} used the POV to save ${getDisplayName(savedNominee)}. ${getDisplayName(replacement)} was named as the replacement nominee.`
        );

    }


    setStage("evictionVoting");
}


/* =========================================================
   EVICTION VOTING
========================================================= */

let currentEvictionVotes = {};
let currentTieBreaker = null;
let evictionVotePhase = "regular";


function prepareEvictionVotes() {

    currentEvictionVotes = {};
    currentTieBreaker = null;

    currentVoteRevealIndex = 0;

    evictionVotePhase = "regular";


    const voters =
        getActivePlayers();


    voters.forEach(voter => {

        if (
            voter.id ===
            currentHOH
        ) {

            currentEvictionVotes[
                voter.id
            ] = {
                type: "no-vote",
                target: null
            };

            return;
        }


        if (
            nominees.some(
                nominee =>
                    nominee.id ===
                    voter.id
            )
        ) {

            currentEvictionVotes[
                voter.id
            ] = {
                type: "no-vote",
                target: null
            };

            return;
        }


        let target =
            chooseEvictionVote(
                voter,
                nominees
            );


        if (
            hackerVoteNullified &&
            voter.id ===
            hackerVoteNullified.id
        ) {

            currentEvictionVotes[
                voter.id
            ] = {
                type: "nullified",
                target: null
            };

            return;
        }


        currentEvictionVotes[
            voter.id
        ] = {
            type: "vote",
            target
        };

    });


    /*
       Determine the initial vote totals.
    */

    const totals = {};


    nominees.forEach(
        nominee => {
            totals[nominee.id] = 0;
        }
    );


    Object.values(
        currentEvictionVotes
    ).forEach(
        vote => {

            if (
                vote.type === "vote" &&
                vote.target
            ) {

                if (
                    totals[
                        vote.target.id
                    ] !== undefined
                ) {

                    totals[
                        vote.target.id
                    ]++;

                }

            }

        }
    );


    /*
       Store totals for display.
    */

    currentEvictionVotes.totals =
        totals;

}


/* =========================================================
   TIE BREAKER
========================================================= */

function resolveEvictionTie() {

    const totals =
        currentEvictionVotes.totals ||
        {};


    if (nominees.length < 2) {
        return nominees[0] || null;
    }


    const first =
        nominees[0];

    const second =
        nominees[1];


    const firstVotes =
        totals[first.id] || 0;

    const secondVotes =
        totals[second.id] || 0;


    if (
        firstVotes ===
        secondVotes
    ) {

        currentTieBreaker =
            weightedRandomPlayer(
                nominees,
                player =>
                    player.strategy +
                    player.social +
                    Math.random() * 10
            );


        addEvent(
            `The eviction vote is tied. The tie-breaker will decide between ${getDisplayName(first)} and ${getDisplayName(second)}.`
        );


        return currentTieBreaker;

    }


    return firstVotes >
        secondVotes
        ? first
        : second;
}


/* =========================================================
   NEXT CYCLE
========================================================= */

function advanceAfterEviction() {

    if (
        houseguests.length <=
        3
    ) {

        setStage("finalHOH1");

        return;
    }


    currentCycle++;


    if (
        currentCycle > 2
    ) {

        currentCycle = 1;
        currentWeek++;

    }


    if (
        houseguests.length <=
        3
    ) {

        setStage("finalHOH1");

        return;
    }


    currentHOH = null;
    nominees = [];
    povWinner = null;
    povPlayers = [];
    hackerWinner = null;
    hackerVoteNullified = null;
    hackerSelectedVetoPlayer = null;


    setStage("hoh");
}


/* =========================================================
   BATTLE BACK
========================================================= */

function runBattleBack() {

    /*
       Battle Back is optional and only occurs
       when enough evicted players are available.
    */

    if (
        battleBackUsed ||
        evictedHouseguests.length < 4
    ) {

        setStage("nextcycle");

        return;
    }


    const eligible =
        evictedHouseguests.filter(
            player =>
                !player.isJury
        );


    if (
        eligible.length < 2
    ) {

        setStage("nextcycle");

        return;
    }


    /*
       Only activate the Battle Back
       occasionally.
    */

    if (
        Math.random() >
        0.20
    ) {

        setStage("nextcycle");

        return;
    }


    battleBackUsed = true;


    const winner =
        weightedRandomPlayer(
            eligible,
            player =>
                player.competition +
                player.mental +
                player.physical +
                Math.random() * 20
        );


    houseguests.push(
        winner
    );


    winner.status =
        "Active";

    winner.isJury =
        false;


    evictedHouseguests =
        evictedHouseguests.filter(
            player =>
                player.id !==
                winner.id
        );


    addEvent(
        `${getDisplayName(winner)} won the Battle Back and returned to the Big Brother house!`
    );


    setStage("nextcycle");
}

        const target =
            chooseEvictionTarget(
                voter
            );


        currentEvictionVotes[
            voter.id
        ] = {

            type:
                voter.id ===
                hackerVoteNullified
                    ? "nullified"
                    : "vote",

            target:
                target.id

        };

    });


    addEvent(
        "The Houseguests have cast their eviction votes. The votes will now be revealed one at a time."
    );


    renderEvictionVoteReveal();


    setStage("eviction");
}


function chooseEvictionTarget(
    voter
) {

    const targets =
        nominees;


    if (!targets.length) {
        return null;
    }


    return weightedRandomPlayer(
        targets,
        target =>
            evictionTargetScore(
                voter,
                target
            )
    );
}


function evictionTargetScore(
    voter,
    target
) {

    if (!voter || !target) {
        return 1;
    }


    let score =
        10 +
        target.strategy +
        target.social;


    const relationship =
        getRelationshipScore(
            voter.id,
            target.id
        );


    /*
       Positive relationship = less likely
       to vote them out.

       Negative relationship = more likely.
    */

    score -=
        relationship * 0.5;


    if (
        areAllied(
            voter,
            target
        )
    ) {

        score -= 40;

    }


    if (
        target.strategy >= 8
    ) {

        score +=
            target.strategy * 2;

    }


    score +=
        Math.random() * 25;


    return Math.max(
        1,
        score
    );
}



/* =========================================================
   INDIVIDUAL VOTE REVEAL
========================================================= */

function revealNextEvictionVote() {

    const voters =
        getActivePlayers();


    const revealable =
        voters.filter(
            voter =>
                currentEvictionVotes[
                    voter.id
                ] &&
                currentEvictionVotes[
                    voter.id
                ].type !==
                "no-vote"
        );


    /*
       Reveal normal votes one by one.
    */

    if (
        currentVoteRevealIndex <
        revealable.length
    ) {

        currentVoteRevealIndex++;

        renderEvictionVoteReveal();

        return;
    }


    /*
       All regular votes are revealed.
    */

    const totals =
        calculateEvictionVoteTotals();


    const nomineeA =
        nominees[0];

    const nomineeB =
        nominees[1];


    if (
        totals[nomineeA.id] ===
        totals[nomineeB.id]
    ) {

        if (!currentTieBreaker) {

            const hoh =
                houseguests.find(
                    player =>
                        player.id ===
                        currentHOH
                );        const target =
            chooseEvictionTarget(
                voter
            );


        currentEvictionVotes[
            voter.id
        ] = {

            type:
                voter.id ===
                hackerVoteNullified
                    ? "nullified"
                    : "vote",

            target:
                target.id

        };

    });


    addEvent(
        "The Houseguests have cast their eviction votes. The votes will now be revealed one at a time."
    );


    renderEvictionVoteReveal();


    setStage("eviction");
}


function chooseEvictionTarget(
    voter
) {

    const targets =
        nominees;


    if (!targets.length) {
        return null;
    }


    return weightedRandomPlayer(
        targets,
        target =>
            evictionTargetScore(
                voter,
                target
            )
    );
}


function evictionTargetScore(
    voter,
    target
) {

    if (!voter || !target) {
        return 1;
    }


    let score =
        10 +
        target.strategy +
        target.social;


    const relationship =
        getRelationshipScore(
            voter.id,
            target.id
        );


    /*
       Positive relationship = less likely
       to vote them out.

       Negative relationship = more likely.
    */

    score -=
        relationship * 0.5;


    if (
        areAllied(
            voter,
            target
        )
    ) {

        score -= 40;

    }


    if (
        target.strategy >= 8
    ) {

        score +=
            target.strategy * 2;

    }


    score +=
        Math.random() * 25;


    return Math.max(
        1,
        score
    );
}



/* =========================================================
   INDIVIDUAL VOTE REVEAL
========================================================= */

function revealNextEvictionVote() {

    const voters =
        getActivePlayers();


    const revealable =
        voters.filter(
            voter =>
                currentEvictionVotes[
                    voter.id
                ] &&
                currentEvictionVotes[
                    voter.id
                ].type !==
                "no-vote"
        );


    /*
       Reveal normal votes one by one.
    */

    if (
        currentVoteRevealIndex <
        revealable.length
    ) {

        currentVoteRevealIndex++;

        renderEvictionVoteReveal();

        return;
    }


    /*
       All regular votes are revealed.
    */

    const totals =
        calculateEvictionVoteTotals();


    const nomineeA =
        nominees[0];

    const nomineeB =
        nominees[1];


    if (
        totals[nomineeA.id] ===
        totals[nomineeB.id]
    ) {

        if (!currentTieBreaker) {

            const hoh =
                houseguests.find(
                    player =>
                        player.id ===
                        currentHOH
                );        const target =
            chooseEvictionTarget(
                voter
            );


        currentEvictionVotes[
            voter.id
        ] = {

            type:
                voter.id ===
                hackerVoteNullified
                    ? "nullified"
                    : "vote",

            target:
                target.id

        };

    });


    addEvent(
        "The Houseguests have cast their eviction votes. The votes will now be revealed one at a time."
    );


    renderEvictionVoteReveal();


    setStage("eviction");
}


function chooseEvictionTarget(
    voter
) {

    const targets =
        nominees;


    if (!targets.length) {
        return null;
    }


    return weightedRandomPlayer(
        targets,
        target =>
            evictionTargetScore(
                voter,
                target
            )
    );
}


function evictionTargetScore(
    voter,
    target
) {

    if (!voter || !target) {
        return 1;
    }


    let score =
        10 +
        target.strategy +
        target.social;


    const relationship =
        getRelationshipScore(
            voter.id,
            target.id
        );


    /*
       Positive relationship = less likely
       to vote them out.

       Negative relationship = more likely.
    */

    score -=
        relationship * 0.5;


    if (
        areAllied(
            voter,
            target
        )
    ) {

        score -= 40;

    }


    if (
        target.strategy >= 8
    ) {

        score +=
            target.strategy * 2;

    }


    score +=
        Math.random() * 25;


    return Math.max(
        1,
        score
    );
}



/* =========================================================
   INDIVIDUAL VOTE REVEAL
========================================================= */

function revealNextEvictionVote() {

    const voters =
        getActivePlayers();


    const revealable =
        voters.filter(
            voter =>
                currentEvictionVotes[
                    voter.id
                ] &&
                currentEvictionVotes[
                    voter.id
                ].type !==
                "no-vote"
        );


    /*
       Reveal normal votes one by one.
    */

    if (
        currentVoteRevealIndex <
        revealable.length
    ) {

        currentVoteRevealIndex++;

        renderEvictionVoteReveal();

        return;
    }


    /*
       All regular votes are revealed.
    */

    const totals =
        calculateEvictionVoteTotals();


    const nomineeA =
        nominees[0];

    const nomineeB =
        nominees[1];


    if (
        totals[nomineeA.id] ===
        totals[nomineeB.id]
    ) {

        if (!currentTieBreaker) {

            const hoh =
                houseguests.find(
                    player =>
                        player.id ===
                        currentHOH
                );

            currentTieBreaker =
                chooseEvictionTarget(
                    hoh
                );


            evictionVotePhase =
                "tie";


            addEvent(
                `The eviction vote is tied ${totals[nomineeA.id]}-${totals[nomineeB.id]}. ${getDisplayName(hoh)} must break the tie.`
            );


            renderTieBreaker();


            return;
        }

    }


    resolveEviction();
}


function calculateEvictionVoteTotals() {

    const totals = {};


    nominees.forEach(
        nominee => {
            totals[nominee.id] = 0;
        }
    );


    Object.values(
        currentEvictionVotes
    ).forEach(vote => {

        if (
            vote.type === "vote" &&
            vote.target
        ) {

            totals[vote.target] =
                (
                    totals[vote.target] ||
                    0
                ) + 1;

        }

    });


    return totals;
}


function renderEvictionVoteReveal() {

    const container =
        $("evictionResults");


    container.classList.remove(
        "hidden"
    );


    const voters =
        getActivePlayers();


    const revealable =
        voters.filter(
            voter =>
                currentEvictionVotes[
                    voter.id
                ] &&
                currentEvictionVotes[
                    voter.id
                ].type !==
                "no-vote"
        );


    const revealedIds =
        new Set(
            revealable
                .slice(
                    0,
                    currentVoteRevealIndex
                )
                .map(
                    voter =>
                        voter.id
                )
        );


    let html = `

        <h2>
            Eviction Vote Reveal
        </h2>

        <p>
            Revealed:
            ${Math.min(
                currentVoteRevealIndex,
                revealable.length
            )}
            /
            ${revealable.length}
            votes
        </p>

    `;


    voters.forEach(voter => {

        const vote =
            currentEvictionVotes[
                voter.id
            ];


        if (!vote) {
            return;
        }


        /*
           HOH / nominees don't vote.
        */

        if (
            vote.type ===
            "no-vote"
        ) {

            html += `
                <div class="vote-row">

                    <div class="vote-person">

                        ${getPlayerImageHTML(
                            voter,
                            ""
                        )}

                        <div>

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(voter)
                                )}
                            </strong>

                            <div>
                                Does Not Vote
                            </div>

                        </div>

                    </div>

                    <div class="vote-arrow">
                        —
                    </div>

                    <div>
                        ${
                            voter.id === currentHOH
                                ? "HOH"
                                : "Nominee"
                        }
                    </div>

                </div>
            `;

            return;
        }


        /*
           Hacker-nullified vote.
        */

        if (
            vote.type ===
            "nullified"
        ) {            currentTieBreaker =
                chooseEvictionTarget(
                    hoh
                );


            evictionVotePhase =
                "tie";


            addEvent(
                `The eviction vote is tied ${totals[nomineeA.id]}-${totals[nomineeB.id]}. ${getDisplayName(hoh)} must break the tie.`
            );


            renderTieBreaker();


            return;
        }

    }


    resolveEviction();
}


function calculateEvictionVoteTotals() {

    const totals = {};


    nominees.forEach(
        nominee => {
            totals[nominee.id] = 0;
        }
    );


    Object.values(
        currentEvictionVotes
    ).forEach(vote => {

        if (
            vote.type === "vote" &&
            vote.target
        ) {

            totals[vote.target] =
                (
                    totals[vote.target] ||
                    0
                ) + 1;

        }

    });


    return totals;
}


function renderEvictionVoteReveal() {

    const container =
        $("evictionResults");


    container.classList.remove(
        "hidden"
    );


    const voters =
        getActivePlayers();


    const revealable =
        voters.filter(
            voter =>
                currentEvictionVotes[
                    voter.id
                ] &&
                currentEvictionVotes[
                    voter.id
                ].type !==
                "no-vote"
        );


    const revealedIds =
        new Set(
            revealable
                .slice(
                    0,
                    currentVoteRevealIndex
                )
                .map(
                    voter =>
                        voter.id
                )
        );


    let html = `

        <h2>
            Eviction Vote Reveal
        </h2>

        <p>
            Revealed:
            ${Math.min(
                currentVoteRevealIndex,
                revealable.length
            )}
            /
            ${revealable.length}
            votes
        </p>

    `;


    voters.forEach(voter => {

        const vote =
            currentEvictionVotes[
                voter.id
            ];


        if (!vote) {
            return;
        }


        /*
           HOH / nominees don't vote.
        */

        if (
            vote.type ===
            "no-vote"
        ) {

            html += `
                <div class="vote-row">

                    <div class="vote-person">

                        ${getPlayerImageHTML(
                            voter,
                            ""
                        )}

                        <div>

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(voter)
                                )}
                            </strong>

                            <div>
                                Does Not Vote
                            </div>

                        </div>

                    </div>

                    <div class="vote-arrow">
                        —
                    </div>

                    <div>
                        ${
                            voter.id === currentHOH
                                ? "HOH"
                                : "Nominee"
                        }
                    </div>

                </div>
            `;

            return;
        }


        /*
           Hacker-nullified vote.
        */

        if (
            vote.type ===
            "nullified"
        ) {            currentTieBreaker =
                chooseEvictionTarget(
                    hoh
                );


            evictionVotePhase =
                "tie";


            addEvent(
                `The eviction vote is tied ${totals[nomineeA.id]}-${totals[nomineeB.id]}. ${getDisplayName(hoh)} must break the tie.`
            );


            renderTieBreaker();


            return;
        }

    }


    resolveEviction();
}


function calculateEvictionVoteTotals() {

    const totals = {};


    nominees.forEach(
        nominee => {
            totals[nominee.id] = 0;
        }
    );


    Object.values(
        currentEvictionVotes
    ).forEach(vote => {

        if (
            vote.type === "vote" &&
            vote.target
        ) {

            totals[vote.target] =
                (
                    totals[vote.target] ||
                    0
                ) + 1;

        }

    });


    return totals;
}


function renderEvictionVoteReveal() {

    const container =
        $("evictionResults");


    container.classList.remove(
        "hidden"
    );


    const voters =
        getActivePlayers();


    const revealable =
        voters.filter(
            voter =>
                currentEvictionVotes[
                    voter.id
                ] &&
                currentEvictionVotes[
                    voter.id
                ].type !==
                "no-vote"
        );


    const revealedIds =
        new Set(
            revealable
                .slice(
                    0,
                    currentVoteRevealIndex
                )
                .map(
                    voter =>
                        voter.id
                )
        );


    let html = `

        <h2>
            Eviction Vote Reveal
        </h2>

        <p>
            Revealed:
            ${Math.min(
                currentVoteRevealIndex,
                revealable.length
            )}
            /
            ${revealable.length}
            votes
        </p>

    `;


    voters.forEach(voter => {

        const vote =
            currentEvictionVotes[
                voter.id
            ];


        if (!vote) {
            return;
        }


        /*
           HOH / nominees don't vote.
        */

        if (
            vote.type ===
            "no-vote"
        ) {

            html += `
                <div class="vote-row">

                    <div class="vote-person">

                        ${getPlayerImageHTML(
                            voter,
                            ""
                        )}

                        <div>

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(voter)
                                )}
                            </strong>

                            <div>
                                Does Not Vote
                            </div>

                        </div>

                    </div>

                    <div class="vote-arrow">
                        —
                    </div>

                    <div>
                        ${
                            voter.id === currentHOH
                                ? "HOH"
                                : "Nominee"
                        }
                    </div>

                </div>
            `;

            return;
        }


        /*
           Hacker-nullified vote.
        */

        if (
            vote.type ===
            "nullified"
        ) {

            const isRevealed =
                revealedIds.has(
                    voter.id
                );


            html += `
                <div class="vote-row">

                    <div class="vote-person">

                        ${getPlayerImageHTML(
                            voter,
                            ""
                        )}

                        <div>

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(voter)
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="vote-arrow">
                        →
                    </div>


                    <div class="${
                        isRevealed
                            ? "vote-nullified"
                            : "vote-pending"
                    }">

                        ${
                            isRevealed
                                ? "VOTE NULLIFIED"
                                : "VOTE PENDING"
                        }

                    </div>

                </div>
            `;

            return;
        }


        /*
           Normal vote.
        */

        const isRevealed =
            revealedIds.has(
                voter.id
            );


        if (!isRevealed) {

            html += `
                <div class="vote-row">

                    <div class="vote-person">

                        ${getPlayerImageHTML(
                            voter,
                            ""
                        )}

                        <strong>
                            ${escapeHTML(
                                getDisplayName(voter)
                            )}
                        </strong>

                    </div>

                    <div class="vote-arrow">
                        →
                    </div>

                    <div class="vote-pending">
                        Vote Pending
                    </div>

                </div>
            `;

            return;
        }


        const target =
            houseguests.find(
                player =>
                    player.id ===
                    vote.target
            );


        html += `
            <div class="vote-row">

                <div class="vote-person">

                    ${getPlayerImageHTML(
                        voter,
                        ""
                    )}

                    <strong>
                        ${escapeHTML(
                            getDisplayName(voter)
                        )}
                    </strong>

                </div>


                <div class="vote-arrow">
                    →
                </div>


                <div class="vote-person">

                    ${
                        target
                            ? getPlayerImageHTML(
                                target,
                                ""
                              )
                            : ""
                    }

                    <strong>
                        ${
                            target
                                ? escapeHTML(
                                    getDisplayName(target)
                                  )
                                : "Unknown"
                        }
                    </strong>

                </div>

            </div>
        `;
    });


    container.innerHTML =
        html;
}


function renderTieBreaker() {

    const container =
        $("evictionResults");


    const hoh =
        houseguests.find(
            player =>
                player.id ===
                currentHOH
        );


    container.innerHTML += `

        <div class="evicted-result">

            <h2>
                TIE BREAKER
            </h2>

            <p>
                ${escapeHTML(
                    getDisplayName(hoh)
                )}
                has broken the tie.
            </p>

            <p>
                The deciding vote is:
            </p>

            <h2>

                ${escapeHTML(
                    getDisplayName(
                        currentTieBreaker
                    )
                )}
            </h2>

        </div>
    `;
}


/* =========================================================
   RESOLVE EVICTION
========================================================= */

function resolveEviction() {

    const totals =
        calculateEvictionVoteTotals();


    let evicted;


    if (
        currentTieBreaker
    ) {

        evicted =
            currentTieBreaker;

    } else {

        evicted =
            nominees
                .slice()
                .sort(
                    (a, b) =>
                        (
                            totals[b.id] || 0
                        ) -
                        (
                            totals[a.id] || 0
                        )
                )[0];
    }


    const result = {

        week: currentWeek,

        cycle: currentCycle,

        nominees:
            nominees.map(
                nominee =>
                    nominee.id
            ),

        votes:
            currentEvictionVotes,

        voteTotals:
            totals,

        tieBreaker:
            currentTieBreaker
                ? currentTieBreaker.id
                : null,

        evicted:
            evicted.id

    };


    evictionHistory.push(
        result
    );


    voteHistory.push(
        result
    );


    evicted.status =
        "Evicted";


    /*
       Remove them from active play.
    */

    /*
       Jury begins after seven evictions
       in a 16-player / 9-juror format.
    */

    const evictionNumber =
        evictedHouseguests.length + 1;


    evictedHouseguests.push(
        evicted
    );


    if (
        selectedSeasonTemplate ===
        "bb20" &&
        evictionNumber > 7
    ) {

        if (
            !jury.some(
                juror =>
                    juror.id ===
                    evicted.id
            )
        ) {

            jury.push(
                evicted
            );

        }

    }


    addEvent(
        `${getDisplayName(evicted)} was evicted by a vote of ${totals[nominees[0].id] || 0}-${totals[nominees[1].id] || 0}.`
    );


    displayFinalEvictionResult(
        result,
        evicted,
        totals
    );


    /*
       Bonus Life.

       This implementation automatically uses the power
       when available because there is no human choice
       prompt during the simulation.
    */

    const bonusHolder =
        getActivePlayers()
            .find(
                player =>
                    player.bonusLifeAvailable
            );


    if (
        bonusHolder &&
        evictionNumber <= 4
    ) {

        runBonusLife(
            bonusHolder,
            evicted
        );

        return;
    }


    /*
       Fourth eviction automatically receives
       the chance if the Bonus Life has not been used.
    */

    if (
        !bonusHolder &&
        evictionNumber === 4
    ) {

        /*
           No active holder means there is no
           available Bonus Life.
        */

    }


    /*
       Battle Back begins after the fourth jury
       member has been reached.
    */

    /*
       Battle Back begins after the fourth jury
       member has been reached.
    */

    if (
        jury.length === 4 &&
        !battleBackUsed
    ) {

        setStage(
            "battleback"
        );

        return;
    }


    advanceAfterEviction();
}


function runBonusLife(
    holder,
    evicted
) {

    if (!holder) {
        advanceAfterEviction();
        return;
    }


    if (
        !holder.bonusLifeAvailable
    ) {
        advanceAfterEviction();
        return;
    }


    holder.bonusLifeAvailable =
        false;


    holder.bonusLifeUsed =
        true;


    if (evicted) {

        evicted.status =
            "Safe";

        evicted.statusReason =
            "Saved by Bonus Life";

        evictedHouseguests =
            evictedHouseguests.filter(
                player =>
                    player.id !==
                    evicted.id
            );


        addEvent(
            `${getDisplayName(holder)} used the Bonus Life to save ${getDisplayName(evicted)}.`
        );


        displayMessage(
            `${getDisplayName(evicted)} has been saved by the Bonus Life!`
        );
    }


    advanceAfterEviction();
}


/* =========================================================
   ADVANCE AFTER EVICTION
========================================================= */

function advanceAfterEviction() {

    currentTieBreaker =
        null;

    currentEvictionVotes =
        {};

    currentVoteRevealIndex =
        0;

    evictionVotePhase =
        "idle";


    nominees =
        [];


    povWinner =
        null;


    povPlayers =
        [];


    hackerWinner =
        null;


    hackerVoteNullified =
        null;


    hackerSelectedVetoPlayer =
        null;


    /*
       Check for battle back.
    */

    if (
        jury.length === 4 &&
        !battleBackUsed
    ) {

        setStage(
            "battleback"
        );

        return;
    }


    /*
       End the game when only two players remain.
    */

    const activePlayers =
        getActivePlayers();


    if (
        activePlayers.length <= 2
    ) {

        setStage(
            "finalHOH1"
        );

        return;
    }


    /*
       Move to the next cycle.
    */

    setStage(
        "nextcycle"
    );
}


/* =========================================================
   BATTLE BACK
========================================================= */

function runBattleBack() {

    if (
        battleBackUsed
    ) {

        advanceAfterEviction();

        return;
    }


    battleBackUsed =
        true;


    const eligible =
        evictedHouseguests
            .filter(
                player =>
                    player.status ===
                    "Evicted"
            );


    if (
        eligible.length < 2
    ) {

        addEvent(
            "There are not enough eligible evicted Houseguests for the Battle Back."
        );

        advanceAfterEviction();

        return;
    }


    const contestants =
        eligible.slice(
            -4
        );


    addEvent(
        `The Battle Back begins with ${contestants.map(getDisplayName).join(", ")}.`
    );


    /*
       Each returning player competes.
       Higher competition stats improve their chances.
    */

    const winner =
        weightedRandomPlayer(
            contestants,
            player =>
                (
                    player.competition +
                    player.physical +
                    player.strategy
                )
        );


    if (!winner) {

        advanceAfterEviction();

        return;
    }


    winner.status =
        "Active";


    winner.statusReason =
        "Returned via Battle Back";


    evictedHouseguests =
        evictedHouseguests.filter(
            player =>
                player.id !==
                winner.id
        );


    if (
        jury.some(
            juror =>
                juror.id ===
                winner.id
        )
    ) {

        jury =
            jury.filter(
                juror =>
                    juror.id !==
                    winner.id
            );
    }


    addEvent(
        `${getDisplayName(winner)} won the Battle Back and returned to the game!`
    );


    displayMessage(
        `${getDisplayName(winner)} has returned to the game!`
    );


    setStage(
        "nextcycle"
    );
}


/* =========================================================
   NEXT CYCLE
========================================================= */

function startNextCycle() {

    currentWeek++;


    currentCycle =
        1;


    /*
       Reset week-specific variables.
    */

    currentHOH =
        null;


    nominees =
        [];


    povWinner =
        null;


    povPlayers =
        [];


    hackerWinner =
        null;


    hackerVoteNullified =
        null;


    hackerSelectedVetoPlayer =
        null;


    currentTieBreaker =
        null;


    currentEvictionVotes =
        {};


    currentVoteRevealIndex =
        0;


    evictionVotePhase =
        "idle";


    /*
       Check whether the season should end.
    */

    const activePlayers =
        getActivePlayers();


    if (
        activePlayers.length <= 2
    ) {

        setStage(
            "finalHOH1"
        );

        return;
    }


    /*
       Check for double eviction.
    */

    const weekData =
        getCurrentWeekData();


    if (
        weekData &&
        weekData.doubleEviction
    ) {

        currentCycle =
            1;

    }


    setStage(
        "hoh"
    );
}

function startNextCycle() {

    currentWeek++;


    currentCycle =
        1;


    /*
       Reset week-specific variables.
    */

    currentHOH =
        null;


    nominees =
        [];


    povWinner =
        null;


    povPlayers =
        [];


    hackerWinner =
        null;


    hackerVoteNullified =
        null;


    hackerSelectedVetoPlayer =
        null;


    currentTieBreaker =
        null;


    currentEvictionVotes =
        {};


    currentVoteRevealIndex =
        0;


    evictionVotePhase =
        "idle";


    /*
       Check whether the season should end.
    */

    const activePlayers =
        getActivePlayers();


    if (
        activePlayers.length <= 2
    ) {

        setStage(
            "finalHOH1"
        );

        return;
    }


    /*
       Check for double eviction.
    */

    const weekData =
        getCurrentWeekData();


    if (
        weekData &&
        weekData.doubleEviction
    ) {

        currentCycle =
            1;

    }


    setStage(
        "hoh"
    );
}


/* =========================================================
   FINAL HOH
========================================================= */

function runFinalHOHPart(
    part
) {

    const players =
        getActivePlayers();


    if (
        players.length <= 1
    ) {

        finaleWinner =
            players[0] || null;

        setStage(
            "finished"
        );

        return;
    }


    const competitionName =
        getFinalHOHCompetition(
            part
        );


    addEvent(
        `Final HOH Part ${part}: ${competitionName}`
    );


    const winner =
        weightedRandomPlayer(
            players,
            player =>
                (
                    player.competition * 2 +
                    player.physical +
                    player.strategy +
                    Math.random() * 25
                )
        );


    if (
        part === 1
    ) {

        finalHOH.part1 =
            winner;

        finalHOH.part2 =
            null;

        finalHOH.part3 =
            null;

        finalHOH.winner =
            null;


        if (
            winner
        ) {

            addEvent(
                `${getDisplayName(winner)} won Final HOH Part 1: ${competitionName}.`
            );

        }


        setStage(
            "finalHOH2"
        );

        return;
    }


    if (
        part === 2
    ) {

        finalHOH.part2 =
            winner;


        if (
            winner
        ) {

            addEvent(
                `${getDisplayName(winner)} won Final HOH Part 2: ${competitionName}.`
            );

        }


        setStage(
            "finalHOH3"
        );

        return;
    }


    if (
        part === 3
    ) {

        finalHOH.part3 =
            winner;


        finalHOH.winner =
            winner;


        if (
            winner
        ) {

            addEvent(
                `${getDisplayName(winner)} won Final HOH Part 3: ${competitionName}.`
            );

        }


        setStage(
            "finalEviction"
        );

        return;
    }
}


function runFinalEviction() {

    const players =
        getActivePlayers();


    if (
        players.length <= 1
    ) {

        finaleWinner =
            players[0] || null;

        setStage(
            "finished"
        );

        return;
    }


    let finalHOHWinner =
        finalHOH.winner;


    if (
        !finalHOHWinner ||
        !players.some(
            player =>
                player.id ===
                finalHOHWinner.id
        )
    ) {

        finalHOHWinner =
            players[0];
    }


    const nonHOHPlayers =
        players.filter(
            player =>
                player.id !==
                finalHOHWinner.id
        );


    if (
        nonHOHPlayers.length === 0
    ) {

        finaleWinner =
            finalHOHWinner;

        setStage(
            "finished"
        );

        return;
    }


    const evicted =
        weightedRandomPlayer(
            nonHOHPlayers,
            player =>
                (
                    player.strategy +
                    player.social +
                    player.physical +
                    Math.random() * 20
                )
        );


    evicted.status =
        "Evicted";


    evicted.statusReason =
        "Final Eviction";


    evictedHouseguests.push(
        evicted
    );


    addEvent(
        `${getDisplayName(evicted)} was evicted at the Final HOH ceremony.`
    );


    setStage(
        "juryVote"
    );
}


function runJuryVote() {

    const finalists =
        getActivePlayers();


    if (
        finalists.length === 0
    ) {

        setStage(
            "finished"
        );

        return;
    }


    if (
        finalists.length === 1
    ) {

        finaleWinner =
            finalists[0];

        setStage(
            "finished"
        );

        return;
    }


    const votes = {};


    finalists.forEach(
        finalist => {
            votes[finalist.id] = 0;
        }
    );


    jury.forEach(
        juror => {

            const winner =
                weightedRandomPlayer(
                    finalists,
                    finalist => {

                        let score =
                            finalist.social +
                            finalist.strategy +
                            finalist.physical;


                        const relationship =
                            getRelationshipScore(
                                juror.id,
                                finalist.id
                            );


                        score +=
                            relationship * 2;


                        return Math.max(
                            1,
                            score
                        );
                    }
                );


            if (
                winner
            ) {

                votes[
                    winner.id
                ]++;

                addEvent(
                    `${getDisplayName(juror)} voted for ${getDisplayName(winner)} to win.`
                );
            }

        }
    );


    let winner =
        finalists
            .slice()
            .sort(
                (a, b) =>
                    votes[b.id] -
                    votes[a.id]
            )[0];


    finaleWinner =
        winner;


    finalists.forEach(
        finalist => {

            finalist.finalVotes =
                votes[finalist.id] || 0;

        }
    );


    addEvent(
        `${getDisplayName(winner)} wins the season by a vote of ${votes[winner.id]}-${finalists.filter(p => p.id !== winner.id).map(p => votes[p.id]).join("-")}.`
    );


    setStage(
        "finished"
    );
}function startNextCycle() {

    currentWeek++;


    currentCycle =
        1;


    /*
       Reset week-specific variables.
    */

    currentHOH =
        null;


    nominees =
        [];


    povWinner =
        null;


    povPlayers =
        [];


    hackerWinner =
        null;


    hackerVoteNullified =
        null;


    hackerSelectedVetoPlayer =
        null;


    currentTieBreaker =
        null;


    currentEvictionVotes =
        {};


    currentVoteRevealIndex =
        0;


    evictionVotePhase =
        "idle";


    /*
       Check whether the season should end.
    */

    const activePlayers =
        getActivePlayers();


    if (
        activePlayers.length <= 2
    ) {

        setStage(
            "finalHOH1"
        );

        return;
    }


    /*
       Check for double eviction.
    */

    const weekData =
        getCurrentWeekData();


    if (
        weekData &&
        weekData.doubleEviction
    ) {

        currentCycle =
            1;

    }


    setStage(
        "hoh"
    );
}


/* =========================================================
   FINAL HOH
========================================================= */

function runFinalHOHPart(
    part
) {

    const players =
        getActivePlayers();


    if (
        players.length <= 1
    ) {

        finaleWinner =
            players[0] || null;

        setStage(
            "finished"
        );

        return;
    }


    const competitionName =
        getFinalHOHCompetition(
            part
        );


    addEvent(
        `Final HOH Part ${part}: ${competitionName}`
    );


    const winner =
        weightedRandomPlayer(
            players,
            player =>
                (
                    player.competition * 2 +
                    player.physical +
                    player.strategy +
                    Math.random() * 25
                )
        );


    if (
        part === 1
    ) {

        finalHOH.part1 =
            winner;

        finalHOH.part2 =
            null;

        finalHOH.part3 =
            null;

        finalHOH.winner =
            null;


        if (
            winner
        ) {

            addEvent(
                `${getDisplayName(winner)} won Final HOH Part 1: ${competitionName}.`
            );

        }


        setStage(
            "finalHOH2"
        );

        return;
    }


    if (
        part === 2
    ) {

        finalHOH.part2 =
            winner;


        if (
            winner
        ) {

            addEvent(
                `${getDisplayName(winner)} won Final HOH Part 2: ${competitionName}.`
            );

        }


        setStage(
            "finalHOH3"
        );

        return;
    }


    if (
        part === 3
    ) {

        finalHOH.part3 =
            winner;


        finalHOH.winner =
            winner;


        if (
            winner
        ) {

            addEvent(
                `${getDisplayName(winner)} won Final HOH Part 3: ${competitionName}.`
            );

        }


        setStage(
            "finalEviction"
        );

        return;
    }
}


function runFinalEviction() {

    const players =
        getActivePlayers();


    if (
        players.length <= 1
    ) {

        finaleWinner =
            players[0] || null;

        setStage(
            "finished"
        );

        return;
    }


    let finalHOHWinner =
        finalHOH.winner;


    if (
        !finalHOHWinner ||
        !players.some(
            player =>
                player.id ===
                finalHOHWinner.id
        )
    ) {

        finalHOHWinner =
            players[0];
    }


    const nonHOHPlayers =
        players.filter(
            player =>
                player.id !==
                finalHOHWinner.id
        );


    if (
        nonHOHPlayers.length === 0
    ) {

        finaleWinner =
            finalHOHWinner;

        setStage(
            "finished"
        );

        return;
    }


    const evicted =
        weightedRandomPlayer(
            nonHOHPlayers,
            player =>
                (
                    player.strategy +
                    player.social +
                    player.physical +
                    Math.random() * 20
                )
        );


    evicted.status =
        "Evicted";


    evicted.statusReason =
        "Final Eviction";


    evictedHouseguests.push(
        evicted
    );


    addEvent(
        `${getDisplayName(evicted)} was evicted at the Final HOH ceremony.`
    );


    setStage(
        "juryVote"
    );
}


function runJuryVote() {

    const finalists =
        getActivePlayers();


    if (
        finalists.length === 0
    ) {

        setStage(
            "finished"
        );

        return;
    }


    if (
        finalists.length === 1
    ) {

        finaleWinner =
            finalists[0];

        setStage(
            "finished"
        );

        return;
    }


    const votes = {};


    finalists.forEach(
        finalist => {
            votes[finalist.id] = 0;
        }
    );


    jury.forEach(
        juror => {

            const winner =
                weightedRandomPlayer(
                    finalists,
                    finalist => {

                        let score =
                            finalist.social +
                            finalist.strategy +
                            finalist.physical;


                        const relationship =
                            getRelationshipScore(
                                juror.id,
                                finalist.id
                            );


                        score +=
                            relationship * 2;


                        return Math.max(
                            1,
                            score
                        );
                    }
                );


            if (
                winner
            ) {

                votes[
                    winner.id
                ]++;

                addEvent(
                    `${getDisplayName(juror)} voted for ${getDisplayName(winner)} to win.`
                );
            }

        }
    );


    let winner =
        finalists
            .slice()
            .sort(
                (a, b) =>
                    votes[b.id] -
                    votes[a.id]
            )[0];


    finaleWinner =
        winner;


    finalists.forEach(
        finalist => {

            finalist.finalVotes =
                votes[finalist.id] || 0;

        }
    );


    addEvent(
        `${getDisplayName(winner)} wins the season by a vote of ${votes[winner.id]}-${finalists.filter(p => p.id !== winner.id).map(p => votes[p.id]).join("-")}.`
    );


    setStage(
        "finished"
    );
}

    if (
        selectedSeasonTemplate ===
        "bb20" &&
        jury.length === 4 &&
        !battleBackUsed
    ) {

        setStage("battleback");

        return;
    }


    setStage("nextcycle");
}


function displayFinalEvictionResult(
    result,
    evicted,
    totals
) {

    const container =
        $("evictionResults");


    container.classList.remove(
        "hidden"
    );


    container.innerHTML = `

        <h2>
            Final Eviction Result
        </h2>


        <div class="vote-totals">

            ${nominees
                .map(nominee => `

                    <div class="vote-total-card">

                        <div>
                            ${escapeHTML(
                                getDisplayName(
                                    nominee
                                )
                            )}
                        </div>

                        <div class="vote-total-number">
                            ${
                                totals[
                                    nominee.id
                                ] || 0
                            }
                        </div>

                        <div>
                            Votes
                        </div>

                    </div>

                `)
                .join("")}

        </div>


        <div class="evicted-result">

            ${getPlayerImageHTML(
                evicted,
                ""
            )}

            <h2>
                ${escapeHTML(
                    getDisplayName(evicted)
                )}
                has been evicted.
            </h2>

            <p>
                ${escapeHTML(
                    getFullName(evicted)
                )}
            </p>

        </div>

    `;
}



/* =========================================================
   BONUS LIFE
========================================================= */

function runBonusLife(
    holder,
    evicted
) {

    holder.bonusLifeAvailable =
        false;


    addEvent(
        `${getDisplayName(holder)} used the Bonus Life on ${getDisplayName(evicted)}.`
    );


    const competitors =
        getActivePlayers()
            .slice()
            .sort(
                () =>
                    Math.random() -
                    0.5
            )
            .slice(
                0,
                Math.min(
                    3,
                    getActivePlayers().length
                )
            );


    competitors.push(
        evicted
    );


    const winner =
        competitionWinner(
            competitors,
            "Bonus Life Competition"
        );


    if (
        winner.id ===
        evicted.id
    ) {

        evicted.status =
            "Active";


        evictedHouseguests =
            evictedHouseguests.filter(
                player =>
                    player.id !==
                    evicted.id
            );


        jury =
            jury.filter(
                player =>
                    player.id !==
                    evicted.id
            );


        addEvent(
            `${getDisplayName(evicted)} won the Bonus Life competition and returned to the game!`
        );

    } else {

        addEvent(
            `${getDisplayName(evicted)} lost the Bonus Life competition and remains evicted.`
        );

    }


    setStage("nextcycle");
}


/* =========================================================
   BATTLE BACK
========================================================= */

function runBattleBack() {

    if (battleBackUsed) {

    };


    addEvent(
        "The Final 3 phase has begun."
    );


    setStage("finalHOH1");
}



/* =========================================================
   FINAL HOH
========================================================= */

function runFinalHOHPart(part) {

    const finalists =
        getActivePlayers();


    let competition;


    if (typeof BB20 !== "undefined") {

        const finalData =
            BB20.competitions[13];


        competition =
            finalData.finalHOH[
                part - 1
            ];

    } else {

        competition =
            [
                "Jetpack Attack",
                "Mount Evictus",
                "Jury Oddcasts"
            ][part - 1];

    }


    let players =
        finalists;


    /*
       Part 2 should normally consist of
       the Part 1 loser + third player.
    */

    if (
        part === 2 &&
        finalHOH.part1
    ) {

        players =
            finalists.filter(
                player =>
                    player.id !==
                    finalHOH.part1.id
            );

    }


    if (
        part === 3 &&
        finalHOH.part1 &&
        finalHOH.part2
    ) {

        players = [

            finalHOH.part1,

            finalHOH.part2

        ];

    }


    const winner =
        competitionWinner(
            players,
            competition
        );


    finalHOH[
        `part${part}`
    ] = winner;


    addEvent(
        `${getDisplayName(winner)} won Final HOH Part ${part}: ${competition}.`
    );


    if (part === 1) {

        setStage("finalHOH2");

        return;
    }


    if (part === 2) {

        setStage("finalHOH3");

        return;
    }


    finalHOH.winner =
        winner;


    setStage("finalEviction");
}



/* =========================================================
   FINAL 3 EVICTION
========================================================= */

function runFinalEviction() {

    const finalists =
        getActivePlayers();


    if (
        finalists.length !== 3
    ) {

        showFinale();

        return;
    }


    const hoh =
        finalHOH.winner;


    const options =
        finalists.filter(
            player =>
                player.id !==
                hoh.id
        );


    const evicted =
        weightedRandomPlayer(
            options,
            player =>
                player.strategy * 2 +
                player.social +
                Math.random() * 20
        );


    evicted.status =
        "Evicted";


    evictedHouseguests.push(
        evicted
    );


    if (
        !jury.some(
            juror =>
                juror.id ===
                evicted.id
        )
    ) {

        jury.push(
            evicted
        );

    }


    addEvent(
        `${getDisplayName(hoh)} evicted ${getDisplayName(evicted)} from the Final 3.`

    );


    setStage("juryVote");
}


/* =========================================================
   JURY VOTE
========================================================= */

let finaleVotes = {};
let finaleVoteRevealIndex = 0;


function prepareJuryVotes() {

    const finalists =
        getActivePlayers();


    finaleVotes = {};


    finalists.forEach(
        finalist => {
            finaleVotes[
                finalist.id
            ] = 0;
        }
    );


    jury.forEach(juror => {

        const winner =
            chooseJuryVote(
                juror,
                finalists
            );


        finaleVotes[
            winner.id
        ]++;

    });


    finaleVoteRevealIndex = 0;
}


function chooseJuryVote(
    juror,
    finalists
) {

    return weightedRandomPlayer(
        finalists,
        finalist => {

            let score =
                finalist.strategy * 2 +
                finalist.social * 2 +
                Math.random() * 30;


            const relationship =
                getRelationshipScore(
                    juror.id,
                    finalist.id
                );


            score +=
                relationship;


            if (
                areAllied(
                    juror,
                    finalist
                )
            ) {

                score += 30;

            }


            return Math.max(
                1,
                score
            );

        }
    );
}


function revealNextJuryVote() {

    if (
        !Object.keys(finaleVotes).length
    ) {

        prepareJuryVotes();

    }


    if (
        finaleVoteRevealIndex <
        jury.length
    ) {

        finaleVoteRevealIndex++;

        renderFinaleJuryVoteReveal();

        return;
    }


    const winner =
        Object.entries(
            finaleVotes
        )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];


    finaleWinner =
        houseguests.find(
            player =>
                player.id ===
                winner[0]
        );


    addEvent(
        `${getDisplayName(finaleWinner)} won the season with ${winner[1]} jury votes.`
    );


    setStage("finished");

    showFinale();
}


function renderFinaleJuryVoteReveal() {

    const container =
        $("finaleContent");


    let html = `

        <div class="panel">

            <h2>
                Final Jury Vote
            </h2>

            <p>
                Jury votes revealed:
                ${finaleVoteRevealIndex}
                /
                ${jury.length}
            </p>

        </div>

    `;


    jury
        .slice(
            0,
            finaleVoteRevealIndex
        )
        .forEach(
            (juror, index) => {

                const finalists =
                    getActivePlayers();


                const winner =
                    chooseJuryVote(
                        juror,
                        finalists
                    );

                const finalists =
                    getActivePlayers();


                const winner =
                    chooseJuryVote(
                        juror,
                        finalists
                    );


                html += `

                    <div class="jury-vote-row">

                        <div class="vote-person">

                            ${getPlayerImageHTML(
                                juror,
                                ""
                            )}

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(juror)
                                )}
                            </strong>

                        </div>


                        <div class="vote-arrow">
                            →
                        </div>


                        <div class="vote-person">

                            ${getPlayerImageHTML(
                                winner,
                                ""
                            )}

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(winner)
                                )}
                            </strong>

                        </div>

                    </div>

                `;
            }
        );


    container.innerHTML =
        html;
}


/* =========================================================
   FINALE DISPLAY
========================================================= */

function showFinale() {

    const container =
        $("finaleContent");


    container.classList.remove(
        "hidden"
    );


    const finalists =
        getActivePlayers();


    const winner =
        finaleWinner ||
        finalists
            .slice()
            .sort(
                (a, b) =>
                    (
                        b.social +
                        b.strategy
                    ) -
                    (
                        a.social +
                        a.strategy
                    )
            )[0];


    finaleWinner =
        winner;


    const runnerUps =
        finalists.filter(
            player =>
                player.id !==
                winner.id
        );


    let html = `

        <div class="finale-header">

            <h1>
                ${escapeHTML(
                    getDisplayName(winner)
                )}
                Wins Big Brother!
            </h1>


            <div class="finale-winner">

                ${getPlayerImageHTML(
                    winner,
                    "finale-winner-image"
                )}

                <h2>
                    ${escapeHTML(
                        getFullName(winner)
                    )}
                </h2>

            </div>

        </div>


        <div class="panel">

            <h2>
                Finalists
            </h2>

            <div class="finalists-grid">

    `;


    finalists.forEach(
        finalist => {

            html += `

                <div class="finalist-card">

                    ${getPlayerImageHTML(
                        finalist,
                        ""
                    )}

                    <h3>
                        ${escapeHTML(
                            getDisplayName(finalist)
                        )}
                    </h3>

                    <p>
                        ${
                            finalist.id ===
                            winner.id
                                ? "WINNER"
                                : "FINALIST"
                        }
                    </p>

                </div>

            `;

        }
    );


    html += `

            </div>

        </div>


        <div class="panel">

            <h2>
                Jury Vote
            </h2>

            <div class="jury-results">

    `;


    const juryTotals =
        {};


    finalists.forEach(
        finalist => {

            juryTotals[
                finalist.id
            ] =
                finaleVotes[
                    finalist.id
                ] || 0;

        }
    );


    finalists
        .slice()
        .sort(
            (a, b) =>
                (
                    juryTotals[b.id] || 0
                ) -
                (
                    juryTotals[a.id] || 0
                )
        )
        .forEach(
            finalist => {

                html += `

                    <div class="jury-result-card">

                        ${getPlayerImageHTML(
                            finalist,
                            ""
                        )}

                        <div>

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(
                                        finalist
                                    )
                                )}
                            </strong>

                            <div>
                                ${
                                    juryTotals[
                                        finalist.id
                                    ] || 0
                                }
                                Jury Votes
                            </div>

                        </div>

                    </div>

                `;

            }
        );


    html += `

            </div>

        </div>


        <div class="panel">

            <h2>
                Season Summary
            </h2>

            <div class="season-summary">

                <div>
                    <strong>
                        Season
                    </strong>

                    <span>
                        ${escapeHTML(
                            getSeasonName()
                        )}
                    </span>
                </div>


                <div>
                    <strong>
                        Winner
                    </strong>

                    <span>
                        ${escapeHTML(
                            getDisplayName(winner)
                        )}
                    </span>
                </div>


                <div>
                    <strong>
                        Finalists
                    </strong>

                    <span>
                        ${finalists.length}
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

            </div>

        </div>


        <div class="panel">

            <h2>
                Eviction History
            </h2>

            <div class="eviction-history">

    `;


    evictionHistory.forEach(
        (eviction, index) => {

            const evictedPlayer =
                houseguests.find(
                    player =>
                        player.id ===
                        eviction.evicted
                );


            html += `

                <div class="history-row">

                    <div class="history-week">
                        Week
                        ${eviction.week}
                    </div>


                    <div class="history-player">

                        ${
                            evictedPlayer
                                ? getPlayerImageHTML(
                                    evictedPlayer,
                                    ""
                                  )
                                : ""
                        }

                        <strong>
                            ${
                                evictedPlayer
                                    ? escapeHTML(
                                        getDisplayName(
                                            evictedPlayer
                                        )
                                      )
                                    : "Unknown"
                            }
                        </strong>

                    </div>

                </div>

            `;

        }
    );


    html += `

            </div>

        </div>

    `;


    container.innerHTML =
        html;


    const proceedButton =
        $("proceedButton");


    if (proceedButton) {

        proceedButton.textContent =
            "SEASON COMPLETE";

        proceedButton.disabled =
            true;

    }


    const skipEndButton =
        $("skipEndButton");


    if (skipEndButton) {

        skipEndButton.textContent =
            "SEASON COMPLETE";

        skipEndButton.disabled =
            true;

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

                html += `

                    <div class="vote-row">

                        <div class="vote-person">

                            ${getPlayerImageHTML(
                                juror,
                                ""
                            )}

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(
                                        juror
                                    )
                                )}
                            </strong>

                        </div>

                        <div class="vote-arrow">
                            →
                        </div>

                        <div class="vote-person">

                            ${getPlayerImageHTML(
                                winner,
                                ""
                            )}

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(
                                        winner
                                    )
                                )}
                            </strong>

                        </div>

                    </div>

                `;
            }
        );


    container.innerHTML =
        html;
}


/* =========================================================
   FINALE DISPLAY
========================================================= */

function showFinale() {

    showSection("finale");


    const finalists =
        getActivePlayers();


    if (!finaleWinner) {

        $("finaleContent").innerHTML = `

            <div class="panel">

                <h2>
                    Finalists
                </h2>

                <div class="finalist-grid">

                    ${finalists
                        .map(player => `

                            <div class="finalist-card">

                                ${getPlayerImageHTML(
                                    player,
                                    ""
                                )}

                                <div class="finalist-card-info">

                                    <h2>
                                        ${escapeHTML(
                                            getDisplayName(
                                                player
                                            )
                                        )}
                                    </h2>

                                    <p>
                                        ${escapeHTML(
                                            getFullName(
                                                player
                                            )
                                        )}
                                    </p>

                                </div>

                            </div>

                        `)
                        .join("")}

                </div>

            </div>

        `;

        return;
    }


    $("finaleContent").innerHTML = `

        <div class="hero-panel">

            <h1>
                WINNER
            </h1>


            ${getPlayerImageHTML(
                finaleWinner,
                ""
            )}


            <h2>
                ${escapeHTML(
                    getDisplayName(
                        finaleWinner
                    )
                )}
            </h2>


            <p>
                ${escapeHTML(
                    getFullName(
                        finaleWinner
                    )
                )}
            </p>

        </div>

    `;
}



/* =========================================================
   MEMORY WALL
========================================================= */

function renderMemoryWall() {

    normalizeAllHouseguests();


    $("memoryWall").innerHTML =
        houseguests
            .map(player => {

                const active =
                    player.status ===
                    "Active";


                return `

                    <div class="
                        memory-card
                        ${
                            active
                                ? ""
                                : "evicted-memory-card"
                        }
                    ">

                        ${getPlayerImageHTML(
                            player,
                            "player-photo"
                        )}

                        ${
                            active
                                ? ""
                                : `
                                    <div class="evicted-overlay">
                                        EVICTED
                                    </div>
                                  `
                        }


                        <div class="memory-name">

                            ${escapeHTML(
                                getDisplayName(
                                    player
                                )
                            )}

                            <span class="memory-full-name">

                                ${escapeHTML(
                                    getFullName(
                                        player
                                    )
                                )}

                            </span>

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

    $("juryList").innerHTML =
        jury.length
            ? jury
                .map(renderJuryCard)
                .join("")
            : `<p>No jury members yet.</p>`;


    $("evictedPlayers").innerHTML =
        evictedHouseguests.length
            ? evictedHouseguests
                .map(renderJuryCard)
                .join("")
            : `<p>No evicted Houseguests yet.</p>`;
}


function renderJuryCard(player) {

    return `

        <div class="jury-card">

            ${getPlayerImageHTML(
                player,
                ""
            )}

            <div class="jury-card-info">

                <div class="jury-name">

                    ${escapeHTML(
                        getDisplayName(
                            player
                        )
                    )}

                </div>

                <div class="jury-full-name">

                    ${escapeHTML(
                        getFullName(
                            player
                        )
                    )}

                </div>

            </div>

        </div>

    `;
}



/* =========================================================
   GAME DISPLAY
========================================================= */

function updateGameDisplay() {

    $("weekBadge").textContent =
        currentWeek <= 13
            ? `WEEK ${currentWeek}`
            : "FINALE";


    $("weekTitle").textContent =
        currentWeek <= 13
            ? `Week ${currentWeek}`
            : "Finale";


    const hoh =
        houseguests.find(
            player =>
                player.id ===
                currentHOH
        );


    $("hohStatus").innerHTML =
        hoh
            ? `
                <strong>
                    ${escapeHTML(
                        getDisplayName(hoh)
                    )}
                </strong>
              `
            : "None";


    $("nomineesStatus").innerHTML =
        nominees.length
            ? nominees
                .map(
                    nominee =>
                        escapeHTML(
                            getDisplayName(
                                nominee
                            )
                        )
                )
                .join(" vs. ")
            : "None";


    $("povStatus").innerHTML =
        povWinner
            ? escapeHTML(
                getDisplayName(
                    povWinner
                )
            )
            : "None";


    const weekData =
        getCurrentWeekData();


    if (
        weekData &&
        weekData.doubleEviction
    ) {

        $("formatStatus").textContent =
            currentCycle === 2
                ? "DOUBLE EVICTION — ROUND 2"
                : "DOUBLE EVICTION";

    } else {

        $("formatStatus").textContent =
            "Normal Week";

    }


    renderGameHouseguests();
}


function renderGameHouseguests() {

    const active =
        getActivePlayers();

function renderGameHouseguests() {

    const active =
        getActivePlayers();


    $("gameHouseguestGrid").innerHTML =
        active
            .map(player => `

                <div class="game-houseguest-card">

                    ${getPlayerImageHTML(
                        player,
                        "game-houseguest-photo"
                    )}

                    <div class="game-houseguest-name">

                        ${escapeHTML(
                            getDisplayName(
                                player
                            )
                        )}

                    </div>

                    <div class="game-houseguest-status">

                        ${escapeHTML(
                            player.status ||
                            "Active"
                        )}

                    </div>

                </div>

            `)
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


    container.innerHTML =
        eventLog
            .map(
                event => `

                    <div class="event-item">

                        <div class="event-week">
                            ${escapeHTML(
                                event.week ||
                                ""
                            )}
                        </div>

                        <div class="event-text">
                            ${escapeHTML(
                                event.text ||
                                ""
                            )}
                        </div>

                    </div>

                `
            )
            .join("");
}


/* =========================================================
   SEASON HISTORY
========================================================= */

function renderSeasonHistory() {

    const container =
        $("seasonHistory");


    if (!container) {
        return;
    }


    if (
        !evictionHistory.length
    ) {

        container.innerHTML =
            `<p>No eviction history yet.</p>`;

        return;
    }


    container.innerHTML =
        evictionHistory
            .map(
                (eviction, index) => {

                    const evicted =
                        houseguests.find(
                            player =>
                                player.id ===
                                eviction.evicted
                        );


                    return `

                        <div class="history-card">

                            <div class="history-number">

                                ${index + 1}

                            </div>


                            <div class="history-info">

                                <strong>
                                    ${
                                        evicted
                                            ? escapeHTML(
                                                getDisplayName(
                                                    evicted
                                                )
                                              )
                                            : "Unknown"
                                    }
                                </strong>

                                <span>
                                    Week
                                    ${eviction.week}
                                </span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");
}


/* =========================================================
   STAGE DISPLAY
========================================================= */

function setStage(stage) {

    currentStage =
        stage;


    updateStageDisplay();


    updateProceedButton();


    updateGameDisplay();
}


function updateStageDisplay() {

    const stageElement =
        $("stageStatus");


    if (!stageElement) {
        return;
    }


    const labels = {

        idle:
            "Ready to Begin",

        openingSafety:
            "Opening Safety",

        hoh:
            "Head of Household",

        nominations:
            "Nominations",

        hacker:
            "Hacker Competition",

        povDraw:
            "Veto Player Draw",

        pov:
            "Power of Veto",

        vetoCeremony:
            "Veto Ceremony",

        evictionVoting:
            "Eviction Voting",

        eviction:
            "Eviction",

        battleback:
            "Battle Back",

        nextcycle:
            "Next Cycle",

        finalHOH1:
            "Final HOH — Part 1",

        finalHOH2:
            "Final HOH — Part 2",

        finalHOH3:
            "Final HOH — Part 3",

        finalEviction:
            "Final 3 Eviction",

        juryVote:
            "Jury Vote",

        finished:
            "Season Complete"

    };


    stageElement.textContent =
        labels[
            currentStage
        ] ||
        currentStage;
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


    if (
        currentStage ===
        "finished"
    ) {

        button.textContent =
            "SEASON COMPLETE";

        button.disabled =
            true;

        return;
    }


    button.disabled =
        !seasonStarted;


    const labels = {

        idle:
            "START SEASON",

        openingSafety:
            "CONTINUE",

        hoh:
            "RUN HOH",

        nominations:
            "MAKE NOMINATIONS",

        hacker:
            "RUN HACKER",

        povDraw:
            "DRAW VETO PLAYERS",

        pov:
            "RUN POV",

        vetoCeremony:
            "HOLD VETO CEREMONY",

        evictionVoting:
            "CAST EVICTION VOTES",

        eviction:
            "REVEAL EVICTION VOTE",

        battleback:
            "RUN BATTLE BACK",

        nextcycle:
            "CONTINUE",

        finalHOH1:
            "RUN FINAL HOH PART 1",

        finalHOH2:
            "RUN FINAL HOH PART 2",

        finalHOH3:
            "RUN FINAL HOH PART 3",

        finalEviction:
            "FINAL EVICTION",

        juryVote:
            "REVEAL JURY VOTE"

    };


    button.textContent =
        labels[
            currentStage
        ] ||
        "PROCEED";
}


/* =========================================================
   RESET SIMULATION
========================================================= */

function resetSimulation() {

    const confirmed =
        confirm(
            "Are you sure you want to reset the current simulation?"
        );


    if (!confirmed) {
        return;
    }


    houseguests =
        houseguests.map(
            player => ({
                ...player,
                status: "Active"
            })
        );


    evictedHouseguests =
        [];

    jury =
        [];

    alliances =
        [];

    relationships =
        [];

    currentWeek =
        1;

    currentCycle =
        1;

    currentHOH =
        null;

    nominees =
        [];

    povWinner =
        null;

    povPlayers =
        [];

    hackerWinner =
        null;

    hackerVoteNullified =
        null;

    hackerSelectedVetoPlayer =
        null;

    evictionHistory =
        [];

    voteHistory =
        [];

    currentEvictionVotes =
        {};

    currentTieBreaker =
        null;

    currentVoteRevealIndex =
        0;

    finaleVotes =
        {};

    finaleVoteRevealIndex =
        0;

    battleBackUsed =
        false;

    openingSafety =
        {
            completed: false,
            protectedIds: []
        };

    finalHOH =
        {
            part1: null,
            part2: null,
            part3: null,
            winner: null
        };

    finaleWinner =
        null;

    seasonStarted =
        false;

    currentStage =
        "idle";


    eventLog =
        [];


    renderAll();

    updateStageDisplay();

    updateProceedButton();
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    renderCast();

    renderMemoryWall();

    renderJury();

    renderGameHouseguests();

    renderEventLog();

    renderSeasonHistory();

    updateGameDisplay();

    updateStageDisplay();

    updateProceedButton();
}

    const weighted =
        players.map(player => {

            const weight =
                Math.max(
                    0.01,
                    Number(
                        weightFunction(
                            player
                        )
                    ) || 0.01
                );


            return {
                player,
                weight
            };

        });


    const total =
        weighted.reduce(
            (sum, item) =>
                sum + item.weight,
            0
        );


    let random =
        Math.random() *
        total;


    for (
        const item of weighted
    ) {

        random -=
            item.weight;


        if (random <= 0) {
            return item.player;
        }

    }


    return weighted[
        weighted.length - 1
    ].player;
}



/* =========================================================
   SAVE / LOAD
========================================================= */

function getSaveData() {

    return {

        houseguests,

        evictedHouseguests,

        jury,

        alliances,

        relationships,

        customTwists,

        currentWeek,

        currentCycle,

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

        finalHOH,

        finaleWinner,

        gameEvents:
            window.gameEvents || []

    };
}


function saveGame() {

    localStorage.setItem(
        "bigBrotherSimulatorSave",
        JSON.stringify(
            getSaveData()
        )
    );


    alert(
        "Season saved successfully."
    );
}


function saveGameSilently() {

    localStorage.setItem(
        "bigBrotherSimulatorSave",
        JSON.stringify(
            getSaveData()
        )
    );
}


function loadGame() {

    const saved =
        localStorage.getItem(
            "bigBrotherSimulatorSave"
        );


    if (!saved) {

        alert(
            "No saved season found."
        );

        return;
    }


    try {

        const data =
            JSON.parse(saved);


        houseguests =
            data.houseguests || [];

        houseguests =
            houseguests.map(
                normalizeHouseguest
            );


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

        data.customTwists || [];


        currentWeek =
            data.currentWeek || 1;


        currentCycle =
            data.currentCycle || 1;


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
            "idle";


        evictionHistory =
            data.evictionHistory || [];


        voteHistory =
            data.voteHistory || [];


        appStoreRecipients =
            data.appStoreRecipients || [];


        appStoreHistory =
            data.appStoreHistory || [];


        battleBackUsed =
            data.battleBackUsed ||
            false;


        openingSafety =
            data.openingSafety || {
                completed: false,
                protectedIds: []
            };


        finalHOH =
            data.finalHOH || {
                part1: null,
                part2: null,
                part3: null,
                winner: null
            };


        finaleWinner =
            data.finaleWinner || null;


        window.gameEvents =
            data.gameEvents || [];


        if (
            typeof normalizeAllHouseguests ===
            "function"
        ) {

            normalizeAllHouseguests();

        }


        renderAll();


        alert(
            "Season loaded successfully."
        );


    } catch (error) {

        console.error(
            "Load error:",
            error
        );


        alert(
            "Unable to load the saved season."
        );

    }
}


/* =========================================================
   EXPORT / IMPORT
========================================================= */

function exportSeason() {

    const data =
        getSaveData();


    const json =
        JSON.stringify(
            data,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const anchor =
        document.createElement(
            "a"
        );


    anchor.href =
        url;


    anchor.download =
        "big-brother-season.json";


    document.body.appendChild(
        anchor
    );


    anchor.click();


    anchor.remove();


    URL.revokeObjectURL(
        url
    );
}


function importSeasonFile() {

    const input =
        document.createElement(
            "input"
        );


    input.type =
        "file";


    input.accept =
        ".json,application/json";


    input.addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                function() {

                    try {

                        const data =
                            JSON.parse(
                                reader.result
                            );


                        localStorage.setItem(
                            "bigBrotherSimulatorSave",
                            JSON.stringify(
                                data
                            )
                        );


                        loadGame();


                    } catch (error) {

                        console.error(
                            "Import error:",
                            error
                        );


                        alert(
                            "The selected file is not a valid Big Brother season file."
                        );

                    }

                };


            reader.readAsText(
                file
            );

        }
    );


    input.click();
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        normalizeAllHouseguests();


        renderAll();


        showSection(
            "home"
        );


        updateSeasonTemplateUI();


        loadAppStore();


        loadGameSilently();


        renderAll();

    }
);

        currentWeek =
            data.currentWeek || 1;

        currentCycle =
            data.currentCycle || 1;

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
            data.hackerVoteNullified ||
            null;

        hackerSelectedVetoPlayer =
            data.hackerSelectedVetoPlayer ||
            null;

        seasonStarted =
            Boolean(
                data.seasonStarted
            );

        selectedSeasonTemplate =
            data.selectedSeasonTemplate ||
            "bb20";

        currentStage =
            data.currentStage ||
            "idle";

        evictionHistory =
            data.evictionHistory || [];

        voteHistory =
            data.voteHistory || [];

        appStoreRecipients =
            data.appStoreRecipients || [];

        appStoreHistory =
            data.appStoreHistory || [];

        battleBackUsed =
            Boolean(
                data.battleBackUsed
            );

        openingSafety =
            data.openingSafety || {
                completed: false,
                protectedIds: []
            };

        finalHOH =
            data.finalHOH || {
                part1: null,
                part2: null,
                part3: null,
                winner: null
            };

        finaleWinner =
            data.finaleWinner || null;


        /*
           Compatibility for old saves.
        */

        houseguests.forEach(
            normalizeHouseguest
        );


        /*
           Convert old relationship objects
           if necessary.
        */

        relationships =
            relationships.map(
                relationship => {

                    if (
                        relationship.type
                    ) {
                        return relationship;
                    }


                    const oldValue =
                        Number(
                            relationship.value
                        ) || 0;


                    let type =
                        "neutral";


                    if (
                        oldValue >= 60
                    ) {
                        type = "love";
                    } else if (
                        oldValue >= 20
                    ) {
                        type = "like";
                    } else if (
                        oldValue <= -60
                    ) {
                        type = "hate";
                    } else if (
                        oldValue <= -20
                    ) {
                        type = "dislike";
                    }


                    return {
                        ...relationship,
                        type
                    };

                }
            );


        window.gameEvents =
            data.gameEvents || [];


        $("seasonSelect").value =
            selectedSeasonTemplate;


        updateAllDisplays();


        alert(
            "Season loaded successfully."
        );

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

function resetGame() {

    const confirmed =
        confirm(
            "Reset the entire simulator? This will delete the current cast, relationships, alliances, season and saved game."
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

    currentHOH = null;

    nominees = [];

    povWinner = null;

    povPlayers = [];


    hackerWinner = null;

    hackerVoteNullified = null;

    hackerSelectedVetoPlayer = null;


    seasonStarted = false;

    currentStage = "idle";


    evictionHistory = [];

    voteHistory = [];


    appStoreRecipients = [];

    appStoreHistory = [];


    battleBackUsed = false;


    openingSafety = {

        completed: false,

        protectedIds: []

    };


    finalHOH = {

        part1: null,

        part2: null,

        part3: null,

        winner: null

    };


    finaleWinner = null;


    window.gameEvents = [];


    localStorage.removeItem(
        "bigBrotherSimulatorSave"
    );


    clearHouseguestEditor();


    updateAllDisplays();


    showSection("home");
}



/* =========================================================
   UPDATE ALL
========================================================= */

function updateAllDisplays() {

    normalizeAllHouseguests();

    renderCast();

    renderTwists();

    renderAlliances();

    updateAllianceDropdown();

    updateRelationshipDropdowns();

    renderRelationships();

    renderMemoryWall();

    renderJury();

    updateGameDisplay();

    updateStageDisplay();

    renderEventLog();

    updateSeasonSummary();

    updateSelectedSeasonInfo();

    updateAllStatDisplays();
}



/* =========================================================
   SEASON SUMMARY
========================================================= */

function updateSeasonSummary() {

    const active =
        getActivePlayers();


    $("seasonSummary").innerHTML = `

        <div class="summary-item">

            <div class="summary-label">
                Cast
            </div>

            <div class="summary-value">
                ${houseguests.length}
            </div>

        </div>


        <div class="summary-item">

            <div class="summary-label">
                Active
            </div>

            <div class="summary-value">
                ${active.length}
            </div>

        </div>


        <div class="summary-item">

            <div class="summary-label">
                Evicted
            </div>

            <div class="summary-value">
                ${evictedHouseguests.length}
            </div>

        </div>


        <div class="summary-item">

            <div class="summary-label">
                Jury
            </div>

            <div class="summary-value">
                ${jury.length}
            </div>

        </div>


        <div class="summary-item">

            <div class="summary-label">
                Week
            </div>

            <div class="summary-value">
                ${currentWeek}
            </div>

        </div>

    `;
}

    currentCycle = 1;

    currentHOH = null;

    nominees = [];

    povWinner = null;

    povPlayers = [];


    hackerWinner = null;

    hackerVoteNullified = null;

    hackerSelectedVetoPlayer = null;


    seasonStarted = false;

    currentStage = "idle";


    evictionHistory = [];

    voteHistory = [];


    appStoreRecipients = [];

    appStoreHistory = [];


    battleBackUsed = false;


    openingSafety = {

        completed: false,

        protectedIds: []

    };


    finalHOH = {

        part1: null,

        part2: null,

        part3: null,

        winner: null

    };


    finaleWinner = null;


    window.gameEvents = [];


    localStorage.removeItem(
        "bigBrotherSimulatorSave"
    );


    clearHouseguestEditor();


    updateAllDisplays();


    showSection("home");
}



/* =========================================================
   UPDATE ALL
========================================================= */

function updateAllDisplays() {

    normalizeAllHouseguests();

    renderCast();

    renderTwists();

    renderAlliances();

    updateAllianceDropdown();

    updateRelationshipDropdowns();

    renderRelationships();

    renderMemoryWall();

    renderJury();

    updateGameDisplay();

    updateStageDisplay();

    renderEventLog();

    updateSeasonSummary();

    updateSelectedSeasonInfo();

    updateAllStatDisplays();
}



/* =========================================================
   SEASON SUMMARY
========================================================= */

function updateSeasonSummary() {

    const active =
        getActivePlayers();


    $("seasonSummary").innerHTML = `

        <div class="summary-item">

            <div class="summary-label">
                Cast
            </div>

            <div class="summary-value">
                ${houseguests.length}
            </div>

        </div>


        <div class="summary-item">

            <div class="summary-label">
                Active
            </div>

            <div class="summary-value">
                ${active.length}
            </div>

        </div>


        <div class="summary-item">

            <div class="summary-label">
                Evicted
            </div>

            <div class="summary-value">
                ${evictedHouseguests.length}
            </div>

        </div>


        <div class="summary-item">

            <div class="summary-label">
                Jury
            </div>

            <div class="summary-value">
                ${jury.length}
            </div>

        </div>


        <div class="summary-item">

            <div class="summary-label">
                Week
            </div>

            <div class="summary-value">
                ${currentWeek}
            </div>

        </div>

    `;
}

/* =========================================================
   DOM EVENTS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        $("seasonSelect").value =
            "bb20";


        /*
           Relationship previews update
           immediately when dropdowns change.
        */

        $("relationshipFrom")
            .addEventListener(
                "change",
                updateRelationshipPreviews
            );


        $("relationshipTo")
            .addEventListener(
                "change",
                updateRelationshipPreviews
            );


        updateAllDisplays();

    }
);/* =========================================================
   BIG BROTHER SIMULATOR — SOCIAL / MEMORY / POV ENHANCEMENTS
   Added as a safe extension layer so the original simulator engine
   remains intact.
========================================================= */

let showmances = [];

const BB_ENHANCEMENT_STYLES = `
/* Permanent Memory Wall */
.bb-permanent-memory-wall {
    position: sticky;
    top: 56px;
    z-index: 900;
    background: rgba(10, 10, 14, .97);
    border-bottom: 1px solid rgba(255,255,255,.14);
    box-shadow: 0 8px 22px rgba(0,0,0,.35);
    padding: 8px 12px 10px;
}
.bb-memory-title {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
    margin-bottom: 7px;
    opacity: .8;
}
.bb-memory-track {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: thin;
    padding-bottom: 2px;
}
.bb-memory-mini {
    flex: 0 0 70px;
    position: relative;
    text-align: center;
}
.bb-memory-mini img, .bb-memory-mini .bb-memory-placeholder {
    width: 56px;
    height: 56px;
    border-radius: 6px;
    object-fit: cover;
    display: block;
    margin: 0 auto 3px;
    border: 2px solid rgba(255,255,255,.2);
    background: #222;
}
.bb-memory-mini.evicted img, .bb-memory-mini.evicted .bb-memory-placeholder {
    filter: grayscale(1) brightness(.45);
}
.bb-memory-mini-name {
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.bb-memory-mini-status {
    font-size: 8px;
    text-transform: uppercase;
    opacity: .6;
}

/* POV Player Draw */
.bb-pov-draw-panel {
    margin: 14px 0;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.035);
}
.bb-pov-draw-panel h3 { margin-top: 0; }
.bb-pov-draw-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(90px, 1fr));
    gap: 10px;
}
.bb-pov-player {
    position: relative;
    padding: 8px;
    border-radius: 10px;
    text-align: center;
    border: 2px solid rgba(255,255,255,.12);
    background: rgba(0,0,0,.22);
}
.bb-pov-player.hoh-role { border-color: rgba(255,215,0,.65); }
.bb-pov-player.nominee-role { border-color: rgba(255,80,80,.7); }
.bb-pov-player.drawn-role { border-color: rgba(80,170,255,.65); }
.bb-pov-player img, .bb-pov-player .bb-pov-placeholder {
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
    margin: 0 auto 7px;
}
.bb-pov-role {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
    opacity: .75;
}
.bb-pov-name { font-weight: 800; font-size: 12px; }

/* Social systems */
.bb-social-section {
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid rgba(255,255,255,.12);
}
.bb-strength-badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .06em;
    background: rgba(255,255,255,.09);
}
.bb-showmance-card {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 10px;
    padding: 12px;
    margin-top: 10px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.03);
}
.bb-showmance-person { text-align: center; }
.bb-showmance-person img, .bb-showmance-person .bb-showmance-placeholder {
    width: 54px;
    height: 54px;
    object-fit: cover;
    border-radius: 50%;
    display: block;
    margin: 0 auto 5px;
}
.bb-showmance-heart { font-size: 22px; }
.bb-direction-note {
    font-size: 11px;
    opacity: .65;
    margin: 5px 0 12px;
}
@media (max-width: 900px) {
    .bb-pov-draw-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 600px) {
    .bb-pov-draw-grid { grid-template-columns: repeat(2, 1fr); }
    .bb-showmance-card { grid-template-columns: 1fr; }
}
`;

function bbInjectStyles() {
    if (document.getElementById("bb-enhancement-styles")) return;
    const style = document.createElement("style");
    style.id = "bb-enhancement-styles";
    style.textContent = BB_ENHANCEMENT_STYLES;
    document.head.appendChild(style);
}

function bbFindSection(id) {
    return document.getElementById(id) || document.querySelector(`[data-section="${id}"]`);
}

function bbEnsurePermanentMemoryWall() {
    if (document.getElementById("permanentMemoryWall")) return;
    const wall = document.createElement("div");
    wall.id = "permanentMemoryWall";
    wall.className = "bb-permanent-memory-wall";
    wall.innerHTML = `<div class="bb-memory-title">Memory Wall</div><div id="permanentMemoryTrack" class="bb-memory-track"></div>`;
    const header = document.querySelector("header");
    if (header) header.insertAdjacentElement("afterend", wall);
    else document.body.insertAdjacentElement("afterbegin", wall);
}

function bbMiniImage(player) {
    if (player && player.image) {
        return `<img src="${escapeAttribute(player.image)}" alt="${escapeAttribute(getDisplayName(player))}" loading="lazy">`;
    }
    return `<div class="bb-memory-placeholder">${escapeHTML(getInitials(getDisplayName(player)))}</div>`;
}

function renderPermanentMemoryWall() {
    const track = document.getElementById("permanentMemoryTrack");
    if (!track) return;
    normalizeAllHouseguests();
    track.innerHTML = houseguests.map(player => {
        const active = player.status === "Active";
        return `<div class="bb-memory-mini ${active ? "" : "evicted"}">
            ${bbMiniImage(player)}
            <div class="bb-memory-mini-name">${escapeHTML(getDisplayName(player))}</div>
            <div class="bb-memory-mini-status">${active ? "Active" : "Evicted"}</div>
        </div>`;
    }).join("");
}

function bbEnsurePOVPanel() {
    if (document.getElementById("povDrawDisplay")) return;
    const game = document.getElementById("game") || document.querySelector("section[id*='game']");
    if (!game) return;
    const panel = document.createElement("div");
    panel.id = "povDrawDisplay";
    panel.className = "bb-pov-draw-panel";
    panel.innerHTML = `<h3>POV Player Draw</h3><p>Six Houseguests compete: the HOH, both nominees, and three drawn players.</p><div id="povDrawGrid" class="bb-pov-draw-grid"></div>`;
    const anchor = document.getElementById("gameHouseguests");
    if (anchor) anchor.parentElement.insertBefore(panel, anchor);
    else game.appendChild(panel);
}

function renderPOVPlayerDraw() {
    const grid = document.getElementById("povDrawGrid");
    if (!grid) return;
    const players = (povPlayers || []).filter(Boolean);
    grid.innerHTML = players.map(player => {
        let role = "DRAWN";
        let cls = "drawn-role";
        if (player.id === currentHOH) { role = "HOH"; cls = "hoh-role"; }
        else if (nominees.some(n => n && n.id === player.id)) { role = "NOMINEE"; cls = "nominee-role"; }
        return `<div class="bb-pov-player ${cls}">
            ${player.image ? `<img src="${escapeAttribute(player.image)}" alt="${escapeAttribute(getDisplayName(player))}">` : `<div class="bb-pov-placeholder">${escapeHTML(getInitials(getDisplayName(player)))}</div>`}
            <div class="bb-pov-name">${escapeHTML(getDisplayName(player))}</div>
            <div class="bb-pov-role">${role}</div>
        </div>`;
    }).join("");
}

function bbEnsureAllianceStrengthField() {
    const members = document.getElementById("allianceMembers");
    if (!members || document.getElementById("allianceStrength")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "form-group bb-alliance-strength-field";
    wrapper.innerHTML = `<label for="allianceStrength">Alliance Strength</label>
        <select id="allianceStrength">
            <option value="casual">Casual</option>
            <option value="weak">Weak</option>
            <option value="moderate" selected>Moderate</option>
            <option value="strong">Strong</option>
            <option value="unbreakable">Unbreakable</option>
        </select>`;
    members.insertAdjacentElement("afterend", wrapper);
}

const BB_ALLIANCE_STRENGTHS = {
    casual: { label: "Casual", protection: 10 },
    weak: { label: "Weak", protection: 22 },
    moderate: { label: "Moderate", protection: 34 },
    strong: { label: "Strong", protection: 48 },
    unbreakable: { label: "Unbreakable", protection: 65 }
};

function getAllianceStrength(alliance) {
    return BB_ALLIANCE_STRENGTHS[alliance?.strength] || BB_ALLIANCE_STRENGTHS.moderate;
}

function getAllianceBetween(playerA, playerB) {
    if (!playerA || !playerB) return null;
    return alliances.find(a => a.members.includes(playerA.id) && a.members.includes(playerB.id)) || null;
}

function getShowmanceBetween(playerA, playerB) {
    if (!playerA || !playerB) return null;
    return showmances.find(s =>
        (s.player1 === playerA.id && s.player2 === playerB.id) ||
        (s.player1 === playerB.id && s.player2 === playerA.id)
    ) || null;
}

function getShowmanceStrength(showmance) {
    const values = {
        new: { label: "New", protection: 35 },
        developing: { label: "Developing", protection: 50 },
        serious: { label: "Serious", protection: 70 },
        unbreakable: { label: "Unbreakable", protection: 90 }
    };
    return values[showmance?.strength] || values.developing;
}

function bbCreateAlliance() {
    const name = $("allianceName")?.value.trim();
    const members = Array.from($("allianceMembers")?.selectedOptions || []).map(o => o.value);
    const strength = $("allianceStrength")?.value || "moderate";
    if (!name) return alert("Enter an alliance name.");
    if (members.length < 2) return alert("An alliance needs at least two Houseguests.");
    alliances.push({ id: "alliance_" + Date.now() + "_" + Math.random().toString(36).slice(2), name, members, strength });
    $("allianceName").value = "";
    if ($("allianceStrength")) $("allianceStrength").value = "moderate";
    updateAllDisplays();
    saveGameSilently();
}

function bbRenderAlliances() {
    const container = $("allianceList");
    if (!container) return;
    if (!alliances.length) {
        container.innerHTML = `<div class="panel">No alliances created yet.</div>`;
        return;
    }
    container.innerHTML = alliances.map(alliance => {
        const members = alliance.members.map(id => houseguests.find(p => p.id === id)).filter(Boolean);
        const strength = getAllianceStrength(alliance);
        return `<div class="alliance-card">
            <h3>${escapeHTML(alliance.name)}</h3>
            <div class="bb-strength-badge">${escapeHTML(strength.label)}</div>
            <div class="alliance-members">${members.map(player => `<div class="alliance-member">
                ${getPlayerImageHTML(player, "")}
                <div class="alliance-member-name">${escapeHTML(getDisplayName(player))}</div>
            </div>`).join("")}</div>
        </div>`;
    }).join("");
}

function bbEnsureShowmanceSection() {
    if (document.getElementById("showmanceSection")) return;
    const house = document.getElementById("house") || document.querySelector("section[id*='house']");
    if (!house) return;
    const section = document.createElement("div");
    section.id = "showmanceSection";
    section.className = "bb-social-section";
    section.innerHTML = `<h2>Showmances</h2>
        <p class="bb-direction-note">Showmances are separate from one-way relationships. A showmance represents a mutual romantic bond and affects nominations, votes, and jury decisions.</p>
        <div class="form-grid">
            <div class="form-group"><label for="showmancePlayer1">Houseguest 1</label><select id="showmancePlayer1"></select></div>
            <div class="form-group"><label for="showmancePlayer2">Houseguest 2</label><select id="showmancePlayer2"></select></div>
            <div class="form-group"><label for="showmanceStrength">Strength</label><select id="showmanceStrength"><option value="new">New</option><option value="developing" selected>Developing</option><option value="serious">Serious</option><option value="unbreakable">Unbreakable</option></select></div>
        </div>
        <div class="form-actions"><button type="button" onclick="createShowmance()">CREATE SHOWMANCE</button></div>
        <div id="showmanceList"></div>`;
    const relationshipEditor = house.querySelector(".relationship-editor");
    if (relationshipEditor) relationshipEditor.insertAdjacentElement("afterend", section);
    else house.appendChild(section);
    updateShowmanceDropdowns();
}

function updateShowmanceDropdowns() {
    ["showmancePlayer1", "showmancePlayer2"].forEach(id => {
        const select = $(id);
        if (!select) return;
        const old = select.value;
        select.innerHTML = houseguests.map(p => `<option value="${escapeAttribute(p.id)}">${escapeHTML(getDisplayName(p))}</option>`).join("");
        if (houseguests.some(p => p.id === old)) select.value = old;
    });
}

function createShowmance() {
    const player1 = $("showmancePlayer1")?.value;
    const player2 = $("showmancePlayer2")?.value;
    const strength = $("showmanceStrength")?.value || "developing";
    if (!player1 || !player2) return alert("Select both Houseguests.");
    if (player1 === player2) return alert("A showmance needs two different Houseguests.");
    const existing = getShowmanceBetween({id: player1}, {id: player2});
    if (existing) existing.strength = strength;
    else showmances.push({ id: "showmance_" + Date.now() + "_" + Math.random().toString(36).slice(2), player1, player2, strength });
    renderShowmances();
    saveGameSilently();
}

function deleteShowmance(id) {
    showmances = showmances.filter(s => s.id !== id);
    renderShowmances();
}
