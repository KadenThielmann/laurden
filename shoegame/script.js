const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwvUy21qDSO1miajUJQJKnfqDrwG0XnGJavFh6Tbp0QYizw_e3-EicTuSwt2Pc6aEaJ/exec";

let currentPin = "";
let pollTimer = null;
let lastGameState = null;
let isFetching = false;

// Format today's local date as YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format date nicely for the header (e.g. "Friday, Nov 6")
function formatHeaderDate() {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

function shoeEmoji(name) {
  return name === "Kaden" ? "👞" : "👠";
}

// =========================================================
// INITIALIZATION & PIN KEYPAD
// =========================================================
function init() {
  document.getElementById("date-display").innerText = formatHeaderDate();

  const savedPin = localStorage.getItem("shoeGamePin");
  if (!savedPin) {
    showScreen("pin-screen");
  } else {
    currentPin = savedPin;
    fetchGameState();
  }
}

function showScreen(screenId) {
  ["pin-screen", "loading-screen", "game-screen"].forEach((id) => {
    document.getElementById(id).classList.add("hidden");
  });
  document.getElementById(screenId).classList.remove("hidden");
}

function pressKey(digit) {
  if (isFetching) return;
  if (currentPin.length < 4) {
    currentPin += digit;
    document.getElementById("pin-error").classList.add("hidden");
    updatePinDots();

    if (currentPin.length === 4) {
      setTimeout(() => verifyAndSavePin(), 150);
    }
  }
}

function backspacePin() {
  if (isFetching) return;
  currentPin = currentPin.slice(0, -1);
  updatePinDots();
}

function clearPin() {
  if (isFetching) return;
  currentPin = "";
  updatePinDots();
}

function updatePinDots() {
  const dots = document.querySelectorAll("#pin-dots .dot");
  dots.forEach((dot, idx) => {
    dot.classList.toggle("filled", idx < currentPin.length);
  });
}

function verifyAndSavePin() {
  localStorage.setItem("shoeGamePin", currentPin);
  fetchGameState();
}

function logout() {
  stopPolling();
  isFetching = false;
  localStorage.removeItem("shoeGamePin");
  currentPin = "";
  updatePinDots();
  document.getElementById("player-pill").classList.add("hidden");
  showScreen("pin-screen");
}

// =========================================================
// NETWORK CALLS TO GOOGLE SHEETS
// =========================================================
async function fetchGameState(pick = null, silentPoll = false) {
  if (isFetching) return;
  isFetching = true;

  const spinnerEl = document.querySelector("#loading-screen .spinner");
  const loadingTextEl = document.getElementById("loading-text");

  if (!silentPoll) {
    showScreen("loading-screen");
    if (spinnerEl) spinnerEl.classList.remove("hidden");
    loadingTextEl.innerText = pick
      ? `Raising ${pick}'s shoe...`
      : "Loading today's question...";
  }

  const today = getTodayDateString();
  // Added &_t= timestamp so mobile browsers never cache auto-poll requests
  let url = `${SCRIPT_URL}?pin=${encodeURIComponent(currentPin)}&date=${encodeURIComponent(today)}&_t=${Date.now()}`;
  if (pick) {
    url += `&pick=${encodeURIComponent(pick)}`;
  }

  try {
    const res = await fetch(url, { redirect: "follow" });
    const data = await res.json();

    if (data.error) {
      stopPolling();
      if (data.error === "Invalid PIN") {
        localStorage.removeItem("shoeGamePin");
        currentPin = "";
        updatePinDots();
        document.getElementById("pin-error").classList.remove("hidden");
        showScreen("pin-screen");
        return;
      }
      if (spinnerEl) spinnerEl.classList.add("hidden");
      loadingTextEl.innerHTML = `${data.error}<br><br><button type="button" class="secondary-btn" onclick="logout()">Switch Player / Retry</button>`;
      return;
    }

    lastGameState = data;
    renderGame(data);
  } catch (err) {
    if (!silentPoll) {
      if (spinnerEl) spinnerEl.classList.add("hidden");
      loadingTextEl.innerHTML =
        `Could not connect to Google Sheet.<br><br><button type="button" class="secondary-btn" onclick="manualRefresh()">🔄 Try Again</button>`;
    }
  } finally {
    isFetching = false;
  }
}

function submitPick(choice) {
  fetchGameState(choice);
}

function manualRefresh() {
  fetchGameState(null, false);
}

// =========================================================
// UI RENDERING & AUTO-POLLING
// =========================================================
function renderGame(data) {
  showScreen("game-screen");

  // Show top-right player switch badge
  const pill = document.getElementById("player-pill");
  pill.classList.remove("hidden");
  document.getElementById("player-badge-name").innerText =
    `${shoeEmoji(data.player)} ${data.player}`;

  document.getElementById("question-text").innerText = data.question;

  const partnerName = data.player === "Kaden" ? "Lauren" : "Kaden";
  const bannerEl = document.getElementById("partner-status-banner");
  const choiceEl = document.getElementById("choice-area");
  const waitingEl = document.getElementById("waiting-area");
  const revealEl = document.getElementById("reveal-area");

  choiceEl.classList.add("hidden");
  waitingEl.classList.add("hidden");
  revealEl.classList.add("hidden");

  // STATE 1: Current player hasn't answered yet
  if (!data.myPick) {
    stopPolling();
    choiceEl.classList.remove("hidden");
    bannerEl.classList.remove("hidden");
    bannerEl.innerText = data.partnerHasPicked
      ? `👀 ${partnerName} has already locked in a shoe! Pick yours to reveal.`
      : `⏳ ${partnerName} hasn't picked yet today.`;
  }
  // STATE 2: Current player answered, waiting on partner
  else if (data.myPick && !data.partnerPick) {
    bannerEl.classList.add("hidden");
    waitingEl.classList.remove("hidden");
    document.getElementById("my-locked-shoe").innerText =
      `${shoeEmoji(data.myPick)} ${data.myPick}`;
    document.getElementById("waiting-text").innerText =
      `Waiting for ${partnerName} to raise a shoe... (Auto-checking every 10s)`;
    startPolling();
  }
  // STATE 3: Both answered -> Reveal!
  else {
    stopPolling();
    bannerEl.classList.add("hidden");
    revealEl.classList.remove("hidden");

    const matched = data.myPick === data.partnerPick;
    const matchBanner = document.getElementById("match-banner");
    matchBanner.className = "match-banner " + (matched ? "is-match" : "is-split");
    matchBanner.innerText = matched
      ? `🎉 It's a Match! You both raised ${data.myPick}'s shoe!`
      : `😂 Split Decision!`;

    document.getElementById("me-label").innerText = data.player;
    document.getElementById("my-reveal-emoji").innerText = shoeEmoji(data.myPick);
    document.getElementById("my-reveal-pick").innerText = data.myPick;

    document.getElementById("partner-label").innerText = partnerName;
    document.getElementById("partner-reveal-emoji").innerText = shoeEmoji(data.partnerPick);
    document.getElementById("partner-reveal-pick").innerText = data.partnerPick;
  }
}

function startPolling() {
  if (!pollTimer) {
    pollTimer = setInterval(() => {
      fetchGameState(null, true);
    }, 10000); // Silently checks every 10 seconds
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// =========================================================
// CLIPBOARD SHARE (LIKE LAURDLE)
// =========================================================
function shareResult() {
  if (!lastGameState) return;
  const d = lastGameState;
  const partnerName = d.player === "Kaden" ? "Lauren" : "Kaden";
  const matched = d.myPick === d.partnerPick;

  const text = [
    `👞 Laurden Shoe Game (${d.date}) 👠`,
    `"${d.question}"`,
    `${d.player}: ${shoeEmoji(d.myPick)} ${d.myPick}`,
    `${partnerName}: ${shoeEmoji(d.partnerPick)} ${d.partnerPick}`,
    matched ? "🎉 Match!" : "😂 Split Decision!"
  ].join("\n");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById("share-btn");
      btn.innerText = "✅ Copied to Clipboard!";
      setTimeout(() => {
        btn.innerText = "📋 Share Today's Result";
      }, 2000);
    });
  }
}

// Support physical keyboard typing on desktop too
document.addEventListener("keydown", (e) => {
  const pinScreenVisible = !document
    .getElementById("pin-screen")
    .classList.contains("hidden");
  if (!pinScreenVisible) return;

  if (e.key >= "0" && e.key <= "9") pressKey(e.key);
  if (e.key === "Backspace") backspacePin();
  if (e.key === "Escape") clearPin();
});

init();
