let canvas, ctx;
let player;
let obstacles = [];
let particles = [];
let clouds = [];
let stars = [];
let buildings = [];
let score = 0;
let highScore = parseInt(localStorage.getItem('parkourHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let gameSpeed = 5;
let groundY = 300;
let gameLoopRunning = false;
let jumpKeyDown = false;
let jumpStartTime = 0;
let maxJumpTime = 200;
let isJumping = false;
let bgOffset = 0;
let obstacleTimer = 0;
let monsterTimer = 0;

let level = 1;
let levelComplete = false;
let levelPaused = false;
let gamePaused = false;

const levelConfig = {
    1: { speed: 5, minObstacleInterval: 120, maxObstacleInterval: 180, targetScore: 8, obstacleTypes: ['normal', 'normal', 'small'] },
    2: { speed: 6, minObstacleInterval: 100, maxObstacleInterval: 160, targetScore: 15, obstacleTypes: ['normal', 'normal', 'small', 'tall'] },
    3: { speed: 7, minObstacleInterval: 90, maxObstacleInterval: 140, targetScore: 25, obstacleTypes: ['normal', 'normal', 'small', 'tall', 'double'] },
    4: { speed: 8, minObstacleInterval: 80, maxObstacleInterval: 120, targetScore: 40, obstacleTypes: ['normal', 'small', 'tall', 'double'] },
    5: { speed: 9, minObstacleInterval: 70, maxObstacleInterval: 110, targetScore: 60, obstacleTypes: ['normal', 'small', 'tall', 'double', 'double'] },
    6: { speed: 10, minObstacleInterval: 60, maxObstacleInterval: 100, targetScore: 80, obstacleTypes: ['normal', 'small', 'tall', 'double', 'double'] },
    7: { speed: 11, minObstacleInterval: 55, maxObstacleInterval: 90, targetScore: 100, obstacleTypes: ['small', 'tall', 'double', 'double'] },
    8: { speed: 12, minObstacleInterval: 50, maxObstacleInterval: 80, targetScore: 130, obstacleTypes: ['small', 'tall', 'double', 'double'] },
    9: { speed: 13, minObstacleInterval: 45, maxObstacleInterval: 70, targetScore: 160, obstacleTypes: ['small', 'tall', 'double', 'double', 'tall'] },
    10: { speed: 14, minObstacleInterval: 40, maxObstacleInterval: 60, targetScore: 200, obstacleTypes: ['small', 'tall', 'double', 'double', 'tall'] }
};

let leftKeyDown = false;
let rightKeyDown = false;
const moveSpeed = 5;

class Player {
    constructor() {
        this.x = 100;
        this.y = groundY;
        this.width = 40;
        this.height = 50;
        this.jumping = false;
        this.jumpHeight = 15;
        this.gravity = 0.8;
        this.velocity = 0;
        this.legOffset = 0;
        this.legSpeed = 0.3;
        this.minJumpPower = 9;
        this.maxJumpPower = 17;
        this.extraJumpForce = 0.5;
        this.eyeBlink = 0;
    }

    draw() {
        ctx.save();
        
        const shadowGradient = ctx.createRadialGradient(
            this.x + 20, this.y + 55, 0,
            this.x + 20, this.y + 55, 30
        );
        shadowGradient.addColorStop(0, 'rgba(0,0,0,0.3)');
        shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y + 52, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#5dade2';
        ctx.beginPath();
        ctx.roundRect(this.x + 5, this.y + 10, 30, 35, 8);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.roundRect(this.x + 8, this.y + 12, 10, 20, 5);
        ctx.fill();
        
        ctx.fillStyle = '#85c1e9';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 10, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        this.eyeBlink += 0.02;
        const eyeOpen = Math.sin(this.eyeBlink) > 0.95 ? 0.5 : 1;
        
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.ellipse(this.x + 15, this.y + 8, 3, 3 * eyeOpen, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 25, this.y + 8, 3, 3 * eyeOpen, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 14, this.y + 7, 1, 0, Math.PI * 2);
        ctx.arc(this.x + 24, this.y + 7, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#3498db';
        const legOffset = Math.sin(this.legOffset) * 5;
        ctx.fillRect(this.x + 10, this.y + 40, 8, 12 + legOffset);
        ctx.fillRect(this.x + 22, this.y + 40, 8, 12 - legOffset);
        
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(this.x + 8, this.y + 48 + legOffset, 12, 5);
        ctx.fillRect(this.x + 20, this.y + 48 - legOffset, 12, 5);
        
        ctx.restore();
    }

    update() {
        if (!this.jumping) {
            this.legOffset += this.legSpeed;
        }
        
        if (leftKeyDown) {
            this.x -= moveSpeed;
            if (this.x < 0) {
                this.x = 0;
            }
        }
        if (rightKeyDown) {
            this.x += moveSpeed;
            if (this.x + this.width > canvas.width) {
                this.x = canvas.width - this.width;
            }
        }
        
        if (this.jumping) {
            this.velocity += this.gravity;
            
            if (jumpKeyDown && this.velocity < 0) {
                const holdTime = Date.now() - jumpStartTime;
                if (holdTime < maxJumpTime) {
                    this.velocity -= this.extraJumpForce;
                }
            }
            
            this.y += this.velocity;

            if (this.y >= groundY) {
                this.y = groundY;
                this.jumping = false;
                this.velocity = 0;
                createLandParticles(this.x + 20, this.y + 50);
            }
        }
    }

    startJump() {
        if (!this.jumping) {
            this.jumping = true;
            this.velocity = -this.minJumpPower;
            jumpStartTime = Date.now();
            playJumpSound();
            createJumpParticles(this.x + 20, this.y + 50);
        }
    }

    endJump() {
    }
}

class Monster {
    constructor() {
        this.x = canvas.width;
        this.y = groundY + 15;
        this.width = 35;
        this.height = 35;
        this.speed = gameSpeed + 1;
        this.jumpTimer = 0;
        this.jumpInterval = 80 + Math.random() * 60;
        this.isJumping = false;
        this.velocityY = 0;
        this.eyeOffset = 0;
        this.baseY = this.y;
        this.passed = false;
    }

    draw() {
        ctx.save();
        
        const shadowGradient = ctx.createRadialGradient(
            this.x + 17, this.y + 40, 0,
            this.x + 17, this.y + 40, 25
        );
        shadowGradient.addColorStop(0, 'rgba(0,0,0,0.35)');
        shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(this.x + 17, this.y + 38, 20, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 10);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(46, 204, 113, 0.5)';
        ctx.beginPath();
        ctx.roundRect(this.x + 5, this.y + 5, 12, 20, 5);
        ctx.fill();
        
        this.eyeOffset += 0.05;
        const eyeWobble = Math.sin(this.eyeOffset) * 1.5;
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 10 + eyeWobble, this.y + 12, 7, 0, Math.PI * 2);
        ctx.arc(this.x + 25 + eyeWobble, this.y + 12, 7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(this.x + 10 + eyeWobble, this.y + 12, 3.5, 0, Math.PI * 2);
        ctx.arc(this.x + 25 + eyeWobble, this.y + 12, 3.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 9 + eyeWobble, this.y + 10, 1.5, 0, Math.PI * 2);
        ctx.arc(this.x + 24 + eyeWobble, this.y + 10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1e8449';
        ctx.fillRect(this.x + 5, this.y + 30, 10, 8);
        ctx.fillRect(this.x + 20, this.y + 30, 10, 8);
        
        ctx.restore();
    }

    update() {
        this.speed = gameSpeed + 1;
        this.x -= this.speed;
        
        this.jumpTimer++;
        if (this.jumpTimer > this.jumpInterval && !this.isJumping) {
            this.jumpTimer = 0;
            this.isJumping = true;
            this.velocityY = -8;
        }
        
        if (this.isJumping) {
            this.velocityY += 0.6;
            this.y += this.velocityY;
            
            if (this.y >= this.baseY) {
                this.y = this.baseY;
                this.isJumping = false;
                this.velocityY = 0;
            }
        }
    }
}

let monsters = [];

class Obstacle {
    constructor(type = 'normal') {
        this.x = canvas.width;
        this.type = type;
        this.speed = gameSpeed;
        this.passed = false;
        
        if (type === 'normal') {
            this.y = groundY;
            this.width = 30;
            this.height = 50;
            this.color = '#e74c3c';
        } else if (type === 'small') {
            this.y = groundY + 20;
            this.width = 25;
            this.height = 30;
            this.color = '#f39c12';
        } else if (type === 'tall') {
            this.y = groundY - 20;
            this.width = 25;
            this.height = 70;
            this.color = '#a569bd';
        } else if (type === 'double') {
            this.y = groundY;
            this.width = 60;
            this.height = 50;
            this.color = '#d35400';
        }
    }

    draw() {
        ctx.save();
        
        const shadowGradient = ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height + 5, 0,
            this.x + this.width / 2, this.y + this.height + 5, this.width
        );
        shadowGradient.addColorStop(0, 'rgba(0,0,0,0.4)');
        shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height + 3, this.width / 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.color;
        
        if (this.type === 'double') {
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, 25, this.height, 5);
            ctx.roundRect(this.x + 35, this.y, 25, this.height, 5);
            ctx.fill();
            
            this.drawObstacleDetails(this.x, this.y, 25, this.height);
            this.drawObstacleDetails(this.x + 35, this.y, 25, this.height);
        } else {
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, 5);
            ctx.fill();
            this.drawObstacleDetails(this.x, this.y, this.width, this.height);
        }
        
        ctx.restore();
    }
    
    drawObstacleDetails(x, y, w, h) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 5, 8, h - 10, 3);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(x + w - 5, y + 5, 3, h - 10);
    }

    update() {
        this.x -= this.speed;
    }
}

