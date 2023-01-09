// Set up the canvas and get the canvas element
const canvas = document.querySelector('#canvas');


let player = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    velocity: 0,
    zoomed: false,
    crouching: false,
    movementSpeed: 0.1,
    sensitivity : 0.3,
    scoped_sensitivity: 0.15,
    boundingBox: new THREE.Box3(),
    last_shot : 0,
    score: 0,
    hitstreak: 0,
    lastKill: Date.now(),
};

let walls = [];

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
const targetGeometry = new THREE.SphereGeometry(0.20, 32, 32);
const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
const targetHead = new THREE.Mesh(targetGeometry, targetMaterial);
targetHead.position.y = 1.875;

// create a capsule as the target's body
const targetBodyGeometry = new THREE.CapsuleGeometry(0.25, 0.875, 32, 32);
const targetBodyMaterial = new THREE.MeshBasicMaterial({ color: 0xF0F000 });
const targetBody = new THREE.Mesh(targetBodyGeometry, targetBodyMaterial);
targetBody.position.y = 1.125;

let health = 3

//Create a floor
const planeGeometry = new THREE.PlaneGeometry(20, 20, 1, 1);
const floorGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
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

const smallWallGeometry = new THREE.BoxGeometry(20, 1.5, 1);
const smallWall = new THREE.Mesh(smallWallGeometry, planeMaterial);
smallWall.position.set(0, 0.75, 7)
scene.add(smallWall);


walls = [frontWall, leftWall, rightWall, backWall, smallWall, roof]


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

// Create a crosshair geometry
const crosshairGeometry = new THREE.SphereGeometry(0.0025, 32,32);
const crosshairMaterial = new THREE.MeshBasicMaterial({ color: 0x00cc00 });
const crosshair = new THREE.Mesh(crosshairGeometry, crosshairMaterial);

// Position the crosshair in the center of the screen
crosshair.position.set(0, 0, -0.5);
camera.add(crosshair);

// Create a gun geometry

var mtlLoader = new THREE.MTLLoader();

var weaponLeft = undefined;
var bullet = undefined;
mtlLoader.load("Models/sniperCamo.mtl", function(materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.load("Models/sniperCamo.obj", function(object) {
        weaponLeft = object;
        weaponLeft.rotation.y = Math.PI;
        weaponLeft.scale.set(3.5, 3.5, 3.5)
        weaponLeft.position.set(0.3, -0.3, -0.7);
        camera.add(weaponLeft);
    });
});

mtlLoader.load("Models/ammo_sniper.mtl", function(materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);  
    objLoader.load("Models/ammo_sniper.obj", function(object) {
        bullet = object;
        bullet.rotation.set(-Math.PI/2, 0, 0);
        bullet.scale.set(3.5, 3.5, 3.5)
        bullet.position.set(-0.3, -0.3, -0.75);
        camera.add(bullet);
    });
});

// Update the position of the crosshair on each frame
function updateCrosshairSize() {
    // Set the camera direction based on the camera rotation
  
    // Set the crosshair position to be a fixed distance away from the camera
    if (!player.zoomed){
         // Set the crosshair position to be 0.5 units away from the camera
        crosshair.position.z = -0.5;
    }
    if (player.zoomed){
        // Set the crosshair position to be -1.25 units away from the camera
       crosshair.position.z = -1.25;
   }
}
var bang = new Audio('sounds/sniper.mp3');
var bonk = new Audio('sounds/bonk.mp3');

// Check if the crosshair is intersecting the target on each mouse click (shooting) and zoom on right click
document.addEventListener('mousedown', function(click) {
    switch (click.button) {
        case 2:
            if (!player.zoomed) {
                camera.zoom = 2.5;
                weaponLeft.position.x = 0;
                player.zoomed = true;
                camera.updateProjectionMatrix();
                controls.pointerSpeed = player.scoped_sensitivity;
            } else {
                camera.zoom = 1;
                weaponLeft.position.x = 0.3;
                player.zoomed = false;
                camera.updateProjectionMatrix();
                controls.pointerSpeed = player.sensitivity;
            }
            break;
        case 0:
            if (Date.now() - 150 < player.last_shot) {
                break;
            }

            // Set the camera direction based on the camera rotation
            camera.getWorldDirection(cameraDirection);

            // Set the raycaster origin and direction based on the camera position and direction
            raycaster.set(camera.position, cameraDirection);

            // Cast a ray from the camera and get the intersecting objects
            const Hit = raycaster.intersectObjects([targetHead, targetBody, floor, smallWall, leftWall, rightWall, frontWall, backWall, roof]);

            // If the crosshair is intersecting the target, remove the target from the scene
            if (Hit[0].object == floor || 
                    Hit[0].object == smallWall || 
                    Hit[0].object == leftWall || 
                    Hit[0].object == rightWall || 
                    Hit[0].object == frontWall || 
                    Hit[0].object == backWall || 
                    Hit[0].object == roof) {
                console.log("wall");
                bonk.load();
                bonk.play();   
                player.hitstreak = 0;
                player.score -= 20;
            }
            else if (Hit[0].object == targetHead) {
                health -= 3;
                bang.load();
                bang.play();    
            }
            else if (Hit[0].object == targetBody) {
                health -= 1;
                bang.load();
                bang.play();   
            }


            if (health <= 0) {
                player.hitstreak++; 
                scene.remove(targetHead);
                scene.remove(targetBody);
                targetHead.position.x = Math.random() * 6 - 3;
                targetHead.position.z = Math.random() * 6 - 5;
                targetBody.position.x = targetHead.position.x;
                targetBody.position.z = targetHead.position.z;
                scene.add(targetHead);
                scene.add(targetBody);
                health = 3;

                if (player.score > player.score + (player.hitstreak * 0.37623) * 100 - ((Date.now() - player.lastKill)/70)){
                    player.score += 100;
                } else {
                    player.score += (player.hitstreak * 0.37623) * 100 - ((Date.now() - player.lastKill)/70)
                }
                player.lastKill = Date.now();
                console.log("Score: " + player.score)
            }
            player.last_shot = Date.now();
            break;
        default:
            console.log(`Unknown button code: ${e.button}`);
    }
});

