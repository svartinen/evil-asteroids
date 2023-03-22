var character;
var hp;
var score;
var projectileList;
var projectileListIndex;
var enemyList;
var enemyListIndex;
var particleList;
var particleListIndex;
var isPaused;
var enemyInterval;
var playerMovements;

var lastRenderTime = 0;
const globalSpeedMult = 60;

const enemySpeed = 1;
const enemySpawnrate = 500;

const assetsDir = "assets/"
const playerAsset = assetsDir + "saucer.png"
const enemyAsset = assetsDir + "rock.png"
const imageAsset = "image"

const playerImage = new Image();
const enemyRockImage = new Image();

const assets = {[playerAsset]: playerImage, [enemyAsset]: enemyRockImage}

function startGame() {
    // Set up the player character and the game area:
    character = new component(170, 170, 30, 30, playerAsset, offsetX=0, offsetY=0, speed=5, type=imageAsset);  
    gameArea.start();
    
    playerImage.src = playerAsset;
    enemyRockImage.src = enemyAsset;
    
    // Set the global variables (i.e. game flags):
    hp = 100;
    score = 0;
    projectileList = {};
    projectileListIndex = 0;
    enemyList = {};
    enemyListIndex = 0;
    particleList = {};
    particleListIndex = 0;
    isPaused = false;
    
    resetMovementKeys();
    
    // Set up the event listeners for controls:
    document.addEventListener('keydown', keyboardControlsManager);
    document.addEventListener('keyup', keyboardControlsManager);
    gameArea.container.addEventListener('click', mouseControlsManager);
    
    // Set up the pause menu and hide it for now:
    let continueGame = document.getElementById("continueGame");
    continueGame.style.display = "block";
    let gameOver = document.getElementById("gameOver");
    gameOver.style.display = "none";
    let menu = document.getElementById("mainMenu");
    menu.style.display = "none";
    menu.style.background = "rgba(0,0,0,0.5)"; // Adds a nice shadow effect over the game area
    let finalScore = document.getElementById('finalScore');
    finalScore.style.display = "none";
    
    // Spawn new enemies at a steady rate of time:
    enemyInterval = setInterval(function () {generateEnemy(enemySpeed, enemyAsset, imageAsset)}, enemySpawnrate);
    
    // Start game loop:
    requestAnimationFrame(updateGameArea);
}