class Particle {
    constructor(x, y, color, velocityX, velocityY, size, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.gravity = 0.3;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += this.gravity;
        this.rotation += this.rotationSpeed;
        this.life--;
        this.size *= 0.99;
    }
}

class Cloud {
    constructor(initX = null) {
        this.x = initX !== null ? initX : canvas.width + Math.random() * 200;
        this.y = 30 + Math.random() * 100;
        this.speed = 0.3 + Math.random() * 0.5;
        this.scale = 0.4 + Math.random() * 0.8;
        this.opacity = 0.7 + Math.random() * 0.25;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 25 * this.scale, 0, Math.PI * 2);
        ctx.arc(this.x + 25 * this.scale, this.y - 10 * this.scale, 20 * this.scale, 0, Math.PI * 2);
        ctx.arc(this.x + 50 * this.scale, this.y, 25 * this.scale, 0, Math.PI * 2);
        ctx.arc(this.x + 25 * this.scale, this.y + 10 * this.scale, 20 * this.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x -= this.speed;
        if (this.x + 80 * this.scale < 0) {
            this.x = canvas.width + 100;
            this.y = 30 + Math.random() * 100;
        }
    }
}

class Building {
    constructor(x) {
        this.x = x;
        this.width = 30 + Math.random() * 40;
        this.height = 50 + Math.random() * 100;
        this.y = groundY + 50 - this.height;
        this.color = `hsl(${200 + Math.random() * 40}, 20%, ${30 + Math.random() * 20}%)`;
        this.windowRows = Math.floor(this.height / 20);
        this.windowCols = Math.floor(this.width / 15);
    }

