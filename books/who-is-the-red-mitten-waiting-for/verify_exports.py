#!/usr/bin/env python3
"""Check actual Office/SVG renders against the shared native book layout."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re

import fitz
from PIL import Image, ImageChops, ImageDraw

import build_book as book


def normalized(text):
    return Counter(re.sub(r'\s', '', text))


def verify(office_pdf, svg_renders):
    layouts = book.pages(False)
    document = fitz.open(office_pdf)
    assert len(document) == len(layouts)
    fonts, marks, collision_checks = set(), 0, 0
    thumbnails = []
    for layout, page in zip(layouts, document):
        text_items = [item for item in layout['items'] if item['kind'] == 'text']
        assert normalized(''.join(item['text'] for item in text_items)) == normalized(page.get_text()), (layout['id'], 'Office text changed')
        spans = [span for block in page.get_text('rawdict')['blocks'] if 'lines' in block
                 for line in block['lines'] for span in line['spans']]
        fonts.update(span['font'] for span in spans)
        expected = Counter((ch, round(size, 1)) for item in text_items
                           for ch, family, size in zip(item['text'], item['fonts'], item['sizes']) if family == book.HAND_FAMILY)
        actual = Counter((char['c'], round(span['size'], 1)) for span in spans if book.HAND_FAMILY in span['font'] for char in span['chars'])
        assert actual == expected, (layout['id'], 'Office target font/size changed')
        expected_normal = Counter((ch, round(size, 1)) for item in text_items
                                  for ch, size in zip(item['text'], item['sizes']) if ch in book.NORMAL_CHARACTERS)
        actual_normal = Counter((char['c'], round(span['size'], 1)) for span in spans
                                if span['font'] == 'Iansui-Regular' for char in span['chars'] if char['c'] in book.NORMAL_CHARACTERS)
        assert actual_normal == expected_normal, (layout['id'], 'Office ordinary character font/size changed')
        rules = [drawing for drawing in page.get_drawings() if len(drawing['items']) == 1 and drawing['items'][0][0] == 'l']
        expected_rules = [(item, mark) for item in text_items for mark in item['nameMarks']]
        assert len(rules) == len(expected_rules), (layout['id'], 'Office proper-name marks missing')
        for (item, mark), drawing in zip(expected_rules, rules):
            x = item['x'] + mark['x']; y = item['y'] + item['ascent'] + book.NAME_MARK['baselineOffset']
            expected_line = (x, y, x + mark['width'], y)
            actual_line = tuple(drawing['items'][0][1]) + tuple(drawing['items'][0][2])
            assert all(abs(a-b) < .15 for a,b in zip(expected_line, actual_line)), (layout['id'], 'Office name rule moved')
            marks += 1
        if layout['id'].startswith('s'):
            art = next(item for item in layout['items'] if item['kind'] == 'image')
            geometry = book.image_geometry(art)
            with Image.open(art['path']) as source:
                image = source.convert('RGB'); width, height = image.size
                for item in text_items:
                    if item['size'] < 11: continue
                    box = (max(0,int((item['x']-geometry['full_x'])/geometry['full_width']*width)),
                           max(0,int((item['y']-geometry['full_y'])/geometry['full_height']*height)),
                           min(width,int((item['x']+item['width']-geometry['full_x'])/geometry['full_width']*width)),
                           min(height,int((item['y']+item['height']-geometry['full_y'])/geometry['full_height']*height)))
                    if box[2] <= box[0] or box[3] <= box[1]: continue
                    channels = image.crop(box).split()
                    minimum = ImageChops.darker(ImageChops.darker(channels[0],channels[1]),channels[2])
                    histogram = minimum.histogram()
                    fraction = sum(histogram[:215])/sum(histogram)
                    assert fraction <= .015, (layout['id'], item['text'], 'Ink beneath story text', fraction)
                    collision_checks += 1
        pix = page.get_pixmap(matrix=fitz.Matrix(1,1))
        thumb = Image.frombytes('RGB',(pix.width,pix.height),pix.samples); thumb.thumbnail((320,200))
        tile = Image.new('RGB',(336,228),'#e9ece9'); tile.paste(thumb,(8,18)); ImageDraw.Draw(tile).text((8,3),layout['id'],fill='#303536')
        thumbnails.append(tile)
    assert fonts == {'Iansui-Regular','JyunsaiKaai-Bold'}, ('Unexpected Office font substitution',fonts)
    facts = json.loads((book.ROOT/'sources/radical-check.json').read_text())['entries']
    for character in book.TARGETS: assert facts[character]['kRSUnicode'].split('.')[0] == str(book.BOOK['radical']['kangxiNumber'])
    for character,radical in book.BOOK['learning']['choiceRadicals'].items():
        assert facts[character]['kRSUnicode'].split('.')[0] == str(radical)
    for name in ('s10','lesson'):
        with Image.open(svg_renders/(name+'.png')) as image:
            assert image.size == (book.W,book.H)
            image.verify()
    sheet = Image.new('RGB',(1008,228*((len(thumbnails)+2)//3)),'white')
    for index,tile in enumerate(thumbnails): sheet.paste(tile,((index%3)*336,(index//3)*228))
    sheet.save(office_pdf.parent/'office-contact.png')
    report = {
        'status':'verified','date':'2026-11-02','officePages':len(document),
        'officeTextMatchesEveryPage':True,'actualOfficeFonts':sorted(fonts),
        'officeTargetFontAndSizeVerified':True,'properNameRulesVerified':marks,
        'ordinaryCharactersNotEnlarged':sorted(book.NORMAL_CHARACTERS),
        'storyTextImageCollisionChecks':collision_checks,'radicalEntriesVerified':len(facts),
        'svgActualRenders':['s10','lesson'],
        'officeRenderedPdfSha256':hashlib.sha256(office_pdf.read_bytes()).hexdigest(),
        'files':{path.name:hashlib.sha256(path.read_bytes()).hexdigest() for path in (book.ROOT/'exports').iterdir() if path.suffix in ('.pdf','.pptx')},
        'scope':'Actual LibreOffice PDF and Inkscape PNG checks; not Microsoft PowerPoint, print production or audio verification.'
    }
    (book.ROOT/'exports/render-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--office-pdf',type=Path,required=True)
    parser.add_argument('--svg-renders',type=Path,required=True)
    args = parser.parse_args()
    verify(args.office_pdf,args.svg_renders)
