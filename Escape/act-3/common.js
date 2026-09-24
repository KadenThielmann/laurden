export const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
export const copy = (x) => JSON.parse(JSON.stringify(x));
// Like Acts 1 and 2, puzzle state exists only while this page is open.
// Each page load starts from its authored initial arrangement.
export function room(act, index, initial, next, completion = false) {
  const state = copy(initial);
  document.body.classList.toggle("puzzle-only", !completion);
  const frame = (html) => {
    $("#app").innerHTML =
      `${completion ? `<div class="eyebrow">Act ${act === 3 ? "three" : "four"} complete</div><h1>Act ${act === 3 ? "III" : "IV"}</h1>` : ""}<section class="surface">${html}</section><div id="status" class="status" role="status" aria-live="polite"></div><div id="next" class="room-footer"></div>`;
  };
  const showNext = () => {
    if (!next) return;
    $("#next").innerHTML =
      `<a class="next button" href="${esc(next)}">Continue</a>`;
    reveal($("#next a"));
  };
  const complete = () => {
    if (state.solved) return;
    state.solved = true;
    report("");
    $(".surface")?.classList.add("success");
    showNext();
  };
  return { state, frame, complete };
}
// Keep the same quiet Continue interaction as the earlier acts, within reach.
export function reveal(element) {
  requestAnimationFrame(() => {
    if (!element?.isConnected || element.hidden) return;
    const r = element.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight)
      element.scrollIntoView({
        block: "nearest",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  });
}
export function reject(element, text = "Not quite. Try again.") {
  element.classList.remove("rejected");
  void element.offsetWidth;
  element.classList.add("rejected");
  report(text);
}
export function report(text) {
  if ($("#status")) $("#status").textContent = text;
}
// Act 2's scroll-wheel lock, retaining its 44px snap controls and keyboard entry.
export function lock(
  host,
  code,
  onSuccess,
  { opened = false, enabled = () => true } = {},
) {
  const alphabet = [..."0123456789"];
  let done = opened;
  host.className += " combination-lock";
  host.innerHTML =
    '<svg class="combo-shackle" viewBox="0 0 120 70" aria-hidden="true"><path d="M25 68V36a35 35 0 0 1 70 0v32" fill="none" stroke="#b8c3cb" stroke-width="12"/></svg><div class="combo-body"><div class="combo-wheels"></div><button class="primary combo-submit">Unlock</button></div>';
  const wheels = [];
  for (let i = 0; i < code.length; i++) {
    const wheel = document.createElement("div");
    wheel.className = "number-wheel";
    wheel.tabIndex = 0;
    wheel.setAttribute("role", "spinbutton");
    wheel.setAttribute("aria-label", `Digit ${i + 1}`);
    wheel.setAttribute("aria-valuemin", "0");
    wheel.setAttribute("aria-valuemax", "9");
    wheel.setAttribute("aria-valuenow", "0");
    wheel.innerHTML = `<div class="wheel-digits">${Array.from({ length: 30 }, (_, j) => `<div class="wheel-digit">${j % 10}</div>`).join("")}</div>`;
    host.querySelector(".combo-wheels").append(wheel);
    wheels.push(wheel);
    let initializing = true;
    const value = () => Math.round(wheel.scrollTop / 44) % 10;
    let settle;
    wheel.onscroll = () => {
      wheel.setAttribute("aria-valuenow", String(value()));
      clearTimeout(settle);
      settle = setTimeout(() => {
        if (done) return;
        const row = Math.round(wheel.scrollTop / 44);
        if (row < 5 || row > 24) wheel.scrollTop = (10 + (row % 10)) * 44;
      }, 150);
    };
    wheel.onkeydown = (e) => {
      if (done) return;
      let v = /^[0-9]$/.test(e.key)
        ? Number(e.key)
        : e.key === "Home"
          ? 0
          : e.key === "End"
            ? 9
            : e.key === "ArrowUp"
              ? (value() + 1) % 10
              : e.key === "ArrowDown"
                ? (value() + 9) % 10
                : null;
      if (e.key === "Enter") {
        e.preventDefault();
        host.querySelector("button").click();
        return;
      }
      if (v === null) return;
      e.preventDefault();
      initializing = false;
      wheel.scrollTop = (10 + v) * 44;
      wheel.setAttribute("aria-valuenow", String(v));
    };
    requestAnimationFrame(() => {
      if (!initializing) return;
      wheel.scrollTop = 10 * 44;
      wheel.setAttribute("aria-valuenow", "0");
      requestAnimationFrame(() => {
        initializing = false;
      });
    });
  }
  function sync() {
    host.classList.toggle("open", done);
    host.setAttribute("aria-label", done ? "Unlocked" : "Combination lock");
    host.querySelector("button").disabled = done || !enabled();
    wheels.forEach((w) => {
      w.tabIndex = done ? -1 : 0;
    });
  }
  host.querySelector("button").onclick = () => {
    if (done || !enabled()) return;
    const guess = wheels
      .map((w) => alphabet[Math.round(w.scrollTop / 44) % 10])
      .join("");
    if (guess !== code) {
      reject(host);
      return;
    }
    done = true;
    report("");
    sync();
    onSuccess();
  };
  sync();
  return { sync };
}
export function pointerDrag(element, { start, move, end, cancel }) {
  let active = null;
  element.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || active !== null) return;
    if (start(e) === false) return;
    active = e.pointerId;
    element.setPointerCapture(e.pointerId);
  });
  element.addEventListener("pointermove", (e) => {
    if (e.pointerId === active) move(e);
  });
  element.addEventListener("pointerup", (e) => {
    if (e.pointerId !== active) return;
    active = null;
    end(e);
  });
  const abort = (e) => {
    if (e.pointerId !== active) return;
    active = null;
    cancel?.(e);
  };
  element.addEventListener("pointercancel", abort);
  element.addEventListener("lostpointercapture", abort);
}
export function svgPoint(svg, e) {
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
    svg.getScreenCTM().inverse(),
  );
  return [p.x, p.y];
}
export const catArt =
  '<svg viewBox="0 0 50 50" aria-hidden="true"><path d="M9 22L7 4 22 14Q25 12 28 14L43 4 41 22Q50 45 25 46Q0 45 9 22Z" fill="#f5ead6" stroke="#2a2521" stroke-width="2"/><path d="M16 26h1m16 0h1M22 33l3 3 3-3" stroke="#302721" stroke-width="3" stroke-linecap="round"/></svg>';
export function symbols() {
  // A/B are the exact original Unicode artwork and inherit the same system font.
  return {
    A: "⟐",
    B: "☷",
    C: "⏣",
    D: "⟡",
    e: "☰",
    f: "⊙",
    g: "⊗",
    h: "✣",
    i: "⋈",
    j: "⌘",
    k: "⌁",
    l: "⊥",
    m: "∴",
    n: "☽",
    o: "⌖",
    p: "≋",
  };
}
