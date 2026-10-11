// Visual helpers
const ML_VIS = {};
const V = {
    FONT: "Kalam, 'Segoe Print', 'Comic Sans MS', cursive",
    C: {
        sky: '#0284c7', skyS: '#e0f2fe', lime: '#65a30d', limeS: '#ecfccb', indigo: '#4f46e5', indigoS: '#e0e7ff',
        rose: '#e11d48', roseS: '#ffe4e6', amber: '#d97706', amberS: '#fef3c7', green: '#059669', greenS: '#d1fae5',
        violet: '#7c3aed', violetS: '#ede9fe', slate: '#475569', slateS: '#f1f5f9', ink: '#1e293b', red: '#dc2626'
    },
    rng(seed) {
        let a = seed >>> 0;
        return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    },
    gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
    h(tag, attrs, ...kids) {
        const e = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs || {})) {
            if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
            else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
            else if (k === 'html') e.innerHTML = v;
            else e.setAttribute(k, v);
        }
        for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(String(c)));
        return e;
    },
    s(tag, attrs, ...kids) {
        const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs || {})) {
            if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
        }
        for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(String(c)));
        return e;
    },
    svg(w, h, cls) { return V.s('svg', { viewBox: `0 0 ${w} ${h}`, class: 'vis-svg ' + (cls || '') }); },
    // Hand-drawn line
    rough(x1, y1, x2, y2, r, amt = 1) {
        r = r || Math.random;
        const L = Math.hypot(x2 - x1, y2 - y1) || 1, off = Math.min(amt * 1.6, Math.max(0.5, L * 0.012 * amt));
        const j = () => (r() * 2 - 1) * off, dx = x2 - x1, dy = y2 - y1, px = -dy / L, py = dx / L;
        let d = '';
        for (let k = 0; k < 2; k++) {
            const bow = j() * 1.2;
            d += `M${x1 + j()} ${y1 + j()} C${x1 + dx * .35 + px * bow + j()} ${y1 + dy * .35 + py * bow + j()} ${x1 + dx * .7 + px * bow + j()} ${y1 + dy * .7 + py * bow + j()} ${x2 + j()} ${y2 + j()} `;
        }
        return d;
    },
    rline(g, x1, y1, x2, y2, color, width = 1.8, r, extra = {}) {
        const p = V.s('path', Object.assign({ d: extra['stroke-dasharray'] ? `M${x1} ${y1} L${x2} ${y2}` : V.rough(x1, y1, x2, y2, r), fill: 'none', stroke: color || V.C.ink, 'stroke-width': width, 'stroke-linecap': 'round' }, extra));
        g.append(p); return p;
    },
    rrect(g, x, y, w, h, color, fill, r, width = 1.6) {
        if (fill) g.append(V.s('rect', { x: x + 1, y: y + 1, width: Math.max(0, w - 2), height: Math.max(0, h - 2), rx: 4, fill }));
        V.rline(g, x, y, x + w, y, color, width, r); V.rline(g, x + w, y, x + w, y + h, color, width, r);
        V.rline(g, x + w, y + h, x, y + h, color, width, r); V.rline(g, x, y + h, x, y, color, width, r);
    },
    text(g, x, y, str, o = {}) {
        const t = V.s('text', { x, y, 'font-family': V.FONT, 'font-size': o.size || 15, fill: o.color || V.C.ink, 'text-anchor': o.anchor || 'middle', 'dominant-baseline': 'middle', 'font-weight': o.weight || 400 });
        t.textContent = str; g.append(t); return t;
    },
    arrow(g, x1, y1, x2, y2, color, width = 1.8, r) {
        V.rline(g, x1, y1, x2, y2, color, width, r);
        const a = Math.atan2(y2 - y1, x2 - x1);
        for (const s of [-1, 1]) { const b = a + Math.PI - s * 0.45; V.rline(g, x2, y2, x2 + 10 * Math.cos(b), y2 + 10 * Math.sin(b), color, width, r, {}); }
    },
    slider(label, min, max, step, value, onInput, fmt) {
        const out = V.h('output', {}, fmt ? fmt(value) : value);
        const inp = V.h('input', { type: 'range', min, max, step, value });
        inp.addEventListener('input', () => { const v = Number(inp.value); out.textContent = fmt ? fmt(v) : v; onInput(v); });
        const w = V.h('label', { class: 'vis-slider' }, V.h('span', {}, label), inp, out);
        w.input = inp; return w;
    },
    seg(options, value, onChange) {
        const w = V.h('div', { class: 'vis-seg', role: 'group' });
        const btns = options.map(([v, label]) => {
            const b = V.h('button', { type: 'button', class: v === value ? 'on' : '' }, label);
            b.addEventListener('click', () => { btns.forEach(x => x.classList.remove('on')); b.classList.add('on'); onChange(v); });
            return b;
        });
        w.append(...btns); return w;
    },
    btn(label, onClick, cls) { return V.h('button', { type: 'button', class: 'vis-btn ' + (cls || ''), onclick: onClick }, label); },
    fmt(n, d = 2) { return Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString('en-US', { maximumFractionDigits: d }) : '-'; },
    clear(e) { while (e.firstChild) e.removeChild(e.firstChild); },
    median(a) { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; },
    mean(a) { return a.reduce((x, y) => x + y, 0) / a.length; },
    std(a) { const m = V.mean(a); return Math.sqrt(V.mean(a.map(x => (x - m) ** 2))); },

    // 3D helpers
    _three: null,
    three() {
        if (window.THREE) return Promise.resolve(window.THREE);
        if (!V._three) V._three = new Promise((res, rej) => {
            const sc = document.createElement('script');
            sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            sc.onload = () => res(window.THREE); sc.onerror = rej; document.head.append(sc);
        });
        return V._three;
    },
    async scene3d(host, opt = {}) {
        let THREE;
        try { THREE = await V.three(); } catch (e) { host.append(V.h('p', { class: 'vis-note' }, '3D view needs an internet connection to load three.js.')); return null; }
        const canvas = V.h('canvas', { class: 'vis-canvas3d', 'aria-label': opt.label || '3D view' });
        host.append(canvas);
        let renderer;
        try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { canvas.remove(); host.append(V.h('p', { class: 'vis-note' }, 'WebGL is not available in this browser.')); return null; }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1.6, 0.1, 100);
        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const dl = new THREE.DirectionalLight(0xffffff, 0.55); dl.position.set(3, 5, 4); scene.add(dl);
        const target = new THREE.Vector3(...(opt.target || [0, 0, 0]));
        let theta = opt.theta ?? 0.8, phi = opt.phi ?? 1.05, radius = opt.radius ?? 6, needs = true, visible = false, auto = opt.autoRotate ?? true;
        const frameFns = [];
        const place = () => { camera.position.set(target.x + radius * Math.sin(phi) * Math.cos(theta), target.y + radius * Math.cos(phi), target.z + radius * Math.sin(phi) * Math.sin(theta)); camera.lookAt(target); };
        const resize = () => { const w = host.clientWidth || 600, h = Math.round(w / (opt.aspect || 1.7)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); needs = true; };
        let drag = null;
        canvas.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; auto = false; canvas.setPointerCapture(e.pointerId); });
        canvas.addEventListener('pointermove', e => { if (!drag) return; theta += (e.clientX - drag[0]) * 0.01; phi = Math.min(2.9, Math.max(0.2, phi - (e.clientY - drag[1]) * 0.01)); drag = [e.clientX, e.clientY]; needs = true; });
        canvas.addEventListener('pointerup', () => { drag = null; });
        const zoom = d => { radius = Math.min(18, Math.max(2.5, radius * d)); needs = true; };
        const bar = V.h('div', { class: 'vis-row vis-3dbar' }, V.btn('+ zoom', () => zoom(0.85)), V.btn('- zoom', () => zoom(1.18)), V.btn('⟳ auto-rotate', () => { auto = !auto; needs = true; }), V.h('span', { class: 'vis-note' }, 'Drag to rotate'));
        host.append(bar);
        new IntersectionObserver(es => es.forEach(x => { visible = x.isIntersecting; if (visible) { resize(); loop(); } })).observe(canvas);
        window.addEventListener('resize', resize);
        let last = 0;
        function loop(t = 0) {
            if (!visible) return;
            const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
            if (auto) { theta += dt * 0.25; needs = true; }
            frameFns.forEach(f => { if (f(dt)) needs = true; });
            if (needs) { place(); renderer.render(scene, camera); needs = false; }
            requestAnimationFrame(loop);
        }
        resize();
        return { THREE, scene, camera, renderer, dirty: () => { needs = true; }, onFrame: f => frameFns.push(f) };
    },
    label3d(THREE, text, color = '#1e293b', size = 0.35) {
        const c = document.createElement('canvas'), ctx = c.getContext('2d'), fs = 64;
        ctx.font = `700 ${fs}px Kalam, 'Segoe Print', cursive`;
        const w = Math.ceil(ctx.measureText(text).width) + 24; c.width = w; c.height = fs + 24;
        ctx.font = `700 ${fs}px Kalam, 'Segoe Print', cursive`; ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.fillText(text, 12, c.height / 2 + 4);
        const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
        sp.scale.set(size * w / c.height, size, 1); sp.renderOrder = 10; return sp;
    },
    line3d(THREE, pts, color, dashed) {
        const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p)));
        const m = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.08 }) : new THREE.LineBasicMaterial({ color });
        const l = new THREE.Line(g, m); if (dashed) l.computeLineDistances(); return l;
    },
    axes3d(THREE, scene, names, size = 2) {
        const col = 0x94a3b8;
        for (let i = 0; i < 3; i++) {
            const a = [0, 0, 0], b = [0, 0, 0]; a[i] = -size; b[i] = size;
            scene.add(V.line3d(THREE, [a, b], col));
            if (names[i]) { const s = V.label3d(THREE, names[i], '#475569', 0.28); s.position.set(b[0] * 1.15, b[1] * 1.15, b[2] * 1.15); scene.add(s); }
        }
    }
};

