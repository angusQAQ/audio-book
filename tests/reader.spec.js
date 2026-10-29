import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const library = JSON.parse(readFileSync('library.json', 'utf8'));
const book = library.books[0];

async function openReader(page, number = 3) {
  await page.goto(`/?book=${book.id}&page=${number}`);
  await expect.poll(() => page.evaluate(() => window.readerDiagnostics?.().imageReady)).toBe(true);
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
  const pdf = await page.request.get(await page.getByRole('link', { name: '開啟原 PDF' }).getAttribute('href'));
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
      await page.locator(`[data-mode="${mode}"]`).click();
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
  await page.locator('#zoom').selectOption('width');
  const wide = await page.locator('#page-canvas').evaluate(x => x.clientWidth);
  await page.locator('#zoom').selectOption('fit');
  expect(await page.locator('#page-canvas').evaluate(x => x.clientWidth)).toBeLessThan(wide);
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
  for (const width of [320, 390, 768, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 1440 || width === 390) {
      await page.screenshot({ path: `.impeccable/review/${width === 1440 ? 'desktop' : 'mobile'}.png`, fullPage: true });
    }
    await openReader(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#voice-settings summary').click();
    const bounds = await page.locator('.settings-panel').boundingBox();
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
