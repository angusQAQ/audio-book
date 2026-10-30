import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const library = JSON.parse(readFileSync('library.json','utf8'));
const wolf = library.books.find(book=>book.id==='little-wolf-your-turn');
async function mode(page,value) {
  if (!(await page.locator('#mode-settings').evaluate(node=>node.open))) await page.locator('#mode-settings summary').click();
  await page.locator(`[data-mode="${value}"]`).click();
}
async function ready(page) {
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics?.().imageReady)).toBe(true);
}
test('new illustrated book is searchable, preserved and readable in all MP3 modes', async ({page})=>{
  test.skip(!wolf,'The pending book is registered by CI only after all real audio is generated.');
  test.setTimeout(120000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#books-grid .shelf-item')).toHaveCount(library.books.length);
  await page.getByRole('searchbox').fill('犬');
  await expect(page.getByRole('heading',{name:wolf.title,exact:true})).toBeVisible();
  const cover=page.locator(`[data-book-id="${wolf.id}"] .cover-window img`);
  await expect(cover).toHaveAttribute('src',wolf.coverImage);
  const pdf=await page.request.get(wolf.source.url);
  expect(createHash('sha256').update(await pdf.body()).digest('hex')).toBe(wolf.source.sha256);
  await page.getByRole('button',{name:`閱讀《${wolf.title}》`,exact:true}).click();
  await ready(page);
  expect(await page.locator('#page-select option').count()).toBe(18);
  for (let index=0;index<wolf.pages.length;index++) {
    await page.locator('#page-select').selectOption(String(index+1));await ready(page);
    await expect(page.locator('#page-image')).toHaveAttribute('src',wolf.pages[index].image);
    for (const value of ['sentence','word','character']) {
      await mode(page,value);
      await page.locator('.hotspot').first().click();
      await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().engine)).toBe('audio');
      await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().currentTime)).toBeGreaterThan(0);
      await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().highlightedText)).toBeTruthy();
      await page.locator('#stop').click();
    }
  }
  await page.locator('#reader-back').click();
  const card=page.locator(`[data-book-id="${wolf.id}"]`);
  await expect(card.locator('.book-reading-link')).toHaveText('繼續第 18 頁');
  await card.getByRole('button',{name:`封存《${wolf.title}》`,exact:true}).click();
  await expect(card).toHaveCount(0);
  await page.reload();await page.locator('[data-shelf="archived"]').click();
  await page.getByRole('button',{name:`恢復《${wolf.title}》`,exact:true}).click();
  await page.locator('[data-shelf="active"]').click();
  await expect(page.locator(`[data-book-id="${wolf.id}"] .book-reading-link`)).toHaveText('繼續第 18 頁');
  expect(errors).toEqual([]);
});

test('enlarged handwriting uses exact glyph targets and real timed reading cues',async({page})=>{
  test.skip(!wolf,'Waiting for verified audio registration.');
  await page.setViewportSize({width:1111,height:730});
  await page.goto(`/?book=${wolf.id}&page=3`);await ready(page);
  await mode(page,'character');
  const first=wolf.pages[2].blocks[0];
  const small=page.locator(`.hotspot[data-block="${first.id}"][data-start="0"]`);
  const large=page.locator(`.hotspot[data-block="${first.id}"][data-start="1"]`);
  expect((await large.boundingBox()).width/(await small.boundingBox()).width).toBeCloseTo(1.5,1);
  await large.click();
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().highlightedText)).toBe('狗');
  const target=await large.boundingBox(), marker=await page.locator('.reading-marker').boundingBox();
  expect(marker.x).toBeCloseTo(target.x,0);expect(marker.width).toBeCloseTo(target.width,0);
  await page.locator('#stop').click();await mode(page,'sentence');
  await page.locator('.hotspot').first().click();
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().state)).toBe('playing');
  await page.locator('#pause').click();
  const audio=wolf.audio[first.audio];
  for (const boundary of [audio.boundaries[0],audio.boundaries.at(-1)]) {
    await page.locator('#audio-seek').fill(String((boundary.time+Math.min(.03,boundary.duration/3))/audio.duration*100));
    await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().highlightedText)).toBe(first.text.slice(boundary.start,boundary.end));
  }
  await page.locator('#stop').click();
  await page.locator('#page-select').selectOption('17');await ready(page);await mode(page,'character');
  const radical=page.getByRole('button',{name:'朗讀粵語：犭',exact:true}).first();
  await radical.click();
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().current)).toBe('反犬旁');
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().highlightedText)).toBe('犭');
  await page.locator('#stop').click();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
