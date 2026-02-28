const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 400;

const GRAVITY = 0.25;  // Standard gravity
const BALL_GRAVITY = 0.02;  // Balanced ball physics
const GROUND_Y = canvas.height - 50;
const NET_HEIGHT = 100;
const NET_WIDTH = 10;
const NET_X = canvas.width / 2 - NET_WIDTH / 2;
const NET_Y = GROUND_Y - NET_HEIGHT;

class Slime {
    constructor(x, color, controls) {
        this.x = x;
        this.y = GROUND_Y;
        this.radius = 40;
        this.color = color;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 2.2;  // Slightly increased speed
        this.jumpPower = 6.5;  // Slightly higher jumps
        this.onGround = true;
        this.controls = controls;
        this.keys = {};
        
        // Googly eyes properties
        this.leftEye = { offsetX: 0, offsetY: 0, targetX: 0, targetY: 0 };
        this.rightEye = { offsetX: 0, offsetY: 0, targetX: 0, targetY: 0 };
    }
    
    update() {
        if (this.keys[this.controls.left] || this.keys[this.controls.left2]) {
            this.velocityX = -this.speed;
        } else if (this.keys[this.controls.right] || this.keys[this.controls.right2]) {
            this.velocityX = this.speed;
        } else {
            this.velocityX *= 0.8;
        }
        
        if ((this.keys[this.controls.jump] || this.keys[this.controls.jump2]) && this.onGround) {
            this.velocityY = -this.jumpPower;
            this.onGround = false;
        }
        
        this.velocityY += GRAVITY;
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        if (this.x - this.radius < 0) {
            this.x = this.radius;
        }
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
        }
        
        if (this.controls.side === 'left' && this.x + this.radius > NET_X) {
            this.x = NET_X - this.radius;
        }
        if (this.controls.side === 'right' && this.x - this.radius < NET_X + NET_WIDTH) {
            this.x = NET_X + NET_WIDTH + this.radius;
        }
        
