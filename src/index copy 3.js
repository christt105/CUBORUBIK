import './styles.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import gsap from 'gsap'

// import * as dat from 'dat.gui'
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

let scene, camera, cameraFront, renderer, rendererFront, rollObject, group, controls;
// let canvas, canvasFront;
let canvas = [], cameras = [], renderers = [] 

let intersectsPrev = null;
let intersects = null;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(Infinity,Infinity);
const pointerClick = new THREE.Vector2();

let pointIntersect = new THREE.Vector3();
let normalIntersect = new THREE.Vector3();
let pPointIntersect = new THREE.Vector3();
let pNormalIntersect = new THREE.Vector3();
const normalMatrix = new THREE.Matrix3();


// const rotateConditions = {
//     right: { axis: "x", value: 1, face: true },
//     left: { axis: "x", value: -1, face: true },
//     top: { axis: "y", value: 1, face: true },
//     bottom: { axis: "y", value: -1, face: true },
//     front: { axis: "z", value: 1, face: true },
//     back: { axis: "z", value: -1, face: true }
// };

// const config = [
//   //[eje, dir, color, faceName, face]
//     ["x", 1, "red", "right", true],
//     ["x", -1, "orange", "left", true],
//     ["y", 1, "yellow", "top", true],
//     ["y", -1, "white", "bottom", true],
//     ["z", 1, "blue", "front", true],
//     ["z", -1, "green", "back", true],
//     ["", 0, "", "all", false],
// ];

const colorConditions = [
  ["x", 1, "red"],
  ["x", -1, "orange"],
  ["y", 1, "yellow"],
  ["y", -1, "white"],
  ["z", 1, "blue"],
  ["z", -1, "green"]
];

// const faces = ["front", "back", "left", "right", "top", "bottom"];
// const directions = [-1, 1];
// const cPositions = [-1, 0, 1];
let cubes = [];

const dir = new THREE.Vector3( 1, 2, 0 ).normalize();

const origin = new THREE.Vector3( 0, 0, 0 );
const length = 1;
const hex = 0xffffff;

const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );

const createMaterial = (color) =>
    new THREE.ShaderMaterial({
        fragmentShader,
        vertexShader,
        uniforms: { faceColor: { value: color } },
        // uniforms: { faceColor: { type: "v3", value: color } },
    });

const materials = Object.entries({
    blue: new THREE.Vector4(0.011, 0.352, 0.65),
    red: new THREE.Vector4(0.847, 0.203, 0.372),
    white: new THREE.Vector4(0.956, 0.956, 0.956),
    green: new THREE.Vector4(0.054, 0.486, 0.117),
    yellow: new THREE.Vector4(0.807, 0.725, 0.07),
    orange: new THREE.Vector4(0.792, 0.317, 0.086),
    gray: new THREE.Vector4(0.301, 0.243, 0.243)
}).reduce((acc, [key, val]) => ({ ...acc, [key]: createMaterial(val) }), {});
console.log(materials);
const Place = () => {
  let widthId = window.innerWidth;
  let heightId = window.innerHeight;
  let marg = 10;
  if ( widthId / 4 < heightId / 9) [widthId, heightId] = [widthId / 4, widthId / 4];
  else [widthId, heightId] = [heightId / 9, heightId / 9];

  const Place1 = (id, t, l, w, h) => {
    document.querySelector("#" + id).style.cssText  =
      'top: ' + t + 'px;' +	'left: ' + l + 'px;' + 'width: ' + w + 'px;' + 'height: ' + h + 'px;'
  }
  // Place1("all", 0, 0, window.innerWidth, window.innerHeight);

  Place1("back", 0, widthId + marg, heightId, widthId, heightId);
  Place1("left", heightId, marg, widthId, heightId);
  Place1("bottom", heightId, widthId + marg, widthId, heightId);
  Place1("right", heightId, 2 * widthId + marg, widthId, heightId);
  Place1("top", heightId, 3 * widthId + marg, widthId, heightId);
  Place1("front", 2 * heightId, widthId + marg, widthId, heightId);


  Place1("all", 0, 4 * widthId + 2 * marg, window.innerWidth - (4 * widthId + 2 * marg + 0.5), window.innerHeight);
  Place1("orbit", 3 * heightId, 0, 4 * widthId + 2 * marg, window.innerHeight - 3 * heightId);
}
Place();
window.addEventListener('resize', Place);

