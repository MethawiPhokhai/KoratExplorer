---
id: korat-map
title: Korat Explorer — blueprint and connected starter
labels: ["wayfinder:map"]
status: open
---

## Destination

Deliver an HTML design document and a connected starter for Korat Explorer: select a sample road on a geographically grounded voxel map, call a .NET API, query SQL Server through Dapper and a stored procedure, and show matching songthaew routes.

## Notes

- User-confirmed: interactive real-road map with pan and zoom; phones and desktops; route lookup only; bus numbers, colors, directions and highlighted paths. 3D landmark models are removed from the product surface.
- Initial coverage follows the bus-map image in the supplied Urban Bamboo article. Exact geographic bounds remain to be established.
- Historical demo based on the 2017 article, visibly unverified for current travel. Sample geometry must be labeled approximate. Never infer operational directions from a list of landmarks alone.
- Gamification: landmark badges and route-discovery challenges, no login; progress stored in the browser. These represent virtual exploration, not verified physical visits.
- SQL Server selected by user. Backend: .NET C#, Web APIs, vertical slices, repository pattern, Dapper and stored procedures. Frontend: HTML, JavaScript, CSS and a generic Axios HTTP helper.
- Four code areas remain documented for the planned architecture: Frontend, Backend, Models3D and Shared. The current starter uses only the Frontend real-road map and Backend route API; Models3D is deferred.
- Explicit destination includes execution: HTML documentation and one working starter flow were requested and confirmed. Charting ends before executing these deliverables; later sessions may implement them under this Notes override.
- Use wayfinder for coordination, research for source investigations, prototype for a user-reviewed visual, and ponytail for implementation. The referenced domain-modeling skill was not found in installed skill folders; domain questions are recorded explicitly in the tickets instead.
- No issue tracker was provided: local Markdown is the canonical tracker. See tracker.md for relationships and frontier rules.
- Source: https://urban-bamboo.com/2017/11/02/รถสองแถวโคราช/

## Decisions so far

No investigation tickets resolved yet. Confirmed user constraints are recorded above.

## Not yet specified

- Further visual and accessibility adjustments may emerge when the user tries the voxel prototype on a phone.
- The extent of historical route reconstruction work will become clearer after inspecting the map image against geographic data.

## Out of scope

- Journey planning, transfers, live vehicles, arrival predictions and verified current travel guidance.
- Player accounts, cross-device progress, leaderboards and physically verified exploration.
- Walking characters, full-city asset production and expansion beyond the initial map area.
- Production deployment and complete digitization of every historical route in the starter.


## GitHub publication

Published to [Korat Explorer — blueprint and connected starter](https://github.com/MethawiPhokhai/KoratExplorer/issues/1). GitHub Issues is now canonical; this directory is the original planning snapshot. Use GitHub for current status, labels, claims, resolutions and native dependencies.
