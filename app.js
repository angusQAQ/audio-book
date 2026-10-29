(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const paths = {
    reading:'M4 5h16M4 12h16M4 19h10',
    left:'m14 5-7 7 7 7',right:'m10 5 7 7-7 7',pause:'M8 5v14M16 5v14',play:'m8 5 11 7-11 7Z',
    stop:'M6 6h12v12H6z',replay:'M19 7a8 8 0 1 0 1 8M19 3v5h-5',
    book:'M12 5C8 2 4 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-2-1-6-2-10 1Zm0 0v16',
    shelf:'M3 3v18h18M7 5v11M11 3v13M15 6l3 10M3 17h18',
    search:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    archive:'M3 3h18v5H3zM5 8v13h14V8M9 12h6',
    restore:'M4 9v12h16V9M12 15V3m-4 4 4-4 4 4',
    sliders:'M4 6h16M4 18h16M9 3v6M15 15v6M4 12h16M17 9v6'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (paths[name] || paths.book) + '"/></svg>';
  }
  $$('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  const library = window.READING_LIBRARY || {name:'點點書房', books: window.READING_BOOK ? [window.READING_BOOK] : []};
  const books = library.books || [];
  if (!books.length) {
    $('#app-error').hidden = false;
    $('#app-error').textContent = '書架未能載入，請重新整理或使用完整下載包。';
    return;
  }
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key,value) { try { localStorage.setItem(key,String(value)); } catch {} }
  };
  let shelfView = 'active';
  const archivedBooks = new Set();
  try {
    const saved = JSON.parse(storage.get('library-archived-books') || '[]');
    if (Array.isArray(saved)) for (const id of saved) if (books.some(item=>item.id===id)) archivedBooks.add(id);
  } catch { /* An invalid preference must not hide the bookshelf. */ }
  let book = books[0], page = 0, mode = storage.get('library-reading-mode') || 'sentence';
  if (!['sentence','word','character'].includes(mode)) mode = 'sentence';
  let rate = Number(storage.get('library-reading-rate') || 1);
  if (!Number.isFinite(rate) || rate < .75 || rate > 1.25) rate = 1;
  let voicePreference = storage.get('library-reading-voice') || 'offline';
  let voices = [], current = null, engine = null, nativeUtterance = null, nativeTimer = null;
  let token = 0, audioToken = 0, playState = 'idle', imageReady = false, nativeBoundary = null;
  let glowFrame = 0, glowKey = '';
  let turnToken = 0, pendingTurn = null, turnAnimation = null;
  const player = new Audio();
  player.preload = 'none';
  player.preservesPitch = true;
  player.webkitPreservesPitch = true;
  const synth = window.speechSynthesis;
  const image = $('#page-image'), paper = $('#page-canvas'), viewport = $('#page-viewport');
  const modeNames = {sentence:'句子',word:'詞語',character:'單字'};
  function announce(text, state) { $('#status').textContent = text; $('#status').dataset.state = state || ''; }
  function savedPage(item) {
    const value = storage.get('library-position:' + item.id);
    if (value === null) return null;
    const number = Number(value);
    return Number.isInteger(number) ? Math.max(0,Math.min(item.pages.length-1,number)) : null;
  }
  function formatTime(value) {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2,'0');
  }
  function setProgress(fraction) {
    const value = Math.max(0,Math.min(1,Number(fraction) || 0));
    const seek = $('#audio-seek');
    const timed = engine === 'audio' && Number.isFinite(player.duration) && player.duration > 0;
    seek.value = String(value * 100);
    seek.style.setProperty('--seek-progress',(value * 100) + '%');
    seek.disabled = !timed;
    $('#elapsed-time').textContent = timed ? formatTime(player.currentTime) : '0:00';
    $('#duration-time').textContent = timed ? formatTime(player.duration) : '0:00';
    seek.setAttribute('aria-valuetext', timed ? formatTime(player.currentTime) + '，共 ' + formatTime(player.duration) : '尚未播放');
  }
  function setState(state) {
    playState = state;
    document.body.dataset.playState = state;
    cancelAnimationFrame(glowFrame);
    if (state === 'playing' && engine === 'audio') glowFrame = requestAnimationFrame(syncAudioGlow);
    const active = ['playing','paused','loading'].includes(state);
    const label = state === 'playing' ? '暫停' : state === 'paused' ? '繼續' : state === 'loading' ? '準備中' : '播放';
    $('#pause').disabled = state === 'loading' || !imageReady;
    $('#pause').setAttribute('aria-busy',String(state === 'loading'));
    $('#stop').disabled = !active;
    $('#replay').disabled = !current || state === 'loading';
    $('#pause-label').textContent = label;
    $('#pause').setAttribute('aria-label', label + '朗讀');
    $('#pause [data-icon]').innerHTML = icon(state === 'playing' ? 'pause' : 'play');
  }
  function clearGlow() {
    $('#glow-layer').replaceChildren();
    $('#glow-layer').dataset.text = '';
    glowKey = '';
    $$('.hotspot[aria-pressed="true"]').forEach(button => button.setAttribute('aria-pressed','false'));
  }
  function halt(clear) {
    token++;
    clearTimeout(nativeTimer); nativeTimer = null;
    player.pause(); player.removeAttribute('src'); player.load();
    if (synth) { try { synth.cancel(); if (synth.paused) synth.resume(); } catch {} }
    nativeUtterance = null; engine = null; nativeBoundary = null;
    clearGlow(); setProgress(0);
    if (clear) current = null;
    setState('idle');
  }
  function stop(clear) {
    halt(!!clear);
    announce('已停止。點書上的文字，再聽一次。');
    if (clear) $('#current-text').textContent = '想聽哪一段？直接點一下書上的文字。';
  }
  function glowImages(block,unit,extraClass) {
    const fragment = document.createDocumentFragment();
    for (const row of block.lines) {
      if (!row.glow || unit.end <= row.start || unit.start >= row.end) continue;
      const start = Math.max(unit.start,row.start)-row.start;
      const end = Math.min(unit.end,row.end)-row.start;
      const [x,y,w,h] = row.rect;
      const marker = el('span','reading-marker');
      marker.style.left = ((x + w * start / row.text.length)*100)+'%'; marker.style.top = (y*100)+'%';
      marker.style.width = (w*(end-start)/row.text.length*100)+'%'; marker.style.height = (h*100)+'%';
      fragment.append(marker);
      const glow = el('img','ink-glow' + (extraClass ? ' '+extraClass : ''));
      glow.alt = ''; glow.src = row.glow;
      glow.style.left = (x*100)+'%'; glow.style.top = (y*100)+'%';
      glow.style.width = (w*100)+'%'; glow.style.height = (h*100)+'%';
      glow.style.clipPath = 'inset(0 ' + ((1-end/row.text.length)*100) + '% 0 ' + (start/row.text.length*100) + '%)';
      fragment.append(glow);
    }
    return fragment;
  }
  function normalizedLetters(text) {
    const letters = [];
    for (let index = 0; index < text.length; index++) {
      for (const letter of text[index].normalize('NFKC').toLowerCase()) {
        if (/[\p{L}\p{N}]/u.test(letter)) letters.push({letter,index});
      }
    }
    return letters;
  }
  function timedRanges(item) {
    const asset = book.audio[item.audio];
    if (!asset || !asset.boundaries) return [];
    const spoken = normalizedLetters(asset.text), visible = normalizedLetters(item.block.text.slice(item.unit.start,item.unit.end));
    const table = Array.from({length:spoken.length + 1},()=>new Uint16Array(visible.length + 1));
    for (let i=spoken.length-1;i>=0;i--) for (let j=visible.length-1;j>=0;j--) {
      table[i][j] = spoken[i].letter === visible[j].letter ? table[i+1][j+1]+1 : Math.max(table[i+1][j],table[i][j+1]);
    }
    const positions = new Map();
    for (let i=0,j=0;i<spoken.length && j<visible.length;) {
      if (spoken[i].letter === visible[j].letter) { positions.set(spoken[i].index,visible[j].index + item.unit.start); i++; j++; }
      else if (table[i+1][j] >= table[i][j+1]) i++;
      else j++;
    }
    return asset.boundaries.map(boundary=>{
      const mapped = [];
      for (let i=boundary.start;i<boundary.end;i++) if (positions.has(i)) mapped.push(positions.get(i));
      return {time:boundary.time,duration:boundary.duration,start:mapped.length?Math.min(...mapped):null,end:mapped.length?Math.max(...mapped)+1:null};
    });
  }
  function currentGlowUnit() {
    if (nativeBoundary) return nativeBoundary;
    if (engine !== 'audio' || !current.timings.length) return current.unit;
    const timings = current.timings;
    let boundary = timings[0];
    for (const candidate of timings) {
      if (candidate.time > player.currentTime + 0.015) break;
      boundary = candidate;
    }
    return boundary.start === null ? null : boundary;
  }
  function activateGlow() {
    if (!current || !['playing','paused'].includes(playState)) return;
    const unit = currentGlowUnit();
    const key = current.block.id + ':' + (unit ? unit.start + ':' + unit.end : 'outside');
    if (key === glowKey) return;
    glowKey = key;
    const layer = $('#glow-layer');
    layer.replaceChildren(...(unit ? [glowImages(current.block,unit,'reading-word')] : []));
    layer.dataset.text = unit ? current.block.text.slice(unit.start,unit.end) : '';
    layer.dataset.start = unit ? String(unit.start) : '';
    layer.dataset.end = unit ? String(unit.end) : '';
    $$('.hotspot').forEach(button => button.setAttribute('aria-pressed',
      button.dataset.block === current.block.id && Number(button.dataset.start) === current.unit.start ? 'true' : 'false'));
  }
  function syncAudioGlow() {
    if (engine !== 'audio' || playState !== 'playing') return;
    activateGlow();
    glowFrame = requestAnimationFrame(syncAudioGlow);
  }
  function failPlayback(message) {
    clearGlow(); setState('error');
    announce(message || '讀音未能載入。請再點一次文字或切換朗讀聲音。','error');
  }
  function finish(expected) {
    if (expected !== token) return;
    clearTimeout(nativeTimer); nativeTimer = null; nativeUtterance = null;
    clearGlow(); setProgress(1); setState('ended');
    announce('讀完了。再點一下，也可以重聽。');
  }
  function cantoneseVoice(voice) {
    const lang = String(voice.lang || '').replace(/_/g,'-');
    return /^yue(?:-|$)/i.test(lang) || /^zh-(?:Hant-)?HK$/i.test(lang);
  }
  function rankVoice(voice) {
    return (/premium|enhanced|siri|高品質|進階/i.test(voice.name) ? 20 : 0)
      + (/^yue/i.test(voice.lang) ? 5 : 0) + (voice.localService ? 2 : 0);
  }
  function refreshVoices() {
    try { voices = synth ? synth.getVoices().filter(cantoneseVoice).sort((a,b)=>rankVoice(b)-rankVoice(a)) : []; }
    catch { voices = []; }
    const list = [new Option('內置粵語（預製 MP3）','offline'),new Option('自動使用內置粵語','auto')];
    for (const voice of voices) list.push(new Option(voice.name + '（粵語）',voice.voiceURI || voice.name));
    $('#voice-select').replaceChildren(...list);
    if (!['auto','offline'].includes(voicePreference) && !voices.some(v=>(v.voiceURI || v.name)===voicePreference)) voicePreference = 'auto';
    $('#voice-select').value = voicePreference;
    const prebuilt = book.voice && book.voice.name === 'zh-HK-HiuMaanNeural';
    $('#voice-help').textContent = prebuilt
      ? '內置曉曼粵語，已放慢 12%。直接播放 MP3，不需裝置語音；下方可再調整速度。'
      : '預設播放內置粵語 MP3，不需裝置語音。下方可調整速度，也可選擇裝置的粵語聲音。';
  }
  function selectedVoice() {
    if (voicePreference === 'offline') return null;
    if (voicePreference === 'auto') return null;
    return voices.find(v=>(v.voiceURI || v.name)===voicePreference) || null;
  }
  function markPlaying(expected) {
    if (expected !== token) return;
    clearTimeout(nativeTimer); nativeTimer = null;
    setState('playing'); activateGlow();
    announce(current.lang === 'en' ? '正在朗讀原文英語' : '正在朗讀粵語');
  }
  async function playAudio(expected, fromNative) {
    if (expected !== token || !current) return;
    const asset = book.audio[current.audio];
    if (!asset) { failPlayback(); return; }
    engine = 'audio'; audioToken = expected;
    player.src = asset.src; player.playbackRate = rate;
    try { await player.play(); markPlaying(expected); }
    catch { if (expected === token) failPlayback(fromNative
      ? '裝置語音未能啟動。請選「內建粵語讀音」，再點一次文字。' : undefined); }
  }
  function nativeFallback(expected) {
    if (expected !== token || engine !== 'native') return;
    clearTimeout(nativeTimer); nativeTimer = null;
    engine = 'audio';
    if (synth) { try { synth.cancel(); } catch {} }
    nativeUtterance = null;
    voicePreference = 'offline';
    $('#voice-select').value = 'offline';
    $('#voice-help').textContent = '裝置語音未能啟動，已切換至內建粵語。也可重新選擇裝置聲音。';
    playAudio(expected,true);
  }
  function playNative(expected,voice) {
    engine = 'native';
    const utterance = new SpeechSynthesisUtterance(current.text);
    nativeUtterance = utterance; // Safari must retain the utterance for its whole lifetime.
    utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = rate; utterance.pitch = 1;
    utterance.onstart = () => { if (engine === 'native' && nativeUtterance === utterance) markPlaying(expected); };
    utterance.onend = () => { if (engine === 'native' && nativeUtterance === utterance) finish(expected); };
    utterance.onpause = () => { if (expected === token && engine === 'native' && nativeUtterance === utterance) { setState('paused'); announce('已暫停，按「繼續」接着聽。'); } };
    utterance.onresume = () => { if (expected === token && engine === 'native' && nativeUtterance === utterance) { setState('playing'); announce('正在朗讀粵語'); } };
    utterance.onboundary = event => {
      if (expected !== token || engine !== 'native' || nativeUtterance !== utterance || !current || current.text !== current.block.text || mode !== 'sentence') return;
      if (!Number.isFinite(event.charIndex) || event.charIndex < 0 || event.charIndex >= current.text.length) return;
      nativeBoundary = current.block.words.find(unit => unit.audio && unit.start <= event.charIndex && unit.end > event.charIndex) || null;
      activateGlow(); setProgress(event.charIndex/current.text.length);
    };
    utterance.onerror = event => {
      if (expected === token && !['canceled','interrupted'].includes(event.error)) nativeFallback(expected);
    };
    try {
      synth.speak(utterance);
      nativeTimer = setTimeout(() => { if (expected === token && playState === 'loading') nativeFallback(expected); },4000);
    } catch { nativeFallback(expected); }
  }
  function play(item) {
    halt(false);
    refreshVoices();
    current = {...item,timings:timedRanges(item)}; const expected = token;
    $('#current-text').textContent = item.text;
    $('#selection-kind').textContent = modeNames[mode]+'點讀';
    setState('loading'); announce('正在準備讀音…');
    const voice = item.lang === 'yue' ? selectedVoice() : null;
    if (voice && synth && typeof SpeechSynthesisUtterance !== 'undefined') playNative(expected,voice);
    else playAudio(expected,false);
  }
  function togglePause() {
    if (!current) {
      for (const block of book.pages[page].blocks) {
        const units = mode === 'sentence' ? [{text:block.text,audio:block.audio,start:0,end:block.text.length}]
          : mode === 'character' && block.characters.length ? block.characters : block.words;
        const unit = units.find(item => item.audio);
        if (unit) { play(itemFor(block,unit)); return; }
      }
      announce('這一頁暫未提供讀音，請翻到另一頁。','error');
      return;
    }
    if (['idle','ended','error'].includes(playState)) { play(current); return; }
    if (playState === 'paused') {
      if (engine === 'native') { try { synth.resume(); setState('playing'); announce('正在朗讀粵語'); } catch { play(current); } }
      else { player.play().then(()=>{ setState('playing'); announce('正在朗讀粵語'); }).catch(()=>failPlayback()); }
    } else if (playState === 'playing') {
      if (engine === 'native') synth.pause(); else player.pause();
      setState('paused'); announce('已暫停，按「繼續」接着聽。');
    }
  }
  player.addEventListener('loadedmetadata',()=>{ if (engine === 'audio') setProgress(0); });
  player.addEventListener('durationchange',()=>{ if (engine === 'audio' && player.duration > 0) setProgress(player.currentTime/player.duration); });
  $('#audio-seek').addEventListener('input',()=>{
    if (engine !== 'audio' || !Number.isFinite(player.duration) || player.duration <= 0) return;
    if (playState === 'ended') setState('paused');
    player.currentTime = player.duration * Number($('#audio-seek').value) / 100;
    setProgress(player.currentTime/player.duration); activateGlow();
  });
  player.addEventListener('ended',()=>{ if (engine === 'audio' && player.ended) finish(audioToken); });
  player.addEventListener('error',()=>{ if (engine === 'audio' && player.error && player.getAttribute('src')) failPlayback(); });
  player.addEventListener('timeupdate',()=>{ if (engine === 'audio' && Number.isFinite(player.duration) && player.duration>0) { setProgress(player.currentTime/player.duration); activateGlow(); } });
  function itemFor(block,unit) {
    return {block,unit,audio:unit.audio,lang:block.lang,text:mode === 'sentence' ? (block.speech || block.text) : unit.text};
  }
  function renderHotspots() {
    const fragment = document.createDocumentFragment();
    for (const block of book.pages[page].blocks) {
      const units = mode === 'sentence' ? [{text:block.text,audio:block.audio,start:0,end:block.text.length}]
        : mode === 'character' && block.characters.length ? block.characters : block.words;
      for (const row of block.lines) for (const unit of units) {
        if (!unit.audio || unit.end<=row.start || unit.start>=row.end) continue;
        const start=Math.max(unit.start,row.start)-row.start, end=Math.min(unit.end,row.end)-row.start;
        const [x,y,w,h]=row.rect;
        const button=el('button','hotspot');
        button.type='button'; button.style.left=((x+w*start/row.text.length)*100)+'%';
        button.style.top=(y*100)+'%'; button.style.width=((w*(end-start)/row.text.length)*100)+'%'; button.style.height=(h*100)+'%';
        button.dataset.audio=unit.audio; button.dataset.block=block.id; button.dataset.start=unit.start;
        button.setAttribute('aria-label','朗讀'+(block.lang==='en'?'英語':'粵語')+'：'+unit.text);
        button.setAttribute('aria-pressed','false'); button.addEventListener('click',()=>play(itemFor(block,unit)));
        fragment.append(button);
      }
    }
    $('#hotspots').replaceChildren(fragment);
  }
  function resizePage() {
    if (document.body.dataset.view !== 'reader') return;
    const small=matchMedia('(max-width:580px)').matches;
    const availableWidth=Math.max(100,viewport.clientWidth-(small?16:136));
    const availableHeight=Math.max(100,viewport.clientHeight-(small?16:36));
    const item=book.pages[page], ratio=item.pdfWidth/item.pdfHeight, zoom=$('#zoom').value;
    const width=zoom==='fit'?Math.min(availableWidth,availableHeight*ratio)
      :zoom==='width'?availableWidth:item.pdfWidth*96/72*Number(zoom);
    paper.style.width=width+'px'; paper.style.aspectRatio=item.pdfWidth+' / '+item.pdfHeight;
    document.body.dataset.zoomed=width>availableWidth?'true':'false';
  }
  function cancelPageTurn() {
    turnToken++;
    if (turnAnimation) turnAnimation.cancel();
    turnAnimation=null; pendingTurn=null;
    paper.querySelectorAll('.page-turn').forEach(layer=>layer.remove());
    paper.dataset.turning='false';
  }
  function readyPage(expected) {
    if (expected !== turnToken) return;
    turnAnimation=null; pendingTurn=null;
    paper.querySelectorAll('.page-turn').forEach(layer=>layer.remove());
    paper.dataset.turning='false'; paper.setAttribute('aria-busy','false');
    imageReady=true; $('#hotspots').hidden=false; setState(playState);
  }
  function loadedImage() {
    if (image.currentSrc && image.currentSrc !== new URL(book.pages[page].image,location.href).href) return;
    if (turnAnimation) return;
    const turn=pendingTurn;
    if (!turn) { readyPage(turnToken); return; }
    pendingTurn=null;
    const layer=el('div','page-turn'); layer.setAttribute('aria-hidden','true');
    const leaf=el('div','page-turn-leaf');
    function pageCopy(source,className) {
      const copy=el('img',className); copy.src=source; copy.alt=''; copy.draggable=false; return copy;
    }
    if (turn.direction<0) layer.append(pageCopy(turn.source,'page-turn-underlay'));
    leaf.append(pageCopy(turn.direction>0?turn.source:image.currentSrc,'page-turn-image'));
    layer.append(leaf); paper.append(layer);
    paper.dataset.turning='true'; paper.dataset.turnDirection=turn.direction>0?'next':'previous';
    const frames=turn.direction>0
      ? [{transform:'rotateY(0deg)'},{transform:'rotateY(-100deg)'}]
      : [{transform:'rotateY(-100deg)'},{transform:'rotateY(0deg)'}];
    turnAnimation=leaf.animate(frames,{duration:420,easing:'cubic-bezier(.25,.65,.2,1)',fill:'forwards'});
    turnAnimation.finished.then(()=>readyPage(turn.token)).catch(()=>{});
  }
  image.addEventListener('load',loadedImage);
  image.addEventListener('error',()=>{
    cancelPageTurn(); imageReady=false; paper.setAttribute('aria-busy','false'); $('#hotspots').hidden=true;
    setState(playState); announce('書頁未能載入，請重新整理或使用完整下載包。','error');
  });
  function renderPage(direction) {
    const source=image.currentSrc || image.src;
    const canTurn=imageReady && direction && !matchMedia('(prefers-reduced-motion: reduce)').matches && typeof paper.animate==='function';
    cancelPageTurn();
    imageReady=false; $('#hotspots').hidden=true; paper.setAttribute('aria-busy','true'); setState(playState);
    if (canTurn) pendingTurn={source,direction,token:turnToken};
    const item=book.pages[page];
    image.alt='《'+book.title+'》原書第 '+(page+1)+' 頁：'+item.title;
    image.src=item.image; $('#page-select').value=String(page+1);
    $('#previous-page').disabled=$('#previous-side').disabled=page===0;
    $('#next-page').disabled=$('#next-side').disabled=page===book.pages.length-1;
    renderHotspots(); resizePage();
    storage.set('library-position:'+book.id,page);
    if (image.complete && image.naturalWidth) loadedImage();
  }
  function updateURL(push) {
    try {
      const url=new URL(location.href);
      if (document.body.dataset.view==='reader') { url.searchParams.set('book',book.id); url.searchParams.set('page',String(page+1)); }
      else { url.searchParams.delete('book'); url.searchParams.delete('page'); }
      history[push?'pushState':'replaceState'](null,'',url);
    } catch {}
  }
  function navigate(index) {
    const next=Math.max(0,Math.min(book.pages.length-1,index));
    if (next===page) return;
    const direction=next-page; stop(true); page=next; renderPage(direction); updateURL(false);
    viewport.scrollTop=0; viewport.scrollLeft=0;
  }
  function showReader(id,index,update) {
    halt(true); book=books.find(item=>item.id===id)||books[0];
    page=Math.max(0,Math.min(book.pages.length-1,Number.isInteger(index)?index:(savedPage(book)??0)));
    $('#reader-view').setAttribute('tabindex','-1');
    document.body.dataset.view='reader'; $('#library-view').hidden=true; $('#reader-view').hidden=false;
    document.title=book.title+'｜點點書房';
    $('#header-book').hidden=false; $('#header-book').textContent=book.title; $('#reader-title').textContent=book.title;
    $('#page-select').replaceChildren(...book.pages.map((_,i)=>new Option((i+1)+' / '+book.pages.length,String(i+1))));
    $('#page-total').textContent='/ '+book.pages.length;
    $('#current-text').textContent='想聽哪一段？直接點一下書上的文字。'; announce('點書上的'+modeNames[mode]+'，聽聽怎麼讀。');
    renderPage(); updateModes();
    if (update!==false) { updateURL(true); $('#reader-view').focus({preventScroll:true}); }
  }
  function showLibrary(update) {
    cancelPageTurn();
    document.title='點點書房｜粵語繪本遊樂園';
    halt(true); document.body.dataset.view='library'; $('#library-view').hidden=false; $('#reader-view').hidden=true; $('#header-book').hidden=true;
    renderLibrary(); if (update!==false) { updateURL(true); $('#continue-reading').focus({preventScroll:true}); } window.scrollTo(0,0);
  }
  function renderLibrary() {
    const query=$('#book-search').value.trim().toLocaleLowerCase();
    const active=books.filter(item=>!archivedBooks.has(item.id));
    const visible=books.filter(item=>archivedBooks.has(item.id)===(shelfView==='archived'));
    const matches=visible.filter(item=>(item.title+' '+item.author+' '+(item.category||'')).toLocaleLowerCase().includes(query));
    $('#active-count').textContent=String(active.length); $('#archived-count').textContent=String(books.length-active.length);
    $$('[data-shelf]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.shelf===shelfView)));
    $('#book-count').textContent=visible.length+(shelfView==='archived'?' 本已封存':' 本點讀書');
    const fragment=document.createDocumentFragment();
    for (const item of matches) {
      const card=el('article','shelf-item'), open=el('button','book-open');
      card.dataset.bookId=item.id;
      open.setAttribute('aria-label','閱讀《'+item.title+'》');
      const windowEl=el('span','cover-window'), thumbnail=el('img');
      thumbnail.src=item.pages[Math.min(item.pages.length-1,(item.coverPage||3)-1)].image; thumbnail.alt=''; windowEl.append(thumbnail);
      open.append(windowEl,el('span','cover-series',item.category||'粵語點讀'),el('span','cover-title',item.title),el('span','cover-author',item.author+' 著'),el('span','cover-tab'));
      open.addEventListener('click',()=>showReader(item.id));
      const title=el('h3',null,item.title), metadata=el('p','book-meta',item.author+' 著　'+item.pages.length+' 頁');
      const details=el('div','book-details'); details.append(title,metadata);
      const position=savedPage(item), link=el('button','book-reading-link');
      const glyph=el('span'); glyph.innerHTML=icon('play');
      link.append(glyph,el('span',null,position===null?'開始閱讀':'繼續第 '+(position+1)+' 頁'));
      link.addEventListener('click',()=>showReader(item.id));
      const actions=el('div','book-actions'); actions.append(link);
      const archived=archivedBooks.has(item.id), archive=el('button','archive-button');
      const archiveIcon=el('span'); archiveIcon.innerHTML=icon(archived?'restore':'archive');
      archive.append(archiveIcon,el('span',null,archived?'恢復到書架':'封存'));
      archive.setAttribute('aria-label',(archived?'恢復':'封存')+'《'+item.title+'》');
      archive.addEventListener('click',()=>{
        if (archived) archivedBooks.delete(item.id); else archivedBooks.add(item.id);
        storage.set('library-archived-books',JSON.stringify([...archivedBooks]));
        renderLibrary();
        $('#library-status').textContent=archived?'已將《'+item.title+'》恢復到書架。':'已封存《'+item.title+'》，可到「已封存」隨時恢復。';
        $('[data-shelf="'+(archived?'active':'archived')+'"]').focus();
      });
      actions.append(archive);
      card.append(open,details,actions); fragment.append(card);
    }
    $('#books-grid').replaceChildren(fragment); $('#empty-search').hidden=matches.length>0; $('#shelf-rail').hidden=!matches.length;
    const empty=$('#empty-search');
    empty.querySelector('h3').textContent=query?'還沒有找到這本書':shelfView==='archived'?'還沒有封存的書籍':'書架暫時沒有書';
    empty.querySelector('p').textContent=query?'試試書名或作者，或清除搜尋看看這個書架。':shelfView==='archived'?'封存後的書會放在這裏，隨時都可以恢復。':'封存的書本仍然保留，想讀的時候可以隨時恢復。';
    $('#clear-search').textContent=query?'顯示全部書籍':shelfView==='archived'?'返回閱讀中':'查看已封存書籍';
    $('#clear-search').onclick=()=>{
      if (query) { $('#book-search').value=''; renderLibrary(); $('#book-search').focus(); }
      else selectShelf(shelfView==='archived'?'active':'archived',true);
    };
    const first=active.find(item=>savedPage(item)!==null)||active[0];
    $('#continue-label').textContent=first?(savedPage(first)===null?'打開我的第一本書':'繼續閱讀《'+first.title+'》'):'查看已封存書籍';
    $('#continue-reading').onclick=()=>{
      if (first) showReader(first.id);
      else { selectShelf('archived',true); $('.library-section').scrollIntoView({block:'start'}); }
    };
  }
  function selectShelf(view,focus) {
    shelfView=view; $('#library-status').textContent=''; renderLibrary();
    if (focus) $('[data-shelf="'+view+'"]').focus();
  }
  function updateModes() {
    $$('[data-mode]').forEach(button=>{
      const selected = button.dataset.mode === mode;
      button.setAttribute('aria-pressed',String(selected)); button.tabIndex = selected ? 0 : -1;
    });
    $('#selection-kind').textContent=modeNames[mode]+'點讀';
    $('#mode-badge').textContent=modeNames[mode][0];
    $('#mode-settings summary').setAttribute('aria-label','點讀方式：'+modeNames[mode]);
  }
  $$('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
    if (mode !== button.dataset.mode) {
      stop(true); mode=button.dataset.mode; storage.set('library-reading-mode',mode); updateModes(); renderHotspots();
      announce('點書上的'+modeNames[mode]+'，聽聽怎麼讀。');
    }
    if (!button.dataset.keyboard) { $('#mode-settings').open=false; $('#mode-settings summary').focus(); }
  }));
  $('.mode-group').addEventListener('keydown',event=>{
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const buttons=$$('[data-mode]'), index=buttons.indexOf(document.activeElement);
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
    buttons[next].dataset.keyboard='true'; buttons[next].click(); delete buttons[next].dataset.keyboard; buttons[next].focus();
  });
  $('#reader-back').addEventListener('click',()=>showLibrary());
  for (const id of ['#previous-page','#previous-side']) $(id).addEventListener('click',()=>navigate(page-1));
  for (const id of ['#next-page','#next-side']) $(id).addEventListener('click',()=>navigate(page+1));
  $('#page-select').addEventListener('change',event=>navigate(Number(event.target.value)-1));
  $('#zoom').addEventListener('change',()=>{ resizePage(); viewport.scrollTop=0; viewport.scrollLeft=0; });
  $('#home').addEventListener('click',()=>showLibrary());
  $('#shelf-link').addEventListener('click',()=>showLibrary());
  $('#book-search').addEventListener('input',renderLibrary);
  $$('[data-shelf]').forEach(button=>button.addEventListener('click',()=>selectShelf(button.dataset.shelf)));
  $('#stop').addEventListener('click',()=>stop(false));
  $('#pause').addEventListener('click',togglePause);
  $('#replay').addEventListener('click',()=>{ if (current) play(current); });
  $('#playback-rate').value=String(rate);
  function rateLabel() { $('#rate-label').textContent=Number($('#playback-rate').value).toFixed(2)+' 倍'; }
  rateLabel();
  $('#playback-rate').addEventListener('input',rateLabel);
  $('#playback-rate').addEventListener('change',()=>{
    rate=Number($('#playback-rate').value); storage.set('library-reading-rate',rate);
    if (engine==='audio') player.playbackRate=rate;
    else if (engine==='native' && playState==='playing' && current) play(current);
  });
  $('#voice-select').addEventListener('change',()=>{
    voicePreference=$('#voice-select').value; storage.set('library-reading-voice',voicePreference);
    if (['playing','paused','loading'].includes(playState) && current) play(current);
  });
  if (synth && synth.addEventListener) synth.addEventListener('voiceschanged',refreshVoices);
  $('#voice-settings').addEventListener('toggle',()=>{ if ($('#voice-settings').open) refreshVoices(); });
  refreshVoices();
  for (const id of ['#mode-settings','#voice-settings']) $(id).addEventListener('toggle',()=>{
    if ($(id).open) for (const other of ['#mode-settings','#voice-settings']) if (other !== id) $(other).open=false;
  });
  document.addEventListener('click',event=>{
    for (const id of ['#mode-settings','#voice-settings']) {
      const details=$(id); if (details.open && !details.contains(event.target)) details.open=false;
    }
  });
  document.addEventListener('keydown',event=>{
    if (event.key==='Escape') {
      const open=$('#mode-settings[open],#voice-settings[open]');
      if (open) { open.open=false; open.querySelector('summary').focus(); }
      else stop(false);
      return;
    }
    if (document.body.dataset.view!=='reader' || event.target.closest('input,select,textarea') || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.key==='ArrowLeft') { event.preventDefault(); navigate(page-1); }
    if (event.key==='ArrowRight') { event.preventDefault(); navigate(page+1); }
  });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resizePage).observe(viewport);
  else window.addEventListener('resize',resizePage);
  window.addEventListener('pagehide',()=>{ halt(true); cancelPageTurn(); });
  function route() {
    const query=new URLSearchParams(location.search), id=query.get('book'), number=Number(query.get('page'));
    if (id || number>0) showReader(id||books[0].id,number>0?number-1:undefined,false);
    else showLibrary(false);
  }
  window.addEventListener('popstate',route);
  window.readerDiagnostics=()=>({view:document.body.dataset.view,book:book.id,page:page+1,mode,current:current?current.text:null,
    playing:playState==='playing',state:playState,engine,currentTime:engine==='audio'?player.currentTime:0,
    audioSource:player.getAttribute('src'),duration:Number.isFinite(player.duration)?player.duration:null,
    playbackRate:rate,imageReady,turning:paper.dataset.turning==='true',glowCount:$('#glow-layer').children.length,voiceCount:voices.length,
    highlightedText:$('#glow-layer').dataset.text || null, timingCount:current?current.timings.length:0,
    nativeBoundary:nativeBoundary?nativeBoundary.text:null,nativeHeld:!!nativeUtterance});
  route();
})();
