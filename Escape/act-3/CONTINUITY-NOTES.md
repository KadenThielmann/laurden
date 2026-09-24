# Acts 3 and 4 — presentation review

Only files within `act-3/` and `act-4/` were updated. Every Act 1, Act 2 and shared file remains byte-for-byte unchanged from the uploaded Escape.zip.

## Presentation and interactions

- Retained the original slate and gold palette, typography, rounded surfaces, combination locks, minimal puzzle framing and act completion headings.
- Matched Act 2's narrow-phone padding, lock spacing and responsive symbol sizing.
- Kept each puzzle's separate HTML page and relative URL. The existing Act 2 destination passes through `act-3temmp/`, whose existing redirect already opens Act 3.
- Continue links scroll into view after completion. Success and rejection responses remain restrained, including reduced-motion support.
- Pipe entrance/outlet markers align to their actual cells, and the released pipe configuration stays still.
- Cat cells retain usable size on narrow screens through contained horizontal scrolling; the board includes its essential placement rules.
- Torn-note images remain mounted during swaps, with Fit/Zoom controls for reading on phones.
- Disc controls no longer cause page-width overflow. The chain grab areas scale to a minimum 44-pixel diameter.
- The solved sliding photo remains visible briefly before Continue appears.
- Paint inputs reject blank or invalid percentages and retain an unsuccessful mixture for adjustment.
- The toy-bug journey finishes before its key can be used. The final symbol wall has one exit link and freezes when solved.
- Reformatted Act 3 and Act 4 HTML, JavaScript and CSS for editing.

## Validation

All 15 Act 3/4 pages rendered without page-level horizontal overflow at 320, 390, 768 and 1280 pixels. Browser checks exercised the authored pipe route, cat solution, discs and locks, note swapping and zoom, chain initial gate and unique length matches, sliding solution, phone keypad, paint mixture, gingerbread, handoff note, alcoves, toy bug, archive and final symbol sequence. Native pointer drags also placed all eight chain ends onto their matching hooks and enabled the lock. Incorrect codes and symbol sequences were rejected. The Act 2 crash gate and existing redirect were checked without editing either file.

## Still needed from the owner

The upload does not contain these Act 3 phone recordings. Place them in `act-3/assets/`, matching the filenames in `act-3/content.js`:

- `phone-greeting.mp3`
- `phone-reading.mp3`
- `phone-book.mp3`
- `phone-repeat.mp3`
- `phone-unrecognized.mp3`

The phone keypad and book-code gate work, but the spoken clue cannot play until those files are supplied. Failed playback now gives a brief connection message instead of exposing development filenames.

The final prize is still the explicit placeholder supplied in `act-4/content.js`. No replacement prize, codes, recordings or clue answers were invented.

All existing puzzle codes, authored content and rule validators were preserved.
