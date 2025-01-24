const cnv = document.getElementById("myCanvas");
const ctx = cnv.getContext("2d");
const workOptions = document.getElementById("work-options").getBoundingClientRect();

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
// NOTE: when displayed, grid uses non-inverted y-axis (origin in bottom-left)
const gridSize = gridWidth * gridHeight;
let grid = emptyGrid(gridSize);

setCell = (g, x, y, val) => {
    x = ((x % gridWidth) + gridWidth) % gridWidth;
    y = ((y % gridHeight) + gridHeight) % gridHeight;
    g[y * gridWidth + x] = val;
}

getCell = (g, x, y) => {
    x = ((x % gridWidth) + gridWidth) % gridWidth;
    y = ((y % gridHeight) + gridHeight) % gridHeight;
    return g[y * gridWidth + x];
}

// Simulation Code



// Sim Loop Functions

function drawCell(x, y, val) {
    ctx.fillStyle = "#" + val.toString(16);
    ctx.fillRect(x*cellSize, cnv.height - y*cellSize, cellSize, cellSize);
}

function render() {
    ctx.clearRect(0, 0, cnv.width, cnv.height);

    // render grid cells
    for (let y = 0; y < gridHeight; ++y) {
        for (let x = 0; x < gridWidth; ++x) {
            drawCell(x, y, getCell(grid, x, y));
        }
    }
}

// simulate fluid
function simulate() {
    // generate achromatic palette (just visualizing grid for now)
    let palette = 0x000000;
    let count = 0;

    for (let y = 0; y < gridHeight; ++y) {
        for (let x = 0; x < gridWidth; ++x) {
            setCell(grid, x, y, palette);
            let tri = (palette & 0xff);
            if (count % 30 == 0) tri += 0x02;
            palette = (tri << 16) | (tri << 8) | tri;
            count++;
        }
    }
}

function update() {
    simulate();
    render();
    // requestionAnimationFrame(update);
}

update();
