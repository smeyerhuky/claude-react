import { useState, useEffect } from 'react';
import useAsciiEngine from './useAsciiEngine';
import { cellDims, G, DG, BG, BORDER, CHARSETS, PRESETS, ANIM_TARGETS, TX_TARGETS, MAT_LABELS, MAT_DESC, ID9, GRID_PRESETS } from './engine';

/* eslint-disable react/prop-types */
const Btn = ({active, onClick, children, title, s={}}) => (
  <button onClick={onClick} title={title} style={{
    background: active ? G : 'transparent', color: active ? BG : G,
    border: `1px solid ${active ? G : BORDER}`,
    padding:'4px 8px', fontFamily:'monospace', fontSize:9,
    letterSpacing:1, cursor:'pointer', whiteSpace:'nowrap',
    WebkitTapHighlightColor:'transparent', ...s
  }}>{children}</button>
);

function SecHeader({label}) {
  return <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4, marginTop:2}}>{label}</div>;
}

function Slider({label, value, min, max, step, onChange, fmt}) {
  return (
    <div style={{display:'flex', gap:4, alignItems:'center', marginBottom:3}}>
      <span style={{color:DG, fontSize:8, width:20, flexShrink:0}}>{label}</span>
      <input type='range' min={min} max={max} step={step} value={value}
        onChange={ev=>onChange(parseFloat(ev.target.value))}
        style={{flex:1, accentColor:G, minWidth:0}}/>
      <span style={{color:G, fontSize:8, minWidth:30, textAlign:'right'}}>
        {fmt ? fmt(value) : value.toFixed(2)}
      </span>
    </div>
  );
}
/* eslint-enable react/prop-types */

