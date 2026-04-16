let f1_base, f1_tip, f2_base, f2_tip;
let dragging = null; // 現在ドラッグ中の対象
const SCALE = 40;

function setup() {
    const canvas = createCanvas(540, 500);
    canvas.parent('canvas-holder');
    
    // ベクトルの初期位置 (作用点と先端)
    f1_base = createVector(0, 0);
    f1_tip  = createVector(3, 1);
    f2_base = createVector(0, 0);
    f2_tip  = createVector(1, 3);

    // イベント
    select('#scalar-k').input(() => {
        select('#k-val').html(select('#scalar-k').value());
    });
}

function draw() {
    background(250);
    translate(width/2, height/2);
    drawGrid();

    // 中央の物体 (重り)
    fill(220); stroke(100); strokeWeight(2);
    rect(-25, -25, 50, 50, 5);
    fill(100); noStroke(); textAlign(CENTER, CENTER); textSize(10);
    text("OBJECT", 0, 0);

    let mode = document.querySelector('input[name="mode"]:checked').value;
    let k = parseFloat(select('#scalar-k').value());
    if (mode === 'scalar') select('#scalar-control').style('display', 'inline-block');
    else select('#scalar-control').style('display', 'none');

    let v1 = p5.Vector.sub(f1_tip, f1_base);
    let v2 = p5.Vector.sub(f2_tip, f2_base);

    // 補助線と演算結果の描画
    if (mode === 'sum') {
        let virtual_f2_tip = p5.Vector.add(f1_base, v2);
        
        // F2がF1の始点と異なる場所にある場合、仮想的なF2を薄く表示
        if (p5.Vector.dist(f2_base, f1_base) > 0.01) {
            drawArrow(f1_base.x, f1_base.y, virtual_f2_tip.x, virtual_f2_tip.y, 'rgba(33, 150, 243, 0.4)', 2);
        }

        stroke(200); drawingContext.setLineDash([5, 5]);
        let sum_tip = p5.Vector.add(f1_tip, v2);
        // 平行四辺形の補助線
        line(f1_tip.x*SCALE, -f1_tip.y*SCALE, sum_tip.x*SCALE, -sum_tip.y*SCALE);
        line(virtual_f2_tip.x*SCALE, -virtual_f2_tip.y*SCALE, sum_tip.x*SCALE, -sum_tip.y*SCALE);
        drawingContext.setLineDash([]);
        
        drawArrow(f1_base.x, f1_base.y, sum_tip.x, sum_tip.y, '#4caf50', 4, "F1+F2");
        
    } else if (mode === 'diff') {
        let virtual_f2_tip = p5.Vector.add(f1_base, v2);
        
        // F2がF1の始点と異なる場所にある場合、仮想的なF2を薄く表示
        if (p5.Vector.dist(f2_base, f1_base) > 0.01) {
            drawArrow(f1_base.x, f1_base.y, virtual_f2_tip.x, virtual_f2_tip.y, 'rgba(33, 150, 243, 0.4)', 2);
        }

        // --- ① 先端結び (Tip-to-Tip) の図示 ---
        drawingContext.setLineDash([4, 4]);
        drawArrow(virtual_f2_tip.x, virtual_f2_tip.y, f1_tip.x, f1_tip.y, '#ff9800', 2);
        drawingContext.setLineDash([]);
        
        // 先端結びの中点にラベルを配置
        let mid_x = (virtual_f2_tip.x + f1_tip.x) / 2;
        let mid_y = (virtual_f2_tip.y + f1_tip.y) / 2;
        fill('#ff9800'); noStroke(); textSize(12); textStyle(BOLD);
        text("F1-F2", mid_x * SCALE + 10, -mid_y * SCALE - 10);
        textStyle(NORMAL);

        // --- ② F1 + (-F2) の平行四辺形の図示 ---
        let minus_v2 = p5.Vector.mult(v2, -1);
        let f1_base_minus_f2 = p5.Vector.add(f1_base, minus_v2);
        let diff_tip = p5.Vector.add(f1_base, p5.Vector.add(v1, minus_v2));

        // -F2 ベクトルの描画
        drawArrow(f1_base.x, f1_base.y, f1_base_minus_f2.x, f1_base_minus_f2.y, '#90caf9', 3, "-F2");

        // 平行四辺形の補助線
        stroke(200); drawingContext.setLineDash([5, 5]);
        line(f1_tip.x * SCALE, -f1_tip.y * SCALE, diff_tip.x * SCALE, -diff_tip.y * SCALE);
        line(f1_base_minus_f2.x * SCALE, -f1_base_minus_f2.y * SCALE, diff_tip.x * SCALE, -diff_tip.y * SCALE);
        drawingContext.setLineDash([]);

        // F1 + (-F2) の合力（これが本来の差ベクトル）
        drawArrow(f1_base.x, f1_base.y, diff_tip.x, diff_tip.y, '#ff5722', 4, "F1-F2");

    } else if (mode === 'scalar') {
        let sc_tip = p5.Vector.add(f1_base, p5.Vector.mult(v1, k));
        drawArrow(f1_base.x, f1_base.y, sc_tip.x, sc_tip.y, '#9c27b0', 4, `${k}F1`);
    }

    // 基本ベクトルの描画
    drawArrow(f1_base.x, f1_base.y, f1_tip.x, f1_tip.y, '#e91e63', 3, "F1");
    if (mode !== 'scalar') drawArrow(f2_base.x, f2_base.y, f2_tip.x, f2_tip.y, '#2196f3', 3, "F2");

    // 操作用ハンドルの描画
    drawHandle(f1_base, '#e91e63', false);
    drawHandle(f1_tip, '#e91e63', true);
    if (mode !== 'scalar') {
        drawHandle(f2_base, '#2196f3', false);
        drawHandle(f2_tip, '#2196f3', true);
    }

    updateText(v1, v2, mode, k);
}

