import { $, $$, room, esc, lock } from "../act-3/common.js";
export const RECORDS = [
  {
    id: "tower",
    name: "Tower",
    digit: "2",
    note: "The Garden dispatch was sent immediately after mine.",
  },
  {
    id: "harbour",
    name: "Harbour",
    digit: "1",
    note: "No further dispatches were sent after mine that evening.",
  },
  {
    id: "bell",
    name: "Bell",
    digit: "4",
    note: "My dispatch was already on its way when the Bridge dispatch was sent.",
  },
  {
    id: "orchard",
    name: "Orchard",
    digit: "9",
    note: "The Garden dispatch had already left by the time mine was sent.",
  },
  {
    id: "bridge",
    name: "Bridge",
    digit: "8",
    note: "Exactly three other dispatches were sent between mine and the Harbour dispatch.",
  },
  {
    id: "garden",
    name: "Garden",
    digit: "6",
    note: "All six dispatches were sent that evening, each at a different time.",
  },
];
export function validDispatchOrder(ids) {
  if (
    ids.length !== 6 ||
    new Set(ids).size !== 6 ||
    !RECORDS.every((r) => ids.includes(r.id))
  )
    return false;
  const p = (id) => ids.indexOf(id);
  return (
    p("harbour") === 5 &&
    p("garden") === p("tower") + 1 &&
    p("bell") < p("bridge") &&
    p("orchard") > p("garden") &&
    p("harbour") - p("bridge") === 4
  );
}
export const ARCHIVE_CODE = "482691";
export function mountArchive(next) {
  const R = room(4, 5, { order: RECORDS.map((r) => r.id) }, next),
    s = R.state;
  let selected = null,
    drag = null,
    ghost = null,
    suppress = false;
  R.frame(
    '<p class="small">Restore the dispatch order.</p><div class="dispatch-drawer" role="group" aria-label="Dispatch records in order"><div class="dispatch-rail"><span>FIRST</span><span>LAST</span></div><div class="dispatch-files"></div></div><div class="dispatch-register"><div class="register-heading">EVENING REGISTER</div><p>Enter the six filing marks in departure order.</p></div><div id="lock" class="archive-lock"></div>',
  );
  const list = $(".dispatch-files");
  function draw() {
    list.innerHTML = s.order
      .map((id, i) => {
        const r = RECORDS.find((r) => r.id === id);
        return `<button class="dispatch-file ${selected === id ? "chosen" : ""}" data-record="${id}" data-position="${i}" aria-label="${esc(r.name)} dispatch, position ${i + 1}. ${esc(r.note)} Filing mark ${r.digit}." aria-pressed="${selected === id}"><span class="dispatch-name">${r.name}</span><span class="dispatch-note">${r.note}</span><span class="dispatch-stamp">${r.digit}</span></button>`;
      })
      .join("");
  }
  const swap = (id, at) => {
    const from = s.order.indexOf(id);
    [s.order[from], s.order[at]] = [s.order[at], s.order[from]];
    selected = null;
    draw();
  };
  list.onclick = (e) => {
    if (s.solved || suppress) {
      suppress = false;
      return;
    }
    const card = e.target.closest("[data-record]");
    if (!card) return;
    if (selected) swap(selected, Number(card.dataset.position));
    else {
      selected = card.dataset.record;
      draw();
    }
  };
  list.onpointerdown = (e) => {
    if (s.solved || e.button !== 0 || drag) return;
    const card = e.target.closest("[data-record]");
    if (!card) return;
    drag = {
      id: card.dataset.record,
      x: e.clientX,
      y: e.clientY,
      pointer: e.pointerId,
      moved: false,
    };
    list.setPointerCapture(e.pointerId);
  };
  list.onpointermove = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8)
      return;
    drag.moved = true;
    if (!ghost) {
      ghost = document.createElement("div");
      ghost.className = "dispatch-ghost";
      ghost.textContent = RECORDS.find((r) => r.id === drag.id).name;
      document.body.append(ghost);
    }
    ghost.style.left = e.clientX + "px";
    ghost.style.top = e.clientY + "px";
  };
  list.onpointerup = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const held = drag;
    drag = null;
    ghost?.remove();
    ghost = null;
    if (!held.moved) {
      if (selected) swap(selected, s.order.indexOf(held.id));
      else {
        selected = held.id;
        draw();
      }
      suppress = true;
      setTimeout(() => {
        suppress = false;
      }, 0);
    }
    if (held.moved) {
      suppress = true;
      setTimeout(() => {
        suppress = false;
      }, 0);
      const card = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest("[data-record]");
      if (card) swap(held.id, Number(card.dataset.position));
    }
  };
  const cancel = () => {
    drag = null;
    ghost?.remove();
    ghost = null;
  };
  list.onpointercancel = cancel;
  list.onlostpointercapture = cancel;
  window.addEventListener("pagehide", cancel);
  draw();
  lock($("#lock"), ARCHIVE_CODE, () => {
    R.complete();
    $$(".dispatch-file").forEach((b) => (b.disabled = true));
  });
}
