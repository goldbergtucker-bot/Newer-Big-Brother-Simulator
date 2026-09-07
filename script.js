/* =========================================================
   BIG BROTHER SIMULATOR
   BB20 ENGINE
========================================================= */


/* =========================================================
   GLOBAL GAME STATE
========================================================= */

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

let povPlayers = [];

let hackerWinner = null;

let hackerVoteNullified = null;

let seasonStarted = false;

let selectedSeasonTemplate = "bb20";

let currentStage = "start";

let evictionHistory = [];

let appStoreRecipients = [];

let battleBackUsed = false;


/* =========================================================
   SEASON TEMPLATES
========================================================= */

const seasonTemplates = {

    custom: {

        name: "Custom Big Brother",

        year: "Custom",

        description:
            "Create your own Big Brother format.",

        startingPlayers: 16,

        nominationCount: 2,

        juryStartWeek: 6

    },


    bb19: {

        name: "Big Brother 19",

        year: 2017,

        description:
            "A custom cast playing a BB19-inspired format.",

        startingPlayers: 16,

        nominationCount: 2,

        juryStartWeek: 6

    },


    bb20: {

        name: "Big Brother 20",

        year: 2018,

        description:
            "A custom cast playing the Big Brother 20 format.",

        startingPlayers: 16,

        nominationCount: 2,

        juryStartWeek: 6

    },


    bb23: {

        name: "Big Brother 23",

        year: 2021,

        description:
            "A custom cast playing a BB23-inspired format.",

        startingPlayers: 16,

        nominationCount: 2,

        juryStartWeek: 6

    },


    bb24: {

        name: "Big Brother 24",

        year: 2022,

        description:
            "A custom cast playing a BB24-inspired format.",

        startingPlayers: 16,

        nominationCount: 2,

        juryStartWeek: 6

    },


    bb25: {

        name: "Big Brother 25",

        year: 2023,

        description:
            "A custom cast playing a BB25-inspired format.",

        startingPlayers: 17,

        nominationCount: 2,

        juryStartWeek: 6

    },


    bb26: {

        name: "Big Brother 26",

        year: 2024,

        description:
            "A custom cast playing a BB26-inspired format.",

        startingPlayers: 16,

        nominationCount: 3,

        juryStartWeek: 5

    }

};


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(sectionName) {

    document
        .querySelectorAll(".page-section")
        .forEach(section => {

            section.classList.remove("active");

        });


    const section =
        document.getElementById(sectionName);


    if (section) {

        section.classList.add("active");

    }


    updateAllDisplays();

}


/* =========================================================
   SEASON SELECTION
========================================================= */

function selectSeasonTemplate() {

    const selector =
        document.getElementById("seasonTemplate");


    selectedSeasonTemplate =
        selector.value;


    updateSelectedSeasonInfo();


    addEvent(
        "Season format selected: " +
        seasonTemplates[selectedSeasonTemplate].name
    );


    updateAllDisplays();

}


function updateSelectedSeasonInfo() {

    const info =
        document.getElementById("selectedSeasonInfo");


    if (!info) return;


    const template =
        seasonTemplates[selectedSeasonTemplate];


    if (!template) return;


    let competitionHTML = "";


    if (selectedSeasonTemplate === "bb20") {

        competitionHTML = `

            <h4>BB20 Competitions</h4>

            <div class="template-twist-grid">

                ${Object.keys(BB20.competitions)
                    .map(week => {

                        const comp =
                            BB20.competitions[week];

                        return `

                            <div class="competition-chip">

                                <strong>
                                    Week ${week}
                                </strong>

                                <span>
                                    ${comp.hoh || comp.finalHOH?.join(" → ")}
                                </span>

                                ${
                                    comp.pov
                                        ? `<small>POV: ${comp.pov}</small>`
                                        : ""
                                }

                            </div>

                        `;

                    })
                    .join("")}

            </div>

        `;

    }


    info.innerHTML = `

        <h3>
            ${escapeHTML(template.name)}
        </h3>

        <p>
            ${escapeHTML(template.description)}
        </p>

        <p>
            <strong>
                Starting Cast:
            </strong>

            ${template.startingPlayers}
        </p>

        ${competitionHTML}

    `;


    const hero =
        document.getElementById("heroFormat");


    if (hero) {

        hero.textContent =
            template.name.toUpperCase();

    }

}


/* =========================================================
   CAST
========================================================= */

function addHouseguest() {

    const name =
        document.getElementById("nameInput")
            .value
            .trim();


    if (!name) {

        alert("Enter a houseguest name.");

        return;

    }


    const image =
        document.getElementById("imageInput")
            .value
            .trim();


    const physical =
        clamp(
            Number(
                document.getElementById("physicalInput").value
            ) || 5,
            1,
            10
        );


    const mental =
        clamp(
            Number(
                document.getElementById("mentalInput").value
            ) || 5,
            1,
            10
        );


    const social =
        clamp(
            Number(
                document.getElementById("socialInput").value
            ) || 5,
            1,
            10
        );


    const strategy =
        clamp(
            Number(
                document.getElementById("strategyInput").value
            ) || 5,
            1,
            10
        );


    const player = {

        id:
            Date.now() +
            Math.random(),

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

        hackerWins: 0

    };


    houseguests.push(player);


    document.getElementById("nameInput").value = "";

    document.getElementById("imageInput").value = "";

    document.getElementById("physicalInput").value = "";

    document.getElementById("mentalInput").value = "";

    document.getElementById("socialInput").value = "";

    document.getElementById("strategyInput").value = "";


    addEvent(
        `${name} has entered the Big Brother House.`
    );


    updateAllDisplays();

}


function renderCast() {

    const grid =
        document.getElementById("castGrid");


    if (!grid) return;


    grid.innerHTML = "";


    houseguests.forEach(player => {

        const card =
            document.createElement("div");


        card.className =
            "cast-card";


        card.innerHTML = `

            <div class="cast-image-wrapper">

                ${getPlayerImageHTML(player)}

            </div>

            <h3>
                ${escapeHTML(player.name)}
            </h3>

            <div class="player-stats">

                <span>
                    Physical ${player.physical}
                </span>

                <span>
                    Mental ${player.mental}
                </span>

                <span>
                    Social ${player.social}
                </span>

                <span>
                    Strategy ${player.strategy}
                </span>

            </div>

            <div class="player-status ${player.status.toLowerCase()}">

                ${escapeHTML(player.status)}

            </div>

        `;


        grid.appendChild(card);

    });


    const count =
        document.getElementById("castCount");


    if (count) {

        count.textContent =
            houseguests.length;

    }

}


