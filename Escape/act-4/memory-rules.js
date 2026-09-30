export const ITEMS = [
  "key",
  "puzzle",
  "gingerbread",
  "church",
  "letter",
  "cat",
  "phone",
  "book",
  "flashlight",
];
export const LABELS = {
  key: "Key",
  puzzle: "Puzzle piece",
  gingerbread: "Gingerbread man",
  church: "Church",
  letter: "Letter tile",
  cat: "Cat",
  phone: "Phone",
  book: "Book",
  flashlight: "Flashlight",
};
export const REVEAL_MS = 7500;
export function shuffled(values, random = Math.random) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function freshLayout(previous = [], random = Math.random) {
  let out = shuffled(ITEMS, random);
  if (out.every((id, i) => id === previous[i]))
    [out[0], out[1]] = [out[1], out[0]];
  return out;
}
export function placementResult(slots, target) {
  if (
    slots.length !== 9 ||
    slots.some((id) => !ITEMS.includes(id)) ||
    new Set(slots).size !== 9
  )
    return "incomplete";
  return slots.every((id, i) => id === target[i]) ? "correct" : "incorrect";
}
export function placeItem(slots, item, at) {
  if (!ITEMS.includes(item) || !Number.isInteger(at) || at < 0 || at > 8)
    return [...slots];
  const out = [...slots],
    from = out.indexOf(item);
  if (from === at) return out;
  const displaced = out[at];
  if (from !== -1) out[from] = displaced;
  out[at] = item;
  return out;
}
