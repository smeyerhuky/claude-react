import { CHARSETS, PRESETS, ANIM_TARGETS, TX_TARGETS, MAT_LABELS, MAT_DESC, ID9, G, DG, BG, BORDER } from './engine';

/* eslint-disable react/prop-types */
export const Btn = ({active, onClick, children, title, s={}}) => (
  <button onClick={onClick} title={title} style={{
    background: active ? G : 'transparent', color: active ? BG : G,
    border: `1px solid ${active ? G : BORDER}`,
    padding:'3px 7px', fontFamily:'monospace', fontSize:9,
    letterSpacing:1, cursor:'pointer', whiteSpace:'nowrap', ...s
  }}>{children}</button>
);

export function MatrixPanel({ e }) {
  const { matVals, hovCell, setHovCell, editCell, applyPreset, snapMatrix,
          activeTx, setActiveTx, setTxParam, txParam, applyTx,
          animating, setAnimating, animTarget, setAnimTarget, animSpeed, setAnimSpeed } = e;
  return (
    <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
      {/* 3×3 matrix */}
      <div style={{minWidth:220}}>
        <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>
          TRANSFORM MATRIX&nbsp;&nbsp;<span style={{opacity:.5}}>{hovCell>=0 ? MAT_DESC[hovCell] : ''}</span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3,
          border:`1px solid ${BORDER}`, padding:6, background:'#020802'}}>
          {matVals.map((v,idx)=>{
            const onDiag=idx===0||idx===4||idx===8;
            return (
              <div key={idx} style={{display:'flex', flexDirection:'column', alignItems:'center'}}
                onMouseEnter={()=>setHovCell(idx)} onMouseLeave={()=>setHovCell(-1)}>
                <span style={{fontSize:7, color:onDiag?'#007700':DG, letterSpacing:1, marginBottom:1}}>{MAT_LABELS[idx]}</span>
                <input type='number' step='0.01'
                  value={parseFloat(v.toFixed(4))}
                  onChange={ev=>editCell(idx, ev.target.value)}
                  style={{width:'100%', background:hovCell===idx?'#001a00':'#000',
                    color:onDiag?'#88ff88':G,
                    border:`1px solid ${hovCell===idx?G:BORDER}`,
                    fontFamily:'monospace', fontSize:9, padding:'2px 2px', textAlign:'center'}}
                />
              </div>
            );
          })}
        </div>
        <div style={{display:'flex', gap:4, marginTop:4}}>
          <Btn onClick={()=>applyPreset({m:()=>ID9.slice()})}>↺ IDENTITY</Btn>
          <Btn onClick={snapMatrix}>⚡ SNAP</Btn>
        </div>
      </div>

      {/* Live param + Animate */}
      <div style={{flex:1, minWidth:180, display:'flex', flexDirection:'column', gap:8}}>
        <div>
          <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:3}}>LIVE PARAMETER</div>
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
      </div>

      {/* Presets */}
      <div style={{width:'100%'}}>
        <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>
          PRESETS&nbsp;&nbsp;<span style={{opacity:.4}}>(smooth lerp)</span>
        </div>
        <div style={{display:'flex', gap:3, flexWrap:'wrap'}}>
          {PRESETS.map(p=><Btn key={p.key} onClick={()=>applyPreset(p)}>{p.label}</Btn>)}
        </div>
      </div>
    </div>
  );
}

