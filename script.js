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

const STORAGE_KEY = "bb-simulator-stage1-v1";

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
        pov: { name: "Power of Veto", title: "POV Competition", icon: "🏆", description: "Six eligible Houseguests compete for the Power of Veto." },
        veto: { name: "Veto Ceremony", title: "Veto Ceremony", icon: "🛡️", description: "The POV winner decides whether to use the Veto." },
        eviction: { name: "Eviction", title: "Eviction", icon: "🚪", description: "The House votes to evict one nominee." },
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
        format.textContent = data?.doubleEviction ? "DOUBLE EVICTION" : "NORMAL WEEK";
    }
}

/* Stage 1 simulation pipeline.  This is deliberately simple: the engine is
   stable and stat-aware now; Stage 2 will replace each event with the exact
   BB20 competition/twist mechanics without changing the UI state model. */
function scoreCompetition(player, category = "overall") {
    const weights = {
        general: { general: 0.55, mental: 0.15, physical: 0.10, endurance: 0.10, strategic: 0.10 },
        physical: { physical: 0.55, endurance: 0.25, general: 0.10, mental: 0.10 },
        endurance: { endurance: 0.65, physical: 0.20, general: 0.10, temperament: 0.05 },
        mental: { mental: 0.60, strategic: 0.20, general: 0.15, temperament: 0.05 },
        strategic: { strategic: 0.60, mental: 0.20, social: 0.10, general: 0.10 },
        overall: { general: 0.25, physical: 0.10, endurance: 0.10, mental: 0.15, strategic: 0.15, social: 0.10, loyalty: 0.05, temperament: 0.10 }
    };
    const map = weights[category] || weights.overall;
    let score = 0;
    let total = 0;
    for (const [key, weight] of Object.entries(map)) { score += player[key] * weight; total += weight; }
    return (score / total) * 10 + randomFloat(-8, 8);
}

function determineCompetitionWinner(players, category = "overall") {
    return players.map(p => ({ player: p, score: scoreCompetition(p, category) })).sort((a, b) => b.score - a.score)[0]?.player || null;
}

function runHOH() {
    const players = getActiveHouseguests();
    if (players.length < 2) return finishSeason();
    const data = getWeekData();
    const category = data?.hohCategory || "overall";
    const winner = determineCompetitionWinner(players, category);
    currentHOH = winner.id;
    winner.hohWins++;
    winner.competitionWins++;
    winner.safety = true;
    addEvent(`${getDisplayName(winner)} won HOH${data?.hoh ? ` (${data.hoh})` : ""}.`, "competition");
    currentStage = "nominations";
}

function calculateNominationScore(hoh, target) {
    const relationship = getRelationshipScore(hoh.id, target.id);
    const alliancePenalty = alliances.some(a => a.members.includes(hoh.id) && a.members.includes(target.id)) ? -35 : 0;
    const threat = target.strategic * 5 + target.physical * 2 + target.mental * 2;
    const loyalty = target.loyalty * 2;
    const temperament = target.temperament;
    return -relationship + alliancePenalty + threat + (10 - loyalty) * 2 + (10 - temperament) + randomFloat(-15, 15);
}

function makeNominations() {
    const hoh = findPlayer(currentHOH);
    const candidates = getActiveHouseguests().filter(p => p.id !== currentHOH);
    if (!hoh || candidates.length < 2) return;
    const ranked = candidates.map(p => ({ player: p, score: calculateNominationScore(hoh, p) })).sort((a, b) => b.score - a.score);
    nominees = ranked.slice(0, 2).map(x => x.player);
    nominees.forEach(p => p.safety = false);
    addEvent(`${getDisplayName(hoh)} nominated ${getDisplayName(nominees[0])} and ${getDisplayName(nominees[1])}.`, "nomination");
    currentStage = "pov";
}

function runPOV() {
    const eligible = getActiveHouseguests();
    const data = getWeekData();
    const count = Math.min(6, eligible.length);
    const pool = eligible.slice().sort(() => Math.random() - 0.5).slice(0, count);
    if (currentHOH && !pool.some(p => p.id === currentHOH)) pool[0] = findPlayer(currentHOH);
    povPlayers = pool;
    povWinner = determineCompetitionWinner(pool, data?.povCategory || "overall");
    povWinner.povWins++;
    povWinner.competitionWins++;
    addEvent(`${getDisplayName(povWinner)} won the Power of Veto${data?.pov ? ` (${data.pov})` : ""}.`, "competition");
    currentStage = "veto";
}

function usePOV() {
    if (!nominees.length) { currentStage = "eviction"; return; }
    if (povWinner && nominees.some(p => p.id === povWinner.id)) {
        const candidates = getActiveHouseguests().filter(p => p.id !== currentHOH && !nominees.some(n => n.id === p.id));
        if (candidates.length) {
            candidates.sort((a, b) => calculateNominationScore(findPlayer(currentHOH), b) - calculateNominationScore(findPlayer(currentHOH), a));
            replacementNominee = candidates[0];
            nominees = [nominees.find(n => n.id !== povWinner.id), replacementNominee];
            addEvent(`${getDisplayName(povWinner)} used the Power of Veto. ${getDisplayName(replacementNominee)} became the replacement nominee.`, "veto");
        } else {
            addEvent(`${getDisplayName(povWinner)} won the Veto but did not change the nominees.`, "veto");
        }
    } else {
        addEvent(`${getDisplayName(povWinner)} did not use the Power of Veto.`, "veto");
    }
    currentStage = "eviction";
}

