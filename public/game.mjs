import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

let myPlayer = null;
let players = {};
let collectibles = {};
const SPEED = 15

socket.on('init', (data) => {
    myPlayer = new Player(data.player);
    
    players = {};
    data.players.forEach(playerData => {
        if (playerData.id !== myPlayer.id) {
            players[playerData.id] = new Player(playerData);
        }
    });
    
    collectibles = {};
    data.collectibles.forEach(collectibleData => {
        collectibles[collectibleData.id] = new Collectible(collectibleData);
    });
    
    renderGame();
});

socket.on('playerJoined', (playerData) => {
    if (playerData.id !== myPlayer.id) {
        players[playerData.id] = new Player(playerData);
    }
});

socket.on('playerMoved', (playerData) => {
    if (playerData.id === myPlayer.id) {
        myPlayer.x = playerData.x;
        myPlayer.y = playerData.y;
        myPlayer.score = playerData.score;
    } else if (players[playerData.id]) {
        players[playerData.id].x = playerData.x;
        players[playerData.id].y = playerData.y;
        players[playerData.id].score = playerData.score;
    }
});

socket.on('playerLeft', (playerId) => {
    delete players[playerId];
});

socket.on('collectibleCollected', (data) => {
    delete collectibles[data.collectibleId];
    collectibles[data.newCollectible.id] = new Collectible(data.newCollectible);
    
    if (data.playerId === myPlayer.id) {
        myPlayer.score += data.collectibleValue;
    } else if (players[data.playerId]) {
        players[data.playerId].score += data.collectibleValue;
    }
});

socket.on('newCollectible', (collectible) => {
    collectibles[collectible.id] = new Collectible(collectible);
});

function renderGame() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    for (const id in collectibles) {
        const collectible = collectibles[id];
        context.fillStyle = 'gold';
        context.beginPath();
        context.arc(collectible.x + 15, collectible.y + 15, 15, 0, 2 * Math.PI);
        context.fill();
        context.strokeStyle = 'orange';
        context.lineWidth = 2;
        context.stroke();
        context.fillStyle = 'black';
        context.font = 'bold 12px Arial';
        context.textAlign = 'center';
        context.fillText(collectible.value, collectible.x + 15, collectible.y + 20);
        context.textAlign = 'left';
    }
    
    for (const id in players) {
        const player = players[id];
        context.fillStyle = 'red';
        context.fillRect(player.x, player.y, player.width, player.height);
        context.fillStyle = 'white';
        context.font = '10px Arial';
        context.textAlign = 'left';
        context.fillText(player.score, player.x + 5, player.y + 15)
    }

    if (myPlayer) {
        context.fillStyle = 'blue';
        context.fillRect(myPlayer.x, myPlayer.y, myPlayer.width, myPlayer.height);
        context.fillStyle = 'white';
        context.font = '10px Arial';
        context.textAlign = 'left';
        context.fillText(myPlayer.score, myPlayer.x + 5, myPlayer.y + 15);
        const allPlayers = [myPlayer, ...Object.values(players)];
        const rankText = myPlayer.calculateRank(allPlayers);
        document.getElementById('rank-display').textContent = rankText;
    }
    
    requestAnimationFrame(renderGame);
}

function drawPlayer(player, color) {
    context.fillStyle = color;
    context.fillRect(player.x, player.y, player.width, player.height);
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.strokeRect(player.x, player.y, player.width, player.height);
    context.fillStyle = 'black';
    context.font = '10px Arial';
    const scoreText = `P:${player.score}`;
    const textWidth = context.measureText(scoreText).width;
    context.fillText(scoreText, player.x + (player.width - textWidth) / 2, player.y - 5);
}

function updateRankDisplay() {
    const allPlayers = [myPlayer, ...Object.values(players)];
    const rankText = myPlayer.calculateRank(allPlayers);
    document.getElementById('rank-display').textContent = rankText;
}

document.addEventListener('keydown', (event) => {
    if (!myPlayer) return;
    let direction = null;
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') direction = 'up';
    else if (key === 's' || key === 'arrowdown') direction = 'down';
    else if (key === 'a' || key === 'arrowleft') direction = 'left';
    else if (key === 'd' || key === 'arrowright') direction = 'right';
    
    if (direction) {
        socket.emit('move', { direction, speed: SPEED });
    }
});



renderGame();
