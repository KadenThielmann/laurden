import { validAlcoves } from "./core.js";
import { content as C } from "./content.js";
import {
  $,
  $$,
  esc,
  copy,
  room,
  report,
  lock,
  pointerDrag,
  svgPoint,
  symbols,
  reveal,
  reject,
} from "../act-3/common.js";
import { paintRGB, paintMatches, symbolAttempt } from "../act-3/core.js";
const BASE = new URL(".", import.meta.url),
  asset = (p) => new URL(p, BASE).href;
const paths = [
  "./",
  "gingerbread/",
  "message/",
  "alcoves/",
  "bug/",
  "archive/",
  "complete/",
  "prize/",
];
const index = Number(document.documentElement.dataset.room || 0),
  next = index === 7 ? null : asset(paths[index + 1]);
function paint() {
  const R = room(
      4,
      0,
      { mixture: copy(C.paint.initial_percentages), brush: false, strokes: [] },
      next,
    ),
    s = R.state;
  let picked = false,
    current = null;
  R.frame(
    `<div class="swatches"><figure><div class="swatch" id="target"></div><figcaption>Target</figcaption></figure><figure><div class="swatch" id="mixture"></div><figcaption>Mixture</figcaption></figure></div><div class="paint-controls">${C.paint.components.map((c, i) => `<label>${c}<input type="number" min="0" max="100" step="1" inputmode="numeric" data-component="${i}" aria-label="${c} percentage"></label>`).join("")}</div><div class="tools"><span id="total"></span><button id="check" class="quiet">Check</button></div><button id="brush" hidden aria-pressed="false"><span aria-hidden="true">╱▰</span> Pick up brush</button><canvas id="paint-wall" width="800" height="400" tabindex="0" aria-label="Paint panel. Pick up the brush, then sweep or tap. Arrow keys position the brush; Enter paints." hidden></canvas><div id="lock"></div>`,
  );
  const canvas = $("#paint-wall"),
    ctx = canvas.getContext("2d"),
    painted = document.createElement("canvas");
  painted.width = 800;
  painted.height = 400;
  const pc = painted.getContext("2d");
  let cursor = [400, 200];
  $("#target").style.backgroundColor = `rgb(${C.paint.target_rgb})`;
  function panel() {
    ctx.fillStyle = "#d2c7aa";
    ctx.fillRect(0, 0, 800, 400);
    pc.clearRect(0, 0, 800, 400);
    pc.strokeStyle = pc.fillStyle = `rgb(${paintRGB(s.mixture)})`;
    pc.lineWidth = 62;
    pc.lineCap = pc.lineJoin = "round";
    for (const stroke of [...s.strokes, ...(current ? [current] : [])]) {
      if (!stroke.length) continue;
      pc.beginPath();
      pc.moveTo(...stroke[0]);
      if (stroke.length === 1) {
        pc.arc(stroke[0][0], stroke[0][1], 31, 0, Math.PI * 2);
        pc.fill();
      } else {
        stroke.slice(1).forEach((p) => pc.lineTo(...p));
        pc.stroke();
      }
    }
    // Resist is part of the wall geometry from the outset; remove paint only where it was brushed.
    pc.globalCompositeOperation = "destination-out";
    pc.font = "bold 245px monospace";
    pc.textAlign = "center";
    pc.textBaseline = "middle";
    pc.fillText(C.paint.code, 400, 210);
    pc.globalCompositeOperation = "source-over";
    ctx.drawImage(painted, 0, 0);
  }
  function draw() {
    $$("[data-component]").forEach((input, i) => {
      input.value = s.mixture[i];
      input.disabled = s.brush;
    });
    $("#mixture").style.backgroundColor = `rgb(${paintRGB(s.mixture)})`;
    $("#total").textContent = `Total: ${s.mixture.reduce((a, b) => a + b, 0)}%`;
    $("#check").disabled = s.brush;
    $("#brush").hidden = !s.brush;
    canvas.hidden = !s.brush;
    $("#brush").setAttribute("aria-pressed", picked);
    canvas.classList.toggle("painting", picked);
    panel();
  }
  $$("[data-component]").forEach((input) => {
    input.oninput = () => {
      const value = Number(input.value);
      if (
        input.value === "" ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > 100
      )
        return;
      s.mixture[+input.dataset.component] = value;
      $("#mixture").style.backgroundColor = `rgb(${paintRGB(s.mixture)})`;
      $("#total").textContent =
        `Total: ${s.mixture.reduce((a, b) => a + b, 0)}%`;
    };
    input.onchange = input.oninput;
  });
  const gate = lock(
    $("#lock"),
    C.paint.code,
    () => {
      picked = false;
      draw();
      $("#brush").disabled = true;
      R.complete();
    },
    { opened: s.solved, enabled: () => s.brush },
  );
  $("#check").onclick = () => {
    if (s.solved) return;
    const values = $$("[data-component]").map((i) =>
      i.value.trim() === "" ? NaN : Number(i.value),
    );
    if (values.some((v) => !Number.isInteger(v) || v < 0 || v > 100)) {
      reject($(".swatches"), "Enter a percentage from 0 to 100.");
      return;
    }
    s.mixture = values;
    if (s.mixture.reduce((a, b) => a + b, 0) !== 100) {
      report("A complete mixture totals 100%.");
      return;
    }
    if (!paintMatches(s.mixture, C.paint.target_rgb)) {
      reject($(".swatches"), "Not quite. Try again.");
    } else {
      s.brush = true;
      report("");
    }
    draw();
    gate.sync();
    if (s.brush) reveal($("#brush"));
  };
  $("#brush").onclick = () => {
    if (s.solved) return;
    picked = !picked;
    draw();
  };
  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    return [
      ((e.clientX - r.left) * 800) / r.width,
      ((e.clientY - r.top) * 400) / r.height,
    ];
  };
  pointerDrag(canvas, {
    start: (e) => {
      if (s.solved || !s.brush || !picked) return false;
      current = [point(e)];
      panel();
    },
    move: (e) => {
      const p = point(e),
        last = current.at(-1);
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 3) {
        current.push(p);
        panel();
      }
    },
    end: () => {
      s.strokes.push(current);
      current = null;
      panel();
    },
    cancel: () => {
      current = null;
      panel();
    },
  });
  canvas.onkeydown = (e) => {
    if (s.solved || !s.brush || !picked) return;
    const delta = {
      ArrowLeft: [-35, 0],
      ArrowRight: [35, 0],
      ArrowUp: [0, -35],
      ArrowDown: [0, 35],
    }[e.key];
    if (delta) {
      e.preventDefault();
      cursor = cursor.map((n, i) =>
        Math.max(0, Math.min(i ? 400 : 800, n + delta[i])),
      );
      panel();
      ctx.strokeStyle = "#19272e";
      ctx.lineWidth = 3;
      ctx.strokeRect(cursor[0] - 15, cursor[1] - 15, 30, 30);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      s.strokes.push([[...cursor]]);
      panel();
    }
  };
  draw();
}
function gingerbread() {
  const R = room(4, 1, {}, next);
  R.frame(
    `<div class="gingerbread-examples">${["0000", "2214", "3232"].map((code, i) => `<figure><img src="${asset(`assets/gingerbread-${i}.svg`)}" alt="Gingerbread reference ${i + 1}"><figcaption class="plaque">${code}</figcaption></figure>`).join("")}</div><div id="lock"></div>`,
  );
  lock($("#lock"), C.gingerbreadCode, R.complete, { opened: R.state.solved });
}
function message() {
  const R = room(4, 2, { note: 0 }, next),
    s = R.state;
  R.frame(
    '<div class="tray-scene"><div class="shallow-tray"></div><button id="folded-note" aria-label="Lift folded note"></button></div><div id="lock"></div>',
  );
  function draw() {
    const b = $("#folded-note");
    b.className = `folded-note stage-${s.note}`;
    b.setAttribute(
      "aria-label",
      s.note === 0
        ? "Lift folded note"
        : s.note === 1
          ? "Unfold note"
          : "Fold note",
    );
    b.innerHTML =
      s.note === 2
        ? `<span class="letter">${esc(C.handoff.recipient)},<br><br>${esc(C.handoff.body).replace(/\n/g, "<br>")}</span>`
        : '<span aria-hidden="true">⌑</span>';
  }
  $("#folded-note").onclick = () => {
    s.note = s.note === 2 ? 1 : s.note + 1;
    draw();
    if (s.note === 2) reveal($("#folded-note"));
  };
  draw();
  lock($("#lock"), C.handoff.code, R.complete, { opened: s.solved });
}
function alcoves() {
  const R = room(
      4,
      3,
      { rows: Array.from({ length: 3 }, () => ({ visitor: "", object: "" })) },
      next,
    ),
    s = R.state;
  R.frame(
    `<div class="document alcove-clues"><ol>${C.alcoves.clues.map((clue) => `<li>${esc(clue)}</li>`).join("")}</ol></div><table class="logic-table"><thead><tr>${["Left", "Middle", "Right"].map((position) => `<th scope="col">${position}</th>`).join("")}</tr></thead><tbody>${["visitor", "object"].map((category) => `<tr><th class="logic-category" colspan="3">${category === "visitor" ? "Visitors" : "Objects"}</th></tr><tr>${["Left", "Middle", "Right"].map((position, i) => `<td><select data-row="${i}" data-category="${category}" aria-label="${position} alcove ${category}"><option value="">—</option>${C.alcoves[category].map((value) => `<option value="${value}">${value}</option>`).join("")}</select></td>`).join("")}</tr>`).join("")}</tbody></table>`,
  );
  $$("[data-category]").forEach(
    (input) =>
      (input.onchange = () => {
        if (s.solved) return;
        s.rows[Number(input.dataset.row)][input.dataset.category] = input.value;
        if (validAlcoves(s.rows)) {
          $$("[data-category]").forEach((control) => (control.disabled = true));
          R.complete();
        }
      }),
  );
}
function bug() {
  const R = room(4, 4, { activated: false, released: false }, next),
    s = R.state;
  let selected = null,
    drag = null,
    preview = null,
    moved = false,
    origin = null,
    traveling = false;
  R.frame(
    '<svg id="bug-scene" viewBox="0 0 800 580" role="group" aria-label="Toy bug, tube and locked door"></svg>',
  );
  const svg = $("#bug-scene");
  const bugShape =
    '<ellipse rx="33" ry="23" fill="#aa8146" stroke="#e8ba76" stroke-width="3"/><path d="M0-21V22M-20-17L-34-34M20-17L34-34M-28 0L-44 0M28 0L44 0M-20 17L-34 34M20 17L34 34" stroke="#c2cecb" stroke-width="6"/><circle cx="-11" cy="-9" r="4"/><circle cx="11" cy="-9" r="4"/>';
  const keyShape =
    '<circle cx="-24" r="15" fill="none" stroke="#e8ba76" stroke-width="9"/><path d="M-9 0H40V14M23 0V12" fill="none" stroke="#e8ba76" stroke-width="10"/>';
  function draw() {
    const bp = drag === "bug" && preview ? preview : [135, 415],
      kp = drag === "key" && preview ? preview : [645, 388];
    svg.innerHTML = `<rect x="20" y="20" width="760" height="540" rx="24" fill="#14212a" stroke="#40505b" stroke-width="3"/><path d="M165 260C230 260 218 100 360 130S470 350 628 265" fill="none" stroke="#111a20" stroke-width="100"/><path d="M165 260C230 260 218 100 360 130S470 350 628 265" fill="none" stroke="#617780" stroke-width="80"/><path d="M165 246C230 246 218 86 360 116S470 336 628 251" fill="none" stroke="#9caaac" stroke-width="8"/><g data-target="inlet" role="button" tabindex="0" aria-label="Tube inlet"><ellipse cx="165" cy="260" rx="37" ry="49" fill="#070e13" stroke="#9caeb2" stroke-width="9"/><circle cx="165" cy="260" r="60" fill="transparent"/></g><ellipse cx="628" cy="265" rx="36" ry="48" fill="#090f12" stroke="#9caeb2" stroke-width="9"/><path d="M558 400H716L703 424H568Z" fill="#40505b"/><g data-target="lock" role="button" tabindex="0" aria-label="Key-operated exit lock"><rect x="318" y="415" width="125" height="115" rx="17" fill="#aa8146" stroke="#e8ba76" stroke-width="3"/><path d="M341 415V390a39 39 0 0 1 79 0v25" fill="none" stroke="#b8c3cb" stroke-width="12"/><circle cx="380" cy="461" r="14" fill="#18232a"/><path d="M375 467L370 489H390L385 467" fill="#18232a"/></g>${!s.released ? `<g data-object="bug" role="button" tabindex="0" aria-label="${s.activated ? "Pick up toy bug" : "Activate toy bug"}" transform="translate(${bp})"><circle r="65" fill="transparent"/><g class="${s.activated ? "buzz" : ""}">${bugShape}</g></g>` : `<g class="bug-in-tube" ${traveling ? "" : 'transform="translate(628 265)"'} opacity=".5">${bugShape}${traveling ? '<animateMotion dur="1.2s" path="M165 260C230 260 218 100 360 130S470 350 628 265" rotate="auto" fill="freeze"/>' : ""}</g>`}${s.released && !s.solved ? `<g data-object="key" role="button" tabindex="0" aria-label="Pick up key" transform="translate(${kp})"><circle r="65" fill="transparent"/>${keyShape}</g>` : ""}${s.solved ? `<g transform="translate(380 469) rotate(35)">${keyShape}</g>` : ""}`;
    if (selected) svg.classList.add("object-selected");
    else svg.classList.remove("object-selected");
  }
  function use(target) {
    if (s.solved || traveling) return;
    if (
      selected === "bug" &&
      target === "inlet" &&
      s.activated &&
      !s.released
    ) {
      s.released = true;
      selected = null;
      traveling = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      draw();
      svg.classList.add("bug-travel");
      setTimeout(() => {
        traveling = false;
        svg.classList.remove("bug-travel");
        draw();
      }, 1400);
    } else if (selected === "key" && target === "lock" && s.released) {
      selected = null;
      R.complete();
      draw();
    }
  }
  svg.addEventListener("click", (e) => {
    if (s.solved || traveling) return;
    if (moved) {
      moved = false;
      return;
    }
    const object = e.target.closest("[data-object]"),
      target = e.target.closest("[data-target]");
    if (object) {
      const which = object.dataset.object;
      if (which === "bug" && !s.activated) {
        s.activated = true;
      } else selected = which;
      draw();
    } else if (target) use(target.dataset.target);
  });
  svg.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  });
  pointerDrag(svg, {
    start: (e) => {
      const o = e.target.closest("[data-object]");
      if (
        s.solved ||
        traveling ||
        !o ||
        (o.dataset.object === "bug" && !s.activated)
      )
        return false;
      drag = o.dataset.object;
      selected = drag;
      origin = svgPoint(svg, e);
      moved = false;
    },
    move: (e) => {
      preview = svgPoint(svg, e);
      moved ||= Math.hypot(preview[0] - origin[0], preview[1] - origin[1]) > 10;
      if (moved) draw();
    },
    end: (e) => {
      if (moved) {
        const p = svgPoint(svg, e);
        if (Math.hypot(p[0] - 165, p[1] - 260) < 80) use("inlet");
        if (Math.hypot(p[0] - 380, p[1] - 469) < 85) use("lock");
      }
      drag = null;
      preview = null;
      draw();
    },
    cancel: () => {
      drag = null;
      preview = null;
      selected = null;
      moved = false;
      draw();
    },
  });
  draw();
}
function archive() {
  const R = room(4, 5, { open: [] }, next),
    s = R.state;
  R.frame(
    `<div class="badges">${Object.entries(C.murder.badges)
      .map(
        ([name, id]) =>
          `<div class="badge"><span class="badge-portrait" aria-hidden="true">◈</span><strong>${name}</strong><span>${id}</span></div>`,
      )
      .join(
        "",
      )}</div><div class="evidence-desk">${C.murder.evidence.map(([title, body], i) => `<details class="document" data-evidence="${i}"><summary>${esc(title)}</summary><div class="paper-text">${esc(body)}</div></details>`).join("")}</div><p class="extraction">STAFF IDENTIFICATION</p><div id="lock"></div>`,
  );
  $$("[data-evidence]").forEach((el) => {
    el.open = s.open.includes(+el.dataset.evidence);
    el.ontoggle = () => {
      s.open = $$("[data-evidence]")
        .filter((e) => e.open)
        .map((e) => +e.dataset.evidence);
    };
  });
  lock($("#lock"), C.murder.code, R.complete, { opened: s.solved });
}
function finale() {
  const R = room(4, 6, { attempt: [] }, next, true),
    s = R.state;
  const glyphs = symbols(),
    order = [
      "h",
      "B",
      "n",
      "f",
      "k",
      "j",
      "D",
      "l",
      "A",
      "o",
      "e",
      "g",
      "p",
      "C",
      "i",
      "m",
    ];
  R.frame(
    `<div class="symbol" aria-label="Revealed symbol">${C.symbolD}</div><div class="wall-divider"></div><div class="symbol-wall" role="group" aria-label="Symbol wall">${order.map((id, i) => `<button data-symbol="${id}" aria-label="Wall symbol ${i + 1}"><span>${glyphs[id]}</span></button>`).join("")}</div><div id="attempt" class="attempt" aria-label="Selections entered"></div><button class="quiet" id="clear">Clear</button><div id="hidden-door" hidden><div class="door-crack" aria-hidden="true"></div><a class="next button" href="${next}">Go through the door</a></div>`,
  );
  function draw() {
    $("#attempt").innerHTML = Array.from(
      { length: 4 },
      (_, i) => `<span class="${i < s.attempt.length ? "filled" : ""}"></span>`,
    ).join("");
    $("#attempt").setAttribute(
      "aria-label",
      `${s.attempt.length} of 4 selections entered`,
    );
    $("#hidden-door").hidden = !s.solved;
    $("#clear").disabled = s.solved;
    $$("[data-symbol]").forEach((b) => (b.disabled = s.solved));
    $("#next").innerHTML = "";
    if (s.solved) reveal($("#hidden-door a"));
  }
  $$("[data-symbol]").forEach(
    (b) =>
      (b.onclick = () => {
        if (s.solved) return;
        s.attempt.push(b.dataset.symbol);
        if (s.attempt.length === 4) {
          if (symbolAttempt(s.attempt)) {
            R.complete();
            report("");
          } else {
            s.attempt = [];
            reject($(".symbol-wall"));
          }
        } else report("");
        draw();
      }),
  );
  $("#clear").onclick = () => {
    s.attempt = [];
    report("");
    draw();
  };
  draw();
}
function prize() {
  // The final wall reveals this link only after its sequence is completed.
  // This static destination needs no saved puzzle state, like earlier act pages.
  document.body.classList.remove("puzzle-only");
  $("#app").innerHTML =
    `<h1>Congratulations!</h1><section class="surface prize"><p>${C.reward}</p></section>`;
}
[paint, gingerbread, message, alcoves, bug, archive, finale, prize][index]();