/* =========================================================
   IMAGE SYSTEM
========================================================= */

function getPlayerImageHTML(player) {

    if (player.image) {

        return `

            <img
                class="player-photo"
                src="${escapeAttribute(player.image)}"
                alt="${escapeAttribute(player.name)}"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
            >

            <div
                class="image-placeholder"
                style="display:none;"
            >
                ${getInitials(player.name)}
            </div>

        `;

    }


    return `

        <div class="image-placeholder">

            ${getInitials(player.name)}

        </div>

    `;

}


function getInitials(name) {

    return name
        .split(" ")
        .map(word => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

}


/* =========================================================
   TWISTS
========================================================= */

function createTwist() {

    const name =
        document
            .getElementById("twistNameInput")
            .value
            .trim();


    const description =
        document
            .getElementById("twistDescriptionInput")
            .value
            .trim();


    if (!name) {

        alert("Enter a twist name.");

        return;

    }


    customTwists.push({

        name,

        description

    });


    document.getElementById("twistNameInput").value = "";

    document.getElementById("twistDescriptionInput").value = "";


    addEvent(
        `Custom twist created: ${name}`
    );


    updateAllDisplays();

}


function renderTwists() {

    const list =
        document.getElementById("twistList");


    if (!list) return;


    list.innerHTML = "";


    customTwists.forEach(twist => {

        const div =
            document.createElement("div");


        div.className =
            "player-item";


        div.innerHTML = `

            <strong>
                ${escapeHTML(twist.name)}
            </strong>

            <p>
                ${escapeHTML(twist.description)}
            </p>

        `;


        list.appendChild(div);

    });

}


/* =========================================================
   ALLIANCES
========================================================= */

function createAlliance() {

    const name =
        document
            .getElementById("allianceNameInput")
            .value
            .trim();


    const membersText =
        document
            .getElementById("allianceMembersInput")
            .value
            .trim();


    if (!name) {

        alert("Enter an alliance name.");

        return;

    }


    alliances.push({

        name,

        members:
            membersText
                .split(",")
                .map(x => x.trim())
                .filter(Boolean)

    });


    document.getElementById("allianceNameInput").value = "";

    document.getElementById("allianceMembersInput").value = "";


    addEvent(
        `Alliance created: ${name}`
    );


    updateAllDisplays();

}


function renderAlliances() {

    const list =
        document.getElementById("allianceList");


    if (!list) return;


    list.innerHTML = "";


    alliances.forEach(alliance => {

        const div =
            document.createElement("div");


        div.className =
            "player-item";


        div.innerHTML = `

            <strong>
                ${escapeHTML(alliance.name)}
            </strong>

            <p>

                ${alliance.members
                    .map(member =>
                        escapeHTML(member)
                    )
                    .join(", ")}

            </p>

        `;


        list.appendChild(div);

    });

}


/* =========================================================
   RELATIONSHIPS
========================================================= */

function createRelationship() {

    const player1 =
        document.getElementById(
            "relationshipPlayer1"
        ).value;


    const player2 =
        document.getElementById(
            "relationshipPlayer2"
        ).value;


    const score =
        clamp(
            Number(
                document.getElementById(
                    "relationshipScore"
                ).value
            ) || 0,
            0,
            100
        );


    if (!player1 || !player2) {

        alert("Select both houseguests.");

        return;

    }


    if (player1 === player2) {

        alert(
            "Choose two different houseguests."
        );

        return;

    }


    relationships.push({

        player1,

        player2,

        score

    });


    document.getElementById(
        "relationshipScore"
    ).value = "";


    updateAllDisplays();

}


function getRelationship(player1, player2) {

    const relationship =
        relationships.find(rel =>

            (
                rel.player1 === player1 &&
                rel.player2 === player2
            )

            ||

            (
                rel.player1 === player2 &&
                rel.player2 === player1
            )

        );


    if (relationship) {

        return relationship.score;

    }


    return 50;

}


function renderRelationships() {

    const list =
        document.getElementById(
            "relationshipList"
        );


    if (!list) return;


    list.innerHTML = "";


    relationships.forEach(rel => {

        const div =
            document.createElement("div");


        div.className =
            "player-item";


        div.innerHTML = `

            ${escapeHTML(rel.player1)}

            ❤️

            ${escapeHTML(rel.player2)}

            <strong>
                ${rel.score}/100
            </strong>

        `;


        list.appendChild(div);

    });

}


function updateRelationshipDropdowns() {

    const first =
        document.getElementById(
            "relationshipPlayer1"
        );


    const second =
        document.getElementById(
            "relationshipPlayer2"
        );


    if (!first || !second) return;


    first.innerHTML = "";

    second.innerHTML = "";


    houseguests.forEach(player => {

        const a =
            new Option(
                player.name,
                player.name
            );


        const b =
            new Option(
                player.name,
                player.name
            );


        first.add(a);

        second.add(b);

    });

}


/* =========================================================
   START SEASON
========================================================= */

function startNewSeason() {

    const template =
        seasonTemplates[
            selectedSeasonTemplate
        ];


    if (!template) {

        alert("Select a season.");

        return;

    }


    if (
        houseguests.length !==
        template.startingPlayers
    ) {

        const proceed =
            confirm(

                `This format is designed for ${template.startingPlayers} houseguests, but you currently have ${houseguests.length}.

Continue anyway?`

            );


        if (!proceed) return;

    }


    if (houseguests.length < 4) {

        alert(
            "You need at least 4 houseguests."
        );

        return;

    }


    currentWeek = 1;

    currentHOH = null;

    nominees = [];

    povWinner = null;

    povPlayers = [];

    hackerWinner = null;

    hackerVoteNullified = null;

    evictedHouseguests = [];

    jury = [];

    evictionHistory = [];

    appStoreRecipients = [];

    battleBackUsed = false;

    seasonStarted = true;

    currentStage = "safety";


    houseguests.forEach(player => {

        player.status = "Active";

        player.app = null;

        player.punishment = null;

        player.appUsed = false;

        player.cloudAvailable = false;

        player.identityTheftAvailable = false;

        player.bonusLifeAvailable = false;

    });


    document.getElementById(
        "eventLog"
    ).innerHTML = "";


    addEvent(
        "🎬 The season has officially begun!"
    );


    if (
        selectedSeasonTemplate === "bb20"
    ) {

        addEvent(
            "💻 BB20 begins with the special Safety Competition."
        );

    }


    showSection("week");

    updateStageDisplay();

    updateAllDisplays();

}


/* =========================================================
   PROCEED ENGINE
========================================================= */

function proceedGame() {

    if (!seasonStarted) {

        alert(
            "Start a season first."
        );

        return;

    }


    if (
        selectedSeasonTemplate !== "bb20"
    ) {

        proceedGenericSeason();

        return;

    }


    switch (currentStage) {

        case "safety":

            runBB20SafetyCompetition();

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


        case "pov":

            runPOV();

            break;


        case "veto":

            usePOV();

            break;


        case "eviction":

            runEviction();

            break;


        case "battleback":

            runBattleBack();

            break;


        case "nextweek":

            beginNextWeek();

            break;


        case "finale":

            showFinale();

            break;


        default:

            beginNextWeek();

            break;

    }

}


/* =========================================================
   WEEK STAGE FLOW
========================================================= */

function setStage(stage) {

    currentStage = stage;

    updateStageDisplay();

}


function updateStageDisplay() {

    const title =
        document.getElementById(
            "stagePanelTitle"
        );


    const description =
        document.getElementById(
            "stagePanelDescription"
        );


    const stageTitle =
        document.getElementById(
            "stageTitle"
        );


    const button =
        document.getElementById(
            "proceedButton"
        );


    if (!title || !description || !button)
        return;


    const stages = {

        safety: {

            title: "Safety Competition",

            description:
                "The BB20 premiere begins with the special Safety Competition.",

            button:
                "PROCEED — SAFETY COMPETITION"

        },


        hoh: {

            title:
                `HOH — ${getCurrentHOHCompetition()}`,

            description:
                "The Houseguests compete for Head of Household.",

            button:
                "PROCEED — RUN HOH"

        },


        appstore: {

            title:
                "BB App Store",

            description:
                "America's trending results award a Power App and a Crap App.",

            button:
                "PROCEED — BB APP STORE"

        },


        nominations: {

            title:
                "Nomination Ceremony",

            description:
                "The Head of Household names two nominees.",

            button:
                "PROCEED — NOMINATIONS"

        },


        hacker: {

            title:
                `H@CKER COMPETITION — ${getCurrentHackerCompetition()}`,

            description:
                "The H@cker can change nominations, select a Veto player, and nullify an eviction vote.",

            button:
                "PROCEED — H@CKER COMPETITION"

        },


        pov: {

            title:
                `POWER OF VETO — ${getCurrentPOVCompetition()}`,

            description:
                "Six Houseguests compete for the Power of Veto.",

            button:
                "PROCEED — RUN POV"

        },


        veto: {

            title:
                "Veto Ceremony",

            description:
                "The Veto winner decides whether to use the Power of Veto.",

            button:
                "PROCEED — VETO CEREMONY"

        },


        eviction: {

            title:
                "Live Eviction",

            description:
                "The eligible Houseguests cast their votes to evict.",

            button:
                "PROCEED — EVICTION"

        },


        battleback: {

            title:
                "Jury Battle Back",

            description:
                "The first four jurors compete for a chance to return.",

            button:
                "PROCEED — BATTLE BACK"

        },


        nextweek: {

            title:
                "Next Week",

            description:
                "Begin the next round of the game.",

            button:
                "PROCEED — NEXT WEEK"

        },


        finale: {

            title:
                "Finale",

            description:
                "The season has reached the end.",

            button:
                "GO TO FINALE"

        }

    };


    const info =
        stages[currentStage] ||
        stages.nextweek;


    title.textContent =
        info.title;


    description.textContent =
        info.description;


    button.textContent =
        info.button;


    stageTitle.textContent =
        info.title;


    document.getElementById(
        "weekTitle"
    ).textContent =
        `WEEK ${currentWeek}`;

}


/* =========================================================
   BB20 COMPETITION NAMES
========================================================= */

function getCurrentWeekData() {

    return BB20.competitions[currentWeek] || {};

}


function getCurrentHOHCompetition() {

    const data =
        getCurrentWeekData();


    return data.hoh || "HOH Competition";

}


function getCurrentPOVCompetition() {

    const data =
        getCurrentWeekData();


    return data.pov || "Power of Veto";

}


function getCurrentHackerCompetition() {

    const data =
        getCurrentWeekData();


    return data.hacker || "H@cker Competition";

}


/* =========================================================
   SPECIAL BB20 SAFETY COMPETITION
========================================================= */

function runBB20SafetyCompetition() {

    const active =
        getActivePlayers();


    if (active.length < 4) {

        setStage("hoh");

        return;

    }


    const safetyWinner =
        competitionWinner(
            active,
            "physical"
        );


    addEvent(
        `🛡️ ${safetyWinner.name} wins the BB20 premiere Safety Competition.`
    );


    safetyWinner.safety =
        true;


    addEvent(
        `${safetyWinner.name} has special safety heading into the first eviction.`
    );


    setStage("hoh");

    updateAllDisplays();

}


/* =========================================================
   COMPETITION ENGINE
========================================================= */

function competitionWinner(players, type) {

    if (
        !players ||
        players.length === 0
    ) {

        return null;

    }


    const results =
        players.map(player => {

            let score = 0;


            if (type === "physical") {

                score =
                    player.physical * 4 +
                    player.social +
                    player.strategy;

            }


            else if (type === "mental") {

                score =
                    player.mental * 4 +
                    player.strategy * 2 +
                    player.social;

            }


            else if (type === "social") {

                score =
                    player.social * 4 +
                    player.strategy * 2;

            }


            else {

                score =
                    player.physical +
                    player.mental +
                    player.social +
                    player.strategy;

            }


            score +=
                Math.random() * 20;


            return {

                player,

                score

            };

        });


    results.sort(
        (a, b) =>
            b.score - a.score
    );


    return results[0].player;

}


/* =========================================================
   HOH
========================================================= */

function runHOH() {

    const active =
        getActivePlayers();


    if (active.length < 2) {

        return;

    }


    let type =
        getCompetitionType(
            getCurrentHOHCompetition()
        );


    const eligible =
        active.filter(
            player =>
                !player.safety
        );


    const winner =
        competitionWinner(
            eligible.length
                ? eligible
                : active,
            type
        );


    currentHOH =
        winner;


    addEvent(
        `🏆 ${winner.name} wins HOH — ${getCurrentHOHCompetition()}!`
    );


    setStage(
        currentWeek <= 3
            ? "appstore"
            : "nominations"
    );


    updateAllDisplays();

}


/* =========================================================
   APP STORE
========================================================= */

function runAppStore() {

    if (
        !BB20.twists.appStore.activeWeeks
            .includes(currentWeek)
    ) {

        setStage("nominations");

        return;

    }


    const eligible =
        getActivePlayers()
            .filter(
                player =>
                    !player.app
            );


    if (eligible.length < 2) {

        setStage("nominations");

        return;

    }


    const topTrending =
        weightedRandomPlayer(
            eligible,
            "social"
        );


    let remaining =
        eligible.filter(
            player =>
                player.id !==
                topTrending.id
        );


    const leastTrending =
        weightedRandomPlayer(
            remaining,
            "social",
            true
        );


    const weekIndex =
        currentWeek - 1;


    const power =
        BB20.twists
            .appStore
            .powerApps[weekIndex];


    const crap =
        BB20.twists
            .appStore
            .crapApps[weekIndex];


    if (power) {

        topTrending.app =
            power.name;


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

            week: currentWeek,

            player:
                topTrending.name,

            app:
                power.name

        });


        addEvent(
            `📱 ${topTrending.name} is the top trending Houseguest and receives ${power.name}.`
        );

    }


    if (crap) {

        leastTrending.punishment =
            crap.name;


        addEvent(
            `⚠️ ${leastTrending.name} receives the ${crap.name} Crap App.`
        );

    }


    setStage("nominations");

    updateAllDisplays();

}


