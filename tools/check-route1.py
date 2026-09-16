"""Regression check: a road-snapped vertex alone does not prove a road path."""
import importlib.util
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('builder', ROOT/'tools/build-route1.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
data=json.loads((ROOT/'frontend/korat-osm.json').read_text())
route=json.loads((ROOT/'backend/data/routes.json').read_text())[0]
provenance=json.loads((ROOT/'backend/data/route1-provenance.json').read_text())
nodes,graph=builder.build_graph(data)
edges=provenance['osmEdges']
assert len(route['geometry'])>200, 'Coarse waypoint chords have returned'
assert len(edges)==len(route['geometry'])-1
for index,(a,b,way,name) in enumerate(edges):
    assert any(nxt==b and wid==way for nxt,_,wid,_ in graph[a]), f'Not an actual road edge: {a} -> {b}'
    assert tuple(route['geometry'][index])==nodes[a]
    assert tuple(route['geometry'][index+1])==nodes[b]
intentional_loop={5269692247,11403001600,11403001599,5259787751}
repeated={e[0] for e in edges if sum(x[0]==e[0] for x in edges)>1}
assert repeated <= intentional_loop, 'Unintended repeated road loop'
assert len(route['stops'])==14
assert route['stops'][0]['name']=='30 กันยา'
assert route['stops'][-1]['name']=='สุรนารีวิลเลจ'
assert all(isinstance(s,dict) and s['name'] for s in route['stops'])
assert len(builder.TRACE)==len(builder.STREETS)
assert provenance['calibrationMaxErrorPixels']<2

def point_segment(p,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)))
    return math.dist(p,(a[0]+t*dx,a[1]+t*dy))

trace=builder.TRACE
pixels=[builder.geo_pixel(*p) for p in route['geometry']]
deviation=max(min(point_segment(p,a,b) for a,b in zip(trace,trace[1:])) for p in pixels)
assert deviation<25, f'Route has left the annotated corridor ({deviation:.1f} px)'
coverage=max(min(point_segment(p,a,b) for a,b in zip(pixels,pixels[1:])) for p in trace)
assert coverage<25, f'An annotated bend was skipped ({coverage:.1f} px)'
assert route['geometry'][0][0]>15.0 and route['geometry'][0][1]>102.13, 'NE approach missing'
assert route['geometry'][-1][0]<14.947 and 102.064<route['geometry'][-1][1]<102.069, 'Wrong southern street'
print(f'PASS: {len(edges)} connected OSM edges; 14 independent place records; corridor deviation {deviation:.1f}px; reverse coverage {coverage:.1f}px')
