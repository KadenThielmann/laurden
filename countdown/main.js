// August 13, 2027 at 4:00 PM Eastern Daylight Time (UTC-4) = 20:00:00 UTC
const WEDDING_TARGET_UTC = Date.UTC(2027, 7, 13, 20, 0, 0);

const MILESTONES = [
  {
    id: "one-year",
    title: "1 year",
    subtitle: "August 13, 2026",
    // August 13, 2026 at 4:00 PM EDT (UTC-4)
    timestamp: Date.UTC(2026, 7, 13, 20, 0, 0)
  },
  {
    id: "engagement",
    isMysteryEngagement: true,
    icon: "💍",
    title: "???",
    subtitle: "",
    revealed: false
    // When ready to reveal:
    // revealed: true,
    // title: "Engaged",
    // subtitle: "October 18, 2026",
    // timestamp: Date.UTC(2026, 9, 18, 20, 0, 0)
  },
  {
    id: "christmas-2026",
    icon: "🎄",
    title: "Christmas",
    subtitle: "December 25, 2026",
    // End of day Dec 25 EST (UTC-5) -> Dec 26 05:00:00 UTC
    timestamp: Date.UTC(2026, 11, 26, 5, 0, 0)
  },
  {
    id: "6-months",
    title: "6 months",
    subtitle: "February 13, 2027",
    // Feb 13, 2027 EST (UTC-5)
    timestamp: Date.UTC(2027, 1, 14, 5, 0, 0)
  },
  {
    id: "100-days",
    title: "100 days",
    subtitle: "May 5, 2027",
    // May 5, 2027 EDT (UTC-4)
    timestamp: Date.UTC(2027, 4, 6, 4, 0, 0)
  },
  {
    id: "30-days",
    title: "30 days",
    subtitle: "July 14, 2027",
    // July 14, 2027 EDT (UTC-4)
    timestamp: Date.UTC(2027, 6, 15, 4, 0, 0)
  },
  {
    id: "1-week",
    title: "1 week",
    subtitle: "August 6, 2027",
    // August 6, 2027 EDT (UTC-4)
    timestamp: Date.UTC(2027, 7, 7, 4, 0, 0)
  },
  {
    id: "wedding-day",
    isDestination: true,
    icon: "❤️",
    title: "August 13, 2027",
    subtitle: "",
    timestamp: WEDDING_TARGET_UTC
  }
];

const daysEl = document.getElementById("days-val");
const hmsEl = document.getElementById("hms-val");
let lastSec = -1;

function padZero(num) {
  return num < 10 ? "0" + num : String(num);
}

function tick() {
  const now = Date.now();
  const diffMs = WEDDING_TARGET_UTC - now;

  if (diffMs <= 0) {
    daysEl.textContent = "0";
    hmsEl.textContent = "00 : 00 : 00";
    return;
  }

  const totalSeconds = Math.floor(diffMs / 1000);

  if (totalSeconds !== lastSec) {
    lastSec = totalSeconds;
    const days = Math.floor(totalSeconds / 86400);
    const rem = totalSeconds % 86400;
    const hours = Math.floor(rem / 3600);
    const minutes = Math.floor((rem % 3600) / 60);
    const seconds = rem % 60;

    daysEl.textContent = days.toLocaleString();
    hmsEl.textContent = `${padZero(hours)} : ${padZero(minutes)} : ${padZero(seconds)}`;
  }

  requestAnimationFrame(tick);
}

function renderTimeline() {
  const list = document.getElementById("milestones-list");
  list.innerHTML = "";
  const now = Date.now();
  let hasHighlightedNext = false;

  MILESTONES.forEach((item) => {
    const li = document.createElement("li");
    li.className = "milestone";

    let isPassed = false;
    let isUpcoming = false;

    if (item.isMysteryEngagement && !item.revealed) {
      isPassed = false;
      if (!hasHighlightedNext) {
        isUpcoming = true;
        hasHighlightedNext = true;
      }
    } else if (item.timestamp) {
      if (now >= item.timestamp) {
        isPassed = true;
      } else if (!hasHighlightedNext) {
        isUpcoming = true;
        hasHighlightedNext = true;
      }
    }

    if (item.isDestination) {
      li.classList.add("destination");
    } else if (isPassed) {
      li.classList.add("passed");
    } else if (isUpcoming) {
      li.classList.add("upcoming");
    }

    const marker = document.createElement("div");
    marker.className = "milestone-marker";
    const dot = document.createElement("div");
    dot.className = "marker-dot";
    marker.appendChild(dot);

    const content = document.createElement("div");
    content.className = "milestone-content";

    const title = document.createElement("div");
    title.className = "milestone-title";
    if (item.icon) {
      const iconSpan = document.createElement("span");
      iconSpan.textContent = item.icon;
      title.appendChild(iconSpan);
    }
    const textSpan = document.createElement("span");
    textSpan.textContent = item.title;
    title.appendChild(textSpan);
    content.appendChild(title);

    if (item.subtitle) {
      const sub = document.createElement("div");
      sub.className = "milestone-date";
      sub.textContent = item.subtitle;
      content.appendChild(sub);
    }

    li.appendChild(marker);
    li.appendChild(content);
    list.appendChild(li);
  });
}

renderTimeline();
requestAnimationFrame(tick);