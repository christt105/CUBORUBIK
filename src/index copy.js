import './styles.css'
import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { OrbitControls } from './OrbitControls1.js'

// import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
// import * as dat from 'dat.gui'
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

let factor = 10;
let scene, camera, renderer, controls, rollObject, group;

let intersectsPrev = null;
let intersects = null;
const raycaster = new THREE.Raycaster();//, projector = new THREE.Projector();
const pointer = new THREE.Vector2(Infinity,Infinity);
const pointerClick = new THREE.Vector2();

let pointIntersect = new THREE.Vector3();
let normalIntersect = new THREE.Vector3();
let pPointIntersect = new THREE.Vector3();
let pNormalIntersect = new THREE.Vector3();


const rotateConditions = {
    right: { axis: "x", value: 1, face: true },
    left: { axis: "x", value: -1, face: true },
    top: { axis: "y", value: 1, face: true },
    bottom: { axis: "y", value: -1, face: true },
    front: { axis: "z", value: 1, face: true },
    back: { axis: "z", value: -1, face: true }
};

const colorConditions = [
    ["x", 1, "green"],
    ["x", -1, "orange"],
    ["y", 1, "red"],
    ["y", -1, "yellow"],
    ["z", 1, "blue"],
    ["z", -1, "white"]
];

const step = 0.5 * Math.PI / factor;
const faces = ["front", "back", "left", "right", "top", "bottom"];
const directions = [-1, 1];
const cPositions = [-1, 0, 1];
let cubes = [];

const dir = new THREE.Vector3( 1, 2, 0 );

//normalize the direction vector (convert to vector of length 1)
dir.normalize();

const origin = new THREE.Vector3( 0, 0, 0 );
const length = 1;
const hex = 0xffffff;

const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );

