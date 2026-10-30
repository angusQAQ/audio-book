#!/usr/bin/env python3
"""Check source integrity, original-page assets, point-reading mappings and speech."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def validate(require_edge=False):
    library = json.loads((ROOT / 'library.json').read_text())
    wrapper = (ROOT / 'library.js').read_text()
    assert json.loads(wrapper.removeprefix('window.READING_LIBRARY = ').strip().removesuffix(';')) == library
    references = 0
    audio_count = 0
    page_count = 0
    for book in library['books']:
        pdf = ROOT / book['source']['url']
        assert hashlib.sha256(pdf.read_bytes()).hexdigest() == book['source']['sha256'], 'Original PDF changed'
        assert len(book['pages']) == book['source']['pages']
        if book['id'] == 'our-good-teacher':
            assert len(book['pages']) == 11
        for page in book['pages']:
            assert (ROOT / page['image']).is_file(), 'Missing original page'
            page_count += 1
            if page.get('imageSha256'):
                assert hashlib.sha256((ROOT / page['image']).read_bytes()).hexdigest() == page['imageSha256'], 'Reader page differs from its verified render'
            for block in page['blocks']:
                assert block['audio'] in book['audio']
                for line in block['lines']:
                    assert (ROOT / line['glow']).is_file()
                    assert 0 <= line['start'] < line['end'] <= len(block['text'])
                    assert block['text'][line['start']:line['end']] == line['text']
                    x, y, w, h = line['rect']
                    assert 0 <= x < 1 and 0 <= y < 1 and w > 0 and h > 0 and x + w <= 1.01 and y + h <= 1.01
                    if line.get('charRects'):
                        assert len(line['charRects']) == len(line['text']), 'Mixed-font character geometry missing'
                        for cx, cy, cw, ch in line['charRects']:
                            assert x - 1e-6 <= cx and y - 1e-6 <= cy and cw > 0 and ch > 0
                            assert cx+cw <= x+w+1e-6 and cy+ch <= y+h+1e-6
                        assert hashlib.sha256((ROOT / line['glow']).read_bytes()).hexdigest() == line['glowSha256']
                for unit in block['words'] + block['characters']:
                    assert block['text'][unit['start']:unit['end']] == unit['text']
                    if unit['audio']:
                        assert unit['audio'] in book['audio']
                        references += 1
        if require_edge:
            assert book['voice']['name'] == 'zh-HK-HiuMaanNeural', 'Requested Edge voice has not been generated'
            assert book['voice']['rate'] == '-12%'
        for asset in book['audio'].values():
            path = ROOT / asset['src']
            assert path.is_file() and path.stat().st_size > 500, f'Missing MP3: {path.name}'
            result = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(path)], capture_output=True, text=True, check=True)
            assert float(result.stdout.strip()) > 0
            if require_edge:
                assert asset['voice'] == 'zh-HK-HiuMaanNeural' and asset['rate'] == '-12%' and asset['engine'] == 'edge-tts'
                assert hashlib.sha256(path.read_bytes()).hexdigest() == asset['sha256']
                assert asset.get('timingSchema') == 1 and asset.get('boundaries'), 'Real speech word timestamps missing'
                previous = -1
                for boundary in asset['boundaries']:
                    assert 0 <= boundary['start'] < boundary['end'] <= len(asset['text'])
                    assert boundary['time'] >= previous and boundary['duration'] > 0
                    assert boundary['time'] + boundary['duration'] <= asset['duration'] + 0.5
                    previous = boundary['time']
            audio_count += 1
    print(f'PASS: {len(library["books"])} preserved book PDFs, {page_count} verified pages, {audio_count} decodable MP3 references, {references} word/character mappings, matching JSON/JS.' + (' Requested Edge voice verified.' if require_edge else ''))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--require-edge', action='store_true')
    validate(parser.parse_args().require_edge)
