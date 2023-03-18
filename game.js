var character;
var hp;
var score;
var projectileList;
var enemyList;
var isPaused;
var enemyInterval;

const assetsDir = "assets/"
const playerAsset = assetsDir + "saucer.png"
const enemyAsset = assetsDir + "rock.png"
const imageAsset = "image"

function startGame() {
    // Set up player character and game area:
    character = new component(170, 170, 30, 30, playerAsset, offsetX=0, offsetY=0, speed=10, type=imageAsset);  
    gameArea.start();
    
    // Set the global variables:
    hp = 100;
    score = 0;
    projectileList = {};
    enemyList = {};
    isPaused = false;
    
    // Set up the event listeners for controls:
    document.addEventListener('keydown', keyboardControlsManager);
    document.addEventListener('click', mouseControlsManager);
    
    // Set up the pause menu and hide it for now:
    var continueGame = document.getElementById("continueGame");
    continueGame.style.display = "block";
    var gameOver = document.getElementById("gameOver");
    gameOver.style.display = "none";
    var menu = document.getElementById("mainMenu");
    menu.style.display = "none";
    menu.style.background = "rgba(0,0,0,0.5)";
    
    // Spawn new enemies at a steady rate of time:
    enemyInterval = setInterval(function () {generateEnemy(1, enemyAsset, imageAsset)}, 500);
    
    // Start game loop:
    requestAnimationFrame(updateGameArea);
}

