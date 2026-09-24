// Evaluate the whole arrangement against the clues; no per-cell answer hints.
export function validAlcoves(rows) {
  if (rows.length !== 3) return false;
  const visitors = rows.map((row) => row.visitor),
    objects = rows.map((row) => row.object);
  if (new Set(visitors).size !== 3 || new Set(objects).size !== 3) return false;
  if (
    !["Mira", "Theo", "Iris"].every((v) => visitors.includes(v)) ||
    !["Compass", "Watch", "Key"].every((v) => objects.includes(v))
  )
    return false;
  const mira = visitors.indexOf("Mira"),
    theo = visitors.indexOf("Theo"),
    iris = visitors.indexOf("Iris");
  return (
    theo === mira + 1 &&
    mira !== 0 &&
    objects[iris] === "Compass" &&
    objects[1] === "Key"
  );
}
