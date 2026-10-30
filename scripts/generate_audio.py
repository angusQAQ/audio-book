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
    identity = {
        'text': asset['text'], 'voice': VOICE, 'rate': RATE,
        'edge_tts': edge_tts.__version__, 'word_boundary_schema': TIMING_SCHEMA,
    }
    if asset.get('ttsText'):
        identity['tts_text'] = tts_input(asset)
    return hashlib.sha256(json.dumps(identity, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:24]


def tts_input(asset):
    text = asset.get('ttsText', asset['text'])
    if len(text) != len(asset['text']):
        raise ValueError('Pronunciation hints must preserve character positions')
    return text


def configure_pronunciation(book):
    path = ROOT / 'config/pronunciation-overrides.json'
    if not path.exists(): return
    config = json.loads(path.read_text())
    if config.get('schemaVersion') != 1: raise ValueError('Unknown pronunciation override schema')
    rules = config['books'].get(book['id'])
    if not rules: return
    for character, rule in rules.items():
        if len(character) != 1 or len(rule['ttsCharacter']) != 1:
            raise ValueError('Pronunciation hints must use single-character homophones')
    for asset in book['audio'].values():
        used = {ch: rule for ch, rule in rules.items() if ch in asset['text']}
        if not used: continue
        text = asset['text']
        for ch, rule in used.items(): text = text.replace(ch, rule['ttsCharacter'])
        asset['ttsText'] = text
        asset['pronunciationHints'] = {ch: rule['jyutping'] for ch, rule in used.items()}
    book['pronunciationRevision'] = hashlib.sha256(json.dumps(rules,ensure_ascii=False,sort_keys=True).encode()).hexdigest()


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


async def generate(jobs, include_book=None):
    library = json.loads((ROOT / 'library.json').read_text())
    pending = None
    if include_book:
        pending = json.loads((ROOT / include_book).read_text())
        configure_pronunciation(pending)
        existing = next((book for book in library['books'] if book['id'] == pending['id']), None)
        if (existing and existing.get('contentRevision') == pending['contentRevision']
                and existing.get('pronunciationRevision') == pending.get('pronunciationRevision')):
            print(f'Book {pending["id"]} is already registered at this verified content revision.', flush=True)
            return
        if existing:
            for key, asset in pending['audio'].items():
                previous = existing['audio'].get(key)
                if (previous and previous['text'] == asset['text']
                        and tts_input(previous) == tts_input(asset)):
                    asset.update(previous)
        library['books'] = [book for book in library['books'] if book['id'] != pending['id']] + [pending]
    for book in library['books']: configure_pronunciation(book)
    cache = ROOT / '.cache' / 'edge-tts'
    cache.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(jobs)
    generated = {}
    locks = {}
    completed = 0
    total = sum(len(book['audio']) for book in library['books'])
    proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')

    # A fresh runner must reuse committed, verified MP3 instead of downloading the
    # entire old library again. Cache is an optimization, not the source of truth.
    for book in library['books']:
        for asset in book['audio'].values():
            if (asset.get('voice') != VOICE or asset.get('rate') != RATE
                    or asset.get('engineVersion') != edge_tts.__version__
                    or asset.get('timingSchema') != TIMING_SCHEMA or not asset.get('boundaries')):
                continue
            source = ROOT / asset.get('src', '')
            if not source.is_file() or hashlib.sha256(source.read_bytes()).hexdigest() != asset.get('sha256'):
                continue
            key = key_for(asset)
            if source.name != f'{key}.mp3':
                continue
            path, receipt = cache / f'{key}.mp3', cache / f'{key}.json'
            shutil.copyfile(source, path)
            stamp = {name: asset[name] for name in ('sha256','duration','voice','rate','timingSchema','boundaries')}
            if asset.get('ttsText'): stamp['ttsText'] = asset['ttsText']
            receipt.write_text(json.dumps(stamp))

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
                if asset.get('ttsText'): valid = valid and stamp.get('ttsText') == tts_input(asset)
                if valid:
                    try:
                        duration(path)
                    except (ValueError, subprocess.CalledProcessError):
                        valid = False
            if not valid:
                for attempt in range(7):
                    partial = path.with_suffix('.partial.mp3')
                    metadata = path.with_suffix('.partial.jsonl')
                    try:
                        communicate = edge_tts.Communicate(
                            tts_input(asset), voice=VOICE, rate=RATE, proxy=proxy,
                            connect_timeout=20, receive_timeout=60, boundary='WordBoundary',
                        )
                        await communicate.save(str(partial), str(metadata))
                        timings = aligned_boundaries(tts_input(asset), [json.loads(line) for line in metadata.read_text().splitlines() if line.strip()])
                        metadata.unlink(missing_ok=True)
                        seconds = duration(partial)
                        partial.replace(path)
                        stamp = {
                            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                            'duration': seconds, 'voice': VOICE, 'rate': RATE,
                            'timingSchema': TIMING_SCHEMA, 'boundaries': timings,
                        }
                        if asset.get('ttsText'): stamp['ttsText'] = asset['ttsText']
                        receipt.write_text(json.dumps(stamp))
                        break
                    except Exception as error:
                        partial.unlink(missing_ok=True)
                        metadata.unlink(missing_ok=True)
                        if attempt == 6 or getattr(error, 'status', None) in (401, 403) or isinstance(error,(ValueError,KeyError,TypeError)):
                            error.tts_unit = asset.get('id','unknown')
                            error.tts_completed = completed
                            raise
                        delay = [2,5,10,20,30,45][attempt]
                        print(f'Retrying {type(error).__name__} for unit {asset.get("id","unknown")} after {delay}s; completed {completed}/{total}',flush=True)
                        await asyncio.sleep(delay)
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
    candidates = [asset for book in library['books'] for asset in book['audio'].values()]
    first = next((asset for asset in candidates if not (cache / f'{key_for(asset)}.json').exists()), candidates[0])
    await one(first)
    print(f'::notice title=Word timing preflight::Requested HiuMaan voice returned {len(first["boundaries"])} real word timestamps',flush=True)
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
    parser.add_argument('--jobs', type=int, default=2, choices=range(1, 7))
    parser.add_argument('--include-book', type=str, help='Register a pending book only after complete audio generation; an unchanged revision is skipped')
    arguments = parser.parse_args()
    try:
        asyncio.run(generate(arguments.jobs, arguments.include_book))
    except Exception as error:
        # Safe public CI diagnosis: never include URLs, headers or environment values.
        diagnosis = f"{type(error).__name__}; HTTP status={getattr(error, 'status', 'not supplied')}; unit={getattr(error, 'tts_unit', 'not supplied')}; completed={getattr(error, 'tts_completed', 'not supplied')}"
        if isinstance(error,ValueError): diagnosis += '; ' + str(error).replace('\n',' ')[:180]
        print('Speech generation failed: ' + diagnosis, flush=True)
        if os.environ.get('GITHUB_ACTIONS') == 'true':
            print('::error title=Speech generation::' + diagnosis, flush=True)
        summary = os.environ.get('GITHUB_STEP_SUMMARY')
        if summary:
            with open(summary, 'a') as report:
                report.write('## Speech generation failed\n\n' + diagnosis + '\n\nExisting audio and library indexes were preserved.\n')
        raise
