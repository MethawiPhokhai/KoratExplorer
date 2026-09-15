import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const places=[
 {id:'yamo',name:'Ya Mo Monument',detail:'Old city centre',routes:[['1','yellow / green','#d9b52b'],['5','white / yellow','#e8c944'],['11','blue / white','#4d78bd'],['20','white / blue','#4d78bd']]},
 {id:'terminal2',name:'Terminal 2',detail:'Northern corridor',routes:[['4','white / blue','#4d78bd'],['10','white / red / yellow','#e06b58'],['15','white / purple','#a56ac4'],['19','image-only source route','#b168c9']]},
 {id:'bung',name:'Bung Ta Lua Park',detail:'Southern landmark',routes:[['11','blue / white','#4d78bd'],['13','blue / white','#4d78bd'],['20','white / blue','#4d78bd']]},
 {id:'mall',name:'The Mall / Lotus',detail:'Western corridor',routes:[['6','white / red','#e06b58'],['8','white / blue','#4d78bd'],['17','white / purple','#a56ac4']]}
];
const scene=document.querySelector('#scene'), renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(scene.clientWidth,scene.clientHeight); scene.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(45,scene.clientWidth/scene.clientHeight,.1,1000);camera.position.set(11,11,14);
const world=new THREE.Scene();world.background=new THREE.Color(0x91c5d7);world.add(new THREE.HemisphereLight(0xffffff,0x49627a,2));
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,0,0);controls.maxPolarAngle=Math.PI/2.15;
const ground=new THREE.Mesh(new THREE.PlaneGeometry(28,22),new THREE.MeshLambertMaterial({color:0x7fba75}));ground.rotation.x=-Math.PI/2;world.add(ground);
const roadMat=new THREE.MeshLambertMaterial({color:0x48566b});const road=new THREE.Mesh(new THREE.BoxGeometry(25,.08,2.1),roadMat);road.position.y=.05;world.add(road);const cross=new THREE.Mesh(new THREE.BoxGeometry(2.1,.09,18),roadMat);cross.position.y=.06;world.add(cross);
const colors=[0xd9b52b,0xe06b58,0x4d78bd,0xa56ac4,0x55a879]; for(let i=0;i<18;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(1+Math.random()*1.4,1+Math.random()*3,1+Math.random()*1.4),new THREE.MeshLambertMaterial({color:colors[i%colors.length]}));b.position.set((Math.random()-.5)*24,.5+ b.geometry.parameters.height/2,(Math.random()-.5)*17); if(Math.abs(b.position.x)<2||Math.abs(b.position.z)<2){i--;continue}world.add(b)}
const landmarkMeshes={};
function landmark(p,i){const g=new THREE.Group();g.userData=p.id;const x=[-7,4,1,-3][i],z=[0,-6,6,4][i];g.position.set(x,0,z);
  const base=new THREE.Mesh(new THREE.BoxGeometry(2.1,.25,2.1),new THREE.MeshLambertMaterial({color:0xf8c14b}));base.position.y=.15;g.add(base);
  if(p.id==='yamo'){const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.8,.95,.45,8),new THREE.MeshLambertMaterial({color:0xd7b26d}));plinth.position.y=.5;g.add(plinth);const tower=new THREE.Mesh(new THREE.CylinderGeometry(.22,.35,2.3,6),new THREE.MeshLambertMaterial({color:0xf1e2be}));tower.position.y=1.8;g.add(tower);const roof=new THREE.Mesh(new THREE.ConeGeometry(.5,.65,6),new THREE.MeshLambertMaterial({color:0x9b4e35}));roof.position.y=3.25;g.add(roof)}
  if(p.id==='terminal2'){const building=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.8,1.6),new THREE.MeshLambertMaterial({color:0x5d91c8}));building.position.y=1.1;g.add(building);const roof=new THREE.Mesh(new THREE.BoxGeometry(2.7,.2,1.9),new THREE.MeshLambertMaterial({color:0xdde8f4}));roof.position.y=2.1;g.add(roof)}
  if(p.id==='bung'){const pond=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,.05,24),new THREE.MeshLambertMaterial({color:0x58a9c4}));pond.position.y=.3;g.add(pond);for(let n=0;n<3;n++){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,.8,6),new THREE.MeshLambertMaterial({color:0x765333}));trunk.position.set(-.65+n*.65,.7,.3);g.add(trunk);const crown=new THREE.Mesh(new THREE.DodecahedronGeometry(.45),new THREE.MeshLambertMaterial({color:0x4c9d5c}));crown.position.set(-.65+n*.65,1.25,.3);g.add(crown)}}
  if(p.id==='mall'){const building=new THREE.Mesh(new THREE.BoxGeometry(2.2,3.6,1.8),new THREE.MeshLambertMaterial({color:0xe77a9c}));building.position.y=2;g.add(building);for(let n=0;n<3;n++){const sign=new THREE.Mesh(new THREE.BoxGeometry(1.5,.12,.05),new THREE.MeshLambertMaterial({color:0xffd866}));sign.position.set(0,1+n*.8,.94);g.add(sign)}}
  world.add(g);landmarkMeshes[p.id]=g;
}
places.forEach(landmark);
const ray=new THREE.Raycaster(), pointer=new THREE.Vector2(); renderer.domElement.addEventListener('pointerdown',e=>{const r=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(Object.values(landmarkMeshes),true)[0];if(hit){let node=hit.object;while(node.parent&&!node.userData)node=node.parent;if(node.userData)select(node.userData)}});
function select(id){const p=places.find(x=>x.id===id);document.querySelectorAll('.place').forEach(x=>x.classList.toggle('active',x.dataset.id===id));document.querySelector('#routes').innerHTML='<h2>'+p.name+'</h2><p>'+p.detail+' · historical demo</p>'+p.routes.map(r=>'<div class="route"><b>สาย '+r[0]+'</b><span class="swatch" style="background:'+r[2]+'"></span><span>'+r[1]+'</span></div>').join('')+'<p class="hint">Approximate historical association; direction and current service not verified.</p>'}
document.querySelector('#places').innerHTML=places.map(p=>'<div class="place" data-id="'+p.id+'"><b>'+p.name+'</b><br><small>'+p.detail+'</small></div>').join('');document.querySelectorAll('.place').forEach(x=>x.onclick=()=>select(x.dataset.id));select('yamo');
addEventListener('resize',()=>{renderer.setSize(scene.clientWidth,scene.clientHeight);camera.aspect=scene.clientWidth/scene.clientHeight;camera.updateProjectionMatrix()});(function loop(){requestAnimationFrame(loop);controls.update();renderer.render(world,camera)})();
