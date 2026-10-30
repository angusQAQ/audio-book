#!/usr/bin/env python3
"""Generate real reference-voice review samples; never modify published reader audio."""
import argparse
import gc
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import random
import subprocess
import time

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'voice-review/mei-school'


def plan():
    reference=json.loads((ROOT/'config/voxcpm-reference.json').read_text())
    library=json.loads((ROOT/'library.json').read_text())
    for candidate in reference['candidates']:
        assert hashlib.sha256((ROOT/candidate['file']).read_bytes()).hexdigest()==candidate['sha256'], 'Reference audio changed'
    selected=next(c for c in reference['candidates'] if c['id']==reference['provisionalCandidate'])
    cases=[]
    choices={'our-good-teacher':[('sentence','p4-b5'),('word','和藹'),('character','教')],
             'little-wolf-your-turn':[('sentence','p4-b1'),('word','狐狸'),('character','狼')],
             'lets-find-that-cloud':[('sentence','p5-b1'),('word','琪琪'),('word','樂樂'),('character','趟')]}
    for book_id,items in choices.items():
        book=next(b for b in library['books'] if b['id']==book_id)
        for index,(kind,value) in enumerate(items,1):
            if kind=='sentence':
                block=next(b for p in book['pages'] for b in p['blocks'] if b['id']==value)
                asset=book['audio'][block['audio']]
            else: asset=next(a for a in book['audio'].values() if a['text']==value)
            cases.append(dict(id=f'{book_id}-{index:02}',book=book_id,kind=kind,text=asset['text'],
                              originalAudioId=asset['id'],pronunciationReview='pending-CUHK-context-and-listening-review'))
    return reference,selected,cases


def generate():
    reference,selected,cases=plan()
    import numpy as np
    import soundfile as sf
    import torch
    from huggingface_hub import HfApi,snapshot_download
    from voxcpm import VoxCPM
    assert importlib.metadata.version('voxcpm')==reference['packageVersion']
    torch.set_num_threads(min(4,os.cpu_count() or 1))
    info=HfApi().model_info(reference['model'],token=False,files_metadata=True)
    revision=info.sha; files={item.rfilename:item for item in info.siblings}
    weights=[]
    for alternatives in [('model.safetensors','pytorch_model.bin'),('audiovae.safetensors','audiovae.pth')]:
        name=next((name for name in alternatives if name in files),None)
        if not name: raise ValueError('Official snapshot is missing required inference weights')
        weights.append(name)
    folder=snapshot_download(reference['model'],revision=revision,token=False,
                             allow_patterns=weights+['*.json','*.model','tokenizer*'])
    artifacts=[]
    for name in weights:
        with open(Path(folder)/name,'rb') as handle: digest=hashlib.file_digest(handle,'sha256').hexdigest()
        lfs=files[name].lfs
        expected=lfs.get('sha256') if isinstance(lfs,dict) else getattr(lfs,'sha256',None)
        if expected and digest!=expected: raise ValueError('Official model checksum mismatch')
        artifacts.append(dict(file=name,sha256=digest,officialLfsHashVerified=bool(expected)))
    model=VoxCPM.from_pretrained(folder,load_denoiser=False,optimize=False,device='cpu')
    OUTPUT.mkdir(parents=True,exist_ok=True)
    rate=model.tts_model.sample_rate
    for index,case in enumerate(cases):
        started=time.monotonic(); seed=reference['seed']+index
        random.seed(seed);np.random.seed(seed);torch.manual_seed(seed)
        waveform=model.generate(text='(香港粵語，清楚自然，親切地朗讀兒童故事。)'+case['text'],
                                reference_wav_path=str(ROOT/selected['file']),cfg_value=2.0,
                                inference_timesteps=10,max_len=256,retry_badcase_max_times=1)
        wav=OUTPUT/(case['id']+'.wav');mp3=OUTPUT/(case['id']+'.mp3')
        sf.write(wav,waveform,rate)
        subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-i',str(wav),'-af',f'atempo={reference["speedFactor"]}',
                        '-c:a','libmp3lame','-b:a','192k',str(mp3)],check=True)
        seconds=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(mp3)],text=True))
        assert seconds>0 and mp3.stat().st_size>500
        receipt=dict(case,engine='voxcpm',engineVersion=importlib.metadata.version('voxcpm'),
                     model=reference['model'],modelRevision=revision,modelArtifacts=artifacts,referenceFile=selected['file'],
                     referenceSha256=selected['sha256'],referenceApproved=False,sampleRate=rate,
                     speedFactor=reference['speedFactor'],seed=seed,duration=seconds,
                     file=str(mp3.relative_to(ROOT)),sha256=hashlib.sha256(mp3.read_bytes()).hexdigest(),
                     status='generated-not-pronunciation-approved',alignment='not-aligned',published=False,
                     generationSeconds=round(time.monotonic()-started,2))
        (OUTPUT/(case['id']+'.json')).write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
        print(f'Generated real VoxCPM review sample: {case["id"]}, {seconds:.2f}s',flush=True)
    del model;gc.collect()


def transcribe():
    reference,selected,cases=plan()
    import torch
    import whisper
    torch.set_num_threads(min(4,os.cpu_count() or 1))
    model=whisper.load_model('turbo',device='cpu')
    OUTPUT.mkdir(parents=True,exist_ok=True)
    paths=[ROOT/c['file'] for c in reference['candidates']]+sorted(OUTPUT.glob('*.mp3'))
    for path in paths:
        result=model.transcribe(str(path),language='yue',task='transcribe',fp16=False,
                                temperature=0,condition_on_previous_text=False,word_timestamps=True)
        report=dict(file=str(path.relative_to(ROOT)),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                    recognizer='openai-whisper',model='large-v3-turbo',language='yue',
                    transcriptHypothesis=result['text'],segments=result['segments'],
                    correctnessVerified=False,status='ASR-only; not a tone or pronunciation approval')
        (OUTPUT/(path.stem+'-asr.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print(f'ASR candidate (not approval): {path.name}: {result["text"]}',flush=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--generate',action='store_true')
    parser.add_argument('--transcribe',action='store_true')
    args=parser.parse_args()
    reference,selected,cases=plan()
    if args.generate: generate()
    elif args.transcribe: transcribe()
    else: print(json.dumps(dict(status='planned-not-generated',reference=selected,cases=cases),ensure_ascii=False,indent=2))


if __name__=='__main__':
    try: main()
    except Exception as error:
        print(f'::error title=VoxCPM reference review::{type(error).__name__}: {str(error)[:300]}',flush=True)
        raise
