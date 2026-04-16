/**
 * ベクトルの関係性シミュレーター (相等、逆、平行)
 */

let vectors = [];
let dragging = null; // ドラッグ中の対象
let offsetX = 250;
let offsetY = 250;
const GRID_SIZE = 25;

function setup() {
    const canvas = createCanvas(500, 500);
    canvas.parent('canvas-holder');
    
    // ベクトルの初期配置
    vectors = [
        { label: 'a', color: '#e91e63', base: createVector(-100, 50), tip: createVector(50, 100) },
        { label: 'b', color: '#2196f3', base: createVector(-150, -100), tip: createVector(0, -50) },
        { label: 'c', color: '#4caf50', base: createVector(150, 0), tip: createVector(0, -50) },
        { label: 'd', color: '#ff9800', base: createVector(-50, -150), tip: createVector(100, -150) }
    ];
}

function draw() {
    background(255);
    translate(offsetX, offsetY);

    drawGrid();
    drawAxes();

    // 各ベクトルの描画
    for (let i = 0; i < vectors.length; i++) {
        let v = vectors[i];
        drawArrow(v.base.x, -v.base.y, v.tip.x, -v.tip.y, v.color, 3, v.label);
        
        // 始点と終点のハンドル
        fill(255); stroke(v.color); strokeWeight(2);
        circle(v.base.x, -v.base.y, 8);
        fill(v.color); noStroke();
        circle(v.tip.x, -v.tip.y, 10);
    }

    updateInfo();
    updateCursor();
}

function drawGrid() {
    stroke(240);
    strokeWeight(1);
    for (let i = -30; i <= 30; i++) {
        line(i * GRID_SIZE, -1000, i * GRID_SIZE, 1000);
        line(-1000, i * GRID_SIZE, 1000, i * GRID_SIZE);
    }
}

function drawAxes() {
    stroke(200);
    strokeWeight(2);
    line(-1000, 0, 1000, 0);
    line(0, -1000, 0, 1000);
}

function drawArrow(x1, y1, x2, y2, clr, weight, label) {
    stroke(clr); strokeWeight(weight);
    line(x1, y1, x2, y2);
    push();
    translate(x2, y2);
    let angle = atan2(y2 - y1, x2 - x1);
    rotate(angle);
    fill(clr); noStroke();
    triangle(0, 0, -12, 5, -12, -5);
    pop();
    
    // ラベルの描画 (太字の斜体で表示)
    if (label) {
        fill(clr); noStroke(); textSize(20); textStyle(BOLDITALIC);
        text(label, (x1+x2)/2 + 10, (y1+y2)/2 - 10);
    }
}

// 画面座標から数学座標へ
function getMathCoord(mx, my) {
    let x = mx - offsetX;
    let y = -(my - offsetY);
    
    if (select('#snap-grid').checked()) {
        x = Math.round(x / GRID_SIZE) * GRID_SIZE;
        y = Math.round(y / GRID_SIZE) * GRID_SIZE;
    }
    return createVector(x, y);
}

// 線分と点の距離の二乗（判定用）
function distSq(x1, y1, x2, y2) {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
}

// 線分と点の最短距離
function distToSegment(px, py, x1, y1, x2, y2) {
    let l2 = distSq(x1, y1, x2, y2);
    if (l2 === 0) return dist(px, py, x1, y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
}

function mousePressed() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

    // 当たり判定はすべて画面（キャンバス）のピクセル座標系で行うように修正
    let cx = mouseX - offsetX;
    let cy = mouseY - offsetY;

    // 1. ハンドル（先端・始点）のクリック判定を優先
    for (let i = vectors.length - 1; i >= 0; i--) {
        let v = vectors[i];
        if (dist(cx, cy, v.tip.x, -v.tip.y) < 15) {
            dragging = { index: i, type: 'tip' };
            return;
        }
        if (dist(cx, cy, v.base.x, -v.base.y) < 15) {
            dragging = { index: i, type: 'base' };
            return;
        }
    }

    // 2. ベクトル本体（線分）のクリック判定
    for (let i = vectors.length - 1; i >= 0; i--) {
        let v = vectors[i];
        let d = distToSegment(cx, cy, v.base.x, -v.base.y, v.tip.x, -v.tip.y);
        if (d < 15) {
            dragging = { 
                index: i, 
                type: 'body', 
                offsetX: v.base.x - cx, 
                offsetY: v.base.y - (-cy), // 数学座標に合わせるための補正
                diffX: v.tip.x - v.base.x,
                diffY: v.tip.y - v.base.y
            };
            return;
        }
    }

    // 何もない場所をクリックした場合はパン（移動）
    dragging = { type: 'pan' };
}

