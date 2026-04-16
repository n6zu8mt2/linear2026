/**
 * ベクトルの内分・外分と基底シミュレーター
 */

let vecA, vecB;
let dragging = null;
let offsetX = 250;
let offsetY = 250;

function setup() {
    const canvas = createCanvas(500, 500);
    canvas.parent('canvas-holder');
    
    // 初期の基底ベクトル
    vecA = createVector(120, 30);
    vecB = createVector(40, 120);

    // スライダーと数値入力ボックスの同期イベント
    setupInputSync('#s-coeff', '#s-val-input');
    setupInputSync('#t-coeff', '#t-val-input');
}

// スライダーと数値入力ボックスを相互に同期し、s+t=1 の拘束も処理する関数
function setupInputSync(sliderId, inputId) {
    let slider = select(sliderId);
    let input = select(inputId);

    let syncAction = function() {
        let val = parseFloat(this.value());
        slider.value(val);
        input.value(val);

        // $s+t=1$ に拘束されている場合の自動調整
        if (select('#lock-line').checked()) {
            if (sliderId === '#s-coeff') {
                let tVal = 1.0 - val;
                select('#t-coeff').value(tVal);
                select('#t-val-input').value(tVal.toFixed(1));
            } else {
                let sVal = 1.0 - val;
                select('#s-coeff').value(sVal);
                select('#s-val-input').value(sVal.toFixed(1));
            }
        }
    };

    slider.input(syncAction);
    input.input(syncAction);
}

function draw() {
    background(255);
    translate(offsetX, offsetY);

    // モードとUI状態の取得
    let mode = document.querySelector('input[name="input-mode"]:checked').value;
    let showGrid = select('#show-grid').checked();
    let showLine = select('#show-line').checked();

    let s, t, m, n;

    // モードごとの係数計算とUI切り替え
    if (mode === 'st') {
        select('#st-sliders').style('display', 'flex');
        select('#mn-sliders').style('display', 'none');
        select('#formula-internal').style('display', 'none');
        select('#formula-external').style('display', 'none');
        
        // 入力ボックスから現在の値を取得
        s = parseFloat(select('#s-val-input').value());
        t = parseFloat(select('#t-val-input').value());

    } else {
        select('#st-sliders').style('display', 'none');
        select('#mn-sliders').style('display', 'flex');
        
        m = parseFloat(select('#m-ratio').value());
        n = parseFloat(select('#n-ratio').value());
        
        select('#m-val').html(m.toFixed(1));
        select('#n-val').html(n.toFixed(1));

        if (mode === 'internal') {
            select('#formula-internal').style('display', 'block');
            select('#formula-external').style('display', 'none');
            s = n / (m + n);
            t = m / (m + n);
        } else if (mode === 'external') {
            select('#formula-internal').style('display', 'none');
            select('#formula-external').style('display', 'block');
            let denom = m - n;
            if (abs(denom) < 0.01) denom = 0.01 * (denom < 0 ? -1 : 1);
            s = -n / denom;
            t = m / denom;
        }
    }

    // グリッドと軸の描画
    if (showGrid) drawParallelogramGrid();
    drawAxes();

    // 直線ABの描画 (s + t = 1)
    if (showLine) {
        stroke(150, 150, 150, 150);
        strokeWeight(2);
        drawingContext.setLineDash([5, 5]);
        let pStart = p5.Vector.add(p5.Vector.mult(vecA, 10), p5.Vector.mult(vecB, -9));
        let pEnd = p5.Vector.add(p5.Vector.mult(vecA, -9), p5.Vector.mult(vecB, 10));
        line(pStart.x, -pStart.y, pEnd.x, -pEnd.y);
        drawingContext.setLineDash([]);
    }

    // 点 p = sa + tb の計算
    let pPos = p5.Vector.add(p5.Vector.mult(vecA, s), p5.Vector.mult(vecB, t));

    // 比率 m:n の寸法線を描画 (内分・外分モード時)
    if (mode === 'internal') {
        drawRatioSpan(vecA, pPos, m, '#e91e63', 25);
        drawRatioSpan(pPos, vecB, n, '#2196f3', 25);
    } else if (mode === 'external') {
        drawRatioSpan(vecA, pPos, m, '#e91e63', 25);
        drawRatioSpan(vecB, pPos, n, '#2196f3', -25);
    }

    // ベクトルの描画
    drawArrow(0, 0, vecA.x, -vecA.y, '#e91e63', 2, "a");
    drawArrow(0, 0, vecB.x, -vecB.y, '#2196f3', 2, "b");
    drawArrow(0, 0, pPos.x, -pPos.y, '#4caf50', 4, "p");

    // 操作ハンドル (先端)
    fill(255); stroke('#e91e63'); strokeWeight(2); circle(vecA.x, -vecA.y, 10);
    fill(255); stroke('#2196f3'); strokeWeight(2); circle(vecB.x, -vecB.y, 10);
    
    // UIパネルへの数値反映 (y軸は数学座標に合わせて反転)
    select('#vec-a-x').html(vecA.x.toFixed(1));
    select('#vec-a-y').html((-vecA.y).toFixed(1));
    select('#vec-b-x').html(vecB.x.toFixed(1));
    select('#vec-b-y').html((-vecB.y).toFixed(1));

    select('#s-val-display').html(s.toFixed(2));
    select('#t-val-display').html(t.toFixed(2));
    select('#sum-val-display').html((s + t).toFixed(2));
    select('#p-coord').html(`点 P( ${pPos.x.toFixed(1)}, ${(-pPos.y).toFixed(1)} )`);

    updateCursor();
}

