var socket = io();

socket.on('sendStatus', function (msg) {
  hLines = msg.hLines;
  vLines = msg.vLines;
  squares = msg.squares;
  players = msg.players;
  for (let p = 1; p < msg.players.length; p++) {
    const player = msg.players[p];
    players[p].x = msg.players[p].x;
    players[p].y = msg.players[p].y;
  }
  draw()
});

socket.on('debug', function (msg) {
  console.log(msg.player.name);

});

socket.on('checkingSquare', function (msg) {
  checkingSquares[msg.x][msg.y] = 1;
  draw();

});

socket.on('clearCheck', function (msg) {
  checkingSquares = initArray(GRID_SIZE + 1)
  draw();

});

socket.on('closedArea', function (msg) {
  const { player, closedArea } = msg;
  checkingSquares = initArray(GRID_SIZE + 1)
  draw();

});


socket.io.on("reconnect", (attempt) => {
  console.log("reconnecting!!!!");
  location.reload();
});