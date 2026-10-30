#!/usr/bin/env python3
"""Package actual review audio and evidence without marking it approved or publishing it to books."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT=Path(__file__).resolve().parents[1]


def main():
    reference=json.loads((ROOT/'config/voxcpm-reference.json').read_text())
    slug=reference.get('reviewFolder','mei-school')
    if any(ch not in 'abcdefghijklmnopqrstuvwxyz0123456789-' for ch in slug):raise ValueError('Invalid review folder')
    folder=ROOT/'voice-review'/slug;samples=[]
    for path in sorted(folder.glob('*.json')):
        if path.name.endswith('-asr.json') or path.name=='review-manifest.json':continue
        item=json.loads(path.read_text());mp3=ROOT/item['file']
        assert hashlib.sha256(mp3.read_bytes()).hexdigest()==item['sha256']
        asr_path=folder/(path.stem+'-asr.json');asr=json.loads(asr_path.read_text()) if asr_path.exists() else {}
        samples.append(dict(id=item['id'],book=item['book'],kind=item['kind'],text=item['text'],file=item['file'],
                            sha256=item['sha256'],duration=item['duration'],asrHypothesis=asr.get('transcriptHypothesis'),
                            detectedLanguage=asr.get('detectedLanguage'),languageProbabilities=asr.get('languageProbabilities'),
                            pronunciationApproved=False))
    if not samples:raise ValueError('No actual generated samples to package')
    manifest=dict(schemaVersion=1,status='samples-require-listening-review; not installed in shelf',
                  model=reference['model'],modelRevision=reference.get('modelRevision'),sampleCount=len(samples),
                  sourcePolicy='config/cantonese-pronunciation.json',samples=samples)
    (folder/'review-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    files=sorted(path for path in folder.iterdir() if path.is_file() and path.suffix in ('.mp3','.json','.md'))
    target=ROOT/'downloads/voxcpm-narrator-review.zip';target.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            info=zipfile.ZipInfo(slug+'-review/'+path.name,date_time=(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
            archive.writestr(info,path.read_bytes())
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
        for path in files:assert archive.read(slug+'-review/'+path.name)==path.read_bytes()
    print(f'Packaged {len(samples)} real review MP3 with matching hashes; pronunciation approval remains false.')


if __name__=='__main__':main()
