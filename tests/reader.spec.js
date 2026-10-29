import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const library = JSON.parse(readFileSync('library.json', 'utf8'));
const book = library.books[0];

async function openReader(page, number = 3) {
  await page.goto(`/?book=${book.id}&page=${number}`);
  await expect.poll(() => page.evaluate(() => window.readerDiagnostics?.().imageReady)).toBe(true);
}

async function chooseMode(page,mode) {
  if (!(await page.locator('#mode-settings').evaluate(item=>item.open))) await page.locator('#mode-settings summary').click();
  await page.locator(`[data-mode="${mode}"]`).click();
}
async function openSettings(page) {
  if (!(await page.locator('#voice-settings').evaluate(item=>item.open))) await page.locator('#voice-settings summary').click();
}

async function playFirst(page) {
  const button = page.locator('.hotspot').first();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.readerDiagnostics().state)).toBe('playing');
  await expect.poll(() => page.evaluate(() => window.readerDiagnostics().currentTime)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.readerDiagnostics().glowCount)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.readerDiagnostics().engine)).toBe('audio');
}

test('shelf search, original PDF and reading progress survive reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  await expect(page.locator('.pdf-link')).toHaveCount(0);
  await expect(page.locator('.book-description, .library-footer')).toHaveCount(0);
  const pdf = await page.request.get(book.source.url);
  expect(pdf.ok()).toBe(true);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF');
  await page.getByRole('searchbox').fill('不存在的圖書');
  await expect(page.getByRole('heading', { name: '還沒有找到這本書' })).toBeVisible();
  await page.getByRole('button', { name: '顯示全部書籍' }).click();
  await page.getByRole('button', { name: `閱讀《${book.title}》`, exact: true }).click();
  await page.locator('#page-select').selectOption('4');
  await page.getByRole('button', { name: '我的書架' }).click();
  await expect(page.getByRole('button', { name: '繼續第 4 頁' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '繼續第 4 頁' }).click();
  expect(await page.evaluate(() => window.readerDiagnostics().page)).toBe(4);
  await page.goBack();
  await expect(page.locator('#library-view')).toBeVisible();
});

test('every original page and all three modes render and play bundled MP3', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openReader(page, 1);
  for (let index = 0; index < book.pages.length; index++) {
    await page.locator('#page-select').selectOption(String(index + 1));
    await expect.poll(() => page.evaluate(() => window.readerDiagnostics().imageReady)).toBe(true);
    for (const mode of ['sentence', 'word', 'character']) {
      await chooseMode(page,mode);
      expect(await page.locator('.hotspot').count()).toBeGreaterThan(0);
      await playFirst(page);
      await page.locator('#stop').click();
      await expect(page.locator('.ink-glow')).toHaveCount(0);
    }
  }
  await expect(page.locator('#next-page')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('pause, resume, replay, rate, keyboard navigation and zoom', async ({ page }) => {
  await openReader(page);
  await page.locator('.hotspot').filter({ hasText: '' }).nth(2).click();
  await expect.poll(() => page.evaluate(() => window.readerDiagnostics().state)).toBe('playing');
  await page.locator('#pause').click();
  expect(await page.evaluate(() => window.readerDiagnostics().state)).toBe('paused');
  const paused = await page.evaluate(() => window.readerDiagnostics().currentTime);
  await page.waitForTimeout(180);
  expect(await page.evaluate(() => window.readerDiagnostics().currentTime)).toBeCloseTo(paused, 1);
  await page.locator('#pause').click();
  await expect.poll(() => page.evaluate(() => window.readerDiagnostics().currentTime)).toBeGreaterThan(paused);
  await page.locator('#voice-settings summary').click();
  await page.locator('#playback-rate').fill('0.85');
  await page.locator('#playback-rate').dispatchEvent('change');
  expect(await page.evaluate(() => window.readerDiagnostics().playbackRate)).toBe(0.85);
  await page.locator('#replay').click();
  await expect.poll(() => page.evaluate(() => window.readerDiagnostics().state)).toBe('playing');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.readerDiagnostics().state)).toBe('idle');
  await openSettings(page);
  await page.locator('#zoom').selectOption('width');
  const wide = await page.locator('#page-canvas').evaluate(x => x.clientWidth);
  await page.locator('#zoom').selectOption('fit');
  expect(await page.locator('#page-canvas').evaluate(x => x.clientWidth)).toBeLessThan(wide);
  await page.keyboard.press('Escape');
  await page.locator('#reader-view').focus();
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => window.readerDiagnostics().page)).toBe(4);
  await page.keyboard.press('ArrowLeft');
  expect(await page.evaluate(() => window.readerDiagnostics().page)).toBe(3);
});

