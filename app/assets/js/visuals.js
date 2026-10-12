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
// Topic 1 visuals (part 2): concept-explanation widgets
ML_VIS.t1_objective_lens = function (root) {
    const FIRMS = [['AirAsia (fuel is a big cost)', -0.6, V.C.rose], ['PETRONAS (sells crude)', 0.8, V.C.green], ['Software house (little fuel)', -0.02, V.C.slate]];
    let oil = 30;
    const W = 560, H = 230, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    root.append(V.slider('Oil price change', -30, 30, 5, oil, v => { oil = v; draw(); }, v => (v > 0 ? '+' : '') + v + '%'), svg, read);
    function draw() {
        V.clear(svg); const r = V.rng(21), mid = 330, sc = 5;
        V.rline(svg, mid, 16, mid, H - 24, '#94a3b8', 1.3, r);
        V.text(svg, mid, H - 8, "effect on this year's profit objective", { size: 12, color: '#64748b' });
        FIRMS.forEach(([name, k, c], i) => {
            const eff = k * oil, y = 30 + i * 62, w = Math.abs(eff) * sc;
            V.text(svg, 8, y + 18, name, { size: 13, anchor: 'start' });
            if (w > 1) V.rrect(svg, eff < 0 ? mid - w : mid, y, w, 34, c, c + '22', r);
            V.text(svg, eff < 0 ? mid - w - 8 : mid + w + 8, y + 18, (eff > 0 ? '+' : '') + V.fmt(eff, 1) + '%', { size: 14, weight: 700, color: c, anchor: eff < 0 ? 'end' : 'start' });
        });
        read.innerHTML = oil === 0 ? 'No change in oil price: no deviation from any objective.' :
            `The <b>same event</b> (oil ${oil > 0 ? 'up' : 'down'} ${Math.abs(oil)}%) is a threat to one firm, an opportunity to another and almost irrelevant to the third. ` +
            "Risk is not the event itself: it is the <b>effect of uncertainty on each firm's objectives</b>. Name the objective before you name the risk.";
    }
    draw();
};

ML_VIS.t1_tail_sim = function (root) {
    const YEARS = 30, pHit = 1 - Math.pow(0.99, YEARS);
    const hits = sd => { const r = V.rng(sd * 7919); for (let y = 0; y < YEARS; y++) if (r() < 0.01) return true; return false; };
    let seed = 1, cap = 20;
    while (!hits(seed)) seed++;
    const W = 560, H = 250, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    const capS = V.slider('Capital the firm can lose and survive', 5, 150, 5, cap, v => { cap = v; draw(); }, v => 'RM' + v + 'm');
    root.append(V.h('div', { class: 'vis-row' }, V.btn('Simulate another 30 years', () => { seed++; draw(); }, 'primary'), capS), svg, read);
    function draw() {
        const r = V.rng(seed * 7919), a = [], b = [];
        let ca = 0, cb = 0, worstA = 0;
        for (let y = 0; y < YEARS; y++) {
            const la = r() < 0.01 ? 100 : 0; worstA = Math.max(worstA, la);
            ca += la; cb += 1; a.push(ca); b.push(cb);
        }
        V.clear(svg); const rr = V.rng(3), L = 50, T = 14, PW = 490, PH = 190, top = Math.max(110, ca + 10, cap + 10);
        const X = i => L + i / (YEARS - 1) * PW, Y = v => T + PH - v / top * PH;
        V.rline(svg, L, T + PH, L + PW, T + PH, V.C.ink, 1.4, rr); V.rline(svg, L, T, L, T + PH, V.C.ink, 1.4, rr);
        const path = (arr, c) => svg.append(V.s('path', { d: arr.map((v, i) => (i ? 'L' : 'M') + X(i) + ' ' + Y(v)).join(' '), fill: 'none', stroke: c, 'stroke-width': 3 }));
        path(b, V.C.sky); path(a, V.C.rose);
        V.rline(svg, L, Y(cap), L + PW, Y(cap), V.C.amber, 1.6, rr, { 'stroke-dasharray': '7 5' });
        V.text(svg, L + 6, Y(cap) - 8, 'capital RM' + cap + 'm', { size: 12, color: V.C.amber, anchor: 'start' });
        V.text(svg, X(YEARS - 1) - 4, Y(b[YEARS - 1]) + 14, 'Risk B: RM1m every year', { size: 12, color: V.C.sky, anchor: 'end' });
        V.text(svg, X(2), Y(a[2]) - 12, 'Risk A: 1% chance a year of RM100m', { size: 12, color: V.C.rose, anchor: 'start' });
        V.text(svg, L + PW / 2, H - 6, 'years →   (cumulative losses, RMm)', { size: 12, color: '#64748b' });
        read.innerHTML = `Both risks have an expected loss of <b>RM1m a year</b>. In this run Risk B lost RM${cb}m steadily; Risk A lost RM${ca}m${worstA ? ' in one catastrophic year' : ' (no disaster this time; try another run)'}. ` +
            `Across many 30-year periods, Risk A produces at least one RM100m year about <b>${V.fmt(pHit * 100, 0)}%</b> of the time` +
            (cap < 100 ? `, and with RM${cap}m of capital that single year would <b>break the firm</b>. Risk B never threatens survival.` : '; with capital above RM100m the firm survives either way.') +
            ' Same average, very different tail: look at the distribution, not just the mean.';
    }
    draw();
};

ML_VIS.t1_identify_lens = function (root) {
    const EXP = ['Blocked emergency exit', 'Flammable storage', 'Single critical supplier', 'High short-term debt', 'Repeated forklift accidents', 'Unclear payment approvals'];
    const METHODS = {
        checklist: ['Questionnaires / checklists', [0, 1, 5], 'Systematic prompts catch common hazards and missing procedures.'],
        inspect: ['Physical inspection', [0, 1], 'Walking the site reveals physical hazards no document shows.'],
        flow: ['Flowcharts', [2, 5], 'Mapping the process exposes dependencies and weak steps.'],
        fin: ['Financial statements', [3], 'The balance sheet reveals financial and liquidity exposure.'],
        hist: ['Historical loss data', [4], 'Past losses reveal recurring control weaknesses.'],
        all: ['All five together', [0, 1, 2, 3, 4, 5], 'Combined, the methods see the firm from every direction.'],
    };
    let m = 'inspect';
    const grid = V.h('div', { class: 'vis-row' }), read = V.h('p', { class: 'vis-readout' });
    root.append(V.seg(Object.entries(METHODS).map(([k, v]) => [k, v[0]]), m, v => { m = v; draw(); }), grid, read);
    function draw() {
        const found = METHODS[m][1];
        V.clear(grid);
        EXP.forEach((e, i) => {
            const on = found.includes(i);
            grid.append(V.h('span', { class: 'vis-chip', style: { borderColor: on ? V.C.green : '#cbd5e1', background: on ? V.C.greenS : '#f8fafc', color: on ? '#065f46' : '#94a3b8', fontWeight: on ? 700 : 400, fontSize: '13px', padding: '6px 12px' } }, (on ? 'found: ' : 'missed: ') + e));
        });
        read.innerHTML = `<b>${METHODS[m][0]}</b> finds ${found.length} of ${EXP.length} exposures. ${METHODS[m][2]} ` +
            (m === 'all' ? 'That is why the slides list several identification methods.' : 'A balance sheet will not show a blocked exit, and an inspection will not show a looming debt repayment: <b>use several methods</b>.');
    }
    draw();
};

