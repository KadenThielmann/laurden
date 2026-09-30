import { $, room, report, esc } from "../act-3/common.js";
import {
  ITEMS,
  LABELS,
  REVEAL_MS,
  shuffled,
  freshLayout,
  placementResult,
  placeItem,
} from "./memory-rules.js";
const drawing = {
  key: '<circle cx="24" cy="25" r="12" fill="none"/><path d="m33 34 22 22m-8-8 7-7m-1 13 7-7"/>',
  puzzle:
    '<path d="M14 18h14c-7-17 21-17 14 0h13v13c17-7 17 21 0 14v13H42c7-17-21-17-14 0H14V45c17 7 17-21 0-14Z" fill="#879b99"/>',
  gingerbread:
    '<path d="M26 28a12 12 0 1 1 16 0l15 5q10 8 1 14l-10-4 5 13q1 13-10 9l-9-13-8 13q-12 3-10-9l5-13-10 4q-10-6 1-14Z" fill="#b28b5e"/><path d="M28 19h1m9 0h1m-10 7q5 4 10 0" stroke="#322b25"/><circle cx="34" cy="37" r="3" fill="#edd29e" stroke="none"/><circle cx="34" cy="45" r="3" fill="#edd29e" stroke="none"/>',
  church:
    '<path d="M11 59V37l15-10 16 10v22Zm31 0V20l12-10 11 10v39Z" fill="#abb8b5"/><path d="M54 3v13m-5-8h10M23 59V44h8v15M49 26h10m-10 7h10"/>',
  letter:
    '<rect x="12" y="12" width="46" height="46" rx="5" fill="#e8d3ac"/><path d="m23 47 12-26 12 26m-19-9h14" stroke="#333b3d" stroke-width="4"/>',
  cat: '<path d="M15 29 12 10l17 12h12L57 10l-3 19q10 30-19 31Q7 59 15 29Z" fill="#c3c7b4"/><path d="M24 37h1m20 0h1m-15 8 4 4 4-4m-4 4v5m-14-9-12-3m39 3 12-3" stroke="#354348"/>',
  phone:
    '<rect x="13" y="34" width="45" height="24" rx="6" fill="#7f959e"/><path d="M10 27q-3-17 14-17h25q17 0 14 17l-14 2-3-8H27l-3 8Z" fill="#75868c"/><circle cx="35" cy="45" r="8" fill="#e7d3af"/><circle cx="35" cy="45" r="3"/>',
  book: '<path d="M35 17Q20 9 9 14v42q12-5 26 3 14-8 27-3V14q-12-5-27 3Z" fill="#8b7788"/><path d="M35 17v42M15 24l13 2m-13 7 13 2m-13 7 13 2m14-18 13-2m-13 11 13-2m-13 11 13-2" stroke="#eddfbd" stroke-width="2"/>',
  flashlight:
    '<path d="m23 34 11 11-20 20-11-11Z" fill="#788e95"/><path d="m20 29 17 17 14-15-17-17Z" fill="#adc0c1"/><path d="m37 12 23-6-6 23Z" fill="#ead49c" stroke="none"/><path d="m16 45 7 7" stroke="#e8ba76"/>',
};
export const itemArt = (id) =>
  `<svg viewBox="0 0 72 72" aria-hidden="true"><g fill="none" stroke="#cfbd98" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${drawing[id]}</g></svg>`;
