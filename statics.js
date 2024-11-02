const cnv = document.getElementById("myCanvas");
const ctx = cnv.getContext("2d");

cnv.width = window.innerWidth;
cnv.height = window.innerHeight - 200;

F_angle = 0

function drawArrow(px, py, angle, magnitude, scale) {
    // set 7 initial points
    p1 = [px, py - 0.6*scale];
    p2 = [px + scale*(magnitude + 14), py - 0.6*scale];
    p3 = [px + scale*(magnitude + 13.5), py - 2*scale];
    p4 = [px + scale*(magnitude + 18), py];
    p5 = [px + scale*(magnitude + 13.5), py + 2*scale];
    p6 = [px + scale*(magnitude + 14), py + 0.6*scale];
    p7 = [px, py + 0.6*scale];

    rotate(p1, px, py, angle);
    rotate(p2, px, py, angle);
    rotate(p3, px, py, angle);
    rotate(p4, px, py, angle);
    rotate(p5, px, py, angle);
    rotate(p6, px, py, angle);
    rotate(p7, px, py, angle);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(px, py)

    ctx.lineTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p3[0], p3[1]);
    ctx.lineTo(p4[0], p4[1]);
    ctx.lineTo(p5[0], p5[1]);
    ctx.lineTo(p6[0], p6[1]);
    ctx.lineTo(p7[0], p7[1]);

    ctx.fill();
    ctx.closePath();
}

function rotate(pt, ox, oy, angle) {
    let x = pt[0] - ox;
    let y = pt[1] - oy;
    angle = -(angle % 360);
    let conv = Math.PI / 180;
    let cosVal = Math.cos(angle*conv);
    let sinVal = Math.sin(angle*conv);
    pt[0] = x*cosVal - y*sinVal + ox;
    pt[1] = x*sinVal + y*cosVal + oy;
}

function render() {
    ctx.clearRect(0, 0, cnv.width, cnv.height);

    drawArrow(cnv.width / 2, cnv.height / 2, F_angle, 5, 10);
}

function update() {

    render();
    requestAnimationFrame(update);
}

update();
