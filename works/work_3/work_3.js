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

a = 0;
b = 20;
f = x => Math.sin(x) - 0.333*x + 10.0;

drawFArea(a, b, "#004400");
drawF(a, b, "#00cc00");
drawVLine(a, "#cc0000");
drawVLine(b, "#0000cc");

function drawFArea(a, b, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(origin_x, origin_y + scale*-f(0));

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
    ctx.moveTo(origin_x, origin_y + scale*-f(0));

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

function render() {
    //
}

// render();
