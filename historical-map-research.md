# Historical map coverage and usable route data

Research date: 15 September 2026. Resolves [Establish historical map coverage and usable route data](https://github.com/MethawiPhokhai/KoratExplorer/issues/2).

## Decision

Use the article as historical route evidence, and a separately sourced geographic road dataset as the map base. Preserve conflicting observations instead of merging them into an apparently authoritative route. The source image defines a landmark-based area of interest; it does not provide an exact geographic bounding box.

## Source inspection

The relevant asset is [Korat Minivan Route, original image](https://urban-bamboo.com/wp-content/uploads/2017/11/img_7353-1.jpg), inspected at its original 1334 × 943 resolution. The [article](https://urban-bamboo.com/2017/11/02/รถสองแถวโคราช/) separately contains food and cycling maps; those are not the requested coverage reference.

The bus diagram depicts Save One and the western railway approach, The Mall/Lotus, the old city, Terminal 21, Bus Terminal 2, Central Plaza, Wat Sala Loi, Bung Ta Lua and Suranaree military/sports landmarks. It is schematic, with no coordinate grid or scale suitable for direct tracing.

The text has 18 distinct route numbers and 21 entries: numbers 1–15, 17, 18 and 20; 1, 6 and 11 have multiple entries. The image includes 19, absent from the text. Its route 17 terminus differs from the text. Colors and landmarks alone do not establish directions, boarding stops or service dates. These are observations of the supplied historical material, not current-service findings.

## Coverage rule

Adopt the **depicted urban corridor**, approximately Save One/western railway approach through the old city, north toward Bus Terminal 2/Central Plaza, northeast toward Wat Sala Loi, and south toward Bung Ta Lua/Suranaree sports and military landmarks. This is a semantic envelope, not a survey boundary. Outer route endpoints in the legend are not automatically inside coverage.

Do not publish invented numeric bounds. Before importing the starter scene, locate the depicted boundary landmarks in the chosen geographic snapshot, record their object identifiers and coordinates, then save a reviewed coverage polygon and a small import buffer. Keep camera limits separate from data coverage. This implementation check is required by the starter ticket; the rendering/database investigations can proceed with a configurable coverage polygon.

The image is not a georeferenced raster. Converting its pixels directly to latitude/longitude would create misleading roads. Reuse geographic road coordinates; use the diagram only to interpret historical route relationships. Clip the displayed part of a route without implying the route terminates at the edge.

## Small connected-flow sample

Recommended candidate: one reviewed road segment in the Ya Mo–Klang Mai corridor, with **route 1** as an explicitly approximate historical association. Select one of its source variants and retain its vehicle-color identity. The corridor is a candidate, not a verified street-level path or boarding instruction.

Choose the exact road segment only after matching the landmarks to the geographic base. Seed one route variant and one road association for the connected flow. Set direction to unknown until evidence supports it. The UI should show: “Historical demo · approximate path · direction not verified.” Do not fabricate outbound/return lines.

If the actual alignment cannot be established, use a separately named synthetic demonstration route on real road geometry. Never assign a real bus number to that synthetic fixture. The app must distinguish an empty result from incomplete coverage.

## Minimal evidence record for the later database design

These are data requirements, not a finalized schema:

- Source URL, asset URL, publication label, retrieval date and source kind (article text versus diagram).
- Route display number, distinct source-entry/variant identity, original color description and landmark references.
- Road dataset timestamp, original object identifiers, coordinates and import manifest.
- Route-to-road evidence and uncertainty: historical observation, approximate interpretation or synthetic sample; do not collapse these states.
- Direction unknown unless independently supported; landmarks are not confirmed stops.
- Keep the route 17 disagreement and image-only route 19 as unresolved source observations, excluded from the first seed.

## Geographic data and repeatable import

Use a dated [Geofabrik Thailand OSM extract](https://download.geofabrik.de/asia/thailand.html). It supplies raw PBF data; historical snapshots are also listed. A present-day road base does not prove past or present bus service.

Proposed import procedure:

1. Record the download URL, snapshot timestamp, checksum, tool version and coverage polygon.
2. Extract the buffered area with [Osmium extract](https://docs.osmcode.org/osmium/latest/osmium-extract.html). Its complete-ways strategy preserves referenced ways; it is not an exact display clip.
3. Retain relevant roads, names, one-way attributes and OSM type/IDs; convert with [Osmium export](https://docs.osmcode.org/osmium/latest/osmium-export.html).
4. Store a small local GeoJSON artifact for the starter. Keep original geometry for queries; simplify a separate display copy for the voxel scene.
5. Review the sample route association manually and save its uncertainty with the seed data.

No nationwide data download, exact road import or numerical landmark verification was performed during this investigation. Those are explicit starter acceptance checks, not completed results.

## Attribution and reuse

The [OSM copyright page](https://www.openstreetmap.org/copyright) specifies ODbL and attribution requirements. Show linked “© OpenStreetMap contributors” credit, preserve source/license metadata, and include applicable ODbL notices with distributed data. Review the actual distribution against those terms.

Use raw geographic data for the scene. The [OSMF tile policy](https://operations.osmfoundation.org/policies/tiles/) prohibits bulk/offline downloads from its standard tile service. It is not a source for an offline texture archive.

Do not ship the article image as a texture or redistribute it on the assumption that it is openly licensed. Link to it as reference; permission for image reuse has not been established. Create original voxel assets. Geographic-data licensing does not grant rights to the article artwork.

## Completion and handoff

This investigation establishes the correct image, approximate landmark coverage, evidence limitations, sample candidate and geographic import approach. It does **not** claim exact bounds or a verified route geometry.

The database ticket is now ready to investigate route matching and evidence storage. The rendering ticket remains ready. The starter must verify the boundary landmarks and sample alignment before claiming a geographically checked end-to-end example. Further reconstruction beyond this small sample remains outside the starter scope.
