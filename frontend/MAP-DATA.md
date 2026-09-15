# Map geometry

`korat-osm.json` is a saved OpenStreetMap snapshot downloaded through https://overpass-api.de/api/interpreter on 2026-09-15. Bounds: south 14.94, west 102.06, north 15.02, east 102.12. Queries: `way[highway](14.94,102.06,15.02,102.12);out geom;` and the same query with `[building]`.

© OpenStreetMap contributors, https://www.openstreetmap.org/copyright, ODbL. The snapshot retains the source timestamp and attribution. Reloading uses this same file, never random placements.

Every road vertex and building footprint is projected using Leaflet EPSG:3857 with the same origin as the landmark anchors; north maps to negative Three.js Z. Building heights default to six metres when unrecorded. Widths use road-class estimates. Simple closed building ways are supported; relation-based multipolygons are outside this snapshot.

Landmark models remain illustrative and anchors approximate except Terminal 2, anchored to the mean of OSM building way 334736758. Road and footprint geometry is sourced; this is not a surveyed replica or a complete building inventory.
