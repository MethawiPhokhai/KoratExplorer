"""Rebuild route 1 from the user's red corridor using actual OSM graph edges.

This is a historical corridor reconstruction, not a turn-by-turn router:
direction restrictions are not inferred from the hand-drawn reference.
"""
import heapq
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RADIUS = 6378137

def project(lat, lon):
    return RADIUS * math.radians(lon), RADIUS * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))

def unproject(x, y):
    return math.degrees(2 * math.atan(math.exp(y / RADIUS)) - math.pi / 2), math.degrees(x / RADIUS)

def fit(pairs):
    a, b = zip(*pairs)
    ma, mb = sum(a) / len(a), sum(b) / len(b)
    slope = sum((x-ma)*(y-mb) for x,y in pairs) / sum((x-ma)**2 for x in a)
    return slope, mb - slope * ma

# Pixel centres of existing landmark pins in the user's 1165 x 964 screenshot.
# These recover the map's own Mercator coordinates, not the stylized 2017 map.
CONTROL = [(374,430,14.9779455,102.0707623),
           (640,307,14.98861586,102.09465374),
           (591,385,14.98200721,102.09027624)]
SX, BX = fit([(x,project(lat,lon)[0]) for x,y,lat,lon in CONTROL])
SY, BY = fit([(y,project(lat,lon)[1]) for x,y,lat,lon in CONTROL])
def pixel_geo(x,y):
    return unproject(x*SX+BX,y*SY+BY)
def geo_pixel(lat,lon):
    x,y=project(lat,lon)
    return (x-BX)/SX,(y-BY)/SY

# NE -> old-city loop -> west past railway -> southern endpoint, matching the red ink.
TRACE = [(1098,139),(1093,169),(1072,192),(1040,216),(1007,235),
         (963,253),(927,276),(887,309),(848,343),(810,379),(780,405),
         (764,409),(762,424),(778,430),(820,432),(815,460),
         (780,463),(728,463),(679,463),(650,460),(622,459),(585,466),
         (548,472),(516,479),(490,487),(461,490),(432,498),(399,507),
         (400,494),(383,492),(355,498),(333,503),
         (333,523),(326,563),(319,602),(316,644),(316,686),(315,725),
         (323,765),(330,813)]

# Match the named street at each part of the annotation, not adjacent driveways.
STREETS = (['ถนนสุรนารายณ์']*10 + ['ถนนนครราชสีมา - หินโคน', 'ถนนประจักษ์',
           'ถนนประจักษ์', 'ถนนยมราช', 'ถนนยมราช', 'ถนนจอมพล'] +
           ['ถนนจอมพล']*2 + ['ถนนชุมพล'] + ['ถนนโพธิ์กลาง']*4 +
           ['ถนนมุขมนตรี']*9 + ['ถนนสืบศิริ']*8)

def build_graph(data):
    nodes, adjacency = {}, {}
    allowed={'trunk','trunk_link','primary','primary_link','secondary','secondary_link',
             'tertiary','tertiary_link','residential','unclassified','living_street'}
    for w in data['elements']:
        tags=w.get('tags',{})
        if tags.get('highway') not in allowed or tags.get('access') in ('private','no'):
            continue
        for nid,p in zip(w['nodes'],w['geometry']):
            nodes[nid]=(p['lat'],p['lon'])
        for a,b in zip(w['nodes'],w['nodes'][1:]):
            if a==b: continue
            pa,pb=project(*nodes[a]),project(*nodes[b])
            length=math.dist(pa,pb)
            for start,end in ((a,b),(b,a)):
                adjacency.setdefault(start,[]).append((end,length,w['id'],tags.get('name',tags['highway'])))
    return nodes,adjacency

def shortest(graph,start,end):
    queue=[(0,start)]; distance={start:0}; previous={}
    while queue:
        cost,node=heapq.heappop(queue)
        if cost!=distance[node]: continue
        if node==end: break
        for nxt,length,way,name in graph.get(node,[]):
            value=cost+length
            if value<distance.get(nxt,float('inf')):
                distance[nxt]=value;previous[nxt]=(node,way,name);heapq.heappush(queue,(value,nxt))
    if end not in distance: raise ValueError(f'No connected road path {start} -> {end}')
    chain=[];cur=end
    while cur!=start:
        prev,way,name=previous[cur];chain.append((prev,cur,way,name));cur=prev
    return list(reversed(chain))