    draw() {
        ctx.save();
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = 'rgba(255, 230, 150, 0.75)';
        for (let row = 0; row < this.windowRows; row++) {
            for (let col = 0; col < this.windowCols; col++) {
                if (Math.random() > 0.3) {
                    ctx.fillRect(
                        this.x + 5 + col * 15,
                        this.y + 8 + row * 20,
                        8, 12
                    );
                }
            }
        }
        
        ctx.restore();
    }

    update() {
        this.x -= gameSpeed * 0.3;
        if (this.x + this.width < 0) {
            this.x = canvas.width + 50 + Math.random() * 100;
            this.height = 50 + Math.random() * 100;
            this.y = groundY + 50 - this.height;
            this.width = 30 + Math.random() * 40;
            this.windowRows = Math.floor(this.height / 20);
            this.windowCols = Math.floor(this.width / 15);
        }
    }
}

let audioContext;

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playJumpSound() {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playScoreSound() {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playGameOverSound() {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function createJumpParticles(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(
            x + (Math.random() - 0.5) * 25,
            y,
            Math.random() > 0.5 ? '#f1c40f' : '#f39c12',
            (Math.random() - 0.5) * 5,
            -Math.random() * 4 - 2,
            Math.random() * 4 + 2,
            35
        ));
    }
}

function createLandParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(
            x + (Math.random() - 0.5) * 35,
            y,
            Math.random() > 0.5 ? '#95a5a6' : '#7f8c8d',
            (Math.random() - 0.5) * 4,
            -Math.random() * 3,
            Math.random() * 3 + 1,
            25
        ));
    }
}

