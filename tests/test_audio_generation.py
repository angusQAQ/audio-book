"""Regressions for atomic shelf registration and reuse on a fresh CI runner."""
import asyncio
from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

REPO = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('generator', REPO / 'scripts/generate_audio.py')
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


class AudioRegistration(unittest.TestCase):
    def fixture(self, directory):
        root = Path(directory)
        asset = deepcopy(next(iter(json.loads((REPO/'library.json').read_text())['books'][0]['audio'].values())))
        source = REPO / asset['src']; target = root / asset['src']
        target.parent.mkdir(parents=True); target.write_bytes(source.read_bytes())
        library = {'books':[{'id':'existing','audio':{asset['id']:asset}}]}
        (root/'library.json').write_text(json.dumps(library))
        (root/'library.js').write_text('existing index must survive a failure')
        return root, asset

    def test_service_failure_preserves_both_indexes_and_original_mp3(self):
        with tempfile.TemporaryDirectory() as directory:
            root, asset = self.fixture(directory)
            pending = {'id':'new','contentRevision':'revision','audio':{'new':{'id':'new','text':'小狼，換你說！','lang':'yue'}}}
            (root/'pending.json').write_text(json.dumps(pending))
            before = {path:path.read_bytes() for path in [root/'library.json', root/'library.js', root/asset['src']]}
            async def unavailable(*args, **kwargs):
                raise ValueError('test service unavailable')
            with patch.object(generator,'ROOT',root), patch.object(generator.edge_tts.Communicate,'save',unavailable):
                with self.assertRaises(ValueError):asyncio.run(generator.generate(1,'pending.json'))
            for path, content in before.items():self.assertEqual(path.read_bytes(),content)

    def test_fresh_runner_reuses_committed_audio_without_network(self):
        with tempfile.TemporaryDirectory() as directory:
            root, asset = self.fixture(directory)
            pending = {'id':'new','contentRevision':'revision','audio':{asset['id']:asset}}
            (root/'pending.json').write_text(json.dumps(pending))
            async def no_download(*args,**kwargs):raise AssertionError('Verified MP3 must be reused')
            with patch.object(generator,'ROOT',root), patch.object(generator.edge_tts.Communicate,'save',no_download):
                asyncio.run(generator.generate(1,'pending.json'))
                saved = (root/'library.json').read_bytes()
                asyncio.run(generator.generate(1,'pending.json'))
                self.assertEqual((root/'library.json').read_bytes(),saved)
            updated=json.loads(saved)
            self.assertEqual([book['id'] for book in updated['books']],['existing','new'])
            self.assertEqual(updated['books'][1]['audio'][asset['id']]['sha256'],asset['sha256'])


if __name__ == '__main__':unittest.main()