function init() {
    // const { innerHeight, innerWidth } = window;
    scene = new THREE.Scene();

    canvas.push(document.getElementById('back'));
    canvas.push(document.getElementById('left'));
    canvas.push(document.getElementById('bottom'));
    canvas.push(document.getElementById('right'));
    canvas.push(document.getElementById('top'));
    canvas.push(document.getElementById('front'));
    canvas.push(document.getElementById('all'));
    canvas.push(document.getElementById('orbit'));
    // document.body.appendChild(canvas);
    // renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    for (let i = 0; i < canvas.length; i++) {
      renderers[i] = new THREE.WebGLRenderer({ antialias: true });
      canvas[i].appendChild( renderers[i].domElement );
      const innerHeight = canvas[i].clientHeight, innerWidth = canvas[i].clientWidth;
      // console.log(canvas);
      renderers[i].setClearColor("#000");
      renderers[i].setSize(innerWidth, innerHeight);
      renderers[i].setPixelRatio(window.devicePixelRatio);
  
      if (i < 6 )  cameras[i] = new THREE.OrthographicCamera(-2.1, 2.1, 2.1, -2.1,0.1,100);
      else cameras[i] = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1000);
      // cameras[i].lookAt(0,0,0);

    }
    // Back
    cameras[0].position.set(0, 0, -5);
    cameras[0].lookAt(0,0,0);
    cameras[0].rotateZ(Math.PI)
    // cameras[0].scale.set(1,1,1)
    // Left
    cameras[1].position.set(-5, 0, 0);
    cameras[1].lookAt(0,0,0);
    cameras[1].rotateZ(Math.PI/2)
    // cameras[1].scale.set(1,1,1)
    // Top
    cameras[2].position.set(0, 5, 0);
    cameras[2].lookAt(0,0,0);
    // cameras[2].scale.set(1,1,1)
    // Right
    cameras[3].position.set(5, 0, 0);
    cameras[3].lookAt(0,0,0);
    cameras[3].rotateZ(-Math.PI/2)
    // cameras[3].scale.set(1,1,1)
    // Bottom
    cameras[4].position.set(0, -5, 0);
    cameras[4].lookAt(0,0,0);
    cameras[4].rotateZ(Math.PI)
    // cameras[4].scale.set(1,1,1)
    // Front
    cameras[5].position.set(0, 0, 5);
    cameras[5].lookAt(0,0,0);
    // cameras[5].scale.set(1,1,1)
    // All
    // cameras[6] = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1000);
    cameras[6].position.set(4, 4, 4);
    cameras[6].lookAt(0,0,0);

    cameras[7].position.set(6, 6, 6);
    cameras[7].lookAt(0,0,0);

    controls = new OrbitControls(cameras[7], canvas[7]);
    // controls = new OrbitControls(cameras[7], document.querySelector('#orbit'));
    // console.log(controls)
    const axesHelper = new THREE.AxesHelper( 3 );
    scene.add( axesHelper );
    scene.add( arrowHelper );

    // window.addEventListener("resize", onWindowResize, false);
    createObjects();
}

function onWindowResize() {
    // const { innerWidth, innerHeight } = window;
    const innerHeight = canvas.clientHeight, innerWidth = canvas.clientWidth;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
}

class Roll {
    constructor() {
      this.active = false;
    }

    roll(face, direction) {
        if(this.active) return;
        this.face = face;
        this.direction = direction;
        cubes.forEach((item) => {
            if (item.position[face.axis] == face.value || !face.face) {
                scene.remove(item);
                group.add(item);
            }
        });
        gsap.to(group.rotation,{
            [this.face.axis]: this.direction * Math.PI / 2,
            duration: 0.5,
            ease:"bounce",
            onStart: () => this.active = true,
            onComplete: () => {
                this.clearGroup();
                this.active = false;
            },
        })
    }

    clearGroup() {
        for (let i = group.children.length - 1; i >= 0; i--) {
            let item = group.children[i];
            item.getWorldPosition(item.position);
            item.getWorldQuaternion(item.rotation);
            item.position.round();
            scene.add(item);
            group.remove(item);
        }
        group.rotation[this.face.axis] = 0;
    }
}

function createObjects() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    let createCube = (position) => {
        let mat = [];
        for (let i = 0; i < 6; i++) {
            let cnd = colorConditions[i];
            // if (position[cnd[0]] == cnd[1]) {
            mat.push(materials[cnd[2]].clone());
            // } else {
            // mat.push(materials.gray);
            // }
        }
        const cube = new THREE.Mesh(geometry, mat);
        cube.position.set(position.x, position.y, position.z);
        cubes.push(cube);
        scene.add(cube);
    };

    for (let x = -1; x < 2; x++)
      for (let y = -1; y < 2; y++)
        for (let z = -1; z < 2; z++)
          createCube({ x, y, z });

    group = new THREE.Group();
    scene.add(group);
    rollObject = new Roll();
  }

