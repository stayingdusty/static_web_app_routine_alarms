import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('sharing shortens links and keeps QR generation local',()=>{
  assert.match(app,/import \{shortenUrl\} from '\.\/url-shortener\.js'/);
  assert.match(app,/async function shortRoutineShareUrl\(\).*await shortenUrl\(longUrl\)/);
  assert.match(app,/async function copyShareLink\(\).*shortRoutineShareUrl\(\)/);
  assert.match(app,/async function showQrPreview\(\).*shortRoutineShareUrl\(\)/);
  assert.match(app,/preview\.replaceChildren\(qrCanvas\(qrShareUrl\)\)/);
  assert.doesNotMatch(app,/api\.qrserver\.com/);
  assert.match(app,/document\.execCommand\('copy'\)/);
  assert.match(html,/id="qrPreview" role="img"/);
});

test('phone countdown stacks and idle positions remain horizontally centered',()=>{
  assert.match(css,/@media\(max-width:430px\)\{#run \.countdown-row\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(app,/const positions=\[\[50,20\],\[50,35\],\[50,50\],\[50,65\],\[50,80\]\]/);
  assert.match(css,/\.idle-glance\{[^}]*width:min\(calc\(100vw - 2rem\),34rem\)[^}]*max-width:calc\(100% - env\(safe-area-inset-left\)/);
});
