using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseCors();

var dataPath = Path.Combine(app.Environment.ContentRootPath, "data", "routes.json");
var routes = JsonSerializer.Deserialize<List<BusRoute>>(await File.ReadAllTextAsync(dataPath),
    new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? [];

app.MapGet("/api/routes", () => Results.Ok(routes.Select(ToResponse)));
app.MapGet("/api/routes/{number}", (string number) =>
{
    var route = routes.FirstOrDefault(x => x.Number.Equals(number, StringComparison.OrdinalIgnoreCase));
    return route is null ? Results.NotFound(new { message = "Route was not found." }) : Results.Ok(ToResponse(route));
});
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.Run();

static RouteResponse ToResponse(BusRoute route) => new(route.Number, route.Colors, route.Evidence,
    route.Stops, route.Geometry.Select(x => new Coordinate(x[0], x[1])).ToList());

record BusRoute(string Number, string Colors, string Evidence, List<string> Stops, List<double[]> Geometry);
record RouteResponse(string Number, string Colors, string Evidence, List<string> Stops, List<Coordinate> Geometry);
record Coordinate(double Lat, double Lon);
