# Rendering decision

For the first playable slice, use plain Three.js with `OrbitControls` and a small local scene. It gives the voxel look, camera rotation/zoom, touch support, raycast landmark selection, and no map-provider key.

Keep only a few famous-place anchors and stylized blocks: Ya Mo Monument, Terminal 2, Bung Ta Lua Park, and The Mall/Lotus. The scene is a visual prototype, not a full-city reconstruction.

When real road GeoJSON is available, draw it as simple line geometry in the same local coordinate frame. Keep geographic data and display models separate. Add a map renderer or tiled basemap only when the local scene cannot support a concrete requirement. This avoids tile-service dependency and keeps the first web run reproducible.

Acceptance checks: loads on a phone-sized viewport; drag/pinch/scroll changes the camera; landmark tap or list selection updates route details; route color and text remain readable; the scene stays under 1,000 simple meshes; no API key is required.

Sources: [Three.js documentation](https://threejs.org/docs/), [MapLibre Map API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/), [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), and [WCAG dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).