function updateCursor() {
    let mx = mouseX - offsetX;
    let my = -(mouseY - offsetY);
    if (dist(mx, my, vecA.x, vecA.y) < 20 || dist(mx, my, vecB.x, vecB.y) < 20) {
        cursor(HAND); 
    } else if (dragging === 'PAN') {
        cursor('grabbing'); 
    } else {
        cursor('grab'); 
    }
}

function drawRatioSpan(pStart, pEnd, val, clr, offsetPx) {
    let cvsStart = createVector(pStart.x, -pStart.y);
    let cvsEnd = createVector(pEnd.x, -pEnd.y);
    let aCvs = createVector(vecA.x, -vecA.y);
    let bCvs = createVector(vecB.x, -vecB.y);
    
    let baseDir = p5.Vector.sub(bCvs, aCvs).normalize();
    let perp = createVector(-baseDir.y, baseDir.x).mult(offsetPx);
    
    let lStart = p5.Vector.add(cvsStart, perp);
    let lEnd = p5.Vector.add(cvsEnd, perp);
    
    stroke(clr);
    strokeWeight(2);
    line(lStart.x, lStart.y, lEnd.x, lEnd.y);
    
    let tickDir = p5.Vector.normalize(perp).mult(6);
    line(lStart.x, lStart.y, lStart.x - tickDir.x, lStart.y - tickDir.y);
    line(lEnd.x, lEnd.y, lEnd.x - tickDir.x, lEnd.y - tickDir.y);
    
    noStroke();
    fill(clr);
    textSize(16);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    
    let mid = p5.Vector.lerp(lStart, lEnd, 0.5);
    let textOffset = p5.Vector.normalize(perp).mult(15);
    text(val.toFixed(1), mid.x + textOffset.x, mid.y + textOffset.y);
}

function drawParallelogramGrid() {
    stroke(240);
    strokeWeight(1);
    for (let i = -15; i <= 15; i++) {
        let start1 = p5.Vector.add(p5.Vector.mult(vecA, i), p5.Vector.mult(vecB, -15));
        let end1 = p5.Vector.add(p5.Vector.mult(vecA, i), p5.Vector.mult(vecB, 15));
        line(start1.x, -start1.y, end1.x, -end1.y);

        let start2 = p5.Vector.add(p5.Vector.mult(vecB, i), p5.Vector.mult(vecA, -15));
        let end2 = p5.Vector.add(p5.Vector.mult(vecB, i), p5.Vector.mult(vecA, 15));
        line(start2.x, -start2.y, end2.x, -end2.y);
    }
}

function drawAxes() {
    stroke(220);
    line(-width * 3, 0, width * 3, 0);
    line(0, -height * 3, 0, height * 3);
}

function drawArrow(x1, y1, x2, y2, clr, weight, label) {
    stroke(clr); strokeWeight(weight);
    line(x1, y1, x2, y2);
    push();
    translate(x2, y2);
    rotate(atan2(y2 - y1, x2 - x1));
    fill(clr); noStroke();
    triangle(0, 0, -10, 5, -10, -5);
    pop();
    if (label) {
        fill(clr); textSize(16); textStyle(BOLD);
        text(label, x2 + 10, y2);
    }
}

function mousePressed() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

    let mx = mouseX - offsetX;
    let my = -(mouseY - offsetY);

    if (dist(mx, my, vecA.x, vecA.y) < 20) {
        dragging = 'A';
    } else if (dist(mx, my, vecB.x, vecB.y) < 20) {
        dragging = 'B';
    } else {
        dragging = 'PAN';
    }
}

function mouseDragged() {
    if (!dragging) return;

    if (dragging === 'PAN') {
        offsetX += mouseX - pmouseX;
        offsetY += mouseY - pmouseY;
    } else {
        let mx = mouseX - offsetX;
        let my = -(mouseY - offsetY);
        if (dragging === 'A') vecA.set(mx, my);
        else if (dragging === 'B') vecB.set(mx, my);
    }
}

function mouseReleased() {
    dragging = null;
}