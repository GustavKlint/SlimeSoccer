const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 400;

const GRAVITY = 0.5;
const BALL_GRAVITY = 0.4;
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
        this.speed = 5;
        this.jumpPower = 12;
        this.onGround = true;
        this.controls = controls;
        this.keys = {};
    }
    
    update() {
        if (this.keys[this.controls.left]) {
            this.velocityX = -this.speed;
        } else if (this.keys[this.controls.right]) {
            this.velocityX = this.speed;
        } else {
            this.velocityX *= 0.8;
        }
        
        if (this.keys[this.controls.jump] && this.onGround) {
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
        ctx.arc(this.x, this.y + this.radius, this.radius, Math.PI, 0, true);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y + this.radius - 20, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + this.radius - 20, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y + this.radius - 20, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + this.radius - 20, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Ball {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = canvas.width / 2;
        this.y = 100;
        this.radius = 15;
        this.velocityX = (Math.random() - 0.5) * 4;
        this.velocityY = 0;
        this.color = '#FFD700';
    }
    
    update() {
        this.velocityY += BALL_GRAVITY;
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.velocityX = -this.velocityX * 0.8;
            this.x = this.x - this.radius < 0 ? this.radius : canvas.width - this.radius;
        }
        
        if (this.y + this.radius > GROUND_Y) {
            this.velocityY = -this.velocityY * 0.7;
            this.y = GROUND_Y - this.radius;
            this.velocityX *= 0.9;
            
            if (Math.abs(this.velocityY) < 1) {
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
            
            this.velocityX = ax * 0.5 + slime.velocityX * 0.3;
            this.velocityY = ay * 0.5 + slime.velocityY * 0.3;
            
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
            side: 'left'
        });
        
        this.player2 = new Slime(600, '#DC143C', {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            jump: 'ArrowUp',
            side: 'right'
        });
        
        this.ball = new Ball();
        this.score1 = 0;
        this.score2 = 0;
        this.gameTime = 180;
        this.gameRunning = false;
        this.lastTime = 0;
        this.timeAccumulator = 0;
        
        this.setupControls();
        this.setupButtons();
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            e.preventDefault();
            this.player1.keys[e.key.toLowerCase()] = true;
            this.player2.keys[e.key] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            e.preventDefault();
            this.player1.keys[e.key.toLowerCase()] = false;
            this.player2.keys[e.key] = false;
        });
    }
    
    setupButtons() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.start();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });
    }
    
    start() {
        this.gameRunning = true;
        this.lastTime = Date.now();
    }
    
    reset() {
        this.gameRunning = false;
        this.score1 = 0;
        this.score2 = 0;
        this.gameTime = 180;
        this.ball.reset();
        this.player1.x = 200;
        this.player1.y = GROUND_Y;
        this.player2.x = 600;
        this.player2.y = GROUND_Y;
        this.updateScore();
        this.updateTimer();
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
        
        this.player1.update();
        this.player2.update();
        this.ball.update();
        
        this.ball.checkSlimeCollision(this.player1);
        this.ball.checkSlimeCollision(this.player2);
        
        this.checkGoal();
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
            ctx.fillText('Player 1 Wins!', canvas.width / 2, canvas.height / 2 + 20);
        } else if (this.score2 > this.score1) {
            ctx.fillText('Player 2 Wins!', canvas.width / 2, canvas.height / 2 + 20);
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
game.updateTimer();
game.gameLoop();