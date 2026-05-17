import { WORD_BANK } from './words.js';

// --- TEMPORARY MOBILE DEBUGGER ---
let headerClicks = 0;
document.querySelector('header h1').addEventListener('click', () => {
    headerClicks++;
    if (headerClicks === 15) {
        const currentData = localStorage.getItem('laurdle_stats');
        alert(currentData ? currentData : "Local Storage is completely empty.");
        headerClicks = 0; // Reset counter
    }
});

// --- SECRET STREAK REPAIR PROTOCOL ---
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('restoreLedger')) {
    const repairedStats = {
        played: 4,
        wins: 4,
        streak: 4,
        maxStreak: 4,
        lastDayIndex: 3, // Marks Day 4 (May 16) as officially completed
        // Index 3 = 4 guesses (2 times), Index 4 = 5 guesses (2 times)
        distribution: [0, 0, 0, 2, 2, 0] 
    };
    
    // Injecting the corrected history into her browser memory
    localStorage.setItem('laurdle_stats', JSON.stringify(repairedStats));
    
    // Instantly wipe the secret parameter from the URL bar so it stays invisible
    window.history.replaceState({}, document.title, window.location.pathname);
}

// 1. Precise Date Logic (Local Time)
const launchDate = new Date(2026, 4, 13); // May 13, 2026
const today = new Date();
today.setHours(0, 0, 0, 0);

const msInDay = 24 * 60 * 60 * 1000;
const dayIndex = Math.floor((today - launchDate) / msInDay);

const safeIndex = Math.max(0, dayIndex);
const dailyEntry = WORD_BANK[safeIndex % WORD_BANK.length];
const targetWord = dailyEntry.word.toUpperCase();
const wordLength = targetWord.length;

// 2. DOM Elements
const board = document.getElementById('board');
const keyboard = document.getElementById('keyboard');

// 3. State Variables
let currentRow = 0;
let currentGuess = "";
let guesses = [];
let isAnimating = false;

// 4. Initialize the Grid
function initBoard() {
    board.style.gridTemplateColumns = `repeat(${wordLength}, 1fr)`;
    for (let i = 0; i < 6 * wordLength; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.setAttribute('id', `tile-${i}`);
        board.appendChild(tile);
    }
}

// 5. Initialize the Keyboard
const keys = [
    'Q','W','E','R','T','Y','U','I','O','P',
    'A','S','D','F','G','H','J','K','L',
    'Enter', 'Z','X','C','V','B','N','M', 'Backspace'
];


// 6. Input Handling
function handleKeyPress(key) {
    // LOCK: Ignore input if animating OR if the result overlay is already visible
    const isModalVisible = !document.getElementById('modal').classList.contains('hidden');
    if (isAnimating || isModalVisible) return;

    if (key === 'Backspace') {
        if (currentGuess.length > 0) {
            const tileIndex = (currentRow * wordLength) + currentGuess.length - 1;
            const tile = document.getElementById(`tile-${tileIndex}`);
            tile.innerText = "";
            currentGuess = currentGuess.slice(0, -1);
            saveGameState();
        }
    } else if (key === 'Enter') {
        if (currentGuess.length === wordLength) {
            checkGuess();
        } else {
            // Word isn't long enough!
            shakeRow();
        }
    } else if (currentGuess.length < wordLength && key.length === 1) {
        const tileIndex = (currentRow * wordLength) + currentGuess.length;
        const tile = document.getElementById(`tile-${tileIndex}`);
        tile.innerText = key;
        currentGuess += key;
        saveGameState();
    }
}

window.addEventListener('keydown', (e) => {
    const key = e.key === 'Enter' ? 'Enter' : e.key === 'Backspace' ? 'Backspace' : e.key.toUpperCase();
    if (keys.includes(key)) handleKeyPress(key);
});

function shakeRow() {
    const start = currentRow * wordLength;
    for (let i = 0; i < wordLength; i++) {
        const tile = document.getElementById(`tile-${start + i}`);
        if (tile) {
            // Remove it first just in case it was already there
            tile.classList.remove('shake');
            
            // Trigger a "reflow" so the browser recognizes the class being added again
            void tile.offsetWidth; 
            
            tile.classList.add('shake');
            
            // Clean up after the animation ends
            setTimeout(() => {
                tile.classList.remove('shake');
            }, 500);
        }
    }
}

