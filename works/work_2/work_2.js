const cnv = document.getElementById("myCanvas");
const ctx = cnv.getContext("2d");
const workOptions = document.getElementById("work-options").getBoundingClientRect();

const cellSize = 10;
const halfCellSize = 0.5*cellSize;

let cnvWidth = window.innerWidth - workOptions.width;
cnv.width = cnvWidth - (Math.floor(cnvWidth) % cellSize);
cnv.height = workOptions.height - (Math.floor(workOptions.height) % cellSize);

cnv.style.width = cnv.width + "px";
cnv.style.height = cnv.height + "px";

const fieldWidth = cnv.width / cellSize;
const fieldHeight = cnv.height / cellSize;

let paused = true;

// Fields
// NOTE: when displayed, fields use non-inverted y-axis (origin in bottom-left)
const fieldSize = fieldWidth * fieldHeight;
let field = new Uint32Array(fieldSize);     // holds cell densities
let solids = new Uint32Array(fieldSize);    // 0 = solid/wall; 1 = open/fluid

// staggered grid sizes for u and v fields
const u_field_width = fieldSize + 1;
const u_field_height = fieldSize;
const u_field_size = u_field_width*u_field_height;
const v_field_width = fieldSize;
const v_field_height = fieldSize + 1;
const v_field_size = v_field_width*v_field_height;

let u_field = new Float32Array(u_field_size); // horizontal components for each cell
let v_field = new Float32Array(v_field_size); //   vertical components for each cell
let u_field_next = new Float32Array(u_field_size);
let v_field_next = new Float32Array(v_field_size);

setCell = (fd, x, y, data) => {fd[y * fieldWidth + x] = data};
getCell = (fd, x, y) => fd[y * fieldWidth + x];
setUCell = (fd, x, y, data) => {fd[y * u_field_width + x] = data};
getUCell = (fd, x, y) => fd[y * u_field_width + x];
setVCell = (fd, x, y, data) => {fd[y * v_field_width + x] = data};
getVCell = (fd, x, y) => fd[y * v_field_width + x];

// --- SIMULATION CODE ---

const dt = 1 / 60.0; // delta t = time step
const overrelax = 1.5;

// maintain div(u) = 0
function solveDivergence() {
    u_field_next.set(u_field);
    v_field_next.set(v_field);

    for (let y = 1; y < fieldHeight-1; ++y) {
        for (let x = 1; x < fieldWidth-1; ++x) {
            if (getCell(solids, x, y) == 0) continue;

            const u_left  = getUCell(u_field, x,   y);
            const u_right = getUCell(u_field, x+1, y);
            const v_up    = getVCell(v_field, x,   y+1);
            const v_down  = getVCell(v_field, x,   y);
            const div = overrelax * (u_right - u_left + v_up - v_down);
            
            const cell_left  = getCell(solids, x-1, y);
            const cell_right = getCell(solids, x+1, y);
            const cell_up    = getCell(solids, x, y+1);
            const cell_down  = getCell(solids, x, y-1);
            const neighbors = cell_left + cell_right + cell_up + cell_down;

            const du_left  = div * (cell_left  / neighbors);
            const du_right = div * (cell_right / neighbors);
            const dv_up    = div * (cell_up    / neighbors);
            const dv_down  = div * (cell_down  / neighbors);

            setUCell(u_field_next, x,   y,   getUCell(u_field_next, x,   y)   + du_left);
            setUCell(u_field_next, x+1, y,   getUCell(u_field_next, x+1, y)   - du_right);
            setVCell(v_field_next, x,   y+1, getVCell(v_field_next, x,   y+1) - dv_up);
            setVCell(v_field_next, x,   y,   getVCell(v_field_next, x,   y)   + dv_down);
        }
    }

    u_field.set(u_field_next);
    v_field.set(v_field_next);
}

function calcDensity(u, v) {
    const res = Math.hypot(u, v);
    const u_norm = Math.sign(u) * Math.min(Math.abs(u / res), Math.abs(u));
    const v_norm = Math.sign(v) * Math.min(Math.abs(v / res), Math.abs(v));
    return Math.hypot(u_norm, v_norm);
}

