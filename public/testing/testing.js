// Set up the canvas and get the canvas element
const canvas = document.querySelector('#canvas');

//Declaration of Variables
let player = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    velocity: 0,
    zoomed: false,
    crouching: false,
    movementSpeed: 0.1,
    sensitivity: 0.3,
    scoped_sensitivity: 0.15,
    boundingBox: new THREE.Box3(),
    last_shot: 0,
    score: 0,
    hitstreak: 1,
    lastKill: Date.now(),
};
// Enemy Health
let health = 3

//walls array
let walls = [];
//lights array
const lights = [];

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.add(camera)


// Set up a raycaster
const raycaster = new THREE.Raycaster();
// Set up the camera direction
const cameraDirection = new THREE.Vector3();

// Set up Pointer Lock controls
var controls = new THREE.PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

// Gun mesh and object loader
var mtlLoader = new THREE.MTLLoader();
var objLoader = new THREE.OBJLoader();
var weaponLeft = undefined;

// Sounds
var bang = new Audio('sounds/sniper.mp3');
var bonk = new Audio('sounds/bonk.mp3');
 
// bullet trail
const trailMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });

// points arr
const points = [];

// Bullets and trails arr
let bullets = [];
let trails = [];

// Smooth movement vars
let targetSmooth = false;
let targetSmoothNum = 0;

// Create some lighting
lights[0] = new THREE.PointLight(0xffffff, 0.5, 0);
lights[0].position.set(-8, 28, 8);
lights[1] = new THREE.PointLight(0xffffff, 0.5, 0);
lights[1].position.set(8, 28, 8);
lights[2] = new THREE.PointLight(0xffffff, 0.5, 0);
lights[2].position.set(0, -0.3, -0.6);
scene.add(lights[0]);
scene.add(lights[1]);
camera.add(lights[2]);


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
const targetBodyGeometry = new THREE.CapsuleGeometry(0.25, 0.375, 32, 32);
const targetBodyMaterial = new THREE.MeshBasicMaterial({ color: 0xF0F000 });
const targetBody = new THREE.Mesh(targetBodyGeometry, targetBodyMaterial);
targetBody.position.y = 1.36;
// create a capsule as the target's Legs
const targetLegGeometry = new THREE.CapsuleGeometry(0.1, 0.5, 32, 32);
const targetLegMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
const targetLegLeft = new THREE.Mesh(targetLegGeometry, targetLegMaterial);
targetLegLeft.position.y = 0.75;
const targetLegRight = new THREE.Mesh(targetLegGeometry, targetLegMaterial);
targetLegRight.position.y = 0.75;

//Create a floor
const planeGeometry = new THREE.BoxGeometry(20, 20, 0.1, 1, 1);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x156289, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true });
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = Math.PI / 2;

camera.position.z = 8;
camera.position.y = 2;
camera.lookAt(targetHead.position);
scene.background = 0x444444;

// Create a front wall using the plane geometry and material
const frontWall = new THREE.Mesh(planeGeometry, planeMaterial);
frontWall.position.set(0, 10, -10);
let frontWallBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
frontWallBB.setFromObject(frontWall);

// Create a right wall using the plane geometry and material
const rightWall = new THREE.Mesh(planeGeometry, planeMaterial);
rightWall.position.set(10, 10, 0);
rightWall.rotation.y = Math.PI / 2;
let rightWallBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
rightWallBB.setFromObject(frontWall);

// Create a left wall using the plane geometry and material
const leftWall = new THREE.Mesh(planeGeometry, planeMaterial);
leftWall.position.set(-10, 10, 0);
leftWall.rotation.y = Math.PI / 2;
let leftWallBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
leftWallBB.setFromObject(frontWall);

// Create a back wall using the plane geometry and material
const backWall = new THREE.Mesh(planeGeometry, planeMaterial);
backWall.position.set(0, 10, 10);
let backWallBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
backWallBB.setFromObject(frontWall);

// Create a roof using the plane geometry and material
const roof = new THREE.Mesh(planeGeometry, planeMaterial);
roof.position.set(0, 20, 0);
roof.rotation.x = Math.PI / 2;
let roofBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
roofBB.setFromObject(frontWall);

