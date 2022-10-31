import {
  OrbitControls
} from './OrbitControls1.js'

import {
  gsap
} from '../node_modules/gsap/gsap-core.js'

// import * as dat from 'dat.gui'

import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

let scene, rollObject, group; //, controls;
let canvas = [],
  cameras = [],
  renderers = []

let intersectsPrev = null;
let intersects = null;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(Infinity, Infinity);
const pointerClick = new THREE.Vector2();

let pointIntersect = new THREE.Vector3();
let normalIntersect = new THREE.Vector3();
let pPointIntersect = new THREE.Vector3();
let pNormalIntersect = new THREE.Vector3();
const normalMatrix = new THREE.Matrix3();

const config = [{
    axis: "x",
    dir: 1,
    color: "red",
    name: 'right',
    pos: {
      x: 5,
      y: 0,
      z: 0
    },
    rotZ: -Math.PI / 2,
    cam: "Orthographic"
  },
  {
    axis: "x",
    dir: -1,
    color: "orange",
    name: 'left',
    pos: {
      x: -5,
      y: 0,
      z: 0
    },
    rotZ: Math.PI / 2,
    cam: "Orthographic"
  },
  {
    axis: "y",
    dir: 1,
    color: "yellow",
    name: 'top',
    pos: {
      x: 0,
      y: 5,
      z: 0
    },
    rotZ: 0,
    cam: "Orthographic"
  },
  {
    axis: "y",
    dir: -1,
    color: "white",
    name: 'bottom',
    pos: {
      x: 0,
      y: -5,
      z: 0
    },
    rotZ: Math.PI,
    cam: "Orthographic"
  },
  {
    axis: "z",
    dir: 1,
    color: "blue",
    name: 'front',
    pos: {
      x: 0,
      y: 0,
      z: 5
    },
    rotZ: 0,
    cam: "Orthographic"
  },
  {
    axis: "z",
    dir: -1,
    color: "green",
    name: 'back',
    pos: {
      x: 0,
      y: 0,
      z: -5
    },
    rotZ: Math.PI,
    cam: "Orthographic"
  },
  {
    axis: "",
    dir: 0,
    color: "",
    name: 'all',
    pos: {
      x: 4,
      y: 4,
      z: 4
    },
    rotZ: 0,
    cam: "Perspective"
  },
  {
    axis: "",
    dir: 0,
    color: "",
    name: 'orbit',
    pos: {
      x: 6,
      y: 6,
      z: 6
    },
    rotZ: 0,
    cam: "Perspective"
  }
];

let cubes = [];

const arrowHelper = new THREE.ArrowHelper(); // dir, origin, length, hex );

const createMaterial = (color) =>
  new THREE.ShaderMaterial({
    fragmentShader,
    vertexShader,
    uniforms: {
      faceColor: {
        value: color
      }
    },
  });

const materials = Object.entries({
  red: new THREE.Vector4(0.847, 0.203, 0.372),
  orange: new THREE.Vector4(0.792, 0.317, 0.086),
  yellow: new THREE.Vector4(0.807, 0.725, 0.07),
  white: new THREE.Vector4(0.956, 0.956, 0.956),
  blue: new THREE.Vector4(0.011, 0.352, 0.65),
  green: new THREE.Vector4(0.054, 0.486, 0.117),
  gray: new THREE.Vector4(0.301, 0.243, 0.243)
}).reduce((acc, [key, val]) => ({
  ...acc,
  [key]: createMaterial(val)
}), {});