function initVisuals(root) {
    (root || document).querySelectorAll('.vis-widget:not([data-observed])').forEach(fig => {
        fig.setAttribute('data-observed', '1');
        const io = new IntersectionObserver(es => es.forEach(x => {
            if (!x.isIntersecting || fig.dataset.ready) return;
            io.disconnect();
            const fn = ML_VIS[fig.dataset.vis], host = fig.querySelector('.vis-root');
            if (!fn) { host.textContent = 'Missing visual: ' + fig.dataset.vis; return; }
            try { const r = fn(host); Promise.resolve(r).then(() => { fig.dataset.ready = '1'; renderMath(host); }); }
            catch (e) { console.error('visual ' + fig.dataset.vis, e); host.textContent = 'This visual failed to load.'; }
        }), { rootMargin: '200px' });
        io.observe(fig);
    });
}
// Topic 1 visuals
ML_VIS.t1_risk_matrix = function (root) {
    const PRESETS = {
        paper: ['Paper cuts in an office', 300, 5],
        shop: ['Shoplifting in a retail chain', 400, 150],
        machine: ['Machine breakdown', 4, 200000],
        fire: ['Warehouse fire', 0.02, 20e6],
        cyber: ['Cyberattack that shuts a bank down', 0.05, 80e6],
        a: ['Risk A: 1% chance of RM100m', 0.01, 100e6],
        b: ['Risk B: certain RM1m loss', 1, 1e6],
    };
    let key = 'fire', f = PRESETS.fire[1], sv = PRESETS.fire[2];
    const W = 560, H = 330, L = 70, T = 16, PW = 470, PH = 270;
    const fmin = -2, fmax = 3, smin = 0, smax = 8.5;  // log10 ranges
    const svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    const fs = V.slider('Frequency (losses per year)', fmin, fmax, 0.05, Math.log10(f), v => { f = 10 ** v; key = null; draw(); }, v => fmtF(10 ** v));
    const ss = V.slider('Severity (RM per loss)', smin, smax, 0.05, Math.log10(sv), v => { sv = 10 ** v; key = null; draw(); }, v => rm(10 ** v));
    const seg = V.seg(Object.entries(PRESETS).map(([k, p]) => [k, p[0].split(':')[0]]), key, k => {
        key = k; f = PRESETS[k][1]; sv = PRESETS[k][2];
        fs.input.value = Math.log10(f); fs.input.dispatchEvent(new Event('input'));
        ss.input.value = Math.log10(sv); ss.input.dispatchEvent(new Event('input'));
        key = k; draw();
    });
    root.append(seg, V.h('div', { class: 'vis-row' }, fs, ss), svg, read);
    function rm(v) { return v >= 1e6 ? 'RM' + V.fmt(v / 1e6, 1) + 'm' : v >= 1e3 ? 'RM' + V.fmt(v / 1e3, 0) + 'k' : 'RM' + V.fmt(v, 0); }
    function fmtF(v) { return v >= 1 ? V.fmt(v, 0) + ' / yr' : 'once in ' + V.fmt(1 / v, 0) + ' yrs'; }
    const X = lf => L + (lf - fmin) / (fmax - fmin) * PW, Y = ls => T + PH - (ls - smin) / (smax - smin) * PH;
    function draw() {
        V.clear(svg); const r = V.rng(5);
        const fx = X(0), sy = Y(6);
        const quads = [
            [L, sy, fx - L, T + PH - sy, V.C.greenS, 'Minor', 'retain, monitor'],
            [fx, sy, L + PW - fx, T + PH - sy, V.C.skyS, 'Repeated nuisance', 'PREVENT (cut frequency)'],
            [L, T, fx - L, sy - T, V.C.amberS, 'Catastrophic', 'REDUCE severity + transfer'],
            [fx, T, L + PW - fx, sy - T, V.C.roseS, 'Structural problem', 'AVOID / redesign'],
        ];
        quads.forEach(([x, y, w, h, c, t, t2]) => {
            svg.append(V.s('rect', { x, y, width: w, height: h, fill: c }));
            V.text(svg, x + w / 2, y + h - 34, t, { size: 13, weight: 700, color: '#334155' });
            V.text(svg, x + w / 2, y + h - 16, t2, { size: 12, color: '#475569' });
        });
        V.rline(svg, L, T + PH, L + PW, T + PH, V.C.ink, 1.6, r); V.rline(svg, L, T, L, T + PH, V.C.ink, 1.6, r);
        V.text(svg, L + PW / 2, H - 8, 'frequency (log scale) →', { size: 13, color: '#64748b' });
        const yl = V.text(svg, 16, T + PH / 2, 'severity (log) →', { size: 13, color: '#64748b' }); yl.setAttribute('transform', `rotate(-90 16 ${T + PH / 2})`);
        [['once/100y', -2], ['1/yr', 0], ['1000/yr', 3]].forEach(([t, v]) => V.text(svg, X(v), T + PH + 14, t, { size: 11, color: '#64748b' }));
        [['RM1', 0], ['RM1m', 6], ['RM100m', 8]].forEach(([t, v]) => V.text(svg, L - 6, Y(v), t, { size: 11, color: '#64748b', anchor: 'end' }));
        if (key === 'a' || key === 'b') {
            [['A', 0.01, 100e6], ['B', 1, 1e6]].forEach(([n, ff, s2]) => { const cx = X(Math.log10(ff)), cy = Y(Math.log10(s2)); svg.append(V.s('circle', { cx, cy, r: 6, fill: '#94a3b8' })); V.text(svg, cx + 12, cy - 10, n, { size: 13, weight: 700, color: '#475569' }); });
            V.rline(svg, X(-2), Y(8), X(0), Y(6), '#94a3b8', 1.4, r, { 'stroke-dasharray': '5 5' });
            V.text(svg, X(-1) + 40, Y(7) - 6, 'same expected loss', { size: 12, color: '#64748b' });
        }
        const cx = X(Math.log10(f)), cy = Y(Math.log10(sv));
        svg.append(V.s('circle', { cx, cy, r: 9, fill: V.C.sky, stroke: '#fff', 'stroke-width': 2 }));
        const el = f * sv, hiF = f >= 1, hiS = sv >= 1e6;
        const advice = hiF && hiS ? 'Frequent and severe: the exposure itself is the problem. Consider <b>avoidance</b> or redesigning the activity.'
            : hiF ? 'Frequent but small: attack the <b>frequency</b> with <b>loss prevention</b> (training, access controls, tagging).'
                : hiS ? 'Rare but severe: <b>loss reduction</b> (sprinklers, backups, continuity plans) and transfer/insurance; averages understate this risk.'
                    : 'Rare and small: usually retained and monitored.';
        read.innerHTML = `${key ? '<b>' + PRESETS[key][0] + '.</b> ' : ''}Expected annual loss ≈ frequency x average severity = ${fmtF(f)} x ${rm(sv)} = <b>${rm(el)}</b>. ${advice}` +
            (key === 'a' || key === 'b' ? ' Risks A and B have the <b>same</b> expected loss (RM1m), but A could bankrupt a small firm. Look at the distribution, not just the average.' : '');
    }
    draw();
};