const smallWallGeometry = new THREE.BoxGeometry(20, 1.5, 1);
const smallWall = new THREE.Mesh(smallWallGeometry, planeMaterial);
smallWall.position.set(0, 0.75, 7)
scene.add(smallWall);
let smallWallBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
smallWallBB.setFromObject(frontWall);

walls = [frontWall, leftWall, rightWall, backWall, smallWall, roof]


// Add everything to the scene

scene.add(camera);
scene.add(floor);
scene.add(frontWall);
scene.add(rightWall);
scene.add(leftWall);
scene.add(backWall)
scene.add(smallWall)
scene.add(roof)
scene.add(targetBody);
scene.add(targetHead);
scene.add(targetLegLeft);
scene.add(targetLegRight);


// Request pointer lock on mousedown
canvas.addEventListener('mousedown', function () {
    canvas.requestPointerLock();
});

document.addEventListener('exitpointerlock', function () {
    // Reset the camera or display a message here
    console.log("Pointer Lock Failed to Exit")
});

// Create a crosshair geometry
const crosshairGeometry = new THREE.SphereGeometry(0.0025, 32, 32);
const crosshairMaterial = new THREE.MeshBasicMaterial({ color: 0x00cc00 });
const crosshair = new THREE.Mesh(crosshairGeometry, crosshairMaterial);

// Position the crosshair in the center of the screen
crosshair.position.set(0, 0, -0.5);
camera.add(crosshair);

// Create a gun geometry
mtlLoader.load("Models/sniperCamo.mtl", function (materials) {
    materials.preload();
    objLoader.setMaterials(materials);
    objLoader.load("./Models/sniperCamo.obj", function (object) {
        weaponLeft = object;
        weaponLeft.rotation.y = Math.PI;
        weaponLeft.scale.set(3.5, 3.5, 3.5)
        weaponLeft.position.set(0.25, -0.3, -0.5);
        camera.add(weaponLeft);
    });
});


// Update the position of the crosshair on each frame
function updateCrosshairSize() {
    // Set the camera direction based on the camera rotation

    // Set the crosshair position to be a fixed distance away from the camera
    if (!player.zoomed) {
        // Set the crosshair position to be 0.5 units away from the camera
        crosshair.position.z = -0.5;
    }
    if (player.zoomed) {
        // Set the crosshair position to be -1.25 units away from the camera
        crosshair.position.z = -1.25;
    }
}

