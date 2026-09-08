/*
 * BIG BROTHER SIMULATOR — STAGE 1 FOUNDATION
 *
 * This is the single application controller.  Season rules live in /seasons.
 * Stage 1 focuses on a stable data model, cast editor, relationships,
 * alliances, persistence, season loading, and a deterministic event pipeline.
 * Competition-specific BB20 mechanics are intentionally isolated in the
 * season template so they can be added without rewriting the app.
 */

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

const STORAGE_KEY = "bb-simulator-stage4-v1";

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
let finalHOH = { part1: null, part2: null, part3: null, winner: null };
let juryVotes = {};
let juryVoteRevealIndex = 0;
let outgoingHOH = null;
let hackerPower = { replacementUsed: false, vetoPickUsed: false, voteNullified: false };
let appStoreHistory = [];
let bonusLifeEligible = null;
let battleBackCompleted = false;
let pendingSecondCycle = false;

function $(id) { return document.getElementById(id); }

function clamp(value, min = 1, max = 10) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}

function normalizeStat(value) { return clamp(value, 1, 10); }

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) { return escapeHTML(value); }

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
    return player.nickname || [player.firstName, player.lastName].filter(Boolean).join(" ") || player.name || "Houseguest";
}

function getInitials(player) {
    const name = getDisplayName(player).trim();
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map(p => p[0].toUpperCase()).join("") || "HG";
}

function normalizeHouseguest(player) {
    if (!player) return null;
    player.id ||= makeId("hg");
    player.firstName ||= player.first || "";
    player.lastName ||= player.last || "";
    player.nickname ||= "";
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
        player[key] = normalizeStat(legacy[key] ?? 5);
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
    return player;
}

function normalizeAllHouseguests() {
    houseguests.forEach(normalizeHouseguest);
}

function getActiveHouseguests() {
    return houseguests.filter(p => p.status === "Active");
}

function getCurrentSeasonTemplate() {
    const registry = window.BB_SEASON_REGISTRY || {};
    return registry[selectedSeasonTemplate] || null;
}

function getSelectedSeasonTemplate() {
    return $("seasonSelect")?.value || selectedSeasonTemplate || "bb20";
}

function addEvent(text, type = "general") {
    eventLog.push({ week: currentWeek, cycle: currentCycle, type, text: String(text) });
}

function updateStatValue(stat) {
    const input = $(stat);
    const output = $(`${stat}Value`);
    if (input && output) output.textContent = input.value;
}

function updateAllStatDisplays() {
    STAT_KEYS.forEach(updateStatValue);
}

function showSection(sectionId) {
    document.querySelectorAll(".page-section").forEach(section => section.classList.remove("active-section"));
    const target = $(sectionId);
    if (target) target.classList.add("active-section");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectSeasonTemplate() {
    selectedSeasonTemplate = getSelectedSeasonTemplate();
    const template = getCurrentSeasonTemplate();
    updateSelectedSeasonInfo();
    if (template) {
        seasonName = template.name;
        seasonFormat = template.id;
        addEvent(`${template.name} format selected.`, "format");
    }
    updateAllDisplays();
    saveGameSilently();
}

function updateSelectedSeasonInfo() {
    const info = $("selectedSeasonInfo");
    if (!info) return;
    const template = getCurrentSeasonTemplate();
    if (!template) {
        info.innerHTML = `<div class="empty-state">That season format has not been installed yet.</div>`;
        return;
    }

    const weeks = Object.values(template.competitions || {}).map((data, i) => {
        const week = i + 1;
        const pieces = [];
        if (data.hoh) pieces.push(`HOH: ${escapeHTML(data.hoh)}`);
        if (data.pov) pieces.push(`POV: ${escapeHTML(data.pov)}`);
        if (data.hacker) pieces.push(`Hacker: ${escapeHTML(data.hacker)}`);
        if (data.doubleEviction) pieces.push("Double Eviction");
        return `<div><strong>Week ${week}</strong> — ${pieces.join(" | ")}</div>`;
    }).join("");

    info.innerHTML = `
        <div class="season-template-card">
            <h3>${escapeHTML(template.name)}</h3>
            <p>${escapeHTML(template.description || "")}</p>
            <p><strong>${template.startingPlayers}</strong> starting Houseguests · <strong>${template.nominationCount}</strong> nominees · <strong>${template.jurySize}</strong>-person jury</p>
            ${weeks ? `<hr><h4>Competition Schedule</h4><div class="season-schedule">${weeks}</div>` : ""}
        </div>`;
}

function getWeekData() {
    const template = getCurrentSeasonTemplate();
    if (!template) return null;
    return template.competitions?.[currentWeek] || null;
}

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
    player.appUsed = false;
    player.app = null;
    player.strategyProfile = player.strategyProfile || { alliance: 0, threat: 0, target: 0 };
}

function validateSeasonStart() {
    const template = getCurrentSeasonTemplate();
    if (!template) {
        alert("Please select an installed season format first.");
        return false;
    }
    if (houseguests.length < Number(template.startingPlayers || 2)) {
        alert(`This season requires at least ${template.startingPlayers} Houseguests. You currently have ${houseguests.length}.`);
        showSection("cast");
        return false;
    }
    return true;
}

function startNewSeason() {
    if (!validateSeasonStart()) return;
    if (seasonStarted && !confirm("Starting a new season will reset the current game. Continue?")) return;

    const template = getCurrentSeasonTemplate();
    selectedSeasonTemplate = getSelectedSeasonTemplate();
    seasonName = template.name;
    seasonFormat = template.id;
    seasonStarted = true;
    seasonFinished = false;
    currentWeek = 1;
    currentCycle = 1;
    currentStage = "opening";
    currentHOH = null;
    nominees = [];
    povPlayers = [];
    povWinner = null;
    hackerWinner = null;
    replacementNominee = null;
    evictionVotes = {};
    currentEvictionTarget = null;
    currentEvictedPlayer = null;
    finaleWinner = null;
    finalHOH = { part1: null, part2: null, part3: null, winner: null };
    juryVotes = {};
    juryVoteRevealIndex = 0;
    outgoingHOH = null; hackerPower = { replacementUsed:false, vetoPickUsed:false, voteNullified:false };
    appStoreHistory = []; bonusLifeEligible = null; battleBackCompleted = false; pendingSecondCycle = false;
    evictedHouseguests = [];
    jury = [];
    eventLog = [];

    normalizeAllHouseguests();
    houseguests.forEach(resetPlayerSeasonStats);

    addEvent(`${seasonName} has begun with ${houseguests.length} Houseguests.`, "season");
    addEvent("Starting relationships and alliances have been loaded.", "social");
    updateAllDisplays();
    showSection("game");
    saveGameSilently();
}

function getRelationship(fromId, toId) {
    return relationships.find(r => r.from === fromId && r.to === toId) || null;
}

function getRelationshipScore(fromId, toId) {
    const relationship = getRelationship(fromId, toId);
    return relationship ? Number(relationship.score || 0) : 0;
}

function setRelationship(fromId, toId, type, note = "", scoreOverride = null) {
    if (!fromId || !toId || fromId === toId) return false;
    const score = scoreOverride === null ? RELATIONSHIP_VALUES[type] ?? 0 : clamp(scoreOverride, -100, 100);
    const existing = getRelationship(fromId, toId);
    if (existing) {
        existing.type = type;
        existing.score = score;
        existing.note = note;
    } else {
        relationships.push({ id: makeId("rel"), from: fromId, to: toId, type, score, note });
    }
    return true;
}

