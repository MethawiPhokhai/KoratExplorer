using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseCors();
app.Use(async (context, next) =>
{
    context.Response.Headers.CacheControl = "no-store";
    await next(context);
});

var dataPath = Path.Combine(app.Environment.ContentRootPath, "data", "routes.json");

app.MapGet("/api/routes", async (CancellationToken cancellationToken) =>
    Results.Ok(await ReadRoutes(dataPath, cancellationToken)));
app.MapGet("/api/routes/{number}", async (string number, CancellationToken cancellationToken) =>
{
    var routes = await ReadRoutes(dataPath, cancellationToken);
    var route = routes.EnumerateArray().FirstOrDefault(x =>
        string.Equals(x.GetProperty("number").GetString(), number, StringComparison.OrdinalIgnoreCase));
    return route.ValueKind == JsonValueKind.Undefined
        ? Results.NotFound(new { message = "Route was not found." })
        : Results.Ok(route);
});
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.Run();

// Read the editable source on every request so map corrections need no API restart.
static async Task<JsonElement> ReadRoutes(string path, CancellationToken cancellationToken) =>
    JsonSerializer.Deserialize<JsonElement>(await File.ReadAllTextAsync(path, cancellationToken));
