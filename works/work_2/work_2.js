const cnv = document.getElementById("myCanvas");
const ctx = cnv.getContext("2d");

const cellSize = 10;

let cnvWidth = window.innerWidth - workOptions.width;
cnv.width = cnvWidth - (cnvWidth % cellSize);
cnv.height = workOptions.height - (workOptions.height % cellSize);

cnv.style.width = cnv.width + "px";
cnv.style.height = cnv.height + "px";

const gridWidth = cnv.width / cellSize;
const gridHeight = cnv.height / cellSize;

let paused = true;
emptyGrid = size => new Uint32Array(size);

// Grid
const gridSize = gridWidth * gridHeight;
let grid = emptyGrid(gridSize);

// Vectors for staggered grid
const uGridSize = (gridWidth + 1) * gridHeight;
const vGridSize = (gridWidth + 1) * gridHeight;
let uGrid = emptyGrid(uGridSize);
let vGrid = emptyGrid(vGridSize);

setElem = (g, x, y, val) => {
    x = ((x % gridWidth) + gridWidth) % gridWidth;
    y = ((y % gridHeight) + gridHeight) % gridHeight;
    g[y * gridWidth + x] = val;
}

getElem = (g, x, y) => {
    x = ((x % gridWidth) + gridWidth) % gridWidth;
    y = ((y % gridHeight) + gridHeight) % gridHeight;
    return g[y * gridWidth + x];
}

// sets 4 vectors adjacent to cell (i, j)
getCellVectors = (i, j, uL, vD, uR, vU) => {
    setElem(uGrid, i, j, uL);
    setElem(vGrid, i, j, vD);
    setElem(uGrid, i+1, j, uR);
    setElem(vGrid, i, j+1, vU);
}

// returns 4 vectors adjacent to cell (i, j)
getCellVectors = (i, j) => {
    return {
        uLeft: getElem(uGrid, i, j),
        vDown: getElem(vGrid, i, j),
        uRight: getElem(uGrid, i+1, j),
        vUp: getElem(vGrid, i, j+1)
    };
}

function render() {
    ctx.clearRect(0, 0, cnv.width, cnv.height);

    // render elements
}

function drawCell(x, y, hue) {
    // code to draw cell
}

function simulate() {
    // simulate fluid
}

function update() {
    simulate();
    render();
    // requestionAnimationFrame(update);
}

update();
