import copy
import json
from pathlib import Path
import tempfile
import unittest

from connector_review_packet import validate

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / 'docs/research/connector-reviews/tucson-census-lead.json'


class ReviewPacketTests(unittest.TestCase):
    def setUp(self):
        self.packet = json.loads(PACKET.read_text())

    def test_retained_negative_review(self):
        result = validate(self.packet, ROOT)
        self.assertEqual(result['machine_assertions_checked'], 8)
        self.assertFalse(result['access_verified'])

    def test_tampered_evidence_and_machine_claim(self):
        for mutate in ('hash', 'claim'):
            packet = copy.deepcopy(self.packet)
            if mutate == 'hash':
                packet['sources'][0]['sha256'] = '0' * 64
            else:
                packet['machine_assertions'][1]['equals'] = 123
            with self.assertRaises(ValueError):
                validate(packet, ROOT)

    def test_no_model_only_approval_or_self_certification(self):
        for mutate in ('access_verified', 'release_eligible', 'supported', 'ready'):
            packet = copy.deepcopy(self.packet)
            if mutate in ('access_verified', 'release_eligible'):
                packet[mutate] = True
            elif mutate == 'supported':
                packet['findings']['legal_motor_access']['status'] = 'supported'
            else:
                packet['decision'] = 'ready_for_separate_approval'
            with self.assertRaises(ValueError):
                validate(packet, ROOT)

    def test_cannot_skip_question_or_invent_citation(self):
        for mutate in ('skip', 'citation'):
            packet = copy.deepcopy(self.packet)
            if mutate == 'skip':
                del packet['findings']['same_grade']
            else:
                packet['findings']['same_grade']['sources'] = ['not-retained']
            with self.assertRaises(ValueError):
                validate(packet, ROOT)

    def test_external_path_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            self.packet['sources'][0]['path'] = str(PACKET)
            with self.assertRaises(ValueError):
                validate(self.packet, directory)


if __name__ == '__main__':
    unittest.main()
