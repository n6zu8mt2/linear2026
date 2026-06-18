/**
 * 行列式の幾何学的意味（面積と体積）シミュレーター
 */

// グローバル状態管理
const state = {
    dimMode: '2d', // '2d' または '3d'
    
    // 2Dベクトル A=[a, b; c, d] -> a=(a,c), b=(b,d)
    a2d: { x: 3, y: 1 },
    b2d: { x: 1, y: 2 },
    showShear: false,

    // 3Dベクトル
    a3d: { x: 3, y: 0.5, z: 0.5 },
    b3d: { x: 1, y: 3, z: 0.5 },
    c3d: { x: 0.5, y: 1, z: 3.5 },
    showCross: false,

    // 3D視点回転 (右手系)
    rotX: Math.PI / 6,   
    rotY: -Math.PI / 6,  
    zoom: 1.0
};

const GRID_SIZE = 40;

document.addEventListener('DOMContentLoaded', () => {
    // 2D入力要素
    const inputA = document.getElementById('input-2d-a');
    const inputB = document.getElementById('input-2d-b');
    const inputC = document.getElementById('input-2d-c');
    const inputD = document.getElementById('input-2d-d');
    const checkShear = document.getElementById('check-shear');

    // 3D入力要素
    const sliders = {
        ax: document.getElementById('s-ax'), ay: document.getElementById('s-ay'), az: document.getElementById('s-az'),
        bx: document.getElementById('s-bx'), by: document.getElementById('s-by'), bz: document.getElementById('s-bz'),
        cx: document.getElementById('s-cx'), cy: document.getElementById('s-cy'), cz: document.getElementById('s-cz')
    };
    const checkCross = document.getElementById('check-cross');

    // ディメンションモード切り替え
    const radios = document.querySelectorAll('input[name="dim-mode"]');
    radios.forEach(r => {
        r.addEventListener('change', (e) => {
            state.dimMode = e.target.value;
            document.getElementById('controls-2d').style.display = (state.dimMode === '2d') ? 'block' : 'none';
            document.getElementById('controls-3d').style.display = (state.dimMode === '3d') ? 'block' : 'none';
            updateOutputs();
        });
    });

    // 2D入力の同期
    const sync2D = () => {
        state.a2d.x = parseFloat(inputA.value) || 0;
        state.b2d.x = parseFloat(inputB.value) || 0;
        state.a2d.y = parseFloat(inputC.value) || 0;
        state.b2d.y = parseFloat(inputD.value) || 0;
        updateOutputs();
    };
    [inputA, inputB, inputC, inputD].forEach(el => el.addEventListener('input', sync2D));
    checkShear.addEventListener('change', () => { state.showShear = checkShear.checked; });

    // 3D入力の同期
    const sync3D = () => {
        state.a3d.x = parseFloat(sliders.ax.value); state.a3d.y = parseFloat(sliders.ay.value); state.a3d.z = parseFloat(sliders.az.value);
        state.b3d.x = parseFloat(sliders.bx.value); state.b3d.y = parseFloat(sliders.by.value); state.b3d.z = parseFloat(sliders.bz.value);
        state.c3d.x = parseFloat(sliders.cx.value); state.c3d.y = parseFloat(sliders.cy.value); state.c3d.z = parseFloat(sliders.cz.value);
        updateOutputs();
    };
    Object.values(sliders).forEach(sl => sl.addEventListener('input', sync3D));
    if (checkCross) checkCross.addEventListener('change', () => { state.showCross = checkCross.checked; });

    // 初期起動
    updateOutputs();
    new p5(sketch, 'canvas-holder');

    window.update2DInputsUI = (a, b, c, d) => {
        inputA.value = a.toFixed(1); inputB.value = b.toFixed(1);
        inputC.value = c.toFixed(1); inputD.value = d.toFixed(1);
    };
});

