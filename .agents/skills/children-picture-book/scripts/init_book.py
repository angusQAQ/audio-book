#!/usr/bin/env python3
"""Validate a per-book brief and create a fresh draft without inheriting another book."""
import argparse
import json
import math
from pathlib import Path
import re
import sys


def validate(brief):
    if not isinstance(brief, dict) or brief.get('schemaVersion') != 1:
        raise ValueError('brief.schemaVersion must be 1')
    for section in ('book', 'audience', 'content', 'design', 'deliverables', 'publication', 'decisions'):
        if not isinstance(brief.get(section), dict):
            raise ValueError(f'{section} must be an object; start with templates/book-brief.json')
    book, audience, content = brief['book'], brief['audience'], brief['content']
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', book.get('slug') or ''):
        raise ValueError('book.slug must be a new lowercase, hyphen-separated identifier')
    required = {'book.language': book.get('language'), 'theme': brief.get('theme'),
                'content.request': content.get('request')}
    for name, value in required.items():
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f'{name} must reflect this book, not a previous example')
    ages = [audience.get('ageMin'), audience.get('ageMax')]
    if any(isinstance(n, bool) or not isinstance(n, (int, float)) or not math.isfinite(n) for n in ages):
        raise ValueError('audience.ageMin and ageMax must be explicit ages in years')
    if not 0 <= ages[0] <= ages[1] <= 18:
        raise ValueError('audience ages must satisfy 0 <= ageMin <= ageMax <= 18')
    if audience.get('readingMode') not in ('adult-read-aloud', 'shared', 'independent'):
        raise ValueError('audience.readingMode must be adult-read-aloud, shared or independent')
    if content.get('mode') not in ('original', 'user-text', 'adaptation', 'nonfiction', 'revision'):
        raise ValueError('content.mode must describe the current content task')
    if content['mode'] in ('user-text', 'adaptation', 'revision') and not content.get('sourceTextPaths'):
        raise ValueError('sourceTextPaths must identify the existing manuscript for this content mode')
    formats = brief['deliverables'].get('formats')
    if not isinstance(formats, list) or not formats or any(not isinstance(f, str) or not f.strip() for f in formats):
        raise ValueError('deliverables.formats must list the formats requested for this book')
    return brief


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--brief', type=Path, required=True)
    parser.add_argument('--output', type=Path, help='New project folder; existing folders are never overwritten')
    parser.add_argument('--dry-run', action='store_true', help='Check the brief without writing any project files')
    args = parser.parse_args()
    try:
        brief = validate(json.loads(args.brief.read_text(encoding='utf-8')))
        if args.dry_run:
            print(json.dumps({'status': 'valid', 'brief': brief}, ensure_ascii=False, indent=2))
            return
        if args.output is None:
            raise ValueError('--output is required unless --dry-run is selected')
        args.output.mkdir(parents=True, exist_ok=False)
        for folder in ('assets/characters', 'assets/illustrations', 'assets/fonts', 'assets/revisions', 'editable', 'exports'):
            (args.output / folder).mkdir(parents=True)
        (args.output / 'brief.json').write_text(json.dumps(brief, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        story = dict(schemaVersion=1, status='draft', title=brief['book'].get('title'),
                     audience=brief['audience'], theme=brief['theme'], characters={}, spreads=[])
        (args.output / 'story.json').write_text(json.dumps(story, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (args.output / 'README.md').write_text('# ' + (brief['book'].get('title') or brief['book']['slug']) + '\n\n本專案目前為需求與故事草稿；尚未生成插畫、排版成品或音訊。依 children-picture-book skill 完成故事、分鏡、插畫、原生文字排版及實際輸出驗證。\n', encoding='utf-8')
        print(json.dumps({'status': 'draft-created', 'project': str(args.output), 'ageRange': [brief['audience']['ageMin'], brief['audience']['ageMax']], 'theme': brief['theme']}, ensure_ascii=False))
    except (ValueError, OSError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
