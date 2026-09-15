# Issue 4: minimum route-matching data contract

## Recommendation

Use one read endpoint for the first vertical slice:

`GET /api/roads/{roadId}/routes`

It returns route variants attached to the selected road, including a distance/status field that makes the historical approximation visible. The frontend can use the response directly to render route cards and highlighted paths.

Keep route geometry as `geography` with SRID 4326. Use a `LineString` for each route variant and a `LineString` for each road segment. SQL Server's `STDistance` returns an approximate geodesic distance and returns `NULL` when SRIDs differ; use the same SRID everywhere. SQL Server spatial indexes can support `STDistance` predicates when used in the `WHERE` clause. [STDistance](https://learn.microsoft.com/en-us/SQL/t-SQL/spatial-geography/stdistance-geography-data-type?view=sql-server-2017), [spatial index support](https://learn.microsoft.com/ga-ie/sql/relational-databases/spatial/spatial-indexes-overview?view=sql-server-ver17)

## Minimum schema

```sql
CREATE TABLE dbo.RoadSegment (
    RoadId int IDENTITY PRIMARY KEY,
    NameTh nvarchar(200) NOT NULL,
    NameEn nvarchar(200) NULL,
    Shape geography NOT NULL,
    CONSTRAINT CK_RoadSegment_Srid CHECK (Shape.STSrid = 4326)
);

CREATE TABLE dbo.BusRouteVariant (
    RouteVariantId int IDENTITY PRIMARY KEY,
    RouteNumber nvarchar(30) NOT NULL,
    Direction nvarchar(100) NULL,
    ColorHex char(7) NULL,
    Shape geography NOT NULL,
    SourceUrl nvarchar(500) NOT NULL,
    DataStatus nvarchar(30) NOT NULL DEFAULT 'historical-demo',
    Confidence nvarchar(20) NOT NULL DEFAULT 'approximate',
    CONSTRAINT CK_BusRouteVariant_Srid CHECK (Shape.STSrid = 4326)
);

CREATE TABLE dbo.RoadRouteVariant (
    RoadId int NOT NULL REFERENCES dbo.RoadSegment(RoadId),
    RouteVariantId int NOT NULL REFERENCES dbo.BusRouteVariant(RouteVariantId),
    DistanceMeters float NULL,
    PRIMARY KEY (RoadId, RouteVariantId)
);

CREATE SPATIAL INDEX IX_RoadSegment_Shape ON dbo.RoadSegment(Shape);
CREATE SPATIAL INDEX IX_BusRouteVariant_Shape ON dbo.BusRouteVariant(Shape);
```

The join table is deliberate: it lets imported or manually reviewed road/route matches be stored, while the API can also calculate a provisional match from geometry. For the first demo, the procedure below calculates a match and does not require pre-populating the join table.

## Stored procedure

```sql
CREATE OR ALTER PROCEDURE dbo.GetRoutesForRoad
    @RoadId int,
    @ToleranceMeters float = 75
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @road geography = (
        SELECT Shape FROM dbo.RoadSegment WHERE RoadId = @RoadId
    );

    IF @road IS NULL
        THROW 50001, 'Road not found', 1;

    SELECT
        r.RouteVariantId,
        r.RouteNumber,
        r.Direction,
        r.ColorHex,
        r.DataStatus,
        r.Confidence,
        r.SourceUrl,
        r.Shape.STAsText() AS ShapeWkt,
        r.Shape.STDistance(@road) AS DistanceMeters
    FROM dbo.BusRouteVariant AS r
    WHERE r.Shape.STDistance(@road) <= @ToleranceMeters
    ORDER BY r.RouteNumber, r.Direction;
END;
```

`STDistance` against a route line is sufficient for a small historical demo. It is a proximity approximation, not proof that a bus serves every point on the road. If false positives appear, split roads into shorter segments and lower the tolerance; only then add a more complex `STIntersects`/buffer rule.

## API shape

Request:

```http
GET /api/roads/12/routes?toleranceMeters=75
```

Response:

```json
{
  "roadId": 12,
  "toleranceMeters": 75,
  "dataStatus": "historical-demo",
  "routes": [
    {
      "routeVariantId": 3,
      "routeNumber": "1",
      "direction": "อนุสาวรีย์ย่าโม → สถานีขนส่ง",
      "colorHex": "#f2c94c",
      "distanceMeters": 18.4,
      "confidence": "approximate",
      "dataStatus": "historical-demo",
      "sourceUrl": "https://urban-bamboo.com/2017/11/02/รถสองแถวโคราช/",
      "shapeWkt": "LINESTRING(...)"
    }
  ]
}
```

Return an empty `routes` array for a valid road with no match. Return 404 for an unknown road. Keep `historical-demo` and `approximate` in the payload so the UI cannot accidentally present old source data as live transit information.

## Dapper repository and vertical slice

The repository needs one method only:

```csharp
public sealed record RouteMatch(
    int RouteVariantId, string RouteNumber, string? Direction,
    string? ColorHex, string DataStatus, string Confidence,
    string SourceUrl, string ShapeWkt, double DistanceMeters);

public interface IRoadRoutes {
    Task<IReadOnlyList<RouteMatch>> ForRoad(int roadId, double toleranceMeters);
}

public sealed class RoadRoutes(SqlConnection db) : IRoadRoutes {
    public async Task<IReadOnlyList<RouteMatch>> ForRoad(int roadId, double toleranceMeters) =>
        (await db.QueryAsync<RouteMatch>(
            "dbo.GetRoutesForRoad",
            new { RoadId = roadId, ToleranceMeters = toleranceMeters },
            commandType: CommandType.StoredProcedure)).AsList();
}
```

Dapper exposes asynchronous `QueryAsync<T>` extension methods on ADO.NET connections and accepts stored-procedure command type and parameters; this is enough for the slice. [Dapper repository/API](https://github.com/DapperLib/Dapper)

An ASP.NET Core Minimal API handler can stay equally small:

```csharp
app.MapGet("/api/roads/{roadId:int}/routes",
    async (int roadId, double? toleranceMeters, IRoadRoutes routes) =>
    Results.Ok(new {
        roadId,
        toleranceMeters = toleranceMeters ?? 75,
        dataStatus = "historical-demo",
        routes = await routes.ForRoad(roadId, toleranceMeters ?? 75)
    }));
```

ASP.NET Core Minimal APIs are built around `WebApplication` and route handlers such as `MapGet`; this is an appropriate low-boilerplate vertical slice. [Minimal APIs quick reference](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis?view=aspnetcore-10.0)

## Deliberate omissions

- No accounts, live vehicle positions, journey planning, or route editing.
- No ORM or generic repository abstraction beyond the one use case.
- No full-city road import; seed four landmark areas first.
- No geometry serialization library in the first slice: WKT is returned because it is already produced by SQL Server and can be parsed or ignored by the prototype.

These can be added after the click-road → API → stored procedure → route-card flow works.
