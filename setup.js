const CONF = {
  GRID_SIZE: 20,
  USE_AWS: false,
  AREAS_DEBUG_MODE: false,
  SLEEP: 100
}

let hLines = initArray(CONF.GRID_SIZE + 1);
let vLines = initArray(CONF.GRID_SIZE + 1);
let squares = initArray(CONF.GRID_SIZE + 1);

const SLEEP = 100;

const players = [];
players.push({
  id: 1,
  name: "Neo",
  url: "https://5ebgubys2pea7la3ao63lmtquu0avevo.lambda-url.eu-central-1.on.aws/",
  x: 10, y: 10, vx: 0, vy: 0
});

players.push({
  id: 2,
  name: "Agent Smith",
  url: "https://5ebgubys2pea7la3ao63lmtquu0avevo.lambda-url.eu-central-1.on.aws/",
  x: 5, y: 5, vx: 0, vy: 0
});



function init(app, io, server) {
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
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

module.exports = { players, init, hLines, vLines, squares, initArray, CONF }