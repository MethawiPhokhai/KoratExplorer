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
const landmarkMeshes={}; places.forEach((p,i)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.5,1.4),new THREE.MeshLambertMaterial({color:0xf8c14b}));m.position.set([-7,4,1,-3][i],.8,[0,-6,6,4][i]);m.userData=p.id;world.add(m);landmarkMeshes[p.id]=m});
const ray=new THREE.Raycaster(), pointer=new THREE.Vector2(); renderer.domElement.addEventListener('pointerdown',e=>{const r=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(Object.values(landmarkMeshes))[0];if(hit)select(hit.object.userData)});
function select(id){const p=places.find(x=>x.id===id);document.querySelectorAll('.place').forEach(x=>x.classList.toggle('active',x.dataset.id===id));document.querySelector('#routes').innerHTML='<h2>'+p.name+'</h2><p>'+p.detail+' · historical demo</p>'+p.routes.map(r=>'<div class="route"><b>สาย '+r[0]+'</b><span class="swatch" style="background:'+r[2]+'"></span><span>'+r[1]+'</span></div>').join('')+'<p class="hint">Approximate historical association; direction and current service not verified.</p>'}
document.querySelector('#places').innerHTML=places.map(p=>'<div class="place" data-id="'+p.id+'"><b>'+p.name+'</b><br><small>'+p.detail+'</small></div>').join('');document.querySelectorAll('.place').forEach(x=>x.onclick=()=>select(x.dataset.id));select('yamo');
addEventListener('resize',()=>{renderer.setSize(scene.clientWidth,scene.clientHeight);camera.aspect=scene.clientWidth/scene.clientHeight;camera.updateProjectionMatrix()});(function loop(){requestAnimationFrame(loop);controls.update();renderer.render(world,camera)})();