test('broken MP3 produces a recoverable error and replay works', async ({ page }) => {
  await page.route('**/assets/audio/*.mp3', route => route.abort());
  await openReader(page);
  await page.locator('.hotspot').first().click();
  await expect.poll(() => page.evaluate(() => window.readerDiagnostics().state)).toBe('error');
  await expect(page.locator('#status')).toHaveAttribute('data-state', 'error');
  await page.unroute('**/assets/audio/*.mp3');
  await page.locator('#replay').click();
  await expect.poll(() => page.evaluate(() => window.readerDiagnostics().state)).toBe('playing');
});

test('desktop, tablet, phone, keyboard focus and reduced motion accessibility', async ({ page }) => {
  mkdirSync('.impeccable/review', { recursive: true });
  for (const width of [320, 390, 768, 790, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: width === 790 ? 730 : 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 1440 || width === 390) {
      await page.screenshot({ path: `.impeccable/review/${width === 1440 ? 'desktop' : 'mobile'}.png`, fullPage: true });
    }
    await openReader(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#voice-settings summary').click();
    const bounds = await page.locator('#voice-settings .settings-panel').boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
    if (width === 1440 || width === 390) {
      await page.screenshot({ path: `.impeccable/review/reader-${width}.png`, fullPage: true });
    }
    await page.locator('#voice-settings summary').click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const shelfA11y = await new AxeBuilder({ page }).analyze();
  expect(shelfA11y.violations).toEqual([]);
  await openReader(page);
  const readerA11y = await new AxeBuilder({ page }).analyze();
  expect(readerA11y.violations).toEqual([]);
  await page.keyboard.press('Tab');
  expect(await page.locator(':focus-visible').count()).toBe(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await playFirst(page);
  expect(await page.locator('.ink-glow').first().evaluate(x => getComputedStyle(x).animationName)).toBe('none');
});


test('audio player starts, seeks, shows time and restarts after stop', async ({ page }) => {
  await page.setViewportSize({ width: 790, height: 730 });
  await openReader(page, 1);
  await expect(page.locator('#pause')).toBeEnabled();
  await expect(page.locator('#pause')).toHaveAttribute('aria-label', '播放朗讀');
  await page.locator('#pause').click();
  await expect.poll(() => page.evaluate(() => window.readerDiagnostics().state)).toBe('playing');
  await page.locator('#stop').click();
  await page.locator('.hotspot').nth(4).click();
  await expect.poll(() => page.evaluate(() => window.readerDiagnostics().state)).toBe('playing');
  await page.locator('#pause').click();
  await expect(page.locator('#audio-seek')).toBeEnabled();
  await page.locator('#audio-seek').fill('45');
  await expect.poll(() => page.evaluate(() => {
    const player = window.readerDiagnostics(); return player.currentTime / player.duration;
  })).toBeCloseTo(0.45, 1);
  await expect(page.locator('#duration-time')).not.toHaveText('0:00');
  await expect(page.locator('#elapsed-time')).not.toHaveText('0:00');
  await expect(page.locator('#audio-seek')).toHaveAttribute('aria-valuetext', /，共 /);
  mkdirSync('.impeccable/review', { recursive: true });
  await page.screenshot({ path: '.impeccable/review/player-790.png', fullPage: true });
  await page.locator('#stop').click();
  await expect(page.locator('#audio-seek')).toBeDisabled();
  await expect(page.locator('#elapsed-time')).toHaveText('0:00');
  await page.locator('#pause').click();
  await expect.poll(() => page.evaluate(() => window.readerDiagnostics().state)).toBe('playing');
});


test('compact icon toolbar prioritizes the book and preserves keyboard access', async ({ page }) => {
  for (const width of [320, 390, 790, 1111]) {
    await page.setViewportSize({ width, height: 730 });
    await openReader(page, 1);
    await expect(page.locator('.site-header')).toBeHidden();
    expect(await page.locator('.reader-tools').evaluate(item=>item.getBoundingClientRect().height)).toBeLessThanOrEqual(60);
    expect(await page.locator('#page-viewport').evaluate(item=>item.clientHeight)).toBeGreaterThan(370);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator('#reader-back')).toBeVisible();
  }
  await page.locator('#mode-settings summary').click();
  await page.locator('[data-mode="sentence"]').focus();
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(()=>window.readerDiagnostics().mode)).toBe('word');
  expect(await page.evaluate(()=>window.readerDiagnostics().page)).toBe(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#mode-settings summary')).toBeFocused();
  await chooseMode(page,'sentence');
  await page.locator('.hotspot').nth(4).click();
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().state)).toBe('playing');
  await openSettings(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#voice-settings summary')).toBeFocused();
  expect(await page.evaluate(()=>window.readerDiagnostics().state)).toBe('playing');
});

test('dark appearance, increased contrast and enlarged interface text remain usable', async ({ page }) => {
  mkdirSync('.impeccable/review', { recursive:true });
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({colorScheme:'dark',contrast:'more',reducedMotion:'reduce'});
  await page.goto('/');
  await page.evaluate(()=>document.fonts.ready);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.screenshot({path:'.impeccable/review/apple-dark-library.png',fullPage:true});
  await openReader(page,1);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  expect(await page.locator('#page-image').evaluate(item=>getComputedStyle(item).filter)).toBe('none');
  await page.screenshot({path:'.impeccable/review/apple-dark-reader.png',fullPage:true});
  for (const selector of ['#reader-back','#mode-settings summary','#voice-settings summary','#audio-seek','#replay','#stop']) {
    expect(await page.locator(selector).evaluate(item=>item.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  }
  await page.emulateMedia({colorScheme:'light',contrast:'no-preference'});
  await page.evaluate(()=>document.documentElement.style.fontSize='32px');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await openSettings(page);
  await expect(page.locator('#zoom')).toBeVisible();
  const bounds=await page.locator('#voice-settings .settings-panel').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(391);
  await page.keyboard.press('Escape');
  await page.locator('#reader-back').click();
  await expect(page.locator('#library-view')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('real word timestamps guide the glow through playback, seeking and page splits', async ({ page }) => {
  const block = book.pages[0].blocks[4], asset = book.audio[block.audio];
  expect(asset.timingSchema).toBe(1);
  expect(asset.boundaries.length).toBeGreaterThan(3);
  await page.setViewportSize({width:1111,height:730});
  await openReader(page,1);
  await page.locator('.hotspot').nth(4).click();
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().state)).toBe('playing');
  await page.locator('#pause').click();
  const samples=[asset.boundaries[0],asset.boundaries[Math.floor(asset.boundaries.length/2)]];
  for (const boundary of samples) {
    await page.locator('#audio-seek').fill(((boundary.time+Math.min(.03,boundary.duration/3))/asset.duration*100).toFixed(1));
    await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().highlightedText)).toBe(block.text.slice(boundary.start,boundary.end));
  }
  await page.screenshot({path:'.impeccable/review/apple-word-glow.png'});
  await openSettings(page);
  await page.locator('#playback-rate').fill('0.85');
  await page.locator('#playback-rate').dispatchEvent('change');
  await page.keyboard.press('Escape');
  const prior=await page.evaluate(()=>window.readerDiagnostics().highlightedText);
  await page.locator('#pause').click();
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().highlightedText),{timeout:5000}).not.toBe(prior);
  await page.locator('#stop').click();
  expect(await page.evaluate(()=>window.readerDiagnostics().highlightedText)).toBeNull();
  await chooseMode(page,'character');
  await page.locator('.hotspot').first().click();
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().state)).toBe('ended');
  await expect(page.locator('.ink-glow')).toHaveCount(0);
  await page.waitForTimeout(200);
  await expect(page.locator('.ink-glow')).toHaveCount(0);
  await page.locator('#page-select').selectOption('3');
  await chooseMode(page,'sentence');
  const continued=book.pages[2].blocks.find(item=>item.id==='p3-b6');
  const continuation=book.audio[continued.audio];
  await page.locator('.hotspot[data-block="p3-b6"]').first().click();
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().state)).toBe('playing');
  await page.locator('#pause').click();
  const last=continuation.boundaries.at(-1);
  await page.locator('#audio-seek').fill((Math.min(continuation.duration-.05,last.time+.02)/continuation.duration*100).toFixed(1));
  const text=await page.evaluate(()=>window.readerDiagnostics().highlightedText);
  if (text) expect(continued.text.includes(text)).toBe(true);
});


