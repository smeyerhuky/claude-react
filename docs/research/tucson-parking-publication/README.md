# Tucson visitor-entry publication and timed street advisory

The City of Tucson's visitor parking page explicitly names **Pennington Street
Garage, 110 E. Pennington St., entrance and exit on Scott Avenue**, with 711 public
spaces and 24-hour, seven-day operation. It describes visitor parking, ticket/card
entry, payment, exit requirements and a lost-ticket charge. This is stronger
published use context than a historical map-point label alone, but it does not
survey a driveway or establish the entire directed path from a graph endpoint.
Retrieved HTML excerpts retain those conditions, with the original response hash
and byte count. HTML runtime and form state are omitted; the response hash cannot
be recomputed from the selected text. Retrieval on 2026-10-30 does not itself
certify the publication's current accuracy or physical conditions.

The operator's home page also links a city **Congress Street Halloween closure
map**, exported **2026-10-29**. The original one-page public PDF is retained and
was inspected visually as well as by text extraction. Its stated closure window
is **5 p.m. Saturday, October 31 through 3 a.m. Sunday, November 1, 2026**, understood
as Tucson local civil clock times. The PDF does not print a numeric UTC offset.
This is a future event window relative to the October 30 retrieval, not proof
that Congress Street was closed at retrieval or that every garage route is closed.

The map separately marks local-traffic controls, alternative access, expected
congestion, operational streetcar service, parking facilities and neighborhood
permit conditions. Those categories are not interchangeable. We do not digitize
these symbols into graph arcs, infer a complete closure geometry from text, assign
the notice to a particular computed path, or assert garage access during the event.
The notice is a concrete reason an undated static OSM path cannot certify a current
or future driving itinerary without temporal access/turn modeling and evidence.

All complete connector findings remain unresolved: exact physical entry, legal
motor rights along the entire connector, same-grade continuity, directed entry/exit
and turns, and measured connector costs need a concrete path and independent review.
The publication does not supply reviewed coordinates, lengths, costs, turn-state
compatibility or a separate approver. No anchor is adopted, no connector approved,
no ledger written and no public road region activated. The #137 gate is unchanged.

`manifest.json` binds every retained evidence file and the precise event window.
`python scripts/tucson_parking_publication.py` replays the named visitor conditions,
PDF text and false approval flags using `pypdf==6.10.0`. Three tests reject altered
PDF bytes, a shifted event window and a fabricated approval claim. The workflow
also verifies the unchanged 33-source / 19-sample checkpoint: 2,508 costs, 2,356
finite and 152 modeled NoData. All older views and the public straight-line map
remain unchanged; no environment configuration or private draft archive is included.