function saveRelationship() {
    const from = $("relationshipFrom")?.value;
    const to = $("relationshipTo")?.value;
    const type = $("relationshipType")?.value || "neutral";
    const note = $("relationshipNote")?.value.trim() || "";
    if (!from || !to || from === to) {
        alert("Choose two different Houseguests.");
        return;
    }
    setRelationship(from, to, type, note);
    addEvent(`${getDisplayName(findPlayer(from))} → ${getDisplayName(findPlayer(to))}: ${RELATIONSHIP_LABELS[type]}.`, "social");
    updateAllDisplays();
    saveGameSilently();
}

function loadSelectedRelationship() {
    const from = $("relationshipFrom")?.value;
    const to = $("relationshipTo")?.value;
    const rel = getRelationship(from, to);
    if (!rel) {
        alert("No saved relationship exists for that direction.");
        return;
    }
    $("relationshipType").value = rel.type || "neutral";
    $("relationshipNote").value = rel.note || "";
    updateRelationshipPreviews();
}

function deleteSelectedRelationship() {
    const from = $("relationshipFrom")?.value;
    const to = $("relationshipTo")?.value;
    const before = relationships.length;
    relationships = relationships.filter(r => !(r.from === from && r.to === to));
    if (relationships.length !== before) {
        addEvent(`Removed the relationship from ${getDisplayName(findPlayer(from))} to ${getDisplayName(findPlayer(to))}.`, "social");
        updateAllDisplays();
        saveGameSilently();
    }
}

function updateRelationshipPreviews() {
    const from = findPlayer($("relationshipFrom")?.value);
    const to = findPlayer($("relationshipTo")?.value);
    const fromPreview = $("relationshipFromPreview");
    const toPreview = $("relationshipToPreview");
    if (fromPreview) fromPreview.innerHTML = from ? personInlineHTML(from) : "";
    if (toPreview) toPreview.innerHTML = to ? personInlineHTML(to) : "";
}

function createAlliance() {
    const name = $("allianceName")?.value.trim();
    const members = Array.from($("allianceMembers")?.selectedOptions || []).map(o => o.value).filter(Boolean);
    const strength = $("allianceStrength")?.value || "moderate";
    if (!name) { alert("Give the alliance a name."); return; }
    if (members.length < 2) { alert("Choose at least two Houseguests."); return; }
    alliances.push({ id: makeId("alliance"), name, members, strength, formedWeek: currentWeek, active: true });
    addEvent(`Alliance formed: ${name}.`, "alliance");
    $("allianceName").value = "";
    Array.from($("allianceMembers")?.options || []).forEach(o => o.selected = false);
    updateAllDisplays();
    saveGameSilently();
}

function createTwist() {
    const name = $("twistName")?.value.trim();
    const description = $("twistDescription")?.value.trim() || "";
    if (!name) { alert("Give the twist a name."); return; }
    customTwists.push({ id: makeId("twist"), name, description, active: true });
    addEvent(`Custom twist added: ${name}.`, "twist");
    $("twistName").value = "";
    $("twistDescription").value = "";
    updateAllDisplays();
    saveGameSilently();
}

function findPlayer(id) { return houseguests.find(p => p.id === id) || null; }

function personInlineHTML(player) {
    const image = player.image
        ? `<img src="${escapeAttribute(player.image)}" alt="${escapeAttribute(getDisplayName(player))}" class="status-player-image" onerror="this.style.display='none'">`
        : `<div class="status-player-image status-placeholder">${escapeHTML(getInitials(player))}</div>`;
    return `<span class="status-person-inline">${image}<span>${escapeHTML(getDisplayName(player))}</span></span>`;
}

function getPlayerImageHTML(player, className = "player-image") {
    if (!player) return "";
    if (player.image) {
        return `<img src="${escapeAttribute(player.image)}" alt="${escapeAttribute(getDisplayName(player))}" class="${escapeAttribute(className)}" onerror="this.style.display='none';this.nextElementSibling?.classList.remove('hidden')"><div class="image-fallback hidden">${escapeHTML(getInitials(player))}</div>`;
    }
    return `<div class="image-fallback ${escapeAttribute(className)}">${escapeHTML(getInitials(player))}</div>`;
}

function renderCast() {
    const grid = $("castGrid");
    const count = $("castCount");
    if (!grid) return;
    if (count) count.textContent = houseguests.length;
    if (!houseguests.length) {
        grid.innerHTML = `<div class="empty-state"><h3>No Houseguests Yet</h3><p>Add Houseguests above to build your cast.</p></div>`;
        return;
    }
    grid.innerHTML = houseguests.map(player => `
        <article class="cast-card ${player.status === "Evicted" ? "evicted" : ""}">
            <div class="cast-card-photo">${getPlayerImageHTML(player, "cast-card-image")}</div>
            <h3>${escapeHTML(getDisplayName(player))}</h3>
            <p>${escapeHTML(player.status)}</p>
            <div class="cast-card-stats">
                <span>GEN ${player.general}</span><span>PHY ${player.physical}</span><span>END ${player.endurance}</span><span>MEN ${player.mental}</span>
                <span>STR ${player.strategic}</span><span>LOY ${player.loyalty}</span><span>SOC ${player.social}</span><span>TEM ${player.temperament}</span>
            </div>
            <div class="button-row"><button class="secondary-button" onclick="editHouseguest('${escapeAttribute(player.id)}')">EDIT</button><button class="danger-button" onclick="deleteHouseguest('${escapeAttribute(player.id)}')">DELETE</button></div>
        </article>`).join("");
}

function saveHouseguest() {
    const data = {
        firstName: $("firstName")?.value.trim() || "",
        lastName: $("lastName")?.value.trim() || "",
        nickname: $("nickname")?.value.trim() || "",
        image: $("imageUrl")?.value.trim() || ""
    };
    if (!data.firstName && !data.lastName && !data.nickname) {
        alert("Enter at least a first name, last name, or nickname.");
        return;
    }
    STAT_KEYS.forEach(key => { data[key] = normalizeStat($(key)?.value); });
    const editingId = $("editingHouseguestId")?.value;
    if (editingId) {
        const player = findPlayer(editingId);
        if (!player) return;
        Object.assign(player, data);
        normalizeHouseguest(player);
        addEvent(`${getDisplayName(player)} was edited.`, "cast");
    } else {
        const player = normalizeHouseguest({ id: makeId("hg"), ...data });
        houseguests.push(player);
        addEvent(`${getDisplayName(player)} was added to the cast.`, "cast");
    }
    clearHouseguestEditor();
    updateAllDisplays();
    saveGameSilently();
}

function editHouseguest(id) {
    const player = findPlayer(id);
    if (!player) return;
    normalizeHouseguest(player);
    $("editingHouseguestId").value = player.id;
    $("firstName").value = player.firstName;
    $("lastName").value = player.lastName;
    $("nickname").value = player.nickname;
    $("imageUrl").value = player.image;
    STAT_KEYS.forEach(key => { if ($(key)) $(key).value = player[key]; });
    updateAllStatDisplays();
    $("castEditorTitle").textContent = `Edit ${getDisplayName(player)}`;
    $("saveHouseguestButton").textContent = "SAVE CHANGES";
    $("cancelEditButton")?.classList.remove("hidden");
    showSection("cast");
}

function cancelHouseguestEdit() { clearHouseguestEditor(); }