var gameArea = {
    canvas: document.getElementById('gameWindow'),
    start: function() { 
        // Scale the game area to the current viewport:
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

// Object manager for entities on game area:
function component(x, y, width, height, color, offsetX=0, offsetY=0, speed=1, type, angle=0) {
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
        if (angle != 0) {
            var rot_x = this.x + 0.5 * this.width;
            var rot_y = this.y + 0.5 * this.height;
            ctx.translate(rot_x, rot_y);
            ctx.rotate(this.angle);
            ctx.translate(-rot_x, -rot_y);
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
    
    // Move to offset directions if area bounds are not hit:
    this.newPos = function() {
        var newX = this.x + (this.offsetX * speed);
        var newY = this.y + (this.offsetY * speed);
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

// Test whether two rectangles collide. Returns true if they do. 
function testCollision(c1, c2) {
    var x1 = c1.x - c1.width / 2;
    var y1 = c1.y - c1.height / 2;
    
    var x2 = c2.x - c2.width / 2;
    var y2 = c2.y - c2.height / 2;
    
    return x1 <= x2 + c2.width && x2 <= x1 + c1.width && y1 <= y2 + c2.height && y2 <= y1 + c1.height; 
}

// Object manager for shootable projectiles
function projectile(id, x, y, width, height, offsetX=0, offsetY=0, speed=10, color='red', angle=0) {
    this.component = new component(x, y, width, height, color, offsetX, offsetY, speed, color, angle);
    this.id = id;
    
    projectileList[id] = this;
    
    this.update = function() {
        this.component.update();
    }
    // Move projectile to offset direction. If this pojectile goes outside area bounds, delete it.
    this.newPos = function() {
        this.component.x += this.component.offsetX * speed;
        this.component.y += this.component.offsetY * speed;
                   
        if(this.component.x < 0 || this.component.x > gameArea.canvas.width){
            delete projectileList[this.id];
        }
        if(this.component.y < 0 || this.component.y > gameArea.canvas.height){
            delete projectileList[this.id];
        }
    }
}

// Returns a unit vector [x, y] that shows which way you should go from the point (x, y) to end up in the point (targetX, targetY)  
function calculateDirection(x, y, targetX, targetY) {
    // Calculate direction vector:
    var offsetX = targetX - x;
    var offsetY = targetY - y;
    var length = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    
    return [offsetX / length, offsetY / length];
}

// Generate a new pojectile that starts at the player player position and advances toward the point (targetX, targetY) 
function generateProjectileFromCharacter(targetX, targetY){
    var height = 5;
    var width = 25;
    var id = Math.random();
    
    var dir = calculateDirection(character.x, character.y, targetX, targetY);
    var radAngle = Math.atan2(dir[1], dir[0]);
    
    new projectile(id, character.x, character.y, width, height, dir[0], dir[1], 10, 'red', radAngle);
}

function enemy(id, x, y, width, height, offsetX=0, offsetY=0, speed=1, color='green', type, angle) {
    this.component = new component(x, y, width, height, color, offsetX, offsetY, speed, type, angle);
    this.id = id;
    
    enemyList[id] = this;
    
    this.update = function() {
        this.component.update();
    }
    
    // Move toward the player character
    this.newPos = function() {
        var dir = calculateDirection(this.component.x, this.component.y, character.x, character.y);
        
        this.component.x += dir[0] * speed;
        this.component.y += dir[1] * speed;
    }
}

// Generate a slightly randomized enemy asteroid: 
function generateEnemy(speed=1, color, type) {
    var height = 20 + Math.random() * 50;
    var width = 20 + Math.random() * 50;
    
    // The enemy appears at a random edge of the game area:
    var x, y;
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
    
    var id = Math.random();
    var speed = Math.random() * 2;
    var angle = Math.random() * Math.PI * 2
    
    new enemy(id, x, y, width, height, 0, 0, speed, color, type, angle);   
}

function updateGameArea() {
    if(!isPaused) {
        gameArea.clear();
        character.newPos();    
        character.update();
    
        for(var key in projectileList){
            var projectile = projectileList[key];
            projectile.newPos();
            projectile.update();
        }
    
        for(var key in enemyList){
            var enemy = enemyList[key];
            enemy.newPos();
            enemy.update();
            if(testCollision(character, enemy.component)) {
                hp--;
            }
        } 
        
        for(var key in projectileList){
            var projectile = projectileList[key];
            var collision = false;
            for(var key in enemyList){
                var enemy = enemyList[key];
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
        ctx.fillText("HP: " + hp, 30, 40);
        ctx.fillText("Score: " + score, 175, 40);
    }
    if(hp >= 1) {
        requestAnimationFrame(updateGameArea);
    } else {
        showEndScreen();
    }
}

function moveUp() {
    character.offsetY--; 
}

function moveDown() {
    character.offsetY++; 
}

function moveLeft() {
    character.offsetX--; 
}

function moveRight() {
    character.offsetX++; 
}

function togglePause() {
    var menu = document.getElementById("mainMenu");
    var continueGame = document.getElementById("continueGame");
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
    // Show main menu with correct buttons:
    var menu = document.getElementById("mainMenu");
    menu.style.display = "block";
    var continueGame = document.getElementById("continueGame");
    continueGame.style.display = "none";
    var gameOver = document.getElementById("gameOver");
    gameOver.style.display = "block";
    
    // Stop accepting commands from player:
    document.removeEventListener('keydown', keyboardControlsManager);
    document.removeEventListener('click', mouseControlsManager);
    
    // Stop spawning enemies:
    clearInterval(enemyInterval);
}

function keyboardControlsManager(e) {
    switch (e.keyCode) {
        case 37: // Arrow Left
        case 65: // A
            if(!isPaused) moveLeft();
            break;
            
        case 38: // Arrow Up
        case 87: // W
            if(!isPaused) moveUp();
            break;
        case 39:  // Arrow Right
        case 68:  // D
            if(!isPaused) moveRight();
            break;
        case 40:  // Arrow Down
        case 83:  // S
            if(!isPaused) moveDown();
            break;
        case 27: // Esc
        case 80: // P
            togglePause();
    }
}

function mouseControlsManager(e) {
    if(!isPaused) {
        // Get the mouse pointer position and shoot a new projectile toward it
        var rect = e.target.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        generateProjectileFromCharacter(x, y);
    }
}