ML_VIS.t1_cascade = function (root) {
    const CASES = {
        cyber: ['Cyberattack on a bank', [['Hackers take IT systems down', 'root: operational'], ['Customers cannot transact', 'business / revenue'], ['Customers complain publicly', 'reputational'], ['Cash inflow falls', 'liquidity'], ['Profit and continuity objectives missed', 'effect on objective']]],
        kfc: ['KFC Malaysia outlet closures', [['Boycott shifts customer sentiment', 'root: business (demand)'], ['Brand perception worsens', 'reputational (also a driver)'], ['Revenue per outlet falls', 'business consequence'], ['Outlets close temporarily', 'operational consequence'], ['Revenue objective missed', 'effect on objective']]],
        ev: ['EV-battery maker, one supplier', [['Sole mineral supplier shuts down', 'root: resource / supplier'], ['Production stops for two months', 'operational consequence'], ['Orders cannot be fulfilled', 'business / customer'], ['Customers complain online', 'reputational'], ['Revenue collapses; debt hard to repay', 'funding liquidity']]],
    };
    let key = 'cyber', step = 1;
    const stage = V.h('div', { class: 'vis-pipeline' }), read = V.h('p', { class: 'vis-readout' });
    const next = V.btn('Next step', () => { const n = CASES[key][1].length; step = step >= n ? 1 : step + 1; draw(); }, 'primary');
    root.append(V.seg(Object.entries(CASES).map(([k, c]) => [k, c[0]]), key, v => { key = v; step = 1; draw(); }), V.h('div', { class: 'vis-row' }, next), stage, read);
    const tone = t => /^root/.test(t) ? V.C.rose : /objective/.test(t) ? V.C.amber : /liquidity/.test(t) ? V.C.violet : V.C.sky;
    function draw() {
        const steps = CASES[key][1];
        V.clear(stage);
        steps.slice(0, step).forEach(([t, cat], i) => stage.append(V.h('div', { class: 'vis-prow vis-chainrow' }, V.h('b', {}, (i + 1) + '. ' + t),
            V.h('span', { class: 'vis-chip', style: { borderColor: tone(cat), background: tone(cat) + '18' } }, cat))));
        next.textContent = step >= steps.length ? '↺ Start again' : 'Next step';
        read.innerHTML = step >= steps.length ? 'One event, a <b>risk cascade</b>. A strong answer names the <b>root</b> first, then the consequences it triggers, instead of picking one word from a list.' :
            'Keep stepping: which risk category is this link?';
    }
    draw();
};

ML_VIS.t1_market_moves = function (root) {
    let view = 'dir', vol = 1;
    const W = 560, H = 240, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' }, V.seg([['dir', 'Directional view'], ['vol', 'Volatility view']], view, v => { view = v; draw(); }),
        V.slider('Volatility', 0.3, 3, 0.1, vol, v => { vol = v; draw(); }, v => V.fmt(v, 1) + 'x')), svg, read);
    function draw() {
        const r = V.rng(11), N = 60, p = [4.40];
        for (let i = 1; i < N; i++) p.push(p[i - 1] + 0.004 + V.gauss(r) * 0.02 * vol);
        const lo = Math.min(...p), hi = Math.max(...p), L = 50, T = 18, PW = 480, PH = 176;
        const X = i => L + i / (N - 1) * PW, Y = v => T + PH - (v - lo + 0.02) / (hi - lo + 0.04) * PH;
        V.clear(svg); const rr = V.rng(2);
        V.rline(svg, L, T + PH, L + PW, T + PH, V.C.ink, 1.3, rr); V.rline(svg, L, T, L, T + PH, V.C.ink, 1.3, rr);
        if (view === 'vol') svg.append(V.s('rect', { x: L, y: Y(hi), width: PW, height: Y(lo) - Y(hi), fill: V.C.amberS, opacity: 0.7 }));
        svg.append(V.s('path', { d: p.map((v, i) => (i ? 'L' : 'M') + X(i) + ' ' + Y(v)).join(' '), fill: 'none', stroke: V.C.sky, 'stroke-width': 2.5 }));
        if (view === 'dir') {
            V.arrow(svg, X(0), Y(p[0]), X(N - 1), Y(p[N - 1]), V.C.rose, 2, rr);
            V.text(svg, X(N - 1) - 4, Y(p[N - 1]) + (p[N - 1] > p[0] ? 16 : -14), 'end ' + V.fmt(p[N - 1], 2), { size: 13, color: V.C.rose, anchor: 'end', weight: 700 });
        } else {
            V.text(svg, L + PW - 4, Y(hi) - 6, 'range ' + V.fmt(lo, 2) + ' to ' + V.fmt(hi, 2), { size: 13, color: V.C.amber, anchor: 'end', weight: 700 });
        }
        V.text(svg, L - 6, Y(p[0]), V.fmt(p[0], 2), { size: 11, color: '#64748b', anchor: 'end' });
        V.text(svg, L + PW / 2, H - 6, 'USD/MYR over 60 days', { size: 12, color: '#64748b' });
        const ch = (p[N - 1] / p[0] - 1) * 100;
        read.innerHTML = view === 'dir' ? `<b>Directional risk</b> cares <b>where</b> the rate ends: USD/MYR moved ${ch > 0 ? 'up' : 'down'} ${V.fmt(Math.abs(ch), 1)}%, so a Malaysian importer paying in USD ${ch > 0 ? 'pays more' : 'pays less'} per dollar.` :
            `<b>Non-directional (volatility) risk</b> cares <b>how much</b> it swings: the rate ranged over ${V.fmt((hi - lo) / p[0] * 100, 1)}% of its starting value. Raise the volatility slider: the swings grow even when the end point barely changes (this matters for options and hedging).`;
    }
    draw();
};

