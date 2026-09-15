# Route matching and API contract

Decision for the first connected slice: return historical route variants for a selected `roadSegmentId`. Keep explicit reviewed associations in SQL Server; do not infer bus service from distance alone.

## Minimal tables

```sql
RoadSegment(Id int primary key, Name nvarchar(200) not null,
  Geometry geography not null, SourceObjectId nvarchar(80) null)
Route(Id int primary key, DisplayNumber nvarchar(20) not null)
RouteVariant(Id int primary key, RouteId int not null references Route(Id),
  VehicleColors nvarchar(100) not null, Direction nvarchar(50) null,
  Evidence nvarchar(30) not null, SourceUrl nvarchar(500) not null,
  Notes nvarchar(1000) null)
RouteRoad(RouteVariantId int references RouteVariant(Id),
  RoadSegmentId int references RoadSegment(Id),
  MatchKind nvarchar(30) not null, SortOrder int null,
  primary key(RouteVariantId,RoadSegmentId))
```

`Evidence` is `historical-observation`, `approximate`, or `synthetic-demo`. `Direction = NULL` means unknown. The route number is not unique: variants are separate rows.

## Procedure and endpoint

```sql
create procedure dbo.RoutesForRoad @RoadSegmentId int as
select r.DisplayNumber as RouteNumber, v.VehicleColors, v.Direction,
       v.Evidence, v.SourceUrl, v.Notes
from RouteRoad rr join RouteVariant v on v.Id=rr.RouteVariantId
join Route r on r.Id=v.RouteId
where rr.RoadSegmentId=@RoadSegmentId
order by r.DisplayNumber, rr.SortOrder;
```

`GET /api/roads/{id}/routes` returns `{ roadSegmentId, roadName, routes[] }`. Unknown IDs return 404; valid roads with no reviewed links return 200 with an empty array. The frontend displays the evidence label and historical warning on every result.

The vertical slice is one feature folder: endpoint validates the positive integer, handler calls `IRouteRepository`, repository opens `SqlConnection` and calls `QueryAsync<RouteMatch>("dbo.RoutesForRoad", new { RoadSegmentId=id }, commandType: CommandType.StoredProcedure)`, then maps the result to the shared response contract. Dapper is used directly; no generic repository or ORM abstraction is needed.

## Geometry and future pin lookup

Use SQL Server `geography` with SRID 4326 for imported longitude/latitude. The first slice selects a known road ID. A later pin endpoint can accept longitude/latitude and a meter tolerance, rank candidate segments with `STDistance`, and return `outsideCoverage` when none is within tolerance. It must preserve the reviewed `RouteRoad` links instead of treating nearest geometry as evidence of service.

Browser badges remain local state (`localStorage`); they are not transit tables and require no account endpoint.

## Acceptance examples

- Ya Mo sample road returns route 1 and its vehicle-color variant with `Evidence=approximate`, `Direction=NULL`.
- A valid road with no links returns `routes: []` and an incomplete-coverage message.
- `0`, non-integer IDs and missing roads return a client-safe 400/404 response.
- No response calls a route current or verified.

Primary references: [SQL Server spatial data](https://learn.microsoft.com/sql/relational-databases/spatial/spatial-data-types-overview), [STDistance](https://learn.microsoft.com/sql/t-sql/spatial-geography/stdistance-geography-data-type), [Dapper](https://github.com/DapperLib/Dapper), and [ASP.NET Web API](https://learn.microsoft.com/aspnet/core/web-api/).
