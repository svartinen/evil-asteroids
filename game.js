var character;
var hp;
var score;
var projectileList;
var projectileListIndex;
var enemyList;
var enemyListIndex;
var isPaused;
var enemyInterval;
var playerMovements = {"ArrowUp": false, "ArrowDown": false, "ArrowLeft": false, "ArrowRight": false, "KeyW": false, "KeyS": false, "KeyA": false, "KeyD": false};

var lastRenderTime = 0;
const globalSpeedMult = 60;

const assetsDir = "assets/"
const playerAsset = assetsDir + "saucer.png"
const enemyAsset = assetsDir + "rock.png"
const imageAsset = "image"

function startGame() {
    // Set up player character and game area:
    character = new component(170, 170, 30, 30, playerAsset, offsetX=0, offsetY=0, speed=5, type=imageAsset);  
    gameArea.start();
    
    // Set the global variables (i.e. game flags):
    hp = 100;
    score = 0;
    projectileList = {};
    projectileListIndex = 0;
    enemyList = {};
    enemyListIndex = 0;
    isPaused = false;
    
    // Set up the event listeners for controls:
    document.addEventListener('keydown', keyboardControlsManager);
    document.addEventListener('keyup', keyboardControlsManager);
    document.addEventListener('click', mouseControlsManager);
    
    // Set up the pause menu and hide it for now:
    let title = document.getElementById("title");
    title.style.textShadow = "2px 2px gray";
    let continueGame = document.getElementById("continueGame");
    continueGame.style.display = "block";
    let gameOver = document.getElementById("gameOver");
    gameOver.style.display = "none";
    let menu = document.getElementById("mainMenu");
    menu.style.display = "none";
    menu.style.background = "rgba(0,0,0,0.5)";
    let finalScore = document.getElementById('finalScore');
    finalScore.style.display = "none";
    
    // Spawn new enemies at a steady rate of time:
    enemyInterval = setInterval(function () {generateEnemy(1, enemyAsset, imageAsset)}, 500);
    
    // Start game loop:
    requestAnimationFrame(updateGameArea);
}

// A black canvas which works as the game area
var gameArea = {
    canvas: document.getElementById('gameWindow'),
    start: function() { 
        // Scale the game area to the current viewport and display it:
        this.canvas.width = window.innerWidth * 0.9;
        this.canvas.height = window.innerHeight * 0.9;
        this.canvas.style.display = "inline";
        this.context = this.canvas.getContext("2d");
    },
    clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.beginPath();
        this.context.rect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = "black";
        this.context.fill();
    }
}

