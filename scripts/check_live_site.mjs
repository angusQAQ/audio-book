import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const base = new URL(process.env.READING_SITE_URL || 'https://angusqaq.github.io/audio-book/');
const expected = readFileSync(new URL('../library.json', import.meta.url));
const expectedHash = createHash('sha256').update(expected).digest('hex');
const shippedFiles = [
  'index.html','app.js','styles.css','tokens.css','base.css','library.json',
  'assets/brand/diandian-logo.png','config/book-voices.json','docs/voxcpm.md',
  'books/little-wolf-your-turn/exports/小狼，換你說！_繪本.pdf',
  'books/little-wolf-your-turn/exports/小狼，換你說！_跨頁閱讀版.pdf',
  'books/little-wolf-your-turn/exports/小狼，換你說！_可編輯排版.pptx',
].map(path => ({
  path, hash: createHash('sha256').update(readFileSync(new URL('../' + path, import.meta.url))).digest('hex'),
}));
const book = JSON.parse(expected).books[0];
if (process.env.REQUIRE_EDGE === '1') {
  assert.equal(book.voice.name, 'zh-HK-HiuMaanNeural');
  assert.equal(book.voice.rate, '-12%');
}

// A successful push is insufficient: wait for the published library to match this commit.
let published = false;
for (let attempt = 0; attempt < 24; attempt++) {
  try {
    let matches = true;
    for (const file of shippedFiles) {
      const url = new URL(file.path, base);
      url.searchParams.set('verify', file.hash);
      const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
      if (!response.ok) { matches = false; break; }
      const hash = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
      if (hash !== file.hash) { matches = false; break; }
    }
    if (matches) { published = true; break; }
  } catch { /* The previous Pages deployment may still be serving. */ }
  if (attempt < 23) await new Promise(resolve => setTimeout(resolve, 10000));
}
assert.ok(published, 'Published library never matched the verified GitHub commit');

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base.href, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: book.title, exact: true }).waitFor();
  assert.equal(await page.locator('.pdf-link, .book-description, .library-footer').count(), 0);
  assert.ok(await page.locator('body').evaluate(body=>getComputedStyle(body).backgroundImage.includes('radial-gradient')));
  assert.ok(await page.locator('.brand-symbol img').evaluate(image => image.complete && image.naturalWidth > 0));
  const pdf = await page.request.get(new URL(book.source.url, base).href);
  assert.equal(pdf.status(), 200);
  assert.equal(createHash('sha256').update(await pdf.body()).digest('hex'), book.source.sha256);
  await page.getByRole('button', { name: `閱讀《${book.title}》`, exact: true }).click();
  assert.equal(await page.locator('.site-header').isVisible(), false);
  assert.ok((await page.locator('.reader-tools').boundingBox()).height <= 60);
  async function chooseMode(mode) {
    if (!(await page.locator('#mode-settings').evaluate(panel => panel.open))) {
      await page.locator('#mode-settings > summary').click();
    }
    await page.locator(`[data-mode="${mode}"]`).click();
  }
  await page.locator('#page-select').selectOption('3');
  await page.waitForFunction(() => window.readerDiagnostics().imageReady);
  for (const mode of ['sentence', 'word', 'character']) {
    await chooseMode(mode);
    await page.locator('.hotspot').first().click();
    await page.waitForFunction(() => {
      const state = window.readerDiagnostics();
      return state.engine === 'audio' && state.currentTime > 0 && state.glowCount > 0;
    });
    assert.ok(await page.locator('.reading-marker').count() > 0);
    assert.equal(await page.locator('.ink-glow').first().evaluate(node=>getComputedStyle(node).filter), 'none');
    assert.equal(await page.locator('#glow-layer').evaluate(node=>getComputedStyle(node).mixBlendMode), 'multiply');
    await page.locator('#stop').click();
  }
  await chooseMode('sentence');
  await page.locator('.hotspot').nth(2).click();
  await page.waitForFunction(() => window.readerDiagnostics().state === 'playing');
  await page.locator('#pause').click();
  await page.locator('#audio-seek').fill('50');
  await page.waitForFunction(() => {
    const state = window.readerDiagnostics();
    return state.currentTime / state.duration > 0.4 && state.currentTime / state.duration < 0.6;
  });
  assert.notEqual(await page.locator('#duration-time').textContent(), '0:00');
  await page.locator('#stop').click();
  await page.locator('#pause').click();
  await page.waitForFunction(() => window.readerDiagnostics().state === 'playing');
  await page.locator('#stop').click();
  // Seek inside two real word boundaries; the printed words must follow media time.
  await page.locator('#page-select').selectOption('1');
  await page.waitForFunction(() => window.readerDiagnostics().imageReady);
  const block = book.pages[0].blocks[4], asset = book.audio[block.audio];
  assert.equal(asset.timingSchema, 1);
  await page.locator('.hotspot').nth(4).click();
  await page.waitForFunction(() => window.readerDiagnostics().state === 'playing');
  await page.locator('#pause').click();
  for (const boundary of [asset.boundaries[0], asset.boundaries[Math.floor(asset.boundaries.length / 2)]]) {
    await page.locator('#audio-seek').fill(((boundary.time + Math.min(.03, boundary.duration / 3)) / asset.duration * 100).toFixed(1));
    await page.waitForFunction(text => window.readerDiagnostics().highlightedText === text, block.text.slice(boundary.start, boundary.end));
  }
  await page.locator('#stop').click();
  await page.locator('#next-page').click();
  await page.waitForFunction(() => window.readerDiagnostics().imageReady);
  assert.equal(await page.evaluate(() => window.readerDiagnostics().page), 2);
  assert.equal(await page.locator('.page-turn').count(), 0);
  await page.locator('#reader-back').click();
  await page.getByRole('button',{name:`封存《${book.title}》`,exact:true}).click();
  assert.equal(await page.locator(`[data-book-id="${book.id}"]`).count(), 0);
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-shelf="archived"]').click();
  await page.getByRole('button',{name:`恢復《${book.title}》`,exact:true}).click();
  await page.locator('[data-shelf="active"]').click();
  await page.getByRole('button',{name:`封存《${book.title}》`,exact:true}).waitFor();
  assert.equal(await page.locator(`[data-book-id="${book.id}"] .book-reading-link`).textContent(), '繼續第 2 頁');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log(`PASS: published library matches ${expectedHash.slice(0, 12)}; current code/theme/logo hashes, original PDF SHA256, all three MP3 modes, legible word-timed reading cues, audio controls, compact toolbar, page turns, reversible book archive and phone layout verified.`);
} finally {
  await browser.close();
}
