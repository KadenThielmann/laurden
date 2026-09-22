// Resolve every page and asset relative to this folder, including GitHub project sites.
const SITE_ROOT = new URL(".", document.currentScript.src);
const siteUrl = (path = "") =>
  new URL(path.replace(/^\/+/, ""), SITE_ROOT).href;

const cardAssetRoot = new URL("cards/", document.currentScript.src);
const C = window.PUZZLE_CONFIG,
  app = document.querySelector("#app");
const routes = [
  "key",
  "photograph",
  "bookshelf",
  "matching",
  "clock",
  "maze",
  "lock",
  "complete",
];
let page =
  location.pathname
    .slice(SITE_ROOT.pathname.length)
    .split("/")
    .filter(Boolean)[0] || "key";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
function shell(n, title, copy, body) {
  document.body.classList.toggle("puzzle-only", n > 0 && n < 8);
  app.innerHTML = `<div class="eyebrow">${n === 8 ? "Act one complete" : `Act one · ${String(n).padStart(2, "0")}`}</div>${title ? `<h1>${title}</h1>` : ""}${copy ? `<p>${copy}</p>` : ""}<section class="surface">${body}</section><div class="status" aria-live="polite" id="status"></div><div id="next"></div>`;
}
function done(message = "") {
  $("#status").textContent = message;
  const next = routes[routes.indexOf(page) + 1];
  if (next)
    $("#next").innerHTML =
      `<a class="button next" href="${siteUrl(next + "/")}">Continue</a>`;
}
function codeForm(code, cb, label = "Enter the code") {
  const numeric = /^[0-9]+$/.test(code),
    host = document.createElement("div");
  host.innerHTML = `<form><input aria-label="${label}" inputmode="${numeric ? "numeric" : "text"}" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="${code.length}" placeholder="${"·".repeat(code.length)}" required ${numeric ? `pattern="[0-9]{${code.length}}"` : ""}><button class="primary">Unlock</button></form>`;
  host.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const value = host.querySelector("input").value.trim();
    if ((numeric ? value : value.toLowerCase()) === code) cb();
    else $("#status").textContent = "Not quite. Try again.";
  };
  return host;
}
function combinationLock(code, onSuccess, { onGuess = null } = {}) {
  const host = document.createElement("div");
  host.className = "combination-lock";
  host.innerHTML = `<svg class="combo-shackle" viewBox="0 0 120 70" aria-hidden="true"><path d="M25 68V36a35 35 0 0 1 70 0v32" fill="none" stroke="#b8c3cb" stroke-width="12"/></svg><div class="combo-body"><div class="combo-wheels"></div><button class="primary combo-submit">${onGuess ? "Try combination" : "Unlock"}</button></div>`;
  const wheels = [],
    values = Array(code.length).fill(0);
  let opened = false;
  for (let i = 0; i < code.length; i++) {
    const wheel = document.createElement("div");
    wheel.className = "number-wheel";
    wheel.tabIndex = 0;
    wheel.setAttribute("role", "spinbutton");
    wheel.setAttribute("aria-label", `Digit ${i + 1}`);
    wheel.setAttribute("aria-valuemin", "0");
    wheel.setAttribute("aria-valuemax", "9");
    wheel.innerHTML = `<div class="wheel-digits">${Array.from({ length: 30 }, (_, j) => `<div class="wheel-digit">${j % 10}</div>`).join("")}</div>`;
    host.querySelector(".combo-wheels").append(wheel);
    wheels.push(wheel);
    let timer;
    function sync() {
      let row = Math.round(wheel.scrollTop / 44);
      values[i] = ((row % 10) + 10) % 10;
      wheel.setAttribute("aria-valuenow", values[i]);
    }
    function settle() {
      sync();
      let row = Math.round(wheel.scrollTop / 44);
      if (row < 10 || row >= 20) wheel.scrollTop = (10 + values[i]) * 44;
    }
    wheel.addEventListener("scroll", () => {
      sync();
      clearTimeout(timer);
      timer = setTimeout(settle, 130);
    });
    wheel.onkeydown = (e) => {
      if (opened) return;
      let n = values[i];
      if (e.key === "ArrowUp") n = (n + 9) % 10;
      else if (e.key === "ArrowDown") n = (n + 1) % 10;
      else if (/^[0-9]$/.test(e.key)) n = +e.key;
      else return;
      e.preventDefault();
      wheel.scrollTop = (10 + n) * 44;
      values[i] = n;
      wheel.setAttribute("aria-valuenow", n);
    };
    requestAnimationFrame(() => {
      wheel.scrollTop = 440;
      wheel.setAttribute("aria-valuenow", "0");
    });
  }
  host.querySelector(".combo-submit").onclick = () => {
    if (opened) return;
    const guess = wheels
      .map((w) => String(Math.round(w.scrollTop / 44) % 10))
      .join("");
    if (onGuess) onGuess(guess);
    if (guess === code) {
      opened = true;
      host.classList.add("open");
      wheels.forEach((w) => {
        w.tabIndex = -1;
        w.setAttribute("aria-disabled", "true");
      });
      host.querySelector("button").disabled = true;
      onSuccess();
    } else if (!onGuess) $("#status").textContent = "Not quite. Try again.";
  };
  return host;
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function key() {
  shell(
    1,
    "",
    "",
    `<div class="key-stage"><svg class="lock-target" viewBox="0 0 100 120" role="img" aria-label="Lock"><path id="shackle" d="M25 52V30a25 25 0 0 1 50 0v22" fill="none" stroke="#b4bac0" stroke-width="10"/><rect x="10" y="48" width="80" height="67" rx="10" fill="#b48a4d"/><circle cx="50" cy="76" r="10" fill="#17252f"/><path d="M46 81h8l4 18H42z" fill="#17252f"/></svg></div>`,
  );
  const art = [
    `<circle cx="34" cy="42" r="23" fill="none" stroke="#e8ba76" stroke-width="11"/><path d="M57 42H80" stroke="#e8ba76" stroke-width="12"/>`,
    `<path d="M0 42H80" stroke="#e8ba76" stroke-width="12"/>`,
    `<path d="M0 42H60V66H47V49H31V66H18V42" fill="#e8ba76" stroke="#e8ba76" stroke-width="6"/>`,
  ];
  const pieces = [
    { x: 65, y: 65, g: 0 },
    { x: 330, y: 110, g: 1 },
    { x: 165, y: 205, g: 2 },
  ];
  let assembled = false,
    unlocked = false,
    drag = null;
  const stage = $(".key-stage");
  art.forEach((a, i) => {
    let el = document.createElement("button");
    el.className = "key-fragment";
    el.setAttribute(
      "aria-label",
      `Key fragment ${i + 1}. Drag to join. Arrow keys move; Enter checks placement.`,
    );
    el.innerHTML = `<svg viewBox="0 0 80 85">${a}</svg>`;
    stage.append(el);
    pieces[i].el = el;
    el.onpointerdown = (e) => {
      if (unlocked) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      drag = {
        i,
        x: e.clientX,
        y: e.clientY,
        positions: pieces.map((p) => ({ x: p.x, y: p.y })),
      };
    };
    el.onpointermove = (e) => {
      if (!drag || drag.i !== i) return;
      const scale = 500 / stage.getBoundingClientRect().width;
      let dx = (e.clientX - drag.x) * scale,
        dy = (e.clientY - drag.y) * scale;
      const members = pieces
        .map((p, j) => (p.g === pieces[i].g ? j : -1))
        .filter((j) => j >= 0);
      dx = Math.max(
        -Math.min(...members.map((j) => drag.positions[j].x)),
        Math.min(
          dx,
          500 - 80 - Math.max(...members.map((j) => drag.positions[j].x)),
        ),
      );
      dy = Math.max(
        -Math.min(...members.map((j) => drag.positions[j].y)),
        Math.min(
          dy,
          420 - 85 - Math.max(...members.map((j) => drag.positions[j].y)),
        ),
      );
      members.forEach((j) => {
        pieces[j].x = drag.positions[j].x + dx;
        pieces[j].y = drag.positions[j].y + dy;
      });
      draw();
    };
    el.onpointerup = (e) => {
      if (!drag) return;
      drag = null;
      snap(i);
    };
    el.onpointercancel = () => (drag = null);
    el.onkeydown = (e) => {
      if (unlocked) return;
      const d = {
        ArrowLeft: [-5, 0],
        ArrowRight: [5, 0],
        ArrowUp: [0, -5],
        ArrowDown: [0, 5],
      }[e.key];
      if (d) {
        e.preventDefault();
        pieces
          .filter((p) => p.g === pieces[i].g)
          .forEach((p) => {
            p.x += d[0];
            p.y += d[1];
          });
        draw();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        snap(i);
      }
    };
  });
  function draw() {
    pieces.forEach((p) => {
      p.el.style.left = p.x / 5 + "%";
      p.el.style.top = p.y / 4.2 + "%";
    });
  }
  function snap(i) {
    for (let j = 0; j < 3; j++) {
      if (pieces[j].g === pieces[i].g) continue;
      const dx = pieces[j].x + (i - j) * 80 - pieces[i].x,
        dy = pieces[j].y - pieces[i].y;
      if (Math.abs(dx) < 25 && Math.abs(dy) < 25) {
        const old = pieces[i].g;
        pieces
          .filter((p) => p.g === old)
          .forEach((p) => {
            p.x += dx;
            p.y += dy;
            p.g = pieces[j].g;
          });
      }
    }
    assembled = pieces.every((p) => p.g === pieces[0].g);
    stage.classList.toggle("assembled", assembled);
    if (assembled) {
      pieces.forEach((p) =>
        p.el.setAttribute("aria-label", "Assembled key. Drag onto the lock."),
      );
      const tip = { x: pieces[0].x + 220, y: pieces[0].y + 42 };
      if (Math.abs(tip.x - 390) < 55 && Math.abs(tip.y - 316) < 60) {
        unlocked = true;
        stage.classList.add("unlocked");
        pieces.forEach((p) => (p.el.disabled = true));
        done();
      }
    }
    draw();
  }
  draw();
}
function photograph() {
  shell(
    2,
    "",
    "",
    `<div class="photo"><img src="${siteUrl(C.photo)}" alt="A gingerbread man holding a clue" draggable="false"><canvas width="600" height="600" aria-label="Scratch away the photograph coating"></canvas></div><div id="entry" style="margin-top:24px"></div>`,
  );
  const cv = $("canvas"),
    ctx = cv.getContext("2d");
  ctx.fillStyle = "#657580";
  ctx.fillRect(0, 0, 600, 600);
  ctx.fillStyle = "#bec8ce";
  ctx.font = "22px Georgia";
  ctx.textAlign = "center";
  let down = false,
    last = null;
  function rub(e) {
    let r = cv.getBoundingClientRect(),
      p = [
        ((e.clientX - r.left) * 600) / r.width,
        ((e.clientY - r.top) * 600) / r.height,
      ];
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 65;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(...(last || p));
    ctx.lineTo(...p);
    ctx.stroke();
    last = p;
  }
  cv.onpointerdown = (e) => {
    down = true;
    last = null;
    cv.setPointerCapture(e.pointerId);
    rub(e);
  };
  cv.onpointermove = (e) => {
    if (down) rub(e);
  };
  cv.onpointerup = cv.onpointercancel = () => {
    down = false;
    last = null;
  };
  $("#entry").append(combinationLock(C.photoCode, () => done()));
}
function bookshelf() {
  shell(
    3,
    "",
    "",
    '<div class="wooden-shelf"><div class="books plain-books"></div></div><div id="entry"></div>',
  );
  let order = [3, 0, 5, 1, 4, 2];
  let selected = null;
  const titles = [
    "Vampire Academy",
    "Frostbite",
    "Shadow Kiss",
    "Blood Promise",
    "Spirit Bound",
    "Last Sacrifice",
  ];
  const colours = [
    "#71363a",
    "#35415f",
    "#246249",
    "#63405e",
    "#9b7639",
    "#226660",
  ];
  // Five internal boundaries bisect digits. The first and last digits fit at the ends.
  // Keeping the existing seven-digit answer avoids changing the combination lock.
  const centres = [24, 80, 160, 240, 320, 400, 456];
  const artwork = [...C.shelfCode]
    .map((digit, i) => {
      const width = i === 0 || i === 6 ? 32 : 64;
      return `<text x="${centres[i] - width / 2}" y="62" fill="#f8e6bd" font-size="68" font-family="monospace" textLength="${width}" lengthAdjust="spacingAndGlyphs">${digit}</text>`;
    })
    .join("");
  function draw() {
    $(".books").innerHTML = order
      .map(
        (v, i) =>
          `<button class="book plain-book ${selected === i ? "selected" : ""}" style="--spine:${colours[v]}" data-i="${i}" aria-label="${titles[v]}; position ${i + 1}" aria-pressed="${selected === i}"><span class="book-title">${titles[v]}</span><svg class="spine-code" viewBox="${v * 80} 0 80 80" preserveAspectRatio="none" aria-hidden="true">${artwork}</svg></button>`,
      )
      .join("");
    $$(".book").forEach((book) => {
      book.onclick = () => {
        const i = Number(book.dataset.i);
        if (selected === null) selected = i;
        else {
          [order[i], order[selected]] = [order[selected], order[i]];
          selected = null;
        }
        draw();
      };
    });
  }
  draw();
  $("#entry").append(combinationLock(C.shelfCode, () => done()));
}
async function matching() {
  shell(
    4,
    "",
    "",
    '<div class="cards" aria-busy="true"></div><div id="pairs" style="margin-top:18px">0 / 10 pairs</div>',
  );
  const names = [
    "Spider-Man",
    "Buzz Lightyear",
    "Chase",
    "Heart",
    "Rainbow",
    "Alien",
    "Cross",
    "Sun",
    "Skye",
    "Marshall",
  ];
  const images = [
    "spider-man.png",
    "buzz-lightyear.png",
    "chase.png",
    "heart.png",
    "rainbow.png",
    "alien.png",
    "cross.png",
    "sun.png",
    "skye.png",
    "marshall.png",
  ];
  const cards = shuffle([...names.keys(), ...names.keys()]);
  let flipped = [],
    matched = new Set(),
    busy = false,
    ready = false;
  const board = $(".cards");
  // Mount once. Flips only change CSS; they never create or fetch an image.
  board.innerHTML = cards
    .map(
      (v, i) =>
        `<button class="card back" data-i="${i}" aria-label="Face-down card ${i + 1}" disabled><img class="card-art" src="${new URL(images[v], cardAssetRoot).href}" alt="" draggable="false" loading="eager" decoding="sync"><span class="card-cover" aria-hidden="true">✧</span></button>`,
    )
    .join("");
  const buttons = $$(".card");
  const painted = () =>
    new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  function draw() {
    buttons.forEach((button, i) => {
      const visible = matched.has(i) || flipped.includes(i);
      button.classList.toggle("back", !visible);
      button.classList.toggle("matched", matched.has(i));
      button.disabled = !ready || matched.has(i);
      button.setAttribute(
        "aria-label",
        visible ? names[cards[i]] : `Face-down card ${i + 1}`,
      );
    });
  }
  buttons.forEach(
    (button, i) =>
      (button.onclick = async () => {
        if (!ready || busy || matched.has(i) || flipped.includes(i)) return;
        flipped.push(i);
        draw();
        if (flipped.length !== 2) return;
        const [a, b] = flipped;
        if (cards[a] === cards[b]) {
          matched.add(a);
          matched.add(b);
          flipped = [];
          draw();
          $("#pairs").textContent = `${matched.size / 2} / 10 pairs`;
          if (matched.size === 20) done();
        } else {
          busy = true;
          // Count viewing time only after the second face has been painted.
          await painted();
          setTimeout(() => {
            flipped = [];
            busy = false;
            draw();
          }, 1000);
        }
      }),
  );
  $("#status").textContent = "Loading cards…";
  try {
    // Decode every mounted image, including both copies, before allowing play.
    await Promise.all(
      buttons.map((button) => button.querySelector("img").decode()),
    );
    await painted();
    ready = true;
    board.setAttribute("aria-busy", "false");
    $("#status").textContent = "";
    draw();
  } catch {
    $("#status").textContent = "Cards could not load. Refresh to try again.";
  }
}
function clock() {
  shell(
    5,
    "",
    "",
    `<div class="clock-layout"><svg class="clock" viewBox="0 0 320 320" aria-label="Interactive analog clock"><circle cx="160" cy="160" r="155" fill="#eee6d6" stroke="#b89255" stroke-width="7"/><g id="ticks"></g><line id="hourHand" x1="160" y1="160" x2="160" y2="80" stroke="#243746" stroke-width="10" stroke-linecap="round"/><line id="minuteHand" x1="160" y1="160" x2="160" y2="40" stroke="#a3672d" stroke-width="6" stroke-linecap="round"/><line id="hour-grip" x1="160" y1="143" x2="160" y2="80" stroke="transparent" stroke-width="28"/><line id="minute-grip" x1="160" y1="75" x2="160" y2="40" stroke="transparent" stroke-width="28"/><circle cx="160" cy="160" r="9" fill="#243746"/></svg><div class="frame" role="img" aria-label="A church and a heart in a picture frame">⛪<br>♥</div></div>`,
  );
  let h = 12,
    m = 0,
    timer = null,
    solved = false,
    hand = null;
  $("#ticks").innerHTML =
    Array.from(
      { length: 60 },
      (_, i) =>
        `<line x1="160" y1="${i % 5 ? 15 : 12}" x2="160" y2="${i % 5 ? 21 : 28}" stroke="#34444d" stroke-width="${i % 5 ? 1 : 3}" transform="rotate(${i * 6} 160 160)"/>`,
    ).join("") +
    Array.from({ length: 12 }, (_, i) => {
      let a = ((i + 1) * Math.PI) / 6;
      return `<text x="${160 + 109 * Math.sin(a)}" y="${166 - 109 * Math.cos(a)}" text-anchor="middle" font-size="19" fill="#243746">${i + 1}</text>`;
    }).join("");
  function update() {
    $("#hourHand").setAttribute(
      "transform",
      `rotate(${h * 30 + m / 2} 160 160)`,
    );
    $("#minuteHand").setAttribute("transform", `rotate(${m * 6} 160 160)`);
    $("#hour-grip").setAttribute(
      "transform",
      `rotate(${h * 30 + m / 2} 160 160)`,
    );
    $("#minute-grip").setAttribute("transform", `rotate(${m * 6} 160 160)`);
    clearTimeout(timer);
    if (h === 8 && m === 13 && !solved)
      timer = setTimeout(() => {
        solved = true;
        done();
      }, 400);
  }
  const cv = $(".clock");
  function pos(e) {
    const r = cv.getBoundingClientRect();
    return [
      ((e.clientX - r.left) * 320) / r.width - 160,
      ((e.clientY - r.top) * 320) / r.height - 160,
    ];
  }
  function move(e) {
    const [x, y] = pos(e),
      a = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
    const before = h * 60 + m;
    if (hand === "h") h = Math.round(a / 30) % 12 || 12;
    else m = Math.round(a / 6) % 60;
    if (h * 60 + m !== before) update();
  }
  cv.onpointerdown = (e) => {
    if (["hourHand", "hour-grip"].includes(e.target.id)) hand = "h";
    else if (["minuteHand", "minute-grip"].includes(e.target.id)) hand = "m";
    else return;
    cv.setPointerCapture(e.pointerId);
  };
  cv.onpointermove = (e) => {
    if (hand) move(e);
  };
  cv.onpointerup = cv.onpointercancel = () => (hand = null);
  update();
}
// A seeded branching maze with a solution shaped like 5. No optimality gate.
function makeMaze() {
  const n = 21,
    solution = [];
  function line(x, y, ex, ey) {
    while (true) {
      if (
        !solution.length ||
        solution.at(-1)[0] !== x ||
        solution.at(-1)[1] !== y
      )
        solution.push([x, y]);
      if (x === ex && y === ey) break;
      x += Math.sign(ex - x);
      y += Math.sign(ey - y);
    }
  }
  line(16, 3, 4, 3);
  line(4, 3, 4, 10);
  line(4, 10, 16, 10);
  line(16, 10, 16, 17);
  line(16, 17, 4, 17);
  const id = (x, y) => y * n + x,
    edges = new Set(),
    edge = (a, b) => [Math.min(a, b), Math.max(a, b)].join(":");
  const used = new Set(solution.map(([x, y]) => id(x, y)));
  for (let i = 1; i < solution.length; i++)
    edges.add(edge(id(...solution[i - 1]), id(...solution[i])));
  let seed = 3817;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  let frontier = [];
  function add(a) {
    const x = a % n,
      y = Math.floor(a / n);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < n && ny < n && !used.has(id(nx, ny)))
        frontier.push([a, id(nx, ny)]);
    }
  }
  [...used].forEach(add);
  while (frontier.length) {
    let i = Math.floor(random() * frontier.length),
      [a, b] = frontier[i];
    frontier[i] = frontier.at(-1);
    frontier.pop();
    if (used.has(b)) continue;
    used.add(b);
    edges.add(edge(a, b));
    add(b);
  }
  return { n, solution, edges, edge, id };
}
function maze() {
  shell(
    6,
    "",
    "",
    `<canvas class="maze" width="630" height="630" tabindex="0" aria-label="Maze. Trace from dot to ring; arrow keys also move."></canvas><div class="row" style="margin-top:18px"><button id="reset">Reset path</button></div><div id="entry" style="margin-top:20px"></div>`,
  );
  const { n, solution, edges, edge, id } = makeMaze(),
    cv = $("canvas"),
    ctx = cv.getContext("2d"),
    size = 630 / n;
  let path = [solution[0]],
    down = false;
  $("#entry").append(codeForm("5", () => done()));
  function draw() {
    ctx.fillStyle = "#243742";
    ctx.fillRect(0, 0, 630, 630);
    ctx.strokeStyle = "#101b23";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        if (x === 0) {
          ctx.moveTo(0, y * size);
          ctx.lineTo(0, (y + 1) * size);
        }
        if (y === 0) {
          ctx.moveTo(x * size, 0);
          ctx.lineTo((x + 1) * size, 0);
        }
        if (x === n - 1 || !edges.has(edge(id(x, y), id(x + 1, y)))) {
          ctx.moveTo((x + 1) * size, y * size);
          ctx.lineTo((x + 1) * size, (y + 1) * size);
        }
        if (y === n - 1 || !edges.has(edge(id(x, y), id(x, y + 1)))) {
          ctx.moveTo(x * size, (y + 1) * size);
          ctx.lineTo((x + 1) * size, (y + 1) * size);
        }
      }
    ctx.stroke();
    ctx.strokeStyle = "#edbc73";
    ctx.lineWidth = 7;
    ctx.lineJoin = ctx.lineCap = "round";
    ctx.beginPath();
    path.forEach(([x, y], i) =>
      ctx[i ? "lineTo" : "moveTo"]((x + 0.5) * size, (y + 0.5) * size),
    );
    ctx.stroke();
    [solution[0], solution.at(-1)].forEach(([x, y], i) => {
      ctx.beginPath();
      ctx.arc((x + 0.5) * size, (y + 0.5) * size, 8, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      i ? ctx.stroke() : ((ctx.fillStyle = "#edbc73"), ctx.fill());
    });
  }
  function step(x, y) {
    if (x < 0 || y < 0 || x >= n || y >= n) return;
    const last = path.at(-1);
    if (
      Math.abs(last[0] - x) + Math.abs(last[1] - y) !== 1 ||
      !edges.has(edge(id(...last), id(x, y)))
    )
      return;
    const prev = path.at(-2);
    if (prev && prev[0] === x && prev[1] === y) path.pop();
    else path.push([x, y]);
    draw();
  }
  function point(e) {
    const r = cv.getBoundingClientRect(),
      tx = Math.floor(((e.clientX - r.left) * n) / r.width),
      ty = Math.floor(((e.clientY - r.top) * n) / r.height);
    let [x, y] = path.at(-1);
    if (tx === x) {
      while (y !== ty) {
        let ny = y + Math.sign(ty - y);
        if (!edges.has(edge(id(x, y), id(x, ny)))) break;
        step(x, ny);
        y = ny;
      }
    } else if (ty === y) {
      while (x !== tx) {
        let nx = x + Math.sign(tx - x);
        if (!edges.has(edge(id(x, y), id(nx, y)))) break;
        step(nx, y);
        x = nx;
      }
    }
  }
  cv.onpointerdown = (e) => {
    down = true;
    cv.setPointerCapture(e.pointerId);
    point(e);
  };
  cv.onpointermove = (e) => {
    if (down) point(e);
  };
  cv.onpointerup = cv.onpointercancel = () => (down = false);
  cv.onkeydown = (e) => {
    const d = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    }[e.key];
    if (d) {
      e.preventDefault();
      const p = path.at(-1);
      step(p[0] + d[0], p[1] + d[1]);
    }
  };
  $("#reset").onclick = () => {
    path = [solution[0]];
    $("#status").textContent = "";
    $("#next").innerHTML = "";
    draw();
  };
  draw();
}
function score(guess, secret) {
  let correct = 0,
    placed = 0;
  for (let d = 0; d < 10; d++)
    correct += Math.min(
      [...guess].filter((x) => x === String(d)).length,
      [...secret].filter((x) => x === String(d)).length,
    );
  for (let i = 0; i < secret.length; i++) if (guess[i] === secret[i]) placed++;
  return { correct, placed };
}
function lock() {
  shell(
    7,
    "",
    "",
    `<div id="entry"></div><div id="feedback" class="lock-feedback" aria-live="polite"></div>`,
  );
  $("#entry").append(
    combinationLock(C.lockCode, () => done(), {
      onGuess: (guess) => {
        const r = score(guess, C.lockCode);
        $("#feedback").innerHTML =
          `<div><strong>${r.correct}</strong><span>Correct digits</span></div><div><strong>${r.placed}</strong><span>Correctly placed</span></div>`;
      },
    }),
  );
}
function complete() {
  shell(
    8,
    "Act I",
    "",
    `<div class="symbol" aria-label="Revealed symbol">${C.symbolA}</div><p>Keep watch for clue. It may not be revealed yet.</p><div id="entry"></div>`,
  );
  $("#entry").append(
    codeForm(
      C.actTwoCode,
      () => {
        if (C.actTwoUrl) location.href = siteUrl(C.actTwoUrl);
        else
          $("#status").textContent =
            "Code accepted. Act II is not available yet.";
      },
      "Code for Act Two",
    ),
  );
}
function review() {
  shell(
    0,
    "Puzzle pages",
    "Open any page to try it.",
    `<div class="review">${routes.map((r, i) => `<a href="${siteUrl(r + "/")}">${i + 1}. ${["Broken key", "Scratch photograph", "Bookshelf", "Matching pairs", "Analog clock", "Maze", "Deduction lock", "Act I completion"][i]}</a>`).join("")}</div>`,
  );
}
(
  ({
    key,
    photograph,
    bookshelf,
    matching,
    clock,
    maze,
    lock,
    complete,
    review,
  })[page] || key
)();