// 7. Core Game Logic
function checkGuess() {
    isAnimating = true;
    guesses.push(currentGuess);
    
    const guessArray = currentGuess.split("");
    const targetArray = targetWord.split("");
    const rowTiles = [];

    for (let i = 0; i < wordLength; i++) {
        rowTiles.push(document.getElementById(`tile-${(currentRow * wordLength) + i}`));
    }

    const rowResult = new Array(wordLength).fill('absent');
    const targetLetterCount = {};
    targetArray.forEach(l => targetLetterCount[l] = (targetLetterCount[l] || 0) + 1);

    // Pass 1: Correct (Green)
    guessArray.forEach((letter, i) => {
        if (letter === targetArray[i]) {
            rowResult[i] = 'correct';
            targetLetterCount[letter]--;
        }
    });

    // Pass 2: Present (Yellow)
    guessArray.forEach((letter, i) => {
        if (rowResult[i] !== 'correct' && targetArray.includes(letter) && targetLetterCount[letter] > 0) {
            rowResult[i] = 'present';
            targetLetterCount[letter]--;
        }
    });

    // Reveal Animation Loop
    rowResult.forEach((status, i) => {
        setTimeout(() => {
            const tile = rowTiles[i];
            tile.classList.add('flip');
            setTimeout(() => {
                tile.classList.add(status);
                updateKeyboard(guessArray[i], status);
            }, 300);
        }, i * 250);
    });

    const totalWaitTime = (wordLength * 250) + 700;

    // Handle Win/Loss/Next Row after reveal
    setTimeout(() => {
        if (currentGuess === targetWord) {
            // --- THE BOUNCE WAVE ---
            rowTiles.forEach((tile, i) => {
                setTimeout(() => {
                    // 1. Remove previous animation classes
                    tile.classList.remove('flip', 'pop');
                    
                    // 2. Force a 'reflow' (Audit the element's state)
                    void tile.offsetWidth;
                    
                    // 3. Add the bounce
                    tile.classList.add('bounce');
                }, i * 100); 
            });

            // Delay the modal so the bounce can finish
            setTimeout(() => {
                currentGuess = ""; 
                showModal(true);
                saveGameState(); 
            }, 1000);

        } else if (currentRow === 5) {
            currentGuess = "";
            showModal(false);
            saveGameState(); 
        } else {
            currentRow++;
            currentGuess = "";
            isAnimating = false;
            saveGameState(); 
        }
    }, totalWaitTime);
}

function updateKeyboard(letter, status) {
    const key = document.querySelector(`button[data-key="${letter}"]`);
    if (!key || key.classList.contains('correct')) return;
    key.classList.remove('present', 'absent');
    key.classList.add(status);
}

// 8. Statistics & Persistence
function updateStats(isWin) {
    let stats = JSON.parse(localStorage.getItem('laurdle_stats')) || {
        played: 0, 
        wins: 0, 
        streak: 0, 
        maxStreak: 0, 
        lastDayIndex: -1,
        distribution: [0, 0, 0, 0, 0, 0] // Added this entry
    };

    // Safety: If someone has old stats without a distribution, initialize it
    if (!stats.distribution) stats.distribution = [0, 0, 0, 0, 0, 0];

    if (stats.lastDayIndex === dayIndex) return stats;

    stats.played++;
    if (isWin) {
        stats.wins++;
        stats.streak++;
        if (stats.streak > stats.maxStreak) stats.maxStreak = stats.streak;
        
        // Record which row the win happened on (0-5)
        stats.distribution[currentRow]++;
    } else {
        stats.streak = 0;
    }

    stats.lastDayIndex = dayIndex;
    localStorage.setItem('laurdle_stats', JSON.stringify(stats));
    return stats;
}

function saveGameState() {
    const state = {
        dayIndex: dayIndex,
        guesses: guesses,
        currentInput: currentGuess,
        isFinished: !document.getElementById('modal').classList.contains('hidden')
    };
    localStorage.setItem('laurdle_state', JSON.stringify(state));
}