function clearHouseguestEditor() {
    if ($("editingHouseguestId")) $("editingHouseguestId").value = "";
    ["firstName", "lastName", "nickname", "imageUrl"].forEach(id => { if ($(id)) $(id).value = ""; });
    STAT_KEYS.forEach(key => { if ($(key)) $(key).value = 5; });
    updateAllStatDisplays();
    if ($("castEditorTitle")) $("castEditorTitle").textContent = "Add Houseguest";
    if ($("saveHouseguestButton")) $("saveHouseguestButton").textContent = "ADD HOUSEGUEST";
    $("cancelEditButton")?.classList.add("hidden");
}

function deleteHouseguest(id) {
    if (seasonStarted) { alert("Reset the season before removing a Houseguest from the cast."); return; }
    const player = findPlayer(id);
    if (!player || !confirm(`Remove ${getDisplayName(player)} from the cast?`)) return;
    houseguests = houseguests.filter(p => p.id !== id);
    relationships = relationships.filter(r => r.from !== id && r.to !== id);
    alliances.forEach(a => a.members = a.members.filter(member => member !== id));
    alliances = alliances.filter(a => a.members.length >= 2);
    addEvent(`${getDisplayName(player)} was removed from the cast.`, "cast");
    updateAllDisplays();
    saveGameSilently();
}

function renderAllRelationshipControls() {
    const from = $("relationshipFrom");
    const to = $("relationshipTo");
    const alliance = $("allianceMembers");
    if (!from || !to || !alliance) return;
    const currentFrom = from.value;
    const currentTo = to.value;
    const selectedAlliance = new Set(Array.from(alliance.selectedOptions).map(o => o.value));
    const options = houseguests.map(p => `<option value="${escapeAttribute(p.id)}">${escapeHTML(getDisplayName(p))}</option>`).join("");
    from.innerHTML = options;
    to.innerHTML = options;
    alliance.innerHTML = houseguests.map(p => `<option value="${escapeAttribute(p.id)}" ${selectedAlliance.has(p.id) ? "selected" : ""}>${escapeHTML(getDisplayName(p))}</option>`).join("");
    if (houseguests.some(p => p.id === currentFrom)) from.value = currentFrom;
    if (houseguests.some(p => p.id === currentTo)) to.value = currentTo;
    updateRelationshipPreviews();
}

function renderAlliances() {
    const container = $("allianceList");
    if (!container) return;
    if (!alliances.length) { container.innerHTML = `<div class="empty-state">No starting alliances yet.</div>`; return; }
    container.innerHTML = alliances.map(a => `
        <div class="alliance-card">
            <h3>${escapeHTML(a.name)}</h3>
            <p>${escapeHTML(a.strength || "moderate")} · formed Week ${a.formedWeek || 1}</p>
            <div>${a.members.map(id => findPlayer(id)).filter(Boolean).map(personInlineHTML).join("")}</div>
        </div>`).join("");
}

function renderRelationships() {
    const container = $("relationshipsList");
    if (!container) return;
    if (!relationships.length) { container.innerHTML = `<div class="empty-state">No starting relationships entered.</div>`; return; }
    container.innerHTML = relationships.map(r => {
        const from = findPlayer(r.from), to = findPlayer(r.to);
        if (!from || !to) return "";
        return `<div class="relationship-row"><strong>${escapeHTML(getDisplayName(from))}</strong><span>→</span><strong>${escapeHTML(getDisplayName(to))}</strong><span>${escapeHTML(RELATIONSHIP_LABELS[r.type] || "Neutral")}</span>${r.note ? `<small>${escapeHTML(r.note)}</small>` : ""}</div>`;
    }).join("");
}

function renderTwists() {
    const container = $("twistList");
    if (!container) return;
    const template = getCurrentSeasonTemplate();
    const builtIns = template?.twists ? Object.entries(template.twists).map(([key, value]) => `<div class="bb-active-twist active"><strong>${escapeHTML(value.name || key)}</strong><span>${escapeHTML(value.description || "Season twist")}</span></div>`).join("") : "";
    const customs = customTwists.map(t => `<div class="bb-active-twist"><strong>${escapeHTML(t.name)}</strong><span>${escapeHTML(t.description)}</span></div>`).join("");
    container.innerHTML = builtIns + customs || `<div class="empty-state">No twists configured.</div>`;
}

function renderMemoryWall() {
    const container = $("memoryWall");
    if (!container) return;
    container.innerHTML = houseguests.length ? houseguests.map(p => `
        <div class="memory-wall-card ${p.status === "Evicted" ? "evicted" : ""} ${finaleWinner?.id === p.id ? "winner" : ""}">
            <div class="memory-wall-photo">${getPlayerImageHTML(p, "memory-wall-image")}</div>
            <div class="memory-wall-name">${escapeHTML(getDisplayName(p))}</div>
            <div class="memory-wall-status">${escapeHTML(finaleWinner?.id === p.id ? "WINNER" : p.juryMember ? "JURY" : p.status)}</div>
        </div>`).join("") : `<div class="empty-state">Add Houseguests to build the Memory Wall.</div>`;
}

function renderJury() {
    const juryList = $("juryList");
    const evicted = $("evictedPlayers");
    if (juryList) juryList.innerHTML = jury.length ? jury.map((p, i) => `<div class="jury-card"><div class="jury-order">${i + 1}</div>${getPlayerImageHTML(p, "jury-photo")}<div class="jury-info"><strong>${escapeHTML(getDisplayName(p))}</strong><span>Jury Member</span></div></div>`).join("") : `<div class="empty-state">No Jury members yet.</div>`;
    if (evicted) evicted.innerHTML = evictedHouseguests.length ? evictedHouseguests.map((p, i) => `<div class="evicted-player-card"><div class="eviction-number">${i + 1}</div>${getPlayerImageHTML(p, "evicted-photo")}<div><strong>${escapeHTML(getDisplayName(p))}</strong><span>${escapeHTML(p.status)}</span></div></div>`).join("") : `<div class="empty-state">No evicted Houseguests yet.</div>`;
}

function renderGameHouseguests() {
    const container = $("gameHouseguests");
    if (!container) return;
    const active = getActiveHouseguests();
    container.innerHTML = active.length ? active.map(p => {
        const tags = [];
        if (p.id === currentHOH) tags.push("HOH");
        if (nominees.some(n => n.id === p.id)) tags.push("NOM");
        if (povWinner?.id === p.id) tags.push("POV");
        return `<article class="game-houseguest-card ${p.id === currentHOH ? "is-hoh" : ""} ${nominees.some(n => n.id === p.id) ? "is-nominee" : ""}">${getPlayerImageHTML(p, "game-houseguest-photo")}<div class="game-houseguest-info"><strong>${escapeHTML(getDisplayName(p))}</strong><span>${tags.join(" · ") || "ACTIVE"}</span></div></article>`;
    }).join("") : `<div class="empty-state">No active Houseguests.</div>`;
}

function renderEventLog() {
    const container = $("eventLog");
    if (!container) return;
    container.innerHTML = eventLog.length ? eventLog.slice().reverse().map((e, i) => `<div class="event-log-item"><span class="event-week">W${e.week || ""}</span><span class="event-text">${escapeHTML(e.text || e.message || e)}</span></div>`).join("") : `<div class="empty-state">No events yet.</div>`;
}