export function mountMemory(next) {
  const R = room(4, 2, {}, next);
  R.frame(
    '<p class="small">Remember the arrangement.</p><div class="memory-station"><div class="memory-board" data-phase="ready"><div class="memory-study" aria-hidden="true"></div><div class="memory-cover"><div class="memory-answers" hidden aria-label="Rebuild the arrangement"></div><button id="memory-open">Lift cover</button><div class="memory-bolt" aria-hidden="true"></div></div></div><div class="memory-bank" hidden aria-label="Loose items"></div></div>',
  );
  const board = $(".memory-board"),
    study = $(".memory-study"),
    answers = $(".memory-answers"),
    bank = $(".memory-bank"),
    open = $("#memory-open");
  let target = freshLayout(),
    slots = Array(9).fill(null),
    bankOrder = shuffled(ITEMS),
    phase = "ready",
    selected = null,
    drag = null,
    ghost = null,
    suppressClick = false;
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };
  const setPhase = (p) => {
    phase = p;
    board.dataset.phase = p;
  };
  const tile = (id, attrs = "") =>
    `<button class="memory-item ${selected === id ? "chosen" : ""}" data-item="${id}" ${attrs} aria-label="${esc(LABELS[id])}" aria-pressed="${selected === id}">${itemArt(id)}</button>`;
  function render() {
    answers.innerHTML = slots
      .map(
        (id, i) =>
          `<div class="memory-slot" data-slot="${i}">${id ? tile(id) : `<button class="memory-empty" data-place="${i}" aria-label="Place selected item in row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}"></button>`}</div>`,
      )
      .join("");
    bank.innerHTML = bankOrder
      .filter((id) => !slots.includes(id))
      .map((id) => tile(id))
      .join("");
  }
  function reset(auto = false) {
    timers.forEach(clearTimeout);
    timers.clear();
    ghost?.remove();
    ghost = null;
    drag = null;
    target = freshLayout(target);
    slots = Array(9).fill(null);
    bankOrder = shuffled(ITEMS);
    selected = null;
    study.innerHTML = "";
    study.setAttribute("aria-hidden", "true");
    answers.hidden = true;
    bank.hidden = true;
    open.hidden = false;
    open.disabled = false;
    setPhase("ready");
    render();
    if (auto) later(begin, 350);
  }
  function close() {
    if (phase !== "study") return;
    // Remove the reference exactly at the deadline, before the lid animation.
    study.innerHTML = "";
    study.setAttribute("aria-hidden", "true");
    setPhase("closing");
    later(() => {
      if (phase !== "closing") return;
      setPhase("rebuild");
      answers.hidden = false;
      bank.hidden = false;
      render();
    }, 350);
  }
  function begin() {
    if (phase !== "ready") return;
    report("");
    open.hidden = true;
    open.disabled = true;
    setPhase("opening");
    later(() => {
      if (phase !== "opening") return;
      study.innerHTML = target
        .map(
          (id) =>
            `<div class="memory-reference" aria-label="${esc(LABELS[id])}">${itemArt(id)}</div>`,
        )
        .join("");
      study.setAttribute("aria-hidden", "false");
      setPhase("study");
      later(close, REVEAL_MS);
    }, 350);
  }
  function check() {
    const result = placementResult(slots, target);
    if (result === "incomplete") return;
    selected = null;
    setPhase(result === "correct" ? "solved" : "checking");
    answers.querySelectorAll("button").forEach((b) => (b.disabled = true));
    if (result === "correct")
      later(() => {
        R.complete();
      }, 450);
    else {
      report("Not quite.");
      later(() => {
        report("");
        reset(true);
      }, 1000);
    }
  }
  function put(id, at) {
    if (phase !== "rebuild") return;
    slots = placeItem(slots, id, at);
    selected = null;
    render();
    check();
  }
  function tap(e) {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (phase !== "rebuild") return;
    const slot = e.target.closest("[data-slot]"),
      item = e.target.closest("[data-item]");
    if (selected && slot) {
      put(selected, Number(slot.dataset.slot));
      return;
    }
    if (item) {
      selected = selected === item.dataset.item ? null : item.dataset.item;
      render();
    }
  }
  open.onclick = begin;
  $(".memory-station").addEventListener("click", tap);
  const station = $(".memory-station");
  station.addEventListener("pointerdown", (e) => {
    if (phase !== "rebuild" || e.button !== 0 || drag) return;
    const item = e.target.closest("[data-item]");
    if (!item) return;
    drag = {
      id: item.dataset.item,
      x: e.clientX,
      y: e.clientY,
      pointer: e.pointerId,
      moved: false,
      element: item,
    };
    station.setPointerCapture(e.pointerId);
  });
  station.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6)
      return;
    drag.moved = true;
    if (!ghost) {
      ghost = document.createElement("div");
      ghost.className = "memory-ghost";
      ghost.innerHTML = itemArt(drag.id);
      document.body.append(ghost);
    }
    ghost.style.left = e.clientX + "px";
    ghost.style.top = e.clientY - 12 + "px";
  });
  station.addEventListener("pointerup", (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const held = drag;
    drag = null;
    ghost?.remove();
    ghost = null;
    if (!held.moved) {
      tap({ target: held.element });
      suppressClick = true;
      later(() => {
        suppressClick = false;
      }, 0);
    }
    if (held.moved) {
      suppressClick = true;
      later(() => {
        suppressClick = false;
      }, 0);
      const slot = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest("[data-slot]");
      if (slot) put(held.id, Number(slot.dataset.slot));
    }
  });
  const cancel = () => {
    drag = null;
    ghost?.remove();
    ghost = null;
  };
  station.addEventListener("pointercancel", cancel);
  station.addEventListener("lostpointercapture", cancel);
  // Backgrounding the page must never stretch the six-second viewing window.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && ["opening", "study", "closing"].includes(phase))
      reset();
  });
  window.addEventListener("pagehide", () => {
    timers.forEach(clearTimeout);
    cancel();
  });
  render();
}
