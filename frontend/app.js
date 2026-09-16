import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const places=[
 {id:'yamo',name:'Ya Mo Monument',detail:'Old city centre',lat:14.9747299,lon:102.0981171,routes:[['1','yellow / green','#d9b52b'],['5','white / yellow','#e8c944'],['11','blue / white','#4d78bd'],['20','white / blue','#4d78bd']]},
 {id:'terminal2',name:'Bus Station 2',detail:'Northern corridor',lat:14.98861586,lon:102.09465374,routes:[['4','white / blue','#4d78bd'],['10','white / red / yellow','#e06b58'],['15','white / purple','#a56ac4'],['19','image-only source route','#b168c9']]},
 {id:'bung',name:'Bung Ta Lua Park',detail:'Southern landmark',lat:14.96030,lon:102.08838,routes:[['11','blue / white','#4d78bd'],['13','blue / white','#4d78bd'],['20','white / blue','#4d78bd']]},
 {id:'mall',name:'The Mall Korat',detail:'Western corridor',lat:14.98034264,lon:102.07680801,routes:[['6','white / red','#e06b58'],['8','white / blue','#4d78bd'],['17','white / purple','#a56ac4']]}
 ,{id:'lotus',name:'Lotus Korat (Mittraphap)',detail:'Mittraphap Road supermarket',lat:14.9779455,lon:102.0707623,routes:[]}
 ,{id:'terminal21',name:'Terminal 21 Korat',detail:'Mittraphap Road',lat:14.98200721,lon:102.09027624,routes:[]}
];
// One shared Web Mercator origin for roads, buildings, and landmark anchors.
// One scene unit is 100 projected metres; altitude is the Three.js Y axis.
const mapCenter={lat:14.9799,lon:102.0977}, metresPerUnit=100;
const origin=L.CRS.EPSG3857.project(L.latLng(mapCenter.lat,mapCenter.lon));
function mapPoint(lat,lon){const p=L.CRS.EPSG3857.project(L.latLng(lat,lon));return {x:(p.x-origin.x)/metresPerUnit,z:-(p.y-origin.y)/metresPerUnit}}
const scene=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(scene.clientWidth,scene.clientHeight);scene.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(45,scene.clientWidth/scene.clientHeight,.05,1000);camera.position.set(0,77,65);
const world=new THREE.Scene();world.background=new THREE.Color(0xb9d2df);world.add(new THREE.HemisphereLight(0xffffff,0x667278,2));
const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(-20,50,25);world.add(sun);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2.15;controls.minDistance=3;controls.maxDistance=300;
const mapBounds=[[14.94,102.06],[15.025,102.15]];
const southWest=mapPoint(...mapBounds[0]),northEast=mapPoint(...mapBounds[1]);
renderer.localClippingEnabled=true;
// Clip the full road surface, including its width, exactly at the ground edges.
const roadBoundary=[
  new THREE.Plane(new THREE.Vector3(1,0,0),-southWest.x),
  new THREE.Plane(new THREE.Vector3(-1,0,0),northEast.x),
  new THREE.Plane(new THREE.Vector3(0,0,1),-northEast.z),
  new THREE.Plane(new THREE.Vector3(0,0,-1),southWest.z)
];
const ground=new THREE.Mesh(new THREE.PlaneGeometry(northEast.x-southWest.x,southWest.z-northEast.z),new THREE.MeshLambertMaterial({color:0xe4e1d5}));
ground.rotation.x=-Math.PI/2;ground.position.set((southWest.x+northEast.x)/2,-.015,(southWest.z+northEast.z)/2);world.add(ground);
const status=document.createElement('div');status.id='mapStatus';status.setAttribute('role','status');status.textContent='Loading real roads…';scene.append(status);
const roadMapEl=document.querySelector('#roadMap');
const roadMap=L.map(roadMapEl,{zoomControl:false,preferCanvas:true}).setView([mapCenter.lat,mapCenter.lon],14);
L.control.zoom({position:'bottomright'}).addTo(roadMap);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(roadMap);
roadMap.createPane('busRoute').style.zIndex='450';
const referenceMarkers={},landmarkMeshes={};let selectedId=null;
let loadedRoutes=[],mapPickMarker=null;
const landmarkScale=.35;
function landmark(p,i){const g=new THREE.Group();g.userData={id:p.id};const pos=mapPoint(p.lat,p.lon);g.position.set(pos.x,0,pos.z);g.scale.setScalar(landmarkScale);
  const base=new THREE.Mesh(new THREE.BoxGeometry(2.1,.25,2.1),new THREE.MeshLambertMaterial({color:0xf8c14b}));base.position.y=.15;if(p.id!=='bung')g.add(base);
  if(p.id==='yamo'){const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.8,.95,.45,8),new THREE.MeshLambertMaterial({color:0xd7b26d}));plinth.position.y=.5;g.add(plinth);const tower=new THREE.Mesh(new THREE.CylinderGeometry(.22,.35,2.3,6),new THREE.MeshLambertMaterial({color:0xf1e2be}));tower.position.y=1.8;g.add(tower);const roof=new THREE.Mesh(new THREE.ConeGeometry(.5,.65,6),new THREE.MeshLambertMaterial({color:0x9b4e35}));roof.position.y=3.25;g.add(roof)}
  if(p.id==='terminal2'){const building=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.8,1.6),new THREE.MeshLambertMaterial({color:0x5d91c8}));building.position.y=1.1;g.add(building);const roof=new THREE.Mesh(new THREE.BoxGeometry(2.7,.2,1.9),new THREE.MeshLambertMaterial({color:0xdde8f4}));roof.position.y=2.1;g.add(roof)}

  if(['mall','lotus','terminal21'].includes(p.id)){const building=new THREE.Mesh(new THREE.BoxGeometry(2.2,3.6,1.8),new THREE.MeshLambertMaterial({color:p.id==='lotus'?0x20a897:p.id==='terminal21'?0xe2e6ed:0xe77a9c}));building.position.y=2;g.add(building);for(let n=0;n<3;n++){const sign=new THREE.Mesh(new THREE.BoxGeometry(1.5,.12,.05),new THREE.MeshLambertMaterial({color:0xffd866}));sign.position.set(0,1+n*.8,.94);g.add(sign)}}
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.25,1.42,32),new THREE.MeshBasicMaterial({color:0xffe07a,transparent:true,opacity:.9,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.32;ring.visible=false;g.add(ring);g.userData.ring=ring;world.add(g);landmarkMeshes[p.id]=g;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#172033';ctx.fillRect(0,0,512,80);ctx.fillStyle='#ffe07a';ctx.font='bold 30px sans-serif';ctx.textAlign='center';ctx.fillText((i+1)+' · '+p.name,256,51);
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));label.position.set(pos.x,1.8,pos.z);label.scale.set(5,.78,1);label.userData.id=p.id;world.add(label);g.userData.label=label;
  referenceMarkers[p.id]=L.circleMarker([p.lat,p.lon],{radius:8,color:'#172033',weight:2,fillColor:'#f8c14b',fillOpacity:1}).addTo(roadMap).bindTooltip((i+1)+' · '+p.name+' (approximate)',{permanent:true,direction:'top'}).on('click',()=>select(p.id));

}
places.forEach(landmark);
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart;
renderer.domElement.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY]});
renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects([...Object.values(landmarkMeshes),...Object.values(landmarkMeshes).map(g=>g.userData.label),...(landmarkMeshes.bung.userData.water||[])],true)[0];if(hit){let node=hit.object;while(node.parent&&!node.userData.id)node=node.parent;if(node.userData.id)select(node.userData.id)}});
function select(id,focus=true){
  const p=places.find(x=>x.id===id);selectedId=id;
  Object.entries(landmarkMeshes).forEach(([key,g])=>{g.scale.setScalar(landmarkScale*(key===id?1.18:1));g.userData.ring.visible=key===id;if(g.userData.water)g.userData.water.forEach(m=>m.material.color.setHex(key===id?0x249cc3:0x69bdd2));referenceMarkers[key].setStyle({fillColor:key===id?'#ff7a35':'#f8c14b',radius:key===id?11:8})});
  document.querySelectorAll('.place').forEach(x=>x.classList.toggle('active',x.dataset.id===id));
  document.querySelector('#routes').innerHTML='<h2>'+p.name+'</h2><p>'+p.detail+' · historical demo</p><p class="hint">Approximate map anchor: '+p.lat.toFixed(5)+', '+p.lon.toFixed(5)+'. Model size is illustrative.</p>'+(p.routes.length?'':'<p>Bus routes not yet verified for this place.</p>')+p.routes.map(r=>'<div class="route"><b>สาย '+r[0]+'</b><span class="swatch" style="background:'+r[2]+'"></span><span>'+r[1]+'</span></div>').join('')+'<p class="hint">Approximate historical association; direction and current service not verified.</p>';
  if(focus){const pos=mapPoint(p.lat,p.lon);controls.target.set(pos.x,0,pos.z);camera.position.set(pos.x+7,id==='bung'?22:14,pos.z+(id==='bung'?26:16));roadMap.setView([p.lat,p.lon],16);}
}
const mapModes={three:document.querySelector('#show3d'),roads:document.querySelector('#showRoads')};
let routeLayer=null,route3d=null,selectedRoute=null;
function distanceToSegmentMeters(point,a,b){
  const scale=111320, cos=Math.cos(point.lat*Math.PI/180);
  const px=(point.lng-a.lng)*scale*cos,py=(point.lat-a.lat)*scale;
  const bx=(b.lng-a.lng)*scale*cos,by=(b.lat-a.lat)*scale;
  const length=bx*bx+by*by;if(!length)return Math.hypot(px,py);
  const t=Math.max(0,Math.min(1,(px*bx+py*by)/length));
  return Math.hypot(px-t*bx,py-t*by);
}
function distanceToRouteMeters(latlng,route){
  let nearest=Infinity;
  for(let i=1;i<route.geometry.length;i++)nearest=Math.min(nearest,distanceToSegmentMeters(latlng,L.latLng(route.geometry[i-1][0],route.geometry[i-1][1]),L.latLng(route.geometry[i][0],route.geometry[i][1])));
  return nearest;
}
function showMapPointRoutes(latlng){
  if(mapPickMarker)roadMap.removeLayer(mapPickMarker);
  mapPickMarker=L.circleMarker(latlng,{pane:'busRoute',radius:7,color:'#172033',weight:3,fillColor:'#ff7a35',fillOpacity:1}).addTo(roadMap).bindTooltip('จุดที่เลือก',{permanent:true,direction:'top'});
  const matches=loadedRoutes.map(route=>({route,distance:distanceToRouteMeters(latlng,route)})).filter(x=>x.distance<=180).sort((a,b)=>a.distance-b.distance);
  const details=document.querySelector('#routes');
  const heading=routeText('h2','สายรถที่ผ่านจุดนี้');
  const location=routeText('p','พิกัด '+latlng.lat.toFixed(5)+', '+latlng.lng.toFixed(5));location.className='hint';
  if(!matches.length){details.replaceChildren(heading,location,routeText('p','ยังไม่พบสายรถในข้อมูลภายในระยะ 180 เมตร'));return}
  const list=document.createElement('div');
  matches.forEach(({route,distance})=>{
    const row=document.createElement('button');row.className='place active';row.type='button';row.textContent='สาย '+route.number+' · '+route.colors+' ('+Math.round(distance)+' ม.)';row.onclick=()=>drawRoute(route);list.append(row);
  });
  details.replaceChildren(heading,location,list,routeText('p','ระยะวัดจากเส้นทางถนนที่บันทึกไว้ใน API')); 
}
roadMap.on('click',event=>showMapPointRoutes(event.latlng));
// Keep point picking reliable when a rendered road or tile consumes Leaflet's click.
roadMapEl.addEventListener('click',event=>{
  if(event.target.closest('.leaflet-control,.leaflet-marker-icon,.leaflet-tooltip'))return;
  showMapPointRoutes(roadMap.mouseEventToLatLng(event));
},true);
function clearRoute(){
  if(routeLayer){roadMap.removeLayer(routeLayer);routeLayer=null}
  if(route3d){
    world.remove(route3d);
    route3d.traverse(object=>{object.geometry?.dispose();if(object.material){for(const material of Array.isArray(object.material)?object.material:[object.material])material.dispose()}});
    route3d=null;
  }
  selectedRoute=null;delete scene.dataset.routeRevision;delete scene.dataset.routePoints;
}
function routeRibbon(points,width,height,color){
  const vertices=[];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(!length)continue;
    const nx=-dz/length*width/2,nz=dx/length*width/2;
    vertices.push(a.x+nx,height,a.z+nz,b.x+nx,height,b.z+nz,b.x-nx,height,b.z-nz,a.x+nx,height,a.z+nz,b.x-nx,height,b.z-nz,a.x-nx,height,a.z-nz);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  return new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,clippingPlanes:roadBoundary}));
}
function fitRoute(){
  if(!selectedRoute)return;
  const bounds=new THREE.Box3().setFromPoints(selectedRoute.geometry.map(([lat,lon])=>{const p=mapPoint(lat,lon);return new THREE.Vector3(p.x,0,p.z)}));
  const center=bounds.getCenter(new THREE.Vector3()),radius=bounds.getSize(new THREE.Vector3()).length()/2;
  const verticalFov=THREE.MathUtils.degToRad(camera.fov),horizontalFov=2*Math.atan(Math.tan(verticalFov/2)*camera.aspect);
  const distance=Math.max(10,radius/Math.sin(Math.min(verticalFov,horizontalFov)/2)*1.12);
  controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(0,.86,.52).normalize().multiplyScalar(distance));controls.update();
  if(roadMapEl.offsetWidth)roadMap.fitBounds(routeLayer.getBounds(),{padding:[30,30],maxZoom:16});
}
function routeText(tag,text){const node=document.createElement(tag);node.textContent=text;return node}
function hasCoordinates(stop){return Number.isFinite(stop.lat)&&Number.isFinite(stop.lon)}
function drawRoute(route){
  clearRoute();selectedRoute=route;selectedId=null;
  const routeBase=L.polyline(route.geometry,{pane:'busRoute',color:'#2f8b55',weight:9,opacity:1,interactive:false});
  const routeStripe=L.polyline(route.geometry,{pane:'busRoute',color:'#f2d342',weight:4,opacity:1,interactive:false});
  const stopMarkers=route.stops.flatMap((stop,index)=>hasCoordinates(stop)?[L.circleMarker([stop.lat,stop.lon],{pane:'busRoute',radius:5,color:'#172033',weight:2,fillColor:'#f2d342',fillOpacity:1}).bindTooltip(document.createTextNode((index+1)+'. '+stop.name))]:[]);
  routeLayer=L.featureGroup([routeBase,routeStripe,...stopMarkers]).addTo(roadMap);
  const points=route.geometry.map(([lat,lon])=>mapPoint(lat,lon));
  route3d=new THREE.Group();route3d.add(routeRibbon(points,.35,.07,0x2f8b55),routeRibbon(points,.16,.075,0xf2d342));
  route.stops.forEach(stop=>{
    if(!hasCoordinates(stop))return;
    // ponytail: these fixed boxes mark referenced places; detailed models can replace them after survey.
    const position=mapPoint(stop.lat,stop.lon),marker=new THREE.Mesh(new THREE.BoxGeometry(.18,.3,.18),new THREE.MeshLambertMaterial({color:0xf2d342,clippingPlanes:roadBoundary}));
    marker.position.set(position.x,.15,position.z);route3d.add(marker);
  });
  world.add(route3d);scene.dataset.routeRevision=route.revision;scene.dataset.routePoints=route.geometry.length;
  const details=document.querySelector('#routes'),revision=routeText('p','Revision: '+route.revision),stops=document.createElement('ol');revision.className='hint';revision.dataset.routeRevision=route.revision;
  route.stops.forEach(stop=>{const item=routeText('li',stop.name+(hasCoordinates(stop)?'':' — ยังไม่ยืนยันพิกัด'));stops.append(item)});
  details.replaceChildren(routeText('h2','สาย '+route.number),routeText('p',route.colors+' · แนวอ้างอิงตามภาพ'),revision,stops);
  if(route.notes)details.append(routeText('p',Array.isArray(route.notes)?route.notes.join(' '):route.notes));
  const notice=routeText('p','เส้นทางประวัติศาสตร์ตามภาพอ้างอิง ยังไม่ยืนยันบริการปัจจุบัน');notice.className='hint';details.append(notice);
  document.querySelectorAll('[data-route]').forEach(button=>{const active=button.dataset.route===String(route.number);button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});fitRoute();
}
async function loadRoutes(){
  const buttons=document.querySelector('#places'),details=document.querySelector('#routes');
  buttons.textContent='กำลังโหลดสายรถจาก API…';
  try{
    const response=await fetch('http://127.0.0.1:5080/api/routes',{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const data=await response.json();
    const coordinate=p=>Array.isArray(p)&&p.length===2&&Number.isFinite(p[0])&&Math.abs(p[0])<=90&&Number.isFinite(p[1])&&Math.abs(p[1])<=180;
    if(!Array.isArray(data)||!data.length||data.some(route=>!route.number||typeof route.revision!=='string'||typeof route.colors!=='string'||typeof route.evidence!=='string'||!Array.isArray(route.geometry)||route.geometry.length<2||!route.geometry.every(coordinate)||!Array.isArray(route.stops)||!route.stops.length||!route.stops.every(stop=>stop&&typeof stop.name==='string'&&((stop.lat==null&&stop.lon==null)||coordinate([stop.lat,stop.lon])))))throw new Error('ข้อมูลเส้นทางจาก API ไม่ครบหรือรูปแบบไม่ถูกต้อง');
    loadedRoutes=data;
    buttons.replaceChildren(...data.map(route=>{const button=routeText('button','สาย '+route.number+' · '+route.colors);button.className='place';button.dataset.route=String(route.number);button.onclick=()=>drawRoute(route);return button}));
    drawRoute(data[0]);
  }catch(error){
    clearRoute();buttons.replaceChildren();details.replaceChildren(routeText('h2','โหลดสายรถไม่สำเร็จ'),routeText('p','เชื่อมต่อ Route API ที่ 127.0.0.1:5080 ไม่สำเร็จ: '+error.message));details.setAttribute('role','alert');
    const retry=routeText('button','ลองโหลดอีกครั้ง');retry.className='place';retry.onclick=()=>{details.removeAttribute('role');loadRoutes()};buttons.append(retry);
  }
}
function setMode(mode){const roads=mode==='roads';renderer.domElement.style.display=roads?'none':'block';roadMapEl.style.display=roads?'block':'none';mapModes.three.classList.toggle('active',!roads);mapModes.roads.classList.toggle('active',roads);mapModes.three.setAttribute('aria-pressed',String(!roads));mapModes.roads.setAttribute('aria-pressed',String(roads));if(roads){roadMap.invalidateSize();if(selectedId){const p=places.find(place=>place.id===selectedId);roadMap.setView([p.lat,p.lon],16)}else roadMap.fitBounds(routeLayer?routeLayer.getBounds():mapBounds,{padding:[30,30],maxZoom:16})}}
mapModes.three.onclick=()=>setMode('three');mapModes.roads.onclick=()=>setMode('roads');setMode('three');
const overview=document.createElement('button');overview.textContent='Overview';document.querySelector('#mapMode').append(overview);overview.onclick=()=>{controls.target.copy(ground.position);camera.position.set(ground.position.x,105,ground.position.z+90);if(roadMapEl.offsetWidth)roadMap.fitBounds(mapBounds)};

async function loadLake(){
  const response=await fetch('./bung-lake.json');if(!response.ok)throw new Error('Lake boundary could not be loaded');
  const lake=await response.json(),g=landmarkMeshes.bung;
  const outer=lake.members.filter(m=>m.role==='outer'),inner=lake.members.filter(m=>m.role==='inner');
  const vector=p=>{const v=mapPoint(p.lat,p.lon);return new THREE.Vector2(v.x,-v.z)};
  g.userData.water=[];
  outer.forEach((ring,i)=>{
    const shape=new THREE.Shape(ring.geometry.map(vector));
    const holes=inner.filter(h=>THREE.ShapeUtils.area(ring.geometry.map(vector))!==0&&pointInside(h.geometry[0],ring.geometry));
    holes.forEach(h=>shape.holes.push(new THREE.Path(h.geometry.map(vector))));
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:0x69bdd2,side:THREE.DoubleSide}));
    mesh.rotation.x=-Math.PI/2;mesh.position.y=.025;mesh.userData.id='bung';world.add(mesh);g.userData.water.push(mesh);
    L.polygon([ring.geometry,...holes.map(h=>h.geometry)].map(r=>r.map(p=>[p.lat,p.lon])),{color:'#249cc3',fillColor:'#69bdd2',fillOpacity:.7,weight:2}).addTo(roadMap).bindTooltip('Bung Ta Lua Park').on('click',()=>select('bung'));
  });
}
function pointInside(p,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.lat>p.lat)!==(b.lat>p.lat)&&p.lon<(b.lon-a.lon)*(p.lat-a.lat)/(b.lat-a.lat)+a.lon)inside=!inside}return inside}
async function loadGeography(){
  await loadLake();
  const response=await fetch('./korat-osm.json');if(!response.ok)throw new Error('Road data could not be loaded ('+response.status+')');
  const data=await response.json();
  if(!Array.isArray(data.elements))throw new Error('Road data format is invalid');
  const roadVertices=[],buildingGeometries=[];let roadCount=0,buildingCount=0;
  const widths={motorway:18,trunk:16,primary:12,secondary:10,tertiary:8,residential:6,service:4,footway:2,path:2};
  for(const way of data.elements){
    if(way.type!=='way'||!way.geometry||way.geometry.length<2)continue;
    const tags=way.tags||{},points=way.geometry.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon));if(points.length!==way.geometry.length)continue;
    if(tags.highway){
      const width=(widths[tags.highway.replace(/_link$/,'')]||5)/metresPerUnit;
      for(let i=1;i<points.length;i++){
        const a=mapPoint(points[i-1].lat,points[i-1].lon),b=mapPoint(points[i].lat,points[i].lon),dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(!length)continue;
        const nx=-dz/length*width/2,nz=dx/length*width/2;
        roadVertices.push(a.x+nx,.015,a.z+nz,b.x+nx,.015,b.z+nz,b.x-nx,.015,b.z-nz,a.x+nx,.015,a.z+nz,b.x-nx,.015,b.z-nz,a.x-nx,.015,a.z-nz);
      }
      const reference=L.polyline(points.map(p=>[p.lat,p.lon]),{color:'#394e63',weight:tags.highway.match(/motorway|trunk|primary/)?3:1,opacity:.65}).addTo(roadMap);
      if(tags.name)reference.bindTooltip(document.createTextNode(tags.name));roadCount++;
    }else if(tags.building&&points.length>=4&&points[0].lat===points.at(-1).lat&&points[0].lon===points.at(-1).lon){
      const shape=new THREE.Shape(points.map(p=>{const v=mapPoint(p.lat,p.lon);return new THREE.Vector2(v.x,-v.z)}));
      // ponytail: missing OSM heights use two storeys; actual heights can replace this default.
      const height=Math.max(3,Math.min(150,parseFloat(tags.height)||parseFloat(tags['building:levels'])*3||6))/metresPerUnit;
      const geometry=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1});geometry.rotateX(-Math.PI/2);buildingGeometries.push(geometry);buildingCount++;
    }
  }
  if(!roadCount)throw new Error('No roads were found in the local map data');
  const roads=new THREE.BufferGeometry();roads.setAttribute('position',new THREE.Float32BufferAttribute(roadVertices,3));roads.computeVertexNormals();
  world.add(new THREE.Mesh(roads,new THREE.MeshLambertMaterial({color:0x48576b,side:THREE.DoubleSide,clippingPlanes:roadBoundary})));
  if(buildingGeometries.length){const buildings=mergeGeometries(buildingGeometries);world.add(new THREE.Mesh(buildings,new THREE.MeshLambertMaterial({color:0xb5b9ac})));buildingGeometries.forEach(g=>g.dispose())}
  // Check all landmark anchors against the same projection used by the reference map.
  for(const p of places){const v=landmarkMeshes[p.id].position,ref=referenceMarkers[p.id].getLatLng(),projected=L.CRS.EPSG3857.project(ref);if(Math.abs(v.x*metresPerUnit+origin.x-projected.x)>.000001||Math.abs(-v.z*metresPerUnit+origin.y-projected.y)>.000001)throw new Error('Landmark projection mismatch: '+p.id)}
  scene.dataset.roads=roadCount;scene.dataset.buildings=buildingCount;scene.dataset.alignment='passed';
  status.textContent=roadCount.toLocaleString()+' real road ways · '+buildingCount.toLocaleString()+' building footprints · N ↑';
}
loadGeography().catch(error=>{status.textContent=error.message;status.dataset.error='true';console.error(error)});
loadRoutes();
addEventListener('resize',()=>{renderer.setSize(scene.clientWidth,scene.clientHeight);camera.aspect=scene.clientWidth/scene.clientHeight;camera.updateProjectionMatrix();if(roadMapEl.style.display!=='none')roadMap.invalidateSize()});
(function loop(){requestAnimationFrame(loop);controls.update();renderer.render(world,camera)})();
