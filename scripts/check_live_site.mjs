import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { verifyPublishedFile } from './verify_published_file.mjs';

const base = new URL(process.env.READING_SITE_URL || 'https://angusqaq.github.io/audio-book/');
const expected = readFileSync(new URL('../library.json', import.meta.url));
const expectedHash = createHash('sha256').update(expected).digest('hex');
const narratorReview=JSON.parse(readFileSync(new URL('../voice-review/mei-school/review-manifest.json',import.meta.url)));
const shippedFiles = [
  'index.html','app.js','styles.css','tokens.css','base.css','library.json',
  'assets/brand/diandian-logo.png','config/book-voices.json','docs/voxcpm.md',
  'downloads/children-picture-book-skill.zip',
  'config/cantonese-pronunciation.json','config/voxcpm-reference.json',
  'reports/cantonese/cuhk-lookup.json','reports/cantonese/cuhk-variants.json',
  'voice-review/mei-school/review-manifest.json','downloads/voxcpm-narrator-review.zip',
  'assets/voice-references/mei-school/candidate-02.wav','reports/cantonese/critical-reading-plan.json',
  ...narratorReview.samples.map(sample=>sample.file),
  'books/little-wolf-your-turn/exports/小狼，換你說！_繪本.pdf',
  'books/little-wolf-your-turn/exports/小狼，換你說！_跨頁閱讀版.pdf',
  'books/little-wolf-your-turn/exports/小狼，換你說！_可編輯排版.pptx',
  'books/lets-find-that-cloud/exports/走！去找那朵雲_繪本.pdf',
  'books/lets-find-that-cloud/exports/走！去找那朵雲_跨頁閱讀版.pdf',
  'books/lets-find-that-cloud/exports/走！去找那朵雲_可編輯排版.pptx',
].map(path => ({
  path, hash: createHash('sha256').update(readFileSync(new URL('../' + path, import.meta.url))).digest('hex'),
}));
const library = JSON.parse(expected);
const book = library.books[0];
const wolf = library.books.find(item=>item.id==='little-wolf-your-turn');
const cloud = library.books.find(item=>item.id==='lets-find-that-cloud');
assert.ok(cloud, 'The cloud picture book has not completed audio registration');
assert.ok(wolf, 'The new picture book has not completed audio registration');
if (process.env.REQUIRE_EDGE === '1') {
  for (const item of library.books) {
    assert.equal(item.voice.name, 'zh-HK-HiuMaanNeural');
    assert.equal(item.voice.rate, '-12%');
  }
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
let verificationPage;
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  verificationPage=page;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base.href, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: book.title, exact: true }).waitFor();
  await page.getByRole('heading', { name: wolf.title, exact: true }).waitFor();
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
  // Verify both original picture books against exact PDF pages and real MP3 on production.
  for (const illustrated of [wolf, cloud]) {
    const illustratedPdf = await page.request.get(new URL(illustrated.source.url,base).href);
    assert.equal(createHash('sha256').update(await illustratedPdf.body()).digest('hex'), illustrated.source.sha256);
    await page.getByRole('button',{name:`閱讀《${illustrated.title}》`,exact:true}).click();
    await page.waitForFunction(()=>window.readerDiagnostics().imageReady);
    await page.locator('#next-page').click();
    await page.waitForFunction(()=>window.readerDiagnostics().page===2 && window.readerDiagnostics().imageReady);
    assert.equal(await page.locator('#page-image').getAttribute('src'),illustrated.pages[1].image);
    assert.equal(await page.locator('.page-turn').count(),0);
    await page.setViewportSize({width:1111,height:730});
    await page.locator('#previous-side').click();
    await page.waitForFunction(()=>window.readerDiagnostics().page===1 && window.readerDiagnostics().imageReady);
    await page.locator('#next-side').click();
    await page.waitForFunction(()=>window.readerDiagnostics().page===2 && window.readerDiagnostics().imageReady);
    await page.setViewportSize({width:390,height:844});
    await page.locator('#page-select').selectOption('3');
    await page.waitForFunction(()=>window.readerDiagnostics().imageReady);
    for (const mode of ['sentence','word','character']) {
      await chooseMode(mode);await page.locator('.hotspot').first().click();
      await page.waitForFunction(()=>window.readerDiagnostics().engine==='audio' && window.readerDiagnostics().currentTime>0 && window.readerDiagnostics().glowCount>0);
      const src=await page.evaluate(()=>window.readerDiagnostics().audioSource);
      const asset=Object.values(illustrated.audio).find(item=>item.src===src);
      await verifyPublishedFile(base,src,asset.sha256);
      await page.locator('#stop').click();
    }
    for (let index=0;index<illustrated.pages.length;index++) {
      const item=illustrated.pages[index];
      await verifyPublishedFile(base,item.image,item.imageSha256);
    }
    if (illustrated.id === wolf.id) {
      await page.locator('#page-select').selectOption('17');
      await page.waitForFunction(()=>window.readerDiagnostics().imageReady);await chooseMode('character');
      await page.getByRole('button',{name:'朗讀粵語：犭',exact:true}).first().click();
      await page.waitForFunction(()=>window.readerDiagnostics().highlightedText==='犭');
      await page.locator('#stop').click();
    } else {
      for (const [number,name] of [[3,'琪琪'],[4,'樂樂']]) {
        await page.locator('#page-select').selectOption(String(number));
        await page.waitForFunction(()=>window.readerDiagnostics().imageReady);await chooseMode('word');
        await page.getByRole('button',{name:`朗讀粵語：${name}`,exact:true}).first().click();
        await page.waitForFunction(expected=>window.readerDiagnostics().current===expected && window.readerDiagnostics().engine==='audio' && window.readerDiagnostics().currentTime>0,name);
        await page.locator('#stop').click();
      }
    }
    await page.locator('#reader-back').click();
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: published library matches ${expectedHash.slice(0, 12)}; all three books, both original picture-book PDFs and 36 page hashes, all MP3 modes, real timed glyph cues, audio controls, page turns, reversible archive and phone layout verified.`);
} catch (error) {
  const state=await verificationPage?.evaluate(()=>window.readerDiagnostics?.()).catch(()=>null);
  const diagnosis=String(error.stack || error)+'\nReader state: '+JSON.stringify(state);
  if(process.env.GITHUB_ACTIONS==='true') console.error('::error title=Permanent website verification::'+diagnosis.slice(0,10000).replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A'));
  throw error;
} finally {
  await browser.close();
}