/* =========================================================
   NOMINATIONS
========================================================= */

function makeNominations() {

    if (!currentHOH) {

        setStage("hoh");

        return;

    }


    let eligible =
        getActivePlayers()
            .filter(
                player =>
                    player.id !==
                    currentHOH.id
            );


    /*
       CLOUD POWER

       The Cloud can prevent its holder
       from being nominated.
    */

    eligible =
        eligible.filter(
            player =>
                !player.cloudAvailable
        );


    eligible.sort(
        (a, b) =>
            nominationTargetScore(b) -
            nominationTargetScore(a)
    );


    nominees =
        chooseNominees(
            eligible
        );


    /*
       IDENTITY THEFT

       If the holder has the power,
       they secretly replace the nominations.
    */

    const identityPlayer =
        getActivePlayers()
            .find(
                player =>
                    player.identityTheftAvailable
            );


    if (identityPlayer) {

        const alternative =
            getActivePlayers()
                .filter(
                    player =>

                        player.id !==
                        currentHOH.id

                        &&

                        !nominees.some(
                            nominee =>
                                nominee.id ===
                                player.id
                        )

                );


        if (alternative.length) {

            const replacement =
                weightedRandomPlayer(
                    alternative,
                    "strategy"
                );


            const index =
                Math.floor(
                    Math.random() *
                    nominees.length
                );


            const old =
                nominees[index];


            nominees[index] =
                replacement;


            identityPlayer
                .identityTheftAvailable =
                false;


            addEvent(
                `🕵️ Identity Theft was secretly used. ${old.name} was replaced by ${replacement.name}.`
            );

        }

    }


    addEvent(
        `📋 ${currentHOH.name} nominates ${nominees.map(p => p.name).join(" and ")}.`
    );


    /*
       BB20 HACKER STARTS AFTER NOMINATIONS
    */

    if (
        BB20.twists.hacker.activeWeeks
            .includes(currentWeek)
    ) {

        setStage("hacker");

    }

    else {

        setStage("pov");

    }


    updateAllDisplays();

}


