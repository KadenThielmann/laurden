// Pure puzzle rules, shared by the interface and automated validation.
export const LIGHTS_SIZE = 5;
export const LIGHTS_START = [
  1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1,
];
export function toggleLights(board, index) {
  const next = [...board],
    x = index % LIGHTS_SIZE,
    y = Math.floor(index / LIGHTS_SIZE);
  for (const [dx, dy] of [
    [0, 0],
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]) {
    const a = x + dx,
      b = y + dy;
    if (a >= 0 && a < LIGHTS_SIZE && b >= 0 && b < LIGHTS_SIZE)
      next[b * LIGHTS_SIZE + a] ^= 1;
  }
  return next;
}
export function solveLights(board) {
  const rows = board.map((b, i) => {
    const coefficients = Array.from(
      { length: 25 },
      (_, j) => toggleLights(Array(25).fill(0), j)[i],
    );
    return [...coefficients, b];
  });
  const pivots = [];
  let r = 0;
  for (let c = 0; c < 25; c++) {
    const p = rows.findIndex((row, i) => i >= r && row[c]);
    if (p < 0) continue;
    [rows[r], rows[p]] = [rows[p], rows[r]];
    for (let i = 0; i < 25; i++)
      if (i !== r && rows[i][c])
        for (let j = c; j <= 25; j++) rows[i][j] ^= rows[r][j];
    pivots.push(c);
    r++;
  }
  if (rows.some((row) => row.slice(0, 25).every((x) => !x) && row[25]))
    return null;
  const answer = Array(25).fill(0);
  pivots.forEach((p, i) => (answer[p] = rows[i][25]));
  return answer;
}
export const DISTRIBUTION = {
  A: 13,
  B: 3,
  C: 3,
  D: 6,
  E: 18,
  F: 3,
  G: 4,
  H: 3,
  I: 12,
  J: 2,
  K: 2,
  L: 5,
  M: 3,
  N: 8,
  O: 11,
  P: 3,
  Q: 2,
  R: 9,
  S: 6,
  T: 9,
  U: 6,
  V: 3,
  W: 3,
  X: 2,
  Y: 3,
  Z: 2,
};
export function shuffle(a, random = Math.random) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function createBunch(sequence = null, random = Math.random) {
  const bunch = Object.entries(DISTRIBUTION).flatMap(([c, n]) =>
    Array(n).fill(c),
  );
  const chosen =
    sequence === null
      ? []
      : Array.isArray(sequence)
        ? sequence
        : String(sequence).replace(/\s/g, "").split("");
  for (const c of chosen) {
    const index = bunch.indexOf(c);
    if (index < 0) throw Error("Draw sequence exceeds the English bunch.");
    bunch.splice(index, 1);
  }
  return [...chosen, ...shuffle(bunch, random)];
}
export function createBananas(sequence = null, random = Math.random) {
  const state = {
    bunch: createBunch(sequence, random),
    tiles: [],
    peels: 0,
    nextId: 0,
    complete: false,
  };
  drawTiles(state, 21);
  return state;
}
export function drawTiles(state, count) {
  if (state.bunch.length < count) return false;
  for (let i = 0; i < count; i++)
    state.tiles.push({
      id: state.nextId++,
      letter: state.bunch.shift(),
      x: null,
      y: null,
    });
  return true;
}
export function dumpTile(state, id, random = Math.random) {
  const index = state.tiles.findIndex((t) => t.id === id && t.x === null);
  if (state.complete || index < 0 || state.bunch.length < 2) return false;
  const [tile] = state.tiles.splice(index, 1);
  state.bunch.push(tile.letter);
  state.bunch = shuffle(state.bunch, random);
  drawTiles(state, 3);
  return true;
}
export function validateGrid(tiles, words) {
  if (!tiles.length || tiles.some((t) => t.x === null))
    return { valid: false, pending: true, invalid: [] };
  const key = (x, y) => `${x},${y}`,
    map = new Map(tiles.map((t) => [key(t.x, t.y), t]));
  if (map.size !== tiles.length)
    return { valid: false, invalid: [], reason: "overlap" };
  const visited = new Set(),
    queue = [tiles[0]];
  while (queue.length) {
    const t = queue.pop(),
      k = key(t.x, t.y);
    if (visited.has(k)) continue;
    visited.add(k);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = map.get(key(t.x + dx, t.y + dy));
      if (next && !visited.has(key(next.x, next.y))) queue.push(next);
    }
  }
  const invalid = [],
    formed = [];
  for (const t of tiles)
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
    ]) {
      if (map.has(key(t.x - dx, t.y - dy))) continue;
      const run = [];
      let x = t.x,
        y = t.y;
      while (map.has(key(x, y))) {
        run.push(map.get(key(x, y)));
        x += dx;
        y += dy;
      }
      if (run.length > 1) {
        const word = run.map((t) => t.letter).join("");
        formed.push(word);
        if (!words.has(word)) invalid.push({ word, ids: run.map((t) => t.id) });
      }
    }
  return {
    valid:
      visited.size === tiles.length &&
      formed.length > 0 &&
      invalid.length === 0,
    invalid,
    connected: visited.size === tiles.length,
    formed,
  };
}
export function peel(state, words) {
  if (state.complete) return "complete";
  if (!validateGrid(state.tiles, words).valid) return "invalid";
  if (state.peels === 8) {
    state.complete = true;
    return "complete";
  }
  if (!drawTiles(state, 1)) return "empty";
  state.peels++;
  return "peel";
}
export function weighingCode(objects) {
  if (objects.length !== 8 || new Set(objects.map((o) => o.id)).size !== 8)
    return null;
  const ordered = [...objects].sort((a, b) => a.position - b.position);
  if (
    ordered.some(
      (o, i) =>
        o.position !== i + 1 || !/^\d$/.test(o.value) || !o.name || !o.image,
    )
  )
    return null;
  return ordered.map((o) => o.value).join("");
}
export function dictionaryPage(config) {
  if (!config.clue || !config.target || config.pages.length < 2) return null;
  let previous = "",
    number = 99;
  const found = [];
  for (const page of config.pages) {
    if (
      !Number.isInteger(page.number) ||
      page.number < 100 ||
      page.number > 999 ||
      page.number <= number ||
      !page.words.length
    )
      return null;
    number = page.number;
    for (const word of page.words) {
      if (!/^[a-z]+$/.test(word) || word <= previous) return null;
      previous = word;
      if (word === config.target) found.push(page.number);
    }
  }
  return found.length === 1 ? String(found[0]) : null;
}
// Fixed optical machine. Direction 0 east, 1 south, 2 west, 3 north.
export const LASER = {
  size: 9,
  emitter: [0, 7],
  direction: 0,
  target: [8, 1],
  mirrors: [
    [2, 7],
    [2, 4],
    [6, 4],
    [6, 6],
    [4, 6],
    [4, 2],
    [7, 2],
    [7, 1],
  ],
  initial: [1, 1, 1, 0, 1, 1, 1, 0],
  walls: [
    [1, 3],
    [3, 3],
    [5, 3],
    [8, 3],
    [0, 5],
    [3, 5],
    [5, 5],
    [8, 5],
    [0, 0],
    [4, 0],
    [6, 0],
    [1, 8],
    [5, 8],
    [8, 8],
  ],
};
export function traceLaser(orientations, geometry = LASER) {
  const { size, mirrors, walls, target } = geometry;
  let [x, y] = geometry.emitter,
    d = geometry.direction;
  const path = [[x, y]],
    seen = new Set(),
    directions = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
  for (let step = 0; step < size * size * 4; step++) {
    const key = `${x},${y},${d}`;
    if (seen.has(key)) return { path, hit: false, loop: true };
    seen.add(key);
    x += directions[d][0];
    y += directions[d][1];
    path.push([x, y]);
    if (x < 0 || y < 0 || x >= size || y >= size) return { path, hit: false };
    if (walls.some((w) => w[0] === x && w[1] === y)) {
      path[path.length - 1] = [
        x - directions[d][0] * 0.5,
        y - directions[d][1] * 0.5,
      ];
      return { path, hit: false };
    }
    if (x === target[0] && y === target[1]) return { path, hit: true };
    const i = mirrors.findIndex((m) => m[0] === x && m[1] === y);
    if (i >= 0) d = orientations[i] === 0 ? [3, 2, 1, 0][d] : [1, 0, 3, 2][d];
  }
  return { path, hit: false, loop: true };
}
export function reverseChannels(channels) {
  return channels.map((channel) => Float32Array.from(channel).reverse());
}
