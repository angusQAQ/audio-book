#!/usr/bin/env python3
"""Build exact-layout page assets and a pending book manifest, without changing the shelf.

The audio workflow registers this manifest only after every MP3 and real WordBoundary
has been generated. Rebuilding never substitutes placeholder audio in the live library.
"""
from collections import Counter
import hashlib
import json
from pathlib import Path
import re

import fitz
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfbase import pdfmetrics

import build_book as layout

ROOT = Path(__file__).resolve().parents[2]
BOOK_ROOT = Path(__file__).resolve().parent
OUT = BOOK_ROOT / 'reader'
LEXICON = set('''琪琪 樂樂 白兔 白兔雲 小風車 風車 一趟 起風 加快 腳步 趕路 一點 一片 發亮 葉子 自己 影子 起來 一隻 小蟲 招呼 越過 小水窪 水窪 停下 等會兒 耳朵 回去 怎麼 一條 大魚 小坡 抬起 遠遠 天上 越走 趕不上 放下 落葉 走回 好嗎 慢慢 一步 一直 指着 地方 白白 安安靜靜 原來 這裏 水裏 小風 一陣 旁邊 多了 一艘 小船 蹲下 再走 哪裏 路上 還有 甚麼 有趣 他們 不再 急着 身旁 輕輕 看見 新的 這一次 一起 部首 故事 走字旁 字裏 小路 六個 走部 陪我們 先看 再想 意思 這一家 左邊 長長 捺筆 托住 部件 趁風 把握 合適 時候 哪個 走部字 發現 有時 慢一點 這一趟 每一個 路上的人 原創 繁體 中文 繪本'''.split())


def relative(path):
    return str(path.relative_to(ROOT))


def union(rects):
    x = min(r[0] for r in rects); y = min(r[1] for r in rects)
    right = max(r[0] + r[2] for r in rects); bottom = max(r[1] + r[3] for r in rects)
    return [x, y, right - x, bottom - y]


def sentence_ranges(text):
    start = 0
    for match in re.finditer(r'[。！？][」』）】]*', text):
        yield start, match.end()
        start = match.end()
    if start < len(text):
        yield start, len(text)


def word_ranges(text):
    cursor = 0
    while cursor < len(text):
        match = next((text[cursor:cursor+n] for n in range(min(5, len(text)-cursor), 1, -1)
                      if text[cursor:cursor+n] in LEXICON), text[cursor])
        yield cursor, cursor + len(match)
        cursor += len(match)


def rows_for(items):
    cursor = 0
    rows = []
    for item in items:
        cells = []
        x = item['x']; baseline = item['y'] + item['ascent']
        for ch, family, fs, advance in zip(item['text'], item['fonts'], item['sizes'], item['advances']):
            ascent = pdfmetrics.getAscent(family) * fs / 1000
            descent = -pdfmetrics.getDescent(family) * fs / 1000
            cells.append([x / layout.W, (baseline - ascent) / layout.H,
                          advance / layout.W, (ascent + descent) / layout.H])
            x += advance
        rows.append(dict(text=item['text'], start=cursor, end=cursor+len(item['text']),
                         charRects=cells, rect=union(cells), item=item))
        cursor += len(item['text'])
    return rows


def write_glow(row, name):
    # Render text alone from the same font metrics; never paint over the artwork.
    scale = 4
    x, y, w, h = row['rect']; x *= layout.W; y *= layout.H
    image = Image.new('RGBA', (max(1, round(w * layout.W * scale)), max(1, round(h * layout.H * scale))))
    draw = ImageDraw.Draw(image)
    item = row['item']; cursor = item['x']; baseline = item['y'] + item['ascent']
    for ch, family, fs, advance in zip(item['text'], item['fonts'], item['sizes'], item['advances']):
        font = ImageFont.truetype(str(layout.FONTS[family]), round(fs * scale))
        draw.text(((cursor-x)*scale, (baseline-y)*scale), ch, font=font, anchor='ls', fill=(12,174,186,255))
        cursor += advance
    path = OUT / 'glow' / (name + '.png')
    image.save(path)
    return relative(path)


