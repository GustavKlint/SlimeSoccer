class MultiplayerManager {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.isHost = false;
        this.isOnline = false;
        this.roomCode = null;
        this.lastPing = 0;
        this.pingInterval = null;
        
        this.setupMenuHandlers();
    }
    
    generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    setupMenuHandlers() {
        document.getElementById('localPlayBtn').addEventListener('click', () => {
            this.startLocalPlay();
        });
        
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.createRoom();
        });
        
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            this.showJoinForm();
        });
        
        document.getElementById('connectBtn').addEventListener('click', () => {
            const code = document.getElementById('roomCodeInput').value.toUpperCase();
            if (code) {
                this.joinRoom(code);
            }
        });
        
        document.getElementById('backBtn').addEventListener('click', () => {
            this.backToMenu();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.disconnect();
            this.backToMenu();
        });
    }
    
    startLocalPlay() {
        this.isOnline = false;
        this.showGame();
        if (window.game) {
            window.game.isOnline = false;
            window.game.reset();
        }
    }
    
    createRoom() {
        this.roomCode = this.generateRoomCode();
        this.isHost = true;
        this.isOnline = true;
        
        this.peer = new Peer(this.roomCode, {
            config: {
                'iceServers': [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });
        
        this.peer.on('open', (id) => {
            document.getElementById('roomCode').textContent = id;
            document.getElementById('roomInfo').style.display = 'block';
            document.getElementById('connectionStatus').textContent = 'Waiting for player...';
            document.querySelector('.menu-buttons').style.display = 'none';
        });
        
        this.peer.on('connection', (conn) => {
            this.connection = conn;
            this.setupConnection();
        });
        
        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            document.getElementById('connectionStatus').textContent = 'Error: ' + err.message;
        });
    }
    
    showJoinForm() {
        document.getElementById('joinForm').style.display = 'block';
        document.querySelector('.menu-buttons').style.display = 'none';
        document.getElementById('roomCodeInput').focus();
    }
    
    joinRoom(hostId) {
        this.isHost = false;
        this.isOnline = true;
        
        const peerId = this.generateRoomCode();
        this.peer = new Peer(peerId, {
            config: {
                'iceServers': [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });
        
        this.peer.on('open', () => {
            this.connection = this.peer.connect(hostId);
            this.setupConnection();
            document.getElementById('joinStatus').textContent = 'Connecting...';
        });
        
        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            document.getElementById('joinStatus').textContent = 'Error: ' + err.message;
        });
    }
    
    setupConnection() {
        this.connection.on('open', () => {
            console.log('Connected!');
            if (this.isHost) {
                document.getElementById('connectionStatus').textContent = 'Player connected!';
                setTimeout(() => this.showGame(), 1000);
            } else {
                document.getElementById('joinStatus').textContent = 'Connected!';
                setTimeout(() => this.showGame(), 1000);
            }
            
            this.startPingMonitor();
        });
        
        this.connection.on('data', (data) => {
            this.handleData(data);
        });
        
        this.connection.on('close', () => {
            console.log('Connection closed');
            this.handleDisconnection();
        });
        
        this.connection.on('error', (err) => {
            console.error('Connection error:', err);
            this.handleDisconnection();
        });
    }
    
    handleData(data) {
        if (data.type === 'ping') {
            this.send({ type: 'pong', time: data.time });
        } else if (data.type === 'pong') {
            this.lastPing = Date.now() - data.time;
            document.getElementById('pingDisplay').textContent = `Ping: ${this.lastPing}ms`;
        } else if ((data.type === 'hostState' || data.type === 'guestState') && window.game) {
            window.game.receiveState(data);
        } else if (data.type === 'input' && window.game) {
            window.game.receiveInput(data);
        } else if (data.type === 'start' && window.game) {
            window.game.start();
        } else if (data.type === 'reset' && window.game) {
            window.game.reset();
        }
    }
    
    startPingMonitor() {
        this.pingInterval = setInterval(() => {
            if (this.connection && this.connection.open) {
                this.send({ type: 'ping', time: Date.now() });
            }
        }, 1000);
    }
    
    send(data) {
        if (this.connection && this.connection.open) {
            this.connection.send(data);
        }
    }
    
    showGame() {
        document.getElementById('menuScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        
        if (this.isOnline) {
            document.getElementById('connectionDisplay').textContent = 
                this.isHost ? 'Host (Blue)' : 'Guest (Red)';
            document.getElementById('p1name').textContent = this.isHost ? 'You' : 'Opponent';
            document.getElementById('p2name').textContent = this.isHost ? 'Opponent' : 'You';
        } else {
            document.getElementById('connectionDisplay').textContent = 'Local Play';
            document.getElementById('p1name').textContent = 'Player 1';
            document.getElementById('p2name').textContent = 'Player 2';
        }
        
        if (window.game) {
            window.game.isOnline = this.isOnline;
            window.game.isHost = this.isHost;
            window.game.multiplayerManager = this;
            window.game.reset();
        }
    }
    
    backToMenu() {
        document.getElementById('menuScreen').style.display = 'block';
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('roomInfo').style.display = 'none';
        document.getElementById('joinForm').style.display = 'none';
        document.querySelector('.menu-buttons').style.display = 'flex';
        document.getElementById('roomCodeInput').value = '';
        document.getElementById('joinStatus').textContent = '';
    }
    
    handleDisconnection() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        
        document.getElementById('connectionDisplay').textContent = 'Disconnected';
        document.getElementById('pingDisplay').textContent = 'Ping: --';
        
        if (window.game && window.game.gameRunning) {
            window.game.gameRunning = false;
            alert('Connection lost! Returning to menu...');
            this.disconnect();
            this.backToMenu();
        }
    }
    
    disconnect() {
        if (this.connection) {
            this.connection.close();
        }
        if (this.peer) {
            this.peer.destroy();
        }
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        
        this.peer = null;
        this.connection = null;
        this.isHost = false;
        this.isOnline = false;
    }
}

window.multiplayerManager = new MultiplayerManager();