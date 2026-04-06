import useAsciiEngine from './useAsciiEngine';
import { cellDims, G, DG, BG, BORDER, CHARSETS, PRESETS, ANIM_TARGETS, TX_TARGETS, MAT_LABELS, MAT_DESC, ID9 } from './engine';

/* eslint-disable react/prop-types */
const Btn = ({active, onClick, children, title, s={}}) => (
  <button onClick={onClick} title={title} style={{
    background: active ? G : 'transparent', color: active ? BG : G,
    border: `1px solid ${active ? G : BORDER}`,
    padding:'3px 7px', fontFamily:'monospace', fontSize:9,
    letterSpacing:1, cursor:'pointer', whiteSpace:'nowrap', ...s
  }}>{children}</button>
);

function SecHeader({label}) {
  return <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4, marginTop:2}}>{label}</div>;
}
/* eslint-enable react/prop-types */

export default function Layout2Sidebar() {
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
    outputRef, sampleRef, videoRef,
  } = e;

  const {cW, cH} = cellDims(cols, rows);
  const canvasW = cols * cW, canvasH = rows * cH;

  const sideStyle = {
    width:240, flexShrink:0, background:'#020802', borderLeft:`1px solid ${BORDER}`,
    overflowY:'auto', display:'flex', flexDirection:'column',
  };
  const secStyle = { padding:'8px', borderTop:`1px solid ${BORDER}` };

  return (
    <div style={{display:'flex', height:'100vh', background:BG, fontFamily:"'Courier New',monospace", overflow:'hidden'}}>
      <canvas ref={sampleRef} width={128} height={128} style={{display:'none'}} />
      <video ref={videoRef} playsInline muted style={{display:'none'}} />

      {/* Left column */}
      <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0}}>
        {/* Header */}
        <div style={{padding:'8px 12px', borderBottom:`1px solid ${BORDER}`, flexShrink:0}}>
          <div style={{color:G, fontSize:10, letterSpacing:4, opacity:.4, marginBottom:2}}>▓▒░ ASCII RENDERER ░▒▓</div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:9, color:G, letterSpacing:2}}>
            <span>◆ {statusMsg} · {cols}×{rows}</span>
            <span style={{color:fps>=28?G:fps>=15?'#aaff00':'#ff6600'}}>{fps}fps · {renderMs}ms</span>
          </div>
        </div>
        {/* Canvas */}
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', overflow:'auto', padding:8}}>
          <canvas ref={outputRef} width={canvasW} height={canvasH}
            style={{display:'block', background:'#000', maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}}/>
        </div>
      </div>

      {/* Right sidebar */}
      <div style={sideStyle}>
        {/* MATRIX */}
        <div style={secStyle}>
          <SecHeader label='MATRIX' />
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
                      fontFamily:'monospace', fontSize:8, padding:'1px', textAlign:'center'}}
                  />
                </div>
              );
            })}
          </div>
          <div style={{display:'flex', gap:3}}>
            <Btn onClick={()=>applyPreset({m:()=>ID9.slice()})}>↺ ID</Btn>
            <Btn onClick={snapMatrix}>⚡ SNAP</Btn>
          </div>
        </div>

        {/* LIVE PARAM */}
        <div style={secStyle}>
          <SecHeader label='LIVE PARAM' />
          <select value={activeTx} onChange={ev=>{setActiveTx(ev.target.value); setTxParam(0);}}
            style={{width:'100%', background:'#000', color:G, border:`1px solid ${BORDER}`,
              fontFamily:'monospace', fontSize:8, marginBottom:3, padding:'2px'}}>
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
                fontFamily:'monospace', fontSize:8, flex:1, padding:'2px'}}>
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

        {/* PRESETS */}
        <div style={secStyle}>
          <SecHeader label='PRESETS' />
          <div style={{display:'flex', gap:2, flexWrap:'wrap'}}>
            {PRESETS.map(p=><Btn key={p.key} onClick={()=>applyPreset(p)}>{p.label}</Btn>)}
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
            {[[16,16],[32,32],[48,48],[64,64],[32,16],[64,32]].map(([c,r])=>(
              <Btn key={`${c}x${r}`} active={cols===c&&rows===r} onClick={()=>{setCols(c); setRows(r);}}>{c}×{r}</Btn>
            ))}
          </div>
        </div>

        {/* WARP */}
        <div style={secStyle}>
          <SecHeader label='WARP' />
          <div style={{display:'flex', gap:2, flexWrap:'wrap', marginBottom:4}}>
            {['none','ripple','wave','swirl','fisheye','barrel','pinch','tunnel','twist'].map(m=>(
              <Btn key={m} active={warpMode===m} onClick={()=>setWarpMode(m)}>{m.toUpperCase()}</Btn>
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
              padding:'3px 7px', fontFamily:'monospace', fontSize:9, cursor:'pointer'
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
              <Btn key={k} active={csKey===k} onClick={()=>setCsKey(k)}>{k.toUpperCase()}</Btn>
            ))}
          </div>
          <div style={{display:'flex', gap:4}}>
            <Btn active={colorMode} onClick={()=>setColorMode(c=>!c)}>{colorMode?'🎨':'⬜'}</Btn>
            <Btn active={inv} onClick={()=>setInv(i=>!i)}>{inv?'◑':'◐'}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