function density2color(density) {
    const tri = 0xff * density;
    return (tri << 16) | (tri << 8) | tri;
}

// move velocities within field
function advectVelocities() {
    u_field_next.set(u_field);
    v_field_next.set(v_field);

    for (let y = 1; y < fieldHeight-1; ++y) {
        for (let x = 1; x < fieldWidth-1; ++x) {
            if (getCell(solids, x, y) == 0) continue;
            
            if (getCell(solids, x-1, y) != 0 && x < u_field_width-1) {
                // u component
                // calc u's vertical component
                const u_v1 = getVCell(v_field, x-1, y+1);
                const u_v2 = getVCell(v_field, x,   y+1);
                const u_v3 = getVCell(v_field, x-1, y);
                const u_v4 = getVCell(v_field, x,   y);
                const u_v = 0.25 * (u_v1 + u_v2 + u_v3 + u_v4);

                // calc previous position = pos - dt * vel
                const u_Cx = x*cellSize;
                const u_Cy = y*cellSize;
                const u_prev_Cx = u_Cx - getUCell(u_field, x, y)*dt;
                const u_prev_Cy = u_Cy - u_v*dt;

                // find four surrounding velocities and
                // calc weighted average of previous velocity
                const u_prev_vel = interpolateVelU(u_prev_Cx, u_prev_Cy);
                setUCell(u_field_next, x, y, u_prev_vel);
            }

            if (getCell(solids, x-1, y) != 0 && x < u_field_width-1) {
                // v component
                // calc v's horizontal component
                const v_u1 = getUCell(u_field, x,   y);
                const v_u2 = getUCell(u_field, x+1, y);
                const v_u3 = getUCell(u_field, x,   y-1);
                const v_u4 = getUCell(u_field, x+1, y-1);
                const v_u = 0.25 * (v_u1 + v_u2 + v_u3 + v_u4);

                // calc previous position = pos - dt * vel
                const v_Cx = x*cellSize;
                const v_Cy = y*cellSize;
                const v_prev_Cx = v_Cx - v_u*dt;
                const v_prev_Cy = v_Cy - getVCell(v_field, x, y)*dt;

                // find four surrounding velocities and
                // calc weighted average of previous velocity
                const v_prev_vel = interpolateVelV(v_prev_Cx, v_prev_Cy);
                setVCell(v_field_next, x, y, v_prev_vel);
            }
        }
    }

    u_field.set(u_field_next);
    v_field.set(v_field_next);
}

function interpolateVelU(coord_x, coord_y) {
    const vel1_x = Math.floor((coord_x - halfCellSize) / cellSize);
    const vel1_y = Math.ceil(coord_y / cellSize);

    const vel2_x = Math.ceil((coord_x - halfCellSize) / cellSize);
    const vel2_y = Math.ceil(coord_y / cellSize);

    const vel3_x = Math.floor((coord_x - halfCellSize) / cellSize);
    const vel3_y = Math.floor(coord_y / cellSize);
    
    const vel4_x = Math.ceil((coord_x - halfCellSize) / cellSize);
    const vel4_y = Math.floor(coord_y / cellSize);

    // find dx and dy (x and y distances between velocities)
    const dx = coord_x - vel3_x*cellSize + halfCellSize;
    const dy = coord_y - vel3_y*cellSize;

    // weights for averaging
    const w_right = dx / cellSize;
    const w_left = 1 - w_right;
    const w_up = dy / cellSize;
    const w_down = 1 - w_up;

    const u_vel = getUCell(u_field, vel1_x, vel1_y)*w_left*w_up   + getUCell(u_field, vel2_x, vel2_y)*w_right*w_up
                + getUCell(u_field, vel3_x, vel3_y)*w_left*w_down + getUCell(u_field, vel4_x, vel4_y)*w_right*w_down;

    return u_vel;
}

