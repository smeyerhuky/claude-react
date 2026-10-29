"""Fail-closed identity checks for reuse of original assets in an unpublished archive."""

def require_draft(release, expected_id, expected_tag):
    if (release.get('id') != expected_id or release.get('tag_name') != expected_tag or
            release.get('draft') is not True or release.get('published_at') is not None):
        raise ValueError('Expected exact unpublished draft; never modify a published release')
    return release


def existing_original(assets, entry):
    matches = [a for a in assets if a['name'] == entry['filename']]
    if not matches:
        return None
    if (len(matches) != 1 or matches[0]['state'] != 'uploaded' or
            matches[0]['size'] != entry['bytes'] or
            matches[0].get('digest') != 'sha256:' + entry['sha256']):
        raise ValueError('Existing original asset conflicts; never clobber')
    a = matches[0]
    return {'name': a['name'], 'id': a['id'], 'bytes': a['size'], 'digest': a['digest']}
