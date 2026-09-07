/* =========================================================
   BIG BROTHER 20 SEASON FORMAT
========================================================= */

const BB20 = {

    id: "bb20",

    name: "Big Brother 20",

    year: 2018,

    startingPlayers: 16,

    nominationCount: 2,

    jurySize: 9,

    juryStartAfterEvictions: 7,


    /* =====================================================
       PREMIERE
    ===================================================== */

    premiere: {

        safetyCompetitions: [

            {
                name: "The Trash Folder",
                type: "mental"
            },

            {
                name: "HouseGuest CAPTCHA",
                type: "mental"
            },

            {
                name: "Surfing the BB Web",
                type: "mixed"
            }

        ],

        safetySpots: 8

    },


    /* =====================================================
       WEEKLY COMPETITIONS
    ===================================================== */

    competitions: {

        1: {
            hoh: "Microchip Mayhem",
            hohType: "physical",
            pov: "Going Viral",
            povType: "mixed"
        },

        2: {
            hoh: "Land a Job",
            hohType: "physical",
            pov: "HouseGuestsOnly.com",
            povType: "mental"
        },

        3: {
            hoh: "Product Launch",
            hohType: "mental",
            pov: "Mamma Mia! Madness",
            povType: "physical"
        },

        4: {
            hoh: "Out on a Limb",
            hohType: "physical",
            pov: "Chop, Bonk, Spank",
            povType: "physical"
        },

        5: {
            hoh: "Perfect Timing",
            hohType: "mental",
            pov: "Goober Driver",
            povType: "mixed"
        },

        6: {
            hoh: "GIF That Keeps on Giving",
            hohType: "mental",

            hacker: "Crack The Code",
            hackerType: "mental",

            pov: "Boom Power Trip",
            povType: "mixed"
        },

        7: {
            hoh: "#HashtagTooLong",
            hohType: "mental",

            hacker: "Hack the House",
            hackerType: "mixed",

            pov: "OTEV the Sneezy Skunk",
            povType: "mental"
        },

        8: {
            hoh: "Glow & Flow",
            hohType: "physical",
            pov: "Zing Force",
            povType: "physical"
        },

        9: {
            hoh: "Sweet Shot",
            hohType: "physical",
            pov: "Mission to Planet Veto",
            povType: "mental"
        },

        10: {
            hoh: "High in the Sky",
            hohType: "physical",
            pov: "Control Your Emojis",
            povType: "mental"
        },

        11: {

            hoh: "Shell or Highwater",
            hohType: "physical",

            pov: "BB Comics",
            povType: "mental",

            doubleEviction: true,

            secondHOH: "Buffering",
            secondHOHType: "mental",

            secondPOV: "Block and Roll",
            secondPOVType: "physical"

        },

        12: {

            hoh: "BBFlix & Chill",
            hohType: "mental",

            pov: "Your Mazes are Numbered",
            povType: "mental",

            secondHOH: "What the Bleep",
            secondHOHType: "mental",

            secondPOV: "Down to the Wires",
            secondPOVType: "physical"

        },

        13: {

            finalHOH: [

                {
                    name: "Jetpack Attack",
                    type: "physical"
                },

                {
                    name: "Mount Evictus",
                    type: "mental"
                },

                {
                    name: "Jury Oddcasts",
                    type: "mental"
                }

            ]

        }

    },


    /* =====================================================
       APP STORE
    ===================================================== */

    twists: {

        appStore: {

            activeWeeks: [1, 2, 3],

            powerApps: [

                {
                    name: "Bonus Life",
                    type: "bonusLife",

                    description:
                        "The holder can give an evicted Houseguest a chance to compete to return to the game."
                },

                {
                    name: "The Cloud",
                    type: "cloud",

                    description:
                        "The holder can protect themselves from one nomination or veto ceremony."
                },

                {
                    name: "Identity Theft",
                    type: "identityTheft",

                    description:
                        "The holder can secretly replace the HOH's nominations."
                }

            ],

            crapApps: [

                {
                    name: "Hamazon",

                    description:
                        "The Houseguest receives a punishment involving repeated ham deliveries."
                },

                {
                    name: "Yell!",

                    description:
                        "The Houseguest receives an annoying review-based punishment."
                },

                {
                    name: "Read It!",

                    description:
                        "The Houseguest must repeatedly read Hamlet in costume."
                }

            ]

        },


        /* =================================================
           HACKER
        ================================================= */

        hacker: {

            activeWeeks: [6, 7],

            abilities: [

                "Replace one nominee",

                "Choose one Veto player",

                "Nullify one eviction vote"

            ]

        },


        /* =================================================
           BATTLE BACK
        ================================================= */

        juryBattleBack: {

            jurors: 4,

            competition: "Big Top Drop",

            type: "physical"

        }

    }

};
