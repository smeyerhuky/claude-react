"""Recover one exact original source; archive-first, read-only, never publish or certify."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request

from research_source_archive_checks import existing_original, require_draft

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'scripts/research-source-snapshots/co-nm-az-20261027.json'
REPOSITORY='smeyerhuky/claude-react'


def entry_for(manifest,name):
    if manifest.get('schema')!='research-original-source-archive-v1' or manifest.get('draft_release_id')!=426327474 or manifest.get('draft_release_tag')!='research-sources-20261027-co-nm-az-v1':raise ValueError('Exact research archive required')
    matches=[e for e in manifest['files'] if e['filename']==name]
    if len(matches)!=1 or Path(name).name!=name:raise ValueError('Unique pinned source basename required')
    entry=matches[0];u=urllib.parse.urlsplit(entry['source_url'])
    if (type(entry['bytes']) is not int or not 0<entry['bytes']<2000000000 or
            not re.fullmatch('[a-f0-9]{64}',entry['sha256']) or u.scheme!='https' or
            u.hostname not in {'download.geofabrik.de','www2.census.gov','raw.githubusercontent.com'} or
            u.username or u.password or u.port or u.fragment):raise ValueError('Unsafe or unbounded source entry')
    return entry


def verify(path,entry):
    path=Path(path)
    if not path.is_file() or path.stat().st_size!=entry['bytes']:raise ValueError('Exact source size mismatch')
    with path.open('rb') as handle:digest=hashlib.file_digest(handle,'sha256').hexdigest()
    if digest!=entry['sha256']:raise ValueError('Exact source checksum mismatch; never rewrite expected identity')


def archive_asset(manifest,entry):
    # Network/authentication absence may use the original canonical URL. A
    # conflicting archive identity is an error, not permission to clobber it.
    try:
        raw=subprocess.check_output(['gh','api',f'repos/{REPOSITORY}/releases/{manifest["draft_release_id"]}'],stderr=subprocess.PIPE,timeout=60)
    except (subprocess.CalledProcessError,subprocess.TimeoutExpired,FileNotFoundError):
        return None
    release=require_draft(json.loads(raw),manifest['draft_release_id'],manifest['draft_release_tag'])
    return existing_original(release['assets'],entry)


def canonical_download(entry,path):
    deadline=time.monotonic()+1200;size=0
    with urllib.request.urlopen(entry['source_url'],timeout=30) as response,Path(path).open('wb') as handle:
        while True:
            if time.monotonic()>deadline:raise TimeoutError('Bounded canonical recovery timed out')
            block=response.read(8*1024*1024)
            if not block:break
            size+=len(block)
            if size>entry['bytes']:raise ValueError('Canonical source exceeds exact size')
            handle.write(block)


def recover(manifest,name,output):
    entry=entry_for(manifest,name);output=Path(output)
    if output.is_symlink():raise ValueError('Source output cannot be a symlink')
    if output.exists():
        verify(output,entry);return 'verified_local'
    output.parent.mkdir(parents=True,exist_ok=True)
    asset=archive_asset(manifest,entry)
    with tempfile.NamedTemporaryFile(prefix='.research-source-',dir=output.parent,delete=False) as handle:path=Path(handle.name)
    try:
        delivery='canonical'
        if asset is not None:
            try:
                with path.open('wb') as handle:
                    subprocess.run(['gh','api','-H','Accept: application/octet-stream',f'repos/{REPOSITORY}/releases/assets/{asset["id"]}'],stdout=handle,stderr=subprocess.PIPE,check=True,timeout=1200)
                delivery='verified_draft_archive'
            except (subprocess.CalledProcessError,subprocess.TimeoutExpired,FileNotFoundError):
                print('Archive transfer unavailable; recovering the same pinned canonical bytes',flush=True)
                canonical_download(entry,path)
        else:
            print('Archive lookup unavailable; recovering the same pinned canonical bytes',flush=True)
            canonical_download(entry,path)
        verify(path,entry)
        # No existing file is replaced: an interrupted/repeated recovery can
        # reuse only a complete input with the exact original hash and size.
        if output.exists():raise ValueError('Output appeared during recovery; do not replace it')
        path.replace(output)
        return delivery
    finally:
        path.unlink(missing_ok=True)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    manifest=json.loads(MANIFEST.read_text());delivery=recover(manifest,a.source,a.output)
    print(json.dumps(dict(source=a.source,delivery=delivery,sha256=entry_for(manifest,a.source)['sha256'],access_verified=False,release_eligible=False)))
