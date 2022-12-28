// Set up the canvas and get the canvas element
const canvas = document.querySelector('#canvas');

let player = {
  forward: false,
  backward: false,
  left: false,
  right: false
};

document.addEventListener('keydown', function(event) {
    switch(event.key){
        case "w":
            player.forward = true
            break;
        case "a":
            player.left = true
            break;
        case "s":
            player.backward = true
            break;
        case "d":
            player.right = true
            break;
    }     
});

document.addEventListener('keyup', function(event) {
  switch(event.key){
      case "w":
          player.forward = false
          break;
      case "a":
          player.left = false
          break;
      case "s":
          player.backward = false
          break;
      case "d":
          player.right = false
          break;
  }     
});

// Create a scene
const scene = new THREE.Scene();

// Create some lighting
const lights = [];
lights[0] = new THREE.PointLight(0xffffff, 1, 0);
lights[0].position.set(0, 10, 8);
scene.add(lights[0]);


// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.add(camera)

// Create a renderer
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Create a sphere as the target's head
const targetGeometry = new THREE.SphereGeometry(0.25, 32, 32);
const targetMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
const targetHead = new THREE.Mesh(targetGeometry, targetMaterial);
targetHead.position.y = 1.5;


// create a capsule as the target's body
const targetBodyGeometry = new THREE.CapsuleGeometry(0.25, 0.5, 32, 32);
const targetBodyMaterial = new THREE.MeshPhongMaterial({ color: 0xF0F000 });
const targetBody = new THREE.Mesh(targetBodyGeometry, targetBodyMaterial);
targetBody.position.y = 1;

health = 3

//Create a floor
const planeGeometry = new THREE.PlaneGeometry(20, 20, 1, 1);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x156289, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true });
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = Math.PI / 2;

camera.position.z = 8;
camera.position.y = 2;
camera.lookAt(targetHead.position);

scene.add(targetBody);
scene.add(targetHead);
scene.add(camera);
scene.add(floor);
scene.background = 0x444444;


// Create a front wall using the plane geometry and material
const frontWall = new THREE.Mesh(planeGeometry, planeMaterial);
frontWall.position.set(0, 10, -10);

// Create a right wall using the plane geometry and material
const rightWall = new THREE.Mesh(planeGeometry, planeMaterial);
rightWall.position.set(10, 10, 0);
rightWall.rotation.y = Math.PI / 2;

// Create a left wall using the plane geometry and material
const leftWall = new THREE.Mesh(planeGeometry, planeMaterial);
leftWall.position.set(-10, 10, 0);
leftWall.rotation.y = Math.PI / 2;

// Create a back wall using the plane geometry and material
const backWall = new THREE.Mesh(planeGeometry, planeMaterial);
backWall.position.set(0, 10, 10);

// Create a roof using the plane geometry and material
const roof = new THREE.Mesh(planeGeometry, planeMaterial);
roof.position.set(0, 20, 0);
roof.rotation.x = Math.PI / 2;

const smallWall = new THREE.Mesh(planeGeometry, planeMaterial);
smallWall.position.set(0, -8.5, 7);

// Add the walls and roof to the scene
scene.add(frontWall);
scene.add(rightWall);
scene.add(leftWall);
scene.add(backWall)
scene.add(smallWall)
scene.add(roof)

// Set up a raycaster
const raycaster = new THREE.Raycaster();
// Set up the camera direction
const cameraDirection = new THREE.Vector3();

// Set up Pointer Lock controls
var controls = new THREE.PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

// Request pointer lock on mousedown
canvas.addEventListener('mousedown', function () {
  canvas.requestPointerLock();
});

document.addEventListener('exitpointerlock', function () {
  // Reset the camera or display a message here
  console.log("Pointer Lock Failed to Exit")
});


// Check if the crosshair is intersecting the target on each mouse click (shooting)
document.addEventListener('mousedown', function () {
  // Set the camera direction based on the camera rotation
  camera.getWorldDirection(cameraDirection);

  // Set the raycaster origin and direction based on the camera position and direction
  raycaster.set(camera.position, cameraDirection);

  // Cast a ray from the camera and get the intersecting objects
  const headHit = raycaster.intersectObjects([targetHead]);
  const bodyHit = raycaster.intersectObjects([targetBody]);

  // If the crosshair is intersecting the target, remove the target from the scene
  if (bodyHit.length > 0) {
    health -= 1
  }
  if (headHit.length > 0 || health <= 0) {
    scene.remove(targetHead);
    scene.remove(targetBody)
    targetHead.position.x = Math.random() * 6 - 3;
    targetHead.position.z = Math.random() * 6 - 5;
    targetBody.position.x = targetHead.position.x;
    targetBody.position.z = targetHead.position.z;
    scene.add(targetHead)
    scene.add(targetBody)
    health = 3
  }
});



document.addEventListener('keydown', function(event) {
  switch(event.key){
      case "w":
          player.forward = true
          break;
      case "a":
          player.left = true
          break;
      case "s":
          player.backward = true
          break;
      case "d":
          player.right = true
          break;
  }     
});

document.addEventListener('keyup', function(event) {
switch(event.key){
    case "w":
        player.forward = false
        break;
    case "a":
        player.left = false
        break;
    case "s":
        player.backward = false
        break;
    case "d":
        player.right = false
        break;
}     
});



function movePlayer() {
    camera.getWorldDirection(cameraDirection);
    if (cameraDirection.z < 0) {
        if (player.forward) {
            camera.position.x -= Math.sin(camera.rotation.y) * 0.25
            camera.position.z -= Math.cos(camera.rotation.y) * 0.25
        }
        if (player.backward) {
            camera.position.x += Math.sin(camera.rotation.y) * 0.25
            camera.position.z += Math.cos(camera.rotation.y) * 0.25
        }
        if (player.right) {
            camera.position.x += 0.25 * Math.sin(camera.rotation.y + Math.PI / 2)
            camera.position.z += 0.25 * Math.cos(camera.rotation.y + Math.PI / 2)
        }
        if (player.left) {
            camera.position.x += 0.25 * Math.sin(camera.rotation.y - Math.PI / 2)
            camera.position.z += 0.25 * Math.cos(camera.rotation.y - Math.PI / 2)
        }
    }
    else {
        if (player.forward) {
            camera.position.x -= Math.sin(camera.rotation.y) * 0.25
            camera.position.z += Math.cos(camera.rotation.y) * 0.25
        }
        if (player.backward) {
            camera.position.x += Math.sin(camera.rotation.y) * 0.25
            camera.position.z -= Math.cos(camera.rotation.y) * 0.25
        }
        if (player.right) {
            camera.position.x -= 0.25 * Math.sin(camera.rotation.y + Math.PI / 2)
            camera.position.z += 0.25 * Math.cos(camera.rotation.y + Math.PI / 2)
        }
        if (player.left) {
            camera.position.x -= 0.25 * Math.sin(camera.rotation.y - Math.PI / 2)
            camera.position.z += 0.25 * Math.cos(camera.rotation.y - Math.PI / 2)
        }
    }
}


// Animate the target by rotating it
function animate() {
  requestAnimationFrame(animate);
  movePlayer()
  renderer.setClearColor(0x808080);
  renderer.render(scene, camera);
}
animate();