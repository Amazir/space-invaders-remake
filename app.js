import * as THREE from 'three';

// Create and init scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

// Create and set up renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

/*
    this wil be player class


 */

var isPressingLeft = false;
var isPressingRight = false;

var velocity = 0.1;

var positionX = 50;
var positionY = 50;

// function player(cube){
//
//
//
// }

function updatePosition() {
    if(isPressingLeft)
        cube.position.x -= velocity;
    if(isPressingRight)
        cube.position.x += velocity;
}

/*
-----------

 */
const loader = new THREE.TextureLoader();

const geometry = new THREE.BoxGeometry( 0.6, 0.6, 0.2);
const material = new THREE.MeshBasicMaterial( {
    map: loader.load("./public/textures/cube_texture_test.jpg") } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );
cube.position.y -= 3.3;
camera.position.z = 5;

function tick(){
    updatePosition();
}

function animate() {
    requestAnimationFrame( animate );

    tick();
    //cube.rotation.x += 0.01;
    //cube.rotation.y += 0.01;

    renderer.render( scene, camera );
}

function handleEvents(){
    document.onkeydown = function(e) {
        switch (e.keyCode) {
            case 37:
                // Left
                isPressingLeft = true;
                console.log("lewy down");
                break;
            case 39:
                // Right
                console.log("prawy down");
                isPressingRight = true;
                break;
        }
    };
    document.onkeyup = function(e) {
        switch (e.keyCode) {
            case 37:
                // Left
                console.log("lewy up");
                isPressingLeft = false;
                break;
            case 39:
                // Right
                isPressingRight = false;
                console.log("prawy up");
                break;
        }
    };
}

handleEvents();
animate();