import * as THREE from 'three';

// Create and init scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Create and set up renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Some bools for event handlers
var isPressingLeft = false;
var isPressingRight = false;
var isShooting = false;
var gameOver = false;

// Velocity of player
var velocity = 0.085;

// Arrays for bullets and enemies on screen
const bullets = [];
const enemies = [];

// Some counters for lives, points and high score.
let lives = 3;
let points = 0;
let highScore = 0;

// Max X and max Y for player to move on (ThreeJS scales it with resolution so shouldn't use canvas width and height)
const minX = -6.5; 
const maxX = 6.5;  

// Create a score display element
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '10px';
scoreElement.style.left = '10px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '24px';
document.body.appendChild(scoreElement);

// Function for player movement
function updatePosition() {
    if (isPressingLeft && cube.position.x > minX) {
        cube.position.x -= velocity;
    }
    if (isPressingRight && cube.position.x < maxX) {
        cube.position.x += velocity;
    }
}

// Create new texture loader
const loader = new THREE.TextureLoader();

// Create geometry box for player
const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.0);

// Load player texture
const material = new THREE.MeshBasicMaterial({
    map: loader.load("./public/textures/player.png"),
    transparent: true
});

// Load and set game background
loader.load('./public/textures/background.jpg', function(texture) {
    scene.background = texture;
});

// Create player
const cube = new THREE.Mesh(geometry, material);

// Add player to current scene
scene.add(cube);

// Set player and camera positions
cube.position.y -= 3.3;
camera.position.z = 5;

// Class for bullet
class Bullet {
    constructor(position) {
        // Geometry box for bullet
        const geometry = new THREE.BoxGeometry(0.1, 0.2, 0);

        // Use plain color instead of texture for bullet
        const material = new THREE.MeshBasicMaterial({ color: 0x0000FF });

        // Create mesh for bullet
        this.mesh = new THREE.Mesh(geometry, material);

        // Get position of player from arg
        this.mesh.position.copy(position);

        // Move it away from player
        this.mesh.position.y += 0.4;

        // Add bullet to scene
        scene.add(this.mesh);
    }

    update() {
        // Bullet movement
        this.mesh.position.y += 0.2;
    }

    isOutOfBounds() {
        // Check if bullet is out of screen
        return this.mesh.position.y > 10;
    }

    removeFromScene() {
        // Remove it from scene
        scene.remove(this.mesh);
    }

    getBoundingBox() {
        // Getter for bounding box
        return new THREE.Box3().setFromObject(this.mesh);
    }
}

class Enemy {
    constructor(position) {
        // Create geometry box for enemy
        const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);

        // Use plain color instead of texture for enemy 
        const material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });

        // Create mesh for it
        this.mesh = new THREE.Mesh(geometry, material);

        // Set position
        this.mesh.position.copy(position);

        // Add it to scene
        scene.add(this.mesh);
    }

    update() {
        // Enemy movement
        this.mesh.position.y -= 0.05;
    }

    isOutOfBounds() {
        // Enemy out of screen
        return this.mesh.position.y < -10;
    }

    removeFromScene() {
        // Remove enemy from scene
        scene.remove(this.mesh);
    }

    getBoundingBox() {
        // Getter for bounding box
        return new THREE.Box3().setFromObject(this.mesh);
    }
}

// Function for handling shooting
function shoot() {
    // Create new bullet
    const bullet = new Bullet(cube.position.clone());

    // Add new bullet to array of bullets
    bullets.push(bullet);
}

function spawnEnemy() {
    // Randomize and set enemy position
    const x = Math.random() * (maxX - minX) + minX;
    const position = new THREE.Vector3(x, 10, 0);

    // Create new enemy
    const enemy = new Enemy(position);

    // Add new enemy to array of enemies
    enemies.push(enemy);
}

// Update for bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        // Bullet movement
        bullets[i].update();

        // If bullet is out of screen remove it from scene and from bullets array
        if (bullets[i].isOutOfBounds()) {
            bullets[i].removeFromScene();
            bullets.splice(i, 1);
        }
    }
}

// Update for enemies
function updateEnemies() {
    // Loop for every enemies object
    for (let i = enemies.length - 1; i >= 0; i--) {
        // Enemies movement
        enemies[i].update();

        // Check if enemy is out of screen
        if (enemies[i].isOutOfBounds()) {
            // Then remove it
            enemies[i].removeFromScene();

            // Remove it from array 
            enemies.splice(i, 1);

            // Subtract one live
            lives--;

            // If lives is 0 then show game over screen
            if (lives <= 0) {
                gameOver = true;
            }
        } else {
            // Get enemy box
            const enemyBox = enemies[i].getBoundingBox();

            // get player box
            const playerBox = new THREE.Box3().setFromObject(cube);

            // Check if enemy collides with player
            if (enemyBox.intersectsBox(playerBox)) {
                // Remove enemy from scene
                enemies[i].removeFromScene();

                // Remove enemy from array
                enemies.splice(i, 1);

                // Subtract one live
                lives--;

                // If lives is 0 then show game over screen
                if (lives <= 0) {
                    gameOver = true;
                }
            }
        }
    }
}