function chooseNominees(eligible) {

    if (eligible.length <= 2) {

        return eligible.slice(
            0,
            2
        );

    }


    return [

        weightedRandomPlayer(
            eligible,
            "strategy"
        ),

        weightedRandomPlayer(
            eligible.filter(
                player =>
                    player.id !==
                    eligible[0].id
            ),
            "strategy"
        )

    ];

}


function nominationTargetScore(player) {

    return (

        player.strategy * 3 +

        player.social * 2 +

        player.physical +

        Math.random() * 20

    );

}


/* =========================================================
   HACKER COMPETITION
========================================================= */

function runHackerCompetition() {

    const players =
        getActivePlayers();


    hackerWinner =
        competitionWinner(
            players,
            "mental"
        );


    hackerWinner.hackerWins++;


    addEvent(
        `💻 ${hackerWinner.name} secretly wins the ${getCurrentHackerCompetition()} H@cker Competition.`
    );


    /*
       HACK NOMINATION
    */

    const hackTargets =
        players.filter(
            player =>
                player.id !==
                currentHOH.id
        );


    const currentNominee =
        nominees[
            Math.floor(
                Math.random() *
                nominees.length
            )
        ];


    const hackReplacement =
        weightedRandomPlayer(
            hackTargets.filter(
                player =>
                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )
            ),
            "strategy"
        );


    if (
        currentNominee &&
        hackReplacement
    ) {

        nominees =
            nominees.map(
                nominee =>

                    nominee.id ===
                    currentNominee.id

                        ? hackReplacement

                        : nominee

            );


        addEvent(
            `🕵️ The H@cker removes ${currentNominee.name} from the block and secretly nominates ${hackReplacement.name}.`
        );

    }


    /*
       HACKER CHOOSES VETO PLAYER
    */

    const eligibleForVeto =
        getActivePlayers()
            .filter(
                player =>
                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )
                    &&
                    player.id !==
                    currentHOH.id
            );


    if (eligibleForVeto.length) {

        const selected =
            weightedRandomPlayer(
                eligibleForVeto,
                "strategy"
            );


        hackerSelectedVetoPlayer =
            selected;


        addEvent(
            `💻 The H@cker selects ${selected.name} to compete in the Power of Veto.`
        );

    }


    setStage("pov");

    updateAllDisplays();

}