// 計算とテキスト出力更新（改行を追加して見やすく）
function updateOutputs() {
    const box = document.getElementById('result-formula-box');
    
    if (state.dimMode === '2d') {
        let a = state.a2d.x; let c = state.a2d.y;
        let b = state.b2d.x; let d = state.b2d.y;
        let det = a * d - b * c;
        
        let lenA = Math.sqrt(a*a + c*c);
        let lenB = Math.sqrt(b*b + d*d);
        let dot = a*b + c*d;
        let sinTheta = lenA * lenB > 0 ? Math.abs(det) / (lenA * lenB) : 0;
        let thetaDeg = Math.asin(Math.min(1, sinTheta)) * 180 / Math.PI;

        let latex = `
            \\begin{aligned}
            &\\text{【行列式】} \\\\
            &\\det\\begin{pmatrix} ${a.toFixed(1)} & ${b.toFixed(1)} \\\\ ${c.toFixed(1)} & ${d.toFixed(1)} \\end{pmatrix} = ${a.toFixed(1)}\\times${d.toFixed(1)} - (${b.toFixed(1)})\\times${c.toFixed(1)} = ${det.toFixed(2)} \\\\[12pt]
            &\\text{【幾何計算】} \\\\
            &|\\boldsymbol{a}||\\boldsymbol{b}|\\sin\\theta = ${lenA.toFixed(2)} \\times ${lenB.toFixed(2)} \\times \\sin(${thetaDeg.toFixed(1)}^\\circ) = ${Math.abs(det).toFixed(2)} \\\\[12pt]
            &\\mathbf{\\Rightarrow 平行四辺形の面積 } S = |\\det A| = ${Math.abs(det).toFixed(2)}
            \\end{aligned}
        `;
        box.innerHTML = `$$ ${latex} $$`;

    } else {
        let a = state.a3d; let b = state.b3d; let c = state.c3d;
        let det = a.x*(b.y*c.z - b.z*c.y) - b.x*(a.y*c.z - a.z*c.y) + c.x*(a.y*b.z - a.z*b.y);
        
        let cross = {
            x: a.y*b.z - a.z*b.y,
            y: a.z*b.x - a.x*b.z,
            z: a.x*b.y - a.y*b.x
        };
        let tripleProduct = cross.x*c.x + cross.y*c.y + cross.z*c.z;

        let latex = `
            \\begin{aligned}
            &\\text{【行列式】} \\\\
            &\\det\\begin{pmatrix} ${a.x.toFixed(1)} & ${b.x.toFixed(1)} & ${c.x.toFixed(1)} \\\\ ${a.y.toFixed(1)} & ${b.y.toFixed(1)} & ${c.y.toFixed(1)} \\\\ ${a.z.toFixed(1)} & ${b.z.toFixed(1)} & ${c.z.toFixed(1)} \\end{pmatrix} = ${det.toFixed(2)} \\\\[12pt]
            &\\text{【スカラー三重積】} \\\\
            &(\\boldsymbol{a} \\times \\boldsymbol{b}) \\cdot \\boldsymbol{c} = \\begin{pmatrix} ${cross.x.toFixed(1)} \\\\ ${cross.y.toFixed(1)} \\\\ ${cross.z.toFixed(1)} \\end{pmatrix} \\cdot \\begin{pmatrix} ${c.x.toFixed(1)} \\\\ ${c.y.toFixed(1)} \\\\ ${c.z.toFixed(1)} \\end{pmatrix} = ${tripleProduct.toFixed(2)} \\\\[12pt]
            &\\mathbf{\\Rightarrow 平行六面体の体積 } V = |\\det A| = ${Math.abs(det).toFixed(2)}
            \\end{aligned}
        `;
        box.innerHTML = `$$ ${latex} $$`;
    }

    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([box]);
    }
}

