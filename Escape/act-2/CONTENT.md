# Act 2 — owner setup

All seven puzzle rooms and Symbol B are configured. **Only the speech recording is missing.** Edit `content.js` to change the content. All paths are relative to `act-2/`.

## Add the recording

The room’s combination is **1055**, entered using four digit wheels: **1–0–5–5**.

Supply either:

- Normal forward speech: set `audio.forwardRecording` to `assets/your-recording.mp3`. The app reverses every decoded audio channel before playback.
- Speech already reversed: set `audio.backwardRecording` to `assets/your-backwards-recording.mp3`. The app plays that file unchanged. Leave the forward path null.

Reverse is the only control that plays the speech. Play always produces the same brief mechanical interference. There is no forward-playback control, transcript, answer caption or automatic decoding. Both paths are currently null; Reverse reports “Not yet available.” The correct combination works, but Lauren cannot discover it from this room until the recording is added.

## Included content and answers — spoilers

| Room                | Content / answer                                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lights + flashlight | Fixed solvable 5×5 board. All lights off reveals the dark room. The wall says **spooky** under the flashlight; enter it in the visible six-letter lock.                                  |
| Photo jigsaw        | Supplied portrait in **48 interlocking pieces**, 6×8. Three-piece paged tray, free movement, correct-location snapping. Every piece is required.                                         |
| Weighing            | Eight distinct objects; extract values in position order to obtain **68421937**. See the table below.                                                                                    |
| Playback            | **1055**. Recording is the sole missing asset.                                                                                                                                           |
| Bananagrams         | Freshly shuffled 21-letter starting hand, eight random one-tile PEEL additions. Complete with 29 tiles, or more after DUMP. All tiles must form one connected valid-word grid.                   |
| Laser               | Eight mirrors, one verified winning orientation. All 256 configurations were checked. Live target arrival completes the room.                                                            |
| Dictionary          | Fixed clue: “A word, phrase, or sequence that reads the same forwards and backwards.” Answer word: **palindrome**, on **page 230**. 285 words across 36 numbered pages, starting at 214. |
| Completion          | **☷**, Symbol B. Same ending layout as Act 1. Enter **crash** to open the Act III placeholder.                                                                                          |

### Encoded scale weights

The decimal point and gram unit are deliberately shown (`x.y g`). No in-game explanation reveals the value/order encoding.

| Object          | Scale display |
| --------------- | ------------- |
| Brass bell      | 2.4 g         |
| Feather         | 7.8 g         |
| Seashell        | 4.3 g         |
| Acorn           | 6.1 g         |
| Quartz          | 9.6 g         |
| Spool of thread | 1.5 g         |
| Copper coin     | 8.2 g         |
| Silver spoon    | 3.7 g         |

The object atlas is `assets/scale-objects.png`: four columns, two rows, with `sprite` indexes 0–7. An object can instead have an individual image path and no `sprite` property. Artwork is preloaded before objects become interactive. Drag or tap an object to weigh it; drag it off the pan or use Remove to return it.

### Bananagrams

The actual 144-tile English distribution is used. The entire bunch is shuffled anew each time the puzzle opens. The starting 21 letters and subsequent PEEL letters are drawn without replacement from that shuffled bunch. Every grid remains rearrangeable; previously valid words do not freeze. DUMP returns one loose tile and draws three, then reshuffles the remaining bunch, including the returned tile. Every newly owned tile must be used to finish.

`bananas.drawSequence` is null so no starting letters or PEEL sequence are fixed. Repeated letters remain possible according to the actual tile distribution.

The bundled 274,137-entry English word-game lexicon comes from `word-list` 4.1.0, based on the Atebits Words list. Its MIT notice is in `assets/WORD-LIST-LICENSE.txt`. Sources: https://github.com/sindresorhus/word-list and https://github.com/atebits/Words/blob/master/Words/en.txt. It is an English word-game lexicon, not a claim of a particular tournament dictionary edition. English loanwords can be valid; capitalizing a name does not make it valid.

### Dictionary

Only the fixed clue outside the dictionary contains a definition. Inside are words and page numbers only. Navigation is previous/next plus broad alphabet sections. Incorrect page numbers never alter the clue, highlight a word, or provide another hint. Editing the words automatically changes the answer to the page containing `target`; all entries must remain unique and alphabetically sorted, and page numbers must increase.

## Progression and hosting

Act 1's `cheese` gate opens the sibling `Escape/act-2/` via `../act-2/`. Each Act 2 room has a real `index.html` and URL: `act-2/`, `act-2/jigsaw/`, `act-2/weighing/`, `act-2/audio/`, `act-2/bananagrams/`, `act-2/mirrors/`, and `act-2/dictionary/`. Successful completion reveals Continue to the next page. The dictionary goes directly to `act-2/complete/`; entering `crash` there opens `act-3/`.

Puzzle state stays in memory while its page is open, matching Act 1. Reloading restarts the current puzzle, rather than the whole act. No new account or save architecture is used. Direct page access follows Act 1's static-page convention.

This is a static HTML/CSS/JavaScript site. Keep the complete folder structure when uploading to GitHub Pages; relative paths support a project subfolder or custom domain. No install or build is required for the download.

## Validation

The repository's rule tests and phone-sized browser checks cover the complete progression using the actual puzzle content, with a deterministic Bananagrams draw only in the development fixture so the automated solver is repeatable. A generated non-speech buffer substitutes for the missing recording in development tests only; it is never published. Audio intelligibility and final playback must be checked when the real file arrives.
