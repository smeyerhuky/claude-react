# Raw turn-restriction syntax in five exact state snapshots

A full relation pass over each retained original Colorado, New Mexico, Arizona,
Utah and Oklahoma PBF counted **32,488** relations whose `type` equals
`restriction`. **3,885** include a via-way member and **366** have a conditional
key. These overlapping diagnostics show why the bounded explicit via-node Tucson
probe is insufficient as a state or national turn engine. Nothing here upgrades
the existing node-only graph or authorizes public isochrone regions.

| Exact source | Raw restriction relations | Via-way member | Conditional key | Exception key |
| --- | ---: | ---: | ---: | ---: |
| Colorado | 9,530 | 1,163 | 65 | 77 |
| New Mexico | 1,814 | 367 | 2 | 0 |
| Arizona | 7,905 | 1,691 | 236 | 75 |
| Utah | 3,407 | 277 | 8 | 20 |
| Oklahoma | 9,832 | 387 | 55 | 21 |

These are **raw relation counts**, not counts of applicable ordinary-car turns,
unsupported routes or legal violations. Some relations are mode-specific or exempt
private cars. An absent generic `restriction` key may accompany a mode-specific
key; it is not permission to ignore the relation. Generic values outside the
small via-node probe vocabulary include `no_right_turn_on_red`, `no_entry`, and
an inline timed restriction in New Mexico. A conditional-key count does not
capture every temporally meaningful value, as that inline syntax demonstrates.
Diagnostics overlap and must not be summed into an unsupported-relation total.

Via-way support needs path-history state, exact directed way/arc identity and
reviewed relation semantics. Even a standard via-node relation may have an
ambiguous unsplit approach or departure. Physical grade, signs, closures,
exceptions, car applicability and connector arrival/departure state need their
own evidence and model contracts. Node/way access tags and restrictions missing
from OSM are outside this relation inventory. All sources are dated snapshots,
not current operational street certifications. Extract boundaries do not prove
complete geographic or exterior routing coverage.

The scanner verifies each source's size and SHA-256 against the retained
33-source checkpoint before and after reading. It rejects a source mismatch,
missing input, duplicate relation identity or exhausted relation/member budget
rather than returning a partial report. A canonical digest covers every selected
relation's ID, tags and members in ascending-ID order. Up to three ascending-ID
examples per diagnostic flag are retained to make the syntax inspectable; these
examples are explicitly not the full raw inventory. Full PBFs and the private
draft archive are not published. Retained OSM examples are © OpenStreetMap
contributors, ODbL.

The five original inputs were recounted locally on 2026-10-30; a separate direct
raw pass agreed on the counts above. Reproduce using `osmium==4.3.2`:

```sh
python scripts/metro_restriction_inventory.py --osm-dir /path/to/exact/inputs --compare docs/research/state-restriction-inventory/report.json
```

CI checks diagnostic behavior on fixtures, exact source identity bindings,
internal totals, bounded examples and false certification flags. **That offline
CI does not repeat the original-source recount.** Three tests cover overlapping
mode/conditional syntax, order-independent full fingerprints with bounded samples,
input budgets, duplicates and altered original bytes. A separate Tucson full-source
probe CI is held while its canonical original download is unavailable; this
inventory does not replace that required verification or bypass it.

All turn-support, coverage, access and release certification flags remain false.
No anchors are adopted, zero connectors are approved, and the #137 independent
access-evidence/different-approver gate remains intact. The unchanged frozen UI
has 2,508 graph-only costs, 2,356 finite and 152 modeled NoData. Existing inspector
views and the public straight-line map remain unchanged.
