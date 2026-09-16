# Map geometry

The starting snapshot below was extended on 2026-09-16 with an additional OSM `way[highway](14.94,102.115,15.025,102.15);out geom;` query. Combined display bounds are south 14.94, west 102.06, north 15.025, east 102.15. New ways include the full northeast Suranarai approach from the user's red annotation; duplicates are merged by OSM object ID. Attribution and licence remain unchanged.

Route 1 is generated from that annotation using connected road edges, with edge IDs and calibration recorded in `backend/data/route1-provenance.json`. Its painted width is for legibility, not surveyed bus-lane width. Source geometry remains unchanged in both views. The Ya Mo anchor was corrected to OSM monument way 549315244 at 14.9747299, 102.0981171. Four route-place coordinates remain unknown and are not plotted.

`korat-osm.json` is a saved OpenStreetMap snapshot downloaded through https://overpass-api.de/api/interpreter on 2026-09-15. Bounds: south 14.94, west 102.06, north 15.02, east 102.12. Queries: `way[highway](14.94,102.06,15.02,102.12);out geom;` and the same query with `[building]`.

© OpenStreetMap contributors, https://www.openstreetmap.org/copyright, ODbL. The snapshot retains the source timestamp and attribution. Reloading uses this same file, never random placements.

Every road vertex and building footprint is projected using Leaflet EPSG:3857 with the same origin as the landmark anchors; north maps to negative Three.js Z. Building heights default to six metres when unrecorded. Widths use road-class estimates. Simple closed building ways are supported; relation-based multipolygons are outside this snapshot.

Landmark models remain illustrative and anchors approximate except Terminal 2, anchored to the mean of OSM building way 334736758. Road and footprint geometry is sourced; this is not a surveyed replica or a complete building inventory.

## Corrected landmarks and lake
The Mall anchor comes from OSM way 334736739; Terminal 21 from way 363719867 (mean of polygon vertices). Lotus Mittraphap uses OSM node 13944088769, 14.9779455, 102.0707623. These are separate locations and share their coordinates across both views.
`bung-lake.json` contains OSM relation 7879253, downloaded 2026-09-15 via Overpass, © OpenStreetMap contributors / ODbL. Both outer rings and the inner island are rendered and selectable as Bung Ta Lua Park. New shopping landmarks have no assumed bus-route assignments.
