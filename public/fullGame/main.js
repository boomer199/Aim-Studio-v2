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
    sensitivity: 0.3,
    scoped_sensitivity: 0.15,
    boundingBox: new THREE.Box3(),
    last_shot: 0,
    score: 0,
    hitstreak: 1,
    lastKill: Date.now(),
    firstShot: true,
};

var bang = new Audio('sounds/sniper.mp3');
var bonk = new Audio('sounds/bonk.mp3');

let walls = [];

// Create a scene
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.add(camera)

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap

//Create a floor
const planeGeometry = new THREE.BoxGeometry(200, 200, 1, 1, 1);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true });
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = Math.PI / 2;

//Create light
const lights = [];
lights[0] = new THREE.PointLight(0xffffff, 1, 0);
lights[0].position.set(0, 100, 0);
lights[1] = new THREE.PointLight(0xffffff, 0.5, 0);
lights[1].position.set(200, 100, 200);
lights[2] = new THREE.PointLight(0xffffff, 0.5, 0);
lights[2].position.set(-200, 100, -200);
lights[3] = new THREE.PointLight(0xffffff, 0.5, 0);
lights[3].position.set(-200, 100, -200);
lights[4] = new THREE.PointLight(0xffffff, 0.5, 0);
lights[4].position.set(-200, 100, 200);

for(let i = 0; i < lights.length; i++){
    scene.add(lights[i]);
}


scene.add(camera);
scene.add(floor);
scene.background = 0x444444;

let bullets = [];
let trails = [];

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
const crosshairGeometry = new THREE.SphereGeometry(0.0025, 32, 32);
const crosshairMaterial = new THREE.MeshBasicMaterial({ color: 0x00cc00 });
const crosshair = new THREE.Mesh(crosshairGeometry, crosshairMaterial);

// Position the crosshair in the center of the screen
crosshair.position.set(0, 0, -0.5);
camera.add(crosshair);

// Create a gun geometry
var mtlLoader = new THREE.MTLLoader();
var objLoader = new THREE.OBJLoader();

var weaponLeft = undefined;

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
        // Set the crosshair position to be -1.25 units away from the camera because zoomed is 2.5x zoom
        crosshair.position.z = -1.25;
    }
}



document.addEventListener('mousedown', function (click) {
    if(gui.style.display == "block"){
        return
    }
    if(player.firstShot == true){
        player.firstShot = false
    } else {
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
                const Hit = raycaster.intersectObjects([floor]); // add other objects that could be hit here (in array)
    
                let bulletColor = 0xffffff
                hitNumber = 0
                // If the crosshair is intersecting the target, remove the target from the scene
                if (Hit[0].object == floor) { // add Walls / Barriers here with an ||
                    bonk.load();
                    bonk.play();
                    bang.load();
                    bang.play();
                }

                /*
                if (health <= 0) { // LOGIC for hit -- may need later
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
                        player.score += Math.round((player.hitstreak * 0.37623) * 100 - ((Date.now() - player.lastKill) / 70))
                    }
                    player.lastKill = Date.now();
                    console.log("Score: " + player.score)
                }
                */
                player.last_shot = Date.now();
    
                var bullet = new THREE.Mesh(new THREE.SphereGeometry(0.05, 32, 32), new THREE.MeshBasicMaterial({ color: bulletColor }));
    
                bullet.alive = true;
                bullet.velocity = cameraDirection;
                bullet.position.set(Hit[hitNumber].point.x, Hit[hitNumber].point.y, Hit[hitNumber].point.z)
                scene.add(bullet);
                bullets.push(bullet);
    
                const points = [];
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
                }, 500)
    
                break;
            default:
                console.log(`Unknown button code: ${e.button}`);
        }
    }

});

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
        case "Escape":
            if (gui.style.display === "none") {
                gui.style.display = "block";
            } else {
                gui.style.display = "none";
                player.firstShot = true;
            }
    }
});

document.addEventListener("pointerlockchange", function(event) {
    if (document.pointerLockElement === null) {
        if (gui.style.display === "none") {
            gui.style.display = "block";
        } else {
            gui.style.display = "none";
            player.firstShot = true;
        }
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

function updateScoreVisuals(){
    document.getElementById("Score").innerHTML = "Score: " + player.score
}

function escapeMenu(){
    var gui = document.createElement("div");

    gui.id = "gui";
    gui.style.position = "absolute";
    gui.style.top = "0px";
    gui.style.left = "0px";
    gui.style.width = "100%";
    gui.style.height = "100%";
    gui.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // semi-transparent black background
    gui.style.display = "none"; // hide the GUI by default
    document.body.appendChild(gui);


    var slideContainer = document.createElement("div");
    var slider = document.createElement("input");
    var val = document.createElement("div")
    val.id = "value";

    slider.type = 'range';
    slider.value = 30;
    slider.max = 100;
    slider.min = 1;
    slider.style.width = "50%";
    slider.style.margin= "25%"
    slider.style.marginBottom = "0"
    slideContainer.prepend(slider);
  
    val.innerHTML = "Sensitivity: " + (slider.value/100);
  
    slider.oninput = function() {
      val.innerHTML = "Sensitivity: "+ (this.value/100);
      console.log(val.innerHTML)
      player.sensitivity = this.value/100;
      controls.pointerSpeed = player.sensitivity;
    }

    val.style.color = "white";
    val.style.display = "flex"
    val.style.marginLeft = "41.5%";
    val.style.fontSize = "24px"

   

    gui.appendChild(slideContainer);
    slideContainer.appendChild(slider)
    slideContainer.appendChild(val)
}

escapeMenu();
gui.style.display = "none";

// Animate the target by rotating it
function animate() {
    requestAnimationFrame(animate);
    if(gui.style.display == "none"){
        movePlayer();
        updateCrosshairSize();
        updateTrailVisiblity();
        updateScoreVisuals();
    }
    renderer.setClearColor(0x808080);
    renderer.render(scene, camera);
}


//setting sens
controls.pointerSpeed = player.sensitivity;

//init
animate();