def main():
    (OUT / 'pages').mkdir(parents=True, exist_ok=True)
    (OUT / 'glow').mkdir(parents=True, exist_ok=True)
    pdf = BOOK_ROOT / 'exports/走！去找那朵雲_跨頁閱讀版.pdf'
    document = fitz.open(pdf)
    pages = layout.pages(False)
    existing = json.loads((ROOT / 'library.json').read_text())
    reusable = {(a['text'], a.get('lang', 'yue')): a for b in existing['books'] for a in b['audio'].values()}
    audio = {}

    def asset(text):
        if not any(ch.isalnum() for ch in text):
            return None
        spoken = text
        key = hashlib.sha256(('yue\0' + spoken).encode()).hexdigest()[:18]
        if key not in audio:
            saved = reusable.get((spoken, 'yue'))
            audio[key] = dict(saved, id=key) if saved else dict(id=key, text=spoken, lang='yue')
        return key

    def unit(text, start, end):
        result = dict(text=text[start:end], start=start, end=end, audio=asset(text[start:end]))
        result.update(pronunciation(result['text'], start))
        return result

    def pronunciation(text, offset=0):
        # Printed and spoken Traditional Chinese are identical in this book.
        return {}

    reader_pages = []
    for page_index, page in enumerate(pages):
        path = OUT / 'pages' / (page['id'] + '.jpg')
        pix = document[page_index].get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        pix.pil_save(path, format='JPEG', quality=95, subsampling=0, optimize=True)
        text_items = [i for i in page['items'] if i['kind'] == 'text' and i['size'] > 11]
        if page['id'].startswith('s'):
            groups = [text_items]
        elif page['id'] == 'cover':
            groups = [text_items[:1], text_items[1:]]
        elif page['id'] == 'title':
            groups = [text_items[:2], text_items[2:4], text_items[4:5]]
        elif page['id'] == 'back':
            # The print colophon stays visible; point reading covers the story's ending.
            groups = [text_items[:2], text_items[2:4], text_items[4:6]]
        else:
            groups = [[item] for item in text_items]
        blocks = []
        for group_index, group in enumerate(groups):
            if not group:
                continue
            rows = rows_for(group)
            text = ''.join(r['text'] for r in rows)
            for row_index, row in enumerate(rows):
                row['glow'] = write_glow(row, f'{page["id"]}-{group_index+1}-{row_index+1}')
                row['glowSha256'] = hashlib.sha256((ROOT / row['glow']).read_bytes()).hexdigest()
            for start, end in sentence_ranges(text):
                value = text[start:end]
                if not asset(value):
                    continue
                block = dict(id=f'p{page_index+1}-b{len(blocks)+1}', text=value,
                             role='body', lang='yue', audio=asset(value), lines=[])
                for row in rows:
                    left, right = max(start, row['start']), min(end, row['end'])
                    if left >= right:
                        continue
                    a, b = left-row['start'], right-row['start']
                    cells = row['charRects'][a:b]
                    # Retain the complete mask rectangle for correct mixed-font clipping.
                    block['lines'].append(dict(text=text[left:right], start=left-start, end=right-start,
                                               rect=union(cells), charRects=cells, glow=row['glow'],
                                               glowRect=row['rect'], glowSha256=row['glowSha256']))
                block['words'] = [unit(value, a, b) for a, b in word_ranges(value)]
                block['characters'] = [unit(value, a, a+1) for a, ch in enumerate(value) if ch.isalnum()]
                block.update(pronunciation(value))
                blocks.append(block)
        assert blocks, ('Missing point reading', page['id'])
        for block in blocks:
            assert ''.join(r['text'] for r in block['lines']) == block['text']
        if page['id'].startswith('s'):
            original = ''.join(layout.BOOK['spreads'][page_index-2]['lines'])
            assert ''.join(b['text'] for b in blocks) == original, ('Story text changed', page['id'])
        reader_pages.append(dict(title={'cover':'封面','title':'扉頁','lesson':'字裏有一條小路','back':'故事之後'}.get(page['id'], f'故事 {page_index-1}'),
                                 section='走部故事', printed=page['note'].split('。')[0], accent='sky',
                                 image=relative(path), imageSha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                                 pdfWidth=layout.W, pdfHeight=layout.H, blocks=blocks))
    cover = OUT / 'cover.jpg'
    document[0].get_pixmap(matrix=fitz.Matrix(2,2), clip=fitz.Rect(240,0,720,540), alpha=False).pil_save(cover, format='JPEG', quality=95, subsampling=0)
    book = dict(id='lets-find-that-cloud', title=layout.BOOK['title'], author='點點書房', locale='zh-HK',
                defaultPage=0, category='部首故事・走', coverPage=1, coverImage=relative(cover), pageUnit='跨頁',
                description='', pages=reader_pages, audio=audio,
                source=dict(filename=pdf.name, url=relative(pdf), pages=len(document),
                            sha256=hashlib.sha256(pdf.read_bytes()).hexdigest(),
                            method='144 dpi full-spread render of the latest embedded-font PDF; original PDF unchanged'),
                voice=dict(name='zh-HK-HiuMaanNeural', engine='edge-tts', rate='-12%', locale='zh-HK', version='7.3.1'))
    # Revision excludes generated audio metadata, so cached MP3 cannot change the input identity.
    identity = dict(book, audio={key: {k: value[k] for k in ('id','text','lang')} for key,value in audio.items()})
    book['contentRevision'] = hashlib.sha256(json.dumps(identity, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
    manifest = OUT / 'book.json'
    manifest.write_text(json.dumps(book, ensure_ascii=False, indent=2) + '\n')
    story_text = ''.join(block['text'] for page in reader_pages[2:16] for block in page['blocks'])
    manuscript = ''.join(''.join(spread['lines']) for spread in layout.BOOK['spreads'])
    assert story_text == manuscript
    names = {name: story_text.count(name) for name in layout.PROPER_NAMES}
    assert names == json.loads((BOOK_ROOT/'exports/validation.json').read_text())['properNameMarks']['names']
    for page, pdf_page in zip(pages, document):
        expected = ''.join(item['text'] for item in page['items'] if item['kind']=='text')
        assert Counter(re.sub(r'\s','',expected)) == Counter(re.sub(r'\s','',pdf_page.get_text())), ('Source PDF is stale',page['id'])
    report = dict(status='geometry-verified; audio registration is separate', pages=len(reader_pages),
                  blocks=sum(len(page['blocks']) for page in reader_pages), audioUnits=len(audio),
                  wordCharacterMappings=sum(len(block['words'])+len(block['characters']) for page in reader_pages for block in page['blocks']),
                  preservedNameOccurrences=names, sourcePdfSha256=book['source']['sha256'])
    (OUT/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(pages=len(reader_pages), blocks=sum(len(p['blocks']) for p in reader_pages),
                          audioUnits=len(audio), reused=sum('src' in a for a in audio.values()),
                          pending=sum('src' not in a for a in audio.values()), manifest=relative(manifest)), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
