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


class PronunciationOverrides(unittest.TestCase):
    def test_do2_hint_changes_only_cloud_speech_and_cache_identity(self):
        library = json.loads((REPO/'library.json').read_text())
        for book in library['books']:
            before = deepcopy(book)
            generator.configure_pronunciation(book)
            if book['id'] != 'lets-find-that-cloud':
                self.assertEqual(book, before)
                continue
            affected = [asset for asset in book['audio'].values() if '朵' in asset['text']]
            self.assertEqual(len(affected), 6)
            for asset in affected:
                original = {key:value for key,value in asset.items() if key not in ('ttsText','pronunciationHints')}
                self.assertEqual(asset['ttsText'], asset['text'].replace('朵','躲'))
                self.assertEqual(asset['pronunciationHints'], {'朵':'do2'})
                self.assertNotEqual(generator.key_for(asset), generator.key_for(original))
                self.assertEqual(asset['text'], before['audio'][asset['id']]['text'])

    def test_actual_homophone_boundaries_still_point_to_printed_do2_character(self):
        original = '去找那朵雲'
        spoken = original.replace('朵','躲')
        events = [
            {'type':'WordBoundary','text':'去找那','offset':700000,'duration':8100000},
            {'type':'WordBoundary','text':'躲','offset':9200000,'duration':2300000},
            {'type':'WordBoundary','text':'雲','offset':12400000,'duration':4100000},
        ]
        boundaries = generator.aligned_boundaries(spoken,events)
        self.assertEqual(original[boundaries[1]['start']:boundaries[1]['end']], '朵')
        self.assertEqual(boundaries[1]['time'], .92)
        self.assertEqual(boundaries[1]['duration'], .23)
        self.assertEqual(boundaries[2]['time'], 1.24)

    def test_hint_cannot_shift_printed_character_positions(self):
        with self.assertRaises(ValueError):
            generator.tts_input({'text':'朵','ttsText':'do2'})


if __name__ == '__main__':unittest.main()