ML_VIS.t1_classify_quiz = function (root) {
    const DIMS = ['Gain possible?', 'Can a portfolio remove it?', 'Enterprise category (origin)', 'Sensible control'];
    const EV = {
        fire: ['Factory fire', ['Pure: loss or no loss', 'Diversifiable (firm-specific)', 'Operational, with liquidity and reputational consequences', 'Prevention (safety rules) + reduction (sprinklers)']],
        shares: ['Buying shares in one company', ['Speculative: gain, none or loss', 'Firm-specific part yes; market part no (systematic, β)', 'Market risk', 'Diversify the portfolio; limit position size']],
        ceo: ['CEO resigns unexpectedly', ['Speculative: the successor may be better or worse', 'Diversifiable (firm-specific)', 'Business / resource (key person)', 'Succession planning (reduction)']],
        rates: ['Bank Negara raises rates sharply', ['Speculative: some firms gain, many lose', 'Non-diversifiable (systematic)', 'Market risk (interest rate)', 'Hedge or fix borrowing rates (reduction)']],
        model: ['Flawed credit-scoring model', ['Pure: losses only', 'Diversifiable (firm-specific)', 'Operational (model risk) at the root; credit losses follow', 'Model validation and review (prevention)']],
        unpaid: ['Major customer cannot pay its invoice', ['Pure: loss or no loss', 'Diversifiable (firm-specific)', 'Credit risk', 'Credit checks (prevention); collateral or limits (reduction)']],
        boycott: ['Consumer boycott of the brand', ['Pure for the firm: demand only falls', 'Diversifiable (firm-specific)', 'Business (demand) with a reputational component', 'Stakeholder engagement; diversify markets']],
    };
    let key = 'fire', shown = false;
    const box = V.h('div', { class: 'vis-table-wrap' }), read = V.h('p', { class: 'vis-readout' });
    const btn = V.btn('Reveal the labels', () => { shown = !shown; draw(); }, 'primary');
    root.append(V.seg(Object.entries(EV).map(([k, e]) => [k, e[0]]), key, v => { key = v; shown = false; draw(); }), V.h('div', { class: 'vis-row' }, btn), box, read);
    function draw() {
        const rows = DIMS.map((d, i) => `<tr><th>${d}</th><td class="${shown ? 'hl' : ''}">${shown ? EV[key][1][i] : '<i>think first, then reveal</i>'}</td></tr>`).join('');
        box.innerHTML = `<table class="vis-table" style="width:100%"><tr><th colspan="2">${EV[key][0]}</th></tr>${rows}</table>`;
        btn.textContent = shown ? 'Hide labels' : 'Reveal the labels';
        read.innerHTML = 'Each row asks a <b>different question</b>, so one event carries several labels at once. Answer each row in your head before revealing.';
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
// Topic 2 visuals (part 2): concept-explanation widgets
ML_VIS.t2_liability_sim = function (root) {
    const ASSETS = 100;  // RM'000 of business assets
    const FORMS = {
        sole: ['Sole proprietorship', 'unlimited'], part: ['General partnership (2 partners)', 'joint'],
        llp: ['LLP', 'limited'], sdn: ['Sdn. Bhd.', 'limited'],
    };
    let form = 'sole', debt = 500;
    const W = 560, H = 210, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    root.append(V.seg(Object.entries(FORMS).map(([k, f]) => [k, f[0]]), form, v => { form = v; draw(); }),
        V.slider('Business debts', 50, 1000, 50, debt, v => { debt = v; draw(); }, v => 'RM' + v + 'k'), svg, read);
    function draw() {
        const kind = FORMS[form][1], fromAssets = Math.min(debt, ASSETS), rest = debt - fromAssets;
        const personal = kind === 'limited' ? 0 : rest, unpaid = kind === 'limited' ? rest : 0;
        V.clear(svg); const r = V.rng(5), L = 20, PW = 520, sc = PW / 1000;
        const seg = (x, w, c, cs, t) => { if (w <= 0) return x; V.rrect(svg, x, 60, w * sc, 60, c, cs, r); if (w * sc > 40) V.text(svg, x + w * sc / 2, 90, w * sc < 110 ? t.split(' ').pop() : t, { size: 13, weight: 700, color: c }); return x + w * sc; };
        V.text(svg, L, 30, `Who pays RM${debt}k of debts? (business assets RM${ASSETS}k)`, { size: 15, anchor: 'start', weight: 700 });
        let x = seg(L, fromAssets, V.C.slate, V.C.slateS, 'business assets');
        x = seg(x, personal, V.C.rose, V.C.roseS, kind === 'joint' ? "partners' personal assets" : "owner's house, savings");
        seg(x, unpaid, V.C.amber, V.C.amberS, 'creditors bear the loss');
        V.text(svg, L, 150, kind === 'limited' ? 'Liability stops at the investment: the company is a separate legal entity.' :
            kind === 'joint' ? 'Jointly and severally liable: either partner can be pursued for the whole debt.' : 'Unlimited liability: business risk becomes personal risk.', { size: 13, anchor: 'start', color: '#334155' });
        V.text(svg, L, 178, 'The business risk itself (lost sales, failed project) is the same in every form.', { size: 13, anchor: 'start', color: '#64748b' });
        read.innerHTML = `<b>${FORMS[form][0]}</b>: ` + (kind === 'limited' ? `owners lose what they invested; the remaining RM${rest}k is the creditors' problem, not the owners' personal one.` :
            kind === 'joint' ? `RM${rest}k must come from the partners personally, and Ali can be pursued for all of it even if Bala signed the bad contract.` :
                `the owner must find RM${rest}k personally. Simplicity reduces admin but concentrates risk on one person.`) +
            ' Legal form changes <b>who bears the loss</b>, not how risky the business is.';
    }
    draw();
};

ML_VIS.t2_objective_tradeoff = function (root) {
    let cut = 0.1, maint = 0, obj = 'sales';
    const W = 560, H = 240, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' }, V.slider('Price cut', 0, 0.3, 0.05, cut, v => { cut = v; draw(); }, v => Math.round(v * 100) + '%'),
        V.slider('Maintenance cut', 0, 0.6, 0.1, maint, v => { maint = v; draw(); }, v => Math.round(v * 100) + '%')),
        V.seg([['sales', 'Objective: maximise sales'], ['profit', 'Objective: maximise profit'], ['wealth', 'Objective: long-term wealth']], obj, v => { obj = v; draw(); }), svg, read);
    const calc = (c, m) => {
        const P = 100 * (1 - c), Q = 1000 * (1 + 2 * c), rev = P * Q, profit = rev - 60 * Q - 10000 * (1 - m) - 10000;
        const loss = (0.05 + 0.4 * m) * 200000, wealth = 5 * (profit - loss);
        return { rev, profit, loss, wealth };
    };
    function draw() {
        const base = calc(0, 0), now = calc(cut, maint);
        const items = [['Sales revenue', 'rev', V.C.sky], ['Profit this year', 'profit', V.C.amber], ['Expected breakdown loss / yr', 'loss', V.C.rose], ['5-year value (profit - losses)', 'wealth', V.C.green]];
        V.clear(svg); const r = V.rng(8);
        items.forEach(([lab, k, c], i) => {
            const y = 20 + i * 52, b = base[k], v = now[k], pct = b ? (v - b) / Math.abs(b) * 100 : 0, w = Math.min(Math.abs(pct), 95) * 1.6;
            V.text(svg, 10, y + 18, lab, { size: 13, anchor: 'start' });
            V.rline(svg, 380, y, 380, y + 36, '#94a3b8', 1.2, r);
            if (w > 1) V.rrect(svg, pct < 0 ? 380 - w : 380, y + 4, w, 28, c, c + '22', r);
            V.text(svg, pct < 0 ? 380 - w - 6 : 380 + w + 6, y + 18, (pct > 0 ? '+' : '') + V.fmt(pct, 0) + '%', { size: 13, weight: 700, color: c, anchor: pct < 0 ? 'end' : 'start' });
        });
        V.text(svg, 380, H - 6, 'change versus no price cut and full maintenance', { size: 11, color: '#64748b' });
        const good = { sales: now.rev >= base.rev, profit: now.profit >= base.profit, wealth: now.wealth >= base.wealth }[obj];
        read.innerHTML = `Against the objective <b>${{ sales: 'maximise sales', profit: 'maximise profit', wealth: 'long-term shareholder wealth' }[obj]}</b>, this decision ${good ? '<b>looks good</b>' : '<b>looks bad</b>'}. ` +
            'The same decision can be right for one objective and wrong for another: sales are not profit, and this year\'s profit is not long-term wealth. That is why risk management cannot be separated from strategy.';
    }
    draw();
};

