#!/usr/bin/env python3
"""Generate all bundled speech with Edge TTS; publish metadata only after full success.

Existing verified cache entries can be resumed. The current site's audio remains intact
if any download, TLS verification, or MP3 validation fails.
"""
import argparse
import asyncio
import hashlib
import html
import unicodedata
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
VOICE = 'zh-HK-HiuMaanNeural'
RATE = '-12%'
TIMING_SCHEMA = 1


def duration(path):
    result = subprocess.run([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', str(path)
    ], check=True, capture_output=True, text=True)
    seconds = float(result.stdout.strip())
    if seconds <= 0 or path.stat().st_size < 500:
        raise ValueError(f'Empty audio: {path.name}')
    return seconds


def key_for(asset):
    return hashlib.sha256(json.dumps({
        'text': asset['text'], 'voice': VOICE, 'rate': RATE,
        'edge_tts': edge_tts.__version__, 'word_boundary_schema': TIMING_SCHEMA,
    }, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:24]


def aligned_boundaries(text, events):
    """Map real Edge word timestamps to original Unicode positions, ignoring punctuation."""
    normalized = []
    positions = []
    for index, character in enumerate(text):
        for letter in unicodedata.normalize('NFKC', character).casefold():
            if letter.isalnum():
                normalized.append(letter)
                positions.append(index)
    source = ''.join(normalized)
    cursor = 0
    boundaries = []
    for event in events:
        if event.get('type') != 'WordBoundary':
            continue
        token = ''.join(letter for letter in unicodedata.normalize('NFKC', html.unescape(event['text'])).casefold() if letter.isalnum())
        if not token:
            continue
        start = source.find(token, cursor)
        if start < 0:
            raise ValueError('Edge word boundary cannot be aligned to its source text')
        end = start + len(token)
        boundaries.append({
            'start': positions[start], 'end': positions[end - 1] + 1,
            'time': round(event['offset'] / 10_000_000, 6),
            'duration': round(event['duration'] / 10_000_000, 6),
        })
        cursor = end
    if not boundaries or cursor != len(source):
        raise ValueError('Edge word timestamps do not cover the spoken source')
    return boundaries


async def generate(jobs):
    library = json.loads((ROOT / 'library.json').read_text())
    cache = ROOT / '.cache' / 'edge-tts'
    cache.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(jobs)
    generated = {}
    locks = {}
    completed = 0
    total = sum(len(book['audio']) for book in library['books'])
    proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')

    async def one(asset):
        nonlocal completed
        key = key_for(asset)
        path = cache / f'{key}.mp3'
        receipt = cache / f'{key}.json'
        async with semaphore, locks.setdefault(key, asyncio.Lock()):
            valid = False
            if path.exists() and receipt.exists():
                stamp = json.loads(receipt.read_text())
                valid = stamp.get('sha256') == hashlib.sha256(path.read_bytes()).hexdigest() and stamp.get('timingSchema') == TIMING_SCHEMA and bool(stamp.get('boundaries'))
                if valid:
                    try:
                        duration(path)
                    except (ValueError, subprocess.CalledProcessError):
                        valid = False
            if not valid:
                for attempt in range(4):
                    partial = path.with_suffix('.partial.mp3')
                    metadata = path.with_suffix('.partial.jsonl')
                    try:
                        communicate = edge_tts.Communicate(
                            asset['text'], voice=VOICE, rate=RATE, proxy=proxy,
                            connect_timeout=20, receive_timeout=60, boundary='WordBoundary',
                        )
                        await communicate.save(str(partial), str(metadata))
                        timings = aligned_boundaries(asset['text'], [json.loads(line) for line in metadata.read_text().splitlines() if line.strip()])
                        metadata.unlink(missing_ok=True)
                        seconds = duration(partial)
                        partial.replace(path)
                        receipt.write_text(json.dumps({
                            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                            'duration': seconds, 'voice': VOICE, 'rate': RATE,
                            'timingSchema': TIMING_SCHEMA, 'boundaries': timings,
                        }))
                        break
                    except Exception as error:
                        partial.unlink(missing_ok=True)
                        metadata.unlink(missing_ok=True)
                        if attempt == 3 or getattr(error, 'status', None) in (401, 403):
                            raise
                        await asyncio.sleep(2 ** (attempt + 1))
            generated[key] = path
            asset.update({
                'src': f'assets/audio/{key}.mp3', 'voice': VOICE, 'rate': RATE,
                'engine': 'edge-tts', 'engineVersion': edge_tts.__version__,
                'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                'duration': duration(path),
                'timingSchema': TIMING_SCHEMA,
                'boundaries': json.loads(receipt.read_text())['boundaries'],
            })
            for name in ['ttsInput', 'jyutping', 'profile']:
                asset.pop(name, None)
            completed += 1
            if completed % 25 == 0 or completed == total:
                print(f'Generated / reused {completed}/{total} MP3 files', flush=True)

    # Fail the prerequisite once before scheduling the full library.
    first = next(iter(library['books'][0]['audio'].values()))
    await one(first)
    remaining = [asset for book in library['books'] for asset in book['audio'].values() if asset is not first]
    await asyncio.gather(*(one(asset) for asset in remaining))
    for book in library['books']:
        book['voice'] = {'name': VOICE, 'engine': 'edge-tts', 'rate': RATE, 'locale': 'zh-HK', 'version': edge_tts.__version__}
    # Every asset is generated and validated before the live directory changes.
    target = ROOT / 'assets' / 'audio'
    with tempfile.TemporaryDirectory(dir=cache, prefix='publish-') as staging:
        stage = Path(staging) / 'audio'
        stage.mkdir()
        for key, path in generated.items():
            shutil.copyfile(path, stage / f'{key}.mp3')
        for path in stage.iterdir():
            shutil.copyfile(path, target / path.name)
    (ROOT / 'library.json').write_text(json.dumps(library, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'library.js').write_text('window.READING_LIBRARY = ' + json.dumps(library, ensure_ascii=False, separators=(',', ':')) + ';\n')
    desired = {f'{key}.mp3' for key in generated}
    for obsolete in target.glob('*.mp3'):
        if obsolete.name not in desired:
            obsolete.unlink()
    print(f'Published {len(desired)} verified {VOICE} MP3 files at {RATE}.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--jobs', type=int, default=3, choices=range(1, 7))
    arguments = parser.parse_args()
    try:
        asyncio.run(generate(arguments.jobs))
    except Exception as error:
        # Safe public CI diagnosis: never include URLs, headers or environment values.
        diagnosis = f"{type(error).__name__}; HTTP status={getattr(error, 'status', 'not supplied')}"
        print('Speech generation failed: ' + diagnosis, flush=True)
        if os.environ.get('GITHUB_ACTIONS') == 'true':
            print('::error title=Speech generation::' + diagnosis, flush=True)
        summary = os.environ.get('GITHUB_STEP_SUMMARY')
        if summary:
            with open(summary, 'a') as report:
                report.write('## Speech generation failed\n\n' + diagnosis + '\n\nExisting audio and library indexes were preserved.\n')
        raise
