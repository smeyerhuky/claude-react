import useAsciiEngine from './useAsciiEngine';
import { cellDims, G, DG, BG, BORDER, CHARSETS, PRESETS, ANIM_TARGETS, TX_TARGETS, MAT_LABELS, MAT_DESC, ID9, GRID_PRESETS } from './engine';

/* eslint-disable react/prop-types */
const Btn = ({active, onClick, children, title, s={}}) => (
  <button onClick={onClick} title={title} style={{
    background: active ? G : 'transparent', color: active ? BG : G,
    border: `1px solid ${active ? G : BORDER}`,
    padding:'3px 7px', fontFamily:'monospace', fontSize:9,
    letterSpacing:1, cursor:'pointer', whiteSpace:'nowrap', ...s
  }}>{children}</button>
);

function ToolSection({label, children}) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:4}}>
      <div style={{fontSize:7, color:DG, letterSpacing:2}}>{label}</div>
      {children}
    </div>
  );
}
/* eslint-enable react/prop-types */

export default function Layout5Split() {
  const e = useAsciiEngine();
  const {
    cols, rows, fps, renderMs, statusMsg,
    matVals, hovCell, setHovCell, editCell, applyPreset, snapMatrix,
    activeTx, setActiveTx, setTxParam, txParam, applyTx,
    animating, setAnimating, animTarget, setAnimTarget, animSpeed, setAnimSpeed,
    adjCols, adjRows, setCols, setRows, lockAspect, toggleLock,
    warpMode, setWarpMode, warpAmt, setWarpAmt,
    source, goDemo, startCamera, handleFile, camError,
    csKey, setCsKey, colorMode, setColorMode, inv, setInv,
    outputRef, sampleRef, videoRef, containerRef, containerSize,
  } = e;

  const {cW, cH} = cellDims(cols, rows, containerSize.w, containerSize.h);
  const canvasW = cols * cW, canvasH = rows * cH;

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100vh', background:BG,
      fontFamily:"'Courier New',monospace", overflow:'hidden'}}>
      <canvas ref={sampleRef} width={128} height={128} style={{display:'none'}} />
      <video ref={videoRef} playsInline muted style={{display:'none'}} />

      {/* Header */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'6px 12px', borderBottom:`1px solid ${BORDER}`, flexShrink:0, color:G}}>
        <span style={{fontSize:10, letterSpacing:4, opacity:.4}}>▓▒░ ASCII RENDERER ░▒▓</span>
        <span style={{fontSize:9, letterSpacing:2}}>◆ {statusMsg} · {cols}×{rows}</span>
        <span style={{fontSize:9, color:fps>=28?G:fps>=15?'#aaff00':'#ff6600', letterSpacing:1}}>{fps}fps · {renderMs}ms</span>
      </div>

      {/* Middle row */}
      <div style={{flex:1, display:'flex', overflow:'hidden'}}>
        {/* Canvas — fills remaining space at full resolution */}
        <div ref={containerRef} style={{flex:1.5, position:'relative', overflow:'hidden'}}>
          <canvas ref={outputRef} width={canvasW} height={canvasH}
            style={{position:'absolute', top:0, left:0, width:'100%', height:'100%',
              background:'#000'}}/>
        </div>

        {/* Right panel: Matrix + Live Param + Animate + Presets */}
        <div style={{width:260, borderLeft:`1px solid ${BORDER}`, overflowY:'auto', padding:8,
          display:'flex', flexDirection:'column', gap:10}}>

          {/* Transform Matrix */}
          <div>
            <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>
              TRANSFORM MATRIX&nbsp;
              <span style={{opacity:.5}}>{hovCell>=0 ? MAT_DESC[hovCell] : ''}</span>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2,
              border:`1px solid ${BORDER}`, padding:4, background:'#020802', marginBottom:4}}>
              {matVals.map((v,idx)=>{
                const onDiag=idx===0||idx===4||idx===8;
                return (
                  <div key={idx} style={{display:'flex', flexDirection:'column', alignItems:'center'}}
                    onMouseEnter={()=>setHovCell(idx)} onMouseLeave={()=>setHovCell(-1)}>
                    <span style={{fontSize:6, color:onDiag?'#007700':DG, letterSpacing:1}}>{MAT_LABELS[idx]}</span>
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
            <div style={{display:'flex', gap:4}}>
              <Btn onClick={()=>applyPreset({m:()=>ID9.slice()})}>↺ IDENTITY</Btn>
              <Btn onClick={snapMatrix}>⚡ SNAP</Btn>
            </div>
          </div>

          {/* Live Param */}
          <div>
            <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>LIVE PARAMETER</div>
            <select value={activeTx} onChange={ev=>{setActiveTx(ev.target.value); setTxParam(0);}}
              style={{width:'100%', background:'#000', color:G, border:`1px solid ${BORDER}`,
                fontFamily:'monospace', fontSize:9, marginBottom:4, padding:'2px'}}>
              {TX_TARGETS.map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
            </select>
            <input type='range' min='-1' max='1' step='0.01' value={txParam}
              onChange={ev=>applyTx(activeTx, parseFloat(ev.target.value))}
              style={{width:'100%', accentColor:G}}/>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:8, color:DG}}>
              <span>-1.00</span><span style={{color:G}}>{txParam.toFixed(3)}</span><span>1.00</span>
            </div>
          </div>

          {/* Animate */}
          <div style={{border:`1px solid ${BORDER}`, padding:6}}>
            <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>ANIMATE</div>
            <div style={{display:'flex', gap:4, marginBottom:4, flexWrap:'wrap'}}>
              <Btn active={animating} onClick={()=>setAnimating(a=>!a)} s={{minWidth:54}}>
                {animating?'■ STOP':'▶ RUN'}
              </Btn>
              <select value={animTarget} onChange={ev=>setAnimTarget(ev.target.value)}
                style={{background:'#000', color:G, border:`1px solid ${BORDER}`,
                  fontFamily:'monospace', fontSize:9, flex:1, padding:'2px'}}>
                {ANIM_TARGETS.map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
              </select>
            </div>
            <div style={{display:'flex', gap:4, alignItems:'center'}}>
              <span style={{color:DG, fontSize:8, whiteSpace:'nowrap'}}>SPD</span>
              <input type='range' min='0.1' max='6' step='0.1' value={animSpeed}
                onChange={ev=>setAnimSpeed(parseFloat(ev.target.value))}
                style={{flex:1, accentColor:G}}/>
              <span style={{color:G, fontSize:9, minWidth:26}}>{animSpeed.toFixed(1)}×</span>
            </div>
          </div>

          {/* Presets */}
          <div>
            <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>PRESETS</div>
            <div style={{display:'flex', gap:3, flexWrap:'wrap'}}>
              {PRESETS.map(p=><Btn key={p.key} onClick={()=>applyPreset(p)}>{p.label}</Btn>)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div style={{borderTop:`1px solid ${BORDER}`, padding:'6px 8px', display:'flex',
        gap:16, flexWrap:'wrap', alignItems:'flex-start', flexShrink:0,
        background:'#020802', overflowX:'auto'}}>

        <ToolSection label='GRID'>
          <div style={{display:'flex', gap:2, alignItems:'center'}}>
            <span style={{color:DG, fontSize:8, width:28}}>COLS</span>
            {[-10,-1].map(d=><Btn key={d} onClick={()=>adjCols(d)} s={{padding:'1px 4px', fontSize:8}}>{d}</Btn>)}
            <span style={{color:G, fontSize:9, minWidth:22, textAlign:'center'}}>{cols}</span>
            {[1,10].map(d=><Btn key={d} onClick={()=>adjCols(d)} s={{padding:'1px 4px', fontSize:8}}>+{d}</Btn>)}
          </div>
          <div style={{display:'flex', gap:2, alignItems:'center'}}>
            <span style={{color:DG, fontSize:8, width:28}}>ROWS</span>
            {[-10,-1].map(d=><Btn key={d} onClick={()=>adjRows(d)} s={{padding:'1px 4px', fontSize:8}}>{d}</Btn>)}
            <span style={{color:G, fontSize:9, minWidth:22, textAlign:'center'}}>{rows}</span>
            {[1,10].map(d=><Btn key={d} onClick={()=>adjRows(d)} s={{padding:'1px 4px', fontSize:8}}>+{d}</Btn>)}
          </div>
          <div style={{display:'flex', gap:2, flexWrap:'wrap'}}>
            <Btn active={lockAspect} onClick={toggleLock} s={{fontSize:8}}>{lockAspect?'🔒':'🔓 LOCK'}</Btn>
            {GRID_PRESETS.filter(([c])=>c<=64).slice(0,5).map(([c,r])=>(
              <Btn key={`${c}x${r}`} active={cols===c&&rows===r} onClick={()=>{setCols(c); setRows(r);}} s={{padding:'1px 4px', fontSize:7}}>{c}×{r}</Btn>
            ))}
          </div>
        </ToolSection>

        <ToolSection label='WARP'>
          <div style={{display:'flex', gap:2, flexWrap:'wrap'}}>
            {['none','ripple','wave','swirl','fisheye','barrel','pinch','tunnel','twist'].map(m=>(
              <Btn key={m} active={warpMode===m} onClick={()=>setWarpMode(m)} s={{padding:'2px 5px', fontSize:8}}>{m.toUpperCase()}</Btn>
            ))}
          </div>
          <div style={{display:'flex', gap:4, alignItems:'center'}}>
            <span style={{color:DG, fontSize:8}}>AMT</span>
            <input type='range' min='0' max='1' step='0.01' value={warpAmt}
              onChange={ev=>setWarpAmt(parseFloat(ev.target.value))}
              style={{width:80, accentColor:G}}/>
            <span style={{color:G, fontSize:8, minWidth:26}}>{warpAmt.toFixed(2)}</span>
          </div>
        </ToolSection>

        <ToolSection label='SRC'>
          <div style={{display:'flex', gap:3, flexWrap:'wrap'}}>
            <Btn active={source==='demo'}   onClick={goDemo}>DEMO</Btn>
            <Btn active={source==='camera'} onClick={startCamera}>📷 CAMERA</Btn>
            <label style={{
              background:source==='file'?G:'transparent', color:source==='file'?BG:G,
              border:`1px solid ${source==='file'?G:BORDER}`,
              padding:'3px 7px', fontFamily:'monospace', fontSize:9, cursor:'pointer'
            }}>
              📁 FILE<input type='file' accept='video/*' onChange={handleFile} style={{display:'none'}}/>
            </label>
          </div>
          {camError&&<div style={{color:'#ff4444', fontSize:8}}>⚠ {camError}</div>}
        </ToolSection>

        <ToolSection label='SET'>
          <div style={{display:'flex', gap:2, flexWrap:'wrap'}}>
            {Object.keys(CHARSETS).map(k=>(
              <Btn key={k} active={csKey===k} onClick={()=>setCsKey(k)} s={{padding:'2px 5px', fontSize:8}}>{k.toUpperCase()}</Btn>
            ))}
          </div>
          <div style={{display:'flex', gap:4}}>
            <Btn active={colorMode} onClick={()=>setColorMode(c=>!c)}>{colorMode?'🎨 COLOR':'⬜ MONO'}</Btn>
            <Btn active={inv} onClick={()=>setInv(i=>!i)}>{inv?'◑ INVERTED':'◐ NORMAL'}</Btn>
          </div>
        </ToolSection>
      </div>
    </div>
  );
}
