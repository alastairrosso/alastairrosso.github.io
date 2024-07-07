const cnv = document.getElementById("myCanvas");
const ctx = cnv.getContext("2d");

const workWindow = document.getElementById("work").getBoundingClientRect();
const cnvTop = cnv.getBoundingClientRect().top;
const cnvLeft = cnv.getBoundingClientRect().left;

const cellSize = 8;

const workOptions = document.getElementById("work-options").getBoundingClientRect();
const canvWidth = cnv.offsetWidth;
cnv.width = canvWidth - (canvWidth % cellSize);

const siteHeader = document.getElementById("site-header").getBoundingClientRect();
const canvHeight = cnv.offsetHeight;
cnv.height = canvHeight - (canvHeight % cellSize);

const gridWidth = cnv.width / cellSize;
const gridHeight = cnv.height / cellSize;

// window.addEventListener("resize", (event) => {});

let paused = true;

const gridSize = gridWidth * gridHeight;
emptyGrid = () => new Uint8Array(gridSize);
let grid = emptyGrid();

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

let gridX = 0;
let gridY = 0;

ctx.fillStyle = "#6bb2f0"; //"#a50000";

const pauseButton = document.getElementById("pause-button");
function togglePause() {
    paused = !paused;
    if (!paused) {
        pauseButton.innerHTML = "Stop";
        update();
    } else {
        pauseButton.innerHTML = "Start";
    }
}

function toggleFrame() {
    simulate();
    render();
}

function render() {
    ctx.clearRect(0, 0, cnv.width, cnv.height);

    for (let x = 0; x < gridWidth; ++x) {
        for (let y = 0; y < gridHeight; ++y) {
            drawCell(x, y, getCell(grid, x, y));
        }
    }

    drawBrush(gridX, gridY);
}

function update() {
    if (paused) return;
    simulate();
    render();
    requestAnimationFrame(update);
}

/**
 * TODO: fix this fucking boundary issue.
 */
function simulate() {
    const newGrid = emptyGrid();

    for (let x = 0; x < gridWidth; ++x) {
        for (let y = 0; y < gridHeight; ++y) {
            setCell(newGrid, x, y, calcCell(x, y));
        }
    }

    grid = newGrid;
}

function calcCell(x, y) {
    let neighbors = getCell(grid, x-1, y-1) + getCell(grid, x, y-1) + getCell(grid, x+1, y-1)
        + getCell(grid, x-1, y) + getCell(grid, x+1, y)
        + getCell(grid, x-1, y+1) + getCell(grid, x, y+1) + getCell(grid, x+1,y+1);

    if (neighbors == 3 || (neighbors == 2 && getCell(grid, x, y) > 0))
        return 1;
    else
        return 0;
}

function drawCell(x, y, value) {
    if (value > 0)
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    else
        ctx.clearRect(x * cellSize, y * cellSize, cellSize, cellSize);
}

document.addEventListener('keydown', event => {
    switch (event.key) {
        case 'p':
            togglePause();
            break;
        case 'f':
            toggleFrame();
            break;
    }
});

cnv.addEventListener('mousedown', event => {
    setCell(grid, gridX/cellSize, gridY/cellSize, 1);
    render();
    console.log(gridX/cellSize + " | " + gridY/cellSize);
});

document.addEventListener('mousemove', event => {
    let mouseX = Math.floor(event.x - cnvLeft);
    let mouseY = Math.floor(event.y - cnvTop);
    gridX = mouseX - (mouseX % cellSize);
    gridY = mouseY - (mouseY % cellSize);

    render();
});

function drawBrush(gridX, gridY) {
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(gridX, gridY, cellSize, cellSize);
}

// glider pattern
setCell(grid, 2, 2, 1);
setCell(grid, 3, 3, 1);
setCell(grid, 3, 4, 1);
setCell(grid, 2, 4, 1);
setCell(grid, 1, 4, 1);

render();
