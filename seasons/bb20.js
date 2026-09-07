const BB20 = {

    // =========================
    // BASIC SEASON INFORMATION
    // =========================

    seasonName: "Big Brother 20",

    seasonNumber: 20,

    houseguestCount: 16,

    finalists: 2,

    jurySize: 9,

    preJurySize: 5,


    // =========================
    // SEASON TWISTS
    // =========================

    twists: {

        houseDivision: true,

        appStore: true,

        hackerTwist: true,

        bonusLife: true,

        juryBattleBack: true,

        doubleEviction: true

    },


    // =========================
    // WEEK 1
    // =========================

    week1: {

        immunityCompetitions: [

            {
                name: "Trash Folder",

                type: "Mental",

                players: 8,

                description:
                    "Houseguests hunt for folders. The player without a folder receives a punishment."
            },

            {
                name: "Cyber Security",

                type: "Physical",

                players: 8,

                description:
                    "Houseguests gather blocks and spell HOUSEGUEST."
            }

        ],


        immunityFinal: {

            name: "Surfing the BB Web",

            type: "Physical",

            players: 2,

            description:
                "The two winners compete for the power to select eight safe houseguests.",

            immunePlayers: 8

        },


        hoh: {

            name: "Microchip Mayhem",

            type: "Physical",

            description:
                "Houseguests place deletion dots into opponents tubes. Ten dots eliminates a player.",

            winnerType: "Stat-Based",

            eligiblePlayers: "Non-Immune"

        },


        nominations: 2,


        veto: {

            played: true,

            name: "Going Viral",

            type: "Physical / Skill / Endurance",

            players: 6,

            selection:

                "HOH + 2 Nominees + 3 Random Players"

        },


        specialTwist: {

            name: "BB App Store",

            power: "Bonus Life App",

            description:
                "Can save an evicted houseguest and allow them to compete to return."

        },


        eviction: {

            type: "Normal Vote",

            votingRule:
                "Nominees cannot vote. HOH only votes in a tie."

        }

    },


    // =========================
    // WEEK 2
    // =========================

    week2: {

        hoh: {

            name: "Land A Job",

            type: "Luck"

        },


        nominations: 2,


        veto: {

            played: true,

            name: "HouseguestsOnly.com",

            type: "Mental",

            players: 6,

            selection:
                "HOH + 2 Nominees + 3 Random Players"

        },


        specialTwist: {

            name: "BB App Store",

            power: "The Cloud",

            description:
                "The holder can become immune from nominations."

        },


        eviction: {

            type: "Normal Vote"

        }

    },


    // =========================
    // WEEK 3
    // =========================

    week3: {

        hoh: {

            name: "Product Launch",

            type: "Mental"

        },


        nominations: 2,


        veto: {

            played: true,

            name: "Mamma Mia Mayhem",

            type: "Skill / Physical / Mental",

            players: 6

        },


        specialTwist: {

            name: "BB App Store",

            power: "Identity Theft",

            description:
                "The holder can secretly replace the HOH nominations."

        },


        eviction: {

            type: "Normal Vote"

        }

    },


    // =========================
    // WEEK 4
    // =========================

    week4: {

        hoh: {

            name: "Out On A Limb",

            type: "Endurance",

            wallCompetition: true

        },


        nominations: 2,


        veto: {

            played: true,

            name: "Chomp, Bonk, Spank",

            type: "Mental",

            players: 6

        },


        specialTwist: null,


        eviction: {

            type: "Normal Vote"

        },


        reentry: {

            enabled: true,

            name: "Outside The House",

            condition:
                "Only occurs if Bonus Life App is used."

        }

    },


    // =========================
    // WEEK 5
    // =========================

    week5: {

        hoh: {

            name: "Information Highway",

            type: "Skill / Luck"

        },


        nominations: 2,


        veto: {

            played: true,

            name: "Goober Driver",

            type: "Physical / Mental",

            players: 6

        },


        specialTwist: null,


        eviction: {

            type: "Normal Vote"

        }

    },


    // =========================
    // WEEK 6
    // =========================

    week6: {

        hoh: {

            name: "The GIF That Keeps on Giving",

            type: "Mental"

        },


        hackerCompetition: {

            enabled: true,

            name: "Crack The Code",

            description:
                "Houseguests compete for the Hacker power."

        },


        nominations: 2,


        veto: {

            played: true,

            name: "Boom Power Trip",

            type: "Physical",

            players: 6,

            selection:
                "HOH + 2 Nominees + 2 Random Players + Hacker Choice"

        },


        specialTwist: {

            name: "Hacker Competition"

        },


        eviction: {

            type: "Normal Vote",

            hackerCanBlockVote: true

        }

    },


    // =========================
    // WEEK 7
    // =========================

    week7: {

        hoh: {

            name: "#HashtagTooLong!",

            type: "Mental"

        },


        hackerCompetition: {

            enabled: true,

            name: "Crack The Code"

        },


        nominations: 2,


        veto: {

            played: true,

            name: "OTEV the Sneezy Skunk",

            type: "Physical / Mental",

            players: 6

        },


        specialTwist: {

            name: "Hacker Competition"

        },


        eviction: {

            type: "Normal Vote",

            hackerCanBlockVote: true

        }

    },


    // =========================
    // WEEK 8
    // =========================

    week8: {

        hoh: {

            name: "Glow & Flow",

            type: "Physical / Endurance",

            slipAndSlide: true

        },


        nominations: 2,


        veto: {

            played: true,

            name: "Zing Force",

            type: "Mental / Luck",

            players: 6

        },


        specialTwist: null,


        eviction: {

            type: "Normal Vote"

        }

    },


    // =========================
    // WEEK 9
    // =========================

    week9: {

        hoh: {

            name: "Sweet Shot",

            type: "Skill / Luck"

        },


        nominations: 2,


        veto: {

            played: true,

            name: "Mission to Planet Veto",

            type: "Physical",

            players: 6

        },


        specialTwist: null,


        eviction: {

            type: "Normal Vote"

        }

    },


    // =========================
    // WEEK 10
    // =========================

    week10: {

        reentry: {

            enabled: true,

            name: "Big Top Drop",

            condition:
                "Only happens if the Bonus Life App did not result in a returning player."

        },


        hoh: {

            name: "Pie in the Sky",

            type: "Physical / Endurance"

        },


        nominations: 2,


        veto: {

            played: true,

            name: "Control Your Emoji",

            type: "Skill / Physical / Endurance",

            players: 6

        },


        specialTwist: {

            name: "Jury Battle Back"

        },


        eviction: {

            type: "Normal Vote"

        }

    },


    // =========================
    // WEEK 11
    // =========================

    week11: {

        hoh: {

            name: "Shell or Highwater",

            type: "Skill"

        },


        nominations: 2,


        veto: {

            played: true,

            name: "BB Comics",

            type: "Physical / Mental",

            players: 6

        },


        specialTwist: {

            name: "Double Eviction Part 1"

        },


        eviction: {

            type: "Normal Vote"

        }

    },


    // =========================
    // WEEK 11 DOUBLE EVICTION
    // =========================

    week11Double: {

        hoh: {

            name: "Buffering",

            type: "Mental"

        },


        nominations: 2,


        veto: {

            played: true,

            name: "Block and Roll",

            type: "Skill",

            players: 6

        },


        specialTwist: {

            name: "Double Eviction Part 2"

        },


        eviction: {

            type: "Normal Vote"

        }

    },


    // =========================
    // WEEK 12
    // =========================

    week12: {

        hoh: {

            name: "BB Flix & Chill",

            type: "Mental"

        },


        nominations: 2,


        veto: {

            played: true,

            name: "Your Maze Are Numbered",

            type: "Mental / Skill",

            players: 5

        },


        specialTwist: null,


        eviction: {

            type: "Normal Vote"

        }

    },


    // =========================
    // WEEK 13
    // =========================

    week13: {

        hoh: {

            name: "What The Bleep?",

            type: "Mental"

        },


        nominations: 2,


        veto: {

            played: true,

            name: "Down to the Wires",

            type: "Physical / Mental",

            players: 6

        },


        specialTwist: null,


        eviction: {

            type: "Normal Vote"

        }

    },


    // =========================
    // FINALE
    // =========================

    finale: {

        finalHOH: [

            {

                name: "Jetpack Attack",

                type: "Physical / Endurance"

            },


            {

                name: "Mount Evictus",

                type: "Mental"

            },


            {

                name: "Jury Oddcasts",

                type: "Mental"

            }

        ],


        finalTwo: true,


        juryVote: {

            jurors: 9,

            winner: "Majority Vote"

        }

    }

};
