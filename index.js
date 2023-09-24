const { log } = require('console');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Map, Set } = require('immutable');
const { players, init, hLines, vLines, squares, initArray, CONF } = require('./setup')

const GRID_SIZE = CONF.GRID_SIZE;

init(app, io, server)


async function start() {
  while (true) {

    for (let index = 0; index < players.length; index++) {

      const player = players[index];
      let wait = true;
      // console.log(player.url+ "?vLines="+JSON.stringify(vLines)+"&hLines="+JSON.stringify(hLines)+"&squares="+JSON.stringify(squares))

      let turnPromise;
      if (CONF.USE_AWS) {
        turnPromise = fetch(player.url + "?vLines=" + JSON.stringify(vLines) + "&hLines=" + JSON.stringify(hLines) + "&squares=" + JSON.stringify(squares)).then(response => response.text())

      } else { //LOCAL
        turnPromise = new Promise((resolve) => { resolve((Math.floor(Math.random() * 4)).toString()) });
      }




      turnPromise.then(direction => {

        switch (direction) {
          case "0":
            Object.assign(player, { vx: 1, vy: 0 });
            hLines[player.x][player.y] = player.id;
            break;
          case "1":
            Object.assign(player, { vx: -1, vy: 0 });
            if (player.x > 0) {
              hLines[player.x - 1][player.y] = player.id;
            }
            break;
          case "2":
            Object.assign(player, { vx: 0, vy: -1 });
            if (player.y > 0) {
              vLines[player.x][player.y - 1] = player.id;
            }
            break;
          case "3":
            Object.assign(player, { vx: 0, vy: 1 });
            vLines[player.x][player.y] = player.id;
            break;

        }

        player.x += player.vx;
        player.x = Math.max(player.x, 0);
        player.x = Math.min(player.x, GRID_SIZE);
        player.y += player.vy;
        player.y = Math.max(player.y, 0);
        player.y = Math.min(player.y, GRID_SIZE);
      })
        .then(async x => {
          await evaluate(player);
        })
        .then(x => {
          io.emit('sendStatus', { hLines, vLines, squares, players })
        })
        .then(x => {

          wait = false
        });
      while (wait) {
        await sleep(CONF.SLEEP);

      }
    }

  }
}

async function evaluate(player) {
  const isJoining = checkIfJoin(player);
  if (isJoining) {
    const isClosing = await checkIfClosing(player);
  }

  //  io.emit('debug', { player });
}


async function checkIfClosing(player) {
  if (player.vx != 0) {
    // horizontal move
    y = player.y;
    x = player.vx == 1 ? player.x - 1 : player.x;

    await checkBothSides(x, y, x, y - 1, player);
  } else if (player.vy != 0) {
    //vertical move
    x = player.x;
    y = player.vy == 1 ? player.y - 1 : player.y;
    await checkBothSides(x, y, x - 1, y, player);

  }
}

async function checkBothSides(x1, y1, x2, y2, player) {
  set = new Set();
  //check one side
  let areaStatus = await checkArea(player, Map({ x: x1, y: y1 }));
  if (areaStatus) {
    io.emit('clearCheck');
    //check other side
    set = new Set();
    areaStatus = await checkArea(player, Map({ x: x2, y: y2 }));
    if (areaStatus) {
      io.emit('clearCheck');
    } else {
      closedArea(player);
    }
  }
  else {
    closedArea(player);
  }
}

function closedArea(player) {
  const area = set.toJS();
  for (let index = 0; index < area.length; index++) {
    const square = area[index];
    squares[square.x][square.y] = player.id;
    hLines[square.x][square.y] = 0;
    hLines[square.x][(square.y + 1)] = 0;
    vLines[square.x][square.y] = 0;
    vLines[(square.x + 1)][(square.y)] = 0;
  }
  //io.emit("closedArea", {player, closedArea: set.toJS()})
}



let set;

// check if valid closed area
async function checkArea(player, square) {
  let result = 0;

  const x = square.get("x");
  const y = square.get("y");
  //console.log("checking position ", x, y);

  if (set.has(square)) {
    // console.log("Already present, skipping");
    return 0;
  }


  set = set.add(square);

  if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) {
    return 1;
  }

  if (CONF.AREAS_DEBUG_MODE) {
    io.emit('checkingSquare', { x, y });
    await sleep(50);
  }

  //up 
  if (hLines[x][y] == 0) {
    // open, adding the square above
    result += await checkArea(player, Map({ x, y: y - 1 }));
    if (result > 0) return result;
  } else {
    // line, checking if same color
    if (hLines[x][y] != player.id) {
      // Uncomment if areas need to be closed only with current player's color
      //  return 1;
    }
  }
  //down 
  if (hLines[x][y + 1] == 0) {
    // open, adding the square below
    result += await checkArea(player, Map({ x, y: y + 1 }));
    if (result > 0) return result;
  } else {
    // line, checking if same color
    if (hLines[x][y + 1] != player.id) {
      // Uncomment if areas need to be closed only with current player's color
      //  return 1;
    }
  }
  //left
  if (vLines[x][y] == 0) {
    // open, adding the square above
    result += await checkArea(player, Map({ x: x - 1, y }));
    if (result > 0) return result;
  } else {
    // line, checking if same color
    if (vLines[x][y] != player.id) {
      // Uncomment if areas need to be closed only with current player's color
      //  return 1;
    }
  }

  //right
  if (vLines[x + 1][y] == 0) {
    // open, adding the square above
    result += await checkArea(player, Map({ x: x + 1, y }));
    if (result > 0) return result;
  } else {
    // line, checking if same color
    if (vLines[x + 1][y] != player.id) {
      // Uncomment if areas need to be closed only with current player's color
      //  return 1;
    }
  }
  return 0;
}

// Check if new position point has more than one line, meaning that an area might be closed
function checkIfJoin(player) {
  const x = player.x;
  const y = player.y;
  let nLines = 0;
  if (x > 0 && hLines[x - 1][y] > 0) {
    nLines++;
  }
  if (x < GRID_SIZE + 1 && hLines[x][y] > 0) {
    nLines++;
  }
  if (y > 0 && vLines[x][y - 1] > 0) {
    nLines++;
  }
  if (y < GRID_SIZE + 1 && vLines[x][y] > 0) {
    nLines++;
  }

  return nLines > 1;
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

sleep(5000)
start()