const Place = () => {
  let widthId = window.innerWidth;
  let heightId = window.innerHeight;
  let marg = 10;
  if (widthId / 4 < heightId / 9)[widthId, heightId] = [widthId / 4, widthId / 4];
  else [widthId, heightId] = [heightId / 9, heightId / 9];

  const Place1 = (id, t, l, w, h) => {
    document.querySelector("#" + id).style.cssText =
      'top: ' + t + 'px;' + 'left: ' + l + 'px;' + 'width: ' + w + 'px;' + 'height: ' + h + 'px;'
  }

  Place1("back", 0, widthId + marg, heightId, widthId, heightId);
  Place1("left", heightId, marg, widthId, heightId);
  Place1("top", heightId, widthId + marg, widthId, heightId);
  Place1("right", heightId, 2 * widthId + marg, widthId, heightId);
  Place1("bottom", heightId, 3 * widthId + marg, widthId, heightId);
  Place1("front", 2 * heightId, widthId + marg, widthId, heightId);

  Place1("all", 0, 4 * widthId + 2 * marg, window.innerWidth - (4 * widthId + 2 * marg + 0.5), window.innerHeight);
  Place1("orbit", 3 * heightId, 0, 4 * widthId + 2 * marg, window.innerHeight - 3 * heightId);
}

const fCanvasRenderCamera = (elem) => {
  const nCanva = canvas.push(document.getElementById(elem.name)) - 1;
  const nRenderer = renderers.push(new THREE.WebGLRenderer({
    antialias: true
  })) - 1;
  canvas[nCanva].appendChild(renderers[nRenderer].domElement);
  const innerHeight = canvas[nCanva].clientHeight,
    innerWidth = canvas[nCanva].clientWidth;
  renderers[nRenderer].setClearColor("#000");
  renderers[nRenderer].setSize(innerWidth, innerHeight);
  renderers[nRenderer].setPixelRatio(window.devicePixelRatio);
  if (elem.cam == "Orthographic") cameras.push(new THREE.OrthographicCamera(-2.1, 2.1, 2.1, -2.1, 0.1, 100));
  else cameras.push(new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1000));
  const nCamera = cameras.length - 1;
  cameras[nCamera].aspect = innerWidth / innerHeight;
  cameras[nCamera].position.set(elem.pos.x, elem.pos.y, elem.pos.z);
  cameras[nCamera].lookAt(0, 0, 0);
  cameras[nCamera].rotateZ(elem.rotZ);
}

const onWindowResize = () => {
  Place();
  for (let i = 0; i < canvas.length; i++) {
    const innerHeight = canvas[i].clientHeight,
      innerWidth = canvas[i].clientWidth;
    cameras[i].aspect = innerWidth / innerHeight;
    cameras[i].updateProjectionMatrix();
    renderers[i].setSize(innerWidth, innerHeight);
  }
}

var counterText;
var moves = 0;