function renderStatusPeople(containerId, players, empty = "None") {
    const container = $(containerId);
    if (!container) return;
    container.innerHTML = players?.length ? players.map(personInlineHTML).join("") : `<span class="status-none">${empty}</span>`;
}

function updateGameStageDisplay() {
    const stageMap = {
        opening: { name: "Season Ready", title: "Opening", icon: "★", description: "The season has started. Proceed to the first event." },
        hoh: { name: "Head of Household", title: "HOH Competition", icon: "👑", description: "The Houseguests compete for Head of Household." },
        nominations: { name: "Nomination Ceremony", title: "Nominations", icon: "🎯", description: "The HOH selects the two nominees." },
        hacker: { name: "H@cker Competition", title: "H@cker", icon: "💻", description: "The anonymous hacker can alter one nomination, choose a Veto player, and nullify one eviction vote." },
        pov: { name: "Power of Veto", title: "POV Competition", icon: "🏆", description: "Six eligible Houseguests compete for the Power of Veto." },
        veto: { name: "Veto Ceremony", title: "Veto Ceremony", icon: "🛡️", description: "The POV winner decides whether to use the Veto." },
        eviction: { name: "Eviction", title: "Eviction Vote", icon: "🗳️", description: "Houseguests cast their secret votes to evict." },
        evictionReveal: { name: "Eviction", title: "Eviction Reveal", icon: "🚪", description: "The eviction result is revealed." },
        finalHOH1: { name: "Final HOH Part 1", title: "Final HOH", icon: "👑", description: "The final three compete in the endurance portion." },
        finalHOH2: { name: "Final HOH Part 2", title: "Final HOH", icon: "🧠", description: "The two non-winners of Part 1 compete in the mental portion." },
        finalHOH3: { name: "Final HOH Part 3", title: "Final HOH", icon: "🏆", description: "The Part 1 and Part 2 winners face off to determine the final HOH." },
        finalVote: { name: "Final Eviction", title: "Final 3", icon: "🚪", description: "The final HOH chooses which finalist to evict." },
        finale: { name: "Jury Vote", title: "Finale", icon: "🏆", description: "The jury determines the winner." },
        nextWeek: { name: "Next Week", title: "Week Complete", icon: "➡️", description: "Advance to the next cycle." },
        finished: { name: "Finished", title: "Finale", icon: "🏆", description: "The season is complete." }
    };
    const data = stageMap[currentStage] || stageMap.opening;
    if ($("weekBadge")) $("weekBadge").textContent = `WEEK ${currentWeek}`;
    if ($("weekTitle")) $("weekTitle").textContent = `Week ${currentWeek}`;
    if ($("stageTitle")) $("stageTitle").textContent = data.title;
    if ($("stageName")) $("stageName").textContent = data.name;
    if ($("stageDescription")) $("stageDescription").textContent = data.description;
    if ($("stageIcon")) $("stageIcon").textContent = data.icon;
    const proceed = $("proceedButton");
    if (proceed) proceed.textContent = seasonFinished ? "VIEW FINALE" : "PROCEED";
}

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
    renderEventLog();
    updateGameStageDisplay();
    updateSelectedSeasonInfo();
    updateSeasonSummary();
    renderGameStatus();
}

function renderGameStatus() {
    renderStatusPeople("hohStatus", currentHOH ? [findPlayer(currentHOH)] : []);
    renderStatusPeople("nomineesStatus", nominees);
    renderStatusPeople("povStatus", povWinner ? [povWinner] : []);
    const format = $("formatStatus");
    if (format) {
        const data = getWeekData();
        format.textContent = data?.doubleEviction ? "DOUBLE EVICTION" : currentCycle === 2 ? "SECOND CYCLE" : "NORMAL WEEK";
    }
}

/* Stage 3 — BB20 fidelity, detailed competition scoring, social evolution, and finale presentation. */
function getCompetitionEvent(kind, week = currentWeek, cycle = currentCycle) {
    const data = getCurrentSeasonTemplate()?.competitions?.[week];
    if (!data) return null;
    if (kind === "hoh") return cycle === 2 && data.secondHOH ? data.secondHOH : data.hoh;
    if (kind === "pov") return cycle === 2 && data.secondPOV ? data.secondPOV : data.pov;
    if (kind === "hacker") return data.hacker;
    return null;
}

function getCompetitionWeights(category = "overall") {
    return {
        general: { general: .45, mental: .15, physical: .10, endurance: .10, strategic: .10, temperament: .10 },
        physical: { physical: .55, endurance: .25, general: .10, temperament: .10 },
        endurance: { endurance: .60, physical: .20, temperament: .10, general: .10 },
        mental: { mental: .60, strategic: .20, general: .10, temperament: .10 },
        strategic: { strategic: .55, mental: .20, social: .10, general: .10, loyalty: .05 },
        overall: { general: .20, physical: .12, endurance: .10, mental: .16, strategic: .16, social: .10, loyalty: .06, temperament: .10 }
    }[category] || null;
}

function scoreCompetition(player, category = "overall", luck = true) {
    const weights = getCompetitionWeights(category) || getCompetitionWeights("overall");
    let score = 0;
    let total = 0;
    for (const [key, weight] of Object.entries(weights)) {
        score += normalizeStat(player[key] ?? 5) * weight;
        total += weight;
    }
    const base = (score / total) * 10;
    return base + (luck ? randomFloat(-6, 6) : 0);
}

function getCompetitionBreakdown(player, category = "overall") {
    const weights = getCompetitionWeights(category) || getCompetitionWeights("overall");
    return Object.entries(weights).map(([key, weight]) => ({ key, value: normalizeStat(player[key] ?? 5), weight, contribution: normalizeStat(player[key] ?? 5) * weight }));
}

function determineCompetitionWinner(players, category = "overall", eventName = "Competition") {
    if (!players.length) return null;
    const results = players.map(player => ({
        player,
        score: scoreCompetition(player, category),
        baseScore: scoreCompetition(player, category, false),
        breakdown: getCompetitionBreakdown(player, category)
    })).sort((a, b) => b.score - a.score);
    const winner = results[0]?.player || null;
    if (winner) {
        const detail = results.slice(0, 3).map((r, i) => `${i + 1}. ${getDisplayName(r.player)} (${r.score.toFixed(1)})`).join(" • ");
        addEvent(`${eventName} results: ${detail}.`, "competition-detail");
    }
    return winner;
}

function evolveRelationshipsAfterEvent() {
    const active = getActiveHouseguests();
    active.forEach(a => active.forEach(b => {
        if (a.id === b.id) return;
        let r = relationships.find(x => x.from === a.id && x.to === b.id);
        if (!r) {
            if (Math.random() < .18) relationships.push({ id: makeId("rel"), from: a.id, to: b.id, type: "neutral", score: 0, note: "Naturally evolving" });
            return;
        }
        const alliance = alliances.some(x => x.active !== false && x.members.includes(a.id) && x.members.includes(b.id));
        let delta = randomInt(-5, 5);
        if (alliance) delta += 2;
        if (a.id === currentHOH) delta += randomInt(-2, 3);
        r.score = Math.max(-100, Math.min(100, Number(r.score || 0) + delta));
        r.type = r.score >= 75 ? "love" : r.score >= 25 ? "like" : r.score <= -75 ? "hate" : r.score <= -25 ? "dislike" : "neutral";
    }));
}

function getHOHEligible() {
    return getActiveHouseguests().filter(p => p.id !== outgoingHOH);
}

