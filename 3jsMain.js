import * as THREE from './node_modules/three/build/three.module.js';
import { OBJLoader2Parallel } from "./node_modules/three/examples/jsm/loaders/OBJLoader2Parallel.js";
import { OBJLoader } from "./node_modules/three/examples/jsm/loaders/OBJLoader.js";
import { Euler } from "./node_modules/three/src/math/Euler.js";

let scene, camera, renderer, spotLight;
let cameraMoveMouse = true;
let textSubmitted = false;
let shapes = [];
let tone_ids = ["anger", "fear", "joy", "sadness", "analytical", "confident", "tentative"]
let animating = true;

const moveCamera = (xChange, yChange) => {
  const minPolarAngle = 0;
  const maxPolarAngle = Math.PI;
  let euler = new Euler(0, 0, 0, 'YXZ');

  const PI_2 = Math.PI / 2;
  euler.setFromQuaternion(camera.quaternion);

  euler.y -= xChange * 0.002;
  euler.x -= yChange * 0.002;

  euler.x = Math.max(PI_2 - maxPolarAngle, Math.min(PI_2 - minPolarAngle, euler.x));

  camera.quaternion.setFromEuler(euler);

  // Elegant solution to calculating position from angle
  // https://stackoverflow.com/questions/14813902/three-js-get-the-direction-in-which-the-camera-is-looking

  const vector = new THREE.Vector3(0, 0, -1);
  vector.applyQuaternion(camera.quaternion);
  spotLight.target.position.set(vector.x, vector.y, vector.z);

  render();
}

const main = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

  renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;

  camera.position.set(0, 0, 0);

  // init ambient light above scene
  const ambient = new THREE.AmbientLight(0xffffff, 0.05);
  scene.add(ambient);
  const point = new THREE.PointLight(0xfffff, 0.1); // white right now orange is 0xea9d0d
  point.castShadow = true;
  point.position.set(0, 20, 0); // Have shining down from above
  scene.add(point);

  // init spotlight following camera
  spotLight = new THREE.SpotLight(0xffffff, 0.6);
  spotLight.position.set(0, 0, 0);
  spotLight.angle = Math.PI / 30;
  spotLight.penumbra = 0.1;
  spotLight.distance = 200;
  scene.add(spotLight);
  spotLight.target.position.set(0, 0, -10);
  scene.add(spotLight.target);

  // Background
  {
    const loader = new THREE.TextureLoader();
    Promise.all(
      [loader.load('./public/seamlessSpaceMap/left.png'),
      loader.load('./public/seamlessSpaceMap/right.png'),
      loader.load('./public/seamlessSpaceMap/front.png'),
      loader.load('./public/seamlessSpaceMap/back.png'),
      loader.load('./public/seamlessSpaceMap/top.png'),
      loader.load('./public/seamlessSpaceMap/bottom.png')], (resolve, reject) => {
        resolve(texture);
      }).then(result => {
        // Solid Background for shadow casting
        const maxDistance = 50;
        const floorSize = 100;
        const floorGeo = new THREE.PlaneBufferGeometry(floorSize, floorSize);
        const floorMat = new THREE.MeshPhongMaterial();
        floorMat.map = result[5];
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMat.map = result[4];
        const topMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMat.map = result[1];
        const wallMeshRight = new THREE.Mesh(floorGeo, floorMat);
        floorMat.map = result[0];
        const wallMeshLeft = new THREE.Mesh(floorGeo, floorMat);
        floorMat.map = result[2];
        const wallMeshFront = new THREE.Mesh(floorGeo, floorMat);
        floorMat.map = result[3];
        const wallMeshBack = new THREE.Mesh(floorGeo, floorMat);

        wallMeshRight.position.x = maxDistance;
        wallMeshRight.rotation.y = Math.PI * -.5;
        wallMeshRight.receiveShadow = true;
        wallMeshLeft.position.x = -maxDistance;
        wallMeshLeft.rotation.y = Math.PI * .5;
        wallMeshLeft.receiveShadow = true;
        wallMeshFront.position.z = -30;
        wallMeshFront.rotation.y = 0;
        wallMeshFront.receiveShadow = true;
        wallMeshBack.position.z = maxDistance;
        wallMeshBack.rotation.y = -Math.PI;
        wallMeshBack.receiveShadow = true;
        floorMesh.receiveShadow = true;
        floorMesh.rotation.x = Math.PI * -.5;
        floorMesh.position.y = -maxDistance;
        topMesh.rotation.x = Math.PI * .5;
        topMesh.position.y = maxDistance;

        scene.add(floorMesh);
        scene.add(topMesh);
        scene.add(wallMeshBack);
        scene.add(wallMeshRight);
        scene.add(wallMeshLeft);
      });

    // add space texture
    const cubeLoader = new THREE.CubeTextureLoader();
    const texture = cubeLoader.load([
      './public/seamlessSpaceMap/left.png',
      './public/seamlessSpaceMap/right.png',
      './public/seamlessSpaceMap/front.png',
      './public/seamlessSpaceMap/back.png',
      './public/seamlessSpaceMap/top.png',
      './public/seamlessSpaceMap/bottom.png'
    ]);

    scene.background = texture;
  }

  window.addEventListener('keypress', e => {
    // If the user has pressed enter within the textarea for the first time
    if (e.target.id === "textArea" && e.key === "Enter" && !textSubmitted) {
      onFormSubmit();
    }
  })

  window.addEventListener('resize', onWindowResize, false);

  animate();
  render();
}