function init() {
  Place();
  scene = new THREE.Scene();
  config.forEach(element => fCanvasRenderCamera(element));

  new OrbitControls(cameras[7], canvas[7]);
  const axesHelper = new THREE.AxesHelper(3);
  scene.add(axesHelper);
  scene.add(arrowHelper);

  canvas[6].addEventListener('pointermove', onPointerMove);
  canvas[6].addEventListener("mousedown", onMouseDown);
  canvas[6].addEventListener("mouseup", onMouseUp);
  window.addEventListener("resize", onWindowResize, false);

  let button = document.createElement("button");
  button.innerHTML = "Reset";
  button.className = "reset-button";
  button.onclick = function () {
    reset();
  }
  document.body.appendChild(button);

  var input = document.getElementById("input-alg");
  input.onfocus = function (event) {
    focusMain = false;
  }

  input.addEventListener("keypress", function(event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      moveButton.click();
    }
  });

  let moveButton = document.getElementById("move-button");
  moveButton.onclick = function () {
    MoveSequence(input.value);
  }

  let shuffleButton = document.getElementById("shuffle-button");
  shuffleButton.onclick = function () {
    setCubes([{
      "position": {
        "x": 1,
        "y": 1,
        "z": -1
      },
      "rotation": {
        "x": 1.570795266362471,
        "y": -3.267926562133874e-7,
        "z": 1.570795019614536
      }
    },
    {
      "position": {
        "x": -1,
        "y": -1,
        "z": 0
      },
      "rotation": {
        "x": -0.0000026143591738156973,
        "y": 0,
        "z": 0
      }
    },
    {
      "position": {
        "x": 1,
        "y": -1,
        "z": -1
      },
      "rotation": {
        "x": -3.1415916732121514,
        "y": 0.0000019606781131347717,
        "z": -3.1415890588463564
      }
    },
    {
      "position": {
        "x": 0,
        "y": -1,
        "z": 1
      },
      "rotation": {
        "x": -3.1415926535870162,
        "y": 0.000001960769380315402,
        "z": -1.5707986143591737
      }
    },
    {
      "position": {
        "x": -1,
        "y": 0,
        "z": 0
      },
      "rotation": {
        "x": -0.0000026143591738156973,
        "y": 0,
        "z": 0
      }
    },
    {
      "position": {
        "x": -1,
        "y": 1,
        "z": 0
      },
      "rotation": {
        "x": 1.570794039230619,
        "y": -1.570793947783561,
        "z": 0
      }
    },
    {
      "position": {
        "x": -1,
        "y": -1,
        "z": 1
      },
      "rotation": {
        "x": 3.1415923267921197,
        "y": -0.0000019607667386591824,
        "z": -0.0000016339750179596481
      }
    },
    {
      "position": {
        "x": 1,
        "y": 0,
        "z": 1
      },
      "rotation": {
        "x": -1.5707956732051036,
        "y": -0.0000019931285322191124,
        "z": -3.141592653589686
      }
    },
    {
      "position": {
        "x": -1,
        "y": 1,
        "z": 1
      },
      "rotation": {
        "x": -0.000001960769593950884,
        "y": 6.535868027297799e-7,
        "z": 0.000002614360455679131
      }
    },
    {
      "position": {
        "x": -1,
        "y": 0,
        "z": -1
      },
      "rotation": {
        "x": -6.54281605338747e-7,
        "y": 8.559418002288205e-13,
        "z": -1.5707986143591737
      }
    },
    {
      "position": {
        "x": 0,
        "y": -1,
        "z": 0
      },
      "rotation": {
        "x": 0,
        "y": 1.570795999647377,
        "z": 0
      }
    },
    {
      "position": {
        "x": 0,
        "y": -1,
        "z": -1
      },
      "rotation": {
        "x": 3.1415926535895795,
        "y": 6.535897935203424e-7,
        "z": -3.1415893856408257
      }
    },
    {
      "position": {
        "x": 0,
        "y": 0,
        "z": -1
      },
      "rotation": {
        "x": 0,
        "y": 0,
        "z": 3.1415919999999997
      }
    },
    {
      "position": {
        "x": 0,
        "y": 0,
        "z": 0
      },
      "rotation": {
        "x": 0,
        "y": 0,
        "z": 0
      }
    },
    {
      "position": {
        "x": 0,
        "y": 0,
        "z": 1
      },
      "rotation": {
        "x": 0,
        "y": 0,
        "z": -3.141589385640826
      }
    },
    {
      "position": {
        "x": 1,
        "y": 1,
        "z": 0
      },
      "rotation": {
        "x": 1.570795999647377,
        "y": 1.4956924587750109e-12,
        "z": -1.5707992679489677
      }
    },
    {
      "position": {
        "x": 0,
        "y": 1,
        "z": 0
      },
      "rotation": {
        "x": -3.141592653589793,
        "y": -6.53262981487058e-7,
        "z": -3.141592653589793
      }
    },
    {
      "position": {
        "x": -1,
        "y": 0,
        "z": 1
      },
      "rotation": {
        "x": 1.5707953464102062,
        "y": -1.5707960003268118,
        "z": 0
      }
    },
    {
      "position": {
        "x": 1,
        "y": 1,
        "z": 1
      },
      "rotation": {
        "x": -3.141591346410421,
        "y": -6.535910752442228e-7,
        "z": -0.000002614358747268499
      }
    },
    {
      "position": {
        "x": 0,
        "y": 1,
        "z": -1
      },
      "rotation": {
        "x": 1.5707963267947898,
        "y": 1.5707950836414668,
        "z": 0
      }
    },
    {
      "position": {
        "x": -1,
        "y": 1,
        "z": -1
      },
      "rotation": {
        "x": 3.1415916732054234,
        "y": -1.5707946401308879,
        "z": 0
      }
    },
    {
      "position": {
        "x": 1,
        "y": -1,
        "z": 0
      },
      "rotation": {
        "x": 1.5707992679489666,
        "y": -1.5707951486604284,
        "z": 0
      }
    },
    {
      "position": {
        "x": 1,
        "y": 0,
        "z": 0
      },
      "rotation": {
        "x": 0.0000013071795870180332,
        "y": 0,
        "z": 0
      }
    },
    {
      "position": {
        "x": 1,
        "y": 0,
        "z": -1
      },
      "rotation": {
        "x": -3.1415916732044624,
        "y": -9.80197325093026e-7,
        "z": 6.535897936202655e-7
      }
    },
    {
      "position": {
        "x": -1,
        "y": -1,
        "z": -1
      },
      "rotation": {
        "x": -3.267943481830674e-7,
        "y": 3.3585522340135865e-7,
        "z": 3.1415910196154164
      }
    },
    {
      "position": {
        "x": 0,
        "y": 1,
        "z": 1
      },
      "rotation": {
        "x": 2.7755575615628914e-16,
        "y": -1.5707949425901084,
        "z": 0
      }
    },
    {
      "position": {
        "x": 1,
        "y": -1,
        "z": 1
      },
      "rotation": {
        "x": 1.5707976339737986,
        "y": 7.702354863292532e-8,
        "z": 0.000001960769379972365
      }
    }
  ]);
  }

  counterText = document.getElementById('counter-text');
  counterText.innerText = moves;

  let counterButton = document.getElementById("counter-button");
  counterButton.onclick = function () {
    moves = 0;
    refreshCounter();
  }

  document.addEventListener('keydown', (event) => {
    if (!focusMain)
      return;
    const keyName = event.key;
    console.log("key " + keyName + " pressed")
    switch (keyName.toLowerCase()) {
      case 'u':
      case 'd':
      case 'r':
      case 'l':
      case 'f':
      case 'b':
        rollObject.roll(GetRollByFace(keyName), GetDirectionByFace(keyName));
        break;
      case 'enter':
        if(input.value.length > 0)
        MoveSequence(input.value);
        break;

      case 'backspace':
        let positionsAndRotations = [];
        for (let i = 0; i < cubes.length; i++) {
          const cube = cubes[i];
          positionsAndRotations.push({
            position: {
              x: cube.position.x,
              y: cube.position.y,
              z: cube.position.z
            },
            rotation: {
              x: cube.rotation.x,
              y: cube.rotation.y,
              z: cube.rotation.z
            }
          });

        }
        console.log(positionsAndRotations);
        break;

      case 'arrowright':
        rollObject.roll({
            axis: "y",
            value: -1,
            face: false
          },
          1);
        break;
      case 'arrowleft':
        rollObject.roll({
            axis: "y",
            value: -1,
            face: false
          },
          -1);
        break;

      case 'arrowup':
        rollObject.roll({
            axis: "x",
            value: -1,
            face: false
          },
          -1);
        break;
      case 'arrowdown':
        rollObject.roll({
            axis: "x",
            value: -1,
            face: false
          },
          1);
        break;
      case '1':
        input.value = 'BrbbddB';
        break;
      case '2':
        input.value = 'ruuRluulluulBUb';
        break;
      case '3':
        input.value = 'uuURurubUB';
        break;
      case '4':
        input.value = 'UUFufurUR';
        break;
      case '5':
        input.value = 'ufUFULul';
        break;
      case '6':
        input.value = 'UulULUBub';
        break;
      case '7':
        input.value = 'lfuFUL';
        break;
      case '8':
        input.value = 'uuruuRUrURU';
        break;
      case '9':
        input.value = 'ulURuLUr';
        break;
      case '0':
        input.value = 'RDrdRDrd';
        break;

      default:
        break;
    }
  });

  createObjects();
}