ML_VIS.t2_risk_appetite = function (root) {
    const S = [['A', 4, 5], ['D', 8, 12], ['B', 15, 20], ['C', 25, 45]];  // name, expected return %, risk (volatility %)
    let appetite = 25, capacity = 25;
    const W = 560, H = 270, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' }, V.slider('Risk appetite (max volatility)', 5, 50, 1, appetite, v => { appetite = v; draw(); }, v => v + '%'),
        V.slider('Risk capacity (max bad-year loss)', 5, 60, 1, capacity, v => { capacity = v; draw(); }, v => v + '%')), svg, read);
    function draw() {
        const L = 50, T = 14, PW = 480, PH = 210, X = v => L + v / 50 * PW, Y = v => T + PH - v / 30 * PH;
        V.clear(svg); const r = V.rng(6);
        svg.append(V.s('rect', { x: L, y: T, width: X(appetite) - L, height: PH, fill: V.C.limeS, opacity: 0.7 }));
        V.rline(svg, L, T + PH, L + PW, T + PH, V.C.ink, 1.4, r); V.rline(svg, L, T, L, T + PH, V.C.ink, 1.4, r);
        V.text(svg, L + PW / 2, H - 6, 'risk (volatility %) →', { size: 12, color: '#64748b' });
        const yl = V.text(svg, 14, T + PH / 2, 'expected return % →', { size: 12, color: '#64748b' }); yl.setAttribute('transform', `rotate(-90 14 ${T + PH / 2})`);
        const ok = [];
        S.forEach(([n, ret, risk]) => {
            const worst = ret - 2 * risk, fits = risk <= appetite && -worst <= capacity;
            if (fits) ok.push([n, ret]);
            svg.append(V.s('circle', { cx: X(risk), cy: Y(ret), r: 11, fill: fits ? V.C.green : '#cbd5e1', stroke: '#fff', 'stroke-width': 2 }));
            V.text(svg, X(risk), Y(ret) - 20, `${n}: ${ret}%`, { size: 13, weight: 700, color: fits ? V.C.green : '#94a3b8' });
        });
        const best = ok.sort((a, b) => b[1] - a[1])[0];
        read.innerHTML = `Strategies within appetite <b>and</b> capacity (bad year ≈ return - 2 x volatility): ${ok.length ? ok.map(o => o[0]).join(', ') : 'none'}. ` +
            (best ? `ERM would favour <b>${best[0]}</b>, the highest expected return that still fits, not automatically the safest (A).` : 'Nothing fits: rethink the strategy or strengthen the balance sheet.') +
            ' Risk management optimises decisions under uncertainty; it does not simply minimise risk.';
    }
    draw();
};

ML_VIS.t2_level_sorter = function (root) {
    const ITEMS = {
        china: ['Decide to enter the China market', 'Strategic', 'A change of direction: is it the right thing to do?'],
        ev: ['Launch an EV-first model line', 'Strategic', 'Whether the chosen direction succeeds.'],
        supplier: ['Choose a cheaper battery supplier', 'Tactical', 'How the strategy is executed (suppliers).'],
        hedge: ['Fuel hedging and aircraft financing', 'Tactical', 'Financing and market risk sit at the tactical level on the slide.'],
        machine: ['A production machine breaks down', 'Operational', 'Day-to-day execution failed.'],
        payment: ['Clerk enters the wrong payment amount', 'Operational', 'Human error in daily processes.'],
        privacy: ['New data-privacy law tightens consent rules', 'Compliance', 'Are we allowed to do what we are doing?'],
        licence: ['Landing rights / operating licence lapses', 'Compliance', 'A legal requirement for operating.'],
    };
    const TONE = { Strategic: V.C.lime, Tactical: V.C.sky, Operational: V.C.amber, Compliance: V.C.rose };
    let key = 'china', shown = false;
    const out = V.h('div', { class: 'vis-pipeline' }), read = V.h('p', { class: 'vis-readout' });
    const btn = V.btn('Reveal the level', () => { shown = !shown; draw(); }, 'primary');
    root.append(V.seg(Object.entries(ITEMS).map(([k, it]) => [k, it[0]]), key, v => { key = v; shown = false; draw(); }), V.h('div', { class: 'vis-row' }, btn), out, read);
    function draw() {
        const [t, lvl, why] = ITEMS[key];
        V.clear(out);
        out.append(V.h('div', { class: 'vis-prow vis-chainrow' }, V.h('b', {}, t),
            V.h('span', { class: 'vis-chip', style: shown ? { borderColor: TONE[lvl], background: TONE[lvl] + '22', fontWeight: 700 } : {} }, shown ? lvl : '?')));
        btn.textContent = shown ? 'Hide' : 'Reveal the level';
        read.innerHTML = shown ? `<b>${lvl}</b>: ${why}` : 'Strategic = right thing? Tactical = how to execute? Operational = day to day? Compliance = allowed? Decide, then reveal.';
    }
    draw();
};

ML_VIS.t2_acquisition_cascade = function (root) {
    const LINKS = [['Environmental complaints', 'Regulator shuts the key supplier', 0.3, 'env'], ['Regulator shuts the key supplier', 'Production stops', 0.8, 'sup'],
        ['Production stops', 'Revenue falls', 0.9, 'it'], ['Revenue falls', 'Debt payments come under pressure', 0.7, 'lev'], ['Debt payments come under pressure', 'Liquidity crisis; acquisition strategy fails', 0.6, 'liq']];
    const TREAT = { env: ['Environmental due diligence', 0.4], sup: ['Diversify suppliers', 0.25], it: ['IT integration and continuity plan', 0.7], lev: ['Lower leverage', 0.5], liq: ['Liquidity reserve', 0.35] };
    const on = {};
    const box = V.h('div', { class: 'vis-pipeline' }), read = V.h('p', { class: 'vis-readout' });
    const checks = V.h('div', { class: 'vis-row' }, Object.entries(TREAT).map(([k, [t]]) => {
        const b = V.h('button', { type: 'button', class: 'vis-btn' }, '+ ' + t);
        b.addEventListener('click', () => { on[k] = !on[k]; b.classList.toggle('primary', !!on[k]); b.textContent = (on[k] ? '● ' : '+ ') + t; draw(); });
        return b;
    }));
    root.append(V.h('p', { class: 'vis-note' }, 'ABC Berhad buys an Indonesian manufacturer with heavy debt. Add treatments and watch each link weaken.'), checks, box, read);
    function draw() {
        V.clear(box); let p = 1, p0 = 1;
        LINKS.forEach(([a, b, prob, k]) => {
            const q = prob * (on[k] ? TREAT[k][1] : 1); p *= q; p0 *= prob;
            box.append(V.h('div', { class: 'vis-prow vis-chainrow' }, V.h('b', {}, a + ' → ' + b),
                V.h('span', { class: 'vis-chip', style: { borderColor: on[k] ? V.C.green : V.C.rose, background: (on[k] ? V.C.green : V.C.rose) + '18' } }, 'link ' + Math.round(q * 100) + '%')));
        });
        read.innerHTML = `Chance the whole chain runs to a failed acquisition: <b>${V.fmt(p * 100, 1)}%</b> (untreated ${V.fmt(p0 * 100, 1)}%). ` +
            'Silo teams would each see one link. ERM looks at the <b>whole chain</b>, treats the weakest links and then compares the <b>residual risk</b> with the expected strategic value (+20% market share) before deciding.';
    }
    draw();
};

