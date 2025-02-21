const cnv = document.getElementById("myCanvas");
const ctx = cnv.getContext("2d");
const workOptions = document.getElementById("work-options").getBoundingClientRect();

const CELL_SIZE = 10;

let cnvWidth = window.innerWidth - workOptions.width;
cnv.width = cnvWidth - (Math.floor(cnvWidth) % CELL_SIZE);
cnv.height = workOptions.height - (Math.floor(workOptions.height) % CELL_SIZE);

cnv.style.width = cnv.width + "px";
cnv.style.height = cnv.height + "px";

const FIELD_WIDTH = cnv.width / CELL_SIZE;
const FIELD_HEIGHT = cnv.height / CELL_SIZE;

let paused = true;

// Fields
// NOTE: when displayed, fields use non-inverted y-axis (origin in bottom-left)
const fieldSize = FIELD_WIDTH * FIELD_HEIGHT;
let colors = new Uint32Array(fieldSize);    // holds cell colors in hexadecimal
let solids = new Uint32Array(fieldSize);    // 0 = solid/wall; 1 = open/fluid

const uFieldSize = (FIELD_WIDTH + 1) * FIELD_HEIGHT;
const vFieldSize = FIELD_WIDTH * (FIELD_HEIGHT + 1);
let u_field = new Float32Array(uFieldSize); // horizontal components for each cell
let v_field = new Float32Array(vFieldSize); //   vertical components for each cell
let u_field_next = new Float32Array(uFieldSize);
let v_field_next = new Float32Array(vFieldSize);

// convert 2d coords to 1d array index
const IND   = (x, y) => y * FIELD_WIDTH + x;
const IND_U = (x, y) => y * (FIELD_WIDTH + 1) + x;
const IND_V = (x, y) => y * FIELD_WIDTH + x;

// --- SIMULATION CODE ---

const dt = 1 / 60.0; // delta t = time step
const overrelax = 1.9;

// add forces
function addForces() {
    v_field[IND_V(35, 1)] = 20.0;
    v_field[IND_V(50, FIELD_HEIGHT-1)] = 15.0;
}

// maintain div(u) = 0
function solveDivergence() {
    u_field_next.set(u_field);
    v_field_next.set(v_field);

    // update cell divergence via red-black Gauss-Seidel
    const offsets = [0b00, 0b11, 0b01, 0b10];
    for (let i = 0; i < 4; ++i) {

        let y = (offsets[i] & 0b10) >> 1;
        for (; y < FIELD_HEIGHT; y += 2) {

            let x = offsets[i] & 0b01;
            for (; x < FIELD_WIDTH; x += 2) {
                if (solids[IND(x, y)] == 0) continue;

                const u_left  = u_field[IND_U(x,   y)];
                const v_down  = v_field[IND_V(x,   y)];
                const u_right = u_field[IND_U(x+1, y)];
                const v_up    = v_field[IND_V(x,   y+1)];
                const div = overrelax*(u_right - u_left + v_up - v_down);

                const s_left  = solids[IND(x-1, y)];
                const s_down  = solids[IND(x, y-1)];
                const s_right = solids[IND(x+1, y)];
                const s_up    = solids[IND(x, y+1)];
                const s_total = s_left + s_down + s_right + s_up;

                u_field_next[IND_U(x,   y)] = u_left  + div * (s_left  / s_total);
                u_field_next[IND_U(x+1, y)] = u_right - div * (s_right / s_total);
                v_field_next[IND_V(x,   y)] = v_down  + div * (s_down  / s_total);
                v_field_next[IND_V(x, y+1)] = v_up    - div * (s_up    / s_total);
            }

        }

        u_field.set(u_field_next);
        v_field.set(v_field_next);
    }
}

function advectVelocities() {
    u_field_next.set(u_field);
    v_field_next.set(v_field);

    for (let y = 0; y < FIELD_HEIGHT; ++y) {
        for (let x = 0; x < FIELD_WIDTH; ++x) {
            if (solids[IND(x, y)] == 0) continue;

            // u component
        }
    }

    u_field.set(u_field_next);
    v_field.set(v_field_next);
}

function sampleFrom(field, coord_x, coord_y) {
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

// --- SIM LOOP FUNCTIONS ---

// initialize simulator conditions
function initSim() {
    // solid boundaries, fill solids with 1s beforehand
    solids.fill(1);

    for (let x = 0; x < FIELD_WIDTH; ++x)
        solids[IND(x, 0)] = 0;

    for (let x = 0; x < FIELD_WIDTH; ++x)
        solids[IND(x, FIELD_HEIGHT-1)] = 0;

    for (let y = 0; y < FIELD_HEIGHT; ++y)
        solids[IND(0, y)] = 0;

    for (let y = 0; y < FIELD_HEIGHT; ++y)
        solids[IND(FIELD_WIDTH-1, y)] = 0;

    // initial velocities
    u_field[IND_U(1, 25)] = 10.0;
    // u_field[IND_U(FIELD_WIDTH-1, 20)] = 20.0;

    // gravity
    // for (let i = 0; i < vFieldSize; ++i) {
    //     v_field[i] -= 9.8*dt;
    // }
}

function drawCell(x, y, val) {
    // NOTE: slice will cut off non-zero hex digits if val > 0xFFFFFF
    const color = ("000000" + val.toString(16)).slice(-6);
    ctx.fillStyle = "#" + color;
    // NOTE: idk why CELL_SIZE has to be subtracted twice, but the cells are
    // shifted down without it
    ctx.fillRect(x*CELL_SIZE, cnv.height - y*CELL_SIZE - CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function render() {
    ctx.clearRect(0, 0, cnv.width, cnv.height);

    // render field cells
    for (let y = 0; y < FIELD_HEIGHT; ++y) {
        for (let x = 0; x < FIELD_WIDTH; ++x) {
            const u_comp = u_field[IND_U(x, y)];
            const v_comp = v_field[IND_V(x, y)];
            colors[IND(x, y)] = density2color(calcDensity(u_comp, v_comp));
            // console.log(getCell(colors, x, y).toString(16));
            drawCell(x, y, colors[IND(x, y)]);
        }
    }
}

// simulate fluid
function simulate() {
    addForces();
    solveDivergence();
    // advectVelocities();
    // advectDensities();
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

const v_up = document.getElementById("v_up");
const u_left = document.getElementById("u_left");
const v_down = document.getElementById("v_down");
const u_right = document.getElementById("u_right");
cnv.addEventListener("mousemove", event => {
    const rect = cnv.getBoundingClientRect();
    const mouseX = Math.floor(event.clientX - rect.left);
    const mouseY = Math.floor(rect.bottom - event.clientY);
    const fieldX = Math.floor(mouseX / CELL_SIZE);
    const fieldY = Math.floor(mouseY / CELL_SIZE);
});

initSim();
render(); // intial render, first update triggered when simulation unpaused
