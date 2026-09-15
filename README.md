# Korat Explorer

Run the first voxel map slice:

    cd frontend
    python3 -m http.server 8080

Open http://localhost:8080. It uses Three.js from a public CDN, so an internet connection is required for the first prototype. The scene contains four famous-place anchors, stylized blocks, route lookup cards, touch/mouse camera controls, and historical-data warnings.

This is intentionally a small visual slice. It does not claim current bus service and does not include the backend yet.

## Route API slice

Run the JSON-backed API from the repository root:

    dotnet run --project backend/KoratExplorer.Api.csproj --urls http://localhost:5080

Endpoints:

    GET /api/routes
    GET /api/routes/1
    GET /api/health

The first route is stored in `backend/data/routes.json`; no database is used. The frontend tries the API first and falls back to `frontend/route-data.json` for the static prototype. Route 1 displays its stops and draws its saved latitude/longitude path over the real road layer. Stops and geometry are historical/approximate until each point is surveyed against road data.
