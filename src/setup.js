const CONF = {
  GRID_SIZE: 20,
  USE_AWS: false,
  AREAS_DEBUG_MODE: false,
  SLEEP: 70
}


const players = [];
players.push({ id: 0, style: "#F0F0F0" });
players.push({
  id: 1,
  name: "Neo",
  emoji: "😎",
  url: "https://5ebgubys2pea7la3ao63lmtquu0avevo.lambda-url.eu-central-1.on.aws/",
  x: 10, y: 10, vx: 0, vy: 0,
  style: "#ffb02e"
});

players.push({
  id: 2,
  name: "Agent Smith",
  emoji: "🚔",
  url: "https://5ebgubys2pea7la3ao63lmtquu0avevo.lambda-url.eu-central-1.on.aws/",
  x: 5, y: 18, vx: 0, vy: 0,
  style: "#26c9fc"
});

players.push({
  id: 3,
  name: "Trinity",
  emoji: "🥷",
  url: "https://5ebgubys2pea7la3ao63lmtquu0avevo.lambda-url.eu-central-1.on.aws/",
  x: 11, y: 5, vx: 0, vy: 0,
  style: "#ff83eb"
});

 


function init(app, io, server,restart) {
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
    restart();
    res.send("restarted");
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

module.exports = { players, init, initArray, CONF }
