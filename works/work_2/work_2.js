const cnv = document.getElementById("myCanvas");
const ctx = cnv.getContext("2d");
const workOptions = document.getElementById("work-options").getBoundingClientRect();

const cellSize = 10;

let cnvWidth = window.innerWidth - workOptions.width;
cnv.width = cnvWidth - (Math.floor(cnvWidth) % cellSize);
cnv.height = workOptions.height - (Math.floor(workOptions.height) % cellSize);

cnv.style.width = cnv.width + "px";
cnv.style.height = cnv.height + "px";

const gridWidth = cnv.width / cellSize;
const gridHeight = cnv.height / cellSize;

let paused = true;

// delta t = time step
const dt = 1 / 60.0;

// Grid
// NOTE: when displayed, grid uses non-inverted y-axis (origin in bottom-left)
const gridSize = gridWidth * gridHeight;
let grid = new Uint32Array(gridSize);
let solids = new Uint32Array(gridSize);   // 0 = solid/wall; 1 = open/fluid
let u_field_prev = null;
let v_field_prev = null;
let u_field = new Float32Array(gridSize); // horizontal components for each cell
let v_field = new Float32Array(gridSize); //   vertical components for each cell

setCell = (g, x, y, val) => {
    // x = ((x % gridWidth) + gridWidth) % gridWidth;
    // y = ((y % gridHeight) + gridHeight) % gridHeight;
    g[y * gridWidth + x] = val;
}

getCell = (g, x, y) => {
    // x = ((x % gridWidth) + gridWidth) % gridWidth;
    // y = ((y % gridHeight) + gridHeight) % gridHeight;
    return g[y * gridWidth + x];
}

// --- SIMULATION CODE ---

// maintain div(u) = 0
function solveDivergence() {
    for (let y = 1; y < gridHeight-1; ++y) {
        for (let x = 1; x < gridWidth-1; ++x) {
            let div = calcDivergence(x, y);
        }
    }
}

function calcDivergence(x, y) {
    let div = 0;
    return div;
}

function advectVelocities() {
    //
}

// --- SIM LOOP FUNCTIONS ---

// initialize simulator conditions
function initSim() {
    // set solids to 1s
    for (let i = 0; i < solids.length; ++i)
        solids[i] = 1;

    for (let x = 0; x < gridWidth; ++x) {
        setCell(solids, x, 0, 0);
        setCell(grid,   x, 0, 0x000000);
        setCell(solids, x, gridHeight - 1, 0);
        setCell(grid,   x, gridHeight - 1, 0x000000);
    }

    for (let y = 0; y < gridHeight; ++y) {
        setCell(solids, 0, y, 0);
        setCell(grid,   0, y, 0x000000);
        setCell(solids, gridWidth - 1, y, 0);
        setCell(grid,   gridWidth - 1, y, 0x000000);
    }
}

function drawCell(x, y, val) {
    // NOTE: slice will cut off non-zero hex digits if val > 0xFFFFFF
    const color = ("000000" + val.toString(16)).slice(-6);
    ctx.fillStyle = "#" + color;
    // NOTE: idk why cellSize has to be subtracted twice, but the cells are
    // shifted down without it
    ctx.fillRect(x*cellSize, cnv.height - y*cellSize - cellSize, cellSize, cellSize);
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
            if (getCell(solids, x, y) == 0) continue;
            // NOTE: grid array holds color hex values for now, densities later
            setCell(grid, x, y, palette);
            let tri = (palette & 0xff);
            if (count % 30 == 0) tri += 0x02;
            palette = (tri << 16) | (tri << 8) | tri;
            count++;
        }
    }

    // actual process

    // addForces();
    solveDivergence();
    advectVelocities();
}

function update() {
    simulate();
    render();
    // requestionAnimationFrame(update);
}

initSim();
update();
