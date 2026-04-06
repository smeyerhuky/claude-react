import { useEffect, useRef, useState, useCallback } from "react";

// ─── GRID CONFIG ─────────────────────────────────────────────────────────────
const COLS        = 32;
const ROWS        = 32;
const CHUNK_COUNT = 8;
const CELL_W      = 12;
const CELL_H      = 14;
const FONT_SIZE   = 12;
const SAMPLE_W    = COLS * 4;
const SAMPLE_H    = ROWS * 4;

// ─── CHARSETS ────────────────────────────────────────────────────────────────
const CHARSETS = {
  dense:  ' .\'`^",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  blocks: ' ░▒▓█',
  braille:' ⠁⠃⠇⠏⠟⠿⡿⣿',
  simple: ' .:-=+*#%@',
};

function buildLUT(cs) {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) lut[i] = Math.min(cs.length - 1, Math.floor(i / 255 * cs.length));
  return lut;
}
const LUTS = Object.fromEntries(Object.entries(CHARSETS).map(([k, v]) => [k, buildLUT(v)]));

// ─── PLASMA DEMO ─────────────────────────────────────────────────────────────
function hue2rgb(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}
function hslToRgb(h,s,l){const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return[hue2rgb(p,q,h+1/3),hue2rgb(p,q,h),hue2rgb(p,q,h-1/3)].map(v=>Math.round(v*255));}

function drawDemo(ctx, w, h, t) {
  const id = ctx.createImageData(w, h);
  const d  = id.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x/w, ny = y/h;
      const v = Math.sin(nx*12 - t*2.1)
              + Math.sin(ny*9  + t*1.7)
              + Math.sin((nx+ny)*8 - t)
              + Math.sin(Math.sqrt((nx-.5)**2+(ny-.5)**2)*18 - t*2.5);
      const n = (v+4)/8;
      const hue = (n*300 + t*50) % 360;
      const [r,g,b] = hslToRgb(hue/360, 1, 0.35+n*0.4);
      const i = (y*w+x)*4;
      d[i]=r; d[i+1]=g; d[i+2]=b; d[i+3]=255;
    }
  }
  ctx.putImageData(id, 0, 0);
}

// ─── PARALLEL CHUNK RESOLVERS ─────────────────────────────────────────────────
function renderChunks(pixels, cs, lut, invert, colorMode) {
  const rowsPerChunk = Math.ceil(ROWS / CHUNK_COUNT);
  const results      = new Array(ROWS);

  const chunks = Array.from({ length: CHUNK_COUNT }, (_, ci) =>
    new Promise(resolve => {
      const r0 = ci * rowsPerChunk;
      const r1 = Math.min(r0 + rowsPerChunk, ROWS);
      for (let r = r0; r < r1; r++) {
        const row = new Array(COLS);
        for (let c = 0; c < COLS; c++) {
          const px  = Math.floor(c / COLS * SAMPLE_W);
          const py  = Math.floor(r / ROWS * SAMPLE_H);
          const i   = (py * SAMPLE_W + px) * 4;
          const R   = pixels[i], G = pixels[i+1], B = pixels[i+2];
          const lum = Math.round(0.299*R + 0.587*G + 0.114*B);
          const ci2 = invert ? (cs.length - 1 - lut[lum]) : lut[lum];
          row[c] = colorMode ? { ch: cs[ci2], r: R, g: G, b: B } : { ch: cs[ci2] };
        }
        results[r] = row;
      }
      resolve();
    })
  );

  return Promise.all(chunks).then(() => results);
}