function runHOH() {
    const players = getHOHEligible();
    if (players.length < 2) return finishSeason();
    const event = getCompetitionEvent("hoh");
    const winner = determineCompetitionWinner(players, event?.category || "overall", event?.name || "HOH Competition");
    currentHOH = winner.id;
    winner.hohWins++;
    winner.competitionWins++;
    winner.safety = true;
    addEvent(`${getDisplayName(winner)} won HOH${event?.name ? ` (${event.name})` : ""}.`, "competition");
    currentStage = "nominations";
}

function getAllianceBetween(a, b) {
    return alliances.find(x => x.active !== false && x.members.includes(a.id) && x.members.includes(b.id)) || null;
}

function getThreatScore(player) {
    if (!player) return 0;
    return (player.competitionWins * 5) + (player.hohWins * 7) + (player.povWins * 5) +
        (player.strategic * 2.6) + (player.social * 1.8) + (player.physical * 1.4) + (player.mental * 1.2);
}

function getSocialSafetyScore(player) {
    if (!player) return 0;
    const active = getActiveHouseguests().filter(p => p.id !== player.id);
    if (!active.length) return 0;
    const positive = active.reduce((sum, other) => Math.max(0, getRelationshipScore(other.id, player.id)), 0);
    return positive / active.length;
}

function getAllianceCohesion(player) {
    const memberIds = new Set();
    alliances.filter(a => a.active !== false && a.members.includes(player.id)).forEach(a => a.members.forEach(id => memberIds.add(id)));
    return Math.min(100, memberIds.size * 12 + player.loyalty * 3);
}

function calculateNominationScore(hoh, target) {
    const relationship = getRelationshipScore(hoh.id, target.id);
    const reverseRelationship = getRelationshipScore(target.id, hoh.id);
    const alliance = getAllianceBetween(hoh, target);
    const threat = getThreatScore(target);
    const socialSafety = getSocialSafetyScore(target);
    const strategic = target.strategic * 2.5;
    const volatility = (10 - target.temperament) * 2.2;
    const revenge = Math.max(0, -reverseRelationship) * 0.35;
    const alliancePenalty = alliance ? (alliance.strength === 'unbreakable' ? 85 : alliance.strength === 'strong' ? 65 : 45) : 0;
    const targetability = threat * 0.65 + strategic + volatility + revenge - relationship * 0.7 - socialSafety * 0.4 - alliancePenalty;
    return targetability + randomFloat(-7, 7);
}

function rankNominationTargets(hoh, candidates) {
    return candidates.map(player => ({ player, score: calculateNominationScore(hoh, player) }))
        .sort((a, b) => b.score - a.score);
}

function isProtectedFromNomination(player) {
    return player.safety || (player.app === "The Cloud" && !player.appUsed);
}

function makeNominations() {
    const hoh = findPlayer(currentHOH);
    if (!hoh) return;
    const candidates = getActiveHouseguests().filter(p => p.id !== hoh.id && !isProtectedFromNomination(p));
    if (candidates.length < 2) return;
    const ranked = rankNominationTargets(hoh, candidates);
    nominees = ranked.slice(0, 2).map(x => x.player);
    nominees.forEach(p => p.safety = false);
    addEvent(`${getDisplayName(hoh)} nominated ${getDisplayName(nominees[0])} and ${getDisplayName(nominees[1])}.`, "nomination");

    if (getCurrentSeasonTemplate()?.twists?.appStore && currentWeek <= 3) resolveAppStore();

    const identity = getActiveHouseguests().find(p => p.app === "Identity Theft" && !p.appUsed && p.id !== hoh.id);
    if (identity) {
        const currentThreat = nominees.reduce((sum, p) => sum + getThreatScore(p), 0);
        const alternativePool = getActiveHouseguests().filter(p => p.id !== hoh.id && p.id !== identity.id && !nominees.some(n => n.id === p.id) && !isProtectedFromNomination(p));
        const alternatives = rankNominationTargets(hoh, alternativePool);
        if (alternativePool.length >= 2 && identity.strategic + identity.social + identity.temperament >= 20 && currentThreat < (alternatives[0].score + alternatives[1].score) * 0.9 && randomFloat() < 0.72) {
            nominees = alternatives.slice(0, 2).map(x => x.player);
            identity.appUsed = true;
            addEvent(`${getDisplayName(identity)} secretly used Identity Theft to replace the HOH's nominations with ${getDisplayName(nominees[0])} and ${getDisplayName(nominees[1])}.`, "twist");
        }
    }
    currentStage = currentWeek >= 6 && currentWeek <= 7 ? "hacker" : "pov";
}

function resolveAppStore() {
    const eligible = getActiveHouseguests().filter(p => !p.app);
    if (!eligible.length) return;
    const top = eligible.slice().sort((a,b) => (b.social + b.general + b.loyalty) - (a.social + a.general + a.loyalty))[0];
    const unusedPowerApps = getCurrentSeasonTemplate().twists.appStore.powerApps.filter(app => !appStoreHistory.some(h => h.name === app.name));
    const power = unusedPowerApps[0];
    if (power) {
        top.app = power.name;
        appStoreHistory.push({ week: currentWeek, player: top.id, name: power.name });
        addEvent(`${getDisplayName(top)} received the BB App Store Power App: ${power.name}.`, "twist");
        if (power.type === "bonusLife") bonusLifeEligible = top.id;
    }
    const crapEligible = eligible.filter(p => p.id !== top.id);
    const unusedCrap = getCurrentSeasonTemplate().twists.appStore.crapApps.filter(app => !appStoreHistory.some(h => h.name === app.name));
    if (crapEligible.length && unusedCrap.length) {
        const low = crapEligible.slice().sort((a,b) => (a.social+a.general) - (b.social+b.general))[0];
        const crap = unusedCrap[0];
        low.app = crap.name;
        appStoreHistory.push({ week: currentWeek, player: low.id, name: crap.name });
        addEvent(`${getDisplayName(low)} received the BB App Store Crap App: ${crap.name}.`, "twist");
    }
}

function runHacker() {
    const eligible = getActiveHouseguests().filter(p => !nominees.some(n => n.id === p.id));
    if (eligible.length < 2) { currentStage = "pov"; return; }
    const event = getCompetitionEvent("hacker");
    const winner = determineCompetitionWinner(eligible, event?.category || "mental", event?.name || "H@cker Competition");
    if (!winner) { currentStage = "pov"; return; }
    hackerWinner = winner.id;
    hackerPower = { replacementUsed: false, vetoPickUsed: false, voteNullified: false };
    winner.competitionWins++;
    addEvent(`${getDisplayName(winner)} secretly won the H@cker Competition (${event?.name || "H@cker Competition"}).`, "twist");

    const hoh = findPlayer(currentHOH);
    const replacementPool = getActiveHouseguests().filter(p => p.id !== currentHOH && p.id !== winner.id && !nominees.some(n => n.id === p.id) && !isProtectedFromNomination(p));
    if (hoh && replacementPool.length) {
        const ranked = replacementPool.map(p => ({ player: p, score: calculateNominationScore(hoh, p) + getThreatScore(p) * 0.45 }))
            .sort((a, b) => b.score - a.score);
        const replacement = ranked[0]?.player;
        const saved = nominees.slice().sort((a, b) => getThreatScore(a) - getThreatScore(b))[0];
        if (replacement && saved && (getThreatScore(replacement) > getThreatScore(saved) || getRelationshipScore(winner.id, replacement.id) < getRelationshipScore(winner.id, saved.id))) {
            nominees = nominees.map(n => n.id === saved.id ? replacement : n);
            replacementNominee = replacement;
            hackerPower.replacementUsed = true;
            addEvent(`The H@cker anonymously replaced ${getDisplayName(saved)} with ${getDisplayName(replacement)}.`, "twist");
        }
    }
    currentStage = "pov";
}