function createExplosionParticles(x, y) {
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#9b59b6', '#3498db'];
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(
            x,
            y,
            colors[Math.floor(Math.random() * colors.length)],
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
            Math.random() * 5 + 3,
            50
        ));
    }
}

function createLevelCompleteParticles() {
    const colors = ['#4CAF50', '#8BC34A', '#FFD700', '#FF69B4', '#00CED1'];
    for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.push(new Particle(
            canvas.width / 2,
            canvas.height / 2,
            colors[Math.floor(Math.random() * colors.length)],
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            Math.random() * 6 + 2,
            70
        ));
    }
}

function init() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    player = new Player();
    obstacles = [];
    particles = [];
    clouds = [];
    buildings = [];
    monsters = [];
    score = 0;
    gameOver = false;
    levelComplete = false;
    levelPaused = false;
    obstacleTimer = 0;
    monsterTimer = 0;
    bgOffset = 0;
    leftKeyDown = false;
    rightKeyDown = false;
    jumpKeyDown = false;
    
    const config = getLevelConfig(level);
    gameSpeed = config.speed;
    
    for (let i = 0; i < 6; i++) {
        const cloud = new Cloud(Math.random() * canvas.width);
        clouds.push(cloud);
    }
    
    for (let i = 0; i < 8; i++) {
        const building = new Building(i * 120);
        buildings.push(building);
    }
    
    updateUI();
    
    if (!gameLoopRunning) {
        gameLoopRunning = true;
        gameLoop();
    }
}

function getLevelConfig(lvl) {
    return levelConfig[lvl] || levelConfig[10];
}

function updateUI() {
    const config = getLevelConfig(level);
    document.getElementById("score").textContent = "得分: " + score + " / " + config.targetScore;
    document.getElementById("highScore").textContent = "最高分: " + highScore;
    document.getElementById("level").textContent = "第 " + level + " 关";
}

function drawBackground() {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY + 100);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.5, '#B0E0E6');
    skyGradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(680, 60, 35, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(680, 60, 50, 0, Math.PI * 2);
    ctx.fill();
    
    buildings.forEach(b => b.draw());
    clouds.forEach(c => c.draw());
}

