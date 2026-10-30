import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const library=JSON.parse(readFileSync('library.json','utf8'));
const cloud=library.books.find(book=>book.id==='lets-find-that-cloud');
async function ready(page) {
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics?.().imageReady)).toBe(true);
}
async function mode(page,value) {
  if(!(await page.locator('#mode-settings').evaluate(node=>node.open))) await page.locator('#mode-settings summary').click();
  await page.locator(`[data-mode="${value}"]`).click();
}

test('do2 audio preserves the printed 朵 in single-character and sentence cues',async({page})=>{
  const affected=Object.values(cloud.audio).filter(asset=>asset.text.includes('朵'));
  expect(affected).toHaveLength(6);
  for(const asset of affected) {
    expect(asset.ttsText).toBe(asset.text.replaceAll('朵','躲'));
    expect(asset.pronunciationHints).toEqual({'朵':'do2'});
  }
  await page.goto(`/?book=${cloud.id}&page=1`);await ready(page);
  for(const value of ['word','character']) {
    await mode(page,value);
    await page.getByRole('button',{name:'朗讀粵語：朵',exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().engine)).toBe('audio');
    await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().highlightedText)).toBe('朵');
    const src=await page.evaluate(()=>window.readerDiagnostics().audioSource);
    const asset=affected.find(item=>item.text==='朵');
    expect(src).toBe(asset.src);
    expect(createHash('sha256').update(await (await page.request.get(src)).body()).digest('hex')).toBe(asset.sha256);
    await page.locator('#stop').click();
  }
  await mode(page,'sentence');
  const block=cloud.pages[0].blocks.find(item=>item.text==='去找那朵雲');
  const asset=cloud.audio[block.audio];
  await page.getByRole('button',{name:`朗讀粵語：${block.text}`,exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().state)).toBe('playing');
  await page.locator('#pause').click();
  const boundary=asset.boundaries.find(item=>asset.text.slice(item.start,item.end).includes('朵'));
  await page.locator('#audio-seek').fill(((boundary.time+Math.min(.03,boundary.duration/3))/asset.duration*100).toFixed(1));
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().highlightedText)).toBe(asset.text.slice(boundary.start,boundary.end));
});

test('cloud story joins the shelf with the latest PDF and every page plays all three MP3 modes',async({page})=>{
  test.skip(!cloud,'CI registers the new book only after complete real MP3 generation.');
  test.setTimeout(150000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await page.getByRole('searchbox').fill('走');
  await expect(page.getByRole('heading',{name:cloud.title,exact:true})).toBeVisible();
  await expect(page.locator(`[data-book-id="${cloud.id}"] .cover-window img`)).toHaveAttribute('src',cloud.coverImage);
  const source=await page.request.get(cloud.source.url);
  expect(createHash('sha256').update(await source.body()).digest('hex')).toBe(cloud.source.sha256);
  await page.getByRole('button',{name:`閱讀《${cloud.title}》`,exact:true}).click();await ready(page);
  expect(await page.locator('#page-select option').count()).toBe(cloud.pages.length);
  for(let n=0;n<cloud.pages.length;n++) {
    await page.locator('#page-select').selectOption(String(n+1));await ready(page);
    await expect(page.locator('#page-image')).toHaveAttribute('src',cloud.pages[n].image);
    for(const value of ['sentence','word','character']) {
      await mode(page,value);await page.locator('.hotspot').first().click();
      await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().engine)).toBe('audio');
      await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().currentTime)).toBeGreaterThan(0);
      await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().highlightedText)).toBeTruthy();
      await page.locator('#stop').click();
    }
  }
  await page.locator('#reader-back').click();
  const card=page.locator(`[data-book-id="${cloud.id}"]`);
  await card.getByRole('button',{name:`封存《${cloud.title}》`,exact:true}).click();
  await page.reload();await page.locator('[data-shelf="archived"]').click();
  await page.getByRole('button',{name:`恢復《${cloud.title}》`,exact:true}).click();
  await page.locator('[data-shelf="active"]').click();
  await expect(page.locator(`[data-book-id="${cloud.id}"] .book-reading-link`)).toHaveText(`繼續第 ${cloud.pages.length} 頁`);
  expect(errors).toEqual([]);
});

test('cloud story keeps enlarged glyph geometry, revised names and real-time name cues',async({page})=>{
  test.skip(!cloud,'Awaiting verified audio registration.');
  await page.setViewportSize({width:1111,height:730});
  await page.goto(`/?book=${cloud.id}&page=3`);await ready(page);await mode(page,'character');
  const first=cloud.pages[2].blocks[0];
  const large=page.locator(`.hotspot[data-block="${first.id}"][data-start="0"]`);
  const small=page.locator(`.hotspot[data-block="${first.id}"][data-start="1"]`);
  expect((await large.boundingBox()).width/(await small.boundingBox()).width).toBeCloseTo(1.5,1);
  await large.click();await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().highlightedText)).toBe('起');
  await page.locator('#stop').click();
  for(const [number,name] of [[3,'琪琪'],[4,'樂樂']]) {
    await page.locator('#page-select').selectOption(String(number));await ready(page);await mode(page,'word');
    await page.getByRole('button',{name:`朗讀粵語：${name}`,exact:true}).first().click();
    await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().current)).toBe(name);
    await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().engine)).toBe('audio');
    await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().currentTime)).toBeGreaterThan(0);
    await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().highlightedText)).toBeTruthy();
    await page.locator('#stop').click();
  }
  await page.locator('#page-select').selectOption('5');await ready(page);await mode(page,'sentence');
  await page.getByRole('button',{name:'朗讀粵語：琪琪加快腳步趕路。',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().state)).toBe('playing');
  await page.locator('#pause').click();
  const block=cloud.pages[4].blocks[0],audio=cloud.audio[block.audio];
  for(const boundary of [audio.boundaries[0],audio.boundaries.at(-1)]) {
    await page.locator('#audio-seek').fill(((boundary.time+Math.min(.03,boundary.duration/3))/audio.duration*100).toFixed(1));
    await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().highlightedText)).toBe(block.text.slice(boundary.start,boundary.end));
  }
  await page.locator('#stop').click();
  await page.setViewportSize({width:390,height:844});
  await page.locator('#page-canvas').evaluate(node=>{
    const r=node.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    for(const [type,end] of [['pointerdown',x],['pointerup',x-110]]) node.dispatchEvent(new PointerEvent(type,{bubbles:true,isPrimary:true,pointerId:7,pointerType:'touch',clientX:end,clientY:y}));
  });
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().page)).toBe(6);await ready(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