test('book pages flip in both directions, cancel safely and respect reduced motion', async ({ page }) => {
  await page.setViewportSize({width:1111,height:730});
  await openReader(page,1);
  await page.locator('#next-page').click();
  await expect(page.locator('.page-turn')).toBeVisible();
  await expect(page.locator('#page-canvas')).toHaveAttribute('data-turn-direction','next');
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().imageReady)).toBe(true);
  await expect(page.locator('.page-turn')).toHaveCount(0);
  await page.locator('#previous-page').click();
  await expect(page.locator('.page-turn')).toBeVisible();
  await expect(page.locator('#page-canvas')).toHaveAttribute('data-turn-direction','previous');
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().imageReady)).toBe(true);
  await page.locator('#next-page').click();
  await page.locator('#next-page').click();
  await page.locator('#next-page').click();
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().imageReady)).toBe(true);
  expect(await page.evaluate(()=>window.readerDiagnostics().page)).toBe(4);
  await expect(page.locator('#page-image')).toHaveAttribute('src',book.pages[3].image);
  await expect(page.locator('.page-turn')).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#next-page').click();
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().imageReady)).toBe(true);
  await expect(page.locator('.page-turn')).toHaveCount(0);
  expect(await page.evaluate(()=>window.readerDiagnostics().page)).toBe(5);
});