// Check if the crosshair is intersecting the target on each mouse click (shooting) and zoom on right click
document.addEventListener('mousedown', function (click) {
    switch (click.button) {
        case 2:
            if (!player.zoomed) {
                camera.zoom = 2.5;
                player.zoomed = true;
                camera.updateProjectionMatrix();
                controls.pointerSpeed = player.scoped_sensitivity;
            } else {
                camera.zoom = 1;
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
            const Hit = raycaster.intersectObjects([targetHead, targetBody, targetLegLeft, targetLegRight, floor, smallWall, leftWall, rightWall, frontWall, backWall, roof]);

            let bulletColor = 0xffffff
            hitNumber = 0
            // If the crosshair is intersecting the target, remove the target from the scene
            if (Hit[0].object == floor ||
                Hit[0].object == smallWall ||
                Hit[0].object == leftWall ||
                Hit[0].object == rightWall ||
                Hit[0].object == frontWall ||
                Hit[0].object == backWall ||
                Hit[0].object == roof) {
                bonk.load();
                bonk.play();
                bang.load();
                bang.play();
                player.hitstreak = 0;
                player.score -= 20;
            }
            else if (Hit[0].object == targetHead) {
                health -= 3;
                bang.load();
                bang.play();
                bulletColor = 0xff0000
                hitNumber += 1
            }
            else if (Hit[0].object == targetBody) {
                health -= 1;
                bang.load();
                bang.play();
                bulletColor = 0xffff00
                hitNumber += 1
            }
            else if (Hit[0].object == targetLegLeft || Hit[0].object == targetLegRight) {
                console.log("Leg")
                health -= 0.75;
                bang.load();
                bang.play();
                bulletColor = 0x00ff00
                hitNumber += 1
            }

            if ((Hit[1].object == targetBody && Hit[0].object == targetHead) || (Hit[0].object == targetBody && Hit[1].object == targetHead) || (Hit[0].object == targetBody && Hit[1].object == targetLegLeft) || (Hit[0].object == targetBody && Hit[1].object == targetLegRight) || (Hit[0].object == targetBody && Hit[1].object == targetHead) || (Hit[0].object == targetLegLeft && Hit[1].object == targetBody) || (Hit[0].object == targetLegRight && Hit[1].object == targetBody)) {
                hitNumber += 1
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

                if (player.score + 100 > player.score + (player.hitstreak * 0.37623) * 100 - ((Date.now() - player.lastKill) / 70)) {
                    player.score += 100;
                } else {
                    player.score += (player.hitstreak * 0.37623) * 100 - ((Date.now() - player.lastKill) / 70)
                }
                player.lastKill = Date.now();
                console.log("Score: " + player.score)
            }
            player.last_shot = Date.now();

            var bullet = new THREE.Mesh(new THREE.SphereGeometry(0.05, 32, 32), new THREE.MeshBasicMaterial({ color: bulletColor }));

            bullet.alive = true;
            bullet.velocity = cameraDirection;
            bullet.position.set(Hit[hitNumber].point.x, Hit[hitNumber].point.y, Hit[hitNumber].point.z)
            scene.add(bullet);
            bullets.push(bullet);

            points.push(new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z));
            points.push(new THREE.Vector3(Hit[hitNumber].point.x, Hit[hitNumber].point.y, Hit[hitNumber].point.z));
            const trailMaterial = new THREE.LineBasicMaterial({ color: bulletColor });
            const trailGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const trail = new THREE.Line(trailGeometry, trailMaterial);
            scene.add(trail);
            setTimeout(function () {
                bullet.alive = false;
                scene.remove(bullet);
            }, 5000);
            setTimeout(function () {
                trail.alive = false;
                scene.remove(trail);
            }, 1000)

            break;
        default:
            console.log(`Unknown button code: ${e.button}`);
    }
});

// function updateBulletPositions() {
//     for (var i = 0; i < bullets.length; i += 1) {
//         if (bullets[i] === undefined) continue;
//         if (bullets[i].alive == false) {
//             bullets.splice(i, 1)
//             continue;
//         }
//         bullets[i].position.y -= 0.01;
//         bullets[i].position.add(new THREE.Vector3(bullets[i].velocity.x*1.5, bullets[i].velocity.y*1.5, bullets[i].velocity.z*1.5))
//     }
// }
function updateTrailVisiblity() {
    for (var i = 0; i < trails.length; i += 1) {
        if (trails[i] === undefined) continue;
        if (trails[i].alive == false) {
            trails.splice(i, 1)
            scene.remove(trails[i])
            continue;
        }
    }
}

document.addEventListener('keydown', function (event) {
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

document.addEventListener('keyup', function (event) {
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


function moveTarget() {

    if (targetSmooth) {
        targetHead.position.x += Math.random() * 0.0625;
        targetBody.position.x = targetHead.position.x;
        targetBody.position.z = targetHead.position.z;
        targetLegLeft.position.x = targetHead.position.x-0.15;
        targetLegLeft.position.z = targetHead.position.z;
        targetLegRight.position.x = targetHead.position.x+0.15;
        targetLegRight.position.z = targetHead.position.z;
        if (targetSmoothNum != 60) {
            targetSmoothNum++;
        } else {
            targetSmooth = false;
            targetSmoothNum = 0;
        }
    } else {
        targetHead.position.x -= Math.random() * 0.0625;
        targetBody.position.x = targetHead.position.x;
        targetBody.position.z = targetHead.position.z;
        targetLegLeft.position.x = targetHead.position.x-0.15;
        targetLegLeft.position.z = targetHead.position.z;
        targetLegRight.position.x = targetHead.position.x+0.15;
        targetLegRight.position.z = targetHead.position.z;
        if (targetSmoothNum != 60) {
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
    updateTrailVisiblity();
    renderer.setClearColor(0x808080);
    renderer.render(scene, camera);
}


//setting sens
controls.pointerSpeed = player.sensitivity;

//init
animate();