#!/usr/bin/env python3
"""Collect pronunciation candidates from CUHK; lookup never implies listening approval."""
import argparse
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/'


class Readings(HTMLParser):
    def __init__(self):
        super().__init__(); self.in_anchor = False; self.anchor = ''; self.values = set()

    def handle_starttag(self, tag, attrs):
        if tag == 'a': self.in_anchor = True; self.anchor = ''

    def handle_data(self, text):
        if self.in_anchor: self.anchor += text

    def handle_endtag(self, tag):
        if tag == 'a' and self.in_anchor:
            value = self.anchor.strip().lower()
            if re.fullmatch(r'[a-z]+[1-6]', value): self.values.add(value)
            self.in_anchor = False


def collect(characters, output, delay=1.0):
    library = json.loads((ROOT/'library.json').read_text())
    contexts = {ch: [] for ch in characters}
    for book in library['books']:
        for page_number, page in enumerate(book['pages'], 1):
            for block in page['blocks']:
                for ch in set(block['text']) & contexts.keys():
                    if len(contexts[ch]) < 8:
                        contexts[ch].append(dict(book=book['id'], page=page_number, block=block['id'], text=block['text']))
    report = dict(authority='香港中文大學漢語多功能字庫', baseUrl=BASE,
                  status='lookup-only; context and actual speech review required', records=[])
    output.parent.mkdir(parents=True, exist_ok=True)
    failed = False
    for index, ch in enumerate(characters):
        url = BASE+'search.php?word='+quote(ch)
        record = dict(character=ch, url=url, contexts=contexts[ch], selectedReading=None,
                      pronunciationApproved=False, retrievedAt=datetime.now(timezone.utc).isoformat())
        try:
            request = Request(url, headers={'User-Agent':'audio-book pronunciation source review'})
            with urlopen(request, timeout=25) as response:
                data=response.read(); encoding=response.headers.get_content_charset() or 'utf-8'
            page=data.decode(encoding, errors='replace'); parser=Readings(); parser.feed(page)
            values=parser.values | set(re.findall(r'(?<![a-z])([a-z]+[1-6])\.(?:wav|mp3)',page,re.I))
            record.update(status='retrieved-needs-context-review', pageSha256=hashlib.sha256(data).hexdigest(),
                          candidateReadings=sorted(values), parseVerified=False)
            if not values: record['status']='retrieved-parser-review-required'
        except Exception as error:
            record.update(status='lookup-blocked', error=type(error).__name__, candidateReadings=[])
            failed=True
        report['records'].append(record)
        report['requestedCharacters']=len(characters); report['retrievedCharacters']=sum(r['status']!='lookup-blocked' for r in report['records'])
        output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print(f'CUHK {index+1}/{len(characters)}: {ch} {record["status"]}',flush=True)
        if failed: break  # Do not hammer a denied or unavailable source.
        if index+1<len(characters): time.sleep(delay)
    if failed: raise RuntimeError('CUHK lookup was blocked; no reading has been approved')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--characters',help='Optional subset; otherwise all Han characters in the three books')
    parser.add_argument('--output',type=Path,default=ROOT/'reports/cantonese/cuhk-lookup.json')
    args=parser.parse_args()
    if args.characters: characters=sorted(set(args.characters))
    else:
        library=json.loads((ROOT/'library.json').read_text())
        characters=sorted({ch for book in library['books'] for asset in book['audio'].values()
                           for ch in asset['text'] if '\u3400'<=ch<='\u9fff'})
    collect(characters,args.output)


if __name__=='__main__': main()
