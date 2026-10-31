import copy
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from colorado_principal_city_source_screen import ROOT,FOLDER,PRINCIPAL,check


class PrincipalCitySourceScreenTests(unittest.TestCase):
    def fixture(self,folder):
        root=Path(folder);shutil.copytree(ROOT/FOLDER,root/FOLDER)
        target=root/PRINCIPAL;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/PRINCIPAL,target)
        manifest=json.loads((root/FOLDER/'manifest.json').read_text())
        for row in manifest['records']:
            path=Path(row['source_path'])
            if not (root/path).exists():
                (root/path).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/path,root/path)
        return root,manifest

    def save(self,root,manifest):
        (root/FOLDER/'manifest.json').write_text(json.dumps(manifest))

    def test_all_principal_cities_accounted_but_one_selected_source_unavailable(self):
        report=check()
        self.assertEqual(report['principal_city_memberships'],12)
        self.assertEqual(report['source_work_status_counts'],dict(prior_retained_context=7,retained_publication_observation=4,selected_publication_unavailable=1))
        self.assertEqual(report['new_source_context_kinds']['0812815'],'municipal_facility_location')
        self.assertEqual(report['new_source_context_kinds']['0816495'],'municipal_building_entry_notice')
        self.assertFalse(report['access_verified']);self.assertEqual(report['new_connectors_approved'],0)

    def test_duplicate_missing_foreign_city_or_cbsa_mismatch_reject(self):
        for mutation in ('duplicate','missing','foreign','cbsa'):
            with self.subTest(mutation=mutation),tempfile.TemporaryDirectory() as folder:
                root,manifest=self.fixture(folder)
                if mutation=='duplicate':manifest['records'][0]=copy.deepcopy(manifest['records'][1])
                elif mutation=='missing':manifest['records'].pop()
                elif mutation=='foreign':manifest['records'][0]['principal_city_id']='9999999'
                else:manifest['records'][0]['cbsa']='99999'
                self.save(root,manifest)
                with self.assertRaises(ValueError):check(root)

    def test_failed_retrieval_cannot_be_promoted_even_with_updated_file_hash(self):
        with tempfile.TemporaryDirectory() as folder:
            root,manifest=self.fixture(folder)
            row=next(r for r in manifest['records'] if r['principal_city_id']=='0846465')
            path=root/row['source_path'];source=json.loads(path.read_text())
            row['source_status']=source['publication_status']='retained_publication_observation'
            source['source_kind']='municipal_parking_guidance';source['observations']=['Unverified fabricated claim']
            source['selected_quote']='Unverified'
            path.write_text(json.dumps(source));row['source_sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
            self.save(root,manifest)
            with self.assertRaisesRegex(ValueError,'Retrieved publication'):check(root)

    def test_adoption_claim_or_cross_city_source_cannot_pass_integrity(self):
        for mutation in ('adopted','cross_source'):
            with self.subTest(mutation=mutation),tempfile.TemporaryDirectory() as folder:
                root,manifest=self.fixture(folder)
                if mutation=='adopted':manifest['records'][0]['anchor_adopted']=True
                else:
                    manifest['records'][0]['source_path']=manifest['records'][1]['source_path']
                    manifest['records'][0]['source_sha256']=manifest['records'][1]['source_sha256']
                self.save(root,manifest)
                with self.assertRaises(ValueError):check(root)


if __name__=='__main__':unittest.main()
