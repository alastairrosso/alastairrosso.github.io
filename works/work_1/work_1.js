const cnv = document.getElementById("myCanvas");
const ctx = cnv.getContext("2d");

const cellSize = 10;
const cellRows = 80;
const cellCols = 45;
cnv.width = cellRows * cellSize;
cnv.height = cellCols * cellSize;

let paused = true;

emptyGrid = () => Array.from({ length: cellRows }, () => Array(cellCols).fill(0));

let grid = emptyGrid();

ctx.fillStyle = "#800000";

function togglePause() {
    paused = !paused;
    if (!paused) {
        update();
    }
}

function render() {
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    
    for (let i = 0; i < cellRows; i++) {
        for (let j = 0; j < cellCols; j++) {
            drawCell(i, j, grid[i][j]);
        }
    }

}

function update() {
    if (paused) return;
    simulate();
    render();
    requestAnimationFrame(update);
}

function simulate() {
    const newGrid = emptyGrid();

    for (let i = 0; i < cellRows; ++i) {
        for (let j = 0; j < cellCols; ++j) {
            newGrid[i][j] = calcCell(i, j);
        }
    }

    // grid[1][2] = 1;
    grid = newGrid;
}

function calcCell(i, j) {
    let neighbors = 0;
    for (let dx = -1; dx <= 1; ++dx) {
        for (let dy = -1; dy <= 1; ++dy) {
            if (dx == 0 && dy == 0) continue;
            const nx = ((i + dx) % cellRows + cellRows) % cellRows;
            const ny = ((j + dy) % cellCols + cellCols) % cellCols;
            if (grid[nx][ny] > 0) ++neighbors;
        }
    }

    if (grid[i][j] > 0 && (neighbors == 2 || neighbors == 3)) {
        return 1;
    } else if (grid[i][j] == 0 && neighbors == 3) {
        return 1;
    } else {
        return 0;
    }
}

function drawCell(cellRow, cellCol, value) {
    if (value > 0)
        ctx.fillRect(cellRow * cellSize, cellCol * cellSize, cellSize, cellSize);
    else
        ctx.clearRect(cellRow * cellSize, cellCol * cellSize, cellSize, cellSize);
}

document.addEventListener('keydown', event => {
    switch (event.key) {
        case 'p':
            togglePause();
            break;
        case 'f':
            simulate();
            render();
            break;
    }
});

// glider pattern
grid[1][2] = 1;
grid[2][3] = 1;
grid[2][4] = 1;
grid[1][4] = 1;
grid[0][4] = 1;

render();
