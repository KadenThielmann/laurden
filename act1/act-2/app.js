import { content } from "./content.js";
import {
  LIGHTS_START,
  LIGHTS_SIZE,
  toggleLights,
  createBananas,
  validateGrid,
  dumpTile,
  peel,
  weighingCode,
  dictionaryPage,
  LASER,
  traceLaser,
  reverseChannels,
} from "./core.js";
const MODULE_URL = import.meta.url;
const BASE = new URL(".", MODULE_URL);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const asset = (path) => new URL(path, BASE).href;
const numeric = (value) => typeof value === "string" && /^\d+$/.test(value);

export const ROOM_PATHS = [
  "./",
  "jigsaw/",
  "weighing/",
  "audio/",
  "bananagrams/",
  "mirrors/",
  "dictionary/",
  "complete/",
];
export function mountActTwo(
  root,
  config = content,
  { initialRoom = 0, navigate = null } = {},
) {
  let room = initialRoom,
    completed = new Set(),
    disposed = () => {},
    generation = 0;
  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => [...root.querySelectorAll(selector)];
  const report = (text) => {
    if ($("#status")) $("#status").textContent = text;
  };
  function frame(body, extra = "") {
    disposed();
    disposed = () => {};
    generation++;
    document.body.classList.remove("blackout");
    document.body.classList.add("puzzle-only", "act-two");
    root.innerHTML = `<section class="surface ${extra}">${body}</section><div class="status" id="status" role="status" aria-live="polite"></div><div class="room-footer" id="next"></div>`;
  }
  function unavailable(host) {
    host.innerHTML = '<div class="unavailable">Not yet available.</div>';
  }
  function go(nextRoom) {
    if (navigate) {
      navigate(new URL(ROOM_PATHS[nextRoom], BASE).href);
      return;
    }
    room = nextRoom;
    show();
  }
  function complete() {
    if (completed.has(room)) return;
    completed.add(room);
    $(".surface").classList.add("success");
    if (room === 6) {
      go(7);
      return;
    }
    const next = document.createElement("button");
    next.className = "next";
    next.textContent = "Continue";
    next.onclick = () => {
      if (!completed.has(room)) return;
      go(room + 1);
    };
    $("#next").append(next);
  }
  function lock(host, code, onSuccess, { letters = false } = {}) {
    const grouped =
      !letters &&
      typeof code === "string" &&
      /^\d{1,2}(?:-\d{1,2})+$/.test(code);
    const alphabet = grouped
      ? Array.from({ length: 40 }, (_, i) => String(i))
      : [...(letters ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "0123456789")];
    if (
      typeof code !== "string" ||
      (!grouped && !(letters ? /^[a-z]+$/i : /^\d+$/).test(code)) ||
      (grouped && code.split("-").some((n) => Number(n) > 39))
    ) {
      unavailable(host);
      return;
    }
    const expected = code.toUpperCase(),
      segments = grouped ? code.split("-") : [...code],
      count = alphabet.length;
    host.className +=
      " combination-lock" +
      (segments.length > 6 ? " eight-digits" : "") +
      (grouped ? " grouped-lock" : "");
    host.innerHTML =
      '<svg class="combo-shackle" viewBox="0 0 120 70" aria-hidden="true"><path d="M25 68V36a35 35 0 0 1 70 0v32" fill="none" stroke="#b8c3cb" stroke-width="12"/></svg><div class="combo-body"><div class="combo-wheels"></div><button class="primary combo-submit">Unlock</button></div>';
    const wheels = [];
    let opened = false;
    for (let i = 0; i < segments.length; i++) {
      const wheel = document.createElement("div");
      wheel.className = "number-wheel";
      wheel.tabIndex = 0;
      wheel.setAttribute("role", "spinbutton");
      wheel.setAttribute(
        "aria-label",
        `${letters ? "Letter" : grouped ? "Number" : "Digit"} ${i + 1}`,
      );
      wheel.setAttribute("aria-valuemin", "0");
      wheel.setAttribute("aria-valuemax", String(count - 1));
      wheel.setAttribute("aria-valuenow", "0");
      wheel.setAttribute("aria-valuetext", alphabet[0]);
      wheel.innerHTML = `<div class="wheel-digits">${Array.from({ length: count * 3 }, (_, j) => `<div class="wheel-digit">${alphabet[j % count]}</div>`).join("")}</div>`;
      if (grouped && i) {
        const separator = document.createElement("span");
        separator.className = "wheel-separator";
        separator.textContent = "–";
        separator.setAttribute("aria-hidden", "true");
        host.querySelector(".combo-wheels").append(separator);
      }
      host.querySelector(".combo-wheels").append(wheel);
      wheels.push(wheel);
      const value = () => Math.round(wheel.scrollTop / 44) % count;
      const sync = () => {
        wheel.setAttribute("aria-valuenow", String(value()));
        wheel.setAttribute("aria-valuetext", alphabet[value()]);
      };
      wheel.onscroll = sync;
      let typedNumber = "",
        lastTyped = 0;
      wheel.onkeydown = (e) => {
        if (opened) return;
        let typed =
          e.key.length === 1 ? alphabet.indexOf(e.key.toUpperCase()) : -1;
        if (grouped && /^\d$/.test(e.key)) {
          typedNumber =
            performance.now() - lastTyped < 800 ? typedNumber + e.key : e.key;
          if (Number(typedNumber) >= count) typedNumber = e.key;
          lastTyped = performance.now();
          typed = Number(typedNumber);
        }
        if (
          typed >= 0 ||
          ["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)
        ) {
          e.preventDefault();
          const v =
            typed >= 0
              ? typed
              : e.key === "Home"
                ? 0
                : e.key === "End"
                  ? count - 1
                  : (value() + (e.key === "ArrowUp" ? 1 : count - 1)) % count;
          wheel.scrollTop = (count + v) * 44;
          sync();
        }
      };
      requestAnimationFrame(() => {
        wheel.scrollTop = count * 44;
      });
    }
    host.querySelector("button").onclick = () => {
      if (opened) return;
      const guess = wheels
        .map((w) => alphabet[Math.round(w.scrollTop / 44) % count])
        .join(grouped ? "-" : "");
      if (guess !== expected) {
        host.classList.remove("rejected");
        void host.offsetWidth;
        host.classList.add("rejected");
        host.setAttribute("aria-label", "Incorrect combination");
        return;
      }
      opened = true;
      host.classList.add("open");
      host.setAttribute("aria-label", "Unlocked");
      host.querySelector("button").disabled = true;
      wheels.forEach((w) => (w.tabIndex = -1));
      onSuccess();
    };
  }
  function lights() {
    frame(
      '<p>Turn them all off.</p><div class="lights"></div><button class="quiet" id="reset">Reset</button>',
    );
    let board = [...LIGHTS_START],
      off = false;
    $(".lights").innerHTML = board
      .map(
        (_, i) =>
          `<button class="light" aria-label="Light ${Math.floor(i / LIGHTS_SIZE) + 1}, ${(i % LIGHTS_SIZE) + 1}"></button>`,
      )
      .join("");
    const buttons = $$(".light");
    const draw = () =>
      buttons.forEach((b, i) => {
        b.classList.toggle("on", !!board[i]);
        b.setAttribute("aria-pressed", String(!!board[i]));
        b.disabled = off;
      });
    buttons.forEach(
      (b, i) =>
        (b.onclick = () => {
          if (off) return;
          board = toggleLights(board, i);
          off = board.every((x) => !x);
          draw();
          if (off) {
            $("#reset").disabled = true;
            setTimeout(flashlight, 450);
          }
        }),
    );
    $("#reset").onclick = () => {
      board = [...LIGHTS_START];
      draw();
    };
    draw();
  }
  function flashlight() {
    frame(
      '<div class="dark-stage"><canvas aria-label="Dark room"></canvas></div><div class="dark-lock" id="lock"></div>',
    );
    document.body.classList.add("blackout");
    const stage = $(".dark-stage"),
      canvas = $("canvas"),
      ctx = canvas.getContext("2d");
    const scene = document.createElement("canvas"),
      light = document.createElement("canvas");
    const sceneCtx = scene.getContext("2d"),
      lightCtx = light.getContext("2d");
    let width = 0,
      height = 0,
      dpr = 1,
      raf = 0,
      previous = 0,
      alpha = 0,
      goal = 0,
      point = null,
      target = null;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    function paint() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#030506";
      ctx.fillRect(0, 0, width, height);
      if (!point || alpha < 0.001) return;
      lightCtx.setTransform(1, 0, 0, 1, 0, 0);
      lightCtx.clearRect(0, 0, light.width, light.height);
      lightCtx.globalCompositeOperation = "source-over";
      lightCtx.drawImage(scene, 0, 0);
      lightCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lightCtx.globalCompositeOperation = "destination-in";
      const radius = Math.min(125, width * 0.38),
        x = point.x * width,
        y = point.y * height;
      const mask = lightCtx.createRadialGradient(x, y, 0, x, y, radius);
      mask.addColorStop(0, `rgba(255,255,255,${alpha})`);
      mask.addColorStop(0.3, `rgba(255,255,255,${alpha * 0.94})`);
      mask.addColorStop(0.65, `rgba(255,255,255,${alpha * 0.45})`);
      mask.addColorStop(1, "rgba(255,255,255,0)");
      lightCtx.fillStyle = mask;
      lightCtx.fillRect(0, 0, width, height);
      ctx.drawImage(light, 0, 0, width, height);
    }
    function animate(time) {
      raf = 0;
      const dt = Math.min(40, time - (previous || time - 16));
      previous = time;
      const easing = reduced ? 1 : 1 - Math.exp(-dt / 65),
        fade = 1 - Math.exp(-dt / 105);
      if (target) {
        point ??= { ...target };
        point.x += (target.x - point.x) * easing;
        point.y += (target.y - point.y) * easing;
      }
      alpha += (goal - alpha) * fade;
      if (Math.abs(alpha - goal) < 0.002) alpha = goal;
      paint();
      if (
        Math.abs(alpha - goal) > 0.001 ||
        (target && Math.hypot(point.x - target.x, point.y - target.y) > 0.0001)
      )
        raf = requestAnimationFrame(animate);
    }
    function wake() {
      if (!raf) {
        previous = 0;
        raf = requestAnimationFrame(animate);
      }
    }
    function resize() {
      const r = stage.getBoundingClientRect();
      width = r.width;
      height = r.height;
      dpr = Math.min(devicePixelRatio || 1, 2);
      for (const c of [canvas, scene, light]) {
        c.width = Math.round(width * dpr);
        c.height = Math.round(height * dpr);
      }
      sceneCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sceneCtx.fillStyle = "#2c3337";
      sceneCtx.fillRect(0, 0, width, height);
      sceneCtx.strokeStyle = "#1e282d";
      sceneCtx.lineWidth = 1.5;
      for (let y = 0; y < height; y += 63) {
        sceneCtx.beginPath();
        sceneCtx.moveTo(0, y);
        sceneCtx.lineTo(width, y);
        sceneCtx.stroke();
        for (let x = (Math.round(y / 63) % 2) * 90; x < width; x += 180) {
          sceneCtx.beginPath();
          sceneCtx.moveTo(x, y);
          sceneCtx.lineTo(x, y + 63);
          sceneCtx.stroke();
        }
      }
      if (typeof config.flashlight.code === "string") {
        sceneCtx.save();
        sceneCtx.translate(width * 0.64, height * 0.34);
        sceneCtx.rotate(-0.07);
        sceneCtx.textAlign = "center";
        sceneCtx.font = `${Math.min(28, width / (config.flashlight.code.length + 4))}px Georgia`;
        sceneCtx.fillStyle = "#172126";
        sceneCtx.fillText(config.flashlight.code, 1, 1);
        sceneCtx.fillStyle = "#b0b7ae";
        sceneCtx.fillText(config.flashlight.code, 0, 0);
        sceneCtx.restore();
      }
      paint();
    }
    function move(e) {
      const r = stage.getBoundingClientRect();
      target = {
        x: (e.clientX - r.left) / r.width,
        y:
          (e.clientY - r.top - (e.pointerType === "touch" ? 45 : 0)) / r.height,
      };
      goal = 1;
      wake();
    }
    stage.onpointerdown = (e) => {
      stage.setPointerCapture(e.pointerId);
      move(e);
    };
    stage.onpointermove = (e) => {
      if (e.pointerType === "mouse" || e.buttons) move(e);
    };
    stage.onpointerup = stage.onpointercancel = (e) => {
      if (e.pointerType !== "mouse") {
        goal = 0;
        wake();
      }
    };
    stage.onpointerleave = (e) => {
      if (e.pointerType === "mouse") {
        goal = 0;
        wake();
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    disposed = () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
    resize();
    lock($("#lock"), config.flashlight.code, complete, { letters: true });
  }
  async function jigsaw() {
    frame('<div id="jigsaw"></div>');
    if (!config.jigsaw.photo) {
      unavailable($("#jigsaw"));
      return;
    }
    const token = generation,
      img = new Image();
    img.src = asset(config.jigsaw.photo);
    report("Loading…");
    try {
      await img.decode();
    } catch {
      report("The photograph could not load. Refresh to try again.");
      return;
    }
    if (token !== generation) return;
    report("");
    const cols = config.jigsaw.columns,
      rows = config.jigsaw.rows;
    if (
      !Number.isInteger(cols) ||
      !Number.isInteger(rows) ||
      cols < 2 ||
      rows < 2 ||
      cols > 6 ||
      rows > 12
    ) {
      unavailable($("#jigsaw"));
      return;
    }
    $("#jigsaw").innerHTML =
      '<div class="jigsaw-stage"><div class="jigsaw-target"></div><div class="jigsaw-tray" aria-label="Loose pieces"></div></div><div class="jigsaw-tray-nav"><button class="quiet" id="piece-previous" aria-label="Previous pieces">←</button><button class="quiet" id="piece-next" aria-label="Next pieces">→</button></div>';
    const stage = $(".jigsaw-stage"),
      tray = $(".jigsaw-tray"),
      pieces = [];
    const aspect = img.naturalWidth / img.naturalHeight,
      all = cols * rows,
      cellW = 1 / cols,
      cellH = 1 / aspect / rows;
    const order = Array.from({ length: all }, (_, i) => (i * 7 + 3) % all),
      scrambled =
        new Set(order).size === all
          ? order
          : Array.from({ length: all }, (_, i) => all - 1 - i);
    let placed = 0,
      drag = null,
      trayPage = 0,
      width = 0,
      boardHeight = 0,
      trayTop = 0,
      stageHeight = 0,
      timer = null;
    const path = (c, r) =>
      `M25 25 ${r ? "L60 25 C60 25 58 39 75 39 C92 39 90 25 90 25" : ""} L125 25 ${c < cols - 1 ? "L125 60 C125 60 139 58 139 75 C139 92 125 90 125 90" : ""} L125 125 ${r < rows - 1 ? "L90 125 C90 125 92 139 75 139 C58 139 60 125 60 125" : ""} L25 125 ${c ? "L25 90 C25 90 39 92 39 75 C39 58 25 60 25 60" : ""} Z`;
    function layout() {
      width = stage.clientWidth;
      boardHeight = width / aspect;
      trayTop = boardHeight + 28;
      stageHeight = trayTop + 100;
      stage.style.height = `${stageHeight}px`;
      $(".jigsaw-target").style.cssText =
        `left:0;top:0;width:100%;height:${boardHeight}px`;
      tray.style.cssText = `top:${trayTop - 8}px;height:108px`;
      pieces.forEach((p) => {
        const inTray = p.mode === "tray",
          slot = scrambled.indexOf(p.id);
        p.el.toggleAttribute(
          "hidden",
          inTray && Math.floor(slot / 3) !== trayPage,
        );
        if (inTray) {
          p.x = ((slot % 3) + 0.5) / 3 - cellW / 2;
          p.y = (trayTop + 50 - (cellH * width) / 2) / width;
        }
        p.el.style.left = `${(p.x - cellW * 0.25) * width}px`;
        p.el.style.top = `${(p.y - cellH * 0.25) * width}px`;
        p.el.style.width = `${cellW * 1.5 * width}px`;
        p.el.style.height = `${cellH * 1.5 * width}px`;
      });
      $("#piece-previous").disabled = trayPage === 0;
      $("#piece-next").disabled = trayPage === Math.ceil(all / 3) - 1;
    }
    function end(p, cancelled = false) {
      if (drag?.p !== p) return;
      const previous = drag;
      drag = null;
      p.el.classList.remove("dragging");
      if (cancelled) {
        p.mode = previous.mode;
        p.x = previous.x;
        p.y = previous.y;
        layout();
        return;
      }
      const tolerance = Math.min(cellW, cellH) * 0.38;
      if (Math.hypot(p.x - p.tx, p.y - p.ty) < tolerance) {
        p.x = p.tx;
        p.y = p.ty;
        p.placed = true;
        p.mode = "board";
        p.el.classList.add("placed");
        placed++;
        if (placed === all) {
          stage.classList.add("solved");
          stage.setAttribute("aria-label", config.jigsaw.alt);
          $(".jigsaw-tray-nav").hidden = true;
          timer = setTimeout(complete, 1000);
        }
      } else if ((p.y + cellH / 2) * width > boardHeight + 12) {
        p.mode = "tray";
      }
      layout();
    }
    for (let i = 0; i < all; i++) {
      const c = i % cols,
        r = Math.floor(i / cols),
        p = {
          id: i,
          x: 0,
          y: 0,
          tx: c * cellW,
          ty: r * cellH,
          placed: false,
          mode: "tray",
        };
      const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      p.el = el;
      el.classList.add("jigsaw-piece");
      el.setAttribute("viewBox", "0 0 150 150");
      el.setAttribute("preserveAspectRatio", "none");
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", `Photo piece ${i + 1}`);
      el.innerHTML = `<defs><clipPath id="piece-${i}"><path d="${path(c, r)}"/></clipPath></defs><g clip-path="url(#piece-${i})"><image href="${esc(img.src)}" x="${25 - c * 100}" y="${25 - r * 100}" width="${cols * 100}" height="${rows * 100}" preserveAspectRatio="none"/><path d="${path(c, r)}" fill="none" stroke="#e8ba7680" stroke-width=".8"/></g>`;
      stage.append(el);
      pieces.push(p);
      el.onpointerdown = (e) => {
        if (p.placed || drag) return;
        e.preventDefault();
        stage.append(el);
        el.setPointerCapture(e.pointerId);
        const rect = stage.getBoundingClientRect();
        drag = {
          p,
          mode: p.mode,
          x: p.x,
          y: p.y,
          dx: (e.clientX - rect.left) / width - p.x,
          dy: (e.clientY - rect.top) / width - p.y,
        };
        p.mode = "board";
        el.classList.add("dragging");
      };
      el.onpointermove = (e) => {
        if (drag?.p !== p) return;
        const rect = stage.getBoundingClientRect();
        p.x = Math.max(
          0,
          Math.min(1 - cellW, (e.clientX - rect.left) / width - drag.dx),
        );
        p.y = Math.max(
          0,
          Math.min(
            stageHeight / width - cellH,
            (e.clientY - rect.top) / width - drag.dy,
          ),
        );
        layout();
      };
      el.onpointerup = () => end(p);
      el.onpointercancel = () => end(p, true);
    }
    $("#piece-previous").onclick = () => {
      if (drag || trayPage === 0) return;
      trayPage--;
      layout();
    };
    $("#piece-next").onclick = () => {
      if (drag || trayPage >= Math.ceil(all / 3) - 1) return;
      trayPage++;
      layout();
    };
    const observer = new ResizeObserver(() => {
      if (drag) end(drag.p, true);
      layout();
    });
    observer.observe(stage);
    disposed = () => {
      observer.disconnect();
      clearTimeout(timer);
    };
    layout();
  }
  function objectArt(o) {
    if (Number.isInteger(o.sprite)) {
      const x = ((o.sprite % 4) * 100) / 3,
        y = Math.floor(o.sprite / 4) * 100;
      return `<span class="object-art" role="img" aria-label="${esc(o.name)}" style="background-image:url('${esc(asset(o.image))}');background-position:${x}% ${y}%"></span>`;
    }
    return `<img src="${esc(asset(o.image))}" alt="${esc(o.name)}" draggable="false">`;
  }
  async function weighing() {
    frame(
      '<div class="scale-area"><div class="object-tray"></div><div class="scale-pan" aria-label="Scale pan"></div><output class="scale-readout" aria-live="polite">—</output><button class="quiet" id="remove">Remove</button></div><div id="lock"></div>',
    );
    const objects = config.weighing.objects,
      code = weighingCode(objects);
    if (!code) {
      unavailable($(".scale-area"));
      lock($("#lock"), null, complete);
      return;
    }
    const token = generation;
    try {
      await Promise.all(
        [...new Set(objects.map((o) => o.image))].map(async (path) => {
          const image = new Image();
          image.src = asset(path);
          await image.decode();
        }),
      );
    } catch {
      if (token === generation)
        report("The objects could not load. Refresh to try again.");
      return;
    }
    if (token !== generation) return;
    $(".object-tray").innerHTML = objects
      .map(
        (o) =>
          `<button class="weigh-object" aria-label="Weigh ${esc(o.name)}" data-object="${esc(o.id)}">${objectArt(o)}</button>`,
      )
      .join("");
    let current = null,
      ghost = null,
      drag = null;
    function weigh(o) {
      current = o;
      $(".scale-pan").innerHTML = objectArt(o);
      $(".scale-pan").classList.remove("settling");
      void $(".scale-pan").offsetWidth;
      $(".scale-pan").classList.add("settling");
      $(".scale-readout").textContent = `${o.value}.${o.position} g`;
      $$(".weigh-object").forEach((b) =>
        b.classList.toggle("on-scale", b.dataset.object === o.id),
      );
    }
    function remove() {
      current = null;
      $(".scale-pan").innerHTML = "";
      $(".scale-readout").textContent = "—";
      $$(".weigh-object").forEach((b) => b.classList.remove("on-scale"));
    }
    $("#remove").onclick = remove;
    $$(".weigh-object").forEach((el, i) => {
      el.onpointerdown = (e) => {
        if (drag) return;
        el.setPointerCapture(e.pointerId);
        drag = { x: e.clientX, y: e.clientY, moved: false };
        ghost = el.firstElementChild.cloneNode(true);
        ghost.classList.add("drag-ghost");
        document.body.append(ghost);
        ghost.style.left = `${e.clientX - 35}px`;
        ghost.style.top = `${e.clientY - 55}px`;
      };
      el.onpointermove = (e) => {
        if (!drag) return;
        drag.moved ||= Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5;
        ghost.style.left = `${e.clientX - 35}px`;
        ghost.style.top = `${e.clientY - 55}px`;
      };
      el.onpointerup = (e) => {
        if (!drag) return;
        const r = $(".scale-pan").getBoundingClientRect();
        if (
          !drag.moved ||
          (e.clientX > r.left - 25 &&
            e.clientX < r.right + 25 &&
            e.clientY > r.top - 35 &&
            e.clientY < r.bottom + 25)
        )
          weigh(objects[i]);
        ghost.remove();
        ghost = null;
        drag = null;
      };
      el.onpointercancel = () => {
        ghost?.remove();
        ghost = null;
        drag = null;
      };
      el.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          weigh(objects[i]);
        }
      };
    });
    const pan = $(".scale-pan");
    pan.onpointerdown = (e) => {
      if (!current || drag) return;
      e.preventDefault();
      pan.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, moved: false };
      ghost = pan.firstElementChild.cloneNode(true);
      ghost.classList.add("drag-ghost");
      document.body.append(ghost);
      ghost.style.left = `${e.clientX - 35}px`;
      ghost.style.top = `${e.clientY - 55}px`;
    };
    pan.onpointermove = (e) => {
      if (!drag) return;
      drag.moved ||= Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5;
      ghost.style.left = `${e.clientX - 35}px`;
      ghost.style.top = `${e.clientY - 55}px`;
    };
    pan.onpointerup = (e) => {
      if (!drag) return;
      const r = pan.getBoundingClientRect();
      if (
        drag.moved &&
        (e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom)
      )
        remove();
      ghost?.remove();
      ghost = null;
      drag = null;
    };
    pan.onpointercancel = () => {
      ghost?.remove();
      ghost = null;
      drag = null;
    };
    disposed = () => ghost?.remove();
    lock($("#lock"), code, complete);
  }
  function audioRoom() {
    frame(
      '<div class="audio-device"><div class="audio-led"></div><div class="speaker-grille" aria-hidden="true"></div><div class="row"><button id="play">Play</button><button id="reverse">Reverse</button></div></div><div id="lock"></div>',
    );
    let context = null,
      source = null,
      reversed = null,
      loadPromise = null,
      request = 0;
    const ensure = async () => {
      context ??= new (window.AudioContext || window.webkitAudioContext)();
      await context.resume();
      return context;
    };
    function stop() {
      request++;
      if (source) {
        source.onended = null;
        try {
          source.stop();
        } catch {}
        source = null;
      }
      $(".audio-device")?.classList.remove("playing");
    }
    async function start(buffer) {
      stop();
      source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.onended = () => $(".audio-device")?.classList.remove("playing");
      $(".audio-device").classList.add("playing");
      source.start();
    }
    $("#play").onclick = async () => {
      try {
        await ensure();
        const buffer = context.createBuffer(
            1,
            Math.floor(context.sampleRate * 0.45),
            context.sampleRate,
          ),
          data = buffer.getChannelData(0);
        let seed = 31;
        for (let i = 0; i < data.length; i++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          data[i] =
            ((seed / 4294967296) * 2 - 1) *
            0.15 *
            Math.sin((Math.PI * i) / data.length);
        }
        await start(buffer);
      } catch {
        report("Audio could not start. Tap again.");
      }
    };
    $("#reverse").onclick = async () => {
      if (!config.audio.forwardRecording && !config.audio.backwardRecording) {
        report("Not yet available.");
        return;
      }
      try {
        await ensure();
        stop();
        const ticket = request;
        report("");
        $("#reverse").disabled = true;
        loadPromise ??= (async () => {
          const response = await fetch(
            asset(
              config.audio.backwardRecording || config.audio.forwardRecording,
            ),
          );
          if (!response.ok) throw Error("Audio");
          const original = await context.decodeAudioData(
            await response.arrayBuffer(),
          );
          if (config.audio.backwardRecording) return original;
          const channels = reverseChannels(
            Array.from({ length: original.numberOfChannels }, (_, i) =>
              original.getChannelData(i),
            ),
          );
          const buffer = context.createBuffer(
            original.numberOfChannels,
            original.length,
            original.sampleRate,
          );
          channels.forEach((c, i) => buffer.copyToChannel(c, i));
          return buffer;
        })();
        reversed = await loadPromise;
        if (ticket === request) await start(reversed);
      } catch {
        loadPromise = null;
        report("Audio could not load. Try again.");
      } finally {
        if ($("#reverse")) $("#reverse").disabled = false;
      }
    };
    disposed = () => {
      stop();
      context?.close();
    };
    lock($("#lock"), config.audio.code, () => {
      stop();
      complete();
    });
  }
  async function bananas() {
    frame(
      '<div class="banana-controls"><button class="quiet" id="centre">Centre</button><button class="quiet" id="dump" disabled>DUMP</button></div><div class="banana-viewport" aria-label="Crossword play area"><div class="banana-grid"></div></div><div class="loose-tiles" aria-label="Loose tiles"></div><div class="dump-confirm" hidden><p>Return 1 tile. Draw 3.</p><button id="confirm-dump">DUMP</button><button class="quiet" id="cancel-dump">Cancel</button></div>',
      "banana-surface",
    );
    const token = generation;
    let words,
      state,
      selected = null,
      drag = null,
      ghost = null,
      timer = null,
      invalid = new Set();
    const viewport = $(".banana-viewport"),
      grid = $(".banana-grid"),
      tray = $(".loose-tiles");
    grid.style.width = grid.style.height = "17600px";
    report("Loading tiles…");
    try {
      const response = await fetch(asset(config.bananas.wordList));
      if (!response.ok) throw Error("Words");
      words = new Set(
        (await response.text())
          .split(/\s+/)
          .filter((w) => /^[a-zA-Z]{2,}$/.test(w))
          .map((w) => w.toUpperCase()),
      );
      if (words.size < 1000) throw Error("Words");
      state = createBananas(config.bananas.drawSequence);
    } catch {
      report("The tiles could not load. Refresh to try again.");
      return;
    }
    if (token !== generation) return;
    report("");
    function centre() {
      const placed = state.tiles.filter((t) => t.x !== null);
      const x = placed.length
          ? placed.reduce((s, t) => s + t.x, 0) / placed.length
          : 200,
        y = placed.length
          ? placed.reduce((s, t) => s + t.y, 0) / placed.length
          : 200;
      viewport.scrollLeft = x * 44 - viewport.clientWidth / 2 + 22;
      viewport.scrollTop = y * 44 - viewport.clientHeight / 2 + 22;
    }
    function render() {
      grid.innerHTML = "";
      tray.innerHTML = "";
      state.tiles.forEach((t) => {
        const b = document.createElement("button");
        b.className =
          "letter-tile" +
          (selected === t.id ? " chosen" : "") +
          (invalid.has(t.id) ? " invalid" : "");
        b.textContent = t.letter;
        b.dataset.tile = t.id;
        b.setAttribute(
          "aria-label",
          `${t.letter}${t.x === null ? ", loose tile" : ", on board"}`,
        );
        b.disabled = state.complete;
        if (t.x === null) tray.append(b);
        else {
          b.style.left = `${t.x * 44 + 1}px`;
          b.style.top = `${t.y * 44 + 1}px`;
          grid.append(b);
        }
      });
      $("#dump").disabled =
        state.complete ||
        !state.tiles.some((t) => t.id === selected && t.x === null) ||
        state.bunch.length < 2;
    }
    function validate() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (drag || state.complete || generation !== token) return;
        const result = validateGrid(state.tiles, words);
        invalid = new Set(result.invalid.flatMap((w) => w.ids));
        if (result.valid) {
          const outcome = peel(state, words);
          selected = null;
          report(outcome === "peel" ? "PEEL" : "");
          render();
          if (outcome === "complete") complete();
        } else {
          report(
            result.pending
              ? ""
              : result.connected === false
                ? "Join the tiles."
                : result.invalid.length
                  ? "Check the marked words."
                  : "",
          );
          render();
        }
      }, 350);
    }
    function position(clientX, clientY) {
      const r = viewport.getBoundingClientRect();
      if (
        clientX < r.left ||
        clientX > r.right ||
        clientY < r.top ||
        clientY > r.bottom
      )
        return null;
      return {
        x: Math.floor((clientX - r.left + viewport.scrollLeft) / 44),
        y: Math.floor((clientY - r.top + viewport.scrollTop) / 44),
      };
    }
    function place(id, pos) {
      const t = state.tiles.find((t) => t.id === id);
      if (!t || state.complete) return;
      if (
        pos &&
        (pos.x < 0 ||
          pos.y < 0 ||
          pos.x >= 400 ||
          pos.y >= 400 ||
          state.tiles.some(
            (o) => o.id !== id && o.x === pos.x && o.y === pos.y,
          ))
      )
        return;
      t.x = pos?.x ?? null;
      t.y = pos?.y ?? null;
      selected = null;
      invalid.clear();
      render();
      validate();
    }
    const surface = $(".surface");
    surface.onpointerdown = (e) => {
      const tile = e.target.closest("[data-tile]");
      if (!tile || drag || state.complete) return;
      clearTimeout(timer);
      $(".dump-confirm").hidden = true;
      drag = {
        id: +tile.dataset.tile,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        el: tile,
      };
      tile.setPointerCapture(e.pointerId);
    };
    surface.onpointermove = (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6)
        return;
      drag.moved = true;
      e.preventDefault();
      if (!ghost) {
        ghost = drag.el.cloneNode(true);
        ghost.className = "letter-tile tile-ghost";
        ghost.removeAttribute("data-tile");
        ghost.removeAttribute("id");
        document.body.append(ghost);
        drag.el.classList.add("moving");
      }
      ghost.style.left = `${e.clientX - 21}px`;
      ghost.style.top = `${e.clientY - 28}px`;
      const r = viewport.getBoundingClientRect();
      if (e.clientY >= r.top && e.clientY <= r.bottom) {
        if (e.clientX < r.left + 28) viewport.scrollLeft -= 15;
        if (e.clientX > r.right - 28) viewport.scrollLeft += 15;
        if (e.clientY < r.top + 28) viewport.scrollTop -= 15;
        if (e.clientY > r.bottom - 28) viewport.scrollTop += 15;
      }
    };
    surface.onpointerup = (e) => {
      if (!drag) return;
      const old = drag;
      drag = null;
      ghost?.remove();
      ghost = null;
      old.el.classList.remove("moving");
      if (!old.moved) {
        selected = selected === old.id ? null : old.id;
        render();
        return;
      }
      const pos = position(e.clientX, e.clientY),
        r = tray.getBoundingClientRect();
      if (pos) place(old.id, pos);
      else if (
        e.clientX >= r.left - 15 &&
        e.clientX <= r.right + 15 &&
        e.clientY >= r.top - 20 &&
        e.clientY <= r.bottom + 30
      )
        place(old.id, null);
    };
    surface.onpointercancel = () => {
      drag?.el.classList.remove("moving");
      drag = null;
      ghost?.remove();
      ghost = null;
      validate();
    };
    grid.onclick = (e) => {
      if (e.target === grid && selected !== null)
        place(selected, position(e.clientX, e.clientY));
    };
    tray.onclick = (e) => {
      if (e.target === tray && selected !== null) place(selected, null);
    };
    surface.onkeydown = (e) => {
      const b = e.target.closest("[data-tile]");
      if (b && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        selected = +b.dataset.tile;
        render();
      }
    };
    $("#centre").onclick = centre;
    $("#dump").onclick = () => {
      $(".dump-confirm").hidden = false;
    };
    $("#cancel-dump").onclick = () => {
      $(".dump-confirm").hidden = true;
    };
    $("#confirm-dump").onclick = () => {
      if (dumpTile(state, selected)) {
        selected = null;
        invalid.clear();
        report("");
        render();
      }
      $(".dump-confirm").hidden = true;
    };
    disposed = () => {
      clearTimeout(timer);
      ghost?.remove();
    };
    render();
    requestAnimationFrame(centre);
  }
  function laser() {
    frame(
      '<div class="optics"><svg viewBox="-.5 -.5 9 9" role="img" aria-label="Laser, mirrors and target"></svg></div>',
    );
    const angles = [...LASER.initial],
      host = $(".optics"),
      svg = $("svg");
    let solved = false;
    function draw() {
      const beam = traceLaser(angles);
      svg.innerHTML = `<defs><pattern id="optic-grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M 1 0 L 0 0 0 1" fill="none" stroke="#ffffff08" stroke-width=".015"/></pattern></defs><rect x="-.5" y="-.5" width="9" height="9" fill="url(#optic-grid)"/>${LASER.walls.map(([x, y]) => `<rect x="${x - 0.47}" y="${y - 0.47}" width=".94" height=".94" rx=".06" fill="#40505b"/>`).join("")}<path class="laser-beam" d="${beam.path.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ")}"/>${LASER.mirrors.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r=".38" fill="#243640" stroke="#52616b" stroke-width=".025"/><path d="M${x - 0.28} ${y + (angles[i] === 0 ? 0.28 : -0.28)}L${x + 0.28} ${y + (angles[i] === 0 ? -0.28 : 0.28)}" stroke="#d7e1e5" stroke-width=".09" stroke-linecap="round"/>`).join("")}<circle cx="0" cy="7" r=".21" fill="#e8ba76"/><path d="M-.1 6.9 L.12 7 L-.1 7.1" stroke="#1c2932" stroke-width=".05" fill="none"/><circle cx="8" cy="1" r=".3" fill="${beam.hit ? "#e8ba76" : "none"}" stroke="#e8ba76" stroke-width=".06"/><circle cx="8" cy="1" r=".12" fill="${beam.hit ? "#fff3d7" : "none"}" stroke="#e8ba76" stroke-width=".025"/>`;
      if (beam.hit && !solved) {
        solved = true;
        host.classList.add("solved");
        $$(".mirror-control").forEach((b) => (b.disabled = true));
        complete();
      }
    }
    LASER.mirrors.forEach(([x, y], i) => {
      const b = document.createElement("button");
      b.className = "mirror-control";
      b.setAttribute("aria-label", `Rotate mirror ${i + 1}`);
      b.style.left = `${((x + 0.5) / 9) * 100}%`;
      b.style.top = `${((y + 0.5) / 9) * 100}%`;
      b.onclick = () => {
        if (solved) return;
        angles[i] ^= 1;
        draw();
      };
      host.append(b);
    });
    draw();
  }
  function dictionary() {
    frame(
      '<p class="dictionary-clue"></p><div class="dictionary"></div><div id="lock"></div>',
    );
    const data = config.dictionary,
      answer = dictionaryPage(data);
    if (!answer) {
      unavailable($(".dictionary"));
      lock($("#lock"), null, complete);
      return;
    }
    $(".dictionary-clue").textContent = data.clue;
    let index = 0;
    $(".dictionary").innerHTML =
      '<nav class="dictionary-sections" aria-label="Alphabet sections"></nav><div class="dictionary-page"></div><ul class="dictionary-words"></ul><div class="dictionary-nav"><button id="previous" aria-label="Previous page">←</button><button id="forward" aria-label="Next page">→</button></div>';
    for (const [first, last] of [
      ["a", "e"],
      ["f", "j"],
      ["k", "o"],
      ["p", "t"],
      ["u", "z"],
    ]) {
      const page = data.pages.findIndex((p) =>
        p.words.some((w) => w[0] >= first && w[0] <= last),
      );
      if (page < 0) continue;
      const b = document.createElement("button");
      b.className = "quiet";
      b.textContent = `${first.toUpperCase()}–${last.toUpperCase()}`;
      b.onclick = () => {
        index = page;
        draw();
      };
      $(".dictionary-sections").append(b);
    }
    function draw() {
      const p = data.pages[index];
      $(".dictionary-page").textContent = `Page ${p.number}`;
      $(".dictionary-words").innerHTML = p.words
        .map((w) => `<li>${esc(w)}</li>`)
        .join("");
      $("#previous").disabled = index === 0;
      $("#forward").disabled = index === data.pages.length - 1;
    }
    $("#previous").onclick = () => {
      if (index > 0) index--;
      draw();
    };
    $("#forward").onclick = () => {
      if (index < data.pages.length - 1) index++;
      draw();
    };
    draw();
    lock($("#lock"), answer, complete);
  }
  function finish() {
    frame("");
    document.body.classList.remove("puzzle-only", "act-two");
    root.innerHTML = `<div class="eyebrow">Act two complete</div><h1>Act II</h1><section class="surface"><div id="symbol" class="symbol" aria-label="Revealed symbol">${esc(config.symbolB || "")}</div><p>Keep watch for clue. It may not be revealed yet.</p><div id="entry"><form><input aria-label="Code for Act Three" inputmode="text" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="${config.actThreeCode.length}" placeholder="${"·".repeat(config.actThreeCode.length)}" required><button class="primary">Unlock</button></form></div></section><div class="status" aria-live="polite" id="status"></div><div id="next"></div>`;
    let leaving = false;
    $("form").onsubmit = (event) => {
      event.preventDefault();
      if (leaving) return;
      if ($("input").value.trim().toLowerCase() !== config.actThreeCode) {
        report("Not quite. Try again.");
        return;
      }
      leaving = true;
      const destination = new URL(config.actThreeUrl, BASE).href;
      if (navigate) navigate(destination);
      else location.href = destination;
    };
  }
  function show() {
    [lights, jigsaw, weighing, audioRoom, bananas, laser, dictionary, finish][
      room
    ]();
  }
  show();
  return () => disposed();
}
if (
  document.querySelector("#app") &&
  !document.documentElement.hasAttribute("data-qa")
)
  mountActTwo(document.querySelector("#app"), content, {
    initialRoom: Number(document.documentElement.dataset.act2Room || 0),
    navigate: (url) => {
      location.href = url;
    },
  });
