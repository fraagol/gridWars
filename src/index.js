const { log } = require('console');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Map, Set } = require('immutable');
const { players, init, initArray, CONF } = require('./setup')

const GRID_SIZE = CONF.GRID_SIZE;

init(app, io, server, restart, addPlayerCallback)

let hLines = initArray(CONF.GRID_SIZE + 1);
let vLines = initArray(CONF.GRID_SIZE + 1);
let squares = initArray(CONF.GRID_SIZE + 1);
let nextMovements = [[],
 [{ x: 20, y: 20 }, { x: 0, y: 0 },{ x: 20, y: 20 }
 , { x: 0, y: 0 },{ x: 20, y: 20 }
 , { x: 0, y: 0 },{ x: 20, y: 20 }
 , { x: 0, y: 0 },{ x: 20, y: 20 }
 , { x: 0, y: 0 },{ x: 20, y: 20 }
 , { x: 0, y: 0 },{ x: 20, y: 20 }
 , { x: 0, y: 0 },{ x: 20, y: 20 }
 , { x: 0, y: 0 },{ x: 20, y: 20 }
 , { x: 0, y: 0 },{ x: 20, y: 20 }
 , { x: 0, y: 0 },{ x: 20, y: 20 }
 , { x: 0, y: 0 },{ x: 20, y: 20 }], [], []];


function restart() {
  console.log("restarting");
  hLines = initArray(CONF.GRID_SIZE + 1);
  vLines = initArray(CONF.GRID_SIZE + 1);
  squares = initArray(CONF.GRID_SIZE + 1);
}
function addPlayerCallback(newPlayer){
  newPlayer.id=players.length;
  players.push(newPlayer);
  nextMovements.push([]);
}

async function start() {
  while (true) {

    for (let index = 1; index < players.length; index++) {

      try {


        const player = players[index];
        let wait = true;
        let do_not_sleep = false;
        // console.log(player.url+ "?vLines="+JSON.stringify(vLines)+"&hLines="+JSON.stringify(hLines)+"&squares="+JSON.stringify(squares))

        let turnPromise;

        // check if available movement
        let candidateMove;
        //

        if (nextMovements[player.id].length) {
          candidateMove = nextMovements[player.id][0];
          if (inTarget(player, candidateMove)|| outside(candidateMove)) {
            nextMovements[player.id].shift();
            if (nextMovements[player.id].length) {
              candidateMove = nextMovements[player.id][0];
            } else {
              candidateMove = null;
            }
          }
        }
        if (candidateMove) {
          turnPromise = new Promise((resolve) => { resolve(candidateMove) });
        } else if (CONF.USE_AWS) {
          do_not_sleep = true;
          turnPromise = fetch(player.url + "?vLines=" + JSON.stringify(vLines) + "&hLines=" + JSON.stringify(hLines) + "&squares=" + JSON.stringify(squares)).then(response => response.json())

        } else { //LOCAL
          //   turnPromise = new Promise((resolve) => { resolve((Math.floor(Math.random() * 4)).toString()) });
          turnPromise = new Promise((resolve) => { resolve([{ x: rand(44), y: rand(44) }, { x: rand(21), y: rand(21) }]) });
        }

        turnPromise = turnPromise.then((target => {
          try {
            if (typeof target == 'string') return target;

            let nextMove;
            if (target instanceof Array) {
              nextMove = target[0];
              nextMovements[player.id] = target;

            } else {
              nextMove = target;
            }

            if (player.x < nextMove.x) {
              return "0";
            };
            if (player.x > nextMove.x) {
              return "1";
            };
            if (player.y < nextMove.y) {
              return "3";
            };
            if (player.y > nextMove.y) {
              return "2";
            };
          } catch (error) {
            console.log("Error: ", error);
          }
          return 0;
        }))


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
            player.vx = 0;
            player.vy = 0;
            wait = false
          });
        while (wait) {

          await sleep(do_not_sleep ? 0 : CONF.SLEEP);


        }
      } catch (error) {
        console.log("catched error", error);
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

  if (enemyInSquare(player.id, x, y)){
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
    // open, adding the square to the left
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
    // open, adding the square to the right
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

function enemyInSquare(playerId, x, y) {
  for (let index = 1; index < players.length; index++) {
    if(index == playerId){
      continue;
    }
    const enemy = players[index];
    const enemyX = enemy.x;
    const enemyY = enemy.y;
    if((enemyX == x && enemyY == y)
    ||(enemyX == x+1 && enemyY == y)
    ||(enemyX == x && enemyY == y+1)
    ||(enemyX == x+1 && enemyY == y+1) ){
      return true;
    }
  }
  return false;
}


function inTarget(a, b) {
  return a.x == b.x && a.y == b.y;
}

function outside(a) {
  return a.x > GRID_SIZE  || a.y > GRID_SIZE  || a.x < 0   || a.y <0 ;
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

sleep(5000)
start()

function rand(x){
return Math.floor(Math.random() * x)
}