(function installWeeklyPresentation() {

    const baseRenderGameHouseguests = renderGameHouseguests;
    const baseUpdateGameStageDisplay = updateGameStageDisplay;

    function competitionForStage() {
        if (currentStage === "safetyTrash") {
            return getSafetyEvent("trashFolder");
        }

        if (currentStage === "safetyCyber") {
            return getSafetyEvent("cyberSecurity");
        }

        if (currentStage === "safetySurfing") {
            return getSafetyEvent("surfingBBWeb");
        }

        if (currentStage === "hoh") {
            return getCompetitionEvent("hoh");
        }

        if (currentStage === "hacker") {
            return getCompetitionEvent("hacker");
        }

        if (currentStage === "pov" || currentStage === "veto") {
            return getCompetitionEvent("pov");
        }

        if (currentStage === "finalHOH1") {
            return getCurrentSeasonTemplate()?.competitions?.[13]?.finalHOH?.[0];
        }

        if (currentStage === "finalHOH2") {
            return getCurrentSeasonTemplate()?.competitions?.[13]?.finalHOH?.[1];
        }

        if (currentStage === "finalHOH3") {
            return getCurrentSeasonTemplate()?.competitions?.[13]?.finalHOH?.[2];
        }

        return null;
    }


    function ensureTimelineHeader() {

        const game = $("game");

        if (!game) return;

        if ($("weeklyPresentationIntro")) return;

        const host = document.createElement("div");

        host.id = "weeklyPresentationIntro";
        host.className = "weekly-presentation-intro";

        const panel = game.querySelector(".game-header");

        if (panel) {
            panel.insertAdjacentElement("afterend", host);
        } else {
            game.insertBefore(host, game.firstChild);
        }
    }


    function findPeopleInEvent(text) {

        if (!text) return [];

        const allPlayers = [
            ...houseguests,
            ...evictedHouseguests
        ].filter(Boolean);

        const found = [];

        allPlayers.forEach(player => {

            const name = getDisplayName(player);

            if (!name) return;

            if (
                String(text)
                    .toLowerCase()
                    .includes(String(name).toLowerCase())
            ) {
                if (!found.some(p => p.id === player.id)) {
                    found.push(player);
                }
            }
        });

        return found;
    }


    function personCard(player) {

        if (!player) return "";

        return `
            <div class="weekly-person">

                ${getPlayerImageHTML(
                    player,
                    "weekly-person-photo"
                )}

                <div class="weekly-person-name">
                    ${escapeHTML(getDisplayName(player))}
                </div>

                <div class="weekly-person-status">
                    ${escapeHTML(player.status || "Active")}
                </div>

            </div>
        `;
    }


    function getEventIcon(event) {

        if (!event) return "•";

        switch (event.type) {

            case "competition":
                return "🏆";

            case "competition-detail":
                return "📊";

            case "nomination":
                return "🎯";

            case "veto-draw":
                return "🎲";

            case "veto":
                return "🛡️";

            case "vote":
            case "vote-summary":
                return "🗳️";

            case "vote-result":
                return "📋";

            case "eviction":
                return "🚪";

            case "twist":
                return "✨";

            default:
                return "•";
        }
    }


    function eventClass(event) {

        if (!event) return "";

        switch (event.type) {

            case "competition":
            case "competition-detail":
                return "event-competition";

            case "nomination":
                return "event-nomination";

            case "veto":
            case "veto-draw":
                return "event-veto";

            case "vote":
            case "vote-summary":
                return "event-vote";

            case "vote-result":
            case "eviction":
                return "event-vote-result";

            case "twist":
                return "event-twist";

            default:
                return "";
        }
    }


    function renderChain() {

        const container = $("eventLog");

        if (!container) return;

        /*
         * Remove the old terminal-style event-log presentation.
         */
        container.classList.add("weekly-chain-container");


        /*
         * We deliberately render only the important BrantSteele-style
         * events rather than every simulation message.
         */
        const importantEvents = eventLog.filter(event => {

            const weekMatch =
                Number(event.week || 0) === Number(currentWeek);

            const cycleMatch =
                Number(event.cycle || 1) === Number(currentCycle);

            if (!weekMatch || !cycleMatch) {
                return false;
            }

            return [
                "competition",
                "nomination",
                "twist",
                "veto-draw",
                "veto",
                "vote",
                "vote-summary",
                "vote-result",
                "eviction"
            ].includes(event.type);

        });


        const hohEvent =
            importantEvents.find(event =>
                event.type === "competition" &&
                /won HOH/i.test(event.text || "")
            );


        const nominationEvent =
            importantEvents.find(event =>
                event.type === "nomination"
            );


        const hackerEvent =
            importantEvents.find(event =>
                event.type === "twist" &&
                /H@cker/i.test(event.text || "")
            );


        const vetoDrawEvent =
            importantEvents.find(event =>
                event.type === "veto-draw"
            );


        const vetoWinnerEvent =
            importantEvents.find(event =>
                event.type === "competition" &&
                /won the Power of Veto/i.test(event.text || "")
            );


        const vetoCeremonyEvent =
            importantEvents.find(event =>
                event.type === "veto"
            );


        const voteEvent =
            importantEvents.find(event =>
                event.type === "vote-summary" ||
                event.type === "vote"
            );


        const evictionEvent =
            importantEvents.find(event =>
                event.type === "eviction" ||
                event.type === "vote-result"
            );


        /*
         * Week 1 safety competitions.
         */
        const safetyEvents = [];

        if (currentWeek === 1 && currentCycle === 1) {

            const trash =
                importantEvents.find(event =>
                    /Trash Folder/i.test(event.text || "")
                );

            const cyber =
                importantEvents.find(event =>
                    /Cyber Security/i.test(event.text || "")
                );

            const surfing =
                importantEvents.find(event =>
                    /Surfing the BB Web/i.test(event.text || "")
                );

            if (trash) {
                safetyEvents.push({
                    label: "IMMUNITY",
                    name: "Trash Folder",
                    icon: "📁",
                    event: trash
                });
            }

            if (cyber) {
                safetyEvents.push({
                    label: "IMMUNITY",
                    name: "Cyber Security",
                    icon: "🔐",
                    event: cyber
                });
            }

            if (surfing) {
                safetyEvents.push({
                    label: "IMMUNITY",
                    name: "Surfing the BB Web",
                    icon: "🏄",
                    event: surfing
                });
            }
        }


        const stages = [];


        safetyEvents.forEach(item => {

            stages.push({
                label: item.label,
                name: item.name,
                icon: item.icon,
                event: item.event
            });

        });


        stages.push({
            label: "HOH",
            name:
                getCompetitionEvent("hoh")?.name ||
                "Head of Household",
            icon: "👑",
            event: hohEvent
        });


        stages.push({
            label: "NOMINATIONS",
            name: "Nomination Ceremony",
            icon: "🎯",
            event: nominationEvent
        });


        if (
            currentWeek >= 6 &&
            currentWeek <= 7 &&
            currentCycle === 1
        ) {

            stages.push({
                label: "H@CKER",
                name:
                    getCompetitionEvent("hacker")?.name ||
                    "H@cker Competition",
                icon: "💻",
                event: hackerEvent
            });
        }


        stages.push({
            label: "POV PLAYERS",
            name:
                getCompetitionEvent("pov")?.name ||
                "Power of Veto",
            icon: "🎲",
            event: vetoDrawEvent
        });


        stages.push({
            label: "POV",
            name:
                getCompetitionEvent("pov")?.name ||
                "Power of Veto",
            icon: "🏆",
            event: vetoWinnerEvent
        });


        stages.push({
            label: "VETO CEREMONY",
            name: "Veto Ceremony",
            icon: "🛡️",
            event: vetoCeremonyEvent
        });


        stages.push({
            label: "EVICTION VOTE",
            name: "Eviction Vote",
            icon: "🗳️",
            event: voteEvent
        });


        stages.push({
            label: "EVICTION",
            name: "Eviction",
            icon: "🚪",
            event: evictionEvent
        });


        const currentOrder = [
            "opening",
            "safetyTrash",
            "safetyCyber",
            "safetySurfing",
            "hoh",
            "nominations",
            "hacker",
            "pov",
            "veto",
            "eviction",
            "evictionReveal"
        ];


        const currentIndex =
            currentOrder.indexOf(currentStage);


        let html = `
            <section class="weekly-block">

                <div class="weekly-block-title">
                    WEEK ${currentWeek}
                    ${currentCycle > 1
                        ? ` • CYCLE ${currentCycle}`
                        : ""}
                </div>

                <div class="weekly-chain-sequence">
        `;


        stages.forEach((stage, index) => {

            let status = "upcoming";

            if (stage.event) {
                status = "complete";
            }


            /*
             * If the simulator has moved beyond this stage,
             * mark it complete even if its event wasn't recorded.
             */
            const stagePosition =
                index < currentOrder.length
                    ? index
                    : 999;


            if (
                currentIndex !== -1 &&
                stagePosition < currentIndex
            ) {
                status = "complete";
            }


            /*
             * Current stage gets the arrow.
             */
            if (
                (
                    currentStage === "hoh" &&
                    stage.label === "HOH"
                ) ||
                (
                    currentStage === "nominations" &&
                    stage.label === "NOMINATIONS"
                ) ||
                (
                    currentStage === "hacker" &&
                    stage.label === "H@CKER"
                ) ||
                (
                    currentStage === "pov" &&
                    stage.label === "POV PLAYERS"
                ) ||
                (
                    currentStage === "veto" &&
                    stage.label === "VETO CEREMONY"
                ) ||
                (
                    currentStage === "eviction" &&
                    stage.label === "EVICTION VOTE"
                ) ||
                (
                    currentStage === "evictionReveal" &&
                    stage.label === "EVICTION"
                )
            ) {
                status = "current";
            }


            const detail =
                stage.event?.text ||
                (
                    status === "current"
                        ? `Proceed for ${stage.name}.`
                        : "Upcoming"
                );


            const people =
                stage.event
                    ? findPeopleInEvent(stage.event.text)
                    : [];


            html += `
                <article class="weekly-chain-step ${status}">

                    <div class="weekly-chain-step-marker">
                        ${
                            status === "complete"
                                ? "✓"
                                : status === "current"
                                    ? "▶"
                                    : "○"
                        }
                    </div>

                    <div class="weekly-chain-step-body">

                        <div class="weekly-chain-step-label">
                            ${stage.icon}
                            ${escapeHTML(stage.label)}
                        </div>

                        <div class="weekly-chain-step-name">
                            ${escapeHTML(stage.name)}
                        </div>

                        <div class="weekly-chain-step-detail">
                            ${escapeHTML(detail)}
                        </div>

                        ${
                            people.length
                                ? `
                                    <div class="weekly-event-people">
                                        ${people
                                            .map(personCard)
                                            .join("")}
                                    </div>
                                  `
                                : ""
                        }

                    </div>

                </article>
            `;
        });


        html += `
                </div>
            </section>
        `;


        container.innerHTML = html;
    }


    /*
     * Houseguest cards.
     * This preserves the actual image URLs.
     */
    renderGameHouseguests = function() {

        const container = $("gameHouseguests");

        if (!container) return;

        const active =
            getActiveHouseguests();


        if (!active.length) {

            container.innerHTML =
                `<div class="empty-state">
                    No active Houseguests.
                 </div>`;

            return;
        }


        container.innerHTML =
            active.map(player => {

                const tags = [];


                if (player.id === currentHOH) {
                    tags.push("HOH");
                }


                if (
                    nominees.some(
                        nominee =>
                            nominee.id === player.id
                    )
                ) {
                    tags.push("NOMINATED");
                }


                if (
                    povWinner &&
                    povWinner.id === player.id
                ) {
                    tags.push("POV");
                }


                if (player.app) {
                    tags.push(player.app);
                }


                if (
                    currentWeek === 1 &&
                    week1ImmunityIds.includes(player.id)
                ) {
                    tags.push("IMMUNE");
                }


                if (player.safetyPunishment) {
                    tags.push(player.safetyPunishment);
                }


                return `
                    <article class="
                        game-houseguest-card
                        weekly-houseguest-card
                        ${player.id === currentHOH
                            ? "is-hoh"
                            : ""}
                        ${
                            nominees.some(
                                nominee =>
                                    nominee.id === player.id
                            )
                                ? "is-nominee"
                                : ""
                        }
                    ">

                        ${getPlayerImageHTML(
                            player,
                            "game-houseguest-photo"
                        )}

                        <div class="game-houseguest-info">

                            <strong>
                                ${escapeHTML(
                                    getDisplayName(player)
                                )}
                            </strong>

                            <span>
                                ${
                                    escapeHTML(
                                        tags.join(" • ") ||
                                        "ACTIVE"
                                    )
                                }
                            </span>

                        </div>

                    </article>
                `;

            }).join("");
    };


    /*
     * Override the normal stage display so the actual
     * competition name is always shown.
     */
    updateGameStageDisplay = function() {

        baseUpdateGameStageDisplay();

        ensureTimelineHeader();


        const displayLabel =
            $("competitionDisplayLabel");

        const displayName =
            $("competitionDisplayName");

        const displayDescription =
            $("competitionDisplayDescription");


        const competition =
            competitionForStage();


        if (
            displayLabel &&
            displayName &&
            displayDescription
        ) {

            let label =
                "CURRENT STAGE";


            if (
                currentStage === "safetyTrash" ||
                currentStage === "safetyCyber" ||
                currentStage === "safetySurfing"
            ) {

                label =
                    "WEEK 1 IMMUNITY / SAFETY COMPETITION";

            } else if (currentStage === "hoh") {

                label =
                    "HEAD OF HOUSEHOLD COMPETITION";

            } else if (currentStage === "hacker") {

                label =
                    "H@CKER COMPETITION";

            } else if (
                currentStage === "pov"
            ) {

                label =
                    "POWER OF VETO — PLAYERS";

            } else if (
                currentStage === "veto"
            ) {

                label =
                    "VETO CEREMONY";

            } else if (
                currentStage === "eviction"
            ) {

                label =
                    "EVICTION VOTE";

            } else if (
                currentStage === "evictionReveal"
            ) {

                label =
                    "EVICTION";
            }


            displayLabel.textContent =
                label;


            displayName.textContent =
                currentStage === "veto"
                    ? "Veto Ceremony"
                    : (
                        competition?.name ||
                        (
                            currentStage === "nominations"
                                ? "Nomination Ceremony"
                                : currentStage === "opening"
                                    ? "Season Ready"
                                    : "Current Stage"
                        )
                    );


            displayDescription.textContent =
                competition?.description ||
                (
                    currentStage === "veto"
                        ? "The Power of Veto winner decides whether to use the Veto."
                        : "Proceed to advance the simulation."
                );
        }


        const intro =
            $("weeklyPresentationIntro");


        if (!intro) return;


        const template =
            getCurrentSeasonTemplate();


        const weekData =
            getWeekData();


        const twists = [];


        if (
            template?.twists?.appStore &&
            currentWeek <= 3
        ) {
            twists.push("BB App Store");
        }


        if (
            template?.twists?.hacker &&
            currentWeek >= 6 &&
            currentWeek <= 7
        ) {
            twists.push("H@cker Competition");
        }


        if (
            weekData?.doubleEviction ||
            currentCycle === 2
        ) {
            twists.push("DOUBLE EVICTION");
        }


        if (
            currentWeek === 1 &&
            currentCycle === 1
        ) {
            twists.push("WEEK 1 IMMUNITY");
        }


        if (
            jury.length &&
            currentWeek >= 3
        ) {
            twists.push("Jury Phase");
        }


        intro.innerHTML = `
            <div class="weekly-presentation-title">

                <span>
                    WEEK ${currentWeek}
                </span>

                <strong>
                    ${escapeHTML(seasonName)}
                </strong>

            </div>

            ${
                competition
                    ? `
                        <div class="current-competition">

                            <div class="current-competition-label">
                                CURRENT COMPETITION
                            </div>

                            <div class="current-competition-name">
                                ${escapeHTML(
                                    competition.name ||
                                    "Competition"
                                )}
                            </div>

                            <div class="current-competition-description">
                                ${escapeHTML(
                                    competition.description ||
                                    "Houseguests compete for power."
                                )}
                            </div>

                        </div>
                      `
                    : ""
            }

            ${
                twists.length
                    ? `
                        <div class="active-week-twists">
                            <strong>Active twists:</strong>
                            ${twists
                                .map(escapeHTML)
                                .join(" • ")}
                        </div>
                      `
                    : ""
            }
        `;
    };


    /*
     * Make sure the presentation updates whenever
     * the normal display refreshes.
     */
    const originalUpdateAllDisplays =
        updateAllDisplays;


    updateAllDisplays = function() {

        originalUpdateAllDisplays();

        ensureTimelineHeader();

        renderChain();

    };


    window.__BBWeeklyPresentation = {
        competitionForStage,
        ensureTimelineHeader,
        renderChain
    };

})();
