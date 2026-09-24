// Centralized authored codes and room content.
export const content = {
  paint: {
    components: ["cyan", "magenta", "yellow"],
    initial_percentages: [34, 33, 33],
    target_rgb: [179, 128, 204],
    code: "8536",
  },
  gingerbreadCode: "4665",
  handoff: {
    recipient: "Kaden",
    body: "The moth has found the window.\n\nAwaiting your reply.",
    code: "59271",
  },
  alcoves: {
    visitor: ["Mira", "Theo", "Iris"],
    object: ["Compass", "Watch", "Key"],
    clues: [
      "Each visitor and object belongs in one alcove.",
      "Theo is immediately to the right of Mira.",
      "Iris has the compass.",
      "The key is in the middle alcove.",
      "Mira is not in the left alcove.",
    ],
  },
  murder: {
    badges: {
      Lena: "31482",
      Felix: "74193",
      Mara: "83461",
      Jonas: "85621",
      Priya: "59264",
    },
    code: "83461",
    evidence: [
      [
        "Incident brief",
        "ARCHIVE STUDY — INCIDENT BRIEF\n\nThe archivist was killed during the evening shift. The room's synchronized incident recorder establishes that the fatal assault occurred between 20:14 and 20:16 on the master clock.\n\nThe attacker was physically inside the study during that interval. The only possible attackers are the five employees whose badge cards are on this desk.\n\nThe study has one entrance. Its complete entry/exit record is attached. There are no unrecorded entrances, hidden routes, delayed mechanisms, or additional visitors. Each recorded visit contained only the archivist and the entering employee; nobody stayed concealed after a recorded exit.\n\nThe technical records and written key-transfer records are accurate and complete. No keys were duplicated, lost, or exchanged except as documented. Employee statements are not guaranteed to be truthful.",
      ],
      [
        "Initial key register",
        "20:00 MASTER CLOCK — INITIAL ISSUE\n\nLena · Badge 31482 · circle key\nFelix · Badge 74193 · square key\nMara · Badge 83461 · triangle key\nJonas · Badge 85621 · star key\nPriya · Badge 59264 · crescent key\n\nEach employee keeps exactly one key after each documented exchange. Badge numbers identify people; key symbols identify physical keys.",
      ],
      [
        "Clock maintenance card",
        "CLOCK CHECK\n\nMaster clock: 20:00\n\nStudy-door display at the same instant: 20:04\n\nThe study-door clock was not adjusted until 20:30 master time. All other times on these papers use the master clock unless explicitly marked DOOR DISPLAY.",
      ],
      [
        "Study-door record",
        "DOOR DISPLAY TIMES\n\n20:09 · square · ENTER\n20:11 · square · EXIT\n20:18 · star · ENTER\n20:20 · star · EXIT\n20:23 · crescent · ENTER\n20:24 · crescent · EXIT\n\nNo other study visits occurred within the incident period.",
      ],
      [
        "First two handover slips",
        "20:06 — MASTER CLOCK\n\nLena and Mara exchanged their complete keyrings.\n\n20:10 — MASTER CLOCK\n\nPriya took the circle key from Mara. Mara took Priya's crescent key in exchange.",
      ],
      [
        "Final handover work order",
        "20:12 — MASTER CLOCK\n\nThe employee holding the crescent key exchanged complete keyrings with the employee holding the star key.\n\nNo further exchanges or returns took place before 20:30.",
      ],
      [
        "Employee statements",
        "Lena: “Mara and I exchanged keys early in the shift. I had the triangle key after that.”\n\nFelix: “My visit to the study was before the incident. I used the square key.”\n\nMara: “I still had the crescent key when the incident happened. I never held the star key.”\n\nJonas: “I entered later. The door display read 20:23, and I was carrying the crescent key.”\n\nPriya: “I took the circle key from Mara and did not give it back before 20:30.”",
      ],
    ],
  },
  symbolD: "⟡",
  reward: "PRIZE REVEAL — CONTENT TO BE ADDED",
};
