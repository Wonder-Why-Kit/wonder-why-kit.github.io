# Wonder Why Kit

Website: https://wonder-why-kit.github.io/

Repository: https://github.com/Wonder-Why-Kit/wonder-why-kit.github.io

**Open. Play. Wonder.**

_For every child who wonders._

Physical kits come first: carefully curated materials for children to hold, share and explore. The website, browser activities and videos are supporting companions; most play should happen with the kit in the physical world. Engagement and joy come first; understanding grows from noticing, changing things and playing again.

Chosen domain: **wonderwhykit.org** (registration and hosting setup are still to be confirmed). See [brand and voice](docs/BRAND.md) for wording shared across pages, kits and videos.

A growing collection of browser activities for ages 8–12. Each activity has its own stable URL, tutor notes and a place for one or more companion YouTube videos.

## Helicopter Seeds

Change the breeze, wing size and seed weight in a 3D garden. Compare light and heavy seeds, watch autorotation in slow motion, and help seeds find growing space beyond a fence. Peck and Dot provide comic reactions.

- Ten seeds per round; default breeze 70%, playback 1×.
- Manual settings, light/heavy pairs, and autoplay with changing wind and comparison pairs.
- Models and illustrations are created in code. No image asset pipeline is required.
- [For tutors](site/tutors.html) explains the concepts, prompts and limits of the model.

- [Mechanics reference](helicopter-seeds/MECHANICS.md) maps the physics, character behaviour and code change points.

## Run locally

Requires Node.js 22 or later. Python 3 is used only for the convenient local server command.

```sh
npm ci
npm run check
npm run build
npm run serve
```

Open `http://localhost:8000/`, then select Helicopter Seeds. Use the published build rather than opening files directly: browser modules need an HTTP server. The game loads pinned Three.js 0.180.0 from jsDelivr, so an internet connection and WebGL support are required. If that load fails, explanations remain readable and a message appears in the game.

## Project layout

```text
site/                           Homepage, About page, styles and illustration
worlds.json                     Collection catalogue and YouTube metadata
helicopter-seeds/index.html      Public game and explanatory content
helicopter-seeds/styles.css      Responsive layout and appearance
helicopter-seeds/src/game.js     Scene, controls, round flow and animation
helicopter-seeds/src/simulation.js  Shared terrain and descent rules
site/tutors.html    Concepts and facilitation guide
helicopter-seeds/MECHANICS.md     Physics and character behaviour reference
scripts/build.mjs               Explicit publishing allowlist; produces dist/
tests/                          Automated model checks
.github/workflows/              Checks and manually triggered Pages deployment
```

**The maintained public version is `helicopter-seeds/index.html` and its companion source files.** Prototype snapshots and earlier source recording/design files have been removed. Use Git commits and release tags to preserve future milestones.

## Add another world or video

Add a folder using a stable, lowercase hyphenated slug. Follow the source layout above, add tutor notes, and register it in `worlds.json`. Update the build allowlist if a new world needs additional files. Relative links work under both a custom domain and a GitHub project subpath.

Each world's `videos` array accepts multiple entries:

```json
{ "youtubeId": "11-character ID", "title": "A descriptive video title" }
```

Use an actual 11-character YouTube ID. The build adds ordinary video links below the activity; it does not load a YouTube player or cookies before a visitor chooses to leave the site. No video is linked yet. See [publishing](docs/PUBLISHING.md) for the page/video release checklist.

## Quality and contributions

Run `npm run check` and `npm run build` before a pull request. Use `npm run format` to apply the formatter. See [CONTRIBUTING.md](CONTRIBUTING.md) for scope and review expectations, and [accessibility and privacy](site/privacy.html) for current limitations.

Automated checks cover descent relationships and ground geometry; they are not a substitute for a real browser, touch-device and child play-test. Current visual approval comes from iterative user review of the prototype. The reorganised public version still needs its release smoke test.

## Licensing and credits

A licence for the project's original code/content has **not yet been selected**. Public visibility does not itself grant reuse rights; choose the intended terms before announcing it as open source. [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) records the runtime dependency and asset provenance. The source recording and design documents are not included in this project.