        if (this.y + this.radius > GROUND_Y) {
            this.y = GROUND_Y - this.radius;
            this.velocityY = 0;
            this.onGround = true;
        }
    }
    
    updateEyes(ballX, ballY) {
        // Update googly eyes to look at ball
        const leftEyeX = this.x - 10;
        const leftEyeY = this.y + 20;
        const rightEyeX = this.x + 10;
        const rightEyeY = this.y + 20;
        
        // Calculate angle to ball for each eye
        const leftAngle = Math.atan2(ballY - leftEyeY, ballX - leftEyeX);
        const rightAngle = Math.atan2(ballY - rightEyeY, ballX - rightEyeX);
        
        // Calculate target positions with max radius of 2.5
        const maxRadius = 2.5;
        this.leftEye.targetX = Math.cos(leftAngle) * maxRadius;
        this.leftEye.targetY = Math.sin(leftAngle) * maxRadius;
        this.rightEye.targetX = Math.cos(rightAngle) * maxRadius;
        this.rightEye.targetY = Math.sin(rightAngle) * maxRadius;
        
        // Add physics-based movement with acceleration and momentum
        const springForce = 0.15;
        const damping = 0.85;
        
        this.leftEye.offsetX = (this.leftEye.offsetX * damping) + (this.leftEye.targetX * springForce);
        this.leftEye.offsetY = (this.leftEye.offsetY * damping) + (this.leftEye.targetY * springForce);
        this.rightEye.offsetX = (this.rightEye.offsetX * damping) + (this.rightEye.targetX * springForce);
        this.rightEye.offsetY = (this.rightEye.offsetY * damping) + (this.rightEye.targetY * springForce);
        
        // Add slime movement influence for googly effect
        this.leftEye.offsetX += this.velocityX * 0.1;
        this.leftEye.offsetY -= Math.abs(this.velocityY) * 0.05;
        this.rightEye.offsetX += this.velocityX * 0.1;
        this.rightEye.offsetY -= Math.abs(this.velocityY) * 0.05;
    }
    
    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.radius, this.radius, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        
        // Draw googly eyes
        const leftEyeX = this.x - 10;
        const leftEyeY = this.y + 20;
        const rightEyeX = this.x + 10;
        const rightEyeY = this.y + 20;
        
        // White part of eyes
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        
        // Left eye
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Pupils (googly part)
        ctx.fillStyle = 'black';
        
        // Left pupil
        ctx.beginPath();
        ctx.arc(leftEyeX + this.leftEye.offsetX, leftEyeY + this.leftEye.offsetY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Right pupil
        ctx.beginPath();
        ctx.arc(rightEyeX + this.rightEye.offsetX, rightEyeY + this.rightEye.offsetY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add small white reflection for extra googly effect
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(leftEyeX + this.leftEye.offsetX - 1, leftEyeY + this.leftEye.offsetY - 1, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEyeX + this.rightEye.offsetX - 1, rightEyeY + this.rightEye.offsetY - 1, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Ball {
    constructor() {
        this.reset();
    }
    
    reset() {
        // Start ball clearly on one side or the other
        const side = Math.random() < 0.5 ? 'left' : 'right';
        if (side === 'left') {
            this.x = 150; // Clearly on left side
        } else {
            this.x = canvas.width - 150; // Clearly on right side
        }
        
        this.y = 50; // High drop
        this.radius = 15;
        this.velocityX = 0; // No initial horizontal movement
        this.velocityY = 0;
        this.color = '#FFD700';
        this.spin = 0; // Ball spin for curve shots
        
        console.log(`Ball reset: starting on ${side} side at x=${this.x}, canvas.width=${canvas.width}`);
    }
    
    update() {
        this.velocityY += BALL_GRAVITY;
        
        // Reasonable velocity cap
        const maxVelocity = 6;
        this.velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, this.velocityX));
        this.velocityY = Math.max(-maxVelocity, Math.min(maxVelocity, this.velocityY));
        
        // Slight damping for control
        this.velocityX *= 0.997;
        this.velocityY *= 0.997;
        
        // Apply spin effect to horizontal movement (reduced)
        this.velocityX += this.spin * 0.05;
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Decay spin over time
        this.spin *= 0.99;
        
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.velocityX = -this.velocityX * 0.85; // Wall bounce
            this.x = this.x - this.radius < 0 ? this.radius : canvas.width - this.radius;
        }
        
        if (this.y + this.radius > GROUND_Y) {
            this.velocityY = -this.velocityY * 0.75; // Ground bounce
            this.y = GROUND_Y - this.radius;
            this.velocityX *= 0.92; // Ground friction
            
            if (Math.abs(this.velocityY) < 0.08) {
                this.velocityY = 0;
            }
        }
        
        if (this.x + this.radius > NET_X && this.x - this.radius < NET_X + NET_WIDTH) {
            if (this.y + this.radius > NET_Y) {
                this.velocityX = -this.velocityX;
                if (this.x < canvas.width / 2) {
                    this.x = NET_X - this.radius;
                } else {
                    this.x = NET_X + NET_WIDTH + this.radius;
                }
            }
        }
    }
    
    checkSlimeCollision(slime) {
        const dx = this.x - slime.x;
        const dy = this.y - (slime.y + slime.radius);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.radius + slime.radius) {
            const angle = Math.atan2(dy, dx);
            const slimeSpeed = Math.sqrt(slime.velocityX * slime.velocityX + slime.velocityY * slime.velocityY);
            
            // Determine collision type and calculate power multipliers
            let powerMultiplier = 1.0;
            let directionBonus = 0;
            
            // TIMING-BASED POWER: Reward precise timing (reduced multipliers)
            if (slime.velocityY < -2) { // Hitting while jumping up
                powerMultiplier += 0.25; // 25% more power
            }
            if (slimeSpeed > 1.5) { // Moving fast
                powerMultiplier += 0.15; // 15% more power
            }
            if (!slime.onGround) { // Aerial hit
                powerMultiplier += 0.1; // 10% more power
            }
            
            // DIRECTIONAL CONTROL: Hit angle based on contact point
            const contactAngle = Math.atan2(dy, dx);
            const slimeDirection = Math.atan2(slime.velocityY, slime.velocityX);
            
            // SPIKE ATTACKS: Downward shots when hitting from above
            let isSpike = false;
            if (dy < -5 && slime.velocityY > 0 && !slime.onGround) {
                isSpike = true;
                powerMultiplier += 0.4; // Spike power boost
            }
            
            // SWEET SPOT MECHANICS: Extra power for perfect positioning
            const relativeX = dx / slime.radius; // -1 to 1
            if (Math.abs(relativeX) < 0.3) { // Center sweet spot
                powerMultiplier += 0.15;
            }
            
            // Calculate base force with all multipliers
            const baseForce = 2.5 * powerMultiplier;
            
            if (isSpike) {
                // Spike: Strong downward and directional force
                this.velocityX = dx > 0 ? baseForce * 0.8 : -baseForce * 0.8;
                this.velocityY = Math.abs(baseForce * 1.2); // Downward spike
                this.spin = dx > 0 ? -2 : 2; // Topspin
            } else {
                // Normal hit: Direction based on contact angle and slime movement
                let hitAngle = contactAngle;
                
                // Adjust hit angle based on slime movement direction
                if (Math.abs(slime.velocityX) > 0.5) {
                    const influence = Math.sign(slime.velocityX) * 0.3;
                    hitAngle += influence;
                }
                
                this.velocityX = Math.cos(hitAngle) * baseForce;
                this.velocityY = Math.sin(hitAngle) * baseForce;
                
                // Add slime momentum transfer
                this.velocityX += slime.velocityX * 0.5;
                this.velocityY += slime.velocityY * 0.5;
                
                // Add spin based on hit location and slime movement
                this.spin = (relativeX * 3) + (slime.velocityX * 0.2);
            }
            
            // Separate ball from slime to prevent multiple collisions
            const separation = this.radius + slime.radius + 2;
            this.x = slime.x + Math.cos(contactAngle) * separation;
            this.y = slime.y + slime.radius + Math.sin(contactAngle) * separation;
            
            // Cap the maximum velocity after all calculations
            const maxVel = 6;
            const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
            if (currentSpeed > maxVel) {
                this.velocityX = (this.velocityX / currentSpeed) * maxVel;
                this.velocityY = (this.velocityY / currentSpeed) * maxVel;
            }
        }
    }
    
    draw() {
        ctx.save();
        
        const gradient = ctx.createRadialGradient(this.x - 5, this.y - 5, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, '#FFED4B');
        gradient.addColorStop(1, '#FFD700');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Visual spin indicator
        if (Math.abs(this.spin) > 0.1) {
            ctx.strokeStyle = this.spin > 0 ? '#FF6B6B' : '#4ECDC4';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius - 3, 0, Math.PI * Math.abs(this.spin) * 0.5);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.player1 = new Slime(200, '#4169E1', {
            left: 'a',
            right: 'd',
            jump: 'w',
            left2: null,
            right2: null,
            jump2: null,
            side: 'left'
        });
        
        this.player2 = new Slime(600, '#DC143C', {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            jump: 'ArrowUp',
            left2: null,
            right2: null,
            jump2: null,
            side: 'right'
        });
        
        this.ball = new Ball();
        this.score1 = 0;
        this.score2 = 0;
        this.gameTime = 180;
        this.gameRunning = false;
        this.lastTime = 0;
        this.timeAccumulator = 0;
        
        this.isOnline = false;
        this.isHost = false;
        this.multiplayerManager = null;
        this.syncCounter = 0;
        
        this.localPlayer = null;
        this.remotePlayer = null;
        
        this.setupControls();
        this.setupButtons();
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            // Don't prevent default if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            e.preventDefault();
            const key = e.key.toLowerCase();
            
            if (this.isOnline) {
                if (this.localPlayer) {
                    this.localPlayer.keys[key] = true;
                    this.localPlayer.keys[e.key] = true;
                    
                    if (this.multiplayerManager) {
                        this.multiplayerManager.send({
                            type: 'input',
                            keys: this.localPlayer.keys
                        });
                    }
                }
            } else {
                this.player1.keys[key] = true;
                this.player2.keys[e.key] = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            // Don't prevent default if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            e.preventDefault();
            const key = e.key.toLowerCase();
            
            if (this.isOnline) {
                if (this.localPlayer) {
                    this.localPlayer.keys[key] = false;
                    this.localPlayer.keys[e.key] = false;
                    
                    if (this.multiplayerManager) {
                        this.multiplayerManager.send({
                            type: 'input',
                            keys: this.localPlayer.keys
                        });
                    }
                }
            } else {
                this.player1.keys[key] = false;
                this.player2.keys[e.key] = false;
            }
        });
    }
    
    setupButtons() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.start();
            if (this.isOnline && this.multiplayerManager) {
                this.multiplayerManager.send({ type: 'start' });
            }
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
            if (this.isOnline && this.multiplayerManager) {
                this.multiplayerManager.send({ type: 'reset' });
            }
        });
    }
    
    start() {
        this.gameRunning = true;
        this.lastTime = Date.now();
        
        if (this.isOnline) {
            this.localPlayer = this.isHost ? this.player1 : this.player2;
            this.remotePlayer = this.isHost ? this.player2 : this.player1;
        }
    }
    
    reset() {
        this.gameRunning = false;
        this.score1 = 0;
        this.score2 = 0;
        this.gameTime = 180;
        this.ball.reset();
        this.player1.x = 200;
        this.player1.y = GROUND_Y;
        this.player1.velocityX = 0;
        this.player1.velocityY = 0;
        this.player2.x = 600;
        this.player2.y = GROUND_Y;
        this.player2.velocityX = 0;
        this.player2.velocityY = 0;
        this.updateScore();
        this.updateTimer();
        
        if (this.isOnline) {
            this.localPlayer = this.isHost ? this.player1 : this.player2;
            this.remotePlayer = this.isHost ? this.player2 : this.player1;
        }
    }
    
    receiveInput(data) {
        if (this.remotePlayer) {
            this.remotePlayer.keys = data.keys || {};
        }
    }
    
    receiveState(data) {
        if (data.type === 'hostState' && !this.isHost) {
            this.ball.x = data.ball.x;
            this.ball.y = data.ball.y;
            this.ball.velocityX = data.ball.velocityX;
            this.ball.velocityY = data.ball.velocityY;
            
            this.player1.x = data.player1.x;
            this.player1.y = data.player1.y;
            this.player1.velocityX = data.player1.velocityX;
            this.player1.velocityY = data.player1.velocityY;
            
            this.score1 = data.score1;
            this.score2 = data.score2;
            this.gameTime = data.gameTime;
            
            this.updateScore();
            this.updateTimer();
        } else if (data.type === 'guestState' && this.isHost) {
            this.player2.x = data.player2.x;
            this.player2.y = data.player2.y;
            this.player2.velocityX = data.player2.velocityX;
            this.player2.velocityY = data.player2.velocityY;
        }
    }
    
    checkGoal() {
        if (this.ball.y + this.ball.radius >= GROUND_Y) {
            if (this.ball.x < NET_X) {
                this.score2++;
                this.ball.reset();
                this.updateScore();
            } else if (this.ball.x > NET_X + NET_WIDTH) {
                this.score1++;
                this.ball.reset();
                this.updateScore();
            }
        }
    }
    
    updateScore() {
        document.getElementById('score1').textContent = this.score1;
        document.getElementById('score2').textContent = this.score2;
    }
    
    updateTimer() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    update() {
        if (!this.gameRunning) return;
        
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.timeAccumulator += deltaTime;
        if (this.timeAccumulator >= 1) {
            this.gameTime--;
            this.timeAccumulator = 0;
            this.updateTimer();
            
            if (this.gameTime <= 0) {
                this.gameRunning = false;
                this.gameOver();
            }
        }
        
        if (this.isOnline && this.isHost) {
            this.player1.update();
            this.player2.update();
            this.player1.updateEyes(this.ball.x, this.ball.y);
            this.player2.updateEyes(this.ball.x, this.ball.y);
            this.ball.update();
            this.ball.checkSlimeCollision(this.player1);
            this.ball.checkSlimeCollision(this.player2);
            this.checkGoal();
            
            this.syncCounter++;
            if (this.syncCounter >= 2) {
                this.syncCounter = 0;
                if (this.multiplayerManager) {
                    this.multiplayerManager.send({
                        type: 'hostState',
                        ball: {
                            x: this.ball.x,
                            y: this.ball.y,
                            velocityX: this.ball.velocityX,
                            velocityY: this.ball.velocityY
                        },
                        player1: {
                            x: this.player1.x,
                            y: this.player1.y,
                            velocityX: this.player1.velocityX,
                            velocityY: this.player1.velocityY
                        },
                        score1: this.score1,
                        score2: this.score2,
                        gameTime: this.gameTime
                    });
                }
            }
        } else if (this.isOnline && !this.isHost) {
            this.player2.update();
            
            if (this.multiplayerManager) {
                this.multiplayerManager.send({
                    type: 'guestState',
                    player2: {
                        x: this.player2.x,
                        y: this.player2.y,
                        velocityX: this.player2.velocityX,
                        velocityY: this.player2.velocityY
                    }
                });
            }
        } else {
            this.player1.update();
            this.player2.update();
            this.player1.updateEyes(this.ball.x, this.ball.y);
            this.player2.updateEyes(this.ball.x, this.ball.y);
            this.ball.update();
            this.ball.checkSlimeCollision(this.player1);
            this.ball.checkSlimeCollision(this.player2);
            this.checkGoal();
        }
    }
    
    gameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = 'bold 32px Arial';
        if (this.score1 > this.score2) {
            const winner = this.isOnline ? (this.isHost ? 'You Win!' : 'You Lose!') : 'Player 1 Wins!';
            ctx.fillText(winner, canvas.width / 2, canvas.height / 2 + 20);
        } else if (this.score2 > this.score1) {
            const winner = this.isOnline ? (this.isHost ? 'You Lose!' : 'You Win!') : 'Player 2 Wins!';
            ctx.fillText(winner, canvas.width / 2, canvas.height / 2 + 20);
        } else {
            ctx.fillText('It\'s a Draw!', canvas.width / 2, canvas.height / 2 + 20);
        }
    }
    
    drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8C8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#90EE90';
        ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
        
        ctx.fillStyle = '#654321';
        ctx.fillRect(NET_X, NET_Y, NET_WIDTH, NET_HEIGHT);
        
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(NET_X + NET_WIDTH / 2, NET_Y);
        ctx.lineTo(NET_X + NET_WIDTH / 2, GROUND_Y);
        ctx.stroke();
    }
    
    draw() {
        this.drawBackground();
        this.player1.draw();
        this.player2.draw();
        this.ball.draw();
        
        if (!this.gameRunning && this.gameTime <= 0) {
            this.gameOver();
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

const game = new Game();
window.game = game;
game.updateTimer();
game.gameLoop();