export function GridPanel({ e }) {
  const { cols, rows, adjCols, adjRows, setCols, setRows, lockAspect, toggleLock } = e;
  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      <div style={{display:'flex', gap:4, alignItems:'center'}}>
        <span style={{color:DG, fontSize:9, letterSpacing:1, width:36}}>COLS</span>
        {[-10,-5,-1].map(d=><Btn key={d} onClick={()=>adjCols(d)}>{d}</Btn>)}
        <span style={{color:G, fontSize:11, minWidth:28, textAlign:'center'}}>{cols}</span>
        {[1,5,10].map(d=><Btn key={d} onClick={()=>adjCols(d)}>+{d}</Btn>)}
      </div>
      <div style={{display:'flex', gap:4, alignItems:'center'}}>
        <span style={{color:DG, fontSize:9, letterSpacing:1, width:36}}>ROWS</span>
        {[-10,-5,-1].map(d=><Btn key={d} onClick={()=>adjRows(d)}>{d}</Btn>)}
        <span style={{color:G, fontSize:11, minWidth:28, textAlign:'center'}}>{rows}</span>
        {[1,5,10].map(d=><Btn key={d} onClick={()=>adjRows(d)}>+{d}</Btn>)}
      </div>
      <div style={{display:'flex', gap:6, alignItems:'center'}}>
        <Btn active={lockAspect} onClick={toggleLock}>{lockAspect?'🔒 LOCKED':'🔓 LOCK ASPECT'}</Btn>
        {lockAspect&&<span style={{color:DG, fontSize:9}}>ratio {(cols/rows).toFixed(3)}</span>}
      </div>
      <div style={{display:'flex', gap:3, flexWrap:'wrap'}}>
        {[[8,8],[16,16],[24,24],[32,32],[48,48],[64,64],[96,96],[128,128],[32,16],[64,32],[64,16],[128,64],[256,128]].map(([c,r])=>(
          <Btn key={`${c}x${r}`} active={cols===c&&rows===r} onClick={()=>{setCols(c); setRows(r);}}>{c}×{r}</Btn>
        ))}
      </div>
    </div>
  );
}

export function WarpPanel({ e }) {
  const { warpMode, setWarpMode, warpAmt, setWarpAmt } = e;
  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      <div style={{display:'flex', gap:3, flexWrap:'wrap'}}>
        {['none','ripple','wave','swirl','fisheye','barrel','pinch','tunnel','twist'].map(m=>(
          <Btn key={m} active={warpMode===m} onClick={()=>setWarpMode(m)}>{m.toUpperCase()}</Btn>
        ))}
      </div>
      <div style={{display:'flex', gap:6, alignItems:'center'}}>
        <span style={{color:DG, fontSize:9, letterSpacing:1}}>AMT</span>
        <input type='range' min='0' max='1' step='0.01' value={warpAmt}
          onChange={ev=>setWarpAmt(parseFloat(ev.target.value))}
          style={{flex:1, accentColor:G}}/>
        <span style={{color:G, fontSize:9, minWidth:30}}>{warpAmt.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function SrcPanel({ e }) {
  const { source, goDemo, startCamera, handleFile, camError } = e;
  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      <div style={{display:'flex', gap:5, flexWrap:'wrap'}}>
        <Btn active={source==='demo'}   onClick={goDemo}>DEMO</Btn>
        <Btn active={source==='camera'} onClick={startCamera}>📷 CAMERA</Btn>
        <label style={{
          background:source==='file'?G:'transparent',
          color:source==='file'?BG:G,
          border:`1px solid ${source==='file'?G:BORDER}`,
          padding:'3px 7px', fontFamily:'monospace', fontSize:9,
          letterSpacing:1, cursor:'pointer'
        }}>
          📁 VIDEO FILE
          <input type='file' accept='video/*' onChange={handleFile} style={{display:'none'}}/>
        </label>
      </div>
      {camError&&<div style={{color:'#ff4444', fontSize:9}}>⚠ {camError}</div>}
    </div>
  );
}

export function SetPanel({ e }) {
  const { csKey, setCsKey, colorMode, setColorMode, inv, setInv } = e;
  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      <div>
        <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>CHARSET</div>
        <div style={{display:'flex', gap:3, flexWrap:'wrap'}}>
          {Object.keys(CHARSETS).map(k=>(
            <Btn key={k} active={csKey===k} onClick={()=>setCsKey(k)}>{k.toUpperCase()}</Btn>
          ))}
        </div>
      </div>
      <div style={{display:'flex', gap:6, alignItems:'center'}}>
        <Btn active={colorMode} onClick={()=>setColorMode(c=>!c)}>{colorMode?'🎨 COLOR':'⬜ MONO'}</Btn>
        <Btn active={inv} onClick={()=>setInv(i=>!i)}>{inv?'◑ INVERTED':'◐ NORMAL'}</Btn>
      </div>
    </div>
  );
}
/* eslint-enable react/prop-types */
