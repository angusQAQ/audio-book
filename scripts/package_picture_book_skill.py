#!/usr/bin/env python3
"""Create a reproducible, installable ZIP of the project-owned picture-book skill."""
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / '.agents/skills/children-picture-book'
TARGET = ROOT / 'downloads/children-picture-book-skill.zip'


def main():
    paths = sorted(p for p in SOURCE.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc')
    assert SOURCE / 'SKILL.md' in paths
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(TARGET, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for path in paths:
            info = zipfile.ZipInfo('children-picture-book/' + path.relative_to(SOURCE).as_posix(), date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes())
    with zipfile.ZipFile(TARGET) as archive:
        assert archive.testzip() is None
        assert len(archive.infolist()) == len(paths)
        for path in paths:
            assert archive.read('children-picture-book/' + path.relative_to(SOURCE).as_posix()) == path.read_bytes()
    print(f'{TARGET.relative_to(ROOT)}: {len(paths)} verified source files, {TARGET.stat().st_size} bytes')


if __name__ == '__main__':
    main()