function loadGameState() {
    const saved = JSON.parse(localStorage.getItem('laurdle_state'));
    if (!saved || saved.dayIndex !== dayIndex) {
        localStorage.removeItem('laurdle_state');
        return;
    }

    guesses = saved.guesses || [];
    guesses.forEach((guess, r) => {
        const rowTiles = [];
        for (let i = 0; i < wordLength; i++) {
            const tile = document.getElementById(`tile-${(r * wordLength) + i}`);
            tile.innerText = guess[i];
            rowTiles.push(tile);
        }
        applyStaticColors(guess, rowTiles);
    });

    currentRow = guesses.length;

    // FIX: Only restore current typing if the game ISN'T finished 
    // and we haven't run out of rows (currentRow < 6)
    if (!saved.isFinished && currentRow < 6) {
        currentGuess = saved.currentInput || "";
        for (let i = 0; i < currentGuess.length; i++) {
            const tile = document.getElementById(`tile-${(currentRow * wordLength) + i}`);
            if (tile) tile.innerText = currentGuess[i];
        }
    } else {
        // If the game is over, ensure the input is empty so it doesn't 
        // "ghost" into the next row
        currentGuess = "";
    }

    if (saved.isFinished) {
        isAnimating = true; 
        setTimeout(() => {
            const lastGuess = guesses[guesses.length - 1];
            showModal(lastGuess === targetWord);
        }, 500);
    }
}

function applyStaticColors(guess, tiles) {
    const targetArr = targetWord.split("");
    const guessArr = guess.split("");
    const results = new Array(wordLength).fill('absent');
    const counts = {};
    targetArr.forEach(l => counts[l] = (counts[l] || 0) + 1);

    guessArr.forEach((l, i) => {
        if (l === targetArr[i]) { results[i] = 'correct'; counts[l]--; }
    });
    guessArr.forEach((l, i) => {
        if (results[i] !== 'correct' && targetArr.includes(l) && counts[l] > 0) {
            results[i] = 'present'; counts[l]--;
        }
    });

    results.forEach((status, i) => {
        tiles[i].classList.add(status);
        updateKeyboard(guessArr[i], status);
    });
}

// --- UPDATED KEYBOARD WITH ICONS ---
function initKeyboard() {
    keyboard.innerHTML = ''; 
    
    // Define the three rows precisely
    const row1 = ['Q','W','E','R','T','Y','U','I','O','P'];
    const row2 = ['A','S','D','F','G','H','J','K','L'];
    const row3 = ['Enter', 'Z','X','C','V','B','N','M', 'Backspace'];
    
    const layout = [row1, row2, row3];

    layout.forEach(rowKeys => {
        const rowElement = document.createElement('div');
        rowElement.classList.add('keyboard-row');
        
        rowKeys.forEach(key => {
            const button = document.createElement('button');
            
            if (key === 'Backspace') {
                button.innerHTML = '⌫'; 
                button.style.fontSize = '1.2rem';
            } else if (key === 'Enter') {
                button.innerHTML = 'ENTER';
            } else {
                button.innerText = key;
            }

            button.setAttribute('data-key', key);
            button.addEventListener('click', () => handleKeyPress(key));
            rowElement.appendChild(button);
        });
        
        keyboard.appendChild(rowElement);
    });
}

