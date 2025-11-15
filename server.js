require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

app.use(helmet({
  noCache: true, 
  hidePoweredBy: { setTo: 'PHP 7.4.3' } 
}));

app.use(helmet.xssFilter());
app.use(helmet.noSniff());

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

const io = socket(server);

const players = {};
const collectibles = {};
let collectibleId = 0;

function generateCollectible() {
  const x = Math.floor(Math.random() * 600);
  const y = Math.floor(Math.random() * 420);
  const value = Math.floor(Math.random() * 10) + 1;
  const id = collectibleId++;
  return { x, y, value, id };
}

function initializeCollectibles() {
  for (let i = 0; i < 5; i++) {
    const collectible = generateCollectible();
    collectibles[collectible.id] = collectible;
  }
}

initializeCollectibles();

io.on('connection', (socket) => {
  console.log('User has connected: ' + socket.id);
  const x = Math.floor(Math.random() * 600);
  const y = Math.floor(Math.random() * 420);
  players[socket.id] = {
    id: socket.id,
    score: 0,
    x,
    y,
    width: 50,
    height: 50
  };
  socket.emit('init', { 
    player: players[socket.id], 
    players: Object.values(players).filter(p => p.id !== socket.id), 
    collectibles: Object.values(collectibles)
  });

  socket.broadcast.emit('playerJoined', players[socket.id]);

  socket.on('move', (data) => {
    if (players[socket.id]) {
      const { direction, speed } = data;
      let { x, y } = players[socket.id];

      switch (direction) {
        case 'up': y -= speed; break;
        case 'down': y += speed; break;
        case 'left': x -= speed; break;
        case 'right': x += speed; break;
      }

      x = Math.max(0, Math.min(590, x));
      y = Math.max(0, Math.min(430, y));

      players[socket.id].x = x;
      players[socket.id].y = y;

      checkCollisions(socket.id);

      io.emit('playerMoved', players[socket.id]);
    }
  });
  socket.on('disconnect', () => {
    console.log('User has disconnected: ' + socket.id);
    if (players[socket.id]) {
      delete players[socket.id];
      io.emit('playerLeft', socket.id);
    }
  });
});

function checkCollisions(playerId) {
  const player = players[playerId];
  
  for (const collectibleId in collectibles) {
    const collectible = collectibles[collectibleId];
    if (
      player.x < collectible.x + 30 &&
      player.x + player.width > collectible.x &&
      player.y < collectible.y + 30 &&
      player.y + player.height > collectible.y
    ) {
      player.score += collectible.value;

      delete collectibles[collectibleId];
      const newCollectible = generateCollectible();
      collectibles[newCollectible.id] = newCollectible;

      io.emit('collectibleCollected', {
        playerId,
        collectibleId: parseInt(collectibleId),
        newCollectible,
        collectibleValue: collectible.value
      });
      break;
    }
  }
}

setInterval(() => {
  if (Object.keys(collectibles).length < 5) {
    const newCollectible = generateCollectible();
    collectibles[newCollectible.id] = newCollectible;
    io.emit('newCollectible', newCollectible);
  }
}, 3000);
  
module.exports = app; // For testing
