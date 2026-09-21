# Hextris — local mobile adaptation

Upstream: https://github.com/Hextris/hextris

Pinned upstream commit: `3f4847dc8fd7dab3d1c87e6324b9159d92fbd396` (`gh-pages`, verified 2026-09-05).

Original authors: Logan Engstrom, Garrett Finucane, Noah Moroze, Michael Yang. Copyright (C) 2018 Logan Engstrom, as stated in upstream README.

License: GNU GPL version 3 or, at your option, any later version. The complete upstream license is retained in `LICENSE.md`, and the original project README is retained in `README.md`. This modified game and its local additions are provided under the same license, without warranty. Editable source files remain served beside the game. The optimized entry uses a generated bundle; see the 2026-09-07 update below.

Modified on 2026-09-05 for a local pocket workbench:

- Retained the original Hextris falling-block, rotation, matching, scoring, difficulty and rendering mechanics, colors and local Exo fonts.
- Replaced the upstream entry page with a local-only page, Chinese hints, a semantic start/pause/resume/replay control and two 55px-tall rotation buttons.
- Preserved left/right canvas touch controls; scoped the upstream canvas input listeners to the canvas so that toolbar and source links do not also rotate the board.
- Added coarse-pointer / small-viewport recognition, visibility pausing, a mobile help dialog, source attribution and a local license link.
- Removed Google Analytics, advertising, the remote score submission, the remote `a.js` injection, social sharing, store promotion links, external Google fonts and the `visited` cookie. Runtime `connect-src 'none'` prevents outbound network connections. All loaded game code, fonts and images are local.
- Namespaced score/save keys as `pocket.hextris.highscores` and `pocket.hextris.saveState` to avoid collisions with other local games. Only game progress and local scores are saved.
- The upstream game has no audio subsystem. This local version loads no audio or media and starts silently.
- Replaced the Font Awesome play glyph with a native triangle to avoid an extra icon font dependency.

Entry: `index.html`. Recommended iframe height: **620px or more**; usable narrow layout is designed for widths from **320px**. The containing page should remove the iframe when leaving the game so its animation loop stops.

No package installation or upstream install/build scripts were run. No public deployment was performed.

## Validation

Verified in local Chromium with iPhone user-agent, touch input and device scale factor 2:

- 320 × 620 and 390 × 620 CSS pixels: no horizontal overflow, all resources load successfully, clear start state, 55px-tall left/right controls.
- Actual touch events start the game, rotate left and right via both explicit buttons and the corresponding canvas halves, and pause/resume the game.
- Chinese help and attribution/license dialogs open and close correctly.
- A natural 13-second session produced falling and landed blocks. The original simulation was then temporarily accelerated only in the browser test to reach game over; the local replay button started a new game and reset its score. The shipped speed/difficulty code was not changed.
- No browser page errors or failed asset responses. All runtime requests were to the local game server; there were no external requests during load, play, pause, help, game over or replay.
- Start, active play and game-over screenshots were visually inspected at phone widths.

This is browser touch emulation, not a physical iPhone/Safari test.

## 2026-09-07 mobile loading update

- Added parent-frame resource/preparation/ready messages and startup failure reporting.
- Uses locally installed system fonts through the existing Exo family alias, avoiding font downloads.
- Production combines scripts in original classic order, isolates JSONfn strict mode, bundles CSS, and embeds small icons. Original editable files and licenses remain available; see [entry source](index.source.html), [build script](../build-games.mjs), and [rebuild instructions](../BUILD.md).
- Hashed JS/CSS resources use versioned browser caching. Local development still uses individual scripts.