def main():
    data=json.loads((ROOT/'frontend/korat-osm.json').read_text())
    nodes,graph=build_graph(data)
    px={nid:geo_pixel(*pos) for nid,pos in nodes.items()}
    anchors=[]
    for i,(point,street) in enumerate(zip(TRACE,STREETS)):
        candidates=[n for n in graph if any(e[3]==street for e in graph[n])]
        # The northeast road is divided: keep its southwest-bound carriageway.
        if i<9: candidates=[n for n in candidates if any(e[2]==918099270 for e in graph[n])]
        anchors.append(min(candidates,key=lambda n:math.dist(px[n],point)))
    edges=[]
    for a,b in zip(anchors,anchors[1:]): edges.extend(shortest(graph,a,b))
    # The red corridor has no return loops. Drop out-and-back spurs caused by
    # hand-drawn anchors falling just past the same intersection.
    simple=[];visited={edges[0][0]:0}
    for edge in edges:
        if edge[1] in visited:
            cut=visited[edge[1]]
            for removed in simple[cut:]: visited.pop(removed[1],None)
            simple=simple[:cut]
        else:
            simple.append(edge);visited[edge[1]]=len(simple)
    edges=simple
    # The selected red road south of Ya Mo is a short connected loop from
    # Chomphon. Keep it in the route so the rendered line reaches that road.
    branch=[(5269692247,11403001600,43342620,'ถนนวัชรสฤทธิ์'),
            (11403001600,11403001599,43342620,'ถนนวัชรสฤทธิ์'),
            (11403001599,5259787751,43342620,'ถนนวัชรสฤทธิ์'),
            (5259787751,11403001599,43342620,'ถนนวัชรสฤทธิ์'),
            (11403001599,11403001600,43342620,'ถนนวัชรสฤทธิ์'),
            (11403001600,5269692247,43342620,'ถนนวัชรสฤทธิ์')]
    for i,edge in enumerate(edges):
        if edge[:2]==(5269692247,5441998455):
            edges[i:i]=branch
            break
    geometry=[nodes[edges[0][0]]]+[nodes[e[1]] for e in edges]
    report={'source':'User red annotation Screenshot 2569-09-16 at 01.33.59.png',
            'controls':CONTROL,'tracePixels':TRACE,'anchorNodes':anchors,
            'osmEdges':edges,'calibrationMaxErrorPixels':max(math.dist(geo_pixel(lat,lon),(x,y)) for x,y,lat,lon in CONTROL)}
    (ROOT/'backend/data/route1-provenance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    route=json.loads((ROOT/'backend/data/routes.json').read_text())[0]
    route.update(geometry=geometry,stops=json.loads((ROOT/'tools/route1-stops.json').read_text()),revision='route1-red-osm-v2',evidence='historical-corridor-reconstruction',
                 notes='แนวอ้างอิงจากเส้นแดงของผู้ใช้ เชื่อมตามถนน OSM และวนถนนวัชรสฤทธิ์ตามจุดที่เลือก; ยังไม่ยืนยันทิศทางเดินรถหรือบริการปัจจุบัน')
    (ROOT/'backend/data/routes.json').write_text(json.dumps([route],ensure_ascii=False,indent=2)+'\n')
    print('vertices',len(geometry),'length metres',round(sum(math.dist(project(*nodes[a]),project(*nodes[b])) for a,b,_,_ in edges)),
          'calibration px',round(report['calibrationMaxErrorPixels'],2))
    names=[]
    for a,b,way,name in edges:
        if not names or names[-1]!=name: names.append(name)
    print(' -> '.join(names))
    print('max anchor offset pixels',round(max(math.dist(px[n],p) for n,p in zip(anchors,TRACE)),2))

if __name__=='__main__': main()