// Manages the entities on the game area, 'color' is either a named color or an image path as dictated by param 'type'
function component(x, y, width, height, color, offsetX=.0, offsetY=.0, speed=1, type, angle=0) {
    this.type = type;
    this.color = color;
    if (this.type == imageAsset) {
        this.image = new Image();
        this.image.src = color;
    }
    this.width = width;
    this.height = height;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.angle = angle;
    
    this.update = function() {
        ctx = gameArea.context;
        ctx.save();
        // Rotate the component according to its angle (for instance, projectiles should point toward the direction they are moving)
        if (angle != 0) {
            let rotX = this.x + 0.5 * this.width;
            let rotY = this.y + 0.5 * this.height;
            ctx.translate(rotX, rotY);
            ctx.rotate(this.angle);
            ctx.translate(-rotX, -rotY);
        }
        
        if (this.type == imageAsset) {
            ctx.drawImage(this.image,
            this.x,
            this.y,
            this.width, this.height)
            
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
        ctx.restore();
    }
    
    // Move to offset directions if the area bounds are not hit:
    this.newPos = function(elapsedTime) {
        let newX = this.x + (this.offsetX * this.speed * elapsedTime);
        let newY = this.y + (this.offsetY * this.speed * elapsedTime);
        if(newX < gameArea.canvas.width - this.width && newX >= 0) {
            this.x = newX;
        }
        if(newY < gameArea.canvas.height - this.height && newY >= 0) {
            this.y = newY;
        }
        this.offsetX = 0;
        this.offsetY = 0;
    }    
}

// Tests whether two component rectangles collide. Returns true if they do. 
function testCollision(c1, c2) {
    let x1 = c1.x - c1.width / 2;
    let y1 = c1.y - c1.height / 2;
    
    let x2 = c2.x - c2.width / 2;
    let y2 = c2.y - c2.height / 2;
    
    return x1 <= x2 + c2.width && x2 <= x1 + c1.width && y1 <= y2 + c2.height && y2 <= y1 + c1.height; 
}

// Object manager for the projectiles shot by the player
function projectile(x, y, width, height, offsetX=0, offsetY=0, speed=10, color='red', angle=0) {
    this.component = new component(x, y, width, height, color, offsetX, offsetY, speed, color, angle);
    this.id = projectileListIndex;
    projectileListIndex++;
    
    projectileList[this.id] = this;
    
    
    this.update = function() {
        this.component.update();
    }
    // Move projectile to offset direction. If this pojectile goes outside area bounds, delete it.
    this.newPos = function(elapsedTime) {
        this.component.x += this.component.offsetX * speed * elapsedTime;
        this.component.y += this.component.offsetY * speed * elapsedTime;
                   
        if(this.component.x < 0 || this.component.x > gameArea.canvas.width){
            delete projectileList[this.id];
        }
        if(this.component.y < 0 || this.component.y > gameArea.canvas.height){
            delete projectileList[this.id];
        }
    }
}

// Returns a unit vector [dirX, dirY] that shows which way you should go from the point (x, y) to end up in the point (targetX, targetY)  
function calculateDirection(x, y, targetX, targetY) {
    // Calculate direction vector:
    let offsetX = targetX - x;
    let offsetY = targetY - y;
    let length = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    
    return [offsetX / length, offsetY / length];
}

// Generates a new pojectile that starts at the player player position and advances toward the point (targetX, targetY) 
function generateProjectileFromCharacter(targetX, targetY){
    let height = 5;
    let width = 25;
    
    let dir = calculateDirection(character.x, character.y, targetX, targetY);
    let radAngle = Math.atan2(dir[1], dir[0]);
    
    new projectile(character.x, character.y, width, height, dir[0], dir[1], 10, 'red', radAngle);
}

// Object manager for the enemy asteroids
function enemy(x, y, width, height, offsetX=0, offsetY=0, speed=1, color='green', type, angle) {
    this.component = new component(x, y, width, height, color, offsetX, offsetY, speed, type, angle);
    this.id = enemyListIndex;
    enemyListIndex++;
    
    enemyList[this.id] = this;
    
    this.update = function() {
        this.component.update();
    }
    
    // Move toward the player character
    this.newPos = function(elapsedTime) {
        let dir = calculateDirection(this.component.x, this.component.y, character.x, character.y);
        
        this.component.x += dir[0] * speed * elapsedTime;
        this.component.y += dir[1] * speed * elapsedTime;
    }
}

// Generates a slightly randomized enemy asteroid: 
function generateEnemy(speed=1, color, type) {
    let height = 20 + Math.random() * 50;
    let width = 20 + Math.random() * 50;
    
    // The enemy appears at a random edge of the game area:
    let x, y;
    switch(Math.round(Math.random() * 3)) {
        case 0:
            x = Math.random() * gameArea.canvas.width;
            y = -height;
            break;
        case 1:
            x = Math.random() * gameArea.canvas.width;
            y = gameArea.canvas.height;
            break;
        case 2:
            x = -width;
            y = Math.random() * gameArea.canvas.width;
            break;
        case 3:
            x = gameArea.canvas.width;
            y = Math.random() * gameArea.canvas.width;
            break;
    }
    
    let randomizedSpeed = Math.random() * 2 + speed;
    let angle = Math.random() * Math.PI * 2;
    
    new enemy(x, y, width, height, 0, 0, randomizedSpeed, color, type, angle);   
}

function calculatePlayerMovementOffsets() {
    let movement = 
    playerMovements.KeyW && (playerMovements.KeyA || playerMovements.KeyD) ||
    playerMovements.KeyS && (playerMovements.KeyA || playerMovements.KeyD) ||
    playerMovements.ArrowUp && (playerMovements.ArrowLeft || playerMovements.ArrowRight) ||
    playerMovements.KeyDown && (playerMovements.ArrowLeft|| playerMovements.ArrowRight) ? 0.707 : 1; // 1/sqrt(2) = ~0.707, for diagonal movement
    
    if(playerMovements.KeyA || playerMovements.ArrowLeft){
        character.offsetX -= movement;
    } 
    if(playerMovements.KeyW || playerMovements.ArrowUp){
        character.offsetY -= movement;
    } 
    if(playerMovements.KeyD || playerMovements.ArrowRight){
        character.offsetX += movement;
    } 
    if(playerMovements.KeyS || playerMovements.ArrowDown){
        character.offsetY += movement;
    } 
}

function updateGameArea(currentTime) {
    if(!isPaused) {
        const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
        const movementMult = globalSpeedMult  * secondsSinceLastRender;
        
        gameArea.clear();
        
        calculatePlayerMovementOffsets();
        character.newPos(movementMult);    
        character.update();
    
        for(let key in projectileList){
            let projectile = projectileList[key];
            projectile.newPos(movementMult);
            projectile.update();
        }
    
        for(let key in enemyList){
            let enemy = enemyList[key];
            enemy.newPos(movementMult);
            enemy.update();
            if(testCollision(character, enemy.component)) {
                hp -= movementMult;
            }
        } 
        
        for(let key in projectileList){
            let projectile = projectileList[key];
            let collision = false;
            for(let key in enemyList){
                let enemy = enemyList[key];
                collision = testCollision(projectile.component, enemy.component);
                if(collision) {
                    delete enemyList[enemy.id];
                    score += 100;
                    break;
                }
            }
            if(collision) {
                delete projectileList[projectile.id];
            }
        }
        
        ctx.font = "30px Verdana";
        ctx.fillStyle = "red";
        ctx.fillText("HP: " + Math.max(Math.floor(hp), 0), 30, 40); // Don't show funky negative values for health
        ctx.fillText("Score: " + score, 175, 40);
    }
    lastRenderTime = currentTime;
    if(hp >= 1) {
        requestAnimationFrame(updateGameArea);
    } else {
        showEndScreen();
    }
}

function togglePause() {
    let menu = document.getElementById("mainMenu");
    let continueGame = document.getElementById("continueGame");
    if(!isPaused) {
        isPaused = true; 
        menu.style.display = "block";
        clearInterval(enemyInterval);
    } else {
        isPaused = false;
        menu.style.display = "none";
        enemyInterval = setInterval(function () {generateEnemy(1, enemyAsset, imageAsset)}, 500);
    }
}

function showEndScreen() {
    // Show the main menu with the correct elements, including the player's final score:
    let menu = document.getElementById("mainMenu");
    menu.style.display = "block";
    let continueGame = document.getElementById("continueGame");
    continueGame.style.display = "none";
    let gameOver = document.getElementById("gameOver");
    gameOver.style.display = "block";
    let finalScore = document.getElementById('finalScore');
    finalScore.innerHTML = "Final Score: " + score;
    finalScore.style.display = "block";
    
    // Stop accepting commands from player:
    document.removeEventListener('keydown', keyboardControlsManager);
    document.removeEventListener('click', mouseControlsManager);
    
    // Stop spawning enemies:
    clearInterval(enemyInterval);
}

function keyboardControlsManager(e) {
    e.preventDefault();
    if(!isPaused) {
        if (e.code in playerMovements) { // The pressed key is WASD or one of the arrow keys
            playerMovements[e.code] = e.type === "keydown"
        }
    }
    if(e.keyCode == 27 || e.keyCode == 80) { // The pressed key is P or ESC
        if (e.type === "keydown") togglePause();
    }
}

function mouseControlsManager(e) {
    if(!isPaused) {
        // Get the mouse pointer position and shoot a new projectile toward it
        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        generateProjectileFromCharacter(x, y);
    }
}