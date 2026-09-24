// Act 3 content and replaceable assets. Photo crop x/y are fractions from 0 to 1.
export const content = {
  pipes: {
    size: 6,
    types: [
      ["L", "I", "L", "L", "L", "#"],
      ["L", "L", "I", "I", "I", "#"],
      ["I", "L", "I", "I", "L", "L"],
      ["L", "I", "L", "I", "L", "L"],
      ["I", "L", "L", "I", "I", "#"],
      ["L", "L", "L", "L", "L", "I"],
    ],
    initial_rotations: [
      [2, 1, 2, 1, 2, -1],
      [3, 0, 1, 1, 1, -1],
      [0, 3, 0, 0, 3, 0],
      [1, 1, 3, 1, 3, 1],
      [0, 3, 1, 0, 0, -1],
      [2, 1, 1, 0, 2, 1],
    ],
    source: {
      cell: [2, 0],
      port: "W",
    },
    outlet: {
      cell: [5, 5],
      port: "E",
    },
    fixed_cells_0based: [
      [2, 1],
      [3, 2],
    ],
    ball_code: "5826",
  },
  regions: [
    [0, 0, 0, 0, 1, 1, 1, 1],
    [0, 2, 0, 1, 1, 1, 1, 1],
    [3, 2, 2, 2, 1, 1, 1, 4],
    [3, 3, 2, 2, 2, 7, 7, 4],
    [3, 3, 2, 7, 7, 7, 4, 4],
    [5, 3, 2, 7, 7, 7, 7, 6],
    [5, 3, 7, 7, 7, 7, 7, 6],
    [3, 3, 7, 7, 7, 7, 7, 7],
  ],
  overlays: {
    answer: "7392",
    rotation_step_degrees: 15,
    initial_top_degrees: 75,
    initial_bottom_degrees: 210,
  },
  note: {
    code: "6284",
    initial: [5, 1, 7, 3, 0, 6, 2, 4],
  },
  chains: {
    chains: [
      {
        id: "L1",
        origin: [100, 120],
        length: 913.0169768410661,
      },
      {
        id: "L2",
        origin: [100, 340],
        length: 1056.4563407921787,
      },
      {
        id: "L3",
        origin: [100, 610],
        length: 959.6353474106714,
      },
      {
        id: "L4",
        origin: [100, 880],
        length: 997.0080240399271,
      },
      {
        id: "R1",
        origin: [900, 170],
        length: 922.8217596047463,
      },
      {
        id: "R2",
        origin: [900, 420],
        length: 1049.952379872535,
      },
      {
        id: "R3",
        origin: [900, 690],
        length: 1018.2828683622248,
      },
      {
        id: "R4",
        origin: [900, 960],
        length: 1030.7764064044152,
      },
    ],
    hooks: [
      {
        id: "LH1",
        point: [100, 60],
      },
      {
        id: "LH2",
        point: [100, 310],
      },
      {
        id: "LH3",
        point: [100, 630],
      },
      {
        id: "LH4",
        point: [100, 1100],
      },
      {
        id: "RH1",
        point: [900, 80],
      },
      {
        id: "RH2",
        point: [900, 285],
      },
      {
        id: "RH3",
        point: [900, 560],
      },
      {
        id: "RH4",
        point: [900, 1030],
      },
    ],
    tolerance: 8,
    code: "7142",
  },
  sliding: {
    initial: [1, 5, 2, 7, 6, 4, 8, 3, 0],
    image: "assets/personal-photo.jpg",
    development: false,
    crop: {
      x: 0.5,
      y: 0.5,
    },
  },
  phone: {
    questions: {
      1: "What are you doing?",
      2: "Which book?",
      3: "Haven’t you read that already?",
    },
    clips: {
      greeting: "phone-greeting.mp3",
      1: "phone-reading.mp3",
      2: "phone-book.mp3",
      3: "phone-repeat.mp3",
      invalid: "phone-unrecognized.mp3",
    },
  },
  bookCode: "36794",
  symbolC: "⏣",
};
