#!/usr/bin/env python3
"""Inspect book narration profiles, check VoxCPM, or generate an unpublished sample.

Samples stay in .cache: this script never changes the website, its audio index,
the existing Edge MP3, or the real speech timestamps used by the reading cues.
"""
import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import random
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def plan_for(book_id):
    config = json.loads((ROOT / 'config/book-voices.json').read_text())
    book = next((item for item in json.loads((ROOT / 'library.json').read_text())['books'] if item['id'] == book_id), None)
    if book is None or book_id not in config['books']:
        raise ValueError('Book and narration profile must both exist: ' + book_id)
    profile = config['books'][book_id]
    block = next((block for page in book['pages'] for block in page['blocks'] if block['id'] == profile['sampleBlock']), None)
    if block is None:
        raise ValueError('The sample must use an existing book passage')
    if config['schemaVersion'] != 1 or profile['locale'] != 'zh-HK' or config['speedFactor'] != 0.88:
        raise ValueError('Expected a Hong Kong Cantonese profile at -12%')
    return {
        'book': book_id, 'title': book['title'], 'model': config['model'],
        'packageVersion': config['packageVersion'], 'seed': config['seed'],
        'speedFactor': config['speedFactor'], **profile,
        'text': book['audio'][block['audio']]['text'],
        'publishedEngine': book['voice']['engine'],
    }


def runtime():
    cache = Path(os.environ.setdefault('XDG_CACHE_HOME', '/workspace/.cache/voxcpm'))
    for variable, path in {
        'MPLCONFIGDIR': cache / 'matplotlib', 'NUMBA_CACHE_DIR': cache / 'numba',
        'HF_HOME': Path('/workspace/.cache/huggingface'),
        'MODELSCOPE_CACHE': Path('/workspace/.cache/modelscope'),
    }.items():
        Path(os.environ.setdefault(variable, str(path))).mkdir(parents=True, exist_ok=True)
    import torch
    import torchcodec
    import torchaudio
    import soundfile
    from voxcpm import VoxCPM
    from voxcpm.model import voxcpm2
    torch.set_num_threads(min(4, os.cpu_count() or 1))
    assert (torch.tensor([[1., 2.]]) @ torch.tensor([[3.], [4.]])).item() == 11
    return torch, soundfile, VoxCPM


def sample(plan, model_dir, device):
    torch, soundfile, VoxCPM = runtime()
    revision = None
    if model_dir:
        local_model = Path(model_dir).resolve()
        if not (local_model / 'config.json').is_file():
            raise ValueError('The local VoxCPM2 model directory needs config.json and complete weights')
    else:
        from huggingface_hub import HfApi, snapshot_download
        # Resolve a concrete public model revision before downloading. No secret is needed.
        revision = HfApi().model_info(plan['model'], token=False).sha
        local_model = Path(snapshot_download(plan['model'], revision=revision, token=False))
    model = VoxCPM.from_pretrained(str(local_model), load_denoiser=False, optimize=False, device=device)
    import numpy as np
    random.seed(plan['seed'])
    np.random.seed(plan['seed'])
    torch.manual_seed(plan['seed'])
    waveform = model.generate(
        text='(' + plan['description'] + ')' + plan['text'],
        cfg_value=2.0, inference_timesteps=10, max_len=512,
    )
    receipt = {
        **plan, 'engine': 'voxcpm', 'engineVersion': importlib.metadata.version('voxcpm'),
        'modelRevision': revision, 'sampleRate': model.tts_model.sample_rate,
        'status': 'sample-needs-listening-review', 'alignment': 'not-aligned',
    }
    key = hashlib.sha256(json.dumps(receipt, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:24]
    target = ROOT / '.cache/voxcpm/samples' / key
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=target.parent, prefix='generating-') as staging:
        stage = Path(staging)
        soundfile.write(stage / 'narrator.wav', waveform, model.tts_model.sample_rate)
        subprocess.run([
            'ffmpeg', '-v', 'error', '-nostdin', '-i', str(stage / 'narrator.wav'),
            '-af', 'atempo=0.88', '-c:a', 'libmp3lame', '-b:a', '128k', str(stage / 'sample.mp3'),
        ], check=True)
        seconds = float(subprocess.check_output([
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', str(stage / 'sample.mp3'),
        ], text=True).strip())
        if seconds <= 0 or (stage / 'sample.mp3').stat().st_size <= 500:
            raise ValueError('VoxCPM returned empty audio')
        receipt.update(duration=seconds, sha256=hashlib.sha256((stage / 'sample.mp3').read_bytes()).hexdigest())
        (stage / 'receipt.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
        if target.exists():
            raise ValueError('This exact sample already exists; review it instead of overwriting it')
        stage.rename(target)
    print(json.dumps({'sample': str(target), 'status': receipt['status'], 'published': False}, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--book', default='our-good-teacher')
    action = parser.add_mutually_exclusive_group()
    action.add_argument('--describe', action='store_true', help='Print the profile without loading models')
    action.add_argument('--check', action='store_true', help='Check imports and CPU operations; no model download')
    parser.add_argument('--model-dir', help='Use an already downloaded VoxCPM2 snapshot')
    parser.add_argument('--device', choices=['auto', 'cpu', 'cuda', 'mps'], default='auto')
    args = parser.parse_args()
    plan = plan_for(args.book)
    if args.describe:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
    elif args.check:
        torch, _, _ = runtime()
        if importlib.metadata.version('voxcpm') != plan['packageVersion']:
            raise ValueError('Installed VoxCPM differs from the pinned book-profile version')
        print(json.dumps({'packageReady': True, 'voxcpm': importlib.metadata.version('voxcpm'),
                          'torch': torch.__version__, 'cuda': torch.cuda.is_available(),
                          'modelLoaded': False, 'publishedEngine': plan['publishedEngine']}))
    else:
        sample(plan, args.model_dir, args.device)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Avoid printing proxy headers or authentication-bearing request URLs.
        status = getattr(getattr(error, 'response', None), 'status_code', None)
        print('VoxCPM did not generate or publish audio: ' + type(error).__name__ +
              (f' (HTTP {status})' if status else '') +
              (': ' + str(error) if isinstance(error, ValueError) else ''), flush=True)
        raise SystemExit(1)
