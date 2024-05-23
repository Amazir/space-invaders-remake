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
var velocity = 0.075;

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
const geometry = new THREE.BoxGeometry(0.6, 0.6, 0);

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
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

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
        const geometry = new THREE.BoxGeometry(0.6, 0.6, 0);

        // Use plain color instead of texture for enemy 
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

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

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();
        if (enemies[i].isOutOfBounds()) {
            enemies[i].removeFromScene();
            enemies.splice(i, 1);
            lives--;
            if (lives <= 0) {
                gameOver = true;
            }
        } else {
            const enemyBox = enemies[i].getBoundingBox();
            const playerBox = new THREE.Box3().setFromObject(cube);
            if (enemyBox.intersectsBox(playerBox)) {
                enemies[i].removeFromScene();
                enemies.splice(i, 1);
                lives--;
                if (lives <= 0) {
                    gameOver = true;
                }
            }
        }
    }
}

let collisionCooldown = 0; // Dodajemy zmienną do śledzenia odstępu czasu między wykrywaniem kolizji

function checkCollisions() {
    if (collisionCooldown > 0) {
        collisionCooldown--; // Zmniejszamy odstęp czasu między sprawdzaniem kolizji
        return; // Wyjdź z funkcji, jeśli nadal trwa odstęp czasu
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const bulletBox = bullet.getBoundingBox();

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const enemyBoundingBox = enemy.getBoundingBox();

            // Sprawdzanie, czy strzałka jest w obszarze przeciwnika
            if (bulletBox.intersectsBox(enemyBoundingBox)) {
                console.log("Collision Detected!");
                bullet.removeFromScene();
                enemy.removeFromScene();
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                points++;
                collisionCooldown = 10; // Ustawienie odstępu czasu między wykrywaniem kolizji
                return; // Wyjdź z funkcji, aby uniknąć dodatkowych sprawdzeń kolizji w tej klatce
            }
        }
    }
}





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

function updateScore() {
    if(points>highScore)
        highScore = points;
    scoreElement.innerHTML = `Lives: ${lives} Points: ${points}`;
}

function animate() {
    requestAnimationFrame(animate);
    tick();
    renderer.render(scene, camera);
}

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

// Spawn an enemy every 2 seconds
setInterval(spawnEnemy, 2000);

handleEvents();
animate();
