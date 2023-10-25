const https = require('https');

const CONF = {
  GRID_SIZE: 20,
  USE_AWS: false,
  AREAS_DEBUG_MODE: false,
  SLEEP: 70
}



const players = [];
const nextMovements = [[]];
players.push({ id: 0, style: "#F0F0F0" });





function loadPlayers() {
  nextMovements.splice(1);
  players.splice(1);
  https.get('https://api.npoint.io/1be7fea18ca72b74f515', res => {
    let data = [];


    res.on('data', chunk => {
      data.push(chunk);
    });

    res.on('end', () => {
      console.log('Response ended: ');
      const users = JSON.parse(Buffer.concat(data).toString());

      for (user of users) {
        console.log(`Got user with id: ${user.id}, name: ${user.name}`);
        players.push(user);
        nextMovements.push([]);
      }
    });
  }).on('error', err => {
    console.log('Error: ', err.message);
  });

}



function init(app, io, server, restart, addPlayerCallback) {

  loadPlayers();

  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });
  app.get('/ui.js', (req, res) => {
    res.sendFile(__dirname + '/ui.js');
  });
  app.get('/socket.client.js', (req, res) => {
    res.sendFile(__dirname + '/socket.client.js');
  });

  app.get('/restart', (req, res) => {
    loadPlayers();
    restart();
    res.send("restarted");
  });

  app.get('/switchMode', (req, res) => {
    CONF.USE_AWS = !CONF.USE_AWS;
    res.send("switched to: " + CONF.USE_AWS);
  });

  app.get('/addPlayer', (req, res) => {

    addPlayerCallback({

      name: "New",
      emoji: "✈️",
      url: "https://5ebgubys2pea7la3ao63lmtquu0avevo.lambda-url.eu-central-1.on.aws/",
      x: 11, y: 5, vx: 0, vy: 0,
      style: "#" + Math.floor(Math.random() * 16777215).toString(16)
    });
    res.send("ok");
  })

  app.get('/sleep', (req, res) => {
    const sleepTime = parseInt(req.query.value);
    CONF.SLEEP = sleepTime;
    res.send("ok");
  });

  io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });


  server.listen(3000, () => {
    console.log('listening on *:3000');
  });

}
function initArray(n) {
  return new Array(n).fill(0).map(() => new Array(n).fill(0));
}

module.exports = { players, init, initArray, CONF, nextMovements }
