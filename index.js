const { log } = require('console');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const GRID_SIZE = 20;
let hLines = initArray(GRID_SIZE);
let vLines = initArray(GRID_SIZE);
let squares = initArray(GRID_SIZE);
const players = [];
players.push({
  id: 1,
  name: "javi",
  url: "https://5ebgubys2pea7la3ao63lmtquu0avevo.lambda-url.eu-central-1.on.aws/",
  x: 10, y: 10, vx:0, vy:0
});


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.get('/e', (req, res) => {
  io.emit('event', { someProperty: 'some value', otherProperty: 'other value' });
});
server.listen(3000, () => {
  console.log('listening on *:3000');
});

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function initArray(n) {
  return new Array(n).fill(0).map(() => new Array(n).fill(0));
}

async function start() {
  while (true) {

    players.forEach(player => {
      fetch(player.url)
        .then(response => response.text())
        .then(direction => {
          switch (direction) {
            case "0":
              console.log("right");
              player.move = 1
              player.vx = 1;
              player.vy = 0;
              hLines[player.x][player.y]=player.id;
              break;
            case "1":
              console.log("left");
              player.move = 1
              player.vx = -1;
              player.vy = 0;
              hLines[player.x-1][player.y]=player.id;
              break;
            case "2":
              console.log("up");
              player.move = 1
              player.vx = 0;
              player.vy = -1;
              vLines[player.x][player.y-1]=player.id;
              break;
            case "3":
              console.log("down");
              player.move = 1
              player.vx = 0;
              player.vy = 1;
              vLines[player.x][player.y]=player.id;
              break;

          }

          player.x += player.vx;
          player.x= Math.max(player.x,0);
          player.x= Math.min(player.x,GRID_SIZE);
          player.y += player.vy;
          player.y= Math.max(player.y,0);
          player.y= Math.min(player.y,GRID_SIZE);
          
        })
    });

    
    //  .then(direction =>
      io.emit('event', {  hLines, vLines });
    //console.log("emiting")

    await sleep(1000);
  }
}

start()