// -----------------------------------------
// p5.js グラフィック描画ロジック
// -----------------------------------------
const sketch = (p) => {
    let dragTarget = null;
    let dragStart = { x: 0, y: 0 };

    p.setup = () => {
        let container = document.getElementById('canvas-holder');
        p.createCanvas(container.clientWidth || 550, 450);
    };

    p.draw = () => {
        p.background(255);
        p.translate(p.width / 2, p.height / 2);

        if (state.dimMode === '2d') draw2D();
        else draw3D();
    };

    // --- 2D描画ロジック ---
    function draw2D() {
        drawGrid2D();

        let a = p.createVector(state.a2d.x * GRID_SIZE, -state.a2d.y * GRID_SIZE);
        let b = p.createVector(state.b2d.x * GRID_SIZE, -state.b2d.y * GRID_SIZE);
        let sum = p5.Vector.add(a, b);

        if (state.showShear && state.a2d.y !== 0) {
            let t = state.b2d.y / state.a2d.y;
            let bShear = p.createVector((state.b2d.x - t * state.a2d.x) * GRID_SIZE, 0);
            let sumShear = p5.Vector.add(a, bShear);

            p.fill(244, 67, 54, 30); p.stroke(244, 67, 54, 100); p.strokeWeight(1);
            p.quad(0, 0, a.x, a.y, sumShear.x, sumShear.y, bShear.x, bShear.y);
            p.stroke(244, 67, 54); p.drawingContext.setLineDash([4,4]);
            p.line(b.x, b.y, bShear.x, bShear.y);
            p.line(sum.x, sum.y, sumShear.x, sumShear.y);
            p.drawingContext.setLineDash([]);
            p.noStroke(); p.fill(244, 67, 54); p.textSize(11);
            p.text("等積変形（x軸への平行移動）", bShear.x + 5, bShear.y + 15);
        }

        p.fill(33, 150, 243, 40); p.stroke(33, 150, 243, 150); p.strokeWeight(1.5);
        p.quad(0, 0, a.x, a.y, sum.x, sum.y, b.x, b.y);

        drawArrow(0, 0, a.x, a.y, '#e53935', 3, "a");
        drawArrow(0, 0, b.x, b.y, '#1e88e5', 3, "b");

        drawHandle(a.x, a.y, '#e53935');
        drawHandle(b.x, b.y, '#1e88e5');

        let mx = p.mouseX - p.width/2;
        let my = p.mouseY - p.height/2;
        if (p.dist(mx, my, a.x, a.y) < 12 || p.dist(mx, my, b.x, b.y) < 12) p.cursor('move');
        else p.cursor('default');
    }

    function drawGrid2D() {
        p.stroke(235); p.strokeWeight(1);
        for (let x = -p.width/2; x < p.width/2; x += GRID_SIZE) p.line(x, -p.height/2, x, p.height/2);
        for (let y = -p.height/2; y < p.height/2; y += GRID_SIZE) p.line(-p.width/2, y, p.width/2, y);
        p.stroke(180); p.line(-p.width/2, 0, p.width/2, 0); p.line(0, -p.height/2, 0, p.height/2);
    }

    // --- 3D描画ロジック ---
    function draw3D() {
        let orig = project3D(0, 0, 0);
        let axX = project3D(5, 0, 0); let axY = project3D(0, 5, 0); let axZ = project3D(0, 0, 5);
        
        p.stroke(200); p.strokeWeight(1);
        p.line(orig.x, orig.y, axX.x, axX.y); p.noStroke(); p.fill(150); p.text("+X", axX.x+5, axX.y);
        p.stroke(200); p.strokeWeight(1);
        p.line(orig.x, orig.y, axY.x, axY.y); p.noStroke(); p.fill(150); p.text("+Y", axY.x+5, axY.y);
        p.stroke(200); p.strokeWeight(1);
        p.line(orig.x, orig.y, axZ.x, axZ.y); p.noStroke(); p.fill(150); p.text("+Z", axZ.x+5, axZ.y);

        let a = state.a3d; let b = state.b3d; let c = state.c3d;

        let v0 = project3D(0, 0, 0);
        let vA = project3D(a.x, a.y, a.z);
        let vB = project3D(b.x, b.y, b.z);
        let vC = project3D(c.x, c.y, c.z);
        let vAB = project3D(a.x+b.x, a.y+b.y, a.z+b.z);
        let vBC = project3D(b.x+c.x, b.y+c.y, b.z+c.z);
        let vCA = project3D(a.x+c.x, a.y+c.y, a.z+c.z);
        let vABC = project3D(a.x+b.x+c.x, a.y+b.y+c.y, a.z+b.z+c.z);

        p.noStroke();
        p.fill(144, 202, 249, 60); 
        drawQuad(v0, vA, vAB, vB); // 底面
        drawQuad(vC, vCA, vABC, vBC); // 上面
        drawQuad(v0, vA, vCA, vC); // 側面
        drawQuad(vB, vAB, vABC, vBC); // 側面
        drawQuad(v0, vB, vBC, vC); // 側面
        drawQuad(vA, vAB, vABC, vCA); // 側面

        p.stroke(150, 150, 150, 150); p.strokeWeight(1);
        p.line(vA.x, vA.y, vAB.x, vAB.y); p.line(vB.x, vB.y, vAB.x, vAB.y);
        p.line(vC.x, vC.y, vCA.x, vCA.y); p.line(vA.x, vA.y, vCA.x, vCA.y);
        p.line(vC.x, vC.y, vBC.x, vBC.y); p.line(vB.x, vB.y, vBC.x, vBC.y);
        p.line(vAB.x, vAB.y, vABC.x, vABC.y); p.line(vBC.x, vBC.y, vABC.x, vABC.y); p.line(vCA.x, vCA.y, vABC.x, vABC.y);

        drawArrow(v0.x, v0.y, vA.x, vA.y, '#e53935', 3, "a");
        drawArrow(v0.x, v0.y, vB.x, vB.y, '#1e88e5', 3, "b");
        drawArrow(v0.x, v0.y, vC.x, vC.y, '#8e24aa', 3, "c");

        // --- 外積（法線）と高さの射影描画 ---
        let cross = {
            x: a.y*b.z - a.z*b.y,
            y: a.z*b.x - a.x*b.z,
            z: a.x*b.y - a.y*b.x
        };
        let crossMag = Math.sqrt(cross.x**2 + cross.y**2 + cross.z**2);

        if (state.showCross && crossMag > 0.001) {
            let crossDir = { x: cross.x/crossMag, y: cross.y/crossMag, z: cross.z/crossMag };
            // 長すぎないように表示用の長さを制限
            let displayLen = Math.min(crossMag, 6);
            let vCross = project3D(crossDir.x * displayLen, crossDir.y * displayLen, crossDir.z * displayLen);
            
            // 法線ベクトルの矢印（オレンジ色）
            drawArrow(v0.x, v0.y, vCross.x, vCross.y, '#f57c00', 2, "a×b (法線)");

            // ベクトルc の法線方向への射影（高さ成分）
            let cDotCross = c.x*crossDir.x + c.y*crossDir.y + c.z*crossDir.z;
            let cProj = {
                x: cDotCross * crossDir.x,
                y: cDotCross * crossDir.y,
                z: cDotCross * crossDir.z
            };
            let cBase = {
                x: c.x - cProj.x,
                y: c.y - cProj.y,
                z: c.z - cProj.z
            };
            
            let vCBase = project3D(cBase.x, cBase.y, cBase.z);

            // cの先端から底面へ下ろした垂線（点線）
            p.stroke('#f57c00'); p.strokeWeight(2); p.drawingContext.setLineDash([4, 4]);
            p.line(vC.x, vC.y, vCBase.x, vCBase.y);
            p.drawingContext.setLineDash([]);

            // 高さのラベル
            p.noStroke(); p.fill('#f57c00'); p.textSize(12); p.textStyle(p.BOLD);
            p.text("高さ h", (vC.x + vCBase.x)/2 + 10, (vC.y + vCBase.y)/2);
        }
    }

    function drawQuad(p1, p2, p3, p4) {
        p.quad(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
    }

    function project3D(x, y, z) {
        let cth = Math.cos(state.rotY); let sth = Math.sin(state.rotY);
        let x1 = x * cth - y * sth;
        let y1 = x * sth + y * cth;
        let z1 = z;

        let cph = Math.cos(state.rotX); let sph = Math.sin(state.rotX);
        let x2 = x1;
        let y2 = y1 * cph - z1 * sph;
        let z2 = y1 * sph + z1 * cph;
        
        let s = GRID_SIZE * state.zoom;
        return { x: x2 * s, y: -z2 * s };
    }

    function drawArrow(x1, y1, x2, y2, clr, weight, label) {
        p.stroke(clr); p.strokeWeight(weight);
        p.line(x1, y1, x2, y2);
        p.push();
        p.translate(x2, y2);
        p.rotate(p.atan2(y2 - y1, x2 - x1));
        p.fill(clr); p.noStroke();
        let arrowSize = weight * 2 + 3;
        p.triangle(0, 0, -arrowSize, arrowSize/2.5, -arrowSize, -arrowSize/2.5);
        p.pop();
        if (label) {
            p.noStroke(); p.fill(clr); p.textSize(14); p.textStyle(p.BOLDITALIC);
            p.text(label, x2 + 8, y2 - 5);
        }
    }

    function drawHandle(x, y, clr) {
        p.fill(255); p.stroke(clr); p.strokeWeight(2);
        p.circle(x, y, 8);
    }

    p.mousePressed = () => {
        if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;
        
        let mx = p.mouseX - p.width/2;
        let my = p.mouseY - p.height/2;

        if (state.dimMode === '2d') {
            let a = p.createVector(state.a2d.x * GRID_SIZE, -state.a2d.y * GRID_SIZE);
            let b = p.createVector(state.b2d.x * GRID_SIZE, -state.b2d.y * GRID_SIZE);
            if (p.dist(mx, my, a.x, a.y) < 15) dragTarget = 'a';
            else if (p.dist(mx, my, b.x, b.y) < 15) dragTarget = 'b';
        } else {
            dragTarget = 'rotate';
            dragStart.x = p.mouseX; dragStart.y = p.mouseY;
        }
    };

    p.mouseDragged = () => {
        if (!dragTarget) return;

        let mx = p.mouseX - p.width/2;
        let my = p.mouseY - p.height/2;

        if (state.dimMode === '2d') {
            let mathX = Math.round((mx / GRID_SIZE) * 2) / 2;
            let mathY = Math.round((-my / GRID_SIZE) * 2) / 2;
            
            if (dragTarget === 'a') { state.a2d.x = mathX; state.a2d.y = mathY; }
            else if (dragTarget === 'b') { state.b2d.x = mathX; state.b2d.y = mathY; }
            window.update2DInputsUI(state.a2d.x, state.b2d.x, state.a2d.y, state.b2d.y);
            updateOutputs();
        } else if (dragTarget === 'rotate') {
            let dx = p.mouseX - dragStart.x;
            let dy = p.mouseY - dragStart.y;
            state.rotY += dx * 0.01;
            state.rotX -= dy * 0.01;
            state.rotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, state.rotX));
            dragStart.x = p.mouseX; dragStart.y = p.mouseY;
        }
    };

    p.mouseReleased = () => { dragTarget = null; };
};