function prepareEvictionVotes() {
    const voters = getActiveHouseguests().filter(p => p.id !== currentHOH && !nominees.some(n => n.id === p.id));
    const scores = {};
    nominees.forEach(target => {
        scores[target.id] = 0;
        voters.forEach(voter => {
            const relationship = getRelationshipScore(voter.id, target.id);
            const alliance = alliances.some(a => a.members.includes(voter.id) && a.members.includes(target.id));
            scores[target.id] += relationship + (alliance ? 40 : 0) + randomFloat(-20, 20);
        });
    });
    const target = nominees.slice().sort((a, b) => scores[a.id] - scores[b.id])[0];
    currentEvictionTarget = target?.id || null;
    evictionVotes = {};
    voters.forEach(voter => { evictionVotes[voter.id] = currentEvictionTarget; });
    currentStage = "eviction";
}

function executeEviction() {
    const target = findPlayer(currentEvictionTarget);
    if (!target) return;
    target.status = "Evicted";
    target.inGame = false;
    target.evicted = true;
    target.evictionWeek = currentWeek;
    target.placement = getActiveHouseguests().length + 1;
    evictedHouseguests.push(target);
    const template = getCurrentSeasonTemplate();
    const juryThreshold = Number(template?.juryStartAfterEvictions ?? 7);
    if (evictedHouseguests.length <= juryThreshold && jury.length < Number(template?.jurySize || 9)) {
        target.juryMember = true;
        jury.push(target);
    }
    addEvent(`${getDisplayName(target)} was evicted from the Big Brother house.`, "eviction");
    currentEvictedPlayer = target;
    nominees = [];
    povPlayers = [];
    povWinner = null;
    replacementNominee = null;
    currentHOH = null;
    if (getActiveHouseguests().length <= 2) finishSeason();
    else currentStage = "nextWeek";
}

function proceedGame() {
    if (!seasonStarted) { alert("Start a season first."); return; }
    if (seasonFinished) { showSection("finale"); return; }
    switch (currentStage) {
        case "opening": currentStage = "hoh"; addEvent("The first HOH competition begins.", "competition"); break;
        case "hoh": runHOH(); break;
        case "nominations": makeNominations(); break;
        case "pov": runPOV(); break;
        case "veto": usePOV(); break;
        case "eviction": if (!currentEvictionTarget) prepareEvictionVotes(); else executeEviction(); break;
        case "nextWeek": currentWeek++; currentCycle = 1; currentHOH = null; nominees = []; povPlayers = []; povWinner = null; currentEvictionTarget = null; currentStage = "hoh"; addEvent(`Week ${currentWeek} begins.`, "season"); break;
        default: currentStage = "hoh";
    }
    updateAllDisplays();
    saveGameSilently();
}

function skipToEnd() {
    if (!seasonStarted) { alert("Start a season first."); return; }
    let guard = 0;
    while (!seasonFinished && guard++ < 500) {
        switch (currentStage) {
            case "opening": currentStage = "hoh"; break;
            case "hoh": runHOH(); break;
            case "nominations": makeNominations(); break;
            case "pov": runPOV(); break;
            case "veto": usePOV(); break;
            case "eviction": if (!currentEvictionTarget) prepareEvictionVotes(); else executeEviction(); break;
            case "nextWeek": currentWeek++; currentHOH = null; currentEvictionTarget = null; currentStage = "hoh"; break;
            default: finishSeason(); break;
        }
    }
    updateAllDisplays();
    saveGameSilently();
    showSection("finale");
}

function finishSeason() {
    const remaining = getActiveHouseguests();
    if (remaining.length) {
        remaining.forEach(p => { p.status = "Evicted"; p.inGame = false; });
        const ordered = remaining.slice().sort((a, b) => (b.strategic + b.social + b.loyalty) - (a.strategic + a.social + a.loyalty));
        finaleWinner = ordered[0] || remaining[0];
        finaleWinner.status = "Winner";
        finaleWinner.inGame = false;
        finaleWinner.placement = 1;
        ordered.slice(1).forEach((p, i) => p.placement = i + 2);
    }
    seasonFinished = true;
    seasonStarted = true;
    currentStage = "finished";
    addEvent(`${getDisplayName(finaleWinner)} won ${seasonName}!`, "finale");
}

function showFinale() {
    const container = $("finaleContent");
    if (!container) return;
    if (!finaleWinner) {
        container.innerHTML = `<div class="empty-state">The finale has not been reached yet.</div>`;
        return;
    }
    container.innerHTML = `<div class="final-stage-card panel"><h2>${escapeHTML(seasonName)} Winner</h2><div class="final-winner">${getPlayerImageHTML(finaleWinner, "final-winner-image")}<h1>${escapeHTML(getDisplayName(finaleWinner))}</h1></div></div>`;
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
        version: 1,
        houseguests, evictedHouseguests, jury, alliances, relationships, customTwists, eventLog,
        selectedSeasonTemplate, seasonName, seasonFormat, seasonStarted, seasonFinished,
        currentWeek, currentCycle, currentStage, currentHOH, nominees: nominees.map(p => p.id),
        povPlayers: povPlayers.map(p => p.id), povWinner: povWinner?.id || null, hackerWinner,
        replacementNominee: replacementNominee?.id || null, evictionVotes, currentEvictionTarget,
        currentEvictedPlayer: currentEvictedPlayer?.id || null, finaleWinner: finaleWinner?.id || null,
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
