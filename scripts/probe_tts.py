#!/usr/bin/env python3
"""Compare service availability for the requested voice without modifying site assets."""
import asyncio
import json
import os
from pathlib import Path
import edge_tts

async def main():
    root = Path('.cache/tts-probe')
    root.mkdir(parents=True, exist_ok=True)
    for boundary in ['SentenceBoundary', 'WordBoundary']:
        target = root / boundary
        try:
            await edge_tts.Communicate('我們的好老師', voice='zh-HK-HiuMaanNeural', rate='-12%', boundary=boundary, proxy=os.environ.get('HTTPS_PROXY'), connect_timeout=20, receive_timeout=45).save(str(target.with_suffix('.mp3')),str(target.with_suffix('.jsonl')))
            events = [json.loads(line) for line in target.with_suffix('.jsonl').read_text().splitlines() if line]
            print(f'::notice title=TTS service probe::{boundary}: {target.with_suffix(".mp3").stat().st_size} audio bytes, {len(events)} timing events',flush=True)
        except Exception as error:
            print(f'::warning title=TTS service probe::{boundary}: {type(error).__name__}; HTTP status={getattr(error,"status","not supplied")}',flush=True)
asyncio.run(main())