// ─── CANVAS PAINTER ───────────────────────────────────────────────────────────
function paintGrid(ctx, grid, colorMode, w, h) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.font = `${FONT_SIZE}px "Courier New", monospace`;
  ctx.textBaseline = 'top';

  for (let r = 0; r < ROWS; r++) {
    const row = grid[r];
    if (!row) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = row[c];
      if (!cell || cell.ch === ' ') continue;
      ctx.fillStyle = (colorMode && cell.r != null)
        ? `rgb(${cell.r},${cell.g},${cell.b})`
        : '#00ff41';
      ctx.fillText(cell.ch, c * CELL_W, r * CELL_H);
    }
  }

  // scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AsciiRenderer() {
  const [csKey,     setCsKey]     = useState('dense');
  const [colorMode, setColorMode] = useState(true);
  const [invert,    setInvert]    = useState(false);
  const [source,    setSource]    = useState('demo');
  const [fps,       setFps]       = useState(0);
  const [renderMs,  setRenderMs]  = useState(0);
  const [statusMsg, setStatusMsg] = useState('DEMO');
  const [camError,  setCamError]  = useState('');

  const outputRef  = useRef(null);
  const sampleRef  = useRef(null);
  const videoRef   = useRef(null);
  const rafRef     = useRef(null);
  const streamRef  = useRef(null);
  const fileUrlRef = useRef(null);
  const tRef       = useRef(0);
  const fpsAcc     = useRef({ frames: 0, last: performance.now() });
  const stateRef   = useRef({ csKey, colorMode, invert, source });

  useEffect(() => { stateRef.current = { csKey, colorMode, invert, source }; },
    [csKey, colorMode, invert, source]);

  // ── Loop ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const sc = sampleRef.current;
    const oc = outputRef.current;
    if (!sc || !oc) return;
    const sCtx = sc.getContext('2d', { willReadFrequently: true });
    const oCtx = oc.getContext('2d');
    let alive = true;

    const loop = async () => {
      if (!alive) return;
      const { csKey: cs, colorMode: cm, invert: inv, source: src } = stateRef.current;
      const charset = CHARSETS[cs];
      const lut     = LUTS[cs];
      const t0      = performance.now();

      try {
        if (src === 'demo') {
          tRef.current += 0.018;
          drawDemo(sCtx, SAMPLE_W, SAMPLE_H, tRef.current);
        } else {
          const vid = videoRef.current;
          if (!vid || vid.readyState < 2) { rafRef.current = requestAnimationFrame(loop); return; }
          sCtx.drawImage(vid, 0, 0, SAMPLE_W, SAMPLE_H);
        }

        const { data } = sCtx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);
        const grid = await renderChunks(data, charset, lut, inv, cm);
        paintGrid(oCtx, grid, cm, oc.width, oc.height);
      } catch(_) { /* ignore frame errors */ }

      const now = performance.now();
      fpsAcc.current.frames++;
      if (now - fpsAcc.current.last >= 600) {
        setFps(Math.round(fpsAcc.current.frames / ((now - fpsAcc.current.last) / 1000)));
        setRenderMs(Math.round(now - t0));
        fpsAcc.current.frames = 0;
        fpsAcc.current.last   = now;
      }

      if (alive) rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Camera ─────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCamError('');
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      const vid = videoRef.current;
      vid.srcObject = stream;
      vid.src = '';
      await vid.play();
      setSource('camera');
      setStatusMsg('CAMERA LIVE');
    } catch(e) {
      setCamError(e.name === 'NotAllowedError' ? 'Camera permission denied' : e.message);
    }
  }, []);

  // ── File ───────────────────────────────────────────────────────────────────
  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    const url = URL.createObjectURL(file);
    fileUrlRef.current = url;
    const vid = videoRef.current;
    vid.srcObject = null;
    vid.src = url;
    vid.loop = true;
    vid.muted = true;
    vid.load();
    vid.play().catch(() => {});
    setSource('file');
    setStatusMsg(file.name.length > 20 ? file.name.slice(0,18)+'…' : file.name);
    setCamError('');
  }, []);

  const goDemo = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    const vid = videoRef.current;
    vid.srcObject = null; vid.src = '';
    setSource('demo'); setStatusMsg('DEMO'); setCamError('');
  }, []);

  // ── UI ─────────────────────────────────────────────────────────────────────
  const btnStyle = (active) => ({
    padding: '4px 10px',
    fontSize: 11,
    fontFamily: '"Courier New", monospace',
    border: '1px solid',
    borderColor: active ? '#00ff41' : '#333',
    background: active ? '#00ff4118' : '#111',
    color: active ? '#00ff41' : '#888',
    cursor: 'pointer',
    borderRadius: 3,
    transition: 'all 0.15s',
  });

  const W = COLS * CELL_W;
  const H = ROWS * CELL_H;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16, background: '#0a0a0a', minHeight: '100vh', color: '#ccc', fontFamily: '"Courier New", monospace' }}>
      {/* Hidden sampling canvas & video */}
      <canvas ref={sampleRef} width={SAMPLE_W} height={SAMPLE_H} style={{ display: 'none' }} />
      <video ref={videoRef} playsInline muted style={{ display: 'none' }} />

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: '#00ff41', fontSize: 18, letterSpacing: 2 }}>
          ▓ ASCII RENDERER ▓
        </h2>
        <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
          {statusMsg} │ {fps} FPS │ {renderMs}ms
        </div>
      </div>

      {/* Output canvas */}
      <div style={{ border: '1px solid #222', borderRadius: 4, overflow: 'hidden', boxShadow: '0 0 20px rgba(0,255,65,0.08)' }}>
        <canvas ref={outputRef} width={W} height={H} style={{ display: 'block', background: '#000' }} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: W }}>
        {/* Charset selectors */}
        {Object.keys(CHARSETS).map(k => (
          <button key={k} style={btnStyle(csKey === k)} onClick={() => setCsKey(k)}>{k}</button>
        ))}

        {/* Divider */}
        <span style={{ color: '#333', alignSelf: 'center' }}>│</span>

        {/* Toggle buttons */}
        <button style={btnStyle(colorMode)} onClick={() => setColorMode(v => !v)}>
          {colorMode ? 'COLOR' : 'MONO'}
        </button>
        <button style={btnStyle(invert)} onClick={() => setInvert(v => !v)}>
          {invert ? 'INV' : 'NRM'}
        </button>

        <span style={{ color: '#333', alignSelf: 'center' }}>│</span>

        {/* Source buttons */}
        <button style={btnStyle(source === 'demo')} onClick={goDemo}>DEMO</button>
        <button style={btnStyle(source === 'camera')} onClick={startCamera}>CAM</button>
        <label style={{ display: 'inline-block' }}>
          <button style={btnStyle(source === 'file')} onClick={() => {}}>FILE</button>
          <input type="file" accept="video/*" onChange={handleFile} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Camera error */}
      {camError && (
        <div style={{ color: '#ff4444', fontSize: 11 }}>⚠ {camError}</div>
      )}
    </div>
  );
}
