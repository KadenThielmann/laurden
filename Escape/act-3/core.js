// Pure rules: presentation coordinates never participate in puzzle validation.
export function pipeRoute(types, rotations, source, outlet) {
  const dirs = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ],
    ports = { N: 0, E: 1, S: 2, W: 3 };
  let [r, c] = source.cell,
    entering = ports[source.port];
  const seen = new Set(),
    path = [];
  for (let step = 0; step < types.length ** 2; step++) {
    if (!types[r]?.[c] || types[r][c] === "#" || seen.has(`${r},${c}`))
      return null;
    const rot = rotations[r][c],
      openings = (types[r][c] === "I" ? [0, 2] : [0, 1]).map(
        (x) => (x + rot) % 4,
      );
    if (!openings.includes(entering)) return null;
    seen.add(`${r},${c}`);
    path.push([r, c]);
    const exit = openings.find((x) => x !== entering);
    if (
      r === outlet.cell[0] &&
      c === outlet.cell[1] &&
      exit === ports[outlet.port]
    )
      return path;
    r += dirs[exit][0];
    c += dirs[exit][1];
    entering = (exit + 2) % 4;
  }
  return null;
}
export function validCats(cats, regions) {
  if (
    cats.length !== 8 ||
    new Set(cats).size !== 8 ||
    cats.some((i) => !Number.isInteger(i) || i < 0 || i > 63)
  )
    return false;
  const cells = cats.map((i) => [Math.floor(i / 8), i % 8]);
  return (
    new Set(cells.map((x) => x[0])).size === 8 &&
    new Set(cells.map((x) => x[1])).size === 8 &&
    new Set(cells.map(([r, c]) => regions[r][c])).size === 8 &&
    cells.every(([r, c], i) =>
      cells.every(
        ([a, b], j) =>
          i === j || Math.max(Math.abs(r - a), Math.abs(c - b)) > 1,
      ),
    )
  );
}
export function slide(tiles, id) {
  const width = Math.sqrt(tiles.length),
    i = tiles.indexOf(id),
    z = tiles.indexOf(0);
  if (
    id === 0 ||
    i < 0 ||
    Math.abs((i % width) - (z % width)) +
      Math.abs(Math.floor(i / width) - Math.floor(z / width)) !==
      1
  )
    return tiles;
  const next = [...tiles];
  [next[i], next[z]] = [next[z], next[i]];
  return next;
}
export const slidingSolved = (t) =>
  t.every((v, i) => v === (i === t.length - 1 ? 0 : i + 1));
export function latch(chain, hook, tolerance = 8) {
  if (chain.origin[0] === hook.point[0]) return false;
  return (
    Math.abs(
      Math.hypot(...hook.point.map((n, i) => n - chain.origin[i])) -
        chain.length,
    ) <= tolerance
  );
}
export const paintRGB = (p) =>
  p.map((v) => Math.floor(255 * (1 - v / 100) + 0.5));
export const paintMatches = (p, target) =>
  p.length === 3 &&
  p.every((v) => Number.isInteger(v) && v >= 0 && v <= 100) &&
  p.reduce((a, b) => a + b, 0) === 100 &&
  paintRGB(p).every((v, i) => Math.abs(v - target[i]) <= 30);
export const symbolAttempt = (s) => s.length === 4 && s.join(",") === "A,B,C,D";
// A rigid strip rotates about its pivot; its length never changes.
export function chainPoints(chain, end, count = 32) {
  const [x, y] = chain.origin,
    dx = end[0] - x,
    dy = end[1] - y;
  const angle = Math.hypot(dx, dy) === 0 ? Math.PI / 2 : Math.atan2(dy, dx);
  return Array.from({ length: count + 1 }, (_, i) => [
    x + (Math.cos(angle) * chain.length * i) / count,
    y + (Math.sin(angle) * chain.length * i) / count,
  ]);
}
