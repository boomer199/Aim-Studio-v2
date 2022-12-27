// Set up the canvas and get the canvas element
const canvas = document.querySelector('#canvas');

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.add(camera)

// Create a renderer
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Create a sphere as the target object
const targetGeometry = new THREE.SphereGeometry(0.25, 32, 32);
const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000});
const target = new THREE.Mesh(targetGeometry, targetMaterial);

//Create a floor
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
// Rotate the floor so that it is flat on the ground
floor.rotation.x = -Math.PI / 2;
floor.position.y = -5;
floor.position.z = 5;

// Add the floor to the scene
camera.position.z = 10;
camera.lookAt(target.position);

scene.add(target);
scene.add(camera);
scene.add(floor);


// Create a wall geometry
const wallGeometry = new THREE.BoxGeometry(100, 100, 0.1);

// Create a material for the walls
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

// Create a left wall using the geometry and material
const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
leftWall.position.set(-5, 0, 0);

// Create a right wall using the geometry and material
const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
rightWall.position.set(5, 0, 0);

// Create a roof using the geometry and material
const roof = new THREE.Mesh(wallGeometry, wallMaterial);
roof.position.set(0, 5, 0);
roof.rotation.x = Math.PI / 2;

// Add the walls and roof to the scene
scene.add(leftWall);
scene.add(rightWall);
scene.add(roof);


// Create a crosshair geometry
const crosshairGeometry = new THREE.SphereGeometry(0.005, 32,32);
const crosshairMaterial = new THREE.MeshBasicMaterial({ color: 0x00cc00 });
const crosshair = new THREE.Mesh(crosshairGeometry, crosshairMaterial);

// Position the crosshair in the center of the screen
crosshair.position.set(0, 0, 4);
scene.add(crosshair);

// Set up a raycaster
const raycaster = new THREE.Raycaster();
// Set up the camera direction
const cameraDirection = new THREE.Vector3();


// Update the position of the crosshair on each frame
function updateCrosshairPosition() {
    // Set the camera direction based on the camera rotation
    camera.getWorldDirection(cameraDirection);
  
    // Set the crosshair position to be a fixed distance away from the camera
    crosshair.position.copy(camera.position).add(cameraDirection.multiplyScalar(1)); // Set the crosshair position to be 0.1 units away from the camera
  }
  

// Set up Pointer Lock controls
const controls = new THREE.PointerLockControls(camera);
scene.add(controls.getObject());

// Request pointer lock on mousedown
canvas.addEventListener('mousedown', function() {
  canvas.requestPointerLock();
});

document.addEventListener('exitpointerlock', function() {
    // Reset the camera or display a message here
    console.log("Pointer Lock Failed to Exit")
  });
  

// Set up mouse movement listeners
document.addEventListener('mousemove', function(event) {
    // Update the camera rotation based on mouse movement
    camera.rotation.y -= event.movementX * 0.001; // Movement along the y axis
  
    // Limit the camera rotation along the x axis to a certain range
    const minRotationX = -Math.PI / 2 + 0.01; // -90 degrees + a small offset
    const maxRotationX = Math.PI / 2 - 0.01; // 90 degrees - a small offset
    camera.rotation.x = THREE.Math.clamp(
      camera.rotation.x - event.movementY * 0.001, // Movement along the x axis
      minRotationX,
      maxRotationX
    );
  });



  // Check if the crosshair is intersecting the target on each mouse click (shooting)
document.addEventListener('mousedown', function() {
    // Set the camera direction based on the camera rotation
    camera.getWorldDirection(cameraDirection);
  
    // Set the raycaster origin and direction based on the camera position and direction
    raycaster.set(camera.position, cameraDirection);
  
    // Cast a ray from the camera and get the intersecting objects
    const intersects = raycaster.intersectObjects([target]);
  
    // If the crosshair is intersecting the target, remove the target from the scene
    if (intersects.length > 0) {
      scene.remove(target);
      target.position.x = Math.random() * 6 - 3;
      target.position.y = Math.random() * 6 - 3;
      scene.add(target)
    }
  });
  
  

// Animate the target by rotating it
function animate() {
  requestAnimationFrame(animate);
  updateCrosshairPosition();
  target.rotation.y += 0.01;
  renderer.setClearColor(0x808080);
  renderer.render(scene, camera);
}

animate();
