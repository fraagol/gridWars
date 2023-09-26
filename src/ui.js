const GRID_SIZE = 20;
const SCALE = 50;
let hLines = initArray(GRID_SIZE + 1);
let vLines = initArray(GRID_SIZE + 1);
let squares = initArray(GRID_SIZE);

let checkingSquares = initArray(GRID_SIZE + 1);
let ctx;
const checkingStyle = "#f2c1f1"
const DOT_COLOR = "#506095"

/**
 * @param {CanvasRenderingContext2D} context 
 * @param {{
 *   x: number,
 *   y: number,
 *   width: number,
 *   height: number,
 *   lineColor: string,
 *   bgColor: string,
 *   strokeWidth: number,
 *   cross: boolean
 * }} configs 
 */
function fillRectWithHatchPattern(context, configs) {
  // Extracting parameters from the configs object
  const {
      x,
      y,
      width,
      height,
      lineColor = 'black', // Defaulting to black if not provided
      bgColor = 'white',   // Defaulting to white if not provided
      strokeWidth = 1,      // Defaulting to 1 if not provided
      cross = false
  } = configs;

  // Create a separate canvas to create a pattern.
  var patternCanvas = document.createElement('canvas');
  var patternContext = patternCanvas.getContext('2d');
  
  // Define the dimensions of the pattern canvas.
  patternCanvas.width = 12.5;
  patternCanvas.height = 12.5;
  
  // Set the background color of the pattern.
  patternContext.fillStyle = bgColor;
  patternContext.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
  
  // Draw the hatch pattern on the pattern canvas.
  patternContext.strokeStyle = lineColor;
  patternContext.lineWidth = strokeWidth;
  patternContext.beginPath();
  if (cross) {
    patternContext.moveTo(12.5, 0);
    patternContext.lineTo(0, 12.5);
  } else {
    patternContext.moveTo(0, 0);
    patternContext.lineTo(12.5, 12.5);
  }
  patternContext.stroke();
  
  // Create a pattern and set it as the fillStyle of the context.
  var pattern = context.createPattern(patternCanvas, 'repeat');
  context.fillStyle = pattern;
  
  // Fill the rectangle with the created hatch pattern.
  context.fillRect(x, y, width, height);
}


