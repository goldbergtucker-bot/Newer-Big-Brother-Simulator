const BB20 = {
    id: "bb20",
    name: "Big Brother 20",
    year: 2018,
    startingPlayers: 16,
    nominationCount: 2,
    jurySize: 9,
    juryStartAfterEvictions: 7,
    competitions: {
        1: { hoh: "Microchip Mayhem", pov: "Going Viral" },
        2: { hoh: "Land a Job", pov: "HouseGuestsOnly.com" },
        3: { hoh: "Product Launch", pov: "Mamma Mia! Madness" },
        4: { hoh: "Out on a Limb", pov: "Chop, Bonk, Spank" },
        5: { hoh: "Perfect Timing", pov: "Goober Driver" },
        6: { hoh: "GIF That Keeps on Giving", hacker: "Crack The Code", pov: "Boom Power Trip" },
        7: { hoh: "#HashtagTooLong", hacker: "Hack the House", pov: "OTEV the Sneezy Skunk" },
        8: { hoh: "Glow & Flow", pov: "Zing Force" },
        9: { hoh: "Sweet Shot", pov: "Mission to Planet Veto" },
        10: { hoh: "High in the Sky", pov: "Control Your Emojis" },
        11: { hoh: "Shell or Highwater", pov: "BB Comics", doubleEviction: true, secondHOH: "Buffering", secondPOV: "Block and Roll" },
        12: { hoh: "BBFlix & Chill", pov: "Your Mazes are Numbered", secondHOH: "What the Bleep", secondPOV: "Down to the Wires" },
        13: { finalHOH: ["Jetpack Attack", "Mount Evictus", "Jury Oddcasts"] }
    },
    twists: {
        appStore: {
            activeWeeks: [1, 2, 3],
            powerApps: [
                { name: "Bonus Life", type: "bonusLife", description: "The holder can give an evicted Houseguest a chance to compete to return to the game." },
                { name: "The Cloud", type: "cloud", description: "The holder can protect themselves from one nomination or veto ceremony." },
                { name: "Identity Theft", type: "identityTheft", description: "The holder can secretly replace the HOH's nominations." }
            ],
            crapApps: [
                { name: "Hamazon", description: "The Houseguest receives a punishment involving repeated ham deliveries." },
                { name: "Yell!", description: "An angry reviewer periodically gives the Houseguest feedback." },
                { name: "Read It!", description: "The Houseguest must repeatedly read Hamlet in costume." }
            ]
        },
        hacker: {
            activeWeeks: [6, 7],
            abilities: ["Replace one nominee", "Choose one Veto player", "Nullify one eviction vote"]
        },
        juryBattleBack: {
            jurors: 4,
            competition: "Big Top Drop"
        }
    }
};