test('books can be archived and restored after reload without losing reading progress', async ({ page }) => {
  await openReader(page,4);
  await page.locator('#reader-back').click();
  await page.getByRole('button',{name:`封存《${book.title}》`,exact:true}).click();
  await expect(page.locator('#books-grid .shelf-item')).toHaveCount(0);
  await expect(page.locator('#library-status')).toContainText('已封存');
  await expect(page.locator('[data-shelf="archived"]')).toBeFocused();
  await expect(page.locator('#active-count')).toHaveText('0');
  await expect(page.locator('#continue-label')).toHaveText('查看已封存書籍');
  await page.reload();
  await expect(page.locator('#books-grid .shelf-item')).toHaveCount(0);
  await page.locator('#continue-reading').click();
  await expect(page.locator('[data-shelf="archived"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'繼續第 4 頁',exact:true})).toBeVisible();
  await page.getByRole('searchbox').fill('找不到的書');
  await expect(page.getByRole('heading',{name:'還沒有找到這本書'})).toBeVisible();
  await page.getByRole('button',{name:'顯示全部書籍',exact:true}).click();
  await page.getByRole('button',{name:'繼續第 4 頁',exact:true}).click();
  expect(await page.evaluate(()=>window.readerDiagnostics().page)).toBe(4);
  await page.locator('#reader-back').click();
  await expect(page.locator('[data-shelf="archived"]')).toHaveAttribute('aria-pressed','true');
  const archiveA11y=await new AxeBuilder({page}).analyze();
  expect(archiveA11y.violations).toEqual([]);
  await page.getByRole('button',{name:`恢復《${book.title}》`,exact:true}).click();
  await expect(page.locator('#archived-count')).toHaveText('0');
  await expect(page.locator('[data-shelf="active"]')).toBeFocused();
  await expect(page.getByRole('heading',{name:'還沒有封存的書籍'})).toBeVisible();
  await page.locator('[data-shelf="active"]').press('Enter');
  await expect(page.getByRole('button',{name:'繼續第 4 頁',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button',{name:`封存《${book.title}》`,exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'繼續第 4 頁',exact:true})).toBeVisible();
  await expect(page.locator('.pdf-link')).toHaveCount(0);
});

test('reading cues preserve dark printed strokes in light and dark appearance', async ({ page }) => {
  await page.setViewportSize({width:1111,height:730});
  for (const colorScheme of ['light','dark']) {
    await page.emulateMedia({colorScheme});
    await openReader(page,1);
    await page.locator('.hotspot').nth(4).click();
    await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().state)).toBe('playing');
    await page.locator('#pause').click();
    await expect(page.locator('.reading-marker').first()).toBeVisible();
    await page.locator('#glow-layer').evaluate(layer=>layer.style.visibility='hidden');
    const original=await page.locator('#page-canvas').screenshot({path:`.impeccable/review/legibility-before-${colorScheme}.png`});
    await page.locator('#glow-layer').evaluate(layer=>layer.style.visibility='');
    const highlighted=await page.locator('#page-canvas').screenshot({path:`.impeccable/review/legibility-after-${colorScheme}.png`});
    const result=await page.evaluate(async ([before,after])=>{
      async function pixels(encoded) {
        const image=new Image(); image.src='data:image/png;base64,'+encoded; await image.decode();
        const canvas=document.createElement('canvas'); canvas.width=image.width; canvas.height=image.height;
        const context=canvas.getContext('2d'); context.drawImage(image,0,0);
        return {width:image.width,height:image.height,data:context.getImageData(0,0,image.width,image.height).data};
      }
      const original=await pixels(before),highlighted=await pixels(after);
      if (original.width!==highlighted.width || original.height!==highlighted.height) throw new Error('Reading comparison geometry changed');
      const a=original.data,b=highlighted.data;
      let changed=0,lightened=0,dark=0;
      for (let i=0;i<a.length;i+=4) {
        if (Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>3) changed++;
        if (Math.max(a[i],a[i+1],a[i+2])<125) {
          dark++;
          if (b[i]>a[i]+3 || b[i+1]>a[i+1]+3 || b[i+2]>a[i+2]+3) lightened++;
        }
      }
      return {changed,lightened,dark};
    },[original.toString('base64'),highlighted.toString('base64')]);
    expect(result.dark).toBeGreaterThan(100);
    expect(result.changed).toBeGreaterThan(10);
    expect(result.lightened).toBe(0);
    await page.screenshot({path:`.impeccable/review/legible-reading-${colorScheme}.png`});
  }
});
