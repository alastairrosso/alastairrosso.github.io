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
    // below commented lines used for wrapping environment to opposite border
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

const dt = 1 / 60.0; // delta t = time step
const overrelax = 1.9;
const edge_left  = (x, y) => 0.5 * (getCell(u_field_prev, x, y) + getCell(u_field_prev, x-1, y));
const edge_right = (x, y) => 0.5 * (getCell(u_field_prev, x, y) + getCell(u_field_prev, x+1, y));
const edge_up    = (x, y) => 0.5 * (getCell(v_field_prev, x, y) + getCell(v_field_prev, x, y+1));
const edge_down  = (x, y) => 0.5 * (getCell(v_field_prev, x, y) + getCell(v_field_prev, x, y-1));

// maintain div(u) = 0
function solveDivergence() {
    u_field_prev = u_field;
    v_field_prev = v_field;

    for (let y = 1; y < gridHeight-1; ++y) {
        for (let x = 1; x < gridWidth-1; ++x) {
            if (getCell(solids, x, y) == 1) {
                const div = overrelax * calcDivergence(x, y);
                const neighbors = countSolids(x, y);

                const left  = edge_left(x, y)  + div*(getCell(solids, x-1, y) / neighbors);
                const right = edge_right(x, y) - div*(getCell(solids, x+1, y) / neighbors);
                const down  = edge_down(x, y)  + div*(getCell(solids, x, y-1) / neighbors);
                const up    = edge_up(x, y)    - div*(getCell(solids, x, y+1) / neighbors);

                const u_new = 0.5 * (left + right);
                const v_new = 0.5 * (up + down);
                setCell(u_field, x, y, u_new);
                setCell(v_field, x, y, v_new);

                setCell(grid, x, y, density2color(calcDensity(x, y)));
            }
        }
    }
}

function calcDivergence(x, y) {
    const left  = edge_left(x, y);
    const right = edge_right(x, y);
    const up    = edge_up(x, y);
    const down  = edge_down(x, y);
    return right - left + up - down;
}

function countSolids(x, y) {
    const left  = getCell(solids, x-1, y);
    const right = getCell(solids, x+1, y);
    const up    = getCell(solids, x, y+1);
    const down  = getCell(solids, x, y-1);
    return left + right + up + down;
}

function calcDensity(x, y) {
    const u = getCell(u_field, x, y);
    const v = getCell(v_field, x, y);
    const res = Math.hypot(u, v);
    const u_norm = Math.sign(u) * Math.min(Math.abs(u / res), Math.abs(u));
    const v_norm = Math.sign(v) * Math.min(Math.abs(v / res), Math.abs(v));
    return Math.hypot(u_norm, v_norm);
}

function density2color(density) {
    let tri = 0xff * density;
    return (tri << 16) | (tri << 8) | tri;
}

// move velocities within grid/field
// TODO: doesn't actually work
function advectVelocities() {
    u_field_prev = u_field;
    v_field_prev = v_field;

    for (let y = 1; y < gridHeight-1; ++y) {
        for (let x = 1; x < gridWidth-1; ++x) {
            if (getCell(solids, x, y) == 1) {
                // get previous velocity's on-screen position
                const u_coord_x = x*cellSize - (0.5*cellSize);
                const v_coord_y = y*cellSize - (0.5*cellSize);
                const u_prev_coord_x = u_coord_x - dt*getCell(u_field_prev, x, y);
                const v_prev_coord_y = v_coord_y - dt*getCell(v_field_prev, x, y);

                const vel_prev = interpolateVelocity(u_prev_coord_x, v_prev_coord_y);
                setCell(u_field, x, y, vel_prev[0]);
                setCell(v_field, x, y, vel_prev[1]);
            }
        }
    }
}