function runPOV() {
    const active = getActiveHouseguests();
    const event = getCompetitionEvent("pov");
    const guaranteed = [findPlayer(currentHOH), ...nominees].filter(Boolean);
    const randomPool = active.filter(p => !guaranteed.some(g => g.id === p.id));
    const extras = randomPool.slice().sort(() => Math.random() - 0.5).slice(0, Math.max(0, 6 - guaranteed.length));
    povPlayers = [...guaranteed, ...extras];

    if (hackerWinner && !hackerPower.vetoPickUsed && currentWeek >= 6 && currentWeek <= 7) {
        const hacker = findPlayer(hackerWinner);
        const hackerEligible = randomPool.filter(p => !povPlayers.some(v => v.id === p.id));
        if (hacker && hackerEligible.length && povPlayers.length >= 6) {
            const weakest = povPlayers.slice(3).sort((a, b) => scoreCompetition(a, event?.category || "overall", false) - scoreCompetition(b, event?.category || "overall", false))[0];
            const selected = hackerEligible.slice().sort((a, b) => scoreCompetition(b, event?.category || "overall") - scoreCompetition(a, event?.category || "overall"))[0];
            if (weakest && selected && selected.id !== weakest.id) {
                povPlayers[povPlayers.indexOf(weakest)] = selected;
                hackerPower.vetoPickUsed = true;
                addEvent(`${getDisplayName(hacker)} used the H@cker power to select ${getDisplayName(selected)} as a Veto player.`, "twist");
            }
        }
    }
    const names = povPlayers.map(getDisplayName).join(", ");
    addEvent(`Veto players: ${names}.`, "veto-draw");
    povWinner = determineCompetitionWinner(povPlayers, event?.category || "overall", event?.name || "Power of Veto");
    if (!povWinner) return;
    povWinner.povWins++;
    povWinner.competitionWins++;
    addEvent(`${getDisplayName(povWinner)} won the Power of Veto${event?.name ? ` (${event.name})` : ""}.`, "competition");
    currentStage = "veto";
}

function usePOV() {
    if (!nominees.length || !povWinner) { currentStage = "eviction"; return; }
    const nomineeWinner = nominees.find(n => n.id === povWinner.id);
    if (!nomineeWinner) {
        addEvent(`${getDisplayName(povWinner)} won the Power of Veto and kept nominations the same.`, "veto");
        currentStage = "eviction";
        return;
    }
    const hoh = findPlayer(currentHOH);
    const savedThreat = getThreatScore(nomineeWinner);
    const replacementCandidates = getActiveHouseguests().filter(p => p.id !== currentHOH && p.id !== povWinner.id && !nominees.some(n => n.id === p.id) && !isProtectedFromNomination(p));
    const replacement = rankNominationTargets(hoh, replacementCandidates)[0]?.player;
    const usesVeto = replacement && (povWinner.loyalty + povWinner.social + povWinner.strategic >= 20 || savedThreat > getThreatScore(replacement) + 8 || getRelationshipScore(povWinner.id, nomineeWinner.id) > 30);
    if (usesVeto) {
        nominees = nominees.map(n => n.id === nomineeWinner.id ? replacement : n);
        replacementNominee = replacement;
        addEvent(`${getDisplayName(povWinner)} used the Power of Veto on ${getDisplayName(nomineeWinner)}. ${getDisplayName(replacement)} is the replacement nominee.`, "veto");
    } else {
        addEvent(`${getDisplayName(povWinner)} chose not to use the Power of Veto.`, "veto");
    }
    currentStage = "eviction";
}

function voteScore(voter, target) {
    const relationship = getRelationshipScore(voter.id, target.id);
    const targetToVoter = getRelationshipScore(target.id, voter.id);
    const alliance = getAllianceBetween(voter, target);
    const threat = getThreatScore(target);
    const targetSocial = getSocialSafetyScore(target);
    const targetLoyalty = target.loyalty;
    const fear = voter.temperament < 5 ? Math.max(0, threat - 45) * 0.45 : Math.max(0, threat - 60) * 0.25;
    const betrayal = Math.max(0, -relationship) * 0.8 + Math.max(0, -targetToVoter) * 0.25;
    const allianceBonus = alliance ? (alliance.strength === 'unbreakable' ? 75 : alliance.strength === 'strong' ? 55 : 35) : 0;
    const loyaltyBonus = targetLoyalty * 1.3;
    const socialPenalty = targetSocial * 0.25;
    return betrayal + fear + socialPenalty - allianceBonus - loyaltyBonus + relationship * 0.2 + randomFloat(-8, 8);
}

function prepareEvictionVotes() {
    if (nominees.length < 2) { currentStage = "evictionReveal"; return; }
    const voters = getActiveHouseguests().filter(p => p.id !== currentHOH && !nominees.some(n => n.id === p.id));
    const counts = Object.fromEntries(nominees.map(n => [n.id, 0]));
    evictionVotes = {};
    voters.forEach(voter => {
        const ranked = nominees.map(target => ({ target, score: voteScore(voter, target) })).sort((a, b) => b.score - a.score);
        const target = ranked[0]?.target;
        if (target) {
            evictionVotes[voter.id] = target.id;
            counts[target.id]++;
            voter.votesReceived = voter.votesReceived || 0;
            addEvent(`${getDisplayName(voter)} voted to evict ${getDisplayName(target)}.`, "vote-detail");
        }
    });

    if (hackerWinner && !hackerPower.voteNullified && currentWeek >= 6 && currentWeek <= 7) {
        const hacker = findPlayer(hackerWinner);
        const hackerVote = hacker && evictionVotes[hacker.id];
        if (hackerVote) {
            counts[hackerVote] = Math.max(0, counts[hackerVote] - 1);
            delete evictionVotes[hacker.id];
            hackerPower.voteNullified = true;
            addEvent(`${getDisplayName(hacker)} nullified one eviction vote with the H@cker power.`, "twist");
        }
    }
    const first = counts[nominees[0].id] || 0;
    const second = counts[nominees[1].id] || 0;
    let target;
    if (first === second) {
        const hoh = findPlayer(currentHOH);
        target = [nominees[0], nominees[1]].sort((a,b) => voteScore(hoh, b) - voteScore(hoh, a))[0];
        addEvent(`The vote is tied ${first}-${second}. ${getDisplayName(hoh)} must break the tie.`, "eviction");
        addEvent(`${getDisplayName(hoh)} cast the deciding vote to evict ${getDisplayName(target)}.`, "vote");
    } else {
        target = first > second ? nominees[0] : nominees[1];
    }
    target.votesReceived = Number(target.votesReceived || 0) + (counts[target.id] || 0);
    currentEvictionTarget = target?.id || null;
    addEvent(`Eviction vote: ${getDisplayName(nominees[0])} received ${first} vote(s); ${getDisplayName(nominees[1])} received ${second} vote(s).`, "vote-summary");
    addEvent(`${getDisplayName(target)} is evicted.`, "vote-result");
    currentStage = "evictionReveal";
}

