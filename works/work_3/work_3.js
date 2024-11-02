const cnv = document.getElementById("myCanvas");
const ctx = cnv.getContext("2d");

cnv.width = window.innerWidth;
cnv.height = window.innerHeight - 200;

ctx.strokeStyle = "#ffffff";

// x axis
x_axis_pos = cnv.height / 2;
ctx.beginPath();
ctx.moveTo(0, x_axis_pos);
ctx.lineTo(cnv.width, x_axis_pos);
ctx.stroke();

// y axis
y_axis_pos = cnv.width / 3;
ctx.beginPath();
ctx.moveTo(y_axis_pos, 0);
ctx.lineTo(y_axis_pos, cnv.height);
ctx.stroke();

origin_x = y_axis_pos;
origin_y = x_axis_pos;
scale = 20; // scale px = 1 graph unit

// example function with bounds [a, b]
a = 1;
b = 20;
f = x => Math.sin(x) - 0.333*x + 10.0;
// f = x => 10*Math.pow(Math.E, -0.07*x);

// n trapezoids to draw under curve
n = 8;

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

function drawCentroid(x_bar, y_bar, color) {
    ctx.fillStyle = color;
    let px_bar = origin_x + scale*x_bar;
    let py_bar = origin_y - scale*y_bar;
    ctx.fillRect(px_bar-4, py_bar-4, 8, 8);
}

function drawFArea(a, b, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(origin_x + scale*a, origin_y + scale*-f(a));

    for (let px = scale*a; px <= scale*b; px++) {
        ctx.lineTo(origin_x + px, origin_y - scale*f(px / scale));
    }

    ctx.lineTo(origin_x + scale*b, origin_y);
    ctx.lineTo(origin_x + scale*a, origin_y);
    ctx.fill();
}

function drawF(a, b, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(origin_x + scale*a, origin_y + scale*-f(a));

    for (let px = scale*a; px <= scale*b; px++) {
        ctx.lineTo(origin_x + px, origin_y - scale*f(px / scale));
    }

    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.stroke();
}

function drawVLine(x, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(origin_x + scale*x, 0);
    ctx.lineWidth = 5;
    ctx.lineTo(origin_x + scale*x, cnv.height);
    ctx.stroke();
}

function drawTraps(a, b, n, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(origin_x + scale*a, origin_y + scale*-f(a));

    let d = (b-a)/n;

    for (let px = scale*a; px <= scale*b; px += scale*d) {
        ctx.lineTo(origin_x + px, origin_y - scale*f(px / scale));
    }

    ctx.lineTo(origin_x + scale*b, origin_y);
    ctx.lineTo(origin_x + scale*a, origin_y);
    ctx.fill();
}

function render() {
    drawFArea(a, b, "rgba(255, 0, 0, 0.5)");
    drawTraps(a, b, n, "rgba(0, 255, 0, 0.25)");
    drawF(a, b, "#00cc00");
    drawVLine(a, "#cc0000");
    drawVLine(b, "#0000cc");

    let cent = centroid(f, a, b, n);
    drawCentroid(cent[0], cent[1], "#ffffff");
}

render();