function render() {
    requestAnimationFrame(render);
    // controls.update();

    raycaster.setFromCamera( pointer, cameras[6] );

    intersects = raycaster.intersectObjects( cubes );
    arrowHelper.visible = intersects.length != 0;

    if (intersects.length == 0) {
      if(intersectsPrev != null) {
        intersectsPrev.object.material[ intersectsPrev.face.materialIndex ].uniforms.faceColor.value = materials[colorConditions[intersectsPrev.face.materialIndex][2]].uniforms.faceColor.value;
      }
    }
    else {
      arrowHelper.position.copy(intersects[ 0 ].point);
      normalMatrix.getNormalMatrix( intersects[ 0 ].object.matrixWorld );
      // normalMatrix = new THREE.Matrix3().getNormalMatrix( intersects[ 0 ].object.matrixWorld );
      normalIntersect = intersects[ 0 ].face.normal.clone().applyMatrix3( normalMatrix );//.normalize();
      arrowHelper.setDirection(normalIntersect);
      pointIntersect = intersects[ 0 ].object.position;
      if(intersects[0].object.material[ intersects[ 0 ].face.materialIndex ].uniforms.faceColor.value != materials['gray'].uniforms.faceColor.value) { 

        if(intersectsPrev != null)
          intersectsPrev.object.material[ intersectsPrev.face.materialIndex ].uniforms.faceColor.value = materials[colorConditions[intersectsPrev.face.materialIndex][2]].uniforms.faceColor.value;
        
        intersects[ 0 ].object.material[ intersects[ 0 ].face.materialIndex ].uniforms.faceColor.value = materials['gray'].uniforms.faceColor.value;//{x:0, y:0, z:0, w:1};
        intersectsPrev = intersects[ 0 ];
      }
    }
    for (let i = 0; i < canvas.length; i++) {
      renderers[i].render(scene, cameras[i]);
      
    }
    // renderer.render(scene, camera);
    // rendererFront.render(scene, cameraFront);
}

// window.addEventListener( 'pointermove', onPointerMove );
// window.addEventListener("mousedown", onMouseDown);
// window.addEventListener("mouseup", onMouseUp);
init();
let onPointerMove = ( event ) => {
	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
  pointer.x = ( event.offsetX / event.target.clientWidth ) * 2 - 1;
	pointer.y = - ( event.offsetY / event.target.clientHeight ) * 2 + 1;
}

let onMouseDown = ( event ) => {
	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
  pointerClick.x = ( event.offsetX / event.target.clientWidth ) * 2 - 1;
	pointerClick.y = - ( event.offsetY / event.target.clientHeight ) * 2 + 1;
  if (arrowHelper.visible) {
    pPointIntersect = pointIntersect;
    pNormalIntersect = normalIntersect;
  }
}
// canvas[6].addEventListener( 'pointermove', onPointerMove );
canvas[6].addEventListener( 'pointermove', onPointerMove);
canvas[6].addEventListener("mousedown", onMouseDown);
canvas[6].addEventListener("mouseup", onMouseUp);
render();


function sign(val) {
  const ERR = 0.01;
  if (val > ERR) return 1;
  if (val < -ERR) return -1;
  return 0;
}

function onMouseUp( event ) {
  if (!arrowHelper.visible) return;
  const pointerDelta = pointerClick.clone().sub(pointer).normalize();
  const s = Math.sin(Math.PI / 4);
  const c = Math.cos(Math.PI / 4);
  if (pNormalIntersect.y > 0.9) {
    rollObject.roll(
      { 
        axis: (pointerDelta.x * pointerDelta.y > 0) ? "x" : "z", 
        value: (pointerDelta.x * pointerDelta.y > 0) ? sign(pPointIntersect.x) : sign(pPointIntersect.z), 
        face: Math.abs(pPointIntersect.x) > 0.1 || Math.abs(pPointIntersect.z) > 0.1
      },
      (pointerDelta.x > 0) ? 1 : -1);
  }
  else if (pNormalIntersect.x > 0.9) {
    rollObject.roll(
      { 
        axis: (Math.abs(c * pointerDelta.x + s * pointerDelta.y) < Math.abs(pointerDelta.y)) ? "z" : "y", 
        value: (Math.abs(c * pointerDelta.x + s * pointerDelta.y) < Math.abs(pointerDelta.y)) ? sign(pPointIntersect.z) : sign(pPointIntersect.y), 
        face: Math.abs(pPointIntersect.y) > 0.1 || Math.abs(pPointIntersect.z) > 0.1
      },
      (c * pointerDelta.x + s * pointerDelta.y < 0) ? 1 : -1);
  }
  else /*if (pNormalIntersect.z > 0.9)*/ {
    rollObject.roll(
      { 
        axis: (Math.abs(-c * pointerDelta.x + s * pointerDelta.y) < Math.abs(pointerDelta.y)) ? "x" : "y", 
        value: (Math.abs(-c * pointerDelta.x + s * pointerDelta.y) < Math.abs(pointerDelta.y)) ? sign(pPointIntersect.x) : sign(pPointIntersect.y), 
        face: Math.abs(pPointIntersect.x) > 0.1 || Math.abs(pPointIntersect.y) > 0.1
      },
      (-c * pointerDelta.x + s * pointerDelta.y > 0) ? 1 : -1);
    }
}