async function onFormSubmit() {
  textSubmitted = true;
  let canvas = document.getElementById("canvas");
  let input = document.getElementById("input");
  let inputTitle = document.getElementById("inputTitle");
  let textarea = document.getElementById("textArea");
  let controls = document.getElementById("controls");
  canvas.style["opacity"] = 1;
  controls.style["opacity"] = 0.5;
  inputTitle.style["opacity"] = 0;
  input.style["opacity"] = 0.1;
  input.style["user-select"] = "none";
  input.style["-moz-user-select"] = "none";
  input.style["-khtml-user-select"] = "none";
  input.style["-webkit-user-select"] = "none";
  input.style["-o-user-select"] = "none";
  let inputText = textarea.value;
  textarea.setAttribute("disabled", "true");

  // Bind motion when text is entered
  document.addEventListener(
    'keydown',
    moveCameraKeyboard,
    false
  )

  document.addEventListener(
    'mousemove',
    moveCameraMouse,
    false
  )

  document.addEventListener(
    'click',
    (event) => {
      const mouse3D = new THREE.Vector3(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
        0.5);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse3D, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        console.log(intersects[0])
        if (intersects[0].object.emotion || intersects[0].object.parent.emotion) {
          intersects[0].object.rotateX(1.2);
          let emotionBox = document.getElementById("emotion");
          if (intersects[0].object.emotion) {
            emotionBox.innerHTML = `<h3>This shape was created because you were feeling ${intersects[0].object.emotion}.</h3>
          <h3>Your statements gave this emotion a strength of ${intersects[0].object.power} out of 1.</h3>`;
          } else if (intersects[0].object.parent.emotion) {
            emotionBox.innerHTML = `<h3>This shape was created because you were feeling ${intersects[0].object.parent.emotion}.</h3>
          <h3>Your statements gave this emotion a strength of ${intersects[0].object.parent.power} out of 1.</h3>`
          }
        }
      }
    },
    false
  );

  // Get response
  const jsonResponse = await apiCall(inputText);
  console.info(jsonResponse);

  // Convert to rendered shapes
  const shapeJSON = apiToShape(jsonResponse);
  createObjects(shapeJSON);
}