/* =========================================================
   POV
========================================================= */

let hackerSelectedVetoPlayer = null;


function runPOV() {

    const active =
        getActivePlayers();


    povPlayers = [];


    /*
       Standard six-player BB20 draw:
       HOH + 2 nominees + 3 random players
    */

    if (currentHOH) {

        povPlayers.push(
            currentHOH
        );

    }


    nominees.forEach(
        nominee => {

            if (
                !povPlayers.some(
                    p =>
                        p.id ===
                        nominee.id
                )
            ) {

                povPlayers.push(
                    nominee
                );

            }

        }
    );


    const remaining =
        active.filter(
            player =>
                !povPlayers.some(
                    p =>
                        p.id ===
                        player.id
                )
        );


    while (
        povPlayers.length < 6 &&
        remaining.length
    ) {

        const index =
            Math.floor(
                Math.random() *
                remaining.length
            );


        const selected =
            remaining.splice(
                index,
                1
            )[0];


        povPlayers.push(
            selected
        );

    }


    /*
       HACKER'S SELECTED PLAYER
    */

    if (
        hackerSelectedVetoPlayer &&
        !povPlayers.some(
            p =>
                p.id ===
                hackerSelectedVetoPlayer.id
        )
    ) {

        const replaceIndex =
            povPlayers.findIndex(
                player =>
                    player.id !==
                    currentHOH.id
                    &&
                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )
            );


        if (replaceIndex >= 0) {

            povPlayers[
                replaceIndex
            ] =
                hackerSelectedVetoPlayer;

        }

    }


    const type =
        getCompetitionType(
            getCurrentPOVCompetition()
        );


    povWinner =
        competitionWinner(
            povPlayers,
            type
        );


    addEvent(
        `🥇 ${povWinner.name} wins the Power of Veto — ${getCurrentPOVCompetition()}!`
    );


    addEvent(
        `POV players: ${povPlayers.map(p => p.name).join(", ")}`
    );


    setStage("veto");

    updateAllDisplays();

}


/* =========================================================
   VETO CEREMONY
========================================================= */

function usePOV() {

    if (!povWinner) {

        setStage("pov");

        return;

    }


    /*
       Decide whether the POV should be used.
    */

    const nomineeIsPOV =
        nominees.some(
            nominee =>
                nominee.id ===
                povWinner.id
        );


    let shouldUse =
        nomineeIsPOV ||
        Math.random() < 0.35;


    if (!shouldUse) {

        addEvent(
            `🦸 ${povWinner.name} chooses not to use the Power of Veto.`
        );

        setStage("eviction");

        updateAllDisplays();

        return;

    }


    const savedNominee =
        chooseVetoNominee();


    if (!savedNominee) {

        setStage("eviction");

        return;

    }


    const replacementCandidates =
        getActivePlayers()
            .filter(
                player =>

                    player.id !==
                    currentHOH.id

                    &&

                    player.id !==
                    povWinner.id

                    &&

                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )

            );


    if (!replacementCandidates.length) {

        setStage("eviction");

        return;

    }


    const replacement =
        weightedRandomPlayer(
            replacementCandidates,
            "strategy"
        );


    nominees =
        nominees.filter(
            nominee =>
                nominee.id !==
                savedNominee.id
        );


    nominees.push(
        replacement
    );


    addEvent(
        `🦸 ${povWinner.name} uses the Power of Veto on ${savedNominee.name}.`
    );


    addEvent(
        `${replacement.name} is the replacement nominee.`
    );


    setStage("eviction");

    updateAllDisplays();

}


function chooseVetoNominee() {

    if (!nominees.length)
        return null;


    /*
       If the POV winner is nominated,
       they save themselves.
    */

    const self =
        nominees.find(
            nominee =>
                nominee.id ===
                povWinner.id
        );


    if (self)
        return self;


    /*
       Otherwise choose the nominee
       most likely to be saved.
    */

    return nominees.sort(
        (a, b) =>
            (
                getRelationship(
                    povWinner.name,
                    b.name
                )
                -
                getRelationship(
                    povWinner.name,
                    a.name
                )
            )
    )[0];

}


/* =========================================================
   EVICTION
========================================================= */

function runEviction() {

    if (
        nominees.length <
        1
    ) {

        return;

    }


    const voters =
        getActivePlayers()
            .filter(
                player =>

                    player.id !==
                    currentHOH?.id

                    &&

                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )

            );


    const voteRecord = [];


    let votes = {};


    nominees.forEach(
        nominee => {

            votes[nominee.id] = 0;

        }
    );


    voters.forEach(
        voter => {

            let choices =
                nominees.map(
                    nominee => {

                        return {

                            nominee,

                            score:
                                evictionTargetScore(
                                    voter,
                                    nominee
                                )

                        };

                    }
                );


            choices.sort(
                (a, b) =>
                    b.score -
                    a.score
            );


            const vote =
                choices[0].nominee;


            /*
               Hacker nullification
            */

            if (
                hackerVoteNullified &&
                voter.id ===
                hackerVoteNullified.id
            ) {

                voteRecord.push({

                    voter,

                    vote: null,

                    nullified: true

                });

                addEvent(
                    `💻 ${voter.name}'s eviction vote was nullified by the H@cker.`
                );

                return;

            }


            votes[
                vote.id
            ]++;


            voteRecord.push({

                voter,

                vote,

                nullified: false

            });

        }
    );


    let evicted;


    if (
        nominees.length ===
        1
    ) {

        evicted =
            nominees[0];

    }

    else {

        evicted =
            nominees.reduce(
                (a, b) =>

                    votes[a.id] >=
                    votes[b.id]

                        ? a
                        : b
            );

    }


    const result = {

        week: currentWeek,

        nominees:
            [...nominees],

        voters:
            voteRecord,

        voteTotals:
            {...votes},

        evicted

    };


    evictionHistory.push(
        result
    );


    displayEvictionResults(
        result
    );


    evicted.status =
        "Evicted";


    evictedHouseguests.push(
        evicted
    );


    /*
       Jury begins after the sixth eviction.
       This gives a nine-person jury in a 16-player season.
    */

    if (
        evictedHouseguests.length >=
        6
    ) {

        jury.push(
            evicted
        );

    }


    addEvent(
        `🚪 ${evicted.name} has been evicted!`
    );


    /*
       BONUS LIFE
    */

    if (
        currentWeek <= 4 &&
        evictedHouseguests.length <= 4
    ) {

        const bonusHolder =
            houseguests.find(
                player =>
                    player.bonusLifeAvailable
            );


        if (bonusHolder) {

            addEvent(
                `📱 ${bonusHolder.name}'s Bonus Life activates.`
            );


            const returnChance =
                Math.random();


            bonusHolder
                .bonusLifeAvailable =
                false;


            if (
                returnChance <
                0.5
            ) {

                evicted.status =
                    "Active";


                houseguests =
                    houseguests.filter(
                        player =>
                            player.id !==
                            evicted.id
                    );


                houseguests.push(
                    evicted
                );


                evictedHouseguests =
                    evictedHouseguests.filter(
                        player =>
                            player.id !==
                            evicted.id
                    );


                addEvent(
                    `🎟️ ${evicted.name} wins the Bonus Life competition and returns to the game!`
                );

            }

            else {

                addEvent(
                    `${evicted.name} fails the Bonus Life competition and remains evicted.`
                );

            }

        }

    }


    /*
       Jury Battle Back
    */

    if (
        jury.length >= 4 &&
        !battleBackUsed
    ) {

        setStage("battleback");

    }

    else {

        if (
            getActivePlayers().length <= 3
        ) {

            setStage("finale");

        }

        else {

            setStage("nextweek");

        }

    }


    updateAllDisplays();

}


