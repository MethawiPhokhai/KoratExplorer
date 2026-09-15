import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const places=[
 {id:'yamo',name:'Ya Mo Monument',detail:'Old city centre',lat:14.9753,lon:102.0979,routes:[['1','yellow / green','#d9b52b'],['5','white / yellow','#e8c944'],['11','blue / white','#4d78bd'],['20','white / blue','#4d78bd']]},
 {id:'terminal2',name:'Bus Station 2',detail:'Northern corridor',lat:14.98861586,lon:102.09465374,routes:[['4','white / blue','#4d78bd'],['10','white / red / yellow','#e06b58'],['15','white / purple','#a56ac4'],['19','image-only source route','#b168c9']]},
 {id:'bung',name:'Bung Ta Lua Park',detail:'Southern landmark',lat:14.9484,lon:102.0865,routes:[['11','blue / white','#4d78bd'],['13','blue / white','#4d78bd'],['20','white / blue','#4d78bd']]},
 {id:'mall',name:'The Mall / Lotus',detail:'Western corridor',lat:14.9862,lon:102.0734,routes:[['6','white / red','#e06b58'],['8','white / blue','#4d78bd'],['17','white / purple','#a56ac4']]}
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
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2.15;controls.minDistance=3;controls.maxDistance=160;
const southWest=mapPoint(14.94,102.06),northEast=mapPoint(15.02,102.12);
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
const referenceMarkers={},landmarkMeshes={};let selectedId=null;
const landmarkScale=.35;
function landmark(p,i){const g=new THREE.Group();g.userData={id:p.id};const pos=mapPoint(p.lat,p.lon);g.position.set(pos.x,0,pos.z);g.scale.setScalar(landmarkScale);
  const base=new THREE.Mesh(new THREE.BoxGeometry(2.1,.25,2.1),new THREE.MeshLambertMaterial({color:0xf8c14b}));base.position.y=.15;g.add(base);
  if(p.id==='yamo'){const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.8,.95,.45,8),new THREE.MeshLambertMaterial({color:0xd7b26d}));plinth.position.y=.5;g.add(plinth);const tower=new THREE.Mesh(new THREE.CylinderGeometry(.22,.35,2.3,6),new THREE.MeshLambertMaterial({color:0xf1e2be}));tower.position.y=1.8;g.add(tower);const roof=new THREE.Mesh(new THREE.ConeGeometry(.5,.65,6),new THREE.MeshLambertMaterial({color:0x9b4e35}));roof.position.y=3.25;g.add(roof)}
  if(p.id==='terminal2'){const building=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.8,1.6),new THREE.MeshLambertMaterial({color:0x5d91c8}));building.position.y=1.1;g.add(building);const roof=new THREE.Mesh(new THREE.BoxGeometry(2.7,.2,1.9),new THREE.MeshLambertMaterial({color:0xdde8f4}));roof.position.y=2.1;g.add(roof)}
  if(p.id==='bung'){const pond=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,.05,24),new THREE.MeshLambertMaterial({color:0x58a9c4}));pond.position.y=.3;g.add(pond);for(let n=0;n<3;n++){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,.8,6),new THREE.MeshLambertMaterial({color:0x765333}));trunk.position.set(-.65+n*.65,.7,.3);g.add(trunk);const crown=new THREE.Mesh(new THREE.DodecahedronGeometry(.45),new THREE.MeshLambertMaterial({color:0x4c9d5c}));crown.position.set(-.65+n*.65,1.25,.3);g.add(crown)}}
  if(p.id==='mall'){const building=new THREE.Mesh(new THREE.BoxGeometry(2.2,3.6,1.8),new THREE.MeshLambertMaterial({color:0xe77a9c}));building.position.y=2;g.add(building);for(let n=0;n<3;n++){const sign=new THREE.Mesh(new THREE.BoxGeometry(1.5,.12,.05),new THREE.MeshLambertMaterial({color:0xffd866}));sign.position.set(0,1+n*.8,.94);g.add(sign)}}
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.25,1.42,32),new THREE.MeshBasicMaterial({color:0xffe07a,transparent:true,opacity:.9,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.32;ring.visible=false;g.add(ring);g.userData.ring=ring;world.add(g);landmarkMeshes[p.id]=g;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#172033';ctx.fillRect(0,0,512,80);ctx.fillStyle='#ffe07a';ctx.font='bold 30px sans-serif';ctx.textAlign='center';ctx.fillText((i+1)+' · '+p.name,256,51);
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));label.position.set(pos.x,1.8,pos.z);label.scale.set(5,.78,1);label.userData.id=p.id;world.add(label);g.userData.label=label;
  referenceMarkers[p.id]=L.circleMarker([p.lat,p.lon],{radius:8,color:'#172033',weight:2,fillColor:'#f8c14b',fillOpacity:1}).addTo(roadMap).bindTooltip((i+1)+' · '+p.name+' (approximate)',{permanent:true,direction:'top'}).on('click',()=>select(p.id));

}
places.forEach(landmark);
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart;
renderer.domElement.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY]});
renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects([...Object.values(landmarkMeshes),...Object.values(landmarkMeshes).map(g=>g.userData.label)],true)[0];if(hit){let node=hit.object;while(node.parent&&!node.userData.id)node=node.parent;if(node.userData.id)select(node.userData.id)}});
function select(id,focus=true){
  const p=places.find(x=>x.id===id);selectedId=id;
  Object.entries(landmarkMeshes).forEach(([key,g])=>{g.scale.setScalar(landmarkScale*(key===id?1.18:1));g.userData.ring.visible=key===id;referenceMarkers[key].setStyle({fillColor:key===id?'#ff7a35':'#f8c14b',radius:key===id?11:8})});
  document.querySelectorAll('.place').forEach(x=>x.classList.toggle('active',x.dataset.id===id));
  document.querySelector('#routes').innerHTML='<h2>'+p.name+'</h2><p>'+p.detail+' · historical demo</p><p class="hint">Approximate map anchor: '+p.lat.toFixed(5)+', '+p.lon.toFixed(5)+'. Model size is illustrative.</p>'+p.routes.map(r=>'<div class="route"><b>สาย '+r[0]+'</b><span class="swatch" style="background:'+r[2]+'"></span><span>'+r[1]+'</span></div>').join('')+'<p class="hint">Approximate historical association; direction and current service not verified.</p>';
  if(focus){const pos=mapPoint(p.lat,p.lon);controls.target.set(pos.x,0,pos.z);camera.position.set(pos.x+7,14,pos.z+16);roadMap.setView([p.lat,p.lon],16);}
}
document.querySelector('#places').innerHTML=places.map((p,i)=>'<button class="place" data-id="'+p.id+'"><b>'+(i+1)+' · '+p.name+'</b><br><small>'+p.detail+'</small></button>').join('');
document.querySelectorAll('.place').forEach(x=>x.onclick=()=>select(x.dataset.id));select('yamo',false);
const mapModes={three:document.querySelector('#show3d'),roads:document.querySelector('#showRoads')};
function setMode(mode){const roads=mode==='roads';renderer.domElement.style.display=roads?'none':'block';roadMapEl.style.display=roads?'block':'none';mapModes.three.classList.toggle('active',!roads);mapModes.roads.classList.toggle('active',roads);mapModes.three.setAttribute('aria-pressed',String(!roads));mapModes.roads.setAttribute('aria-pressed',String(roads));if(roads)roadMap.invalidateSize()}
mapModes.three.onclick=()=>setMode('three');mapModes.roads.onclick=()=>setMode('roads');setMode('three');
const overview=document.createElement('button');overview.textContent='Overview';document.querySelector('#mapMode').append(overview);overview.onclick=()=>{controls.target.set(0,0,0);camera.position.set(0,77,65);roadMap.fitBounds([[14.94,102.06],[15.02,102.12]])};

async function loadGeography(){
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
addEventListener('resize',()=>{renderer.setSize(scene.clientWidth,scene.clientHeight);camera.aspect=scene.clientWidth/scene.clientHeight;camera.updateProjectionMatrix();if(roadMapEl.style.display!=='none')roadMap.invalidateSize()});
(function loop(){requestAnimationFrame(loop);controls.update();renderer.render(world,camera)})();
