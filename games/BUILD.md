# Rebuilding the optimized games

Original licenses and editable JavaScript/CSS are served beside each game. `index.source.html` is its editable entry. `build-games.mjs` is the exact build script.

With Node.js and esbuild 0.28.1, place this directory at `dist/games`, restore each `index.source.html` to `index.html`, then run:

```sh
npm install --no-save esbuild@0.28.1
node --input-type=module -e "import {optimizeGames} from './dist/games/build-games.mjs'; await optimizeGames('dist')"
```