// A black canvas which works as the game area
var gameArea = {
    gameStarted: false,
    rotated: false,
    canvas: document.getElementById('gameWindow'),
    container: document.getElementById('gameContainer'),
    start: function() { 
        this.gameStarted = true;
        
        // Render the game at a set resolution and scale it to the viewport via css:
        this.canvas.width = 1280;
        this.canvas.height = 720;
        this.context = this.canvas.getContext("2d");
        this.container.style.opacity = "100";
        
        let scalingFactor = Math.min(window.innerWidth / this.canvas.width, window.innerHeight / this.canvas.height) * 0.9;
        
        this.canvas.style.width = this.canvas.width * scalingFactor + "px";
        this.canvas.style.height = this.canvas.height * scalingFactor + "px";
        
        // Only draw the background once in the beginning:
        let background = document.getElementById('gameBackground');
        background.width = this.canvas.width;
        background.height = this.canvas.height;
        background.style.width = this.canvas.style.width;
        background.style.height = this.canvas.style.height;
        let backgroundContext = background.getContext("2d", {alpha: false});
        backgroundContext.beginPath();
        backgroundContext.rect(0, 0, this.canvas.width, this.canvas.height);
        backgroundContext.fillStyle = "black";
        backgroundContext.fill();
        
        if (window.innerHeight > window.innerWidth) { // Switch rotation for tall screens
            this.canvas.style.transform = "rotate(90deg)";
            background.style.transform = "rotate(90deg)";
            this.rotated = true;
        } else {
            this.canvas.style.transform = "";
            background.style.transform = "";
            this.rotated = false;
        }
        // Align the game information box with the top of the game canvas:
        this.boundingRectangle = this.canvas.getBoundingClientRect();
        let gameInfo = document.getElementById('gameInfo');
        gameInfo.style.top = Math.max(this.boundingRectangle.top - 0.5 * gameInfo.clientHeight, 0) + "px";
    },
    clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function drawAllEntities() {
    character.draw();
    
    Object.keys(enemyList).forEach(key => enemyList[key].draw());
    Object.keys(projectileList).forEach(key => projectileList[key].draw());
    Object.keys(particleList).forEach(key => particleList[key].draw());
}

function resizeGame() {
    if (gameArea.gameStarted) {
        gameArea.start(); // Simply re-initialize the game area to resize it...
        drawAllEntities(); // ...and redraw all entities on it
    }
}

// Manages the entities on the game area, 'color' is either a named color or an image path as dictated by param 'type'
function component(x, y, width, height, color, offsetX=.0, offsetY=.0, speed=1, type, angle=0, brightness=100) {
    this.type = type;
    this.color = color;
    this.width = width;
    this.height = height;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.angle = angle;
    this.brightness = brightness;
    
    this.draw = function() {
        ctx = gameArea.context;
        ctx.save();
        // Rotate the component according to its angle (for instance, projectiles should point toward the direction they are moving)
        if (this.angle != 0) {
            let rotX = this.x + 0.5 * this.width;
            let rotY = this.y + 0.5 * this.height;
            ctx.translate(rotX, rotY);
            ctx.rotate(this.angle);
            ctx.translate(-rotX, -rotY);
        }
        
        if (this.type == imageAsset) {
            if (this.brightness != 100) ctx.filter = "brightness("+ this.brightness + "%)";
            ctx.drawImage(assets[this.color],
            this.x,
            this.y,
            this.width, this.height)
            
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
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

    this.animate = function(elapsedTime) {
        this.angle += 0.1 * elapsedTime; // Spins the player alien saucer around
    }
    
    this.update = function(elapsedTime) {
        this.animate(elapsedTime);
        this.newPos(elapsedTime);
        this.draw();
    }
}

// Tests whether two component rectangles collide. Returns true if they do. 
function testCollision(c1, c2) {
    // Do a simple bounding box check first:
    let x1 = c1.x;
    let x2 = c2.x; 
    let y1 = c1.y;
    let y2 = c2.y;
    
    let x1Width = c1.width;
    let x2Width = c2.width;
    let x1Height = c1.height;
    let x2Height = c2.height;
    
    if (c1.angle != 0) { // If c1 has been rotated, calculate its bounding box
        x1Width = c1.width * Math.abs(Math.cos(c1.angle)) + c1.height * Math.abs(Math.sin(c1.angle));
        x1Height = c1.width * Math.abs(Math.sin(c1.angle)) + c1.height * Math.abs(Math.cos(c1.angle)); 

        x1 = c1.x + 0.5 * (c1.width - x1Width); 
        y1 = c1.y + 0.5 * (c1.height - x1Height);
    }
    
    if (c2.angle != 0) { // If c2 has been rotated, calculate its bounding box
        x2Width = c2.width * Math.abs(Math.cos(c2.angle)) + c2.height * Math.abs(Math.sin(c2.angle));
        x2Height = c2.width * Math.abs(Math.sin(c2.angle)) + c2.height * Math.abs(Math.cos(c2.angle));
        
        x2 = c2.x + 0.5 * (c2.width - x2Width); 
        y2 = c2.y + 0.5 * (c2.height - x2Height); 
    }
    
    let edge1 = x1 <= x2 + x2Width;
    let edge2 = x2 <= x1 + x1Width;
    
    let edge3 = y1 <= y2 + x2Height;
    let edge4 = y2 <= y1 + x1Height;
     
    let boundingBoxCollision = edge1 && edge2 && edge3 && edge4;
    
    if (c1.angle == 0 && c2.angle == 0){ // Regular rectangles
        return boundingBoxCollision;
    } else { // Rotated rectangles
        if (boundingBoxCollision) return detectRectangleCollisionSAT(c1, c2); // Do a more elaborate check (SAT, collisions.js)
    }
    return false;
}

// Object manager for the projectiles shot by the player
function projectile(x, y, width, height, offsetX=0, offsetY=0, speed=10, color='red', angle=0) {
    component.call(this, x, y, width, height, color, offsetX, offsetY, speed, color, angle);
    
    this.id = projectileListIndex;
    projectileListIndex++; 
    projectileList[this.id] = this;
    
    [this.wobbleDirX, this.wobbleDirY] = calculateDirection(this.offsetX, this.offsetY, -this.offsetY, this.offsetX);
    let wobbleAmount = Math.random() * 100;
    this.originalX = this.x;
    this.originalY = this.y;
    this.wobbleDir = "start";
    
    switch(Math.round(Math.random())) {
        case 0:
            this.wobbleDir = "start";
            break;
        case 1:
            this.wobbleDir = "end";
            break;
    }
    
    // Move the projectile to offset direction. If this pojectile goes outside area bounds, delete it.
    this.newPos = function(elapsedTime) {
        let currentOffsetX = this.offsetX * this.speed * elapsedTime;
        let currentOffsetY = this.offsetY * this.speed * elapsedTime;
        
        this.x += currentOffsetX;
        this.y += currentOffsetY;
        this.originalX += currentOffsetX;
        this.originalY += currentOffsetY;
        
        if(this.x < 0 || this.x > gameArea.canvas.width){
            delete projectileList[this.id];
        }
        if(this.y < 0 || this.y > gameArea.canvas.height){
            delete projectileList[this.id];
        }
    }
    
    this.animate = function(elapsedTime) {
        let magnitude = Math.random() * 2;
        if (this.wobbleDir == "start") {
            this.x -= this.wobbleDirX * magnitude * elapsedTime;
            this.y -= this.wobbleDirY * magnitude * elapsedTime;
            if (calculateDistance(this.x, this.y, this.originalX, this.originalY) >= wobbleAmount) this.wobbleDir = "end";
        } else{
            this.x += this.wobbleDirX * magnitude * elapsedTime;
            this.y += this.wobbleDirY * magnitude * elapsedTime;
            if (calculateDistance(this.x, this.y, this.originalX, this.originalY) >= wobbleAmount) this.wobbleDir = "start";
        }
    }
}

function calculateDistance(x, y, targetX, targetY) {
    // Calculate direction vector:
    let offsetX = targetX - x;
    let offsetY = targetY - y;
    let length = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    
    return length;
}

// Returns a unit vector [dirX, dirY] that shows which way you should go from the point (x, y) to end up in the point (targetX, targetY)  
function calculateDirection(x, y, targetX, targetY) {
    let offsetX = targetX - x;
    let offsetY = targetY - y;
    let length = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    
    return [offsetX / length, offsetY / length];
}

// Generates a new pojectile that starts at the player player position and advances toward the point (targetX, targetY) 
function generateProjectileFromCharacter(targetX, targetY){
    let height = 40;
    let width = 2;
    
    let charMiddleX = character.x + character.width * 0.5; 
    
    let dir = calculateDirection(charMiddleX, character.y, targetX, targetY);
    let radAngle = Math.atan2(-dir[0], dir[1]);
    
    new projectile(charMiddleX, character.y, width, height, dir[0], dir[1], 10, 'red', radAngle);
}

// Object manager for the enemy asteroids
function enemy(x, y, width, height, offsetX=0, offsetY=0, speed=1, color='green', type, angle, brightness=100) {
    component.call(this, x, y, width, height, color, offsetX, offsetY, speed, type, angle, brightness);
    
    this.id = enemyListIndex;
    enemyListIndex++;   
    enemyList[this.id] = this;
    
    let swayAngle = 0.9 + Math.random() * 0.01;
    this.swayStart = this.angle - swayAngle;
    this.swayEnd = this.angle + swayAngle;
    
    switch(Math.round(Math.random())) {
        case 0:
            this.swayDir = "start";
            break;
        case 1:
            this.swayDir = "end";
            break;
    }
    
    // Move toward the player character
    this.newPos = function(elapsedTime) {
        let dir = calculateDirection(this.x, this.y, character.x, character.y);
        
        this.x += dir[0] * this.speed * elapsedTime;
        this.y += dir[1] * this.speed * elapsedTime;
    }
    
     // Make enemy rocks sway
    this.animate = function(elapsedTime) {
        let magnitude = Math.random() * 0.05;
        if (this.swayDir == "start") {
            this.angle -= elapsedTime * magnitude;
            if (this.angle <= this.swayStart) this.swayDir = "end"
        } else {
            this.angle += elapsedTime * magnitude;
            if (this.angle >= this.swayEnd) this.swayDir = "start"
        }
    }
}

// Generates a slightly randomized enemy asteroid: 
function generateEnemy(speed=1, color, type) {
    let height = 20 + Math.random() * 80;
    let width = 20 + Math.random() * 80;
    
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
    let brightness = Math.random() * 150 + 50;
    
    new enemy(x, y, width, height, 0, 0, randomizedSpeed, color, type, angle, brightness);   
}

function particle(x, y, offsetX=0, offsetY=0, speed=1, color='yellow', radius=1.0, alpha=1.0) {
    component.call(this, x, y, 0, 0, color, offsetX, offsetY, speed, 'color', radius);
    
    this.id = particleListIndex;
    particleListIndex++;   
    particleList[this.id] = this;
    
    this.alpha = alpha;
    
    this.draw = function() { 
        ctx = gameArea.context;
        ctx.save();
        
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.angle, 0, Math.PI * 2, false);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Move the particle to offset direction. If this particle goes outside area bounds, delete it.
    this.newPos = function(elapsedTime) {
        this.x += this.offsetX * speed * elapsedTime;
        this.y += this.offsetY * speed * elapsedTime;
                   
        if(this.x < 0 || this.x > gameArea.canvas.width){
            delete particleList[this.id];
        }
        if(this.y < 0 || this.y > gameArea.canvas.height){
            delete particleList[this.id];
        }
    }
    
    this.animate = function(elapsedTime) {
        this.alpha -= 0.005 * elapsedTime;
        this.alpha = Math.max(this.alpha, 0); // Prevent negative alpha values that cause an "afterflash"
    }
}

// Generates some explosion particles 
function generateExplosionParticles(x, y, amount) {   
    for(i = 0; i < amount; i++) {
        let offsetX = (Math.random() - 0.5) * (Math.random() * 6);
        let offsetY = (Math.random() - 0.5) * (Math.random() * 6);
        let radius = Math.random() * 5;
        let randomizedSpeed = Math.random() * 3;
        let color;
        
        // Select a random color for a particle:
        switch(Math.round(Math.random() * 2)) {
            case 0:
                color = 'yellow';
                break;
            case 1:
                color = 'brown';
                break;
            case 2:
                color = 'gray';
                break;
        }
        
        new particle(x, y, offsetX, offsetY, randomizedSpeed, color, radius, 1);
    }
}

// Generates some player-enemy collision particles 
function generateCollisionParticles(x, y, amount) {   
    for(i = 0; i < amount; i++) {
        let offsetX = (Math.random() - 0.5) * (Math.random() * 6);
        let offsetY = (Math.random() - 0.5) * (Math.random() * 6);
        let radius = Math.random() * 2;
        let randomizedSpeed = Math.random() * 0.75;
        let color;
        
        // Select a random color for a particle:
        switch(Math.round(Math.random() * 2)) {
            case 0:
                color = 'blue';
                break;
            case 1:
                color = 'white';
                break;
            case 2:
                color = 'black';
                break;
        }
        
        new particle(x, y, offsetX, offsetY, randomizedSpeed, color, radius, 1);
    }
}

function calculatePlayerMovementOffsets() {
    let movement = 
    playerMovements.KeyW && (playerMovements.KeyA || playerMovements.KeyD) ||
    playerMovements.KeyS && (playerMovements.KeyA || playerMovements.KeyD) ||
    playerMovements.ArrowUp && (playerMovements.ArrowLeft || playerMovements.ArrowRight) ||
    playerMovements.KeyDown && (playerMovements.ArrowLeft|| playerMovements.ArrowRight) ? 0.707 : 1; // 1/sqrt(2) = ~0.707, for diagonal movement
    
    if (gameArea.rotated) { // Rotate controls to match the rotated canvas
        if(playerMovements.KeyA || playerMovements.ArrowLeft){
            character.offsetY += movement;
        }
        if(playerMovements.KeyW || playerMovements.ArrowUp){
            character.offsetX -= movement;
        }
        if(playerMovements.KeyD || playerMovements.ArrowRight){
            character.offsetY -= movement;
        }
        if(playerMovements.KeyS || playerMovements.ArrowDown){
            character.offsetX += movement;
        }
    } else {
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
}

function resetMovementKeys() {
    playerMovements = {
        "ArrowUp": false, "ArrowDown": false, "ArrowLeft": false, "ArrowRight": false, 
        "KeyW": false, "KeyS": false, "KeyA": false, "KeyD": false
    };
}

function updateGameArea(currentTime) {
    if(!isPaused) {
        const secondsSinceLastRender = (currentTime - lastRenderTime) * 0.001; // milliseconds to seconds; 1/1000 = 0.001, multiplication is faster than division 
        const movementMult = globalSpeedMult  * secondsSinceLastRender;
        
        gameArea.clear();
        
        calculatePlayerMovementOffsets();
        character.update(movementMult);
        
        for(let key in projectileList){
            let projectile = projectileList[key];
            projectile.update(movementMult);
        }
    
        for(let key in enemyList){
            let enemy = enemyList[key];
            enemy.update(movementMult);
            if(testCollision(character, enemy)) {
                hp -= movementMult;
                let dir = calculateDirection(character.x, character.y, enemy.x, enemy.y);
                generateCollisionParticles(character.x + dir[0] + character.width * 0.5, character.y + dir[1] + character.height * 0.5, 5);
            }
        } 
        
        for(let key in projectileList){
            let projectile = projectileList[key];
            let collision = false;
            for(let key in enemyList){
                let enemy = enemyList[key];
                collision = testCollision(projectile, enemy);
                if(collision) {
                    delete enemyList[enemy.id];
                    score += 100;
                    generateExplosionParticles(enemy.x, enemy.y, 20);
                    break;
                }
            }
            if(collision) {
                delete projectileList[projectile.id];
            }
        }
        
        for(let key in particleList){
            let particle = particleList[key];
            particle.update(movementMult);
            if(particle.alpha <= 0) {
                delete particleList[particle.id];
            }
        }
        
        updateGameInfo();
    }
    lastRenderTime = currentTime;
    if(hp >= 1) {
        requestAnimationFrame(updateGameArea);
    } else {
        showEndScreen();
    }
}

function updateGameInfo() {
    let gameInfo = document.getElementById("gameInfo");
    let currentHP = Math.max(Math.floor(hp), 0).toString().padEnd(3, "\u00A0"); // show an integer that has been padded to a consistent length of 3 chars
    gameInfo.innerHTML = "HP: " + currentHP + "<br>Score: " + score.toString().padEnd(6, "\u00A0");
}

function pause() {
    let menu = document.getElementById("mainMenu");
    isPaused = true; 
    menu.style.display = "flex";
    clearInterval(enemyInterval);
}

function unpause() {
    let menu = document.getElementById("mainMenu");
    isPaused = false;
    menu.style.display = "none";
    enemyInterval = setInterval(function () {generateEnemy(enemySpeed, enemyAsset, imageAsset)}, enemySpawnrate);
    resetMovementKeys();
}

function togglePause() {  
    if(!isPaused) {
        pause();
    } else {
        unpause();
    }
}

function showEndScreen() {
    // Show the main menu with the correct elements, including the player's final score:
    let menu = document.getElementById("mainMenu");
    menu.style.display = "flex";
    let continueGame = document.getElementById("continueGame");
    continueGame.style.display = "none";
    let gameOver = document.getElementById("gameOver");
    gameOver.style.display = "block";
    let finalScore = document.getElementById('finalScore');
    finalScore.innerHTML = "Final Score: " + score;
    finalScore.style.display = "block";
    
    // Stop accepting commands from player:
    document.removeEventListener('keydown', keyboardControlsManager);
    document.removeEventListener('keyup', keyboardControlsManager);
    gameArea.container.removeEventListener('click', mouseControlsManager);
    
    // Stop spawning enemies:
    clearInterval(enemyInterval);
}

function keyboardControlsManager(e) {
    e.preventDefault();
    if(!isPaused) {
        if (e.code in playerMovements) { // The pressed key is WASD or one of the arrow keys
            playerMovements[e.code] = e.type === "keydown" // Toggle movement key values based on the player's keypresses
        }
    }
    if(e.keyCode == 27 || e.keyCode == 80) { // The pressed key is P or ESC
        if (e.type === "keydown") togglePause();
    }
}

function mouseControlsManager(e) {
    if(!isPaused) {
        // Get the mouse pointer position and shoot a new projectile toward it
        let rect = gameArea.boundingRectangle;
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        // Convert mouse coords to canvas coords
        let canvasX = (gameArea.canvas.width / gameArea.canvas.clientWidth) * x;
        let canvasY = (gameArea.canvas.height / gameArea.canvas.clientHeight) * y;
        if (gameArea.rotated) { // Rotate the cursor position to match the rotated canvas
            let tmp = canvasX;
            canvasX = canvasY;
            canvasY = gameArea.canvas.height - tmp;
        }
        generateProjectileFromCharacter(canvasX, canvasY);
    }
}