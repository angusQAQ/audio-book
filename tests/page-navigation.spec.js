import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const books=JSON.parse(readFileSync('library.json','utf8')).books;
async function ready(page,number) {
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics?.().page)).toBe(number);
  await expect.poll(()=>page.evaluate(()=>window.readerDiagnostics().imageReady)).toBe(true);
  await expect(page.locator('.page-turn')).toHaveCount(0);
}

test('all books turn from their cover through every page with arrows and keyboard',async({page})=>{
  test.setTimeout(120000);
  await page.setViewportSize({width:1111,height:730});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const book of books) {
    await page.goto(`/?book=${book.id}&page=1`);await ready(page,1);
    await expect(page.locator('#previous-page')).toBeDisabled();
    for(let number=2;number<=book.pages.length;number++) {
      if(number%3===0) await page.keyboard.press('ArrowRight');
      else await page.locator(number%2?'#next-side':'#next-page').click();
      await ready(page,number);
      await expect(page.locator('#page-image')).toHaveAttribute('src',book.pages[number-1].image);
      expect(new URL(page.url()).searchParams.get('page')).toBe(String(number));
    }
    await expect(page.locator('#next-side')).toBeDisabled();
    for(let number=book.pages.length-1;number>=1;number--) {
      await page.locator(number%2?'#previous-page':'#previous-side').click();await ready(page,number);
    }
    await expect(page.locator('#previous-side')).toBeDisabled();
  }
  expect(errors).toEqual([]);
});

for(const failure of ['stalled','rejected','throws','missing-finished']) {
  test(`page turning recovers when browser animation is ${failure}`,async({page})=>{
    await page.addInitScript(kind=>{
      const animate=Element.prototype.animate;
      Element.prototype.animate=function(...args) {
        if(!this.classList.contains('page-turn-leaf'))return animate.apply(this,args);
        if(kind==='throws')throw new Error('Simulated unavailable animation');
        if(kind==='missing-finished')return {cancel(){}};
        return {cancel(){},finished:kind==='rejected'?Promise.reject(new Error('Simulated cancelled animation')):new Promise(()=>{})};
      };
    },failure);
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/?book=little-wolf-your-turn&page=1');await ready(page,1);
    await page.locator('#next-page').click();await ready(page,2);
    await expect(page.locator('#pause')).toBeEnabled();
    await page.locator('#next-side').click();await ready(page,3);
    await page.locator('#previous-page').click();await ready(page,2);
    expect(errors).toEqual([]);
  });
}

test('touch swipes turn pages without reading text and keep zoomed pages scrollable',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?book=little-wolf-your-turn&page=1');await ready(page,1);
  async function swipe(dx,dy=0) {
    await page.locator('#page-canvas').evaluate((node,delta)=>{
      const r=node.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      const target=node.querySelector('.hotspot') || node;
      target.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,pointerId:7,pointerType:'touch',clientX:x,clientY:y}));
      target.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,isPrimary:true,pointerId:7,pointerType:'touch',clientX:x+delta[0],clientY:y+delta[1]}));
      (node.querySelector('.hotspot') || node).dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    },[dx,dy]);
  }
  await swipe(-110);await ready(page,2);
  await swipe(-110);await ready(page,3);
  expect(await page.evaluate(()=>readerDiagnostics().current)).toBe(null);
  await swipe(110);await ready(page,2);
  await swipe(10,100);await ready(page,2);
  await page.locator('#voice-settings summary').click();await page.locator('#zoom').selectOption('1');
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).toHaveAttribute('data-zoomed','true');
  await swipe(-110);await ready(page,2);
  expect(await page.locator('#page-viewport').evaluate(node=>getComputedStyle(node).touchAction)).toBe('auto');
});
