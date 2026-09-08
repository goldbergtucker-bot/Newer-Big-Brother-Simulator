const BB20 = {
    id: "bb20",
    name: "Big Brother 20",
    year: 2018,
    description: "A BB20-format simulator with the 16-Houseguest structure, weekly competition schedule, BB App Store, H@cker Competition, Jury Battle Back, double eviction, and three-part Final HOH.",
    startingPlayers: 16,
    nominationCount: 2,
    jurySize: 9,
    juryStartAfterEvictions: 6,
    juryBattleBackAfterJurors: 4,
    competitionCategories: { hoh: "overall", pov: "overall" },
    competitions: {
        1: { hoh: { name: "Microchip Mayhem", category: "general", description: "A technology-themed HOH competition testing broad competition ability." }, pov: { name: "Going Viral", category: "general", description: "A BB20 technology-themed Power of Veto competition." } },
        2: { hoh: { name: "Land a Job", category: "mental", description: "A job-search themed HOH competition emphasizing mental skill." }, pov: { name: "HouseGuestsOnly.com", category: "mental", description: "A web-themed Power of Veto competition emphasizing memory and mental ability." } },
        3: { hoh: { name: "Product Launch", category: "strategic", description: "A product-themed competition rewarding strategy and decision making." }, pov: { name: "Mamma Mia! Madness", category: "physical", description: "A fast-paced themed veto competition emphasizing physical ability." } },
        4: { hoh: { name: "Out on a Limb", category: "endurance", description: "An endurance-focused competition where staying power matters." }, pov: { name: "Chop, Bonk, Spank", category: "physical", description: "A physical Power of Veto competition." } },
        5: { hoh: { name: "Perfect Timing", category: "mental", description: "A timing and precision themed HOH competition." }, pov: { name: "Goober Driver", category: "physical", description: "A driving-themed Power of Veto competition." } },
        6: { hoh: { name: "GIF That Keeps on Giving", category: "mental", description: "A technology and memory themed HOH competition." }, hacker: { name: "Crack The Code", category: "mental", description: "Anonymous H@cker Competition. The winner can alter a nomination, select a Veto player, and nullify one eviction vote." }, pov: { name: "Boom Power Trip", category: "physical", description: "A power-themed Power of Veto competition." } },
        7: { hoh: { name: "#HashtagTooLong", category: "mental", description: "A hashtag and memory themed HOH competition." }, hacker: { name: "Hack the House", category: "mental", description: "Anonymous H@cker Competition with the same three hacking powers." }, pov: { name: "OTEV the Sneezy Skunk", category: "general", description: "An OTEV-style Power of Veto competition." } },
        8: { hoh: { name: "Glow & Flow", category: "endurance", description: "A glowing, balance and endurance themed HOH competition." }, pov: { name: "Zing Force", category: "physical", description: "A Zingbot-themed Power of Veto competition." } },
        9: { hoh: { name: "Sweet Shot", category: "physical", description: "A candy and precision themed HOH competition." }, pov: { name: "Mission to Planet Veto", category: "mental", description: "A space-themed Power of Veto competition." } },
        10: { hoh: { name: "High in the Sky", category: "endurance", description: "A high-altitude themed endurance HOH competition." }, pov: { name: "Control Your Emojis", category: "mental", description: "A technology and memory themed Power of Veto competition." } },
        11: { hoh: { name: "Shell or Highwater", category: "endurance", description: "An endurance HOH competition." }, pov: { name: "BB Comics", category: "mental", description: "A BB Comics-style memory and observation competition." }, doubleEviction: true, secondHOH: { name: "Buffering", category: "mental", description: "The second HOH of the double eviction." }, secondPOV: { name: "Block and Roll", category: "physical", description: "The rapid second Power of Veto of the double eviction." } },
        12: { hoh: { name: "BBFlix & Chill", category: "mental", description: "A movie and memory themed HOH competition." }, pov: { name: "Your Mazes are Numbered", category: "mental", description: "A maze and memory themed Power of Veto competition." }, secondHOH: { name: "What the Bleep", category: "mental", description: "The second HOH of the week." }, secondPOV: { name: "Down to the Wires", category: "physical", description: "A rapid second Power of Veto competition." } },
        13: { finalHOH: [
            { name: "Jetpack Attack", category: "endurance", description: "Final HOH Part 1: endurance." },
            { name: "Mount Evictus", category: "mental", description: "Final HOH Part 2: mental/skill." },
            { name: "Jury Oddcasts", category: "strategic", description: "Final HOH Part 3: jury knowledge and decision making." }
        ] }
    },
    twists: {
        appStore: {
            activeWeeks: [1, 2, 3],
            powerApps: [
                { name: "Bonus Life", type: "bonusLife", description: "After an eviction, the evicted HouseGuest may compete for a chance to return. The power applies to the first three evictions; if unused, the fourth evicted HouseGuest gets the chance." },
                { name: "The Cloud", type: "cloud", description: "Protects its holder from being nominated during one Nomination or Veto Ceremony." },
                { name: "Identity Theft", type: "identityTheft", description: "Allows its holder to secretly replace the HOH's two nominations." }
            ],
            crapApps: [
                { name: "Hamazon", description: "The HouseGuest receives recurring ham deliveries as a punishment." },
                { name: "Yell!", description: "An angry reviewer gives the HouseGuest surprise feedback for 24 hours." },
                { name: "Read It!", description: "The HouseGuest must read Hamlet in costume and character until the task is completed." }
            ]
        },
        hacker: {
            activeWeeks: [6, 7],
            abilities: ["Replace one nominee", "Choose one of the three randomly selected Veto players", "Nullify one eviction vote"]
        },
        juryBattleBack: { jurors: 4, competition: "Big Top Drop", description: "The first four jurors compete for a chance to return to the game." }
    }
};

window.BB_SEASON_REGISTRY = window.BB_SEASON_REGISTRY || {};
window.BB_SEASON_REGISTRY.bb20 = BB20;