function refreshCounter() {
  counterText.innerText = moves;
}

function MoveSequence(sequence) {
  console.log(sequence)
  if (sequence.length > 1) {
    rollObject.roll(GetRollByFace(sequence[0]), GetDirectionByFace(sequence[0]), () => MoveSequence(sequence.substring(1)));
  } else {
    rollObject.roll(GetRollByFace(sequence[0]), GetDirectionByFace(sequence[0]));
  }
}

function GetRollByFace(keyName) {
  switch (keyName.toLowerCase()) {
    case 'u':
      return {
        axis: "y",
          value: 1,
          face: true
      };

    case 'd':
      return {
        axis: "y",
          value: -1,
          face: true
      };

    case 'r':
      return {
        axis: "x",
          value: 1,
          face: true
      };
    case 'l':
      return {
        axis: "x",
          value: -1,
          face: true
      };

    case 'f':
      return {
        axis: "z",
          value: 1,
          face: true
      };

    case 'b':
      return {
        axis: "z",
          value: -1,
          face: true
      }
  }
}

function GetDirectionByFace(keyName) {
  switch (keyName.toLowerCase()) {
    case 'u':
      return keyName === keyName.toLowerCase() ? -1 : 1;
    case 'd':
      return keyName === keyName.toLowerCase() ? 1 : -1;
    case 'r':
      return keyName === keyName.toLowerCase() ? -1 : 1;
    case 'l':
      return keyName === keyName.toLowerCase() ? 1 : -1;
    case 'f':
      return keyName === keyName.toLowerCase() ? -1 : 1;
    case 'b':
      return keyName === keyName.toLowerCase() ? 1 : -1;
  }
}