document.addEventListener('keydown', function(event) {
    switch (event.key) {
        case "w":
        case "W":
            player.forward = true
            break;
        case "a":
        case "A":
            player.left = true
            break;
        case "s":
        case "S":
            player.backward = true
            break;
        case "d":
        case "D":
            player.right = true
            break;
        case "Shift":
            camera.position.y -= 0.5;
            player.movementSpeed = 0.025;
            player.crouching = true;
            break;
        case " ":
            if ((!player.crouching && camera.position.y == 2) || (player.crouching && camera.position.y == 1.5)) {
                player.velocity = 0.20;
                break;
            }
    }
});

document.addEventListener('keyup', function(event) {
    switch (event.key) {
        case "w":
        case "W":
            player.forward = false
            break;
        case "a":
        case "A":
            player.left = false
            break;
        case "s":
        case "S":
            player.backward = false
            break;
        case "d":
        case "D":
            player.right = false
            break;
        case "Shift":
            camera.position.y += 0.5;
            player.crouching = false;
            player.movementSpeed = 0.1;
            break;
    }
});

function movePlayer() {
    camera.getWorldDirection(cameraDirection);
    if (cameraDirection.z < 0) {
        if (player.forward) {
            camera.position.x -= Math.sin(camera.rotation.y) * player.movementSpeed;
            camera.position.z -= Math.cos(camera.rotation.y) * player.movementSpeed;
        }
        if (player.backward) {
            camera.position.x += Math.sin(camera.rotation.y) * player.movementSpeed;
            camera.position.z += Math.cos(camera.rotation.y) * player.movementSpeed;
        }
        if (player.right) {
            camera.position.x += player.movementSpeed * Math.sin(camera.rotation.y + Math.PI / 2);
            camera.position.z += player.movementSpeed * Math.cos(camera.rotation.y + Math.PI / 2);
        }
        if (player.left) {
            camera.position.x += player.movementSpeed * Math.sin(camera.rotation.y - Math.PI / 2);
            camera.position.z += player.movementSpeed * Math.cos(camera.rotation.y - Math.PI / 2);
        }
    }
    else {
        if (player.forward) {
            camera.position.x -= Math.sin(camera.rotation.y) * player.movementSpeed;
            camera.position.z += Math.cos(camera.rotation.y) * player.movementSpeed;
        }
        if (player.backward) {
            camera.position.x += Math.sin(camera.rotation.y) * player.movementSpeed;
            camera.position.z -= Math.cos(camera.rotation.y) * player.movementSpeed;
        }
        if (player.right) {
            camera.position.x -= player.movementSpeed * Math.sin(camera.rotation.y + Math.PI / 2);
            camera.position.z += player.movementSpeed * Math.cos(camera.rotation.y + Math.PI / 2);
        }
        if (player.left) {
            camera.position.x -= player.movementSpeed * Math.sin(camera.rotation.y - Math.PI / 2);
            camera.position.z += player.movementSpeed * Math.cos(camera.rotation.y - Math.PI / 2);
        }
    }
    camera.position.y += player.velocity;
    player.velocity -= 0.01;
    if (camera.position.y <= 2 && !player.crouching) {
        camera.position.y = 2;
        player.velocity = 0;
    }
    else if (camera.position.y <= 1.5) {
        camera.position.y = 1.5;
        player.velocity = 0;
    }
}

function updatePlayerWalls() {    
    // Check if the player has reached the front wall
    if (camera.position.z <= 7.8) {
        camera.position.z = 7.8;
    }
    
    // Check if the player has reached the right wall
    if (camera.position.x >= 9.8) {
        camera.position.x = 9.8
    }
    
    // Check if the player has reached the left wall
    if (camera.position.x <= -9.8) {
        camera.position.x = -9.8
    }
    
    // Check if the player has reached the back wall
    if (camera.position.z >= 9.8) {
        camera.position.z = 9.8
    }

}

let targetSmooth = false;
let targetSmoothNum = 0;

function moveTarget() {
    
    scene.remove(targetHead);
    scene.remove(targetBody);

    if(targetSmooth){
        targetHead.position.x += Math.random() * 0.0625;
        targetBody.position.x = targetHead.position.x;
        targetBody.position.z = targetHead.position.z;
        scene.add(targetHead)
        scene.add(targetBody)
        if(targetSmoothNum != 60){
            targetSmoothNum++;
        } else {
            targetSmooth = false;
            targetSmoothNum = 0;
        }
    } else {
        targetHead.position.x -= Math.random() * 0.0625;
        targetBody.position.x = targetHead.position.x;
        targetBody.position.z = targetHead.position.z;
        scene.add(targetHead)
        scene.add(targetBody)
        if(targetSmoothNum != 60){
            targetSmoothNum++;
        } else {
            targetSmooth = true;
            targetSmoothNum = 0;
        }
    }

    
}


// Animate the target by rotating it
function animate() {
    requestAnimationFrame(animate);
    moveTarget();
    movePlayer();
    updatePlayerWalls();
    updateCrosshairSize();
    renderer.setClearColor(0x808080);
    renderer.render(scene, camera);
}


//setting sens
controls.pointerSpeed = player.sensitivity; 

//init
animate();