/* =========================================================
   EVICTION VOTE MATH
========================================================= */

function evictionTargetScore(
    voter,
    nominee
) {

    const relationship =
        getRelationship(
            voter.name,
            nominee.name
        );


    const allianceBonus =
        areAllied(
            voter.name,
            nominee.name
        )
            ? -40
            : 0;


    return (

        nominee.strategy * 2 +

        nominee.social +

        relationship * 0.5 +

        allianceBonus +

        Math.random() * 20

    );

}


function areAllied(
    player1,
    player2
) {

    return alliances.some(
        alliance =>

            alliance.members
                .includes(player1)

            &&

            alliance.members
                .includes(player2)

    );

}


/* =========================================================
   EVICTION RESULTS
========================================================= */

function displayEvictionResults(
    result
) {

    const panel =
        document.getElementById(
            "evictionResultsPanel"
        );


    const container =
        document.getElementById(
            "evictionResults"
        );


    if (!panel || !container)
        return;


    panel.classList.remove(
        "hidden"
    );


    const totalsHTML =
        result.nominees
            .map(
                nominee => `

                    <div class="vote-total">

                        ${getPlayerImageHTML(
                            nominee
                        )}

                        <div>

                            <strong>
                                ${escapeHTML(
                                    nominee.name
                                )}
                            </strong>

                            <span>
                                ${result.voteTotals[nominee.id] || 0}
                                vote(s) to evict
                            </span>

                        </div>

                    </div>

                `
            )
            .join("");


    const individualHTML =
        result.voters
            .map(
                record => `

                    <div class="vote-row">

                        <div class="vote-person">

                            ${getPlayerImageHTML(
                                record.voter
                            )}

                            <strong>
                                ${escapeHTML(
                                    record.voter.name
                                )}
                            </strong>

                        </div>


                        <div class="vote-arrow">
                            →
                        </div>


                        <div class="vote-choice">

                            ${
                                record.nullified

                                    ? `<span class="nullified-vote">
                                        VOTE NULLIFIED
                                       </span>`

                                    : `

                                        ${getPlayerImageHTML(
                                            record.vote
                                        )}

                                        <span>
                                            ${escapeHTML(
                                                record.vote.name
                                            )}
                                        </span>

                                      `
                            }

                        </div>

                    </div>

                `
            )
            .join("");


    container.innerHTML = `

        <div class="eviction-summary">

            <h3>
                ${escapeHTML(
                    result.evicted.name
                )}
                has been evicted.
            </h3>

            <div class="vote-total-grid">

                ${totalsHTML}

            </div>

        </div>


        <h3>
            How Everyone Voted
        </h3>

        <div class="vote-breakdown">

            ${individualHTML}

        </div>

    `;

}


/* =========================================================
   HACKER VOTE NULLIFICATION
========================================================= */

function chooseHackerVoteNullification() {

    if (!hackerWinner)
        return;


    const eligible =
        getActivePlayers()
            .filter(
                player =>

                    player.id !==
                    currentHOH?.id

                    &&

                    !nominees.some(
                        nominee =>
                            nominee.id ===
                            player.id
                    )

            );


    if (!eligible.length)
        return;


    hackerVoteNullified =
        weightedRandomPlayer(
            eligible,
            "strategy"
        );


    addEvent(
        `💻 The H@cker secretly nullifies ${hackerVoteNullified.name}'s vote.`
    );

}


/* =========================================================
   BATTLE BACK
========================================================= */

function runBattleBack() {

    if (
        jury.length < 4 ||
        battleBackUsed
    ) {

        setStage("nextweek");

        return;

    }


    battleBackUsed =
        true;


    const participants =
        jury.slice(
            0,
            4
        );


    const winner =
        competitionWinner(
            participants,
            "physical"
        );


    winner.status =
        "Active";


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
        `🎪 ${winner.name} wins the Jury Battle Back — Big Top Drop — and returns to the game!`
    );


    setStage("nextweek");

    updateAllDisplays();

}


/* =========================================================
   NEXT WEEK
========================================================= */

function beginNextWeek() {

    const active =
        getActivePlayers();


    if (active.length <= 3) {

        setStage("finale");

        showFinale();

        return;

    }


    currentWeek++;


    currentHOH = null;

    nominees = [];

    povWinner = null;

    povPlayers = [];

    hackerWinner = null;

    hackerVoteNullified = null;

    hackerSelectedVetoPlayer = null;


    active.forEach(
        player => {

            player.safety =
                false;

        }
    );


    addEvent(
        `📅 Week ${currentWeek} begins.`
    );


    setStage("hoh");

    updateAllDisplays();

}


/* =========================================================
   GENERIC SEASONS
========================================================= */