ML_VIS.t1_diversification = function (root) {
    let n = 1, rho = 0.05;
    const SYS = 15, SPEC = 35, W = 560, H = 290, L = 56, T = 18, PW = 480, PH = 220, NMAX = 60;
    const svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('Number of assets', 1, NMAX, 1, n, v => { n = v; draw(); }),
        V.seg([[0.05, 'Unrelated firms'], [0.5, 'Same industry']], rho, v => { rho = v; draw(); })), svg, read);
    const spec = k => SPEC * Math.sqrt(1 / k + (1 - 1 / k) * rho), total = k => Math.sqrt(SYS ** 2 + spec(k) ** 2);
    const X = k => L + (k - 1) / (NMAX - 1) * PW, Y = v => T + PH - v / 40 * PH;
    function draw() {
        V.clear(svg); const r = V.rng(9);
        V.rline(svg, L, T + PH, L + PW, T + PH, V.C.ink, 1.5, r); V.rline(svg, L, T, L, T + PH, V.C.ink, 1.5, r);
        let d = '', a = `M${X(1)} ${Y(SYS)}`;
        for (let k = 1; k <= NMAX; k++) { d += (k === 1 ? 'M' : 'L') + X(k) + ' ' + Y(total(k)); a += ` L${X(k)} ${Y(total(k))}`; }
        a += ` L${X(NMAX)} ${Y(SYS)} Z`;
        svg.append(V.s('path', { d: a, fill: V.C.skyS, opacity: 0.8 }));
        svg.append(V.s('path', { d, fill: 'none', stroke: V.C.sky, 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
        V.rline(svg, L, Y(SYS), L + PW, Y(SYS), V.C.amber, 2, r, { 'stroke-dasharray': '8 6' });
        V.text(svg, L + PW - 4, Y(SYS) + 16, 'systematic risk floor', { size: 13, color: V.C.amber, anchor: 'end', weight: 700 });
        V.text(svg, X(8), Y(total(8)) - 26, 'total portfolio risk', { size: 13, color: V.C.sky, anchor: 'start', weight: 700 });
        V.text(svg, L + PW / 2, H - 8, 'number of assets →', { size: 13, color: '#64748b' });
        [0, 10, 20, 30, 40].forEach(v => V.text(svg, L - 8, Y(v), v + '%', { size: 11, color: '#64748b', anchor: 'end' }));
        const cx = X(n), cy = Y(total(n));
        V.rline(svg, cx, cy, cx, Y(SYS), V.C.rose, 2, r);
        svg.append(V.s('circle', { cx, cy, r: 8, fill: V.C.sky, stroke: '#fff', 'stroke-width': 2 }));
        const tot = total(n), un = spec(n), removed = (1 - (tot - SYS) / (total(1) - SYS)) * 100;
        read.innerHTML = `With <b>${n}</b> asset${n > 1 ? 's' : ''}, total risk ≈ <b>${V.fmt(tot, 1)}%</b> (systematic ${SYS}% + firm-specific ${V.fmt(un, 1)}%, combined as variances). ` +
            (rho > 0.2 ? `Because the firms react alike, firm-specific risk stalls at about ${V.fmt(spec(NMAX), 1)}%: <b>quantity alone is not diversification</b>.` :
                n === 1 ? 'One company: every lawsuit, strike or CEO exit hits you fully.' : `About ${V.fmt(removed, 0)}% of the diversifiable part is gone. What remains near the floor is economy-wide risk no portfolio can remove.`);
    }
    draw();
};

ML_VIS.t1_beta = function (root) {
    let beta = 1.5, mkt = -6;
    const W = 560, H = 250, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    const bs = V.slider('Beta (β)', 0, 2.5, 0.1, beta, v => { beta = v; draw(); }, v => V.fmt(v, 1));
    const ms = V.slider('Market move', -10, 10, 1, mkt, v => { mkt = v; draw(); }, v => (v > 0 ? '+' : '') + v + '%');
    root.append(V.seg([[0.5, 'Utility β 0.5'], [1, 'Index β 1.0'], [1.5, 'Tech β 1.5']], beta, v => { beta = v; bs.input.value = v; bs.input.dispatchEvent(new Event('input')); }),
        V.h('div', { class: 'vis-row' }, bs, ms), svg, read);
    function draw() {
        V.clear(svg); const r = V.rng(3), mid = 130, sc = 4.2;
        V.rline(svg, 30, mid, W - 20, mid, '#94a3b8', 1.3, r);
        const bar = (x, v, c, cs, lab) => {
            const h = Math.abs(v) * sc, y = v >= 0 ? mid - h : mid;
            V.rrect(svg, x, y, 120, Math.max(h, 2), c, cs, r);
            V.text(svg, x + 60, v >= 0 ? y - 14 : y + h + 16, (v > 0 ? '+' : '') + V.fmt(v, 1) + '%', { size: 15, weight: 700, color: c });
            V.text(svg, x + 60, H - 10, lab, { size: 14 });
        };
        bar(110, mkt, V.C.slate, V.C.slateS, 'market');
        bar(330, beta * mkt, beta > 1 ? V.C.rose : beta < 1 ? V.C.green : V.C.sky, beta > 1 ? V.C.roseS : beta < 1 ? V.C.greenS : V.C.skyS, 'asset (β x market)');
        V.text(svg, 285, mid - 8, 'x ' + V.fmt(beta, 1), { size: 16, weight: 700, color: '#475569' });
        read.innerHTML = `Expected response ≈ β x market move = ${V.fmt(beta, 1)} x ${mkt}% = <b>${V.fmt(beta * mkt, 1)}%</b>. ` +
            (beta > 1 ? 'β > 1: <b>more</b> systematic risk than average; the asset amplifies market swings.' : beta < 1 ? 'β < 1: <b>less</b> systematic risk than average.' : 'β = 1: average market sensitivity.') +
            ' Investors are compensated for this systematic risk, not for firm-specific risk they could diversify away. Formally β = Cov(R<sub>i</sub>, R<sub>m</sub>) / Var(R<sub>m</sub>).';
    }
    draw();
};
// Topic 2 visuals
ML_VIS.t2_silo_vs_erm = function (root) {
    const DEPTS = ['Finance: FX', 'Procurement: supplier', 'Strategy: expansion', 'Treasury: debt'];
    const P = 0.1, LOSS = 30, CAP = 60, N = 20000, Z = -1.2816;  // Phi^-1(0.1)
    let rho = 0;
    const r0 = V.rng(17), draws = [];
    for (let t = 0; t < N; t++) draws.push([V.gauss(r0), V.gauss(r0), V.gauss(r0), V.gauss(r0), V.gauss(r0)]);
    const silo = V.h('div', { class: 'vis-row' }, DEPTS.map(d => V.h('span', { class: 'vis-chip', style: { borderColor: V.C.green, background: V.C.greenS } }, d + ' · 10% · LOW')));
    const svg = V.svg(560, 250), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('p', { class: 'vis-note' }, 'Silo view: each department reports its own risk, each well inside its limit.'), silo,
        V.slider('Shared dependency (e.g. all rely on China-US trade)', 0, 0.9, 0.05, rho, v => { rho = v; draw(); }, v => V.fmt(v * 100, 0) + '%'), svg, read);
    function draw() {
        const counts = [0, 0, 0, 0, 0], a = Math.sqrt(rho), b = Math.sqrt(1 - rho);
        draws.forEach(d => { let k = 0; for (let i = 0; i < 4; i++) if (a * d[4] + b * d[i] < Z) k++; counts[k]++; });
        V.clear(svg); const r = V.rng(4), maxP = Math.max(...counts) / N;
        V.text(svg, 10, 18, 'Enterprise view: how many of the four losses happen in the same year?', { size: 14, anchor: 'start', weight: 700 });
        counts.forEach((c, k) => {
            const p = c / N, h = p / Math.max(maxP, 0.01) * 160, x = 40 + k * 105, y = 210 - h;
            const bad = k * LOSS > CAP;
            V.rrect(svg, x, y, 70, Math.max(h, 2), bad ? V.C.rose : V.C.sky, bad ? V.C.roseS : V.C.skyS, r);
            V.text(svg, x + 35, y - 12, V.fmt(p * 100, 1) + '%', { size: 13, weight: 700, color: bad ? V.C.rose : V.C.ink });
            V.text(svg, x + 35, 228, k + ' hit' + (k === 1 ? '' : 's'), { size: 13 });
            V.text(svg, x + 35, 244, 'RM' + k * LOSS + 'm', { size: 11, color: '#64748b' });
        });
        const pBad = (counts[3] + counts[4]) / N;
        read.innerHTML = `Each department still sees a 10% chance of a RM${LOSS}m loss. The firm can absorb RM${CAP}m, so three or more hits at once is a crisis. ` +
            `Chance of that: <b>${V.fmt(pBad * 100, 2)}%</b>` + (rho < 0.05 ? ' when the risks are independent: the silo view is roughly right.' :
                ` with a ${V.fmt(rho * 100, 0)}% shared dependency, about <b>${V.fmt(pBad / 0.0037, 0)}x</b> the independent case. No silo report changed; only the interaction did. That is why ERM aggregates.`);
    }
    draw();
};
// Topic 3 visuals
ML_VIS.t3_coso_cube3d = async function (root) {
    const OBJ = [['Strategic', 'high-level goals aligned with the mission'], ['Operations', 'effective and efficient use of resources'],
        ['Reporting', 'reliable reporting'], ['Compliance', 'compliance with laws and regulations']];
    const COMP = [['Internal environment', 'What culture, ethics and risk appetite does this unit really have?'],
        ['Objective setting', 'Is the objective stated clearly enough to identify what threatens it?'],
        ['Event identification', 'What could happen, good or bad, that affects the objective?'],
        ['Risk assessment', 'How likely is it, and how big would the impact be?'],
        ['Risk response', 'Avoid, reduce, transfer or accept?'],
        ['Control activities', 'Which controls make sure the response actually operates?'],
        ['Information & communication', 'Does the risk information reach the people who decide?'],
        ['Monitoring', 'Is it reviewed continuously as risks and controls change?']];
    const LVL = ['Entity-level', 'Division', 'Business unit', 'Subsidiary'];
    const EX = {
        Strategic: 'e.g. will the RM3bn foreign acquisition create the value promised?',
        Operations: 'e.g. can the plant keep running if the single supplier fails?',
        Reporting: 'e.g. is revenue reported from real, delivered sales?',
        Compliance: 'e.g. does the target hold the licences and meet the environmental rules?'
    };
    let o = 0, c = 3, l = 0;
    const read = V.h('p', { class: 'vis-readout' });
    const host = V.h('div', {});
    root.append(V.h('div', { class: 'vis-row' }, V.seg(OBJ.map((x, i) => [i, x[0]]), o, v => { o = v; paint(); })),
        V.h('div', { class: 'vis-row' }, V.seg(LVL.map((x, i) => [i, x]), l, v => { l = v; paint(); })),
        V.h('div', { class: 'vis-row' }, V.seg(COMP.map((x, i) => [i, x[0]]), c, v => { c = v; paint(); })), host, read);
    const ctx = await V.scene3d(host, { label: 'COSO cube', radius: 11.5, theta: 0.65, phi: 1.15, aspect: 1.5, target: [-0.7, 0, 0] });
    const cells = [];
    if (ctx) {
        const { THREE, scene } = ctx, S = 0.92, geo = new THREE.BoxGeometry(S, S * 0.5, S);
        const colors = [0xfacc15, 0xfb923c, 0xef4444, 0x84cc16, 0xd946ef, 0x3b82f6, 0x6366f1, 0x334155];
        for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) for (let k = 0; k < 4; k++) {
            const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: colors[j], transparent: true, opacity: 0.12 }));
            m.position.set((i - 1.5) * 1.0, (3.5 - j) * 0.55, (k - 1.5) * 1.0);
            scene.add(m); cells.push([i, j, k, m]);
        }
        OBJ.forEach((x, i) => { const s = V.label3d(THREE, x[0], '#4f46e5', 0.28); s.position.set((i - 1.5), 2.6, -2.3); scene.add(s); });
        LVL.forEach((x, k) => { const s = V.label3d(THREE, x, '#0f766e', 0.26); s.position.set(2.9, 2.3, (k - 1.5)); scene.add(s); });
        COMP.forEach((x, j) => { const s = V.label3d(THREE, x[0], '#334155', 0.22); s.position.set(-3.6, (3.5 - j) * 0.55, 2.2); scene.add(s); });
    }
    function paint() {
        cells.forEach(([i, j, k, m]) => {
            const hit = i === o && j === c && k === l, near = (i === o) + (j === c) + (k === l) >= 2;
            m.material.opacity = hit ? 0.95 : near ? 0.32 : 0.07;
            m.scale.setScalar(hit ? 1.08 : 1);
        });
        if (ctx) ctx.dirty();
        read.innerHTML = `<b>${OBJ[o][0]}</b> objective (${OBJ[o][1]}) x <b>${COMP[c][0]}</b> x <b>${LVL[l]}</b>: ${COMP[c][1]} ${EX[OBJ[o][0]]} ` +
            'Every cell is a question the enterprise must be able to answer; the cube forces ERM across objectives and levels, not just inside one risk department.';
    }
    paint();
};
// Topic 4 visuals
ML_VIS.t4_materiality = function (root) {
    const ISSUES = [
        ['E', 'Energy use'], ['E', 'GHG emissions'], ['E', 'Water'], ['E', 'Waste and pollution'], ['E', 'Land use and biodiversity'],
        ['S', 'Labour standards'], ['S', 'Health and safety'], ['S', 'Supply-chain practices'], ['S', 'Data privacy'], ['S', 'Community relations'],
        ['G', 'Board oversight'], ['G', 'Bribery and corruption'], ['G', 'Executive pay'], ['G', 'Reporting controls']];
    // 0 = low, 1 = relevant, 2 = highly material
    const IND = {
        'Semiconductor': [[2, 1, 2, 2, 0, 1, 2, 1, 0, 1, 1, 1, 1, 1], 'Water availability can halt fabs: E (drought) → production stops → revenue and delivery commitments missed.'],
        'Bank': [[0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 2, 2, 1, 2], 'Governance, data privacy and the ESG exposure of borrowers dominate: G failure → fraud or data breach → regulator, reputation, funding cost.'],
        'Plantation': [[1, 1, 1, 1, 2, 2, 2, 2, 0, 2, 1, 1, 0, 1], 'Land use, biodiversity and labour dominate: forced-labour allegation → import restrictions → products blocked → lost revenue.'],
        'Software consultancy': [[1, 0, 0, 0, 0, 1, 0, 0, 2, 0, 1, 1, 1, 1], 'Privacy and human capital matter most; emissions barely move value. Copying an oil company\'s ESG plan would miss the real risks.'],
        'Oil and gas': [[2, 2, 1, 2, 2, 1, 2, 1, 0, 2, 2, 2, 1, 2], 'GHG and the energy transition are strategic: regulation and investor exclusion can strand assets (index exclusion → capital-market access).'],
        'Manufacturer': [[2, 2, 1, 2, 0, 2, 2, 2, 0, 1, 2, 1, 1, 1], 'Energy, emissions, worker safety and suppliers: unsafe conditions → accident → shutdown → lost revenue → valuation.'],
    };
    let ind = 'Plantation';
    const box = V.h('div', { class: 'vis-table-wrap' }), read = V.h('p', { class: 'vis-readout' });
    root.append(V.seg(Object.keys(IND).map(k => [k, k]), ind, v => { ind = v; draw(); }), box, read);
    const shade = ['#f1f5f9', '#fde68a', '#fb7185'], word = ['low', 'relevant', 'MATERIAL'];
    function draw() {
        const lv = IND[ind][0];
        let rows = '';
        ['E', 'S', 'G'].forEach(p => {
            const cells = ISSUES.map((x, i) => [x, i]).filter(([x]) => x[0] === p)
                .map(([x, i]) => `<td style="background:${shade[lv[i]]};font-weight:${lv[i] === 2 ? 800 : 400}">${x[1]}<br><small>${word[lv[i]]}</small></td>`).join('');
            rows += `<tr><th>${p}</th>${cells}</tr>`;
        });
        box.innerHTML = `<table class="vis-table vis-heat">${rows}</table>`;
        const top = ISSUES.filter((x, i) => lv[i] === 2).map(x => x[1].toLowerCase());
        read.innerHTML = `<b>${ind}</b>: highly material issues are ${top.join(', ')}. ${IND[ind][1]} Materiality turns an endless ESG checklist into the few issues that can move this firm's objectives and value.`;
    }
    draw();
};

