#!/usr/bin/env python3
"""Prepare contextual pronunciation worksheets; never infer or approve pronunciations."""
import argparse
import csv
import hashlib
import json
from pathlib import Path
from urllib.parse import quote

ROOT=Path(__file__).resolve().parents[1]
FIELDS=['reviewKey','book','frame','block','mode','language','start','end','displayText','speechText','context',
        'existingAudioId','selectedJyutping','cuhkSources','status','reviewer','notes']


def rows_for(book):
    for frame,page in enumerate(book['pages'],1):
        for block in page['blocks']:
            units=[('sentence',dict(text=block['text'],start=0,end=len(block['text']),audio=block['audio']))]
            units += [('word',unit) for unit in block['words'] if unit['audio']]
            units += [('character',unit) for unit in block['characters'] if unit['audio']]
            for mode,unit in units:
                speech=book['audio'][unit['audio']]['text']
                identity=[book['id'],frame,block['id'],block['text'],mode,unit['start'],unit['end'],unit['text'],speech]
                key=hashlib.sha256(json.dumps(identity,ensure_ascii=False).encode()).hexdigest()[:24]
                chars=sorted({ch for ch in speech if '\u3400'<=ch<='\u9fff'})
                sources=' | '.join('https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word='+quote(ch) for ch in chars)
                yield dict(reviewKey=key,book=book['id'],frame=frame,block=block['id'],mode=mode,language=book['audio'][unit['audio']]['lang'],start=unit['start'],end=unit['end'],
                           displayText=unit['text'],speechText=speech,context=block['text'],existingAudioId=unit['audio'],
                           selectedJyutping='',cuhkSources=sources,status='pending-context-and-listening-review',reviewer='',notes='')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'reports/cantonese/worksheets')
    args=parser.parse_args();library=json.loads((ROOT/'library.json').read_text())
    targets=[args.output/(book['id']+'.csv') for book in library['books']]
    if any(path.exists() for path in targets):parser.exit(1,'Existing worksheets may contain human decisions; refusing to overwrite.\n')
    args.output.mkdir(parents=True,exist_ok=True);summary=[]
    for book,target in zip(library['books'],targets):
        rows=list(rows_for(book));assert len({row['reviewKey'] for row in rows})==len(rows)
        with target.open('w',encoding='utf-8-sig',newline='') as handle:
            writer=csv.DictWriter(handle,fieldnames=FIELDS);writer.writeheader();writer.writerows(rows)
        summary.append(dict(book=book['id'],title=book['title'],units=len(rows),file=str(target.relative_to(ROOT)) if target.is_relative_to(ROOT) else str(target)))
    (args.output/'summary.json').write_text(json.dumps(dict(status='unreviewed',books=summary),ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(summary,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