function proceedGenericSeason() {

    if (
        currentStage === "hoh"
    ) {

        runHOH();

    }

    else if (
        currentStage === "nominations"
    ) {

        makeNominations();

    }

    else if (
        currentStage === "pov"
    ) {

        runPOV();

    }

    else if (
        currentStage === "veto"
    ) {

        usePOV();

    }

    else if (
        currentStage === "eviction"
    ) {

        runEviction();

    }

    else {

        currentStage =
            "hoh";

        updateStageDisplay();

    }

}


/* =========================================================
   FINALE
========================================================= */

function showFinale() {

    const finalists =
        getActivePlayers();


    const finale =
        document.getElementById(
            "finaleContent"
        );


    if (!finale)
        return;


    const winner =
        determineFinaleWinner(
            finalists
        );


    finale.innerHTML = `

        <div class="finale-crown">
            👑
        </div>

        <h3>
            FINALISTS
        </h3>


        <div class="finalists">

            ${finalists
                .map(
                    player => `

                        <div class="finalist-card">

                            ${getPlayerImageHTML(
                                player
                            )}

                            <strong>
                                ${escapeHTML(
                                    player.name
                                )}
                            </strong>

                        </div>

                    `
                )
                .join("")}

        </div>


        <div class="winner-announcement">

            <span>
                YOUR WINNER
            </span>

            ${getPlayerImageHTML(
                winner
            )}

            <h2>
                ${escapeHTML(
                    winner.name
                )}
            </h2>

            <p>
                Congratulations! You are the winner of Big Brother.
            </p>

        </div>

    `;


    currentStage =
        "finale";


    showSection("finale");

}


function determineFinaleWinner(
    finalists
) {

    return finalists
        .slice()
        .sort(
            (a, b) =>

                (
                    b.social * 2 +
                    b.strategy * 3 +
                    b.mental +
                    Math.random() * 30
                )

                -

                (
                    a.social * 2 +
                    a.strategy * 3 +
                    a.mental +
                    Math.random() * 30
                )

        )[0];

}


/* =========================================================
   MEMORY WALL
========================================================= */