function apiToShape(jsonResponse) {
  let shapesDict = {};
  let shapeJSON = []
  let toneArr = jsonResponse.document_tone["tones"];
  // sphere, cylinder, and cone for bumpmaps, none for objs
  // sphere/cylinder, cube/diamond, cone, torus
  let shapeNames = ["CUBE", "DIAMOND", "SPHERE", "CYLINDER", "CONE", "TORUS", "SPIRAL", "VORONOI", "CURVES"];
  const RED = 0xCC0000;
  const BLUE = 0x3D85C6;
  const PURPLE = 0x674EA7;
  const PINK = 0xC27BA0;
  const GREEN = 0x6AA84F;
  const ORANGE = 0xE69138;
  const YELLOW = 0xFFD966;

  for (let i = 0; i < toneArr.length; i++) {
    switch (toneArr[i].tone_id) {
      case tone_ids[0]:
        shapesDict.emotion = tone_ids[0];
        shapesDict.type = shapeNames[parseInt(Math.random() * 2)]; // can be cube[0] or diamond[1]
        shapesDict.color = RED;
        break;
      case tone_ids[1]:
        shapesDict.emotion = tone_ids[1];
        shapesDict.type = shapeNames[parseInt(Math.random() * 2 + 2)]; // can be sphere[2] or cylinder[3]
        shapesDict.color = BLUE;
        break;
      case tone_ids[2]:
        shapesDict.emotion = tone_ids[2];
        shapesDict.type = shapeNames[4];
        shapesDict.color = PURPLE;
        break;
      case tone_ids[3]:
        shapesDict.emotion = tone_ids[3];
        shapesDict.type = shapeNames[5];
        shapesDict.color = PINK;
        break;
      case tone_ids[4]:
        shapesDict.emotion = tone_ids[4];
        shapesDict.type = shapeNames[6];
        shapesDict.color = GREEN;
        break;
      case tone_ids[5]:
        shapesDict.emotion = tone_ids[5];
        shapesDict.type = shapeNames[7];
        shapesDict.color = ORANGE;
        break;
      case tone_ids[6]:
        shapesDict.emotion = tone_ids[6];
        shapesDict.type = shapeNames[8];
        shapesDict.color = YELLOW;
        break;
      default:
        break;
    }
    shapesDict.power = toneArr[i].score;
    if (shapesDict.type === shapeNames[2] || shapesDict.type === shapeNames[3] || shapesDict.type === shapeNames[4]) {
      if (shapesDict.power <= 0.5) {
        shapesDict.bumpMap = "bmap1"
      }
      else {
        shapesDict.bumpMap = "bmap2"
      }
      shapesDict.texture = "none"
    }
    else {
      if (shapesDict.power <= 0.5) {
        shapesDict.texture = "texture1"
      }
      else {
        shapesDict.texture = "texture2"
      }
      shapesDict.bumpMap = "none"
    }
    //randomize 3-5 for base shapes and 0.03-0.05 for objs
    let size = toneArr[i].score;
    if (shapesDict.type === "SPIRAL") {
      size *= 0.03;
    }
    else if (shapesDict.type === "VORONOI") {
      size *= 0.04;
    }
    else if (shapesDict.type === "CURVES") {
      size *= 0.05
    }
    else {
      size *= (Math.random() * 3 + 3);
    }
    shapesDict.scale = { x: size, y: size, z: size };
    for (let j = 0.0; j <= 1.0; j += 0.1) {
      if (toneArr[i].score >= j) {
        shapeJSON.push(JSON.parse(JSON.stringify(shapesDict)));
      }
    }
  }
  console.info(shapeJSON)
  return shapeJSON
}

// Possible response emotions are Anger, Fear, Joy, Sadness, Confident, Tentative, Analytical
// https://tone-analyzer-demo.ng.bluemix.net
// https://cloud.ibm.com/docs/tone-analyzer?topic=tone-analyzer-overviewDevelopers
async function apiCall(inputText) {
  let credentials = "apikey:qB92x6pn98MGaei5j9TLmUhdCjmmU5eITHzJMbS2gKFM"
  let url = "https://api.us-south.tone-analyzer.watson.cloud.ibm.com/instances/5942acc2-d420-4bfc-96b0-5684b5ae65d1/v3/tone?version=2017-09-21&text=" + inputText;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
      'Authorization': 'Basic ' + btoa(credentials),
    }
  });

  return response.json();
}

