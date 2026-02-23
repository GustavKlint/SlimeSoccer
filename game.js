const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 400;

const GRAVITY = 0.25;
const BALL_GRAVITY = 0.016;
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
        this.speed = 2;
        this.jumpPower = 6;
        this.onGround = true;
        this.controls = controls;
        this.keys = {};
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
    
    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.radius, this.radius, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y + 20, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 20, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y + 20, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 20, 2, 0, Math.PI * 2);
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
        
        console.log(`Ball reset: starting on ${side} side at x=${this.x}, canvas.width=${canvas.width}`);
    }
    
    update() {
        this.velocityY += BALL_GRAVITY;
        
        // Higher velocity cap for powerful shots
        const maxVelocity = 4;
        this.velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, this.velocityX));
        this.velocityY = Math.max(-maxVelocity, Math.min(maxVelocity, this.velocityY));
        
        // Apply strong damping
        this.velocityX *= 0.995;
        this.velocityY *= 0.995;
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.velocityX = -this.velocityX * 0.8; // More bouncy walls
            this.x = this.x - this.radius < 0 ? this.radius : canvas.width - this.radius;
        }
        
        if (this.y + this.radius > GROUND_Y) {
            this.velocityY = -this.velocityY * 0.7; // Much more bouncy ground
            this.y = GROUND_Y - this.radius;
            this.velocityX *= 0.9; // Less friction on ground
            
            if (Math.abs(this.velocityY) < 0.05) { // Lower threshold for stopping
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
            const targetX = slime.x + Math.cos(angle) * (this.radius + slime.radius);
            const targetY = slime.y + slime.radius + Math.sin(angle) * (this.radius + slime.radius);
            
            const ax = targetX - this.x;
            const ay = targetY - this.y;
            
            // EXTREMELY powerful collision for proper gameplay
            const baseForce = 2.5; // Much stronger base force
            this.velocityX = Math.cos(angle) * baseForce;
            this.velocityY = Math.sin(angle) * baseForce - 0.8; // Strong upward component
            
            // Major slime velocity influence
            if (Math.abs(slime.velocityX) > 0.3) {
                this.velocityX += slime.velocityX * 0.6; // Much stronger influence
            }
            if (slime.velocityY < -0.3) {
                this.velocityY += slime.velocityY * 0.6; // Strong upward boost when jumping
            }
            
            this.x += this.velocityX;
            this.y += this.velocityY;
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
        
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.player1 = new Slime(200, '#4169E1', {
            left: 'a',
            right: 'd',
            jump: 'w',
            left2: 'ArrowLeft',
            right2: 'ArrowRight',
            jump2: 'ArrowUp',
            side: 'left'
        });
        
        this.player2 = new Slime(600, '#DC143C', {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            jump: 'ArrowUp',
            left2: 'a',
            right2: 'd',
            jump2: 'w',
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