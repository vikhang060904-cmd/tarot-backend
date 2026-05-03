import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010);

/* CAMERA */
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0,2,6);

/* RENDERER */
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/* LIGHTS */
const light = new THREE.PointLight(0xaa66ff,2);
light.position.set(0,3,3);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff,0.2);
scene.add(ambient);

/* FLOOR */
const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6,64),
    new THREE.MeshStandardMaterial({color:0x111111})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

/* PORTAL */
const portal = new THREE.Mesh(
    new THREE.RingGeometry(1.2,1.6,64),
    new THREE.MeshBasicMaterial({
        color:0xaa66ff,
        transparent:true,
        opacity:0.9,
        side:THREE.DoubleSide
    })
);
portal.rotation.x = -Math.PI/2;
portal.position.set(0,0.01,-2);
scene.add(portal);

/* MAGIC GLOW */
const glow = new THREE.Mesh(
    new THREE.CircleGeometry(1.3,64),
    new THREE.MeshBasicMaterial({
        color:0xaa66ff,
        transparent:true,
        opacity:0.4
    })
);
glow.rotation.x = -Math.PI/2;
glow.position.set(0,0.02,-2);
scene.add(glow);

/* LOAD WIZARD */
const loader = new GLTFLoader();

let wizard, mixer;

loader.load("/static/models/wizard.glb",(gltf)=>{
    wizard = gltf.scene;
    wizard.scale.set(1.2,1.2,1.2);
    wizard.position.set(0,0,-4);
    scene.add(wizard);

    mixer = new THREE.AnimationMixer(wizard);

    if(gltf.animations.length>0){
        const walk = mixer.clipAction(gltf.animations[0]);
        walk.play();
    }

    walkOut();
});

/* WIZARD WALK OUT */
function walkOut(){
    const targetZ = -0.5;

    function move(){
        if(!wizard) return;

        if(wizard.position.z < targetZ){
            wizard.position.z += 0.02;
            requestAnimationFrame(move);
        }
        else{
            wizardStop();
        }
    }
    move();
}

/* STOP + SHOW BUTTON */
function wizardStop(){
    document.getElementById("enterUI").style.display="block";
}

/* LOOP */
const clock = new THREE.Clock();

function animate(){
    requestAnimationFrame(animate);

    const dt = clock.getDelta();
    mixer?.update(dt);

    portal.rotation.z += 0.01;
    glow.scale.setScalar(1+Math.sin(Date.now()*0.003)*0.1);

    renderer.render(scene,camera);
}
animate();

/* RESIZE */
window.addEventListener("resize",()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
});