function drawArrow(x1, y1, x2, y2, clr, weight, label) {
    stroke(clr); strokeWeight(weight);
    line(x1*SCALE, -y1*SCALE, x2*SCALE, -y2*SCALE);
    push();
    translate(x2*SCALE, -y2*SCALE);
    rotate(atan2(-(y2-y1), x2-x1));
    fill(clr); noStroke();
    triangle(0, 0, -10, 5, -10, -5);
    pop();
    if(label) {
        fill(clr); noStroke(); textSize(12);
        text(label, x2*SCALE + 10, -y2*SCALE - 10);
    }
}

function drawHandle(pos, clr, isTip) {
    fill(255); stroke(clr); strokeWeight(2);
    if (isTip) circle(pos.x*SCALE, -pos.y*SCALE, 10);
    else circle(pos.x*SCALE, -pos.y*SCALE, 8); // 根元は少し小さく
}

function mousePressed() {
    let m = createVector((mouseX - width/2)/SCALE, -(mouseY - height/2)/SCALE);
    if (dist(m.x, m.y, f1_tip.x, f1_tip.y) < 0.3) dragging = 'f1_tip';
    else if (dist(m.x, m.y, f1_base.x, f1_base.y) < 0.3) dragging = 'f1_base';
    else if (dist(m.x, m.y, f2_tip.x, f2_tip.y) < 0.3) dragging = 'f2_tip';
    else if (dist(m.x, m.y, f2_base.x, f2_base.y) < 0.3) dragging = 'f2_base';
}

function mouseDragged() {
    if (!dragging) return;
    let m = createVector((mouseX - width/2)/SCALE, -(mouseY - height/2)/SCALE);
    
    if (dragging === 'f1_tip') f1_tip.set(m);
    else if (dragging === 'f2_tip') f2_tip.set(m);
    else if (dragging === 'f1_base') {
        let diff = p5.Vector.sub(f1_tip, f1_base);
        f1_base.set(m);
        f1_tip.set(p5.Vector.add(f1_base, diff)); // 先端も一緒に移動
    } else if (dragging === 'f2_base') {
        let diff = p5.Vector.sub(f2_tip, f2_base);
        f2_base.set(m);
        f2_tip.set(p5.Vector.add(f2_base, diff));
    }
}

function mouseReleased() { dragging = null; }

function drawGrid() {
    stroke(230); strokeWeight(1);
    for (let x = -width/2; x < width/2; x += SCALE) line(x, -height/2, x, height/2);
    for (let y = -height/2; y < height/2; y += SCALE) line(-width/2, y, width/2, y);
    stroke(180); line(-width/2, 0, width/2, 0); line(0, -height/2, 0, height/2);
}

function updateText(v1, v2, mode, k) {
    select('#vec1-info').html(`F1: (${v1.x.toFixed(1)}, ${v1.y.toFixed(1)})`);
    select('#vec2-info').html(`F2: (${v2.x.toFixed(1)}, ${v2.y.toFixed(1)})`);
    
    let res;
    if (mode === 'sum') res = p5.Vector.add(v1, v2);
    else if (mode === 'diff') res = p5.Vector.sub(v1, v2);
    else res = p5.Vector.mult(v1, k);
    
    select('#res-info').html(`結果: (${res.x.toFixed(1)}, ${res.y.toFixed(1)}) | 大きさ: ${res.mag().toFixed(1)}`);
}