function drawGround() {
    const groundGradient = ctx.createLinearGradient(0, groundY + 50, 0, groundY + 100);
    groundGradient.addColorStop(0, '#58d68d');
    groundGradient.addColorStop(1, '#2ecc71');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY + 50, canvas.width, 50);
    
    ctx.fillStyle = '#2ecc71';
    for (let i = -20 + bgOffset; i < canvas.width + 20; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, groundY + 50);
        ctx.lineTo(i + 10, groundY + 42);
        ctx.lineTo(i + 20, groundY + 50);
        ctx.fill();
    }
    
    ctx.fillStyle = '#27ae60';
    for (let i = -30 + bgOffset; i < canvas.width + 30; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, groundY + 50);
        ctx.lineTo(i + 5, groundY + 38);
        ctx.lineTo(i + 10, groundY + 50);
        ctx.fill();
    }
    
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(0, groundY + 46, canvas.width, 6);
    
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(0, groundY + 46, canvas.width, 3);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    
    if (gameStarted && !gameOver && !levelPaused && !gamePaused) {
        bgOffset -= gameSpeed * 0.5;
        if (bgOffset <= -20) bgOffset = 0;
    }
    
    buildings.forEach(b => b.update());
    clouds.forEach(c => c.update());
    
    drawGround();
    
    if (gameStarted && !gameOver && !levelPaused && !gamePaused) {
        const config = getLevelConfig(level);
        
        obstacleTimer++;
        if (obstacleTimer > config.minObstacleInterval + Math.random() * (config.maxObstacleInterval - config.minObstacleInterval)) {
            obstacleTimer = 0;
            const types = config.obstacleTypes;
            obstacles.push(new Obstacle(types[Math.floor(Math.random() * types.length)]));
        }
        
        monsterTimer++;
        if (monsterTimer > 200 + Math.random() * 200) {
            monsterTimer = 0;
            if (level >= 2) {
                monsters.push(new Monster());
            }
        }
        
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].update();
            obstacles[i].draw();
            
            if (handleEntityCollision(obstacles[i])) break;
            
            handleEntityPass(obstacles[i], config);
            
            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
            }
        }
        
        if (!gameOver) {
            for (let i = monsters.length - 1; i >= 0; i--) {
                monsters[i].update();
                monsters[i].draw();
                
                if (handleEntityCollision(monsters[i])) break;
                
                handleEntityPass(monsters[i], config);
                
                if (monsters[i].x + monsters[i].width < 0) {
                    monsters.splice(i, 1);
                }
            }
        }
        
        player.update();
        player.draw();
        
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            
            if (particles[i].life <= 0) {
                particles.splice(i, 1);
            }
        }
    } else {
        if (!gameStarted) {
            player.update();
            player.draw();
        } else {
            player.draw();
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw();
                
                if (particles[i].life <= 0) {
                    particles.splice(i, 1);
                }
            }
        }
    }
    
    requestAnimationFrame(gameLoop);
}

function checkCollision(player, obstacle) {
    const px = player.x + 5;
    const py = player.y + 5;
    const pw = player.width - 10;
    const ph = player.height - 10;
    
    return px < obstacle.x + obstacle.width &&
           px + pw > obstacle.x &&
           py < obstacle.y + obstacle.height &&
           py + ph > obstacle.y;
}

function handleEntityCollision(entity) {
    if (checkCollision(player, entity)) {
        gameOver = true;
        createExplosionParticles(player.x + player.width / 2, player.y + player.height / 2);
        playGameOverSound();
        document.getElementById("gameOver").style.display = "block";
        document.getElementById("finalScore").textContent = score;
        document.getElementById("finalLevel").textContent = level;
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('parkourHighScore', highScore);
            document.getElementById("highScore").textContent = "最高分: " + highScore;
        }
        return true;
    }
    return false;
}

function handleEntityPass(entity, config) {
    if (!entity.passed && entity.x + entity.width < player.x) {
        entity.passed = true;
        score++;
        updateUI();
        playScoreSound();
        
        if (score >= config.targetScore) {
            levelComplete = true;
            levelPaused = true;
            createLevelCompleteParticles();
            document.getElementById("nextLevel").textContent = level + 1;
            document.getElementById("levelComplete").style.display = "block";
        }
        return true;
    }
    return false;
}

document.getElementById("startButton").addEventListener("click", () => {
    level = 1;
    init();
    gameStarted = true;
    document.getElementById("startScreen").style.display = "none";
    initAudio();
});

document.getElementById("nextLevelButton").addEventListener("click", () => {
    level++;
    document.getElementById("levelComplete").style.display = "none";
    init();
    gameStarted = true;
});

document.getElementById("restartButton").addEventListener("click", () => {
    document.getElementById("gameOver").style.display = "none";
    level = 1;
    init();
    gameStarted = true;
});

function handleJumpStart() {
    if (!gameOver && gameStarted && !levelPaused) {
        jumpKeyDown = true;
        player.startJump();
    }
}

function handleJumpEnd() {
    if (jumpKeyDown) {
        jumpKeyDown = false;
        player.endJump();
    }
}