function executeEviction() {
    const target = findPlayer(currentEvictionTarget);
    if (!target) return;
    const remainingBefore = getActiveHouseguests().length;
    target.status = "Evicted"; target.inGame = false; target.evicted = true; target.evictionWeek = currentWeek; target.placement = remainingBefore;
    evictedHouseguests.push(target);
    const template = getCurrentSeasonTemplate();
    const juryThreshold = Number(template?.juryStartAfterEvictions ?? 7);
    if (evictedHouseguests.length > juryThreshold && jury.length < Number(template?.jurySize || 9)) {
        target.juryMember = true; jury.push(target);
        addEvent(`${getDisplayName(target)} joined the jury.`, "jury");
        maybeRunBattleBack();
    }
    addEvent(`${getDisplayName(target)} was evicted from the Big Brother house.`, "eviction");
    currentEvictedPlayer = target;
    evolveRelationshipsAfterEvent();
    if (bonusLifeEligible === target.id && evictedHouseguests.length <= 4) {
        const returnScore = scoreCompetition(target, "overall") + randomFloat(-5,5);
        const best = [target, ...evictedHouseguests.filter(p => p.id !== target.id).slice(-3)].sort((a,b)=>scoreCompetition(b,"overall")-scoreCompetition(a,"overall"))[0];
        if (best?.id === target.id || returnScore > 65) {
            target.status = "Active"; target.inGame = true; target.evicted = false; target.placement = null;
            evictedHouseguests.splice(evictedHouseguests.indexOf(target),1);
            addEvent(`${getDisplayName(target)} used the Bonus Life and returned to the game!`, "twist");
        }
        bonusLifeEligible = null;
    }
    nominees=[]; povPlayers=[]; povWinner=null; replacementNominee=null; currentEvictionTarget=null;
    outgoingHOH = currentHOH; currentHOH=null;
    if (getActiveHouseguests().length === 2) { currentStage="finale"; return finishSeason(); }
    if (getActiveHouseguests().length === 3) { currentStage="finalHOH1"; return; }
    if (template?.competitions?.[currentWeek]?.doubleEviction || template?.competitions?.[currentWeek]?.secondHOH) {
        if (currentCycle === 1) { pendingSecondCycle=true; currentCycle=2; currentStage="hoh"; addEvent("The double eviction continues with a second HOH competition.", "season"); return; }
    }
    currentCycle=1; pendingSecondCycle=false; currentWeek++; currentStage="hoh"; outgoingHOH=null;
    addEvent(`Week ${currentWeek} begins.`, "season");
}

function runFinalHOHPart(part) {
    const finalists = getActiveHouseguests();
    if (finalists.length !== 3 && part < 3) return;
    const event = getCurrentSeasonTemplate()?.competitions?.[13]?.finalHOH?.[part-1];
    if (part === 1) finalHOH.part1 = determineCompetitionWinner(finalists, event?.category || "endurance", event?.name || "Final HOH Part 1");
    if (part === 2) {
        const players = finalists.filter(p => p.id !== finalHOH.part1?.id);
        finalHOH.part2 = determineCompetitionWinner(players, event?.category || "mental", event?.name || "Final HOH Part 2");
    }
    if (part === 3) {
        const players = finalists.filter(p => p.id !== finalHOH.part2?.id);
        finalHOH.part3 = determineCompetitionWinner(players, event?.category || "strategic", event?.name || "Final HOH Part 3");
        finalHOH.winner = finalHOH.part3;
        addEvent(`${getDisplayName(finalHOH.winner)} won Final HOH Part 3 and controls the final eviction.`, "finale");
        currentStage="finalVote"; return;
    }
    addEvent(`${getDisplayName(part === 1 ? finalHOH.part1 : finalHOH.part2)} won Final HOH Part ${part} (${event?.name || "Final HOH"}).`, "finale");
    currentStage = part === 1 ? "finalHOH2" : "finalHOH3";
}

function finishSeason() {
    const finalists = getActiveHouseguests();
    if (finalists.length > 3) return;
    if (finalists.length === 3 && !finalHOH.winner) { currentStage="finalHOH1"; return; }
    if (finalists.length <= 2 && !finaleWinner) {
        const ordered = finalists.slice().sort((a,b)=>(b.strategic+b.social+b.loyalty)-(a.strategic+a.social+a.loyalty));
        finaleWinner = ordered[0];
        if (finaleWinner) { finaleWinner.status="Winner"; finaleWinner.inGame=false; finaleWinner.placement=1; }
    }
    if (finaleWinner) {
        const others = houseguests.filter(p => p.id !== finaleWinner.id && p.status === "Active");
        others.forEach((p,i)=>{ p.status="Finalist"; p.inGame=false; p.placement=i+2; });
        const juryPool = jury.filter(p=>p.id !== finaleWinner.id && p.status !== "Winner");
        juryVotes={};
        const candidates = [finaleWinner, ...others];
        juryPool.forEach(j => {
            const ranked=candidates.slice().sort((a,b)=>{
                const scoreA = getRelationshipScore(j.id,a.id)*0.65 + getRelationshipScore(a.id,j.id)*0.25 + a.strategic*1.5 + a.social*1.4 + a.loyalty*0.7 + getThreatScore(a)*0.12 + randomFloat(-5,5);
                const scoreB = getRelationshipScore(j.id,b.id)*0.65 + getRelationshipScore(b.id,j.id)*0.25 + b.strategic*1.5 + b.social*1.4 + b.loyalty*0.7 + getThreatScore(b)*0.12 + randomFloat(-5,5);
                return scoreB-scoreA;
            });
            juryVotes[j.id]=ranked[0]?.id;
        });
        const counts={}; Object.values(juryVotes).forEach(id=>counts[id]=(counts[id]||0)+1);
        const winnerId=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0];
        if (winnerId) {
            finaleWinner=findPlayer(winnerId); finaleWinner.status="Winner"; finaleWinner.placement=1;
            finalists.filter(p=>p.id!==winnerId).forEach((p,i)=>{p.status="Finalist";p.inGame=false;p.placement=i+2;});
        }
        seasonFinished=true; seasonStarted=true; currentStage="finished";
        addEvent(`${getDisplayName(finaleWinner)} won ${seasonName} by a jury vote.`, "finale");
    }
}

function maybeRunBattleBack() {
    const template=getCurrentSeasonTemplate();
    if (battleBackCompleted || jury.length !== Number(template?.juryBattleBackAfterJurors || 4)) return;
    const candidates=jury.slice(0,4).filter(p=>p.status === "Evicted");
    if (candidates.length < 4) return;
    const winner=determineCompetitionWinner(candidates,"physical");
    winner.status="Active"; winner.inGame=true; winner.juryMember=false; winner.placement=null;
    const idx=evictedHouseguests.indexOf(winner); if(idx>=0) evictedHouseguests.splice(idx,1);
    jury=jury.filter(p=>p.id!==winner.id);
    battleBackCompleted=true;
    addEvent(`${getDisplayName(winner)} won the Jury Battle Back (${template.twists.juryBattleBack.competition}) and returned to the game.`, "twist");
}

