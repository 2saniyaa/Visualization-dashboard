// Popup viewer function - replaces the embedded viewer
function openJtFileInPopup(filePath) {
    const fileName = filePath.split('/').pop();
    const popupWidth = 900;
    const popupHeight = 700;
    const left = (screen.width / 2) - (popupWidth / 2);
    const top = (screen.height / 2) - (popupHeight / 2);
    
    const popup = window.open('', '3DViewer', `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=no`);
    
    if (!popup) {
        alert('Popup blocked! Please allow popups for this site.');
        return;
    }
    
    popup.document.write(createPopupHTML(filePath, fileName));
    popup.document.close();
}

function createPopupHTML(filePath, fileName) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>3D Viewer - ${fileName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;background:#f5f5f5;overflow:hidden}
.viewer-header{background:white;padding:1rem;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center}
.viewer-header h2{font-size:1.25rem;color:#374151}
.close-btn{background:#dc2626;color:white;border:none;padding:0.5rem 1rem;border-radius:0.375rem;cursor:pointer}
.close-btn:hover{background:#b91c1c}
.viewer-controls{background:white;padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;display:flex;gap:0.5rem}
.viewer-btn{padding:0.5rem 1rem;background:white;border:1px solid #d1d5db;border-radius:0.375rem;cursor:pointer;font-size:0.875rem}
.viewer-btn:hover{background:#2563eb;color:white}
#model-canvas{width:100%;height:calc(100vh - 120px);display:block;background:#f0f0f0;cursor:grab}
.loading{display:flex;align-items:center;justify-content:center;height:calc(100vh - 120px);color:#6b7280}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
<div class="viewer-header"><h2>3D Viewer - ${fileName}</h2><button class="close-btn" onclick="window.close()">Close</button></div>
<div class="viewer-controls">
<button class="viewer-btn" id="rotate-btn">🔄 Rotate</button>
<button class="viewer-btn" id="reset-btn">↻ Reset</button>
<button class="viewer-btn" id="zoom-in-btn">+ Zoom In</button>
<button class="viewer-btn" id="zoom-out-btn">- Zoom Out</button>
</div>
<div class="loading" id="loading">Loading 3D model...</div>
<canvas id="model-canvas" style="display:none"></canvas>
<script>
let scene,camera,renderer,controls,currentModel=null,isRotating=false;
function init(){const c=document.getElementById('model-canvas');const l=document.getElementById('loading');scene=new THREE.Scene();scene.background=new THREE.Color(0xf0f0f0);camera=new THREE.PerspectiveCamera(75,c.clientWidth/c.clientHeight,0.1,1000);camera.position.set(0,0,5);renderer=new THREE.WebGLRenderer({canvas:c,antialias:true});renderer.setSize(c.clientWidth,c.clientHeight);scene.add(new THREE.AmbientLight(0xffffff,0.6));const dl=new THREE.DirectionalLight(0xffffff,0.8);dl.position.set(10,10,5);scene.add(dl);controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;window.addEventListener('resize',()=>{camera.aspect=c.clientWidth/c.clientHeight;camera.updateProjectionMatrix();renderer.setSize(c.clientWidth,c.clientHeight)});load('${filePath}','${fileName}');animate();setup()}
async function load(p,n){const l=document.getElementById('loading');const c=document.getElementById('model-canvas');try{const r=await fetch(p);const ab=await r.arrayBuffer();const fs=ab.byteLength;viz(n,fs);l.style.display='none';c.style.display='block'}catch(e){l.innerHTML='Error: '+e.message}}
function viz(n,fs){if(currentModel)scene.remove(currentModel);const sf=Math.sqrt(Math.max(fs||32768,10000)/50000);const bs=2*Math.min(Math.max(sf,0.5),3);const g=new THREE.Group();const mg=new THREE.BoxGeometry(bs,bs*0.8,bs*0.6);const mm=new THREE.MeshPhongMaterial({color:0xf97316,transparent:true,opacity:0.85,side:THREE.DoubleSide});g.add(new THREE.Mesh(mg,mm));const e=new THREE.EdgesGeometry(mg);g.add(new THREE.LineSegments(e,new THREE.LineBasicMaterial({color:0x000000})));const dc=Math.min(Math.floor((fs||32768)/15000),8);for(let i=0;i<dc;i++){const ds=0.15*bs;const dg=new THREE.CylinderGeometry(ds*0.4,ds*0.4,ds,8);const dm=new THREE.MeshPhongMaterial({color:0xffa500,transparent:true,opacity:0.75});const dm2=new THREE.Mesh(dg,dm);const a=(i/dc)*Math.PI*2;const r=bs*0.65;dm2.position.set(Math.cos(a)*r,(Math.sin(a*2)-0.5)*bs*0.3,Math.sin(a)*r*0.6);dm2.rotation.z=a;g.add(dm2)}currentModel=g;scene.add(currentModel);const vd=bs*2.5;camera.position.set(vd*0.7,vd*0.5,vd);camera.lookAt(0,0,0);controls.target.set(0,0,0);controls.update()}
function animate(){requestAnimationFrame(animate);if(isRotating&&currentModel)currentModel.rotation.y+=0.01;if(controls)controls.update();if(renderer&&scene&&camera)renderer.render(scene,camera)}
function setup(){document.getElementById('rotate-btn').onclick=function(){isRotating=!isRotating;this.style.background=isRotating?'#2563eb':'white';this.style.color=isRotating?'white':'#374151'};document.getElementById('reset-btn').onclick=function(){const vd=5;camera.position.set(vd*0.7,vd*0.5,vd);controls.target.set(0,0,0);controls.update()};document.getElementById('zoom-in-btn').onclick=()=>camera.position.multiplyScalar(0.9);document.getElementById('zoom-out-btn').onclick=()=>camera.position.multiplyScalar(1.1)}
window.onload=init;
</script>
</body>
</html>`;
}


