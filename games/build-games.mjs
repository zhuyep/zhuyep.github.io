import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build,transform} from 'esbuild';

const hash=value=>createHash('sha256').update(value).digest('hex').slice(0,16);
const mime={'.svg':'image/svg+xml','.png':'image/png'};
export function joinClassicScripts(scripts){
 return scripts.map(({name,source})=>name==='vendor/jsonfn.min.js'?`(function(){${source}\n}).call(window);`:source).join('\n;\n');
}
export async function optimizeGames(out){
 const report=[];
 for(const game of ['hextris','0hh1']){
  const root=path.join(out,'games',game),entry=path.join(root,'index.html');
  let html=await readFile(entry,'utf8');
  await writeFile(path.join(root,'index.source.html'),html);
  // Keep the classic global scope and identifiers: the puzzle worker serializes
  // functions with toString(), while Hextris stores named functions in saves.
  const scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
  // Isolate JSONfn's strict directive from the game's later classic scripts.
  const js=joinClassicScripts(await Promise.all(scripts.map(async m=>({name:m[1],source:await readFile(path.join(root,m[1]),'utf8')}))));
  const {code}=await transform(js,{loader:'js',minifyWhitespace:true,minifyIdentifiers:false,minifySyntax:false,legalComments:'inline',target:'es2020'});
  const assets=path.join(root,'assets');await mkdir(assets,{recursive:true});
  const jsName=`game-${hash(code)}.js`;await writeFile(path.join(assets,jsName),code);
  html=html.replace(/<script\b[^>]*\bsrc="[^"]+"[^>]*><\/script>/g,'');
  // Defer until the full document is parsed; preserve the source script order.
  html=html.replace('</head>',`<script defer src="assets/${jsName}"></script>\n</head>`);
  const links=[...html.matchAll(/<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="([^"]+)")[^>]*>/g)];
  const css=await build({stdin:{contents:links.map(m=>`@import ${JSON.stringify('./'+m[1])};`).join('\n'),loader:'css',resolveDir:root},bundle:true,write:false,minify:true,loader:{'.png':'dataurl','.svg':'dataurl'}});
  const cssText=css.outputFiles[0].text,cssName=`game-${hash(cssText)}.css`;await writeFile(path.join(assets,cssName),cssText);
  html=html.replace(/<link\b(?=[^>]*\brel="stylesheet")[^>]*>/g,'').replace('</head>',`<link rel="stylesheet" href="assets/${cssName}">\n</head>`);
  // Small game icons are embedded so they do not add mobile network round trips.
  const images=[...html.matchAll(/\b(?:src|href)="([^"\n]+\.(?:svg|png))"/g)];
  for(const match of images){const bytes=await readFile(path.join(root,match[1]));html=html.replace(match[0],match[0].replace(match[1],`data:${mime[path.extname(match[1])]};base64,${bytes.toString('base64')}`));}
  await writeFile(entry,html);
  report.push({game,scriptsBefore:scripts.length,scriptsAfter:1,jsBytes:Buffer.byteLength(code),cssBytes:Buffer.byteLength(cssText)});
 }
 const buildSource=fileURLToPath(import.meta.url),buildTarget=path.resolve(out,'games/build-games.mjs');
 if(buildSource!==buildTarget)await cp(buildSource,buildTarget);
 await writeFile(path.join(out,'games/BUILD.md'),'# Rebuilding the optimized games\n\nOriginal licenses and editable JavaScript/CSS are served beside each game. `index.source.html` is its editable entry. `build-games.mjs` is the exact build script.\n\nWith Node.js and esbuild 0.28.1, place this directory at `dist/games`, restore each `index.source.html` to `index.html`, then run:\n\n```sh\nnpm install --no-save esbuild@0.28.1\nnode --input-type=module -e "import {optimizeGames} from \'./dist/games/build-games.mjs\'; await optimizeGames(\'dist\')"\n```\n');
 return report;
}