// --- FINAL SHOWMODAL WITH Z-INDEX & EMOJI GRID ---
function showModal(isWin) {
    const modal = document.getElementById('modal');
    const stats = updateStats(isWin);

    if (isWin) {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#538d4e', '#b59f3b', '#ffffff'],
            zIndex: 1001 
        });
    }

    document.getElementById('modal-title').innerText = isWin ? "You got it!" : "Maybe tomorrow!";
    // Calculate the chart data
    const maxDist = Math.max(...stats.distribution, 1); // Avoid division by zero
    let chartHTML = `<h3 style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin: 20px 0 10px 0;">Guess Distribution</h3>
                     <div style="text-align: left; padding: 0 10px;">`;

                     stats.distribution.forEach((count, i) => {
                        const barWidth = Math.max(7, (count / maxDist) * 100); 
                        
                        // FIX: Highlight the bar matching the LAST guess index (guesses.length - 1)
                        const winIndex = guesses.length - 1;
                        const barColor = (isWin && i === winIndex) ? 'var(--correct)' : '#3a3a3c';
                        
                        chartHTML += `
                            <div style="display: flex; align-items: center; margin-bottom: 4px; font-family: sans-serif; font-size: 0.8rem; font-weight: bold;">
                                <div style="width: 12px;">${i + 1}</div>
                                <div style="background: ${barColor}; width: ${barWidth}%; height: 20px; margin-left: 8px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; border-radius: 2px; color: white;">
                                    ${count}
                                </div>
                            </div>`;
                    });
    chartHTML += `</div>`;

    document.getElementById('modal-title').innerText = isWin ? "You got it!" : "Maybe tomorrow!";
    document.getElementById('modal-message').innerHTML = `
        <div style="margin-bottom: 25px;">
            <p style="font-size: 1.2rem; margin-bottom: 10px;">The word was <strong>${targetWord}</strong></p>
            <p style="font-style: italic; color: #aaa; line-height: 1.4;">"${dailyEntry.message}"</p>
        </div>
        
        <h3 style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 15px;">Statistics</h3>
        <div style="display: flex; justify-content: space-around; text-align: center; margin-bottom: 10px;">
            <div><div style="font-size: 1.8rem; font-weight: bold;">${stats.played}</div><div style="font-size: 0.6rem;">PLAYED</div></div>
            <div><div style="font-size: 1.8rem; font-weight: bold;">${Math.round((stats.wins/stats.played)*100)||0}</div><div style="font-size: 0.6rem;">WIN %</div></div>
            <div><div style="font-size: 1.8rem; font-weight: bold;">${stats.streak}</div><div style="font-size: 0.6rem;">STREAK</div></div>
        </div>

        ${chartHTML}
        <div style="margin: 20px 0; border-top: 1px solid #3a3a3c; padding-top: 15px;">
    <p style="font-size: 0.7rem; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">Next Laurdle In</p>
    <div id="next-word-timer" style="font-size: 1.5rem; font-weight: bold;">--:--:--</div>
</div>
        <button id="share-btn" style="background-color: var(--correct); color: white; border: none; padding: 14px; border-radius: 4px; font-weight: bold; cursor: pointer; width: 100%; margin-top: 20px;">SHARE RESULT 📋</button>
    `;

    document.getElementById('share-btn').addEventListener('click', () => {
        const score = isWin ? guesses.length : 'X';
        const emojis = getEmojiGrid();
        const text = `Laurdle #${dayIndex + 1} ${score}/6\n\n${emojis}\nlaurden.ca`;
        navigator.clipboard.writeText(text);
        document.getElementById('share-btn').innerText = "COPIED TO CLIPBOARD!";
    });

    modal.classList.remove('hidden');
    saveGameState(); 
}

// --- HELPER FUNCTION (Ensure this is only here ONCE) ---
function getEmojiGrid() {
    const emojiMap = { 'correct': '🟩', 'present': '🟨', 'absent': '⬛' };
    let gridString = "";
    guesses.forEach(guess => {
        const targetArr = targetWord.split("");
        const guessArr = guess.split("");
        const rowResult = new Array(wordLength).fill('absent');
        const counts = {};
        targetArr.forEach(l => counts[l] = (counts[l] || 0) + 1);
        guessArr.forEach((l, i) => {
            if (l === targetArr[i]) { rowResult[i] = 'correct'; counts[l]--; }
        });
        guessArr.forEach((l, i) => {
            if (rowResult[i] !== 'correct' && targetArr.includes(l) && counts[l] > 0) {
                rowResult[i] = 'present'; counts[l]--;
            }
        });
        gridString += rowResult.map(status => emojiMap[status]).join("") + "\n";
    });
    return gridString;
}

function updateCountdown() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const timerElem = document.getElementById('next-word-timer');
    if (timerElem) {
        timerElem.innerText = `${hours}h ${minutes}m ${seconds}s`;
    }
}
// Run it every second
setInterval(updateCountdown, 1000);

// 9. Startup
initBoard();
initKeyboard();
loadGameState();