ML_VIS.t2_stage_quiz = function (root) {
    const SC = {
        a: ['The firm only buys property insurance and claims after each fire.', 'Insurance-based / traditional RM', 'Pure risks, reactive, insurer pays. Uninsurable risks ignored.'],
        b: ['Treasury hedges FX, IT handles cyber, operations handles safety; nobody combines them.', 'Traditional (silo) RM / conventional CRM', 'Specialists manage their own risks; correlations go unseen.'],
        c: ['Before entering Indonesia, the risk team weighs strategic, FX, regulatory and supply risks with management.', 'Integrated RM (1980s-90s)', 'Risk becomes part of the strategic decision itself.'],
        d: ['The board reviews all material risks together against long-term firm value and risk appetite.', 'Enterprise RM (2000s)', 'Holistic, enterprise-wide, value-based.'],
        e: ['Climate, governance and compliance risks are built into the same risk framework as financial risks.', 'Holistic RM (recent)', 'ERM widened to sustainability, governance and compliance.'],
    };
    let key = 'a', shown = false;
    const box = V.h('div', { class: 'vis-table-wrap' }), read = V.h('p', { class: 'vis-readout' });
    const btn = V.btn('Reveal the stage', () => { shown = !shown; draw(); }, 'primary');
    root.append(V.seg(Object.keys(SC).map((k, i) => [k, 'Firm ' + (i + 1)]), key, v => { key = v; shown = false; draw(); }), V.h('div', { class: 'vis-row' }, btn), box, read);
    function draw() {
        const [desc, stage, why] = SC[key];
        box.innerHTML = `<table class="vis-table" style="width:100%"><tr><th>What the firm does</th><td>${desc}</td></tr><tr><th>Stage</th><td class="${shown ? 'hl' : ''}">${shown ? stage : '<i>decide first</i>'}</td></tr><tr><th>Why</th><td>${shown ? why : ''}</td></tr></table>`;
        btn.textContent = shown ? 'Hide' : 'Reveal the stage';
        read.innerHTML = 'Insurance → traditional silos → integrated → ERM → holistic. Each stage appeared because the previous one stopped being enough.';
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
// Topic 3 visuals (part 2): concept-explanation widgets
ML_VIS.t3_oversight_sim = function (root) {
    const EL = { acc: ['Accountability', 0.35], tra: ['Transparency (full risk report reaches the board)', 0.45], reg: ['Regulatory framework', 0.2],
        eth: ['Ethics (conflicts declared)', 0.3], adm: ['Administrative structure (independent risk committee)', 0.4] };
    const on = {}; let charisma = 0.3;
    const W = 560, H = 120, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    const btns = V.h('div', { class: 'vis-row' }, Object.entries(EL).map(([k, [t]]) => {
        const b = V.h('button', { type: 'button', class: 'vis-btn' }, '+ ' + t);
        b.addEventListener('click', () => { on[k] = !on[k]; b.classList.toggle('primary', !!on[k]); b.textContent = (on[k] ? '● ' : '+ ') + t; draw(); });
        return b;
    }));
    root.append(V.h('p', { class: 'vis-note' }, 'A CEO pushes a RM3bn acquisition: directors have ties to the seller, due diligence is rushed. Switch on governance elements.'), btns,
        V.slider('CEO persuasiveness', 0, 0.9, 0.1, charisma, v => { charisma = v; draw(); }, v => Math.round(v * 100) + '%'), svg, read);
    function draw() {
        let p = 0.9;
        Object.entries(EL).forEach(([k, [, c]]) => { if (on[k]) p *= 1 - c * (1 - charisma * 0.6); });
        V.clear(svg); const r = V.rng(4), w = p * 500;
        V.text(svg, 10, 20, 'Chance the flawed deal sails through unchallenged', { size: 14, anchor: 'start', weight: 700 });
        V.rrect(svg, 10, 40, 520, 44, '#cbd5e1', '#f8fafc', r);
        V.rrect(svg, 10, 40, Math.max(w, 2), 44, p > 0.5 ? V.C.rose : p > 0.2 ? V.C.amber : V.C.green, (p > 0.5 ? V.C.rose : p > 0.2 ? V.C.amber : V.C.green) + '33', r);
        V.text(svg, 20 + w, 62, Math.round(p * 100) + '%', { size: 16, weight: 700, anchor: 'start' });
        const n = Object.values(on).filter(Boolean).length;
        read.innerHTML = (n === 0 ? 'No governance: management decides and judges itself. ' : `${n} element${n > 1 ? 's' : ''} active. `) +
            '<b>Counter-intuitive:</b> raising the CEO\'s persuasiveness makes the deal <i>more</i> dangerous, not less. A brilliant, convincing leader needs <b>more</b> independent challenge, because good management is not the same as good governance.';
    }
    draw();
};

ML_VIS.t3_incentive_culture = function (root) {
    let vol = 80, poster = false;
    const W = 560, H = 200, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    const pb = V.btn('Add a giant "Safety First" poster', () => { poster = !poster; pb.textContent = poster ? 'Remove the poster' : 'Add a giant "Safety First" poster'; draw(); });
    root.append(V.slider('Bonus weight on production volume (rest on safety)', 0, 100, 10, vol, v => { vol = v; draw(); }, v => v + '%'), V.h('div', { class: 'vis-row' }, pb), svg, read);
    function draw() {
        const skip = Math.round(5 + 0.6 * vol), r = V.rng(9);
        V.clear(svg);
        V.text(svg, 10, 20, 'Share of required safety stops that workers skip', { size: 14, anchor: 'start', weight: 700 });
        V.rrect(svg, 10, 40, 520, 40, '#cbd5e1', '#f8fafc', r);
        V.rrect(svg, 10, 40, 520 * skip / 100, 40, skip > 40 ? V.C.rose : skip > 20 ? V.C.amber : V.C.green, (skip > 40 ? V.C.rose : V.C.green) + '33', r);
        V.text(svg, 20 + 520 * skip / 100, 60, skip + '%', { size: 16, weight: 700, anchor: 'start' });
        V.text(svg, 10, 116, 'Stated culture (poster): "safety is our highest priority"', { size: 13, anchor: 'start', color: '#475569' });
        V.text(svg, 10, 142, 'Real culture (what pay rewards): ' + (vol >= 60 ? 'output first' : vol >= 30 ? 'mixed signals' : 'safety first'), { size: 13, anchor: 'start', weight: 700, color: vol >= 60 ? V.C.rose : V.C.green });
        if (poster) V.text(svg, 10, 176, 'Poster added... skipped stops unchanged.', { size: 14, anchor: 'start', color: V.C.amber, weight: 700 });
        read.innerHTML = '<b>Counter-intuitive:</b> the poster changes nothing; the bonus formula changes everything. Risk governance is "embedded" only when incentives, accountability and behaviour point the same way as the policy.';
    }
    draw();
};

ML_VIS.t3_info_filter = function (root) {
    let layers = 4, disc = 0.25, direct = false;
    const TRUE = 90, W = 560, H = 240, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    const db = V.btn('Add a direct risk-reporting line to the board', () => { direct = !direct; db.classList.toggle('primary', direct); draw(); });
    root.append(V.h('div', { class: 'vis-row' }, V.slider('Reporting layers', 1, 6, 1, layers, v => { layers = v; draw(); }),
        V.slider('Bad news softened per layer', 0, 0.5, 0.05, disc, v => { disc = v; draw(); }, v => Math.round(v * 100) + '%')), V.h('div', { class: 'vis-row' }, db), svg, read);
    const col = v => v >= 70 ? V.C.rose : v >= 40 ? V.C.amber : V.C.green;
    function draw() {
        const vals = [TRUE];
        for (let i = 0; i < layers; i++) vals.push(vals[i] * (1 - disc));
        const board = direct ? TRUE : vals[vals.length - 1];
        V.clear(svg); const r = V.rng(3), n = vals.length + 1, bw = Math.min(70, 480 / n - 10);
        const names = ['Plant manager'].concat(Array.from({ length: layers }, (_, i) => 'Layer ' + (i + 1)), ['BOARD SEES']);
        vals.concat([board]).forEach((v, i) => {
            const x = 20 + i * (bw + 10), h = v * 1.7;
            V.rrect(svg, x, 190 - h, bw, h, col(v), col(v) + '33', r);
            V.text(svg, x + bw / 2, 180 - h, Math.round(v), { size: 13, weight: 700, color: col(v) });
            V.text(svg, x + bw / 2, 206, names[i].length > 9 ? names[i].split(' ')[0] : names[i], { size: 11, color: '#475569' });
        });
        V.text(svg, 20, 230, 'risk score: red ≥ 70, amber ≥ 40, green below', { size: 11, anchor: 'start', color: '#64748b' });
        read.innerHTML = `Reality on the shop floor: <b>${TRUE} (red)</b>. The board sees <b>${Math.round(board)}</b> (${board >= 70 ? 'red' : board >= 40 ? 'amber' : 'green'}). ` +
            (direct ? 'A direct risk line bypasses the softening layers: information travels up intact.' :
                '<b>Counter-intuitive:</b> nobody lied outright; each layer just softened the news a little, and the dashboard turned green. Decision quality can never exceed information quality: that is the transparency element.');
    }
    draw();
};

ML_VIS.t3_swiss_cheese = function (root) {
    const L = [['dual', 'Two signatures above RM1m', 0.6], ['recon', 'Independent reconciliation', 0.5], ['audit', 'Internal audit', 0.4], ['board', 'Board audit committee', 0.3]];
    const on = { dual: true, recon: true, audit: true, board: false }; let collude = false;
    const W = 560, H = 210, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    const row = V.h('div', { class: 'vis-row' }, L.map(([k, t]) => {
        const b = V.h('button', { type: 'button', class: 'vis-btn' + (on[k] ? ' primary' : '') }, t);
        b.addEventListener('click', () => { on[k] = !on[k]; b.classList.toggle('primary', on[k]); draw(); });
        return b;
    }));
    const cb = V.btn('CEO and CFO collude', () => { collude = !collude; cb.classList.toggle('primary', collude); draw(); });
    root.append(row, V.h('div', { class: 'vis-row' }, cb), svg, read);
    function catchRate(k, c) { if (!collude) return c; return k === 'dual' ? 0 : k === 'recon' ? 0.15 : c; }
    function draw() {
        V.clear(svg); const r = V.rng(12); let p = 1;
        const act = L.filter(([k]) => on[k]);
        act.forEach(([k, t, c], i) => {
            const x = 70 + i * 120, cr = catchRate(k, c); p *= 1 - cr;
            svg.append(V.s('rect', { x, y: 20, width: 34, height: 150, rx: 6, fill: '#fde68a', stroke: '#d97706', 'stroke-width': 1.5 }));
            const holes = collude ? [95] : [30 + ((i * 53) % 120), 30 + ((i * 53 + 60) % 120)];
            holes.forEach(hy => svg.append(V.s('ellipse', { cx: x + 17, cy: hy, rx: 9, ry: 8 + (1 - cr) * 10, fill: '#fff', stroke: '#d97706' })));
            V.text(svg, x + 17, 188, t.split(' ').slice(0, 2).join(' '), { size: 11, color: '#475569' });
        });
        if (collude || !act.length) V.arrow(svg, 20, 95, 540, 95, V.C.rose, 2.5, r);
        else V.arrow(svg, 20, 95, 60, 95, V.C.rose, 2.5, r);
        V.text(svg, 20, 80, 'fraud', { size: 12, color: V.C.rose, anchor: 'start', weight: 700 });
        read.innerHTML = `Chance a RM5m fraudulent payment gets through every layer: <b>${Math.round(p * 100)}%</b>. ` +
            (collude ? '<b>Collusion lines up the holes:</b> the two people the dual signature assumes are independent are the fraudsters. Controls reduce risk, never to zero; governance (independent oversight, audit, culture) must sit above them.' :
                'Each control is a slice with holes. Layers together catch most problems, but no single control is magical.');
    }
    draw();
};

ML_VIS.t3_regulator_finder = function (root) {
    const ORG = {
        bank: ['Commercial bank', ['Bank Negara Malaysia: governance and risk-governance guidelines', 'SSM: Companies Act 2016', 'If listed: SC (MCCG) and Bursa requirements too']],
        plc: ['Bursa-listed manufacturer', ['Securities Commission: Malaysian Code on Corporate Governance', 'Bursa Malaysia: governance, risk-management and internal-control statement', 'SSM: Companies Act 2016']],
        glc: ['Government-linked company', ['Putrajaya Committee on GLC High Performance: the Green Book', 'If listed: SC (MCCG) and Bursa', 'SSM: Companies Act 2016']],
        sdn: ['Private Sdn. Bhd. (unlisted)', ['SSM: Companies Act 2016', 'No listing rules; MCCG is good practice, not a listing obligation']],
        llp: ['Professional LLP', ['SSM: Limited Liability Partnerships Act 2012']],
        us: ['Subsidiary listed in the US', ['SOX (US law): reliable disclosure, internal controls, penalties', 'Plus Malaysian company law for the Malaysian entity']],
    };
    let key = 'plc';
    const box = V.h('div', { class: 'vis-table-wrap' }), read = V.h('p', { class: 'vis-readout' });
    root.append(V.seg(Object.entries(ORG).map(([k, o]) => [k, o[0]]), key, v => { key = v; draw(); }), box, read);
    function draw() {
        box.innerHTML = `<table class="vis-table" style="width:100%"><tr><th>${ORG[key][0]}: who sets the rules?</th></tr>${ORG[key][1].map(x => `<tr><td>${x}</td></tr>`).join('')}<tr><td><i>Voluntary frameworks any firm may adopt: COSO ERM, ISO 31000</i></td></tr></table>`;
        read.innerHTML = 'Match the organisation to the body. Standards (COSO, ISO) are chosen; regulations and listing requirements are imposed.';
    }
    draw();
};

ML_VIS.t3_framework_picker = function (root) {
    const NEED = {
        a: ['A US-listed firm must prove its financial reports are reliable after Enron.', 'SOX (law)'],
        b: ['Link 4 objectives, 8 ERM components and 4 organisational levels in one structure.', 'COSO ERM (framework)'],
        c: ['Adaptable principles + framework + process; integrate RM into decisions; not certifiable.', 'ISO 31000 (standard / guidance)'],
        d: ['A catalogue of techniques to assess risk, such as scenario analysis.', 'ISO/IEC 31010'],
        e: ['Everyone must use the same risk vocabulary.', 'ISO Guide 73'],
        f: ['A process that begins by establishing the context.', 'AS/NZS 4360'],
        g: ['Malaysian listed companies: identify principal risks and implement systems.', 'MCCG (Securities Commission)'],
        h: ['Improve board effectiveness at government-linked companies.', 'The Green Book (PCG)'],
    };
    let key = 'a', shown = false;
    const box = V.h('div', { class: 'vis-table-wrap' }), read = V.h('p', { class: 'vis-readout' });
    const btn = V.btn('Reveal', () => { shown = !shown; draw(); }, 'primary');
    root.append(V.seg(Object.keys(NEED).map((k, i) => [k, 'Need ' + (i + 1)]), key, v => { key = v; shown = false; draw(); }), V.h('div', { class: 'vis-row' }, btn), box, read);
    function draw() {
        box.innerHTML = `<table class="vis-table" style="width:100%"><tr><th>The need</th><td>${NEED[key][0]}</td></tr><tr><th>Use</th><td class="${shown ? 'hl' : ''}">${shown ? NEED[key][1] : '<i>decide first</i>'}</td></tr></table>`;
        btn.textContent = shown ? 'Hide' : 'Reveal';
        read.innerHTML = 'First decide the <b>nature</b>: law (must), framework or standard (how good practice can be structured), or code (best practice with listing force).';
    }
    draw();
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
// Topic 4 visuals (part 2): concept-explanation widgets
ML_VIS.t4_time_horizon_sim = function (root) {
    let h = 0.6;
    const YEARS = 20, PRICE = 5, W = 560, H = 250, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    root.append(V.slider('Share of the forest cut each year', 0.05, 1, 0.05, h, v => { h = v; draw(); }, v => Math.round(v * 100) + '%'), svg, read);
    const run = rate => {
        let S = 100, tot = 0; const yr = [];
        for (let y = 0; y < YEARS; y++) { const cut = rate * S; tot += cut * PRICE; yr.push(cut * PRICE); S = S - cut; S += 0.3 * S * (1 - S / 100); }
        return { yr, tot, S };
    };
    function draw() {
        const a = run(h), best = run(0.15), L = 50, T = 14, PW = 490, PH = 190, top = Math.max(...a.yr, 60);
        V.clear(svg); const r = V.rng(5), bw = PW / YEARS - 4;
        V.rline(svg, L, T + PH, L + PW, T + PH, V.C.ink, 1.3, r); V.rline(svg, L, T, L, T + PH, V.C.ink, 1.3, r);
        a.yr.forEach((v, i) => { const hh = v / top * PH; svg.append(V.s('rect', { x: L + 2 + i * (bw + 4), y: T + PH - hh, width: bw, height: Math.max(hh, 0.5), fill: V.C.amber, opacity: 0.75 })); });
        const bl = best.yr.map((v, i) => (i ? 'L' : 'M') + (L + 2 + i * (bw + 4) + bw / 2) + ' ' + (T + PH - v / top * PH)).join(' ');
        svg.append(V.s('path', { d: bl, fill: 'none', stroke: V.C.green, 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }));
        V.text(svg, L + PW, T + 10, 'bars: your cutting rate · dashed: sustainable 15%', { size: 12, anchor: 'end', color: '#64748b' });
        V.text(svg, L + PW / 2, H - 6, 'years →   (profit per year, RMm)', { size: 12, color: '#64748b' });
        read.innerHTML = `Year-1 profit: <b>RM${V.fmt(a.yr[0], 0)}m</b>. 20-year total: <b>RM${V.fmt(a.tot, 0)}m</b>; forest left: ${V.fmt(a.S, 0)}%. ` +
            `A sustainable 15% cut earns RM${V.fmt(best.yr[0], 0)}m in year 1 but <b>RM${V.fmt(best.tot, 0)}m</b> over 20 years. ` +
            (a.tot < best.tot ? '<b>Counter-intuitive:</b> cutting more today leaves you with less in total: the activity destroys the capacity it depends on.' : 'You are near the sustainable rate: present needs met without destroying future capacity.');
    }
    draw();
};

ML_VIS.t4_externality_slider = function (root) {
    let p = 60, internal = false;
    const W = 560, H = 210, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    const tb = V.btn('Regulator makes the firm pay (fines / carbon price)', () => { internal = !internal; tb.classList.toggle('primary', internal); draw(); });
    root.append(V.slider('Pollution allowed (cheaper waste disposal)', 0, 100, 10, p, v => { p = v; draw(); }, v => v + '%'), V.h('div', { class: 'vis-row' }, tb), svg, read);
    function draw() {
        const ext = 0.006 * p * p, profit = 80 + 0.4 * p - (internal ? ext : 0), society = 80 + 0.4 * p - ext;
        const items = [['Reported company profit', profit, V.C.amber], ['Cost pushed onto society', ext, V.C.rose], ['Net benefit to society', society, V.C.green]];
        V.clear(svg); const r = V.rng(7);
        items.forEach(([lab, v, c], i) => {
            const y = 20 + i * 58, w = Math.max(v, 0) * 2.6;
            V.text(svg, 10, y + 18, lab, { size: 13, anchor: 'start' });
            V.rrect(svg, 200, y, Math.max(w, 2), 36, c, c + '22', r);
            V.text(svg, 206 + w, y + 18, 'RM' + V.fmt(v, 0) + 'm', { size: 14, weight: 700, color: c, anchor: 'start' });
        });
        read.innerHTML = internal ? '<b>The hidden cost is now on the firm\'s books.</b> What looked like extra profit was an environmental liability waiting to become a financial one: regulatory, legal and reputational risk.' :
            `More pollution lifts reported profit to RM${V.fmt(profit, 0)}m, but society bears RM${V.fmt(ext, 0)}m of hidden cost. <b>Counter-intuitive:</b> the most "profitable" setting can be the one destroying the most value. Switch on regulation to see the cost come home.`;
    }
    draw();
};

ML_VIS.t4_greenwash_detector = function (root) {
    const EV = [['base', 'Measured emissions baseline', 25], ['verify', 'Third-party verification', 25], ['scope', 'Suppliers / full scope included', 20], ['owner', 'Board-approved, named owner', 15], ['method', 'Published methodology', 15]];
    const on = {}; let claim = 90;
    const W = 560, H = 150, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    const btns = V.h('div', { class: 'vis-row' }, EV.map(([k, t, w]) => {
        const b = V.h('button', { type: 'button', class: 'vis-btn' }, '+ ' + t);
        b.addEventListener('click', () => { on[k] = !on[k]; b.classList.toggle('primary', !!on[k]); b.textContent = (on[k] ? '● ' : '+ ') + t; draw(); });
        return b;
    }));
    root.append(V.slider('Strength of the public claim', 0, 100, 5, claim, v => { claim = v; draw(); }, v => v < 30 ? '"we are trying"' : v < 70 ? '"greener than before"' : '"100% carbon neutral"'), btns, svg, read);
    function draw() {
        const ev = EV.reduce((a, [k, , w]) => a + (on[k] ? w : 0), 0), gap = claim - ev;
        V.clear(svg); const r = V.rng(2);
        [['Claim', claim, V.C.amber], ['Evidence', ev, V.C.green]].forEach(([l, v, c], i) => {
            const y = 14 + i * 52;
            V.text(svg, 10, y + 18, l, { size: 14, anchor: 'start', weight: 700 });
            V.rrect(svg, 100, y, Math.max(v * 4.2, 2), 36, c, c + '22', r);
            V.text(svg, 106 + v * 4.2, y + 18, v, { size: 14, weight: 700, anchor: 'start', color: c });
        });
        const verdict = gap <= 10 ? ['credible', V.C.green] : gap <= 40 ? ['exaggerated', V.C.amber] : ['GREENWASHING RISK', V.C.rose];
        V.text(svg, 10, 134, 'Gap = ' + Math.max(gap, 0) + ' → ' + verdict[0], { size: 15, anchor: 'start', weight: 700, color: verdict[1] });
        read.innerHTML = 'Greenwashing = claim greater than evidence. Each piece of evidence is a <b>governance</b> act (measure, verify, own, disclose method). ' +
            '<b>Counter-intuitive:</b> a modest, honest claim with little evidence is safer than a bold claim with some evidence; the gap is what regulators (like ASIC with Tlou Energy) punish.';
    }
    draw();
};

ML_VIS.t4_score_vs_reality = function (root) {
    let polish = 70;
    const W = 560, H = 240, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    root.append(V.slider('Budget spent on polishing the score (vs real change)', 0, 100, 10, polish, v => { polish = v; draw(); }, v => v + '%'), svg, read);
    function draw() {
        const p = polish / 100, N = 6, score = [40], real = [40];
        for (let y = 1; y < N; y++) { score.push(Math.min(95, score[y - 1] + 6 + 10 * p)); real.push(Math.min(95, real[y - 1] + 9 * (1 - p))); }
        const L = 50, T = 14, PW = 470, PH = 180, X = i => L + i / (N - 1) * PW, Y = v => T + PH - v / 100 * PH;
        V.clear(svg); const r = V.rng(4);
        V.rline(svg, L, T + PH, L + PW, T + PH, V.C.ink, 1.3, r); V.rline(svg, L, T, L, T + PH, V.C.ink, 1.3, r);
        [[score, V.C.amber, 'ESG score'], [real, V.C.green, 'real performance']].forEach(([arr, c, lab]) => {
            svg.append(V.s('path', { d: arr.map((v, i) => (i ? 'L' : 'M') + X(i) + ' ' + Y(v)).join(' '), fill: 'none', stroke: c, 'stroke-width': 3 }));
            V.text(svg, X(N - 1) - 4, Y(arr[N - 1]) - 10, lab, { size: 12, color: c, anchor: 'end', weight: 700 });
        });
        V.text(svg, L + PW / 2, H - 6, 'years →', { size: 12, color: '#64748b' });
        const gap = score[N - 1] - real[N - 1], risk = Math.min(95, Math.max(2, gap * 1.6));
        read.innerHTML = `After 5 years the score is <b>${Math.round(score[N - 1])}</b> but real performance is <b>${Math.round(real[N - 1])}</b>: a credibility gap of ${Math.round(gap)}. Rough chance the gap is exposed as greenwashing: <b>${Math.round(risk)}%</b>. ` +
            '<b>Counter-intuitive:</b> the fastest way to a high score is the slowest way to real value. Index inclusion (FTSE4Good) should be an outcome, not the objective.';
    }
    draw();
};

ML_VIS.t4_net_zero_calc = function (root) {
    let e0 = 100, cut = 10, off = 90;
    const W = 560, H = 300, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' }, V.slider('Real emission cuts vs baseline', 0, 80, 5, cut, v => { cut = v; draw(); }, v => v + '%'),
        V.slider('Offsets / removals bought', 0, 100, 5, off, v => { off = v; draw(); }, v => v + 'k t')), svg, read);
    function draw() {
        const gross = e0 * (1 - cut / 100), net = gross - off, target = e0 * 0.6;
        V.clear(svg); const r = V.rng(6), base = 150, sc = 1.1;
        V.rline(svg, 20, base, 540, base, '#64748b', 1.4, r);
        const bar = (x, v, c, lab) => { const hh = Math.abs(v) * sc; V.rrect(svg, x, v >= 0 ? base - hh : base, 90, Math.max(hh, 2), c, c + '22', r); V.text(svg, x + 45, v >= 0 ? base - hh - 12 : base + hh + 14, V.fmt(v, 0) + 'k', { size: 13, weight: 700, color: c }); V.text(svg, x + 45, 288, lab, { size: 12, color: '#475569' }); };
        bar(30, e0, V.C.slate, 'baseline E0');
        bar(150, gross, V.C.amber, 'gross now');
        bar(270, -off, V.C.green, 'removals');
        bar(390, net, net <= 0 ? V.C.green : V.C.rose, 'net');
        V.rline(svg, 140, base - target * sc, 250, base - target * sc, V.C.violet, 1.6, r, { 'stroke-dasharray': '6 4' });
        V.text(svg, 250, base - target * sc - 8, '40% cut target', { size: 11, color: V.C.violet, anchor: 'end' });
        const nz = net <= 0, met = gross <= target;
        read.innerHTML = `Net emissions: <b>${V.fmt(net, 0)}k t</b> → ${nz ? '<b>"net zero" can be claimed</b>' : 'not net zero'}. Real-cut target (E0 x 0.6 = ${V.fmt(target, 0)}k): ${met ? 'met' : '<b>missed</b>'}. ` +
            (nz && !met ? '<b>Counter-intuitive:</b> the firm is "net zero" while still emitting almost as much as before; it bought its way there. That gap between the claim and the operating reality is where greenwashing risk lives.' :
                'Net zero balances emissions with removals; it does not require zero gross emissions, but credible plans cut gross emissions first and offset the remainder.');
    }
    draw();
};

ML_VIS.t4_kri_lead = function (root) {
    const NM = [2, 3, 2, 4, 5, 7, 9, 12, 15, 18, 22, 26];  // monthly near-miss reports; serious accident in month 11
    let thr = 10;
    const W = 560, H = 230, svg = V.svg(W, H), read = V.h('p', { class: 'vis-readout' });
    root.append(V.slider('KRI alert threshold (near-misses per month)', 3, 25, 1, thr, v => { thr = v; draw(); }), svg, read);
    function draw() {
        const L = 40, T = 14, PW = 490, PH = 170, bw = PW / NM.length - 6, ACC = 10;
        V.clear(svg); const r = V.rng(8);
        V.rline(svg, L, T + PH, L + PW, T + PH, V.C.ink, 1.3, r);
        const alert = NM.findIndex(v => v >= thr), falseAlarms = NM.slice(0, 4).filter(v => v >= thr).length;
        NM.forEach((v, i) => {
            const x = L + 3 + i * (bw + 6), hh = v / 28 * PH, c = i === alert ? V.C.amber : i === ACC ? V.C.rose : V.C.sky;
            svg.append(V.s('rect', { x, y: T + PH - hh, width: bw, height: hh, fill: c, opacity: 0.8 }));
            V.text(svg, x + bw / 2, T + PH + 14, 'M' + (i + 1), { size: 11, color: '#64748b' });
        });
        const ty = T + PH - thr / 28 * PH;
        V.rline(svg, L, ty, L + PW, ty, V.C.amber, 1.6, r, { 'stroke-dasharray': '6 4' });
        V.text(svg, L + 4, ty - 6, 'alert threshold', { size: 11, color: V.C.amber, anchor: 'start' });
        const ax = L + 3 + ACC * (bw + 6) + bw / 2;
        V.text(svg, ax, T + 10, 'serious accident', { size: 12, color: V.C.rose, weight: 700 });
        const lead = alert < 0 ? -1 : ACC - alert;
        read.innerHTML = alert < 0 || lead <= 0 ? '<b>Too late:</b> the KRI never fired before the accident: that is reactive management (scandal → headlines → reaction).' :
            `The KRI fires in month ${alert + 1}: <b>${lead} months of warning</b> before the accident.` + (falseAlarms ? ` But set this low it also fires ${falseAlarms} time(s) in the quiet early months: a false-alarm cost.` : '') +
            ' ESG risk management earns its value through <b>earlier detection</b>; choosing the threshold is a trade-off between warning time and false alarms.';
    }
    draw();
};

ML_VIS.t4_concept_sorter = function (root) {
    const IT = {
        a: ['Meeting present needs without compromising future generations', 'Sustainability (the concept)'],
        b: ['17 goals and 169 targets agreed by the UN in 2015', 'SDGs (global goals)'],
        c: ['IOI maps its own strategy to the SDGs relevant to its operations', 'Corporate sustainability (business translation)'],
        d: ['Board oversight, labour standards and emissions as factors in judging a firm', 'ESG (organisational lens)'],
        e: ['120,000 tonnes of CO₂e emitted last year', 'ESG metric (measurement)'],
        f: ['Inclusion in the FTSE4Good Bursa Malaysia index', 'ESG rating / index (external outcome)'],
        g: ['A material E/S/G condition that could damage the value of the firm', 'ESG risk'],
        h: ['Advertising "carbon neutral" with no verified emissions data', 'Greenwashing'],
    };
    let key = 'a', shown = false;
    const box = V.h('div', { class: 'vis-table-wrap' }), read = V.h('p', { class: 'vis-readout' });
    const btn = V.btn('Reveal', () => { shown = !shown; draw(); }, 'primary');
    root.append(V.seg(Object.keys(IT).map((k, i) => [k, 'Statement ' + (i + 1)]), key, v => { key = v; shown = false; draw(); }), V.h('div', { class: 'vis-row' }, btn), box, read);
    function draw() {
        box.innerHTML = `<table class="vis-table" style="width:100%"><tr><th>Statement</th><td>${IT[key][0]}</td></tr><tr><th>Concept</th><td class="${shown ? 'hl' : ''}">${shown ? IT[key][1] : '<i>decide first</i>'}</td></tr></table>`;
        btn.textContent = shown ? 'Hide' : 'Reveal';
        read.innerHTML = 'Goal, global targets, business translation, organisational lens, measurement, external outcome, risk, misleading claim: eight different things that all sound like "sustainability".';
    }
    draw();
};