export default function Layout2Sidebar() {
  const e = useAsciiEngine();
  const {
    cols, rows, fps, renderMs, statusMsg,
    matVals, hovCell, setHovCell, editCell, applyPreset, snapMatrix,
    activeTx, setActiveTx, setTxParam, txParam, applyTx,
    animating, setAnimating, animTarget, setAnimTarget, animSpeed, setAnimSpeed,
    adjCols, adjRows, setCols, setRows, lockAspect, toggleLock, fitToContainer,
    warpMode, setWarpMode, warpAmt, setWarpAmt,
    asciiMode, setAsciiMode,
    brightness, setBrightness, contrast, setContrast,
    rScale, setRScale, gScale, setGScale, bScale, setBScale,
    source, goDemo, startCamera, handleFile, camError,
    csKey, setCsKey, colorMode, setColorMode, inv, setInv,
    outputRef, sampleRef, videoRef, containerRef, containerSize,
  } = e;

  // Mobile: detect narrow viewport for bottom-sheet mode
  const [windowW, setWindowW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('matrix');
  useEffect(() => {
    const onResize = () => setWindowW(window.innerWidth);
    window.addEventListener('resize', onResize, {passive:true});
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = windowW < 640;

  const {cW, cH} = cellDims(cols, rows, containerSize.w, containerSize.h);
  const canvasW = cols * cW, canvasH = rows * cH;

  const secStyle = { padding:'8px', borderTop:`1px solid ${BORDER}` };

  // ── Sidebar section content (shared for desktop & mobile drawer) ────────────
  const SidebarContent = () => (
    <>
      {/* MATRIX */}
      <div style={secStyle}>
        <SecHeader label='MATRIX' />
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2,
          border:`1px solid ${BORDER}`, padding:4, background:'#020802', marginBottom:4}}>
          {matVals.map((v,idx)=>{
            const onDiag=idx===0||idx===4||idx===8;
            return (
              <div key={idx} style={{display:'flex', flexDirection:'column', alignItems:'center'}}
                onMouseEnter={()=>setHovCell(idx)} onMouseLeave={()=>setHovCell(-1)}
                onTouchStart={()=>setHovCell(idx)} onTouchEnd={()=>setHovCell(-1)}>
                <span style={{fontSize:6, color:onDiag?'#007700':DG, letterSpacing:1}}>
                  {MAT_LABELS[idx]}{hovCell===idx?<span style={{opacity:.6}}> {MAT_DESC[idx]}</span>:null}
                </span>
                <input type='number' step='0.01' value={parseFloat(v.toFixed(4))}
                  onChange={ev=>editCell(idx, ev.target.value)}
                  style={{width:'100%', background:hovCell===idx?'#001a00':'#000',
                    color:onDiag?'#88ff88':G, border:`1px solid ${hovCell===idx?G:BORDER}`,
                    fontFamily:'monospace', fontSize:8, padding:'2px', textAlign:'center'}}
                />
              </div>
            );
          })}
        </div>
        <div style={{display:'flex', gap:3, flexWrap:'wrap', marginBottom:4}}>
          <Btn onClick={()=>applyPreset({m:()=>ID9.slice()})}>↺ ID</Btn>
          <Btn onClick={snapMatrix}>⚡ SNAP</Btn>
        </div>
        <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:3}}>PRESETS</div>
        <div style={{display:'flex', gap:2, flexWrap:'wrap'}}>
          {PRESETS.map(p=><Btn key={p.key} onClick={()=>applyPreset(p)} s={{padding:'2px 5px', fontSize:8}}>{p.label}</Btn>)}
        </div>
      </div>

      {/* LIVE PARAM */}
      <div style={secStyle}>
        <SecHeader label='LIVE PARAM' />
        <select value={activeTx} onChange={ev=>{setActiveTx(ev.target.value); setTxParam(0);}}
          style={{width:'100%', background:'#000', color:G, border:`1px solid ${BORDER}`,
            fontFamily:'monospace', fontSize:8, marginBottom:3, padding:'4px 2px'}}>
          {TX_TARGETS.map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
        </select>
        <input type='range' min='-1' max='1' step='0.01' value={txParam}
          onChange={ev=>applyTx(activeTx, parseFloat(ev.target.value))}
          style={{width:'100%', accentColor:G}}/>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:7, color:DG}}>
          <span>-1</span><span style={{color:G}}>{txParam.toFixed(3)}</span><span>1</span>
        </div>
      </div>

      {/* ANIMATE */}
      <div style={secStyle}>
        <SecHeader label='ANIMATE' />
        <div style={{display:'flex', gap:3, marginBottom:4, flexWrap:'wrap'}}>
          <Btn active={animating} onClick={()=>setAnimating(a=>!a)}>{animating?'■ STOP':'▶ RUN'}</Btn>
          <select value={animTarget} onChange={ev=>setAnimTarget(ev.target.value)}
            style={{background:'#000', color:G, border:`1px solid ${BORDER}`,
              fontFamily:'monospace', fontSize:8, flex:1, padding:'4px 2px'}}>
            {ANIM_TARGETS.map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
          </select>
        </div>
        <div style={{display:'flex', gap:4, alignItems:'center'}}>
          <span style={{color:DG, fontSize:7}}>SPD</span>
          <input type='range' min='0.1' max='6' step='0.1' value={animSpeed}
            onChange={ev=>setAnimSpeed(parseFloat(ev.target.value))}
            style={{flex:1, accentColor:G}}/>
          <span style={{color:G, fontSize:8, minWidth:24}}>{animSpeed.toFixed(1)}×</span>
        </div>
      </div>

      {/* GRID */}
      <div style={secStyle}>
        <SecHeader label='GRID' />
        <div style={{display:'flex', gap:2, alignItems:'center', marginBottom:3}}>
          <span style={{color:DG, fontSize:8, width:28}}>COLS</span>
          {[-10,-1].map(d=><Btn key={d} onClick={()=>adjCols(d)}>{d}</Btn>)}
          <span style={{color:G, fontSize:10, minWidth:22, textAlign:'center'}}>{cols}</span>
          {[1,10].map(d=><Btn key={d} onClick={()=>adjCols(d)}>+{d}</Btn>)}
        </div>
        <div style={{display:'flex', gap:2, alignItems:'center', marginBottom:3}}>
          <span style={{color:DG, fontSize:8, width:28}}>ROWS</span>
          {[-10,-1].map(d=><Btn key={d} onClick={()=>adjRows(d)}>{d}</Btn>)}
          <span style={{color:G, fontSize:10, minWidth:22, textAlign:'center'}}>{rows}</span>
          {[1,10].map(d=><Btn key={d} onClick={()=>adjRows(d)}>+{d}</Btn>)}
        </div>
        <div style={{display:'flex', gap:3, alignItems:'center', marginBottom:3}}>
          <Btn active={lockAspect} onClick={toggleLock}>{lockAspect?'🔒':'🔓 LOCK'}</Btn>
        </div>
        <div style={{display:'flex', gap:2, flexWrap:'wrap'}}>
          <Btn onClick={fitToContainer}>FULL</Btn>
          {GRID_PRESETS.map(([c,r])=>(
            <Btn key={`${c}x${r}`} active={cols===c&&rows===r} onClick={()=>{setCols(c); setRows(r);}} s={{padding:'2px 5px', fontSize:8}}>{c}×{r}</Btn>
          ))}
        </div>
      </div>

      {/* IMAGE ADJUSTMENTS */}
      <div style={secStyle}>
        <SecHeader label='IMAGE' />
        <Slider label='BR' value={brightness} min={0} max={3} step={0.05} onChange={setBrightness} fmt={v=>v.toFixed(2)+'×'} />
        <Slider label='CO' value={contrast}   min={0} max={4} step={0.05} onChange={setContrast}   fmt={v=>v.toFixed(2)+'×'} />
        <div style={{display:'flex', gap:4, marginTop:2}}>
          <Btn onClick={()=>{setBrightness(1); setContrast(1);}}>RESET</Btn>
        </div>
      </div>

      {/* RGB SCALES */}
      <div style={secStyle}>
        <SecHeader label='RGB' />
        <Slider label='R' value={rScale} min={0} max={3} step={0.05} onChange={setRScale} />
        <Slider label='G' value={gScale} min={0} max={3} step={0.05} onChange={setGScale} />
        <Slider label='B' value={bScale} min={0} max={3} step={0.05} onChange={setBScale} />
        <div style={{display:'flex', gap:4, marginTop:2}}>
          <Btn onClick={()=>{setRScale(1); setGScale(1); setBScale(1);}}>RESET</Btn>
        </div>
      </div>

      {/* WARP */}
      <div style={secStyle}>
        <SecHeader label='WARP' />
        <div style={{display:'flex', gap:2, flexWrap:'wrap', marginBottom:4}}>
          {['none','ripple','wave','swirl','fisheye','barrel','pinch','tunnel','twist'].map(m=>(
            <Btn key={m} active={warpMode===m} onClick={()=>setWarpMode(m)} s={{padding:'2px 5px', fontSize:8}}>{m.toUpperCase()}</Btn>
          ))}
        </div>
        <div style={{display:'flex', gap:4, alignItems:'center'}}>
          <span style={{color:DG, fontSize:8}}>AMT</span>
          <input type='range' min='0' max='1' step='0.01' value={warpAmt}
            onChange={ev=>setWarpAmt(parseFloat(ev.target.value))}
            style={{flex:1, accentColor:G}}/>
          <span style={{color:G, fontSize:8, minWidth:26}}>{warpAmt.toFixed(2)}</span>
        </div>
      </div>

      {/* SRC */}
      <div style={secStyle}>
        <SecHeader label='SRC' />
        <div style={{display:'flex', gap:3, flexWrap:'wrap', marginBottom:4}}>
          <Btn active={source==='demo'}   onClick={goDemo}>DEMO</Btn>
          <Btn active={source==='camera'} onClick={startCamera}>📷 CAM</Btn>
          <label style={{
            background:source==='file'?G:'transparent', color:source==='file'?BG:G,
            border:`1px solid ${source==='file'?G:BORDER}`,
            padding:'4px 8px', fontFamily:'monospace', fontSize:9, cursor:'pointer',
            WebkitTapHighlightColor:'transparent',
          }}>
            📁 FILE<input type='file' accept='video/*' onChange={handleFile} style={{display:'none'}}/>
          </label>
        </div>
        {camError&&<div style={{color:'#ff4444', fontSize:8}}>⚠ {camError}</div>}
      </div>

      {/* SET */}
      <div style={secStyle}>
        <SecHeader label='SET' />
        <div style={{display:'flex', gap:2, flexWrap:'wrap', marginBottom:4}}>
          {Object.keys(CHARSETS).map(k=>(
            <Btn key={k} active={csKey===k} onClick={()=>setCsKey(k)} s={{padding:'2px 5px', fontSize:8}}>{k.toUpperCase()}</Btn>
          ))}
        </div>
        <div style={{display:'flex', gap:4}}>
          <Btn active={colorMode} onClick={()=>setColorMode(c=>!c)}>{colorMode?'🎨':'⬜'}</Btn>
          <Btn active={inv} onClick={()=>setInv(i=>!i)}>{inv?'◑':'◐'}</Btn>
        </div>
      </div>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Mobile layout
  // ─────────────────────────────────────────────────────────────────────────────
  if (isMobile) {
    const DRAWER_TABS = ['matrix','grid','image','warp','src','set'];
    return (
      <div style={{display:'flex', flexDirection:'column', width:'100vw', height:'100dvh',
        background:BG, fontFamily:"'Courier New',monospace", overflow:'hidden', position:'fixed', inset:0}}>
        <canvas ref={sampleRef} width={128} height={128} style={{display:'none'}} />
        <video ref={videoRef} playsInline muted style={{display:'none'}} />

        {/* Top status bar */}
        <div style={{padding:'5px 10px', borderBottom:`1px solid ${BORDER}`, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <span style={{color:G, fontSize:9, letterSpacing:2}}>◆ {statusMsg} · {cols}×{rows}</span>
          <div style={{display:'flex', gap:6, alignItems:'center'}}>
            <Btn active={!asciiMode} onClick={()=>setAsciiMode(a=>!a)} s={{padding:'3px 6px', fontSize:8}}>
              {asciiMode ? '⌨ ASCII' : '📹 RAW'}
            </Btn>
            <span style={{color:fps>=28?G:fps>=15?'#aaff00':'#ff6600', fontSize:8}}>{fps}fps</span>
          </div>
        </div>

        {/* Canvas — fills remaining space above drawer */}
        <div ref={containerRef} style={{flex:1, position:'relative', overflow:'hidden', minHeight:0}}>
          <canvas ref={outputRef} width={canvasW} height={canvasH}
            style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'#000'}}/>
        </div>

        {/* Bottom drawer */}
        <div style={{
          flexShrink:0, background:'#020802', borderTop:`1px solid ${BORDER}`,
          display:'flex', flexDirection:'column',
          height: drawerOpen ? 'min(55vh, 360px)' : '44px',
          transition:'height 0.2s ease', overflow:'hidden',
        }}>
          {/* Drawer handle / quick-access bar */}
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'0 10px', height:44, flexShrink:0, cursor:'pointer', borderBottom:`1px solid ${BORDER}`}}
            onClick={()=>setDrawerOpen(o=>!o)}>
            <div style={{display:'flex', gap:6, alignItems:'center'}}>
              <span style={{color:DG, fontSize:8, letterSpacing:2}}>CONTROLS</span>
              <Btn active={source==='demo'}   onClick={(ev)=>{ev.stopPropagation();goDemo();}} s={{fontSize:8,padding:'2px 5px'}}>DEMO</Btn>
              <Btn active={source==='camera'} onClick={(ev)=>{ev.stopPropagation();startCamera();}} s={{fontSize:8,padding:'2px 5px'}}>📷</Btn>
            </div>
            <span style={{color:DG, fontSize:12}}>{drawerOpen ? '▼' : '▲'}</span>
          </div>

          {/* Drawer tab bar + content */}
          {drawerOpen && (
            <>
              <div style={{display:'flex', borderBottom:`1px solid ${BORDER}`, flexShrink:0}}>
                {DRAWER_TABS.map(t=>(
                  <button key={t} onClick={()=>setDrawerTab(t)} style={{
                    flex:1, padding:'5px 0', background: drawerTab===t?'#001500':'transparent',
                    color: drawerTab===t?G:DG, border:'none',
                    borderBottom: drawerTab===t?`1px solid ${G}`:'1px solid transparent',
                    fontFamily:'monospace', fontSize:8, letterSpacing:1, cursor:'pointer',
                    WebkitTapHighlightColor:'transparent',
                  }}>{t.toUpperCase()}</button>
                ))}
              </div>
              <div style={{flex:1, overflowY:'auto', padding:'8px'}}>
                {drawerTab==='matrix' && (
                  <div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3,
                      border:`1px solid ${BORDER}`, padding:6, background:'#020802', marginBottom:6}}>
                      {matVals.map((v,idx)=>{
                        const onDiag=idx===0||idx===4||idx===8;
                        return (
                          <div key={idx} style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                            <span style={{fontSize:7, color:onDiag?'#007700':DG}}>{MAT_LABELS[idx]}</span>
                            <input type='number' step='0.01' value={parseFloat(v.toFixed(4))}
                              onChange={ev=>editCell(idx, ev.target.value)}
                              style={{width:'100%', background:'#000', color:onDiag?'#88ff88':G,
                                border:`1px solid ${BORDER}`, fontFamily:'monospace', fontSize:9,
                                padding:'3px', textAlign:'center'}}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{display:'flex', gap:4, marginBottom:6, flexWrap:'wrap'}}>
                      <Btn onClick={()=>applyPreset({m:()=>ID9.slice()})}>↺ ID</Btn>
                      <Btn onClick={snapMatrix}>⚡ SNAP</Btn>
                    </div>
                    <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>PRESETS</div>
                    <div style={{display:'flex', gap:3, flexWrap:'wrap', marginBottom:8}}>
                      {PRESETS.map(p=><Btn key={p.key} onClick={()=>applyPreset(p)} s={{padding:'3px 6px', fontSize:9}}>{p.label}</Btn>)}
                    </div>
                    <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:3}}>LIVE PARAM</div>
                    <select value={activeTx} onChange={ev=>{setActiveTx(ev.target.value); setTxParam(0);}}
                      style={{width:'100%', background:'#000', color:G, border:`1px solid ${BORDER}`,
                        fontFamily:'monospace', fontSize:9, marginBottom:4, padding:'5px 2px'}}>
                      {TX_TARGETS.map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
                    </select>
                    <input type='range' min='-1' max='1' step='0.01' value={txParam}
                      onChange={ev=>applyTx(activeTx, parseFloat(ev.target.value))}
                      style={{width:'100%', accentColor:G, marginBottom:6}}/>
                    <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>ANIMATE</div>
                    <div style={{display:'flex', gap:6, marginBottom:4, flexWrap:'wrap'}}>
                      <Btn active={animating} onClick={()=>setAnimating(a=>!a)} s={{minWidth:60, fontSize:9, padding:'4px 8px'}}>{animating?'■ STOP':'▶ RUN'}</Btn>
                      <select value={animTarget} onChange={ev=>setAnimTarget(ev.target.value)}
                        style={{flex:1, background:'#000', color:G, border:`1px solid ${BORDER}`,
                          fontFamily:'monospace', fontSize:9, padding:'5px 2px'}}>
                        {ANIM_TARGETS.map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div style={{display:'flex', gap:4, alignItems:'center'}}>
                      <span style={{color:DG, fontSize:8}}>SPD</span>
                      <input type='range' min='0.1' max='6' step='0.1' value={animSpeed}
                        onChange={ev=>setAnimSpeed(parseFloat(ev.target.value))}
                        style={{flex:1, accentColor:G}}/>
                      <span style={{color:G, fontSize:9, minWidth:28}}>{animSpeed.toFixed(1)}×</span>
                    </div>
                  </div>
                )}
                {drawerTab==='grid' && (
                  <div>
                    <div style={{display:'flex', gap:3, alignItems:'center', marginBottom:6}}>
                      <span style={{color:DG, fontSize:9, width:32}}>COLS</span>
                      {[-10,-1].map(d=><Btn key={d} onClick={()=>adjCols(d)} s={{fontSize:9,padding:'4px 8px'}}>{d}</Btn>)}
                      <span style={{color:G, fontSize:11, minWidth:28, textAlign:'center'}}>{cols}</span>
                      {[1,10].map(d=><Btn key={d} onClick={()=>adjCols(d)} s={{fontSize:9,padding:'4px 8px'}}>+{d}</Btn>)}
                    </div>
                    <div style={{display:'flex', gap:3, alignItems:'center', marginBottom:6}}>
                      <span style={{color:DG, fontSize:9, width:32}}>ROWS</span>
                      {[-10,-1].map(d=><Btn key={d} onClick={()=>adjRows(d)} s={{fontSize:9,padding:'4px 8px'}}>{d}</Btn>)}
                      <span style={{color:G, fontSize:11, minWidth:28, textAlign:'center'}}>{rows}</span>
                      {[1,10].map(d=><Btn key={d} onClick={()=>adjRows(d)} s={{fontSize:9,padding:'4px 8px'}}>+{d}</Btn>)}
                    </div>
                    <div style={{display:'flex', gap:4, marginBottom:6}}>
                      <Btn active={lockAspect} onClick={toggleLock} s={{fontSize:9}}>{lockAspect?'🔒 LOCKED':'🔓 LOCK'}</Btn>
                      <Btn onClick={fitToContainer} s={{fontSize:9}}>FULL</Btn>
                    </div>
                    <div style={{display:'flex', gap:3, flexWrap:'wrap'}}>
                      {GRID_PRESETS.map(([c,r])=>(
                        <Btn key={`${c}x${r}`} active={cols===c&&rows===r} onClick={()=>{setCols(c);setRows(r);}} s={{fontSize:9,padding:'4px 8px'}}>{c}×{r}</Btn>
                      ))}
                    </div>
                  </div>
                )}
                {drawerTab==='image' && (
                  <div>
                    <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:6}}>BRIGHTNESS / CONTRAST</div>
                    <Slider label='BR' value={brightness} min={0} max={3} step={0.05} onChange={setBrightness} fmt={v=>v.toFixed(2)+'×'} />
                    <Slider label='CO' value={contrast}   min={0} max={4} step={0.05} onChange={setContrast}   fmt={v=>v.toFixed(2)+'×'} />
                    <div style={{display:'flex', gap:4, marginBottom:10}}>
                      <Btn onClick={()=>{setBrightness(1);setContrast(1);}} s={{fontSize:9}}>RESET</Btn>
                    </div>
                    <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:6}}>RGB CHANNELS</div>
                    <Slider label='R' value={rScale} min={0} max={3} step={0.05} onChange={setRScale} />
                    <Slider label='G' value={gScale} min={0} max={3} step={0.05} onChange={setGScale} />
                    <Slider label='B' value={bScale} min={0} max={3} step={0.05} onChange={setBScale} />
                    <div style={{display:'flex', gap:4}}>
                      <Btn onClick={()=>{setRScale(1);setGScale(1);setBScale(1);}} s={{fontSize:9}}>RESET RGB</Btn>
                    </div>
                  </div>
                )}
                {drawerTab==='warp' && (
                  <div>
                    <div style={{display:'flex', gap:3, flexWrap:'wrap', marginBottom:8}}>
                      {['none','ripple','wave','swirl','fisheye','barrel','pinch','tunnel','twist'].map(m=>(
                        <Btn key={m} active={warpMode===m} onClick={()=>setWarpMode(m)} s={{fontSize:9,padding:'4px 8px'}}>{m.toUpperCase()}</Btn>
                      ))}
                    </div>
                    <div style={{display:'flex', gap:4, alignItems:'center'}}>
                      <span style={{color:DG, fontSize:9}}>AMT</span>
                      <input type='range' min='0' max='1' step='0.01' value={warpAmt}
                        onChange={ev=>setWarpAmt(parseFloat(ev.target.value))}
                        style={{flex:1, accentColor:G}}/>
                      <span style={{color:G, fontSize:9, minWidth:30}}>{warpAmt.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                {drawerTab==='src' && (
                  <div>
                    <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:8}}>
                      <Btn active={source==='demo'}   onClick={goDemo} s={{fontSize:10,padding:'6px 12px'}}>DEMO</Btn>
                      <Btn active={source==='camera'} onClick={startCamera} s={{fontSize:10,padding:'6px 12px'}}>📷 CAMERA</Btn>
                      <label style={{
                        background:source==='file'?G:'transparent', color:source==='file'?BG:G,
                        border:`1px solid ${source==='file'?G:BORDER}`,
                        padding:'6px 12px', fontFamily:'monospace', fontSize:10, cursor:'pointer',
                        WebkitTapHighlightColor:'transparent',
                      }}>
                        📁 VIDEO FILE<input type='file' accept='video/*' onChange={handleFile} style={{display:'none'}}/>
                      </label>
                    </div>
                    {camError&&<div style={{color:'#ff4444', fontSize:9}}>⚠ {camError}</div>}
                  </div>
                )}
                {drawerTab==='set' && (
                  <div>
                    <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:6}}>CHARSET</div>
                    <div style={{display:'flex', gap:4, flexWrap:'wrap', marginBottom:8}}>
                      {Object.keys(CHARSETS).map(k=>(
                        <Btn key={k} active={csKey===k} onClick={()=>setCsKey(k)} s={{fontSize:10,padding:'5px 10px'}}>{k.toUpperCase()}</Btn>
                      ))}
                    </div>
                    <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                      <Btn active={colorMode} onClick={()=>setColorMode(c=>!c)} s={{fontSize:10,padding:'5px 10px'}}>{colorMode?'🎨 COLOR':'⬜ MONO'}</Btn>
                      <Btn active={inv} onClick={()=>setInv(i=>!i)} s={{fontSize:10,padding:'5px 10px'}}>{inv?'◑ INVERT':'◐ NORMAL'}</Btn>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Desktop layout
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{display:'flex', height:'100dvh', background:BG, fontFamily:"'Courier New',monospace", overflow:'hidden'}}>
      <canvas ref={sampleRef} width={128} height={128} style={{display:'none'}} />
      <video ref={videoRef} playsInline muted style={{display:'none'}} />

      {/* Left column */}
      <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0}}>
        {/* Header */}
        <div style={{padding:'6px 12px', borderBottom:`1px solid ${BORDER}`, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div>
            <div style={{color:G, fontSize:10, letterSpacing:4, opacity:.4}}>▓▒░ ASCII RENDERER ░▒▓</div>
            <div style={{fontSize:9, color:G, letterSpacing:2, marginTop:1}}>◆ {statusMsg} · {cols}×{rows}</div>
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <Btn active={!asciiMode} onClick={()=>setAsciiMode(a=>!a)} s={{padding:'4px 10px', fontSize:9}}>
              {asciiMode ? '⌨ ASCII' : '📹 RAW'}
            </Btn>
            <span style={{color:fps>=28?G:fps>=15?'#aaff00':'#ff6600', fontSize:9, letterSpacing:2}}>{fps}fps · {renderMs}ms</span>
          </div>
        </div>
        {/* Canvas — fills remaining space at full resolution */}
        <div ref={containerRef} style={{flex:1, position:'relative', overflow:'hidden'}}>
          <canvas ref={outputRef} width={canvasW} height={canvasH}
            style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'#000'}}/>
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{width:240, flexShrink:0, background:'#020802', borderLeft:`1px solid ${BORDER}`,
        overflowY:'auto', display:'flex', flexDirection:'column'}}>
        <SidebarContent />
      </div>
    </div>
  );
}
