import { useState } from 'react';
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
/* eslint-enable react/prop-types */

const ICONS = [
  { k: 'matrix', label: '[M]', title: 'MATRIX' },
  { k: 'grid',   label: '[G]', title: 'GRID' },
  { k: 'warp',   label: '[~]', title: 'WARP' },
  { k: 'src',    label: '[►]', title: 'SRC' },
  { k: 'set',    label: '[S]', title: 'SET' },
];

export default function Layout3Drawer() {
  const e = useAsciiEngine();
  const [activeIcon, setActiveIcon] = useState(null);
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

  const toggleIcon = (k) => setActiveIcon(prev => prev === k ? null : k);

  const drawerContent = () => {
    switch(activeIcon) {
      case 'matrix': return (
        <div style={{padding:8}}>
          <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>TRANSFORM MATRIX</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2,
            border:`1px solid ${BORDER}`, padding:4, background:'#020802', marginBottom:4}}>
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
          <div style={{display:'flex', gap:3, marginBottom:8}}>
            <Btn onClick={()=>applyPreset({m:()=>ID9.slice()})}>↺ ID</Btn>
            <Btn onClick={snapMatrix}>⚡ SNAP</Btn>
          </div>
          <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:3}}>LIVE PARAM</div>
          <select value={activeTx} onChange={ev=>{setActiveTx(ev.target.value); setTxParam(0);}}
            style={{width:'100%', background:'#000', color:G, border:`1px solid ${BORDER}`,
              fontFamily:'monospace', fontSize:8, marginBottom:3, padding:'2px'}}>
            {TX_TARGETS.map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
          </select>
          <input type='range' min='-1' max='1' step='0.01' value={txParam}
            onChange={ev=>applyTx(activeTx, parseFloat(ev.target.value))}
            style={{width:'100%', accentColor:G, marginBottom:4}}/>
          <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>ANIMATE</div>
          <div style={{display:'flex', gap:3, marginBottom:3, flexWrap:'wrap'}}>
            <Btn active={animating} onClick={()=>setAnimating(a=>!a)}>{animating?'■ STOP':'▶ RUN'}</Btn>
            <select value={animTarget} onChange={ev=>setAnimTarget(ev.target.value)}
              style={{background:'#000', color:G, border:`1px solid ${BORDER}`,
                fontFamily:'monospace', fontSize:8, flex:1, padding:'2px'}}>
              {ANIM_TARGETS.map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
            </select>
          </div>
          <div style={{display:'flex', gap:4, alignItems:'center', marginBottom:8}}>
            <span style={{color:DG, fontSize:7}}>SPD</span>
            <input type='range' min='0.1' max='6' step='0.1' value={animSpeed}
              onChange={ev=>setAnimSpeed(parseFloat(ev.target.value))}
              style={{flex:1, accentColor:G}}/>
            <span style={{color:G, fontSize:8}}>{animSpeed.toFixed(1)}×</span>
          </div>
          <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>PRESETS</div>
          <div style={{display:'flex', gap:2, flexWrap:'wrap'}}>
            {PRESETS.map(p=><Btn key={p.key} onClick={()=>applyPreset(p)}>{p.label}</Btn>)}
          </div>
        </div>
      );
      case 'grid': return (
        <div style={{padding:8}}>
          <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>GRID SIZE</div>
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
          <div style={{marginBottom:4}}>
            <Btn active={lockAspect} onClick={toggleLock}>{lockAspect?'🔒 LOCKED':'🔓 LOCK ASPECT'}</Btn>
            {lockAspect&&<span style={{color:DG, fontSize:8, marginLeft:4}}>ratio {(cols/rows).toFixed(3)}</span>}
          </div>
          <div style={{display:'flex', gap:2, flexWrap:'wrap'}}>
            {GRID_PRESETS.filter(([c])=>c<=128).map(([c,r])=>(
              <Btn key={`${c}x${r}`} active={cols===c&&rows===r} onClick={()=>{setCols(c); setRows(r);}}>{c}×{r}</Btn>
            ))}
          </div>
        </div>
      );
      case 'warp': return (
        <div style={{padding:8}}>
          <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>WARP MODE</div>
          <div style={{display:'flex', gap:2, flexWrap:'wrap', marginBottom:6}}>
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
      );
      case 'src': return (
        <div style={{padding:8}}>
          <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>SOURCE</div>
          <div style={{display:'flex', gap:3, flexWrap:'wrap', marginBottom:4}}>
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
          {camError&&<div style={{color:'#ff4444', fontSize:8}}>⚠ {camError}</div>}
        </div>
      );
      case 'set': return (
        <div style={{padding:8}}>
          <div style={{fontSize:8, color:DG, letterSpacing:2, marginBottom:4}}>CHARSET</div>
          <div style={{display:'flex', gap:2, flexWrap:'wrap', marginBottom:6}}>
            {Object.keys(CHARSETS).map(k=>(
              <Btn key={k} active={csKey===k} onClick={()=>setCsKey(k)}>{k.toUpperCase()}</Btn>
            ))}
          </div>
          <div style={{display:'flex', gap:4}}>
            <Btn active={colorMode} onClick={()=>setColorMode(c=>!c)}>{colorMode?'🎨 COLOR':'⬜ MONO'}</Btn>
            <Btn active={inv} onClick={()=>setInv(i=>!i)}>{inv?'◑ INVERTED':'◐ NORMAL'}</Btn>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100vh', background:BG,
      fontFamily:"'Courier New',monospace", overflow:'hidden'}}>
      <canvas ref={sampleRef} width={128} height={128} style={{display:'none'}} />
      <video ref={videoRef} playsInline muted style={{display:'none'}} />

      {/* Header */}
      <div style={{padding:'6px 12px', borderBottom:`1px solid ${BORDER}`,
        display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0}}>
        <span style={{color:G, fontSize:10, letterSpacing:4, opacity:.4}}>▓▒░ ASCII RENDERER ░▒▓</span>
        <span style={{fontSize:9, color:G, letterSpacing:2}}>◆ {statusMsg} · {cols}×{rows}</span>
        <span style={{fontSize:9, color:fps>=28?G:fps>=15?'#aaff00':'#ff6600', letterSpacing:1}}>{fps}fps · {renderMs}ms</span>
      </div>

      {/* Body */}
      <div style={{flex:1, display:'flex', overflow:'hidden'}}>
        {/* Icon bar */}
        <div style={{width:40, background:'#020802', borderRight:`1px solid ${BORDER}`,
          display:'flex', flexDirection:'column', alignItems:'center', paddingTop:8, gap:4, flexShrink:0}}>
          {ICONS.map(ic=>(
            <button key={ic.k} title={ic.title} onClick={()=>toggleIcon(ic.k)} style={{
              background: activeIcon===ic.k ? G : 'transparent',
              color: activeIcon===ic.k ? BG : G,
              border: `1px solid ${activeIcon===ic.k ? G : BORDER}`,
              width:30, height:30, fontFamily:'monospace', fontSize:9,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              letterSpacing:0,
            }}>{ic.label}</button>
          ))}
        </div>

        {/* Drawer panel */}
        {activeIcon && (
          <div style={{width:220, background:'#020802', borderRight:`1px solid ${BORDER}`,
            overflowY:'auto', flexShrink:0, display:'flex', flexDirection:'column'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'4px 8px', borderBottom:`1px solid ${BORDER}`}}>
              <span style={{color:G, fontSize:8, letterSpacing:2}}>
                {ICONS.find(i=>i.k===activeIcon)?.title}
              </span>
              <button onClick={()=>setActiveIcon(null)} style={{
                background:'transparent', color:DG, border:'none',
                fontFamily:'monospace', fontSize:9, cursor:'pointer',
              }}>◀ close</button>
            </div>
            {drawerContent()}
          </div>
        )}

        {/* Canvas area — fills remaining space at full resolution */}
        <div ref={containerRef} style={{flex:1, position:'relative', overflow:'hidden'}}>
          <canvas ref={outputRef} width={canvasW} height={canvasH}
            style={{position:'absolute', top:0, left:0, width:'100%', height:'100%',
              background:'#000'}}/>
        </div>
      </div>
    </div>
  );
}