// Collision cooldown for bug fixing
let collisionCooldown = 0; // Dodajemy zmienną do śledzenia odstępu czasu między wykrywaniem kolizji

// Collision check
function checkCollisions() {
    if (collisionCooldown > 0) {
        collisionCooldown--; // Lower cooldown
        return; // End function is there is cooldown
    }

    // Loop for all bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        // Get bullet
        const bullet = bullets[i];

        // Get bullet bounding box
        const bulletBox = bullet.getBoundingBox();

        // Loop for all enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const enemyBoundingBox = enemy.getBoundingBox();

            // Check if bullet hits enemy
            if (bulletBox.intersectsBox(enemyBoundingBox)) {
                // Remove bullet from scene
                bullet.removeFromScene();

                // Remove enemy from scene
                enemy.removeFromScene();

                // Remove bullet from array
                bullets.splice(i, 1);

                // Remove enemy from array
                enemies.splice(j, 1);

                // Increase points by 1
                points++;

                // Set collision cooldown / bugfix
                collisionCooldown = 10; 
                return; // Escape function
            }
        }
    }
}

// Tick function for game looping
function tick() {
    if (!gameOver) {
        updatePosition();
        updateBullets();
        updateEnemies();
        checkCollisions();
        updateScore();
    } else {
        showGameOverScreen();
    }
}

// Update loop for score
function updateScore() {
    if(points>highScore)
        highScore = points;
    scoreElement.innerHTML = `Lives: ${lives} Points: ${points}`;
}

// Animate function for ThreeJS
function animate() {
    requestAnimationFrame(animate);
    tick();
    renderer.render(scene, camera);
}

// Keyboard event handling
function handleEvents() {
    document.onkeydown = function(e) {
        switch (e.keyCode) {
            case 37:
                // Left
                isPressingLeft = true;
                break;
            case 39:
                // Right
                isPressingRight = true;
                break;
            case 32:
                // Space (shoot)
                if (!isShooting) {
                    isShooting = true;
                    shoot();
                }
                break;
            case 13:
                // Enter (restart game)
                if (gameOver) {
                    restartGame();
                }
                break;
        }
    };
    document.onkeyup = function(e) {
        switch (e.keyCode) {
            case 37:
                // Left
                isPressingLeft = false;
                break;
            case 39:
                // Right
                isPressingRight = false;
                break;
            case 32:
                // Space (shoot)
                isShooting = false;
                break;
        }
    };
}

function showGameOverScreen() {
    // Div with game over screen
    const gameOverDiv = document.getElementById('gameOverScreen');
    if (!gameOverDiv) {
        const newGameOverDiv = document.createElement('div');
        newGameOverDiv.id = 'gameOverScreen';
        newGameOverDiv.style.position = 'absolute';
        newGameOverDiv.style.top = '50%';
        newGameOverDiv.style.left = '50%';
        newGameOverDiv.style.transform = 'translate(-50%, -50%)';
        newGameOverDiv.style.color = 'white';
        newGameOverDiv.style.fontSize = '48px';
        newGameOverDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        newGameOverDiv.style.padding = '20px';
        newGameOverDiv.style.borderRadius = '10px';
        newGameOverDiv.innerHTML = `Game Over<br>High Score: ${highScore}<br>Points: ${points}<br>Press Enter to Restart`;
        document.body.appendChild(newGameOverDiv);
    }
}
function restartGame() {
    // Reset variables
    lives = 3;
    points = 0;
    gameOver = false;
    // Remove all bullets and enemies from the scene
    bullets.forEach(bullet => bullet.removeFromScene());
    enemies.forEach(enemy => enemy.removeFromScene());
    bullets.length = 0;
    enemies.length = 0;
    // Remove game over screen
    const gameOverDiv = document.getElementById('gameOverScreen');
    if (gameOverDiv) {
        document.body.removeChild(gameOverDiv);
    }
    // Reset player position
    cube.position.set(0, -3.3, 0);
    // Update score display
    updateScore();
}

function spawner(){
    // Spawn always one enemy
    spawnEnemy();

    // Spawn one more enemy if points >=5
    if(points>=5)
        spawnEnemy();

    // Spawn one more enemy if points >=5
    if(points>=10)
        spawnEnemy();
}

// Spawn an enemy every 2 seconds
setInterval(spawner, 2000);

handleEvents();
animate();