document.addEventListener("keydown", (e) => {
    if ((e.code === "Space" || e.code === "ArrowUp")) {
        e.preventDefault();
        handleJumpStart();
    }
    if (e.code === "ArrowLeft") {
        e.preventDefault();
        leftKeyDown = true;
    }
    if (e.code === "ArrowRight") {
        e.preventDefault();
        rightKeyDown = true;
    }
    if (e.code === "KeyP") {
        e.preventDefault();
        togglePause();
    }
});

document.addEventListener("keyup", (e) => {
    if ((e.code === "Space" || e.code === "ArrowUp")) {
        e.preventDefault();
        handleJumpEnd();
    }
    if (e.code === "ArrowLeft") {
        e.preventDefault();
        leftKeyDown = false;
    }
    if (e.code === "ArrowRight") {
        e.preventDefault();
        rightKeyDown = false;
    }
});

const jumpButton = document.getElementById("jumpButton");
if (jumpButton) {
    jumpButton.addEventListener("touchstart", (e) => {
        e.preventDefault();
        handleJumpStart();
    });
    jumpButton.addEventListener("touchend", (e) => {
        e.preventDefault();
        handleJumpEnd();
    });
    jumpButton.addEventListener("touchcancel", (e) => {
        e.preventDefault();
        handleJumpEnd();
    });
    jumpButton.addEventListener("mousedown", (e) => {
        e.preventDefault();
        handleJumpStart();
    });
    jumpButton.addEventListener("mouseup", (e) => {
        e.preventDefault();
        handleJumpEnd();
    });
}

const leftButton = document.getElementById("leftButton");
if (leftButton) {
    leftButton.addEventListener("touchstart", (e) => {
        e.preventDefault();
        leftKeyDown = true;
    });
    leftButton.addEventListener("touchend", (e) => {
        e.preventDefault();
        leftKeyDown = false;
    });
    leftButton.addEventListener("mousedown", (e) => {
        e.preventDefault();
        leftKeyDown = true;
    });
    leftButton.addEventListener("mouseup", (e) => {
        e.preventDefault();
        leftKeyDown = false;
    });
    leftButton.addEventListener("touchcancel", (e) => {
        e.preventDefault();
        leftKeyDown = false;
    });
}

const rightButton = document.getElementById("rightButton");
if (rightButton) {
    rightButton.addEventListener("touchstart", (e) => {
        e.preventDefault();
        rightKeyDown = true;
    });
    rightButton.addEventListener("touchend", (e) => {
        e.preventDefault();
        rightKeyDown = false;
    });
    rightButton.addEventListener("mousedown", (e) => {
        e.preventDefault();
        rightKeyDown = true;
    });
    rightButton.addEventListener("mouseup", (e) => {
        e.preventDefault();
        rightKeyDown = false;
    });
    rightButton.addEventListener("touchcancel", (e) => {
        e.preventDefault();
        rightKeyDown = false;
    });
}

function togglePause() {
    if (gameStarted && !gameOver && !levelComplete) {
        gamePaused = !gamePaused;
        document.getElementById("pauseScreen").style.display = gamePaused ? "block" : "none";
        document.getElementById("pauseButton").textContent = gamePaused ? "▶" : "⏸";
    }
}

const pauseButton = document.getElementById("pauseButton");
if (pauseButton) {
    pauseButton.addEventListener("click", () => {
        togglePause();
    });
}

const resumeButton = document.getElementById("resumeButton");
if (resumeButton) {
    resumeButton.addEventListener("click", () => {
        togglePause();
    });
}

const restartFromPauseButton = document.getElementById("restartFromPauseButton");
if (restartFromPauseButton) {
    restartFromPauseButton.addEventListener("click", () => {
        document.getElementById("pauseScreen").style.display = "none";
        gamePaused = false;
        document.getElementById("pauseButton").textContent = "⏸";
        level = 1;
        init();
        gameStarted = true;
    });
}

document.getElementById("highScore").textContent = "最高分: " + highScore;
window.addEventListener("load", init);
