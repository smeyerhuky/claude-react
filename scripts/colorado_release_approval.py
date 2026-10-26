"""Fail-closed release policy for independently approved metro-to-road evidence.

An evidence JSON may declare traversability, but declarations are not audits.
Only an exact SHA-256 tuple in the separately code-reviewed, repository-pinned
approval ledger can unlock the CLI's --require-verified-access mode.
Even approval is evidence provenance, NOT independent proof of ground truth.
"""
import hashlib
import json
from pathlib import Path

PINNED_LEDGER = Path(__file__).with_name("colorado_reviewed_connectors.json")


def file_sha256(path):
    with Path(path).open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def _digest(value):
    return (isinstance(value, str) and len(value) == 64 and
            all(ch in "0123456789abcdef" for ch in value))


def verify_release_approval(evidence_path, osm_path, metros_path,
                            ledger_path=PINNED_LEDGER):
    """Demand an independent ledger entry for exact evidence and data inputs.

    The release CLI deliberately never exposes ledger_path as a user option;
    fixture injection here is intended only for isolated unit testing.
    This check does not replace physical/legal inspection of connectors.
    """
    document = json.loads(Path(evidence_path).read_text(encoding="utf-8"))
    if not isinstance(document, dict) or document.get("schema_version") != 1:
        raise ValueError("Invalid connector evidence schema")
    reviewer = document.get("reviewed_by")
    if not isinstance(reviewer, str) or not reviewer.strip():
        raise ValueError("Connector evidence requires a reviewer identity")
    hashes = {"evidence_sha256": file_sha256(evidence_path),
              "osm_sha256": file_sha256(osm_path),
              "metros_sha256": file_sha256(metros_path)}
    ledger = json.loads(Path(ledger_path).read_text(encoding="utf-8"))
    if not isinstance(ledger, dict) or ledger.get("schema_version") != 1:
        raise ValueError("Invalid independent connector approval ledger")
    entries = ledger.get("approved_evidence")
    if not isinstance(entries, list):
        raise ValueError("Independent connector approval entries must be a list")
    matches = []
    seen = set()
    for entry in entries:
        if not isinstance(entry, dict):
            raise ValueError("Malformed independent connector approval entry")
        if not all(_digest(entry.get(k)) for k in hashes):
            raise ValueError("Approval entry requires exact SHA-256 digests")
        identity = tuple(entry[k] for k in hashes)
        if identity in seen:
            raise ValueError("Duplicate independent connector approval")
        seen.add(identity)
        if not all(isinstance(entry.get(k), str) and entry[k].strip()
                   for k in ("reviewed_by", "approved_by", "audit_reference")):
            raise ValueError("Approval entry needs independent audit metadata")
        if entry["approved_by"] == entry["reviewed_by"]:
            raise ValueError("Reviewer and independent approver must differ")
        if all(entry[k] == hashes[k] for k in hashes):
            matches.append(entry)
    if len(matches) != 1:
        raise ValueError("Connector evidence has no matching independent approval (fail closed)")
    approval = matches[0]
    if approval["reviewed_by"] != reviewer:
        raise ValueError("Approved reviewer does not match supplied evidence")
    return {**hashes,
            "approval_status": "repository-pinned-evidence-hash-match",
            "reviewed_by": reviewer,
            "approved_by": approval["approved_by"],
            "audit_reference": approval["audit_reference"],
            "physical_or_legal_access_independently_proven_by_code": False}
