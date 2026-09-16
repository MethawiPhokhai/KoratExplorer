# Korat Explorer

Run the real-road map slice:

    cd frontend
    python3 -m http.server 8080

Open http://localhost:8080. The prototype uses an OpenStreetMap road view and an internet connection for map tiles. Click a real road to see matching songthaew routes; 3D landmark mode has been removed from the product surface.

This is a historical route prototype. It does not claim current bus service.

## Route API slice

Run the JSON-backed API from the repository root:

    dotnet run --project backend/KoratExplorer.Api.csproj --urls http://localhost:5080

Endpoints:

    GET /api/routes
    GET /api/routes/1
    GET /api/health

The first route is stored in `backend/data/routes.json`; no database is used. The API rereads that file on every request and sends `Cache-Control: no-store`. Keep the API running on port 5080 while viewing the frontend on port 8080. The frontend shows a retry message if the API is unavailable; there is no second fallback dataset.

Route 1 follows the user's red annotation using connected OSM road edges through Suranarai, the old city, Pho Klang, Muk Montri and Suebsiri. The northeast extension follows the annotation, not an independently verified bus terminus. This is a historical corridor reconstruction; road direction restrictions and current service have not been confirmed. Named places are independent of geometry vertices. Four uncertain places have null coordinates instead of invented markers.

Regenerate and check the data:

    python3 tools/build-route1.py
    python3 tools/check-route1.py
    node --check frontend/app.js
    dotnet build backend/KoratExplorer.Api.csproj
    node backend/tests/api.mjs backend/bin/Debug/net8.0/KoratExplorer.Api.dll

`tools/route1-stops.json` records place coordinates and evidence. `backend/data/route1-provenance.json` records the screenshot calibration and OSM edge IDs. The check verifies every rendered segment is a real connected road edge, and that the path remains within the annotated corridor. The API test verifies edits are returned without restarting.