var focusMain = true;

class Roll {
  constructor() {
    this.active = false;
  }

  roll(face, direction, onCompleted = null) {
    if (this.active) return;
    this.face = face;
    this.direction = direction;
    moves++;
    refreshCounter();
    cubes.forEach((item) => {
      if (item.position[face.axis] == face.value || !face.face) {
        scene.remove(item);
        group.add(item);
      }
    });
    const eases = ["back", "power2", "circ"];
    gsap.to(group.rotation, {
      [this.face.axis]: this.direction * Math.PI / 2,
      duration: 0.5,
      ease: eases[Math.floor(Math.random() * eases.length)],
      onStart: () => this.active = true,
      onComplete: () => {
        this.clearGroup();
        this.active = false;
        if (onCompleted) {
          onCompleted();
        }
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
      let cnd = config[i];
      mat.push(materials[cnd.color].clone());
    }
    const cube = new THREE.Mesh(geometry, mat);
    cube.position.set(position.x, position.y, position.z);
    let cubeScale = 1.3;
    cube.scale.set(cubeScale, cubeScale, cubeScale);
    cubes.push(cube);
    scene.add(cube);
  };

  for (let x = -1; x < 2; x++) {
    for (let y = -1; y < 2; y++) {
      for (let z = -1; z < 2; z++) {
        createCube({
          x,
          y,
          z
        });
      }
    }
  }

  group = new THREE.Group();
  scene.add(group);
  rollObject = new Roll();
}

function reset() {
  let index = 0;
  for (let x = -1; x < 2; x++) {
    for (let y = -1; y < 2; y++) {
      for (let z = -1; z < 2; z++) {
        let cube = cubes[index++];
        cube.position.set(x, y, z);
        cube.rotation.set(0, 0, 0)

      }
    }
  }
}

function setCubes(cubesArray) {
  for (let i = 0; i < cubes.length; i++) {
    const cube = cubes[i];
    const position = cubesArray[i].position;
    const rotation = cubesArray[i].rotation;
    cube.position.set(position.x, position.y, position.z);
    cube.rotation.set(rotation.x, rotation.y, rotation.z);
  }
}

function render() {
  requestAnimationFrame(render);
  // controls.update();

  raycaster.setFromCamera(pointer, cameras[6]);

  intersects = raycaster.intersectObjects(cubes);
  arrowHelper.visible = intersects.length != 0;

  if (intersects.length == 0) {
    if (intersectsPrev != null) {
      intersectsPrev.object.material[intersectsPrev.face.materialIndex].uniforms.faceColor.value = materials[config[intersectsPrev.face.materialIndex].color].uniforms.faceColor.value;
    }
  } else {
    arrowHelper.position.copy(intersects[0].point);
    normalMatrix.getNormalMatrix(intersects[0].object.matrixWorld);
    // normalMatrix = new THREE.Matrix3().getNormalMatrix( intersects[ 0 ].object.matrixWorld );
    normalIntersect = intersects[0].face.normal.clone().applyMatrix3(normalMatrix); //.normalize();
    arrowHelper.setDirection(normalIntersect);
    pointIntersect = intersects[0].object.position;
    if (intersects[0].object.material[intersects[0].face.materialIndex].uniforms.faceColor.value != materials['gray'].uniforms.faceColor.value) {

      if (intersectsPrev != null)
        intersectsPrev.object.material[intersectsPrev.face.materialIndex].uniforms.faceColor.value = materials[config[intersectsPrev.face.materialIndex].color].uniforms.faceColor.value;

      intersects[0].object.material[intersects[0].face.materialIndex].uniforms.faceColor.value = materials['gray'].uniforms.faceColor.value; //{x:0, y:0, z:0, w:1};
      intersectsPrev = intersects[0];
    }
  }
  for (let i = 0; i < canvas.length; i++) renderers[i].render(scene, cameras[i]);
}

const onPointerMove = (event) => {
  // calculate pointer position in normalized device coordinates
  // (-1 to +1) for both components
  pointer.x = (event.offsetX / event.target.clientWidth) * 2 - 1;
  pointer.y = -(event.offsetY / event.target.clientHeight) * 2 + 1;
}

const onMouseDown = (event) => {
  focusMain = true;
  pointerClick.x = (event.offsetX / event.target.clientWidth) * 2 - 1;
  pointerClick.y = -(event.offsetY / event.target.clientHeight) * 2 + 1;
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

function onMouseUp(event) {
  if (!arrowHelper.visible) return;
  const pointerDelta = pointerClick.clone().sub(pointer).normalize();
  const s = Math.sin(Math.PI / 4);
  const c = Math.cos(Math.PI / 4);
  if (pNormalIntersect.y > 0.9) {
    rollObject.roll({
        axis: (pointerDelta.x * pointerDelta.y > 0) ? "x" : "z",
        value: (pointerDelta.x * pointerDelta.y > 0) ? sign(pPointIntersect.x) : sign(pPointIntersect.z),
        face: Math.abs(pPointIntersect.x) > 0.1 || Math.abs(pPointIntersect.z) > 0.1
      },
      (pointerDelta.x > 0) ? 1 : -1);
  } else if (pNormalIntersect.x > 0.9) {
    rollObject.roll({
        axis: (Math.abs(c * pointerDelta.x + s * pointerDelta.y) < Math.abs(pointerDelta.y)) ? "z" : "y",
        value: (Math.abs(c * pointerDelta.x + s * pointerDelta.y) < Math.abs(pointerDelta.y)) ? sign(pPointIntersect.z) : sign(pPointIntersect.y),
        face: Math.abs(pPointIntersect.y) > 0.1 || Math.abs(pPointIntersect.z) > 0.1
      },
      (c * pointerDelta.x + s * pointerDelta.y < 0) ? 1 : -1);
  } else /*if (pNormalIntersect.z > 0.9)*/ {
    rollObject.roll({
        axis: (Math.abs(-c * pointerDelta.x + s * pointerDelta.y) < Math.abs(pointerDelta.y)) ? "x" : "y",
        value: (Math.abs(-c * pointerDelta.x + s * pointerDelta.y) < Math.abs(pointerDelta.y)) ? sign(pPointIntersect.x) : sign(pPointIntersect.y),
        face: Math.abs(pPointIntersect.x) > 0.1 || Math.abs(pPointIntersect.y) > 0.1
      },
      (-c * pointerDelta.x + s * pointerDelta.y > 0) ? 1 : -1);
  }
}
init();
render();