// Return 3js objects created from JSON shape list
function createObjects(shapesList) {
  // Preload all textures to avoid repeat loads
  const bmap1 = new THREE.TextureLoader().load(
    './public/bumpMaps/cobbleBump.jpg');
  const bmap2 = new THREE.TextureLoader().load(
    './public/bumpMaps/gritBump.jpg');
  const texture1 = new THREE.TextureLoader().load(
    './public/textures/abstract1.png')
  const texture2 = new THREE.TextureLoader().load(
    './public/textures/abstract2.jpg')
  let loader = new OBJLoader();;

  shapesList.forEach(shape => {
    // Handle object files first
    function handleObj(object) {
      // Set scale, position, and color
      object.scale.set(shape.scale.x, shape.scale.y, shape.scale.z);
      object.position.set(Math.round(Math.random() * 40) - 20, // X between -20 and 20
        Math.round(Math.random() * 40) - 20, // Y between -20 and 20
        Math.round(Math.random() * 20) - 40  // Z between -40 and -20)
      )
      object.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.material.color.set(shape.color);
        }
      });

      object.castShadow = true;
      object.receiveShadow = true;

      // Assign additional properties for animation and selection
      object.power = shape.power;
      object.emotion = shape.emotion;
      object.orbitDistance = Math.round(Math.random() * 20) + 20; // At least 20 but no more than 40 away

      shapes.push(object)
      scene.add(object)
    }

    switch (shape.type) {
      case "SPIRAL":
        loader.load('./public/obj/15736_Spiral_Twist_v1_NEW.obj', handleObj);
        return;
      case "VORONOI":
        loader.load('./public/obj/Compressed_voronoi_sphere.obj', handleObj);
        return;
      case "CURVES":
        loader.load('./public/obj/Compressed_curves.obj', handleObj);
        return;
    };

    // If it was not an object file, generate new object
    let geometry;
    switch (shape.type) {
      case "CUBE":
        geometry = new THREE.BoxGeometry(shape.scale.x,
          shape.scale.y, shape.scale.z, 4, 4, 4);
        break;
      case "CONE":
        geometry = new THREE.ConeGeometry(shape.scale.x / 2,
          shape.scale.y, 16, 4);
        break;
      case "CYLINDER":
        geometry = new THREE.CylinderGeometry(shape.scale.x / 2,
          shape.scale.x / 2, shape.scale.y, 16, 4);
        break;
      case "SPHERE":
        geometry = new THREE.SphereGeometry(shape.scale.x / 2, 32, 32);
        break;
      case "DIAMOND":
        geometry = new THREE.SphereGeometry(shape.scale.x / 2, 4, 2);
        break;
      case "TORUS":
        geometry = new THREE.TorusGeometry(shape.scale.x / 2,
          shape.scale.y / 2, 8, 50);
        break;
    }

    // Set random position
    geometry.translate(
      Math.round(Math.random() * 40) - 20, // X between -20 and 20
      Math.round(Math.random() * 40) - 20, // Y between -20 and 20
      Math.round(Math.random() * -20) - 10  // Z between -30 and -10)
    )

    // Set bump map and texture maps as necessary
    let objectBumpMap = null;
    switch (shape.bumpMap) {
      case "none":
        break;
      case "bmap1":
        objectBumpMap = bmap1;
        break;
      case "bmap2":
        objectBumpMap = bmap2;
        break;
    }

    let objectMap = null;
    switch (shape.texture) {
      case "none":
        break;
      case "texture1":
        objectMap = texture1;
        break;
      case "texture2":
        objectMap = texture2;
        break;
    }

    const material = new THREE.MeshPhongMaterial({
      color: shape.color,
      map: objectMap,
      bumpMap: objectBumpMap
    });

    // Create 3js object
    let object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
    object.receiveShadow = true;
    object.power = shape.power;
    object.emotion = shape.emotion;
    object.orbitDistance = Math.round(Math.random() * 20) + 10; // At least 10 but no more than 30 away

    shapes.push(object)
    scene.add(object)
  })
  animate();
}

let last = Date.now();
const fpsInterval = 1000 / 30; // 30 fps

const animate = () => {
  let time = Date.now();
  const elapsed = time - last;

  // if enough time has elapsed, draw the next frame
  if (elapsed > fpsInterval) {
    last = time;
    time *= 0.0002;

    shapes.forEach(shape => {
      shape.position.x = shape.orbitDistance * Math.sin(
        time + shape.orbitDistance); // space orbits based on distance
      shape.position.z = shape.orbitDistance * Math.cos(
        time + shape.orbitDistance);
    });

    render();
  }

  if (animating) {
    requestAnimationFrame(animate);
  }
}

const render = () => {
  renderer.render(scene, camera);
}

const moveCameraKeyboard = (event, direction) => {
  let defaultCamera = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  }
  const step = 50;
  switch (event.key) {
    case ("w"): // tilt up
      moveCamera(0, -step);
      break;
    case ("d"): // tilt right
      moveCamera(step, 0);
      break;
    case ("s"): // tilt down
      moveCamera(0, step);
      break;
    case ("a"): // tild left
      moveCamera(-step, 0);
      break;

    case ("q"): // rotate clockwise
      camera.rotation.z -= step / 500;
      break;
    case ("e"): // rotate counter-clockwise
      camera.rotation.z += step / 500;
      break;

    case (" "): // reset camera
      camera.rotation.x = defaultCamera.rotation.x;
      camera.rotation.y = defaultCamera.rotation.y;
      camera.rotation.z = defaultCamera.rotation.z;
      break;
    case ("p"): // pause animation
      animating = !animating;
      animate();
      cameraMoveMouse = !cameraMoveMouse;
    case ("Escape"): // freeze camera movement
      cameraMoveMouse = !cameraMoveMouse;
      break;
  }

  render();
}

const moveCameraMouse = (event) => {
  if (cameraMoveMouse) {
    moveCamera(event.movementX, event.movementY);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

main();
