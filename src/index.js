import { OrbitControls } from './OrbitControls1.js'

import { gsap } from '../node_modules/gsap/gsap-core.js'

// import * as dat from 'dat.gui'

import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

let scene, rollObject, group;//, controls;
let canvas = [], cameras = [], renderers = []

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

const config = [
  { axis: "x", dir: 1, color: "red", name: 'right', pos: { x: 5, y: 0, z: 0 }, rotZ: -Math.PI / 2, cam: "Orthographic" },
  { axis: "x", dir: -1, color: "orange", name: 'left', pos: { x: -5, y: 0, z: 0 }, rotZ: Math.PI / 2, cam: "Orthographic" },
  { axis: "y", dir: 1, color: "yellow", name: 'top', pos: { x: 0, y: 5, z: 0 }, rotZ: 0, cam: "Orthographic" },
  { axis: "y", dir: -1, color: "white", name: 'bottom', pos: { x: 0, y: -5, z: 0 }, rotZ: Math.PI, cam: "Orthographic" },
  { axis: "z", dir: 1, color: "blue", name: 'front', pos: { x: 0, y: 0, z: 5 }, rotZ: 0, cam: "Orthographic" },
  { axis: "z", dir: -1, color: "green", name: 'back', pos: { x: 0, y: 0, z: -5 }, rotZ: Math.PI, cam: "Orthographic" },
  { axis: "", dir: 0, color: "", name: 'all', pos: { x: 4, y: 4, z: 4 }, rotZ: 0, cam: "Perspective" },
  { axis: "", dir: 0, color: "", name: 'orbit', pos: { x: 6, y: 6, z: 6 }, rotZ: 0, cam: "Perspective" }
];

let cubes = [];

const dir = new THREE.Vector3(1, 2, 0).normalize();
const origin = new THREE.Vector3(0, 0, 0);
const length = 1;
const hex = 0xffffff;
const arrowHelper = new THREE.ArrowHelper();// dir, origin, length, hex );

const createMaterial = (color) =>
  new THREE.ShaderMaterial({
    fragmentShader,
    vertexShader,
    uniforms: { faceColor: { value: color } },
  });

const materials = Object.entries({
  red: new THREE.Vector4(0.847, 0.203, 0.372),
  orange: new THREE.Vector4(0.792, 0.317, 0.086),
  yellow: new THREE.Vector4(0.807, 0.725, 0.07),
  white: new THREE.Vector4(0.956, 0.956, 0.956),
  blue: new THREE.Vector4(0.011, 0.352, 0.65),
  green: new THREE.Vector4(0.054, 0.486, 0.117),
  gray: new THREE.Vector4(0.301, 0.243, 0.243)
}).reduce((acc, [key, val]) => ({ ...acc, [key]: createMaterial(val) }), {});

const Place = () => {
  let widthId = window.innerWidth;
  let heightId = window.innerHeight;
  let marg = 10;
  if (widthId / 4 < heightId / 9) [widthId, heightId] = [widthId / 4, widthId / 4];
  else[widthId, heightId] = [heightId / 9, heightId / 9];

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
  const nRenderer = renderers.push(new THREE.WebGLRenderer({ antialias: true })) - 1;
  canvas[nCanva].appendChild(renderers[nRenderer].domElement);
  const innerHeight = canvas[nCanva].clientHeight, innerWidth = canvas[nCanva].clientWidth;
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
    const innerHeight = canvas[i].clientHeight, innerWidth = canvas[i].clientWidth;
    cameras[i].aspect = innerWidth / innerHeight;
    cameras[i].updateProjectionMatrix();
    renderers[i].setSize(innerWidth, innerHeight);
  }
}

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

  createObjects();
}

class Roll {
  constructor() {
    this.active = false;
  }

  roll(face, direction) {
    if (this.active) return;
    this.face = face;
    this.direction = direction;
    cubes.forEach((item) => {
      if (item.position[face.axis] == face.value || !face.face) {
        scene.remove(item);
        group.add(item);
      }
    });
    gsap.to(group.rotation, {
      [this.face.axis]: this.direction * Math.PI / 2,
      duration: 0.5,
      ease: "bounce",
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
      let cnd = config[i];
      // if (position[cnd[0]] == cnd[1]) {
      mat.push(materials[cnd.color].clone());
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

  raycaster.setFromCamera(pointer, cameras[6]);

  intersects = raycaster.intersectObjects(cubes);
  arrowHelper.visible = intersects.length != 0;

  if (intersects.length == 0) {
    if (intersectsPrev != null) {
      intersectsPrev.object.material[intersectsPrev.face.materialIndex].uniforms.faceColor.value = materials[config[intersectsPrev.face.materialIndex].color].uniforms.faceColor.value;
    }
  }
  else {
    arrowHelper.position.copy(intersects[0].point);
    normalMatrix.getNormalMatrix(intersects[0].object.matrixWorld);
    // normalMatrix = new THREE.Matrix3().getNormalMatrix( intersects[ 0 ].object.matrixWorld );
    normalIntersect = intersects[0].face.normal.clone().applyMatrix3(normalMatrix);//.normalize();
    arrowHelper.setDirection(normalIntersect);
    pointIntersect = intersects[0].object.position;
    if (intersects[0].object.material[intersects[0].face.materialIndex].uniforms.faceColor.value != materials['gray'].uniforms.faceColor.value) {

      if (intersectsPrev != null)
        intersectsPrev.object.material[intersectsPrev.face.materialIndex].uniforms.faceColor.value = materials[config[intersectsPrev.face.materialIndex].color].uniforms.faceColor.value;

      intersects[0].object.material[intersects[0].face.materialIndex].uniforms.faceColor.value = materials['gray'].uniforms.faceColor.value;//{x:0, y:0, z:0, w:1};
      intersectsPrev = intersects[0];
    }
  }
  for (let i = 0; i < canvas.length; i++) renderers[i].render(scene, cameras[i]);
}

const onPointerMove = (event) => {
  // calculate pointer position in normalized device coordinates
  // (-1 to +1) for both components
  pointer.x = (event.offsetX / event.target.clientWidth) * 2 - 1;
  pointer.y = - (event.offsetY / event.target.clientHeight) * 2 + 1;
}

const onMouseDown = (event) => {
  pointerClick.x = (event.offsetX / event.target.clientWidth) * 2 - 1;
  pointerClick.y = - (event.offsetY / event.target.clientHeight) * 2 + 1;
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
init();
render();