function renderMemoryWall() {

    const wall =
        document.getElementById(
            "memoryWall"
        );


    if (!wall)
        return;


    wall.innerHTML = "";


    houseguests.forEach(
        player => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "memory-card";


            if (
                player.status !==
                "Active"
            ) {

                card.classList.add(
                    "evicted-memory-card"
                );

            }


            card.innerHTML = `

                <div class="memory-photo">

                    ${getPlayerImageHTML(
                        player
                    )}

                    ${
                        player.status !==
                        "Active"

                            ? `<div class="evicted-overlay">
                                    EVICTED
                               </div>`

                            : ""
                    }

                </div>


                <strong>
                    ${escapeHTML(
                        player.name
                    )}
                </strong>


                ${
                    player.status ===
                    "Active"

                        ? `<span class="memory-status">
                                IN THE HOUSE
                           </span>`

                        : `<span class="memory-status evicted">
                                EVICTED
                           </span>`
                }

            `;


            wall.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   GAME HOUSEGUEST DISPLAY
========================================================= */

function renderGameHouseguests() {

    const container =
        document.getElementById(
            "gameHouseguests"
        );


    if (!container)
        return;


    container.innerHTML = "";


    getActivePlayers().forEach(
        player => {

            let role = "";


            if (
                currentHOH &&
                player.id ===
                currentHOH.id
            ) {

                role = "HOH";

            }


            else if (
                nominees.some(
                    nominee =>
                        nominee.id ===
                        player.id
                )
            ) {

                role = "NOMINEE";

            }


            else if (
                povWinner &&
                player.id ===
                povWinner.id
            ) {

                role = "POV";

            }


            container.innerHTML += `

                <div class="game-player-card">

                    <div class="game-player-photo">

                        ${getPlayerImageHTML(
                            player
                        )}

                    </div>

                    <strong>
                        ${escapeHTML(
                            player.name
                        )}
                    </strong>

                    ${
                        role
                            ? `<span class="role-badge ${role.toLowerCase()}">
                                    ${role}
                               </span>`
                            : ""
                    }

                </div>

            `;

        }
    );

}


/* =========================================================
   JURY
========================================================= */

function renderJury() {

    const list =
        document.getElementById(
            "juryList"
        );


    if (!list)
        return;


    list.innerHTML = "";


    jury.forEach(
        player => {

            list.innerHTML += `

                <div class="jury-player">

                    ${getPlayerImageHTML(
                        player
                    )}

                    <div>

                        <strong>
                            ${escapeHTML(
                                player.name
                            )}
                        </strong>

                        <span>
                            JURY MEMBER
                        </span>

                    </div>

                </div>

            `;

        }
    );

}


function renderEvicted() {

    const list =
        document.getElementById(
            "evictedPlayers"
        );


    if (!list)
        return;


    list.innerHTML = "";


    evictedHouseguests.forEach(
        player => {

            list.innerHTML += `

                <div class="jury-player">

                    ${getPlayerImageHTML(
                        player
                    )}

                    <div>

                        <strong>
                            ${escapeHTML(
                                player.name
                            )}
                        </strong>

                        <span>
                            EVICTED
                        </span>

                    </div>

                </div>

            `;

        }
    );

}


/* =========================================================
   GAME DISPLAY
========================================================= */

function updateGameDisplay() {

    const format =
        document.getElementById(
            "formatDisplay"
        );


    const hoh =
        document.getElementById(
            "hohDisplay"
        );


    const nomineesDisplay =
        document.getElementById(
            "nomineesDisplay"
        );


    const pov =
        document.getElementById(
            "povDisplay"
        );


    const week =
        document.getElementById(
            "weekDisplay"
        );


    if (format) {

        format.textContent =
            seasonTemplates[
                selectedSeasonTemplate
            ]?.name ||
            "Custom Big Brother";

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

                ? nominees
                    .map(
                        player =>
                            player.name
                    )
                    .join(", ")

                : "None";

    }


    if (pov) {

        pov.textContent =
            povWinner
                ? povWinner.name
                : "Not Played";

    }


    if (week) {

        week.textContent =
            currentWeek;

    }

}


/* =========================================================
   SEASON SUMMARY
========================================================= */

function updateSeasonSummary() {

    const summary =
        document.getElementById(
            "seasonSummary"
        );


    if (!summary)
        return;


    if (!seasonStarted) {

        summary.innerHTML =
            "Your season has not started yet.";

        return;

    }


    const active =
        getActivePlayers();


    summary.innerHTML = `

        <div class="summary-grid">

            <div>

                <span>
                    FORMAT
                </span>

                <strong>
                    ${escapeHTML(
                        seasonTemplates[
                            selectedSeasonTemplate
                        ].name
                    )}
                </strong>

            </div>


            <div>

                <span>
                    WEEK
                </span>

                <strong>
                    ${currentWeek}
                </strong>

            </div>


            <div>

                <span>
                    HOUSEGUESTS
                </span>

                <strong>
                    ${active.length}
                </strong>

            </div>


            <div>

                <span>
                    EVICTED
                </span>

                <strong>
                    ${evictedHouseguests.length}
                </strong>

            </div>


            <div>

                <span>
                    JURY
                </span>

                <strong>
                    ${jury.length}
                </strong>

            </div>

        </div>

    `;

}


/* =========================================================
   HELPERS
========================================================= */

function getActivePlayers() {

    return houseguests.filter(
        player =>
            player.status ===
            "Active"
    );

}


function getCompetitionType(
    competitionName
) {

    const physicalCompetitions = [

        "Microchip Mayhem",

        "Land a Job",

        "Out on a Limb",

        "Perfect Timing",

        "Glow & Flow",

        "Sweet Shot",

        "High in the Sky",

        "Shell or Highwater",

        "Jetpack Attack"

    ];


    const mentalCompetitions = [

        "Product Launch",

        "GIF That Keeps on Giving",

        "Crack The Code",

        "Hack the House",

        "OTEV the Sneezy Skunk",

        "Mission to Planet Veto",

        "Control Your Emojis",

        "BB Comics",

        "Buffering",

        "What the Bleep",

        "Mount Evictus",

        "Jury Oddcasts"

    ];


    if (
        physicalCompetitions.includes(
            competitionName
        )
    ) {

        return "physical";

    }


    if (
        mentalCompetitions.includes(
            competitionName
        )
    ) {

        return "mental";

    }


    return "mixed";

}


function weightedRandomPlayer(
    players,
    stat,
    reverse = false
) {

    if (!players.length)
        return null;


    const weights =
        players.map(
            player => {

                const value =
                    player[stat] || 5;


                return reverse
                    ? 11 - value
                    : value;

            }
        );


    const total =
        weights.reduce(
            (sum, value) =>
                sum + value,
            0
        );


    let random =
        Math.random() *
        total;


    for (
        let i = 0;
        i < players.length;
        i++
    ) {

        random -=
            weights[i];


        if (random <= 0) {

            return players[i];

        }

    }


    return players[
        players.length - 1
    ];

}


function clamp(
    value,
    min,
    max
) {

    return Math.min(
        Math.max(
            value,
            min
        ),
        max
    );

}


function escapeHTML(value) {

    return String(value)
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
   EVENTS
========================================================= */

function addEvent(message) {

    const log =
        document.getElementById(
            "eventLog"
        );


    if (!log)
        return;


    const event =
        document.createElement(
            "div"
        );


    event.className =
        "event";


    event.textContent =
        message;


    log.prepend(
        event
    );

}


/* =========================================================
   SAVE
========================================================= */

function saveGame() {

    const data = {

        houseguests,

        evictedHouseguests,

        jury,

        alliances,

        relationships,

        customTwists,

        currentWeek,

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

        appStoreRecipients,

        battleBackUsed

    };


    localStorage.setItem(
        "bigBrotherSimulatorSave",
        JSON.stringify(data)
    );


    alert(
        "Season saved successfully!"
    );

}


/* =========================================================
   LOAD
========================================================= */

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


        povPlayers =
            data.povPlayers || [];


        hackerWinner =
            data.hackerWinner || null;


        hackerVoteNullified =
            data.hackerVoteNullified || null;


        hackerSelectedVetoPlayer =
            data.hackerSelectedVetoPlayer ||
            null;


        seasonStarted =
            data.seasonStarted ||
            false;


        selectedSeasonTemplate =
            data.selectedSeasonTemplate ||
            "bb20";


        currentStage =
            data.currentStage ||
            "start";


        evictionHistory =
            data.evictionHistory ||
            [];


        appStoreRecipients =
            data.appStoreRecipients ||
            [];


        battleBackUsed =
            data.battleBackUsed ||
            false;


        const selector =
            document.getElementById(
                "seasonTemplate"
            );


        if (selector) {

            selector.value =
                selectedSeasonTemplate;

        }


        addEvent(
            "💾 Saved season loaded."
        );


        updateAllDisplays();

    }


    catch (error) {

        console.error(
            error
        );


        alert(
            "The saved season could not be loaded."
        );

    }

}


/* =========================================================
   RESET
========================================================= */

function resetGame() {

    if (
        !confirm(
            "Are you sure you want to erase everything?"
        )
    ) {

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

    povPlayers = [];

    hackerWinner = null;

    hackerVoteNullified = null;

    hackerSelectedVetoPlayer = null;

    seasonStarted = false;

    selectedSeasonTemplate =
        "bb20";

    currentStage =
        "start";

    evictionHistory = [];

    appStoreRecipients = [];

    battleBackUsed = false;


    localStorage.removeItem(
        "bigBrotherSimulatorSave"
    );


    const selector =
        document.getElementById(
            "seasonTemplate"
        );


    if (selector) {

        selector.value =
            "bb20";

    }


    const log =
        document.getElementById(
            "eventLog"
        );


    if (log) {

        log.innerHTML = `

            <div class="event">
                Simulator reset.
            </div>

        `;

    }


    updateAllDisplays();

    showSection("home");

}


/* =========================================================
   UPDATE EVERYTHING
========================================================= */

function updateAllDisplays() {

    renderCast();

    renderTwists();

    renderAlliances();

    renderRelationships();

    renderMemoryWall();

    renderJury();

    renderEvicted();

    renderGameHouseguests();

    updateRelationshipDropdowns();

    updateGameDisplay();

    updateSeasonSummary();

    updateSelectedSeasonInfo();

    updateStageDisplay();

}


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const selector =
            document.getElementById(
                "seasonTemplate"
            );


        if (selector) {

            selector.value =
                "bb20";

        }


        updateAllDisplays();

    }
);