const createMaterial = (color) =>
    new THREE.ShaderMaterial({
        fragmentShader,
        vertexShader,
        uniforms: { faceColor: { type: "v3", value: color } },
        // transparent: true,
        // wireframe: true
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
  
function init() {
    const { innerHeight, innerWidth } = window;
    scene = new THREE.Scene();
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setClearColor("#000");
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1000);
    camera.position.set(6, 6, 6);
    camera.rotation.z = 0; 
    camera.lookAt(0,0,0);

    // controls = new OrbitControls(camera, canvas);

    const axesHelper = new THREE.AxesHelper( 3 );
    scene.add( axesHelper );
    scene.add( arrowHelper );

    window.addEventListener("resize", onWindowResize, false);
    createObjects();
}

function onWindowResize() {
    const { innerWidth, innerHeight } = window;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
}

class Roll {
    constructor(face, direction) {
        this.update(face, direction);
    }

    update(face, direction) {
        this.face = face;
        this.stepCount = 0;
        this.active = true;
        this.init();
        this.direction = direction;
    }

    init() {
        cubes.forEach((item) => {
          if(this.face.face){
            if (item.position[this.face.axis] == this.face.value) {
                scene.remove(item);
                group.add(item);
            }
          }
          else {
            scene.remove(item);
            group.add(item);
          }
        });
    }
    rollFace() {
        if (this.stepCount != factor) {
            group.rotation[this.face.axis] += this.direction * step;
            this.stepCount += 1;
        } else {
            if (this.active) {
                this.active = false;
                this.clearGroup();
            }
        }
    }

    clearGroup() {
        for (var i = group.children.length - 1; i >= 0; i--) {
            let item = group.children[i];
            item.getWorldPosition(item.position);
            item.getWorldQuaternion(item.rotation);
            item.position.x = Math.round(item.position.x);
            item.position.y = Math.round(item.position.y);
            item.position.z = Math.round(item.position.z);
            group.remove(item);
            scene.add(item);
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
        // cube.name = position.x + 100 * position.y + 100000 * position.z;
        cubes.push(cube);
        scene.add(cube);
    };

    cPositions.forEach((x) => {
        cPositions.forEach((y) => {
            cPositions.forEach((z) => {
                createCube({ x, y, z });
            });
        });
    });

    group = new THREE.Group();
    scene.add(group);
    rollObject = new Roll(rotateConditions["top"], -1);
}

function update() {
    if (!rollObject) return;
    if (rollObject.active) rollObject.rollFace();
    // else rollObject.update(
    //         rotateConditions[faces[Math.floor(Math.random() * faces.length)]],
    //         directions[Math.floor(Math.random() * directions.length)] );
}

function move(rotateCond, dir) {
  if (!rollObject.active)
    rollObject.update( rotateCond, dir );
}

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var keyCode = event.which;
    // if (keyCode == 87) {
    //     cube.position.y += ySpeed;
    // } else if (keyCode == 83) {
    //     cube.position.y -= ySpeed;
    // } else if (keyCode == 65) {
    //     cube.position.x -= xSpeed;
    // } else if (keyCode == 68) {
    //     cube.position.x += xSpeed;
    // } else if (keyCode == 32) {
    //     cube.position.set(0, 0, 0);
    // }

    // key1 = keyCode == 37;
};


function render() {
    requestAnimationFrame(render);
    update();
    // console.log(arrowHelper);
    // var theta = .1 //the speed of rotation

    // if (key1){
    //     var x = camera.position.y;
    //     var z = camera.position.z;
    
    //     camera.position.y = x * Math.cos(theta) + z * Math.sin(theta);
    //     camera.position.z = z * Math.cos(theta) - x * Math.sin(theta);
    //     camera.lookAt(scene.position);
    //     key1 = false;
    // }
    // controls.update();

    raycaster.setFromCamera( pointer, camera );

    intersects = raycaster.intersectObjects( cubes );
    arrowHelper.visible = intersects.length != 0;

    if (intersects.length == 0) {
      if(intersectsPrev != null) {
        intersectsPrev.object.material[ intersectsPrev.face.materialIndex ].uniforms.faceColor.value = materials[colorConditions[intersectsPrev.face.materialIndex][2]].uniforms.faceColor.value;
      }
    }
    else {
      arrowHelper.position.copy(intersects[ 0 ].point);
      let normalMatrix = new THREE.Matrix3().getNormalMatrix( intersects[ 0 ].object.matrixWorld );
      let newNormal = intersects[ 0 ].face.normal.clone().applyMatrix3( normalMatrix );//.normalize();
      arrowHelper.setDirection(newNormal);
      pointIntersect = intersects[ 0 ].object.position;
      normalIntersect = newNormal;
      // console.log(pointIntersect, normalIntersect)
      if(intersects[0].object.material[ intersects[ 0 ].face.materialIndex ].uniforms.faceColor.value != materials['gray'].uniforms.faceColor.value) { 

        if(intersectsPrev != null)
          intersectsPrev.object.material[ intersectsPrev.face.materialIndex ].uniforms.faceColor.value = materials[colorConditions[intersectsPrev.face.materialIndex][2]].uniforms.faceColor.value;
        
        intersects[ 0 ].object.material[ intersects[ 0 ].face.materialIndex ].uniforms.faceColor.value = materials['gray'].uniforms.faceColor.value;//{x:0, y:0, z:0, w:1};
        intersectsPrev = intersects[ 0 ];

        // arrowHelper.position.copy(intersects[ 0 ].point);
        // arrowHelper.setDirection(newNormal);

      }
    }
    renderer.render(scene, camera);
}

window.addEventListener( 'pointermove', onPointerMove );
window.addEventListener("mousedown", onMouseDown);
window.addEventListener("mouseup", onMouseUp);
init();
render();

// function enableCameraControl() {
//   OrbitControls.noRotate = false;
// }

// function disableCameraControl() {
//   OrbitControls.noRotate = true;
// }

function onPointerMove( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onMouseDown( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
	pointerClick.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointerClick.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  if (arrowHelper.visible) {
    pPointIntersect = pointIntersect;
    pNormalIntersect = normalIntersect;
  }
}

function sign(val) {
  const ERR = 0.01;
  if (val > ERR) return 1;
  if (val < -ERR) return -1;
  return 0;
}

function onMouseUp( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
  const pointerDelta = pointerClick.clone().sub(pointer).normalize();
  // console.log(pointerDelta, pNormalIntersect,pPointIntersect)
  const s = Math.sin(Math.PI / 4);
  const c = Math.cos(Math.PI / 4);
  if (pNormalIntersect.y > 0.9) {
    // console.log(pPointIntersect)
    move(
      { 
        axis: (pointerDelta.x * pointerDelta.y > 0) ? "x" : "z", 
        value: (pointerDelta.x * pointerDelta.y > 0) ? sign(pPointIntersect.x) : sign(pPointIntersect.z), 
        // value: (pointerDelta.x * pointerDelta.y > 0) ? (pPointIntersect.x > 0 ? 1 : -1) : (pPointIntersect.z > 0 ? 1 : -1), 
        face: Math.abs(pPointIntersect.x) > 0.1 || Math.abs(pPointIntersect.z) > 0.1
      },
      (pointerDelta.x > 0) ? 1 : -1);
  }
  else if (pNormalIntersect.x > 0.9) {
    move(
      { 
        axis: (c * Math.abs(pointerDelta.x) + s * Math.abs(pointerDelta.y) < Math.abs(pointerDelta.y)) ? "z" : "y", 
        value: (c * Math.abs(pointerDelta.x) + s * Math.abs(pointerDelta.y)  < Math.abs(pointerDelta.y)) ? sign(pPointIntersect.z) : sign(pPointIntersect.y), 
        face: Math.abs(pPointIntersect.y) > 0.1 || Math.abs(pPointIntersect.z) > 0.1
      },
      (pointerDelta.y < 0) ? 1 : -1);
  }
  else if (pNormalIntersect.z > 0.9) {
    move(
      { 
        axis: (c * Math.abs(pointerDelta.x) + s * Math.abs(pointerDelta.y) < Math.abs(pointerDelta.y)) ? "x" : "y", 
        value: (c * Math.abs(pointerDelta.x) + s * Math.abs(pointerDelta.y) < Math.abs(pointerDelta.y)) ? sign(pPointIntersect.x) : sign(pPointIntersect.y), 
        face: Math.abs(pPointIntersect.x) > 0.1 || Math.abs(pPointIntersect.y) > 0.1
      },
      (pointerDelta.y > 0) ? 1 : -1);
  }
  // const gir = new THREE.Vector3(
  //   (pNormalIntersect.y > 0.9) ? ((pointerDelta.x > 0) ? 1 : -1 ): 1,
  //   (pNormalIntersect.y > 0.9) ? 0 : 1,
  //   (pNormalIntersect.y > 0.9) ? 0 : 1
  // )
  // if(pointerDelta.x * pointerDelta.y < 0 && pNormalIntersect.y > 0.9 && pPointIntersect.z > 0.9) 
  // {
  //     move(rotateConditions["front"], (pointerDelta.x > 0) ? 1 : -1);
  // } 
  // else if(Math.abs(pointerDelta.x) < Math.abs(pointerDelta.y) && pNormalIntersect.x > 0.9 && pPointIntersect.z > 0.9) 
  // {
  //     move(rotateConditions["front"], (pointerDelta.y < 0) ? 1 : -1);
  // } 

  // else if(pointerDelta.x * pointerDelta.y < 0 && pNormalIntersect.y > 0.9 && pPointIntersect.z < -0.9) 
  // {
  //     move(rotateConditions["back"], (pointerDelta.x > 0) ? 1 : -1);
  // } 
  // else if(Math.abs(pointerDelta.x) < Math.abs(pointerDelta.y) && pNormalIntersect.x > 0.9 && pPointIntersect.z < 0) 
  // {
  //     move(rotateConditions["back"], (pointerDelta.y < 0) ? 1 : -1);
  // } 

  // else if(pointerDelta.x * pointerDelta.y >= 0 && pNormalIntersect.y > 0.9 && pPointIntersect.x < -0.9) 
  // {
  //     move(rotateConditions["left"], (pointerDelta.x > 0) ? 1 : -1);
  // } 
  // else if(Math.abs(pointerDelta.x) < Math.abs(pointerDelta.y) && pPointIntersect.x < -0.9 && pPointIntersect.x < 0) 
  // {
  //     move(rotateConditions["left"], (pointerDelta.y * pPointIntersect.z > 0) ? 1 : -1);
  // } 

  // else if(pointerDelta.x * pointerDelta.y >= 0 && pNormalIntersect.y > 0.9 && pPointIntersect.x > 0.9) 
  // {
  //     move(rotateConditions["right"], (pointerDelta.x > 0) ? 1 : -1);
  // } 
  // else if(Math.abs(pointerDelta.x) < Math.abs(pointerDelta.y) && pNormalIntersect.z > 0.9 && pPointIntersect.x > 0) 
  // {
  //     move(rotateConditions["right"], (pointerDelta.y * pPointIntersect.z > 0) ? 1 : -1);
  // } 

  // else if(Math.abs(pointerDelta.x) > Math.abs(pointerDelta.y)  && (pNormalIntersect.x > 0.9 || pNormalIntersect.z > 0.9) && pPointIntersect.y > 0.9) 
  // {
  //     move(rotateConditions["top"], (pointerDelta.x < 0) ? 1 : -1);
  // } 
  // else if(Math.abs(pointerDelta.x) > Math.abs(pointerDelta.y) && (pNormalIntersect.x > 0.9 || pNormalIntersect.z > 0.9) && pPointIntersect.y < -0.9) 
  // {
  //     move(rotateConditions["bottom"], (pointerDelta.x < 0) ? 1 : -1);
  // } 
  // else if(pointerDelta.x * pointerDelta.y >= 0 && pNormalIntersect.y > 0.9 && pPointIntersect.x < 0.1) 
  // {
  //     move({ axis: "x", value: 1, face: false }, (pointerDelta.x > 0) ? 1 : -1);
  // } 
  // else if(Math.abs(pointerDelta.x) < Math.abs(pointerDelta.y) && pNormalIntersect.z > 0.9 && Math.abs(pPointIntersect.x) < 0.1) 
  // {
  //     move({ axis: "x", value: 1, face: false }, (pointerDelta.x > 0) ? 1 : -1);
  // } 

  // else if(pointerDelta.x * pointerDelta.y <= 0 && pNormalIntersect.y > 0.9 && pPointIntersect.x < 0.1) 
  // {
  //     move({ axis: "z", value: 1, face: false }, (pointerDelta.x > 0) ? 1 : -1);
  // } 
  // else if(Math.abs(pointerDelta.x) < Math.abs(pointerDelta.y) && pNormalIntersect.x > 0.9 && Math.abs(pPointIntersect.z) < 0.1) 
  // {
  //     move({ axis: "z", value: 1, face: false }, (pointerDelta.x > 0) ? 1 : -1);
  // } 

  // else if(Math.abs(pointerDelta.x) > Math.abs(pointerDelta.y)  && (pNormalIntersect.x > 0.9 || pNormalIntersect.z > 0.9) && Math.abs(pPointIntersect.y) < 0.1) 
  // {
  //   move({ axis: "y", value: 1, face: false }, (pointerDelta.x < 0) ? 1 : -1);
  // } 

}