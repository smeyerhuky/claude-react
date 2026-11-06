# Complete retained restriction members in the 40-seed source corpus

This bounded expansion closes the six named missing way-member records. It
enumerates all original Colorado ways at the 40-node union of the first-hop
member nodes and the two previously retained via-way cases, then includes six
explicit additional member ways. No spatial, highway or access filter conceals
incident records. The capture retains **42 incident ways, 48 total ways, 175
complete node records and ten restrictions**, including an additional restriction
discovered by following the requested members.

The reusable extractor also retains touching `type=connectivity` and both
restriction/connectivity tag namespaces, even with an unexpected type. No such
connectivity record was captured for this selected source set; that observation
does not certify real-world lane connectivity. Raw member-way/node presence is
complete for the retained controls. All control semantics, outer-node incidence
and source/geographic completeness remain separate and unverified.

## Historical-profile audit

The audit preserves every previously retained shared raw record and per-seed
membership. It checks full geometry/node agreement, all named member identities,
the original source identity, and existing parent reports before evaluating the
historical permission/cost profile.

| Observation | Retained result |
| --- | --- |
| Supported road weights | 33 ways, 151 directed weights |
| Outside the explicit road classes | 13 source records |
| Unsupported in-class roads | 140486410 (lane context), 815164359 (bollard) |
| Individually compiled declarations | Nine |
| Unsupported declaration | 10475907, whose member has lane context |
| Missing retained way/node member records | Zero |
| Nodes still lacking incidence enumeration | 135 |

The six additional ways are 170833649, 696284588, 6167072, 322900293, 6167040 and
132998251. Their full geometry and every member-node record are included. Bus
exceptions remain raw evidence and are evaluated for the ordinary solo car by
the existing via-node selector; no bus exemption is granted to the car.

The whole in-class road candidate still returns `unsupported` with no graph or
route. Lane indications, unknown barriers, unsupported classes and additional
source controls are never deleted to force a successful historical projection.
This corpus does not change the historical profile or any older report.

## Reproduction and limits

Original size/SHA are verified before, between and after the passes. CI repeats
the capture against the exact original PBF and compares every retained byte.
Caps stay at 100 ways, 1,000 vertices per way, 2,000 distinct nodes, 100 control
relations and 32 members per relation. Excess input rejects rather than truncates.

Seven tests cover the actual complete-member corpus and source mutations, plus
a synthetic original-source fixture that checks non-highway incidence, explicit
members, restriction/connectivity namespaces, retained unknown tags, missing
members, exact file integrity and bounded failure. Synthetic fixtures provide
no physical or release approval.

```sh
python scripts/fort_collins_control_corpus.py --osm /path/to/original/colorado.osm.pbf --output /tmp/control-corpus.json
cmp /tmp/control-corpus.json docs/research/fort-collins-control-corpus/source-context.json
python -m unittest discover -s scripts -p test_fort_collins_control_corpus.py -v
python scripts/fort_collins_control_checkpoint.py
```

The old 2,508 Census costs, tiny kernels, all nine inspector views, public
straight-line map and empty connector ledger remain unchanged. Zero connectors
are approved and no anchors are adopted. Independent access/anchor review under
#137, geographic obligations under #138 and public-tab acceptance under #139
remain required. No city/state is marked complete by this source expansion.
Source OSM data © OpenStreetMap contributors, ODbL.
