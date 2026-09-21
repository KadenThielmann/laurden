# Laurden — Act 1

Ready-to-upload static website. No installation, build, or server-side code is needed.

## Host on GitHub Pages

1. Extract this ZIP.
2. Upload the extracted **contents** into your repository, with `index.html` at the repository root. Keep all page folders and `gingerbread.png`.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your branch (usually `main`) and **/(root)**, then save.
6. Open the website URL shown by GitHub after deployment completes.

GitHub's instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

Links support a project URL such as `https://yourname.github.io/your-repository/`, a custom domain, or placement in a subfolder. Keep the complete folder structure together.

If adding this to an existing Laurden.ca repository, place these files in a dedicated folder rather than overwriting your existing homepage. For example, putting them in `act-1/` makes the starting page `/act-1/`.

## Pages

| Folder        | Puzzle                                          |
| ------------- | ----------------------------------------------- |
| `/` or `key/` | Assemble the key and drag it onto the lock      |
| `photograph/` | Scratch the gingerbread photograph              |
| `bookshelf/`  | Arrange the book spines                         |
| `matching/`   | Match ten pairs                                 |
| `clock/`      | Drag the hands to 8:13 and hold for 0.4 seconds |
| `maze/`       | Trace the original maze to discover its digit   |
| `lock/`       | Five-digit deduction lock                       |
| `complete/`   | Symbol and Act 2 password                       |
| `act-2/`      | Minimal page saying “act 2”                     |
| `review/`     | Links to every Act 1 puzzle for testing         |

## Edit the files

- `config.js`: puzzle codes, symbol, photograph location, and Act 2 destination.
- `app.js`: puzzle interactions and progression.
- `style.css`: appearance and mobile layout.
- Each folder's `index.html`: page entrypoint.
- `gingerbread.png`: the photograph used in the scratch puzzle.

The Act 2 password is **cheese**. Its destination is `act-2/`.

The photograph's printed code is part of the image; change the image as well if changing that code. The bookshelf layout uses seven digits. The maze answer is `5` in the `maze()` function. The clock target is set in `clock()`.

This export includes the restored path-tracing maze, not the switch-and-gate experiment. The clock has no digital minute display. Matching cards use the ten supplied images, without visible names. Keep the `cards/` folder with the site. There are no third-party runtime dependencies.

## Preview locally

From this folder, run:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/` or `http://localhost:8000/review/`. Use a local web server rather than opening the HTML as a file.
