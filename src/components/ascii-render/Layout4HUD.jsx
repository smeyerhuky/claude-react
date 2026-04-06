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

const overlay = {
  position:'absolute',
  background:'rgba(2,8,2,0.82)',
  border:`1px solid ${BORDER}`,
  padding:8,
  fontFamily:"'Courier New',monospace",
  color:G,
  zIndex:10,
};
/* eslint-enable react/prop-types */

export default function Layout4HUD() {
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
    <div ref={containerRef} style={{position:'relative', width:'100vw', height:'100vh', overflow:'hidden',
      background:'#000', fontFamily:"'Courier New',monospace"}}>
      <canvas ref={sampleRef} width={128} height={128} style={{display:'none'}} />
      <video ref={videoRef} playsInline muted style={{display:'none'}} />

      {/* Canvas — fills entire viewport at full resolution */}
      <canvas ref={outputRef} width={canvasW} height={canvasH}
        style={{position:'absolute', top:0, left:0, width:'100%', height:'100%',
          background:'#000'}}/>

      {/* Title overlay */}
      <div style={{...overlay, top:8, left:'50%', transform:'translateX(-50%)',
        background:'transparent', border:'none', padding:'4px 12px', textAlign:'center'}}>
        <span style={{fontSize:10, letterSpacing:4, color:G, opacity:.5}}>▓▒░ ASCII RENDERER ░▒▓</span>
      </div>

      {/* Top-left: SRC */}
      <div style={{...overlay, top:32, left:8}}>
        <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>SRC</div>
        <div style={{display:'flex', flexDirection:'column', gap:3}}>
          <Btn active={source==='demo'}   onClick={goDemo}>DEMO</Btn>
          <Btn active={source==='camera'} onClick={startCamera}>📷 CAMERA</Btn>
          <label style={{
            background:source==='file'?G:'transparent', color:source==='file'?BG:G,
            border:`1px solid ${source==='file'?G:BORDER}`,
            padding:'3px 7px', fontFamily:'monospace', fontSize:9, cursor:'pointer'
          }}>
            📁 VIDEO FILE<input type='file' accept='video/*' onChange={handleFile} style={{display:'none'}}/>
          </label>
        </div>
        {camError&&<div style={{color:'#ff4444', fontSize:8, marginTop:4}}>⚠ {camError}</div>}
      </div>

      {/* Top-right: Stats */}
      <div style={{...overlay, top:32, right:8, textAlign:'right'}}>
        <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>STATS</div>
        <div style={{fontSize:10, color:fps>=28?G:fps>=15?'#aaff00':'#ff6600',
          letterSpacing:2, marginBottom:2}}>{fps}fps · {renderMs}ms</div>
        <div style={{fontSize:9, color:G, letterSpacing:1}}>◆ {statusMsg}</div>
        <div style={{fontSize:9, color:DG}}>{cols}×{rows}</div>
      </div>

      {/* Bottom-left: WARP */}
      <div style={{...overlay, bottom:56, left:8}}>
        <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>WARP</div>
        <div style={{display:'flex', gap:2, flexWrap:'wrap', marginBottom:4, maxWidth:240}}>
          {['none','ripple','wave','swirl','fisheye','barrel','pinch','tunnel','twist'].map(m=>(
            <Btn key={m} active={warpMode===m} onClick={()=>setWarpMode(m)}>{m.toUpperCase()}</Btn>
          ))}
        </div>
        <div style={{display:'flex', gap:4, alignItems:'center'}}>
          <span style={{color:DG, fontSize:8, letterSpacing:1}}>AMT</span>
          <input type='range' min='0' max='1' step='0.01' value={warpAmt}
            onChange={ev=>setWarpAmt(parseFloat(ev.target.value))}
            style={{width:100, accentColor:G}}/>
          <span style={{color:G, fontSize:8, minWidth:26}}>{warpAmt.toFixed(2)}</span>
        </div>
      </div>

      {/* Bottom-right: SET */}
      <div style={{...overlay, bottom:56, right:8}}>
        <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>SET</div>
        <div style={{display:'flex', gap:2, flexWrap:'wrap', marginBottom:4}}>
          {Object.keys(CHARSETS).map(k=>(
            <Btn key={k} active={csKey===k} onClick={()=>setCsKey(k)}>{k.toUpperCase()}</Btn>
          ))}
        </div>
        <div style={{display:'flex', gap:4}}>
          <Btn active={colorMode} onClick={()=>setColorMode(c=>!c)}>{colorMode?'🎨 COLOR':'⬜ MONO'}</Btn>
          <Btn active={inv} onClick={()=>setInv(i=>!i)}>{inv?'◑ INVERTED':'◐ NORMAL'}</Btn>
        </div>
      </div>

      {/* Bottom bar — Matrix + Grid + Live Param + Animate + Presets */}
      <div style={{position:'absolute', bottom:0, left:0, right:0, zIndex:20,
        background:'rgba(2,8,2,0.92)', borderTop:`1px solid ${BORDER}`,
        overflowX:'auto', display:'flex', gap:12, padding:'6px 10px', alignItems:'flex-start'}}>

        {/* Matrix 3x3 */}
        <div style={{flexShrink:0}}>
          <div style={{fontSize:7, color:DG, letterSpacing:2, marginBottom:2}}>MATRIX
            {hovCell>=0&&<span style={{opacity:.5, marginLeft:4}}>{MAT_DESC[hovCell]}</span>}
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,44px)', gap:1}}>
            {matVals.map((v,idx)=>{
              const onDiag=idx===0||idx===4||idx===8;
              return (
                <div key={idx} style={{display:'flex', flexDirection:'column', alignItems:'center'}}
                  onMouseEnter={()=>setHovCell(idx)} onMouseLeave={()=>setHovCell(-1)}>
                  <span style={{fontSize:6, color:onDiag?'#007700':DG}}>{MAT_LABELS[idx]}</span>
                  <input type='number' step='0.01' value={parseFloat(v.toFixed(4))}
                    onChange={ev=>editCell(idx, ev.target.value)}
                    style={{width:'100%', background:hovCell===idx?'#001a00':'#000',
                      color:onDiag?'#88ff88':G, border:`1px solid ${hovCell===idx?G:BORDER}`,
                      fontFamily:'monospace', fontSize:8, padding:'1px', textAlign:'center'}}
                  />
                </div>
              );
            })}
          </div>
          <div style={{display:'flex', gap:2, marginTop:2}}>
            <Btn onClick={()=>applyPreset({m:()=>ID9.slice()})}>↺ ID</Btn>
            <Btn onClick={snapMatrix}>⚡ SNAP</Btn>
          </div>
        </div>

        {/* Grid */}
        <div style={{flexShrink:0}}>
          <div style={{fontSize:7, color:DG, letterSpacing:2, marginBottom:2}}>GRID</div>
          <div style={{display:'flex', gap:2, alignItems:'center', marginBottom:2}}>
            <span style={{color:DG, fontSize:7, width:22}}>COLS</span>
            {[-10,-1].map(d=><Btn key={d} onClick={()=>adjCols(d)} s={{padding:'1px 4px', fontSize:8}}>{d}</Btn>)}
            <span style={{color:G, fontSize:9, minWidth:18, textAlign:'center'}}>{cols}</span>
            {[1,10].map(d=><Btn key={d} onClick={()=>adjCols(d)} s={{padding:'1px 4px', fontSize:8}}>+{d}</Btn>)}
          </div>
          <div style={{display:'flex', gap:2, alignItems:'center', marginBottom:2}}>
            <span style={{color:DG, fontSize:7, width:22}}>ROWS</span>
            {[-10,-1].map(d=><Btn key={d} onClick={()=>adjRows(d)} s={{padding:'1px 4px', fontSize:8}}>{d}</Btn>)}
            <span style={{color:G, fontSize:9, minWidth:18, textAlign:'center'}}>{rows}</span>
            {[1,10].map(d=><Btn key={d} onClick={()=>adjRows(d)} s={{padding:'1px 4px', fontSize:8}}>+{d}</Btn>)}
          </div>
          <Btn active={lockAspect} onClick={toggleLock} s={{fontSize:8}}>{lockAspect?'🔒':'🔓 LOCK'}</Btn>
          <div style={{display:'flex', gap:2, flexWrap:'wrap', marginTop:2}}>
            {GRID_PRESETS.filter(([c])=>c<=64).slice(0,5).map(([c,r])=>(
              <Btn key={`${c}x${r}`} active={cols===c&&rows===r} onClick={()=>{setCols(c); setRows(r);}} s={{padding:'1px 3px', fontSize:7}}>{c}×{r}</Btn>
            ))}
          </div>
        </div>

        {/* Live Param */}
        <div style={{flexShrink:0, minWidth:120}}>
          <div style={{fontSize:7, color:DG, letterSpacing:2, marginBottom:2}}>LIVE PARAM</div>
          <select value={activeTx} onChange={ev=>{setActiveTx(ev.target.value); setTxParam(0);}}
            style={{width:'100%', background:'#000', color:G, border:`1px solid ${BORDER}`,
              fontFamily:'monospace', fontSize:8, marginBottom:2, padding:'2px'}}>
            {TX_TARGETS.map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
          </select>
          <input type='range' min='-1' max='1' step='0.01' value={txParam}
            onChange={ev=>applyTx(activeTx, parseFloat(ev.target.value))}
            style={{width:'100%', accentColor:G}}/>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:7, color:DG}}>
            <span>-1</span><span style={{color:G}}>{txParam.toFixed(3)}</span><span>1</span>
          </div>
        </div>

        {/* Animate */}
        <div style={{flexShrink:0}}>
          <div style={{fontSize:7, color:DG, letterSpacing:2, marginBottom:2}}>ANIMATE</div>
          <div style={{display:'flex', gap:2, marginBottom:2}}>
            <Btn active={animating} onClick={()=>setAnimating(a=>!a)} s={{minWidth:48}}>
              {animating?'■ STOP':'▶ RUN'}
            </Btn>
            <select value={animTarget} onChange={ev=>setAnimTarget(ev.target.value)}
              style={{background:'#000', color:G, border:`1px solid ${BORDER}`,
                fontFamily:'monospace', fontSize:8, padding:'2px'}}>
              {ANIM_TARGETS.map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
            </select>
          </div>
          <div style={{display:'flex', gap:3, alignItems:'center'}}>
            <span style={{color:DG, fontSize:7}}>SPD</span>
            <input type='range' min='0.1' max='6' step='0.1' value={animSpeed}
              onChange={ev=>setAnimSpeed(parseFloat(ev.target.value))}
              style={{width:80, accentColor:G}}/>
            <span style={{color:G, fontSize:8}}>{animSpeed.toFixed(1)}×</span>
          </div>
        </div>

        {/* Presets */}
        <div style={{flexShrink:0}}>
          <div style={{fontSize:7, color:DG, letterSpacing:2, marginBottom:2}}>PRESETS</div>
          <div style={{display:'flex', gap:2, flexWrap:'wrap', maxWidth:300}}>
            {PRESETS.map(p=><Btn key={p.key} onClick={()=>applyPreset(p)} s={{padding:'1px 4px', fontSize:7}}>{p.label}</Btn>)}
          </div>
        </div>
      </div>
    </div>
  );
}