// unoptimized, task for future me
function interpolateVelocity(coord_x, coord_y) {
    // vel1  |  vel2
    // ------|------
    // vel3  |  vel4

    // find vel1, vel2, vel3, vel4 indices (x, y)
    const vel1_x = Math.floor((coord_x - cellSize/2) / cellSize);
    const vel1_y = Math.ceil((coord_y - cellSize/2) / cellSize);

    const vel2_x = Math.ceil((coord_x - cellSize/2) / cellSize);
    const vel2_y = Math.ceil((coord_y - cellSize/2) / cellSize);

    const vel3_x = Math.floor((coord_x - cellSize/2) / cellSize);
    const vel3_y = Math.floor((coord_y - cellSize/2) / cellSize);

    const vel4_x = Math.ceil((coord_x - cellSize/2) / cellSize);
    const vel4_y = Math.floor((coord_y - cellSize/2) / cellSize);

    // get u_field and v_field values for vel1, vel2, vel3, vel4
    const vel1_u = getCell(u_field, vel1_x, vel1_y);
    const vel1_v = getCell(v_field, vel1_x, vel1_y);

    const vel2_u = getCell(u_field, vel2_x, vel2_y);
    const vel2_v = getCell(v_field, vel2_x, vel2_y);

    const vel3_u = getCell(u_field, vel3_x, vel3_y);
    const vel3_v = getCell(v_field, vel3_x, vel3_y);

    const vel4_u = getCell(u_field, vel4_x, vel4_y);
    const vel4_v = getCell(v_field, vel4_x, vel4_y);

    // calc vel1, vel2, vel3, vel4 coords
    // (only 2 of these are actually needed)
    const vel1_coord_x = vel1_x*cellSize + cellSize/2;
    // const vel1_coord_y = vel1_y*cellSize + cellSize/2;

    // const vel2_coord_x = vel2_x*cellSize + cellSize/2;
    // const vel2_coord_y = vel2_y*cellSize + cellSize/2;

    // const vel3_coord_x = vel3_x*cellSize + cellSize/2;
    const vel3_coord_y = vel3_y*cellSize + cellSize/2;

    // const vel4_coord_x = vel4_x*cellSize + cellSize/2;
    // const vel4_coord_y = vel4_y*cellSize + cellSize/2;

    // weight vel1, vel2, vel3, vel4; average them; return;
    const dx = coord_x - vel1_coord_x;
    const dy = coord_y - vel3_coord_y;
    const wx = dx / cellSize;
    const wy = dy / cellSize;
    const wx_inv = 1 - wx;
    const wy_inv = 1 - wy;

    const u_prev = vel1_u*wx_inv*wy     + vel2_u*wx*wy
                 + vel3_u*wx_inv*wy_inv + vel4_u*wx*wy_inv;
    const v_prev = vel1_v*wx_inv*wy     + vel2_v*wx*wy
                 + vel3_v*wx_inv*wy_inv + vel4_v*wx*wy_inv;
    
    return [u_prev, v_prev];
}

// --- SIM LOOP FUNCTIONS ---

// initialize simulator conditions
function initSim() {
    // set solids to 1s
    for (let i = 0; i < solids.length; ++i)
        solids[i] = 1;

    // border cells
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

    // turbine
    setCell(u_field, 0, 15, dt*100.0);
    setCell(u_field, 0, 16, dt*100.0);
    setCell(u_field, 0, 17, dt*100.0);
    setCell(u_field, 0, 18, dt*100.0);
    setCell(u_field, 0, 19, dt*100.0);

    // just some extra starting force
    setCell(u_field, 10, 25, dt*500.0);
    setCell(v_field, 10, 25, dt*500.0);
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
    // let palette = 0x000000;
    // let count = 0;

    // for (let y = 0; y < gridHeight; ++y) {
    //     for (let x = 0; x < gridWidth; ++x) {
    //         if (getCell(solids, x, y) == 0) continue;
    //         // NOTE: grid array holds color hex values for now, densities later
    //         setCell(grid, x, y, palette);
    //         let tri = (palette & 0xff);
    //         if (count % 30 == 0) tri += 0x02;
    //         palette = (tri << 16) | (tri << 8) | tri;
    //         count++;
    //     }
    // }

    // actual process

    // addForces();
    solveDivergence();
    advectVelocities();
}

function update() {
    if (paused) return;
    simulate();
    render();
    requestAnimationFrame(update);
}

// --- CONTROLS AND EVENTS ---

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

const eventKeyDown = event => {
    switch (event.key) {
        case 'p':
            togglePause();
            break;
        case 'f':
            simulate();
            render();
            break;
    }
};

initSim();
document.addEventListener('keydown', eventKeyDown);
render(); // intial render, first update triggered when simulation unpaused