ML_VIS.t4_esg_chain = function (root) {
    const CASES = {
        labour: ['Forced-labour allegation in the supply chain (S)', [['Supplier accused of forced labour', 'S issue'], ['Import restrictions (withhold release orders)', 'compliance'], ['Products blocked at the border', 'operational'], ['Lost revenue', 'business'], ['Customers and investors question the firm', 'reputational'], ['Lower valuation, costlier capital', 'enterprise value']]],
        drought: ['Drought near the factory (E)', [['Drought', 'E condition'], ['Water shortage', 'operational'], ['Production declines', 'operational'], ['Revenue declines', 'business'], ['Cash flow deteriorates', 'financial'], ['Liquidity pressure', 'liquidity']]],
        green: ['Unverified "carbon neutral" claim (E + G)', [['Marketing claims carbon neutrality', 'E claim'], ['Nobody verified the data', 'G failure'], ['Consumers and NGOs expose the gap', 'reputational'], ['Regulator investigates misleading claims', 'compliance / legal'], ['Fines and lost sales', 'financial'], ['Trust and ESG-index eligibility fall', 'enterprise value']]],
        board: ['Bonuses tied only to short-term profit (G)', [['Pay rewards short-term EBITDA only', 'G issue'], ['Safety and environmental incidents rise', 'operational / E / S'], ['Shareholders vote against remuneration', 'governance'], ['Director accountability questioned', 'reputational'], ['Investors demand a higher return', 'financial'], ['Long-term value eroded', 'enterprise value']]],
    };
    let key = 'labour', step = 1;
    const stage = V.h('div', { class: 'vis-pipeline' }), read = V.h('p', { class: 'vis-readout' });
    const next = V.btn('Next step', () => { const n = CASES[key][1].length; step = step >= n ? 1 : step + 1; draw(); }, 'primary');
    root.append(V.seg(Object.entries(CASES).map(([k, c]) => [k, c[0].split(' (')[0]]), key, v => { key = v; step = 1; draw(); }), V.h('div', { class: 'vis-row' }, next), stage, read);
    const tone = t => /E|S |S$|G issue|G failure|claim/.test(t) ? V.C.violet : /value/.test(t) ? V.C.rose : /financial|liquidity/.test(t) ? V.C.amber : V.C.sky;
    function draw() {
        const steps = CASES[key][1];
        V.clear(stage);
        steps.slice(0, step).forEach(([t, cat], i) => {
            stage.append(V.h('div', { class: 'vis-prow vis-chainrow' }, V.h('b', {}, (i + 1) + '. ' + t),
                V.h('span', { class: 'vis-chip', style: { borderColor: tone(cat), background: tone(cat) + '18' } }, cat)));
        });
        next.textContent = step >= steps.length ? '↺ Start again' : 'Next step';
        read.innerHTML = step >= steps.length ? `<b>${CASES[key][0]}</b> ended as an enterprise-value problem. Answer with the chain, not one label: ESG driver → enterprise risks → value impact.`
            : 'Ask at each step: which enterprise risk has the ESG issue turned into now?';
    }
    draw();
};