function mouseDragged() {
    if (!dragging) return;

    if (dragging.type === 'pan') {
        offsetX += mouseX - pmouseX;
        offsetY += mouseY - pmouseY;
    } else {
        let newPos = getMathCoord(mouseX, mouseY);
        let v = vectors[dragging.index];
        
        if (dragging.type === 'base') {
            v.base.set(newPos);
        } else if (dragging.type === 'tip') {
            v.tip.set(newPos);
        } else if (dragging.type === 'body') {
            // ベクトル全体を平行移動させる
            let targetBaseX = (mouseX - offsetX) + dragging.offsetX;
            let targetBaseY = -(mouseY - offsetY) + dragging.offsetY;
            
            if (select('#snap-grid').checked()) {
                targetBaseX = Math.round(targetBaseX / GRID_SIZE) * GRID_SIZE;
                targetBaseY = Math.round(targetBaseY / GRID_SIZE) * GRID_SIZE;
            }
            
            v.base.set(targetBaseX, targetBaseY);
            v.tip.set(targetBaseX + dragging.diffX, targetBaseY + dragging.diffY);
        }
    }
}

function mouseReleased() {
    dragging = null;
}

function updateCursor() {
    let cx = mouseX - offsetX;
    let cy = mouseY - offsetY;
    
    let overHandle = false;
    let overBody = false;

    for (let v of vectors) {
        if (dist(cx, cy, v.tip.x, -v.tip.y) < 15 || dist(cx, cy, v.base.x, -v.base.y) < 15) {
            overHandle = true;
            break;
        }
        if (distToSegment(cx, cy, v.base.x, -v.base.y, v.tip.x, -v.tip.y) < 15) {
            overBody = true;
            break;
        }
    }

    if (overHandle) cursor(HAND);
    else if (overBody) cursor('move');
    else if (dragging && dragging.type === 'pan') cursor('grabbing');
    else cursor('grab');
}

function updateInfo() {
    let comps = [];
    
    // 成分の計算と表示
    for (let i = 0; i < vectors.length; i++) {
        let v = vectors[i];
        let compX = (v.tip.x - v.base.x) / GRID_SIZE;
        let compY = (v.tip.y - v.base.y) / GRID_SIZE;
        comps.push({ label: v.label, x: compX, y: compY });
        
        select(`#info-${v.label}`).html(`$\\boldsymbol{${v.label}} = (${compX.toFixed(0)}, ${compY.toFixed(0)})$`);
    }

    let equals = [];
    let inverses = [];
    let parallels = [];

    // 全ペアの組み合わせをチェック
    for (let i = 0; i < comps.length; i++) {
        for (let j = i + 1; j < comps.length; j++) {
            let c1 = comps[i];
            let c2 = comps[j];
            let pair = `$\\boldsymbol{${c1.label}}$ と $\\boldsymbol{${c2.label}}$`;

            if ((c1.x === 0 && c1.y === 0) || (c2.x === 0 && c2.y === 0)) continue;

            if (abs(c1.x - c2.x) < 0.1 && abs(c1.y - c2.y) < 0.1) {
                equals.push(pair);
            }
            else if (abs(c1.x + c2.x) < 0.1 && abs(c1.y + c2.y) < 0.1) {
                inverses.push(pair);
            }
            
            let crossProd = c1.x * c2.y - c1.y * c2.x;
            if (abs(crossProd) < 0.1) {
                parallels.push(pair);
            }
        }
    }

    select('#rel-equal').html(equals.length > 0 ? equals.join(' , ') : 'なし');
    select('#rel-inverse').html(inverses.length > 0 ? inverses.join(' , ') : 'なし');
    select('#rel-parallel').html(parallels.length > 0 ? parallels.join(' , ') : 'なし');
    
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
}