function proceedGame() {
    if (!seasonStarted) { alert("Start a season first."); return; }
    if (seasonFinished) { showSection("finale"); return; }
    switch(currentStage) {
        case "opening": currentStage="hoh"; addEvent("The first HOH competition begins.","competition"); break;
        case "hoh": runHOH(); break;
        case "nominations": makeNominations(); break;
        case "hacker": runHacker(); break;
        case "pov": runPOV(); break;
        case "veto": usePOV(); break;
        case "eviction": prepareEvictionVotes(); break;
        case "evictionReveal": executeEviction(); break;
        case "finalHOH1": runFinalHOHPart(1); break;
        case "finalHOH2": runFinalHOHPart(2); break;
        case "finalHOH3": runFinalHOHPart(3); break;
        case "finalVote": {
            const winner=finalHOH.winner;
            const others=getActiveHouseguests().filter(p=>p.id!==winner.id);
            if(others.length) { const evict=others.slice().sort((a,b)=>voteScore(winner,b)-voteScore(winner,a))[0]; evict.status="Evicted"; evict.inGame=false; evict.placement=3; addEvent(`${getDisplayName(winner)} evicted ${getDisplayName(evict)} at the Final 3.`,"finale"); }
            currentStage="finale"; break;
        }
        case "finale": finishSeason(); break;
        default: currentStage="hoh";
    }
    updateAllDisplays(); saveGameSilently();
}

function skipToEnd() {
    if (!seasonStarted) { alert("Start a season first."); return; }
    let guard=0;
    while(!seasonFinished && guard++<500) {
        const before=currentStage;
        proceedGame();
        if (currentStage===before && before!=="finished") currentStage="hoh";
    }
    updateAllDisplays(); saveGameSilently(); showSection("finale");
}

function updateSeasonSummary() {
    const summary = $("seasonSummary");
    if (!summary) return;
    const active = getActiveHouseguests().length;
    summary.innerHTML = `
        <div><strong>Format</strong><span>${escapeHTML(seasonName)}</span></div>
        <div><strong>Houseguests</strong><span>${houseguests.length}</span></div>
        <div><strong>Active</strong><span>${active}</span></div>
        <div><strong>Evicted</strong><span>${evictedHouseguests.length}</span></div>
        <div><strong>Jury</strong><span>${jury.length}</span></div>
        <div><strong>Status</strong><span>${seasonFinished ? "Finished" : seasonStarted ? `Week ${currentWeek}` : "Not started"}</span></div>`;
}

function getSaveState() {
    return {
        version: 4,
        houseguests, evictedHouseguests, jury, alliances, relationships, customTwists, eventLog,
        selectedSeasonTemplate, seasonName, seasonFormat, seasonStarted, seasonFinished,
        currentWeek, currentCycle, currentStage, currentHOH, nominees: nominees.map(p => p.id),
        povPlayers: povPlayers.map(p => p.id), povWinner: povWinner?.id || null, hackerWinner,
        replacementNominee: replacementNominee?.id || null, evictionVotes, currentEvictionTarget,
        currentEvictedPlayer: currentEvictedPlayer?.id || null, outgoingHOH, hackerPower, appStoreHistory, bonusLifeEligible, battleBackCompleted, pendingSecondCycle, finaleWinner: finaleWinner?.id || null,
        finalHOH, juryVotes, juryVoteRevealIndex
    };
}

function saveGameSilently() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(getSaveState())); } catch (error) { console.warn("Could not save game", error); }
}

function saveGame() {
    saveGameSilently();
    alert("Game saved in this browser.");
}

function restoreReferences(state) {
    nominees = (state.nominees || []).map(findPlayer).filter(Boolean);
    povPlayers = (state.povPlayers || []).map(findPlayer).filter(Boolean);
    povWinner = findPlayer(state.povWinner);
    replacementNominee = findPlayer(state.replacementNominee);
    currentEvictedPlayer = findPlayer(state.currentEvictedPlayer);
    finaleWinner = findPlayer(state.finaleWinner);
    outgoingHOH = state.outgoingHOH || null; hackerPower = state.hackerPower || {replacementUsed:false,vetoPickUsed:false,voteNullified:false};
    appStoreHistory = state.appStoreHistory || []; bonusLifeEligible = state.bonusLifeEligible || null; battleBackCompleted = Boolean(state.battleBackCompleted); pendingSecondCycle = Boolean(state.pendingSecondCycle);
}

function loadGame() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) { alert("No saved game was found in this browser."); return; }
        const state = JSON.parse(raw);
        houseguests = (state.houseguests || []).map(normalizeHouseguest);
        evictedHouseguests = state.evictedHouseguests || [];
        jury = state.jury || [];
        alliances = state.alliances || [];
        relationships = state.relationships || [];
        customTwists = state.customTwists || [];
        eventLog = state.eventLog || [];
        selectedSeasonTemplate = state.selectedSeasonTemplate || "bb20";
        if ($("seasonSelect")) $("seasonSelect").value = selectedSeasonTemplate;
        seasonName = state.seasonName || "Big Brother 20";
        seasonFormat = state.seasonFormat || selectedSeasonTemplate;
        seasonStarted = Boolean(state.seasonStarted);
        seasonFinished = Boolean(state.seasonFinished);
        currentWeek = Number(state.currentWeek || 1);
        currentCycle = Number(state.currentCycle || 1);
        currentStage = state.currentStage || "opening";
        currentHOH = state.currentHOH || null;
        hackerWinner = state.hackerWinner || null;
        evictionVotes = state.evictionVotes || {};
        currentEvictionTarget = state.currentEvictionTarget || null;
        finalHOH = state.finalHOH || { part1: null, part2: null, part3: null, winner: null };
        juryVotes = state.juryVotes || {};
        juryVoteRevealIndex = Number(state.juryVoteRevealIndex || 0);
        restoreReferences(state);
        updateAllDisplays();
        alert("Saved game loaded.");
    } catch (error) {
        console.error(error);
        alert("The saved game could not be loaded.");
    }
}

function resetGame() {
    if (!confirm("Reset the entire simulator, including the cast and saved game?")) return;
    localStorage.removeItem(STORAGE_KEY);
    houseguests = [];
    evictedHouseguests = [];
    jury = [];
    alliances = [];
    relationships = [];
    customTwists = [];
    eventLog = [];
    selectedSeasonTemplate = "bb20";
    if ($("seasonSelect")) $("seasonSelect").value = "bb20";
    seasonName = "Big Brother 20";
    seasonFormat = "bb20";
    seasonStarted = false;
    seasonFinished = false;
    currentWeek = 1;
    currentStage = "opening";
    currentHOH = null;
    nominees = [];
    povPlayers = [];
    povWinner = null;
    currentEvictionTarget = null;
    finaleWinner = null;
    clearHouseguestEditor();
    updateAllDisplays();
    showSection("home");
}

function initialize() {
    if (!window.BB_SEASON_REGISTRY && window.BB20) window.BB_SEASON_REGISTRY = { bb20: window.BB20 };
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const state = JSON.parse(saved);
            if (state?.houseguests?.length) {
                // Do not silently load a game.  Keep the editor safe and let LOAD do it.
                houseguests = state.houseguests.map(normalizeHouseguest);
                relationships = state.relationships || [];
                alliances = state.alliances || [];
                customTwists = state.customTwists || [];
            }
        } catch (_) {}
    }
    if ($("seasonSelect")) $("seasonSelect").value = selectedSeasonTemplate;
    STAT_KEYS.forEach(key => $(key)?.addEventListener("input", () => updateStatValue(key)));
    $("relationshipFrom")?.addEventListener("change", updateRelationshipPreviews);
    $("relationshipTo")?.addEventListener("change", updateRelationshipPreviews);
    updateAllStatDisplays();
    updateAllDisplays();
}

document.addEventListener("DOMContentLoaded", initialize);
