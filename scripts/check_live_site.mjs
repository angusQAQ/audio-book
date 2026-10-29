import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const base = new URL(process.env.READING_SITE_URL || 'https://angusqaq.github.io/audio-book/');
const expected = readFileSync(new URL('../library.json', import.meta.url));
const expectedHash = createHash('sha256').update(expected).digest('hex');
const book = JSON.parse(expected).books[0];
if (process.env.REQUIRE_EDGE === '1') {
  assert.equal(book.voice.name, 'zh-HK-HiuMaanNeural');
  assert.equal(book.voice.rate, '-12%');
}

// A successful push is insufficient: wait for the published library to match this commit.
let published = false;
for (let attempt = 0; attempt < 24; attempt++) {
  try {
    const url = new URL('library.json', base);
    url.searchParams.set('verify', expectedHash);
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    if (response.ok) {
      const hash = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
      if (hash === expectedHash) { published = true; break; }
    }
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
  const pdf = await page.request.get(new URL(book.source.url, base).href);
  assert.equal(pdf.status(), 200);
  assert.equal(createHash('sha256').update(await pdf.body()).digest('hex'), book.source.sha256);
  await page.getByRole('button', { name: `閱讀《${book.title}》`, exact: true }).click();
  await page.locator('#page-select').selectOption('3');
  await page.waitForFunction(() => window.readerDiagnostics().imageReady);
  for (const mode of ['sentence', 'word', 'character']) {
    await page.locator(`[data-mode="${mode}"]`).click();
    await page.locator('.hotspot').first().click();
    await page.waitForFunction(() => {
      const state = window.readerDiagnostics();
      return state.engine === 'audio' && state.currentTime > 0 && state.glowCount > 0;
    });
    await page.locator('#stop').click();
  }
  await page.locator('#next-page').click();
  assert.equal(await page.evaluate(() => window.readerDiagnostics().page), 4);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log(`PASS: published library matches ${expectedHash.slice(0, 12)}; original PDF SHA256, all three MP3 point-reading modes, glyph glow, page navigation and phone layout verified.`);
} finally {
  await browser.close();
}
