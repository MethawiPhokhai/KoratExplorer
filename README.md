# Korat Explorer

A planned interactive 3D voxel map of Nakhon Ratchasima, Thailand. Select a real road to discover historical songthaew routes. Designed for phones and desktops, with account-free exploration badges saved in the browser.

## Plan and tickets

GitHub Issues is the canonical planning tracker:

- [Korat Explorer — blueprint and connected starter](https://github.com/MethawiPhokhai/KoratExplorer/issues/1)
- [Establish historical map coverage and usable route data](https://github.com/MethawiPhokhai/KoratExplorer/issues/2)
- [Choose the geographic voxel rendering approach](https://github.com/MethawiPhokhai/KoratExplorer/issues/3)
- [Define route matching, database and API contracts](https://github.com/MethawiPhokhai/KoratExplorer/issues/4)
- [Review a mobile-friendly voxel map interaction](https://github.com/MethawiPhokhai/KoratExplorer/issues/5)
- [Build and verify the connected starter and HTML blueprint](https://github.com/MethawiPhokhai/KoratExplorer/issues/6)

The plan contains the confirmed scope. Its five child issues carry native blocking relationships. See the issues for current progress and assignment. Research findings: [Historical map coverage and usable route data](historical-map-research.md).

## Intended deliverables

An HTML design document and one connected starter flow: select a sample road, call the .NET API, query SQL Server through Dapper and a stored procedure, and display matching routes.

| Code area | Contents |
| --- | --- |
| Frontend | HTML, JavaScript, CSS, reusable Axios GET/POST/PUT/DELETE helper |
| Backend | .NET C# Web APIs, vertical slices, repositories, Dapper, SQL Server schema and stored procedures |
| Models3D | All 3D model assets |
| Shared | Only necessary shared contracts and assets |

## Historical demo

The starting source is the [2017 Urban Bamboo songthaew article](https://urban-bamboo.com/2017/11/02/รถสองแถวโคราช/). Routes are not verified for current travel. Sample geometry must be labeled approximate. Exact coverage, route geometry and rendering choices will be established through the investigation tickets.

Journey planning, live tracking, player accounts and production deployment are outside this initial scope. Application code and the HTML blueprint are pending.