function interpolateVelV(coord_x, coord_y) {
    const vel1_x = Math.floor(coord_x / cellSize);
    const vel1_y = Math.ceil((coord_y - halfCellSize) / cellSize);

    const vel2_x = Math.ceil(coord_x / cellSize);
    const vel2_y = Math.ceil((coord_y - halfCellSize) / cellSize);

    const vel3_x = Math.floor(coord_x / cellSize);
    const vel3_y = Math.floor((coord_y - halfCellSize) / cellSize);
    
    const vel4_x = Math.ceil(coord_x / cellSize);
    const vel4_y = Math.floor((coord_y - halfCellSize) / cellSize);

    // find dx and dy (x and y distances between velocities)
    const dx = coord_x - vel3_x*cellSize;
    const dy = coord_y - vel3_y*cellSize + halfCellSize;

    // weights for averaging
    const w_right = dx / cellSize;
    const w_left = 1 - w_right;
    const w_up = dy / cellSize;
    const w_down = 1 - w_up;

    const v_vel = getVCell(v_field, vel1_x, vel1_y)*w_left*w_up   + getVCell(v_field, vel2_x, vel2_y)*w_right*w_up
                + getVCell(v_field, vel3_x, vel3_y)*w_left*w_down + getVCell(v_field, vel4_x, vel4_y)*w_right*w_down;

    return v_vel;
}

function advectDensities() {
    for (let y = 1; y < fieldHeight-1; ++y) {
        for (let x = 1; x < fieldWidth-1; ++x) {
            if (getCell(solids, x, y) == 0) continue;

            const u_left  = getUCell(u_field, x,   y);
            const u_right = getUCell(u_field, x+1, y);
            const v_up    = getVCell(v_field, x,   y+1);
            const v_down  = getVCell(v_field, x,   y);
            const u = 0.5 * (u_left + u_right);
            const v = 0.5 * (v_up + v_down);

            setCell(field, x, y, Math.hypot(u, v));
            continue;
            // TODO: sort out the whole blowing up issue
            //       also find better way of interpreting density as color

            const Cx = x*cellSize + halfCellSize;
            const Cy = y*cellSize + halfCellSize;
            const prev_Cx = Cx - dt*u;
            const prev_Cy = Cy - dt*v;

            const prev_u = interpolateVelU(prev_Cx, prev_Cy);
            const prev_v = interpolateVelV(prev_Cx, prev_Cy);
            setCell(field, x, y, density2color(calcDensity(prev_u, prev_v)));
        }
    }
}

// --- SIM LOOP FUNCTIONS ---

// initialize simulator conditions
function initSim() {
    // set solids to 1s
    // TODO: replace with fill()
    for (let i = 0; i < solids.length; ++i)
        solids[i] = 1;

    // border cells
    for (let x = 0; x < fieldWidth; ++x) {
        setCell(solids, x, 0, 0);
        setCell(field,   x, 0, 0x000000);
        setCell(solids, x, fieldHeight - 1, 0);
        setCell(field,   x, fieldHeight - 1, 0x000000);
    }

    for (let y = 0; y < fieldHeight; ++y) {
        setCell(solids, 0, y, 0);
        setCell(field,   0, y, 0x000000);
        setCell(solids, fieldWidth - 1, y, 0);
        setCell(field,   fieldWidth - 1, y, 0x000000);
    }

    setUCell(u_field, 1, 15, 10.0);
    setUCell(u_field, 20, 35, 10.0);
    setVCell(v_field, 20, 35, -8.0);
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

    // render field cells
    for (let y = 0; y < fieldHeight; ++y) {
        for (let x = 0; x < fieldWidth; ++x) {
            drawCell(x, y, getCell(field, x, y));
        }
    }
}

// simulate fluid
function simulate() {
    // addForces();
    solveDivergence();
    advectVelocities();
    advectDensities();
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

document.addEventListener("keydown", event => {
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

initSim();
// document.addEventListener('keydown', eventKeyDown);
render(); // intial render, first update triggered when simulation unpaused
