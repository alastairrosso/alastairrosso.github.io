const cnv = document.getElementById("myCanvas");
const ctx = cnv.getContext("2d");
const ui = document.getElementById("work-ui").getBoundingClientRect();

cnv.width = window.innerWidth - ui.width;
// cnv.height = window.innerHeight - 200;
cnv.height = ui.height;

const MARK_LENGTH = 10;
const MARK_WIDTH = 1;
const X_SCALE = 24; // X_SCALE px = 1 graph unit
const Y_SCALE = 20; // Y_SCALE px = 1 graph unit
const ORIGIN_X = (cnv.width / 3) - (cnv.width / 3) % X_SCALE;
const ORIGIN_Y = (cnv.height / 2) - (cnv.height / 2) % Y_SCALE;
const X_MIN = -ORIGIN_X / X_SCALE;
const X_MAX = (cnv.width - ORIGIN_X) / X_SCALE;
const Y_MIN = -ORIGIN_Y / Y_SCALE;
const Y_MAX = (cnv.height - ORIGIN_Y) / Y_SCALE;

// example function with bounds [a, b]
a = 1;
b = 20;
f = x => 1.5*Math.sin(x) - (1/3)*x + 10.0;
// f = x => 10*Math.pow(Math.E, -0.07*x);

// n trapezoids to draw under curve
const n_value = document.getElementById("n-value");
n = n_value.value = 8; // default value
n_value.addEventListener("input", (e) => {
    n = e.target.value;
    update();
});

// centroid calculation

function centroid(f, a, b, n) {
    let d = (b-a)/n;
    let x_bar = 0;
    let y_bar = 0;
    let sum_A_trap = sumTrapArea(f, a, b, n);

    let sum_Ax = 0;
    for (let i = 0; i < n; i++) {
        let A_trap = trapArea(f, a + d*i, a + d*(i+1));
        let x_bar_trap = trapXBar(f, a + d*i, a + d*(i+1));
        sum_Ax += A_trap * x_bar_trap;
    }
    x_bar = sum_Ax / sum_A_trap;

    let sum_Ay = 0;
    for (let i = 0; i < n; i++) {
        let A_trap = trapArea(f, a + d*i, a + d*(i+1));
        let y_bar_trap = trapYBar(f, a + d*i, a + d*(i+1));
        sum_Ay += A_trap * y_bar_trap;
    }
    y_bar = sum_Ay / sum_A_trap;

    return [x_bar, y_bar];
}

function trapXBar(f, p, q) {
    let quot = (f(p) + 2*f(q)) / (f(p) + f(q));
    return p + (1/3)*(q - p)*quot;
}

function trapYBar(f, p, q) {
    let quot = (f(p)*f(p) + f(p)*f(q) + f(q)*f(q)) / (f(p) + f(q));
    return (1/3) * quot;
}

function trapArea(f, p, q) {
    return 0.5 * (q - p) * (f(p) + f(q));
}

function sumTrapArea(f, a, b, n) {
    let sum = 0;
    let d = (b-a)/n;
    for (let i = 0; i < n; i++) {
        sum += trapArea(f, a + d*i, a + d*(i+1));
    }
    return sum;
}

// rendering

function drawAxes() {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;

    // x axis
    ctx.beginPath();
    ctx.moveTo(0, ORIGIN_Y);
    ctx.lineTo(cnv.width, ORIGIN_Y);
    ctx.stroke();

    // y axis
    ctx.beginPath();
    ctx.moveTo(ORIGIN_X, 0);
    ctx.lineTo(ORIGIN_X, cnv.height);
    ctx.stroke();
}

function drawMark(value, yAxis) {
    if (!yAxis) {
        ctx.fillRect(ORIGIN_X + value, ORIGIN_Y - MARK_LENGTH/2, MARK_WIDTH, MARK_LENGTH);
    } else {
        ctx.fillRect(ORIGIN_X - MARK_LENGTH/2, ORIGIN_Y - value, MARK_LENGTH, MARK_WIDTH);
    }
}

function drawMarks(color) {
    ctx.fillStyle = color;
    // x-axis marks
    for (let i = X_MIN; i <= X_MAX; i++) {
        drawMark(i*X_SCALE, false);
    }

    // y-axis marks
    for (let i = Y_MIN; i <= Y_MAX; i++) {
        drawMark(i*Y_SCALE, true);
    }
}

function drawCentroid(x_bar, y_bar, color) {
    ctx.fillStyle = color;
    let px_bar = ORIGIN_X + X_SCALE*x_bar;
    let py_bar = ORIGIN_Y - Y_SCALE*y_bar;
    ctx.fillRect(px_bar-4, py_bar-4, 8, 8);
}

function drawFArea(a, b, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ORIGIN_X + X_SCALE*a, ORIGIN_Y + Y_SCALE*-f(a));

    for (let px = X_SCALE*a; px <= X_SCALE*b; px++) {
        ctx.lineTo(ORIGIN_X + px, ORIGIN_Y - Y_SCALE*f(px / X_SCALE));
    }

    ctx.lineTo(ORIGIN_X + X_SCALE*b, ORIGIN_Y);
    ctx.lineTo(ORIGIN_X + X_SCALE*a, ORIGIN_Y);
    ctx.fill();
}

function drawF(a, b, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(ORIGIN_X + X_SCALE*a, ORIGIN_Y + Y_SCALE*-f(a));

    for (let px = X_SCALE*a; px <= X_SCALE*b; px++) {
        ctx.lineTo(ORIGIN_X + px, ORIGIN_Y - Y_SCALE*f(px / X_SCALE));
    }

    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.stroke();
}

function drawVLine(x, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(ORIGIN_X + X_SCALE*x, 0);
    ctx.lineWidth = 5;
    ctx.lineTo(ORIGIN_X + X_SCALE*x, cnv.height);
    ctx.stroke();
}

function drawTraps(a, b, n, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ORIGIN_X + X_SCALE*a, ORIGIN_Y + Y_SCALE*-f(a));

    let d = (b-a)/n;

    // +0.005 to account for floating point error - does not affect area calcs
    for (let px = X_SCALE*a; px <= X_SCALE*b + 0.005; px += X_SCALE*d) {
        ctx.lineTo(ORIGIN_X + px, ORIGIN_Y - Y_SCALE*f(px / X_SCALE));
    }

    ctx.lineTo(ORIGIN_X + X_SCALE*b, ORIGIN_Y);
    ctx.lineTo(ORIGIN_X + X_SCALE*a, ORIGIN_Y);
    ctx.fill();
}

function render() {
    drawAxes();
    drawMarks("#ffffff");

    drawFArea(a, b, "rgba(255, 0, 0, 0.5)");
    drawTraps(a, b, n, "rgba(0, 255, 0, 0.25)");
    drawF(a, b, "#00cc00");
    drawVLine(a, "#cc0000");
    drawVLine(b, "#0000cc");

    let cent = centroid(f, a, b, n);
    drawCentroid(cent[0], cent[1], "#ffffff");
}

function update() {
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    requestAnimationFrame(render);
}

update();
