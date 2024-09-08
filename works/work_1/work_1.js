const cnv = document.getElementById("myCanvas");
const ctx = cnv.getContext("2d");

const workWindow = document.getElementById("work-section").getBoundingClientRect();
let cnvTop = cnv.getBoundingClientRect().top;
let cnvLeft = cnv.getBoundingClientRect().left;
let cnvStyleWidth = Math.floor(cnv.getBoundingClientRect().width);
let cnvStyleHeight = Math.floor(cnv.getBoundingClientRect().height);
const workOptions = document.getElementById("work-options").getBoundingClientRect();

const cellSize = 8;

let cnvWidth = window.innerWidth - workOptions.width;
cnv.width = cnvWidth - (cnvWidth % cellSize);
cnv.height = workOptions.height - (workOptions.height % cellSize);

cnv.style.width = cnv.width + "px";
cnv.style.height = cnv.height + "px";

const gridWidth = cnv.width / cellSize;
const gridHeight = cnv.height / cellSize;

let paused = true;

let ruleBirth = 0x04;   // preset to
let ruleSurvive = 0x06; // Conway's Game of Life B3/S23

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

// Mouse & Brush Controls

let mouseMode = -1;
let brushSize = 3;
const brushBounds = [0,0,0,0];
const updateBrushBounds = (gX=gridX, gY=gridY) => {
    brushBounds[0] = gX - (brushSize-1) * cellSize / 2;
    brushBounds[1] = gY - (brushSize-1) * cellSize / 2,
    brushBounds[2] = brushSize * cellSize,
    brushBounds[3] = brushSize * cellSize
};

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

function clearGrid() {
    grid = emptyGrid();
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

function drawBrush(gridX, gridY) {
    ctx.strokeStyle = "#ffffff";
    updateBrushBounds(gridX, gridY);
    ctx.strokeRect(
        brushBounds[0],
        brushBounds[1],
        brushBounds[2],
        brushBounds[3]
    );
}

function update() {
    if (paused) return;
    simulate();
    render();
    requestAnimationFrame(update);
}

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

    if (getBit(ruleBirth, neighbors) === 1)
        return 1;
    else if (getCell(grid, x, y) > 0 && getBit(ruleSurvive, neighbors) === 1)
        return 1;
    else
        return 0;
}

getBit = (mask, bitNum) => (mask >>> (bitNum-1)) & 0x1;

function changeBirth(num) {
    if (num.checked) {
        ruleBirth |= 1 << (Number(num.value)-1);
    } else {
        ruleBirth &= ~(1 << (Number(num.value)-1));
    }
}

function changeSurvive(num) {
    if (num.checked) {
        ruleSurvive |= 1 << (Number(num.value)-1);
    } else {
        ruleSurvive &= ~(1 << (Number(num.value)-1));
    }
}

function drawCell(x, y, value) {
    if (value > 0)
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    else
        ctx.clearRect(x * cellSize, y * cellSize, cellSize, cellSize);
}

// Event Listeners

const eventKeyDown = event => {
    switch (event.key) {
        case 'p':
            togglePause();
            break;
        case 'f':
            toggleFrame();
            break;
    }
};

const eventMouseDown = event => {
    let cellVal = -1;

    switch (event.button) {
        case 0:
            mouseMode = 0;
            cellVal = 1;
            break;
        case 2:
            mouseMode = 2;
            cellVal = 0;
            break;
        default:
            mouseMode = -1;
            console.log("Unexpected mouse input: " + event.button);
            break;
    }
    
    if (cellVal != -1) {
        let gridI = gridX/cellSize - Math.floor(brushSize/2);
        let gridJ = gridY/cellSize - Math.floor(brushSize/2);
        const gridW = gridI + brushSize;
        const gridH = gridJ + brushSize;

        for (let x = gridI; x < gridW; ++x) {
            for (let y = gridJ; y < gridH; ++y) {
                setCell(grid, x, y, cellVal);
            }
        }
    }

    // setCell(grid, gridX/cellSize, gridY/cellSize, cellVal);
    render();
};

const eventMouseUp = event => {
    mouseMode = -1;
};

const eventMouseMove = event => {
    let rect = cnv.getBoundingClientRect();
    let mouseX = Math.floor(event.clientX - rect.left);
    let mouseY = Math.floor(event.clientY - rect.top);
    gridX = mouseX - (mouseX % cellSize);
    gridY = mouseY - (mouseY % cellSize);

    let cellVal = -1;

    switch (mouseMode) {
        case 0:
            cellVal = 1;
            break;
        case 2:
            cellVal = 0;
            break;
    }

    if (cellVal != -1) {
        let gridI = gridX/cellSize - Math.floor(brushSize/2);
        let gridJ = gridY/cellSize - Math.floor(brushSize/2);
        const gridW = gridI + brushSize;
        const gridH = gridJ + brushSize;

        for (let x = gridI; x < gridW; ++x) {
            for (let y = gridJ; y < gridH; ++y) {
                setCell(grid, x, y, cellVal);
            }
        }
    }

    render();
};

const eventWheel = event => {
    if (event.deltaY > 0 && brushSize > 1) {
        brushSize -= 2;
    } else if (event.deltaY < 0 && brushSize <= 21) {
        brushSize += 2;
    }

    updateBrushBounds();
    render();
};

document.addEventListener('keydown', eventKeyDown);
cnv.addEventListener('mousedown', eventMouseDown);
cnv.addEventListener('mouseup', eventMouseUp);
cnv.addEventListener('mousemove', eventMouseMove);
cnv.addEventListener('wheel', eventWheel);

// glider pattern
setCell(grid, 2, 2, 1);
setCell(grid, 3, 3, 1);
setCell(grid, 3, 4, 1);
setCell(grid, 2, 4, 1);
setCell(grid, 1, 4, 1);

render();
