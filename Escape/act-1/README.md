# Laurden — Act 1

Act 1 is self-contained within `Escape/act-1/`, with shared styling in `../shared/style.css`. See [Escape setup](../README.md) for hosting and adding more acts.

## Pages

| Folder | Puzzle |
| --- | --- |
| `/` | Introduction and Begin Escape |
| `key/` | Assemble the key and drag it onto the lock |
| `photograph/` | Scratch the gingerbread photograph |
| `bookshelf/` | Arrange the book spines |
| `matching/` | Match ten pairs |
| `clock/` | Drag the hands to 8:13 and hold for 0.4 seconds |
| `maze/` | Trace the maze to discover its digit |
| `lock/` | Five-digit deduction lock |
| `complete/` | Symbol and Act 2 password |
| `review/` | Links to every Act 1 puzzle for testing |

## Editing

- `config.js`: puzzle codes, symbol, photograph location, and Act 2 destination.
- `app.js`: puzzle interactions and progression.
- `../shared/style.css`: shared appearance and mobile layout.
- Each folder's `index.html`: page entrypoint.
- `gingerbread.png` and `cards/`: Act 1 images.

The Act 2 password is **cheese**. Its destination is `../act-2/`, relative to the Act 1 script folder.

The photograph's printed code is part of the image; change the image as well if changing that code. The bookshelf layout uses seven digits. The maze answer is `5` in `maze()`. The clock target is set in `clock()`.

Run the local server from the repository root, then open `/Escape/act-1/review/` to check the puzzles. There are no third-party runtime dependencies.
