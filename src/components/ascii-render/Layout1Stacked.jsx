import useAsciiEngine from './useAsciiEngine';
import { cellDims, G, DG, BG, BORDER } from './engine';
import { MatrixPanel, GridPanel, WarpPanel, SrcPanel, SetPanel } from './shared';

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

export default function Layout1Stacked() {
  const e = useAsciiEngine();
  const { cols, rows, fps, renderMs, statusMsg, tab, setTab,
          asciiMode, setAsciiMode,
          outputRef, sampleRef, videoRef, containerRef, containerSize } = e;

  const {cW, cH} = cellDims(cols, rows, containerSize.w, containerSize.h);
  const canvasW = cols * cW, canvasH = rows * cH;

  /* eslint-disable react/prop-types */
  const TabBtn = ({k, label}) => (
    <button onClick={()=>setTab(k)} style={{
      background: tab===k ? '#001500' : 'transparent',
      color: tab===k ? G : DG,
      border: 'none',
      borderBottom: tab===k ? `1px solid ${G}` : '1px solid transparent',
      padding:'5px 10px', fontFamily:'monospace', fontSize:9,
      letterSpacing:2, cursor:'pointer',
    }}>{label || k.toUpperCase()}</button>
  );
  /* eslint-enable react/prop-types */

  return (
    <div style={{minHeight:'100vh', background:BG, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'flex-start', padding:'12px 8px',
      fontFamily:"'Courier New',monospace"}}>

      <canvas ref={sampleRef} width={128} height={128} style={{display:'none'}} />
      <video ref={videoRef} playsInline muted style={{display:'none'}} />

      <div style={{color:G, marginBottom:6, textAlign:'center'}}>
        <div style={{fontSize:10, letterSpacing:5, opacity:.3}}>▓▒░ ASCII RENDERER ░▒▓</div>
      </div>

      <div style={{width:'100%', maxWidth:'100vw', display:'flex', justifyContent:'space-between', fontSize:9,
        color:G, letterSpacing:2, borderBottom:`1px solid ${BORDER}`,
        paddingBottom:3, marginBottom:4}}>
        <span>◆ {statusMsg} · {cols}×{rows}</span>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <button onClick={()=>setAsciiMode(a=>!a)} style={{
            background:!asciiMode?G:'transparent', color:!asciiMode?BG:G,
            border:`1px solid ${!asciiMode?G:BORDER}`, padding:'2px 6px',
            fontFamily:'monospace', fontSize:8, cursor:'pointer', letterSpacing:1,
          }}>{asciiMode?'⌨ ASCII':'📹 RAW'}</button>
          <span style={{color:fps>=28?G:fps>=15?'#aaff00':'#ff6600'}}>{fps}fps · {renderMs}ms</span>
        </div>
      </div>

      {/* Canvas fills available width, maintains grid aspect ratio */}
      <div ref={containerRef} style={{
        width:'100%', maxWidth:'100vw', position:'relative',
        aspectRatio:`${cols}/${rows}`, maxHeight:'70vh',
        boxShadow:'0 0 24px #00ff410d',
      }}>
        <canvas ref={outputRef} width={canvasW} height={canvasH}
          style={{position:'absolute', top:0, left:0, width:'100%', height:'100%',
            display:'block', background:'#000'}}/>
      </div>

      <div style={{width:'100%', maxWidth:'100vw', marginTop:6}}>
        <div style={{display:'flex', borderBottom:`1px solid ${BORDER}`, marginBottom:6}}>
          <TabBtn k='matrix' label='MATRIX'/>
          <TabBtn k='grid'   label='GRID'/>
          <TabBtn k='warp'   label='WARP'/>
          <TabBtn k='src'    label='SRC'/>
          <TabBtn k='set'    label='SET'/>
        </div>

        {tab==='matrix' && <MatrixPanel e={e} />}
        {tab==='grid'   && <GridPanel e={e} />}
        {tab==='warp'   && <WarpPanel e={e} />}
        {tab==='src'    && <SrcPanel e={e} />}
        {tab==='set'    && <SetPanel e={e} />}
      </div>
    </div>
  );
}
