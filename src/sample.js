export const handler = async(event) => {

    const xString = event.queryStringParameters.x;
    const yString = event.queryStringParameters.y;
    const x = parseInt(xString);
    const y = parseInt(yString);

    const vLines = JSON.parse(event.queryStringParameters.vLines);
    const hLines = JSON.parse(event.queryStringParameters.hLines);
    const squares = JSON.parse(event.queryStringParameters.squares);
    
    let players = JSON.parse(decodeURI(event.queryStringParameters.players));
    

    return[{ x: getRandomInt(21), y: getRandomInt(21) }];
};

function getRandomInt(max) {
 
  return Math.floor(Math.random() * max);
}