let players = [];
/* players.push({ id: 0, style: "rgb(200, 200, 200)" });
players.push({ id: 1, x: GRID_SIZE / 4, y: GRID_SIZE / 4, style: "#ce4bf1", headColor: "rgb(50,200,200)", move: 0 });
players.push({ id: 2, x: 3 * GRID_SIZE / 4, y: 3 * GRID_SIZE / 4, style: "#93d2f3", headColor: "rgb(50,200,60)", move: 0 });
players.push({ id: 3, x: 3 * GRID_SIZE / 4, y: 3 * GRID_SIZE / 4, style: "#ff83eb", headColor: "rgb(0,0,0)", move: 0 });
*/
function draw() {
  var canvas = document.getElementById('canvas');
  if (canvas.getContext) {
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 8;

    resetPlayersScore();

    for (let hIndex = 0; hIndex <= GRID_SIZE; hIndex++) {
      for (let vIndex = 0; vIndex <= GRID_SIZE; vIndex++) {
        drawSquares(hIndex, vIndex);
        drawHLine(hIndex, vIndex);
        drawVLine(hIndex, vIndex);
        if (checkingSquares[hIndex][vIndex] == 1) {
          drawCheckingSquare(hIndex, vIndex);
        }
        if (hIndex < GRID_SIZE && vIndex < GRID_SIZE) {
          let squareOwner = squares[hIndex][vIndex];
          players[squareOwner].score++;
        }
      }
    }

    ctx.fillStyle = DOT_COLOR;
    ctx.strokeStyle = DOT_COLOR;
    for (var x = 0; x <= GRID_SIZE; x++) {
      for (var y = 0; y <= GRID_SIZE; y++) {
        ctx.beginPath();
        ctx.arc(x * SCALE, y * SCALE, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    drawPlayers();
  }
  updateScoreboard();
}

function drawSquares(x, y) {
  // if(drawCheckingSquare[x][y])
  const square = squares[x][y];
  const xSquare = x * SCALE;
  const ySquare = y * SCALE;
  if (square === 0) {
    // console.log("drawing square " + x +" "+  y + " with color " + players[square].style)
    ctx.beginPath();
    ctx.fillStyle = players?.[square]?.style || "rgb(200, 200, 200)";
    ctx.fillRect((xSquare), (ySquare), SCALE, SCALE);
    // ctx.fillRect((xSquare) + 0, (ySquare) + 0, SCALE - 0, SCALE - 0);
    //ctx.stroke();
  } else {
    // fillRectWithHatchPattern(ctx, (xSquare), (ySquare), SCALE, SCALE, players[square].style, "rgb(200, 200, 200)");
    fillRectWithHatchPattern(ctx, {
      x: xSquare,
      y: ySquare,
      width: SCALE,
      height: SCALE,
      lineColor: players?.[square]?.style || "rgb(200, 200, 200)",
      bgColor: 'rgb(240, 240, 240)',
      strokeWidth: 2,
      cross: false,
    });
  }
}


function drawCheckingSquare(x, y) {
  console.log("drawing checking  " + x + " " + y + " with color " + checkingStyle)
  // ctx.beginPath();
  // ctx.fillStyle = checkingStyle;
  // ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
  // ctx.stroke();
  fillRectWithHatchPattern(ctx, {
    x: x * SCALE,
    y: y * SCALE,
    width: SCALE,
    height: SCALE,
    lineColor: checkingStyle,
    bgColor: 'rgb(240, 240, 240)',
    strokeWidth: 2,
    cross: true,
  });
}

function drawHLine(x, y) {
  const line = hLines[x][y];
  if (line > 0) {
    ctx.fillStyle = players[line].headColor;
    ctx.beginPath();
    //   ctx.fillRect(player.x*SCALE, player.y*SCALE, player.vx==0?10:player.vx*SCALE, player.vy==0?10:player.vy*SCALE);
    ctx.strokeStyle = players[line].headColor;
    ctx.moveTo(x * SCALE, y * SCALE);
    ctx.lineTo((x + 1) * SCALE, y * SCALE);
    ctx.stroke();
  }
}
function drawVLine(x, y) {
  const line = vLines[x][y];
  if (line > 0) {

    ctx.fillStyle = players[line].headColor;
    ctx.beginPath();
    //   ctx.fillRect(player.x*SCALE, player.y*SCALE, player.vx==0?10:player.vx*SCALE, player.vy==0?10:player.vy*SCALE);
    ctx.strokeStyle = players[line].headColor;
    ctx.moveTo(x * SCALE, y * SCALE);
    ctx.lineTo(x * SCALE, (y + 1) * SCALE);
    ctx.stroke();
  }
}

function drawPlayers() {
  players.forEach(player => {
    // ctx.beginPath();
    // ctx.fillStyle = player.headColor;
    // ctx.arc(player.x * SCALE, player.y * SCALE, 10, 0, 2 * Math.PI);
    ctx.font = "30px Arial";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.emoji, player.x * SCALE, player.y * SCALE);
    ctx.fill();
  });

}

function resetPlayersScore() {
  for (let index = 0; index < players.length; index++) {
    const player = players[index];
    player.score = 0;

  }
}
function updateScoreboard() {
  store.commit('setPlayersArray', players);
    // console.log(`score: ${players[0].score}, ${players[1].score}, ${players[2].score}`);
  // const scoreboard = document.getElementById("scoreboard");
  // scoreboard.textContent = `score: ${players[0].score}, ${players[1].score}, ${players[2].score}`;
}

function initArray(n) {
  return new Array(n).fill(0).map(() => new Array(n).fill(0));
}
