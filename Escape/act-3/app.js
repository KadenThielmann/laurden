import { content as C } from "./content.js";
import {
  pipeRoute,
  validCats,
  slide,
  slidingSolved,
  latch,
  chainPoints,
} from "./core.js";
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
  catArt,
  reveal,
  reject,
} from "./common.js";
const BASE = new URL(".", import.meta.url),
  asset = (p) => new URL(p, BASE).href;
const paths = [
  "./",
  "cats/",
  "layers/",
  "note/",
  "chains/",
  "sliding/",
  "complete/",
];
const index = Number(document.documentElement.dataset.room || 0);
const next = asset(index === 6 ? "../act-4/" : paths[index + 1]);
function pipes() {
  const R = room(
      3,
      0,
      {
        rotations: copy(C.pipes.initial_rotations),
        released: false,
        opened: false,
      },
      next,
    ),
    s = R.state;
  R.frame(
    '<div class="pipe-scene"><div class="pipe-board"><div class="pipes" role="group" aria-label="Pipe network"></div><div class="pipe-inlet" aria-label="Inlet">➜</div><div class="pipe-outlet" aria-label="Outlet">➜</div></div><div class="capsule-tray" aria-label="Capsule tray"><button id="capsule" hidden aria-label="Inspect capsule"><span></span></button><div id="slip" hidden></div></div></div>' +
      '<div id="lock"></div>',
  );
  function draw() {
    $(".pipes").innerHTML = C.pipes.types
      .flatMap((row, r) =>
        row.map((type, c) => {
          const fixed = C.pipes.fixed_cells_0based.some(
            ([a, b]) => a === r && b === c,
          );
          return `<button class="pipe ${type === "#" ? "blocked" : ""} ${fixed ? "bolted" : ""}" data-r="${r}" data-c="${c}" aria-label="${type === "#" ? "Blocked fitting" : fixed ? "Fixed coupler" : "Rotate pipe"}, row ${r + 1}, column ${c + 1}" ${type === "#" || fixed || s.released ? "disabled" : ""}><svg viewBox="0 0 80 80" aria-hidden="true"><g transform="rotate(${s.rotations[r][c] * 90} 40 40)"><path d="${type === "I" ? "M40 0V80" : type === "L" ? "M40 0V40H80" : "M15 15L65 65M65 15L15 65"}" fill="none" stroke="#697c85" stroke-width="19"/><path d="${type === "I" ? "M40 0V80" : type === "L" ? "M40 0V40H80" : ""}" fill="none" stroke="#c5d2cd" stroke-width="8"/></g>${fixed ? '<circle cx="12" cy="12" r="5" fill="#e8ba76"/><circle cx="68" cy="68" r="5" fill="#e8ba76"/>' : ""}</svg></button>`;
        }),
      )
      .join("");
    $$(".pipe:not(:disabled)").forEach(
      (b) =>
        (b.onclick = () => {
          if (s.released || s.solved) return;
          const r = +b.dataset.r,
            c = +b.dataset.c;
          s.rotations[r][c] = (s.rotations[r][c] + 1) % 4;
          draw();
          const path = pipeRoute(
            C.pipes.types,
            s.rotations,
            C.pipes.source,
            C.pipes.outlet,
          );
          if (path && !s.released) {
            s.released = true;
            path.forEach(([a, b], i) => {
              const el = $(`.pipe[data-r="${a}"][data-c="${b}"]`);
              el.style.animationDelay = `${i * 18}ms`;
              el.classList.add("pulse");
            });
            $("#capsule").hidden = false;
            $("#capsule").classList.add("fallen");
            $$(".pipe").forEach((p) => (p.disabled = true));
          }
        }),
    );
    $("#capsule").hidden = !s.released;
    $("#slip").hidden = !s.opened;
    $("#slip").textContent = s.opened ? C.pipes.ball_code : "";
    $("#capsule").classList.toggle("split", s.opened);
  }
  $("#capsule").onclick = () => {
    s.opened = !s.opened;
    draw();
  };
  draw();
  lock($("#lock"), C.pipes.ball_code, R.complete, { opened: s.solved });
}
function cats() {
  const R = room(3, 1, { cats: [], marks: [], tool: "cat" }, next),
    s = R.state;
  R.frame(
    '<p class="small">One cat per row, column and colour. Cats cannot touch.</p><div class="tools"><button id="cat-tool">Cat</button><button id="x-tool">X</button><span id="remaining"></span></div><div class="cat-scroll" tabindex="0" aria-label="Cat board"><div class="cat-grid" role="group" aria-label="Cat placement board"></div></div>',
  );
  function draw() {
    $("#cat-tool").setAttribute("aria-pressed", s.tool === "cat");
    $("#x-tool").setAttribute("aria-pressed", s.tool === "x");
    $("#remaining").textContent = `${8 - s.cats.length} cats available`;
    $(".cat-grid").innerHTML = C.regions
      .flatMap((row, r) =>
        row.map((reg, c) => {
          const i = r * 8 + c,
            cat = s.cats.includes(i),
            mark = s.marks.includes(i);
          const edges = [
            r === 0 || C.regions[r - 1][c] !== reg,
            c === 7 || row[c + 1] !== reg,
            r === 7 || C.regions[r + 1][c] !== reg,
            c === 0 || row[c - 1] !== reg,
          ];
          return `<button class="cat-cell region-${reg}" style="border-width:${edges.map((v) => (v ? "3px" : "1px")).join(" ")}" data-cell="${i}" aria-label="Row ${r + 1}, column ${c + 1}${cat ? ", cat" : mark ? ", X" : ""}">${cat ? catArt : mark ? "×" : ""}</button>`;
        }),
      )
      .join("");
    $$(".cat-cell").forEach(
      (b) =>
        (b.onclick = () => {
          if (s.solved) return;
          const i = +b.dataset.cell;
          if (s.tool === "cat") {
            if (s.cats.includes(i)) s.cats = s.cats.filter((x) => x !== i);
            else if (s.cats.length < 8) {
              s.cats.push(i);
              s.marks = s.marks.filter((x) => x !== i);
            }
          } else if (!s.cats.includes(i)) {
            s.marks = s.marks.includes(i)
              ? s.marks.filter((x) => x !== i)
              : [...s.marks, i];
          }
          draw();
          if (validCats(s.cats, C.regions)) {
            R.complete();
            $$(".cat-cell,#cat-tool,#x-tool").forEach(
              (b) => (b.disabled = true),
            );
          }
        }),
    );
  }
  $("#cat-tool").onclick = () => {
    s.tool = "cat";
    draw();
  };
  $("#x-tool").onclick = () => {
    s.tool = "x";
    draw();
  };
  draw();
}
function layers() {
  const R = room(
      3,
      2,
      {
        angles: [
          C.overlays.initial_bottom_degrees,
          C.overlays.initial_top_degrees,
        ],
      },
      next,
    ),
    s = R.state;
  R.frame(
    '<div class="disc-frame"><div class="frame-notch" aria-hidden="true">◆</div><div class="disc-stack"><img id="bottom-disc" alt="Lower patterned transparency" draggable="false"><img id="top-disc" alt="Upper patterned transparency" draggable="false"></div><button class="disc-rim lower" id="rim-0" aria-label="Drag lower disc rim"><span>Lower rim</span></button><button class="disc-rim upper" id="rim-1" aria-label="Drag upper disc rim"><span>Upper rim</span></button></div><div class="tools disc-tools"><div>Lower disc <button data-layer="0" data-step="-1" aria-label="Turn lower disc counterclockwise">↶</button><button data-layer="0" data-step="1" aria-label="Turn lower disc clockwise">↷</button></div><div>Upper disc <button data-layer="1" data-step="-1" aria-label="Turn upper disc counterclockwise">↶</button><button data-layer="1" data-step="1" aria-label="Turn upper disc clockwise">↷</button></div></div>' +
      '<div id="lock"></div>',
  );
  $("#bottom-disc").src = asset("assets/layer-bottom.png");
  $("#top-disc").src = asset("assets/layer-top.png");
  function draw() {
    ["bottom", "top"].forEach((n, i) => {
      $(`#${n}-disc`).style.transform = `rotate(${s.angles[i]}deg)`;
      $(`#rim-${i}`).style.setProperty("--angle", `${s.angles[i]}deg`);
    });
  }
  $$("[data-layer]").forEach(
    (b) =>
      (b.onclick = () => {
        if (s.solved) return;
        const i = +b.dataset.layer;
        s.angles[i] = (s.angles[i] + Number(b.dataset.step) * 15 + 360) % 360;
        draw();
      }),
  );
  for (let i = 0; i < 2; i++) {
    let startAngle, initial;
    const angle = (e) => {
      const r = $(".disc-stack").getBoundingClientRect();
      return (
        (Math.atan2(
          e.clientY - r.top - r.height / 2,
          e.clientX - r.left - r.width / 2,
        ) *
          180) /
        Math.PI
      );
    };
    pointerDrag($(`#rim-${i}`), {
      start: (e) => {
        if (s.solved) return false;
        startAngle = angle(e);
        initial = s.angles[i];
      },
      move: (e) => {
        s.angles[i] =
          (((Math.round((initial + angle(e) - startAngle) / 15) * 15) % 360) +
            360) %
          360;
        draw();
      },
      end: () => {},
      cancel: () => {
        s.angles[i] = initial;
        draw();
      },
    });
  }
  draw();
  lock($("#lock"), C.overlays.answer, R.complete, { opened: s.solved });
}
function note() {
  const R = room(3, 3, { order: copy(C.note.initial) }, next);
  const s = R.state;
  let selected = null;
  R.frame(
    '<p class="small">Tap two strips to swap them.</p><div class="note-scroll" tabindex="0" aria-label="Torn note reconstruction"><div class="note-strips"></div></div><div class="tools"><button id="note-zoom" class="quiet" aria-pressed="false">Zoom</button></div><div id="lock"></div>',
  );
  // Keep each image mounted so a swap never waits for another image reveal.
  $(".note-strips").innerHTML = s.order
    .map(
      (id) =>
        `<button class="note-strip" data-piece="${id}"><img src="${asset(`assets/note-v2-${id}.png`)}" alt="" draggable="false"></button>`,
    )
    .join("");
  function draw() {
    $$(".note-strip").forEach((button) => {
      const i = s.order.indexOf(Number(button.dataset.piece));
      button.style.order = i;
      button.classList.toggle("selected", selected === i);
      button.setAttribute("aria-label", `Paper strip in slot ${i + 1}`);
      button.setAttribute("aria-pressed", selected === i);
    });
  }
  $$(".note-strip").forEach(
    (button) =>
      (button.onclick = () => {
        if (s.solved) return;
        const i = s.order.indexOf(Number(button.dataset.piece));
        if (selected === null) selected = i;
        else {
          [s.order[i], s.order[selected]] = [s.order[selected], s.order[i]];
          selected = null;
        }
        draw();
      }),
  );
  $("#note-zoom").onclick = () => {
    const zoomed = $(".note-scroll").classList.toggle("zoomed");
    $("#note-zoom").setAttribute("aria-pressed", zoomed);
    $("#note-zoom").textContent = zoomed ? "Fit" : "Zoom";
  };
  draw();
  lock($("#lock"), C.note.code, R.complete, { opened: s.solved });
}
async function chains() {
  const R = room(3, 4, { attached: {} }, next),
    s = R.state;
  R.frame(
    '<p>Swing each strip onto a hook on the opposite side.</p><svg id="chain-board" viewBox="0 0 1000 2100" role="group" aria-label="Eight pivoting wooden strips"></svg>' +
      '<div id="lock"></div>',
  );
  let tape;
  try {
    const response = await fetch(asset("assets/chain-tape-v2.json"));
    if (!response.ok) throw Error("Missing tape");
    tape = await response.json();
  } catch {
    report("The chain artwork could not load. Please reload.");
    return;
  }
  const svg = $("#chain-board"),
    chains = C.chains.chains,
    hooks = C.chains.hooks;
  const count = tape.count;
  const hitRadius = () =>
    Math.max(66, (22 * 1000) / svg.getBoundingClientRect().width);
  let drag = null,
    preview = null,
    moved = false,
    start = [0, 0];
  const all = () =>
    chains.every((c) => {
      const hook = hooks.find((h) => h.id === s.attached[c.id]);
      return hook && latch(c, hook, C.chains.tolerance);
    });
  const codeLock = lock($("#lock"), C.chains.code, R.complete, {
    opened: s.solved,
    enabled: all,
  });
  const rest = (c) => [c.origin[0], c.origin[1] + c.length];
  const pose = (ci) => {
    const c = chains[ci],
      hook = hooks.find((h) => h.id === s.attached[c.id]);
    return chainPoints(
      c,
      drag === ci && preview ? preview : hook ? hook.point : rest(c),
      count,
    );
  };
  function draw() {
    let metal = "",
      markings = "",
      ends = "",
      fixtures = "";

    hooks.forEach((h) => {
      const [x, y] = h.point;
      fixtures += `<g data-hook="${h.id}" aria-label="Receiving hook" pointer-events="none"><path d="M${x - 13} ${y - 22}v27q13 24 26 0v-10" fill="none" stroke="#1f1d19" stroke-width="14"/><path d="M${x - 13} ${y - 22}v27q13 24 26 0v-10" fill="none" stroke="#a5a59d" stroke-width="9"/></g>`;
    });
    chains.forEach((chain, ci) => {
      const points = pose(ci);
      const rotation =
        (Math.atan2(
          points[count][1] - points[0][1],
          points[count][0] - points[0][0],
        ) *
          180) /
        Math.PI;
      metal += `<g transform="translate(${chain.origin}) rotate(${rotation})" pointer-events="none"><rect x="0" y="-34" width="${chain.length}" height="68" rx="9" fill="${ci % 2 ? "#7c6247" : "#907454"}" stroke="#382d22" stroke-width="6"/><path d="M20 -19H${chain.length - 20}" stroke="#ad906b" stroke-width="3"/></g>`;
      const [ax, ay] = chain.origin;
      fixtures += `<g pointer-events="none"><circle cx="${ax}" cy="${ay}" r="18" fill="#1f211f" stroke="#92948e" stroke-width="7"/><path d="M${ax - 7} ${ay - 7}l14 14" stroke="#b5b7ac" stroke-width="4"/></g>`;
      for (let i = 0; i < count; i++) {
        const a = points[i],
          b = points[i + 1];
        const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
        const transform = `translate(${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2}) rotate(${angle})`;
        const patch = tape.chains[ci].links.find((link) => link.index === i);
        if (patch)
          markings += `<path transform="${transform}" d="${patch.path}" fill="#e5d9b5" pointer-events="none"/>`;
      }
      const end = points[count],
        attached = Boolean(s.attached[chain.id]);
      ends += `<g ${attached ? "" : `data-end="${ci}"`} role="img" aria-label="${attached ? "Attached" : "Drag pivoting"} strip end ${ci + 1}"><circle cx="${end[0]}" cy="${end[1]}" r="${hitRadius()}" fill="transparent"/><ellipse cx="${end[0]}" cy="${end[1]}" rx="25" ry="34" fill="#34362f" stroke="#babdb2" stroke-width="8"/></g>`;
    });
    const grain = [210, 425, 650, 865]
      .map(
        (x, i) =>
          `<path d="M${x} 20Q${x + 12} 440 ${x - 7} 720T${x + 3} 1180M${x + 8} 20Q${x + 20} 440 ${x + 1} 720T${x + 11} 1180" fill="none" stroke="${i % 2 ? "#493a2d" : "#69513c"}" stroke-width="3"/>`,
      )
      .join("");
    svg.innerHTML = `<rect x="12" y="12" width="976" height="2076" rx="5" fill="#584432" stroke="#32291f" stroke-width="16"/><path d="M12 397H988M12 795H988M12 1200H988M12 1600H988" stroke="#33291e" stroke-width="7"/>${grain}${metal}${markings}${fixtures}${ends}`;
    codeLock.sync();
  }
  function release(ci, hook) {
    const chain = chains[ci];
    if (latch(chain, hook, C.chains.tolerance)) {
      s.attached[chain.id] = hook.id;

      report("");
    } else {
      const distance = Math.hypot(
        ...hook.point.map((v, i) => v - chain.origin[i]),
      );
      report("This strip does not line up with that hook.");
    }
  }
  // One interaction: drag the free end. A cancelled or missed drop restores it.
  pointerDrag(svg, {
    start: (e) => {
      const end = e.target.closest("[data-end]");
      if (!end || s.solved) return false;
      drag = Number(end.dataset.end);
      start = svgPoint(svg, e);
      moved = false;
    },
    move: (e) => {
      const p = svgPoint(svg, e);
      if (!moved && Math.hypot(p[0] - start[0], p[1] - start[1]) < 10) return;
      moved = true;
      preview = p;
      draw();
    },
    end: (e) => {
      if (moved) {
        const p = svgPoint(svg, e);
        const hook = hooks
          .filter((h) => h.point[0] !== chains[drag].origin[0])
          .map((h) => ({
            h,
            distance: Math.hypot(p[0] - h.point[0], p[1] - h.point[1]),
          }))
          .sort((a, b) => a.distance - b.distance)[0];
        if (hook && hook.distance < Math.max(85, hitRadius()))
          release(drag, hook.h);
      }
      drag = null;
      preview = null;
      draw();
    },
    cancel: () => {
      drag = null;
      preview = null;
      moved = false;
      draw();
    },
  });

  draw();
}
async function sliding() {
  const R = room(3, 5, { tiles: copy(C.sliding.initial) }, next),
    s = R.state;
  R.frame(
    `${C.sliding.development ? '<p class="development">DEVELOPMENT IMAGE — personal photograph to be supplied.</p>' : ""}<div class="sliding-grid" role="group" aria-label="Sliding picture"></div>`,
  );
  const img = new Image();
  img.src = asset(C.sliding.image);
  try {
    await img.decode();
  } catch {
    report("The photograph could not load. Please reload.");
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 800;
  const ctx = canvas.getContext("2d");
  const size = Math.min(img.naturalWidth, img.naturalHeight),
    x = (img.naturalWidth - size) * C.sliding.crop.x,
    y = (img.naturalHeight - size) * C.sliding.crop.y;
  ctx.drawImage(img, x, y, size, size, 0, 0, 800, 800);
  const photo = canvas.toDataURL();
  function draw() {
    $(".sliding-grid").innerHTML = s.tiles
      .map((id, i) => {
        const tile = id || 9;
        return `<button class="slide-tile ${id === 0 && !s.solved ? "blank" : ""}" data-tile="${id}" aria-label="${id === 0 ? "Blank space" : `Photo tile at row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}`}" style="background-image:${id === 0 && !s.solved ? "none" : `url(${photo})`};background-position:${(((tile - 1) % 3) * 100) / 2}% ${(Math.floor((tile - 1) / 3) * 100) / 2}%" ${s.solved || !id ? "disabled" : ""}></button>`;
      })
      .join("");
    $$(".slide-tile").forEach(
      (b) =>
        (b.onclick = () => {
          const tiles = slide(s.tiles, +b.dataset.tile);
          if (s.solved || tiles === s.tiles) return;
          s.tiles = tiles;
          if (slidingSolved(s.tiles)) {
            s.solved = true;
            draw();
            setTimeout(() => {
              s.solved = false;
              R.complete();
            }, 700);
          } else draw();
        }),
    );
  }
  draw();
}
function phone() {
  const R = room(3, 6, { last: "greeting" }, next, true),
    s = R.state;
  let active = false,
    audio = null,
    token = 0,
    digits = "";
  R.frame(
    `<div class="symbol" aria-label="Revealed symbol">${C.symbolC}</div><div class="telephone"><button id="handset" aria-label="Pick up handset"><svg viewBox="0 0 260 80" aria-hidden="true"><path d="M20 63Q5 9 65 9H195Q255 9 240 63L194 61 185 40H75L66 61Z" fill="#354851" stroke="#bca779" stroke-width="5"/></svg><span>Pick up</span></button><div id="phone-choices" hidden>${Object.entries(
      C.phone.questions,
    )
      .map(([k, v]) => `<button data-question="${k}">${k} — ${esc(v)}</button>`)
      .join(
        "",
      )}<button data-question="0">0 — Hear that again</button></div><div class="phone-label">DOOR ACCESS<br><small>Replace receiver · enter code · press #<br>* clears the entry</small></div><output id="phone-display" aria-label="Door access code" aria-live="polite">— — — — —</output><div class="keypad">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => `<button data-phone="${k}" aria-label="${k === "*" ? "Clear code" : k === "#" ? "Submit code" : `Key ${k}`}">${k}</button>`).join("")}</div><div id="phone-status" role="status" aria-live="polite"></div></div>`,
  );
  const stop = () => {
    token++;
    if (audio) {
      audio.pause();
      audio.src = "";
      audio = null;
    }
  };
  function play(key) {
    stop();
    const generation = token;
    audio = new Audio(asset("assets/" + C.phone.clips[key]));
    $("#phone-status").textContent = "Calling…";
    audio.onended = () => {
      if (token === generation) $("#phone-status").textContent = "On the line.";
    };
    const missing = () => {
      if (token === generation)
        $("#phone-status").textContent =
          "The line could not connect. Try again.";
    };
    audio.onerror = missing;
    audio
      .play()
      .then(() => {
        if (token === generation)
          $("#phone-status").textContent = "On the line…";
      })
      .catch(missing);
  }
  const display = () => {
    $("#phone-display").textContent = s.solved
      ? "ACCESS GRANTED"
      : digits.padEnd(5, "—").split("").join(" ");
  };
  const question = (k) => {
    if (k === "0") {
      play(s.last);
      return;
    }
    const key = C.phone.clips[k] ? k : "invalid";
    s.last = key;
    play(key);
  };
  $("#handset").onclick = () => {
    if (s.solved) return;
    active = !active;
    digits = "";
    display();
    $("#phone-choices").hidden = !active;
    $("#handset").setAttribute(
      "aria-label",
      active ? "Hang up handset" : "Pick up handset",
    );
    $("#handset span").textContent = active ? "Hang up" : "Pick up";
    if (active) play("greeting");
    else {
      stop();
      $("#phone-status").textContent = "";
    }
  };
  $$("[data-question]").forEach(
    (b) =>
      (b.onclick = () => {
        if (active) question(b.dataset.question);
      }),
  );
  $$("[data-phone]").forEach(
    (b) =>
      (b.onclick = () => {
        if (s.solved) return;
        const k = b.dataset.phone;
        if (active) {
          question(k);
          return;
        }
        if (k === "*") {
          digits = "";
          $("#phone-status").textContent = "";
        } else if (k === "#") {
          if (digits === C.bookCode) {
            stop();
            R.complete();
            $("#phone-status").textContent = "";
            $$(".telephone button").forEach(
              (button) => (button.disabled = true),
            );
          } else {
            reject($(".telephone"));
            $("#phone-status").textContent = "Not quite. Try again.";
            if (digits.length === 5) digits = "";
          }
        } else if (digits.length < 5) {
          digits += k;
          $("#phone-status").textContent = "";
        }
        display();
      }),
  );
  window.addEventListener("pagehide", stop);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
}

[pipes, cats, layers, note, chains, sliding, phone][index]();
