import { useEffect, useRef, useState, useCallback } from "react";

// ─── CHARSETS ─────────────────────────────────────────────────────────────────
const CHARSETS = {
  dense:   ' .\'`^",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  blocks:  ' ░▒▓█',
  braille: ' ⠁⠃⠇⠏⠟⠿⡿⣿',
  simple:  ' .:-=+*#%@',
  binary:  ' .:01',
};
function buildLUT(cs) {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) lut[i] = Math.min(cs.length-1, Math.floor(i/255*cs.length));
  return lut;
}
const LUTS = Object.fromEntries(Object.entries(CHARSETS).map(([k,v])=>[k,buildLUT(v)]));

// ─── MATRIX OPS ───────────────────────────────────────────────────────────────
// Row-major 3×3 homogeneous: [a,b,tx, c,d,ty, p,q,w]
const ID9 = [1,0,0, 0,1,0, 0,0,1];

const mm = (A,B) => [
  A[0]*B[0]+A[1]*B[3]+A[2]*B[6], A[0]*B[1]+A[1]*B[4]+A[2]*B[7], A[0]*B[2]+A[1]*B[5]+A[2]*B[8],
  A[3]*B[0]+A[4]*B[3]+A[5]*B[6], A[3]*B[1]+A[4]*B[4]+A[5]*B[7], A[3]*B[2]+A[4]*B[5]+A[5]*B[8],
  A[6]*B[0]+A[7]*B[3]+A[8]*B[6], A[6]*B[1]+A[7]*B[4]+A[8]*B[7], A[6]*B[2]+A[7]*B[5]+A[8]*B[8],
];
const applyM = (m,u,v) => {
  const w = m[6]*u + m[7]*v + m[8];
  if (Math.abs(w)<1e-10) return [u,v];
  return [(m[0]*u+m[1]*v+m[2])/w, (m[3]*u+m[4]*v+m[5])/w];
};
const lerpM  = (A,B,t) => A.map((a,i)=>a+(B[i]-a)*t);
const easeIO = t => t<.5?2*t*t:1-2*(1-t)*(1-t);

// Matrix builders
const MRot  = a => [Math.cos(a),-Math.sin(a),0, Math.sin(a),Math.cos(a),0, 0,0,1];
const MScl  = (sx,sy) => [sx,0,0, 0,sy,0, 0,0,1];
const MShX  = s => [1,s,0, 0,1,0, 0,0,1];
const MShY  = s => [1,0,0, s,1,0, 0,0,1];
const MTrn  = () => [0,1,0, 1,0,0, 0,0,1];
const MFlH  = () => [-1,0,0, 0,1,0, 0,0,1];
const MFlV  = () => [1,0,0, 0,-1,0, 0,0,1];
const MPsp  = (px,py) => [1,0,0, 0,1,0, px,py,1];

const PRESETS = [
  { key:'id',    label:'IDENTITY',  m:()=>ID9.slice() },
  { key:'r45',   label:'ROT 45°',   m:()=>MRot(Math.PI/4) },
  { key:'r90',   label:'ROT 90°',   m:()=>MRot(Math.PI/2) },
  { key:'r135',  label:'ROT 135°',  m:()=>MRot(3*Math.PI/4) },
  { key:'r180',  label:'ROT 180°',  m:()=>MRot(Math.PI) },
  { key:'flipH', label:'FLIP H',    m:MFlH },
  { key:'flipV', label:'FLIP V',    m:MFlV },
  { key:'trn',   label:'TRANSPOSE', m:MTrn },
  { key:'z2',    label:'ZOOM 2×',   m:()=>MScl(2,2) },
  { key:'zh',    label:'ZOOM ½×',   m:()=>MScl(.5,.5) },
  { key:'sxp',   label:'SHEAR X+',  m:()=>MShX(.7) },
  { key:'sxn',   label:'SHEAR X−',  m:()=>MShX(-.7) },
  { key:'syp',   label:'SHEAR Y+',  m:()=>MShY(.7) },
  { key:'syn',   label:'SHEAR Y−',  m:()=>MShY(-.7) },
  { key:'sqx',   label:'SQUISH X',  m:()=>MScl(.35,1.9) },
  { key:'sqy',   label:'SQUISH Y',  m:()=>MScl(1.9,.35) },
  { key:'psx',   label:'PERSP X',   m:()=>MPsp(.5,0) },
  { key:'psy',   label:'PERSP Y',   m:()=>MPsp(0,.5) },
  { key:'psd',   label:'PERSP D',   m:()=>MPsp(.3,.3) },
  { key:'combo', label:'SHEAR+ROT', m:()=>mm(MRot(.4),MShX(.5)) },
];

// ─── WARP ─────────────────────────────────────────────────────────────────────
function applyWarp(mode, amt, u, v, t) {
  switch(mode) {
    case 'ripple':  return [u+Math.sin(v*12+t*2)*amt*.15, v+Math.sin(u*12+t*2)*amt*.15];
    case 'wave':    return [u+Math.sin(v*7+t)*amt*.2, v];
    case 'swirl': { const r=Math.sqrt(u*u+v*v),a=r*amt*9; return [u*Math.cos(a)-v*Math.sin(a),u*Math.sin(a)+v*Math.cos(a)]; }
    case 'fisheye':{ const r=Math.sqrt(u*u+v*v),s=r>0?Math.sin(r*Math.PI/2*amt)/(r*Math.PI/2*amt):1; return [u*s*(2-amt),v*s*(2-amt)]; }
    case 'barrel': { const r2=u*u+v*v; return [u*(1+amt*r2),v*(1+amt*r2)]; }
    case 'pinch':  { const r2=u*u+v*v; return [u*(1-amt*r2),v*(1-amt*r2)]; }
    case 'tunnel': { const r=Math.sqrt(u*u+v*v),s=(r>0)?(r+Math.sin(r*8-t)*amt*.1)/r:1; return [u*s,v*s]; }
    case 'twist':  { const r=Math.sqrt(u*u+v*v),a=r*amt*5+t; return [u*Math.cos(a)-v*Math.sin(a),u*Math.sin(a)+v*Math.cos(a)]; }
    default:        return [u,v];
  }
}

// ─── PLASMA DEMO ──────────────────────────────────────────────────────────────
function h2r(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}
function hslRgb(h,s,l){const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return[h2r(p,q,h+1/3),h2r(p,q,h),h2r(p,q,h-1/3)].map(v=>Math.round(v*255));}
function drawDemo(ctx,w,h,t) {
  const id=ctx.createImageData(w,h),d=id.data;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
    const nx=x/w-.5,ny=y/h-.5;
    const v=Math.sin(nx*12-t*2.1)+Math.sin(ny*9+t*1.7)+Math.sin((nx+ny)*8-t)+Math.sin(Math.sqrt(nx*nx+ny*ny)*18-t*2.5);
    const n=(v+4)/8;
    const [r,g,b]=hslRgb(((n*300+t*50)%360)/360,1,.35+n*.4);
    const i=(y*w+x)*4; d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=255;
  }
  ctx.putImageData(id,0,0);
}

// ─── PARALLEL CHUNK RESOLVERS ─────────────────────────────────────────────────
function renderChunks(pixels, sW, sH, cols, rows, cs, lut, inv, uvT, colorMode) {
  const NC=Math.min(8,rows), rpc=Math.ceil(rows/NC);
  const results=new Array(rows);
  return Promise.all(Array.from({length:NC},(_,ci)=>new Promise(resolve=>{
    const r0=ci*rpc, r1=Math.min(r0+rpc,rows);
    for(let r=r0;r<r1;r++){
      const row=new Array(cols);
      for(let c=0;c<cols;c++){
        const [tu,tv]=uvT(c/cols-.5, r/rows-.5);
        const px=Math.floor((tu+.5)*sW), py=Math.floor((tv+.5)*sH);
        let lum=0, pR=0, pG=0, pB=0;
        if(px>=0&&px<sW&&py>=0&&py<sH){
          const i=(py*sW+px)*4;
          pR=pixels[i]; pG=pixels[i+1]; pB=pixels[i+2];
          lum=Math.round(.299*pR+.587*pG+.114*pB);
        }
        const ch=cs[inv?(cs.length-1-lut[lum]):lut[lum]];
        row[c]=colorMode?{ch,r:pR,g:pG,b:pB}:ch;
      }
      results[r]=row;
    }
    resolve();
  }))).then(()=>results);
}

function paintGrid(ctx,grid,cols,rows,cW,cH,fS,colorMode) {
  ctx.fillStyle='#000'; ctx.fillRect(0,0,cols*cW,rows*cH);
  ctx.font=`${fS}px "Courier New",monospace`; ctx.textBaseline='top';
  if(colorMode){
    for(let r=0;r<rows;r++){if(!grid[r])continue; for(let c=0;c<cols;c++){const cell=grid[r][c];if(!cell||cell.ch===' ')continue;ctx.fillStyle=`rgb(${cell.r},${cell.g},${cell.b})`;ctx.fillText(cell.ch,c*cW,r*cH);}}
  } else {
    ctx.fillStyle='#d8d8d8';
    for(let r=0;r<rows;r++){if(!grid[r])continue; for(let c=0;c<cols;c++){const ch=grid[r][c];if(ch&&ch!==' ')ctx.fillText(ch,c*cW,r*cH);}}
  }
  ctx.fillStyle='rgba(0,0,0,0.055)';
  for(let y=0;y<rows*cH;y+=2)ctx.fillRect(0,y,cols*cW,1);
}

// ─── CELL_W / CELL_H scale with grid size ─────────────────────────────────────
const CANVAS_SIZE=1024;
function cellDims(cols,rows){
  const cW=Math.max(5,Math.floor(CANVAS_SIZE/cols));
  const cH=Math.max(6,Math.floor(CANVAS_SIZE/rows));
  return { cW, cH, fS:Math.max(4,cH-2) };
}

// ─── ANIM TARGETS ────────────────────────────────────────────────────────────
const ANIM_TARGETS = ['rotate','shearX','shearY','zoom','perspX','perspY','flip','bounce'];
const animMatrix = (target, ph) => {
  switch(target){
    case 'rotate':  return MRot(ph);
    case 'shearX':  return MShX(Math.sin(ph)*1.3);
    case 'shearY':  return MShY(Math.sin(ph)*1.3);
    case 'zoom':    return MScl(1+Math.sin(ph)*.5,1+Math.sin(ph)*.5);
    case 'perspX':  return MPsp(Math.sin(ph)*.45,0);
    case 'perspY':  return MPsp(0,Math.sin(ph)*.45);
    case 'flip':    return MScl(Math.cos(ph),1);
    case 'bounce':  return mm(MRot(Math.sin(ph)*.4),MScl(1+Math.sin(ph*.7)*.2,1));
    default:        return ID9.slice();
  }
};

// ─── MAT CELL LABELS ─────────────────────────────────────────────────────────
const MAT_LABELS = ['sx','kx','dx', 'ky','sy','dy', 'px','py','w'];
const MAT_DESC   = ['x-scale','x-shear','x-trans','y-shear','y-scale','y-trans','persp-x','persp-y','homo-w'];

// ─── TX SLIDER TARGETS ───────────────────────────────────────────────────────
const TX_TARGETS = ['rotate','scaleX','scaleY','shearX','shearY','zoom','perspX','perspY'];
const txMatrix = (type, val) => {
  switch(type){
    case 'rotate':  return MRot(val*Math.PI*2);
    case 'scaleX':  return MScl(Math.max(.05,val*3+1.5),1);
    case 'scaleY':  return MScl(1,Math.max(.05,val*3+1.5));
    case 'shearX':  return MShX(val*2);
    case 'shearY':  return MShY(val*2);
    case 'zoom':    return MScl(Math.max(.05,val*2+1),Math.max(.05,val*2+1));
    case 'perspX':  return MPsp(val*.6,0);
    case 'perspY':  return MPsp(0,val*.6);
    default:        return ID9.slice();
  }
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AsciiRenderer() {
  // Grid
  const [cols,       setCols]       = useState(32);
  const [rows,       setRows]       = useState(32);
  const [lockAspect, setLockAspect] = useState(false);
  const aspectRef = useRef(1);
  const colsRef   = useRef(32), rowsRef = useRef(32), lockRef = useRef(false);
  useEffect(()=>{colsRef.current=cols;rowsRef.current=rows;},[cols,rows]);
  useEffect(()=>{lockRef.current=lockAspect;},[lockAspect]);

  // Charset / invert / color
  const [csKey, setCsKey] = useState('dense');
  const [inv,   setInv]   = useState(false);
  const [colorMode, setColorMode] = useState(true);

  // Matrix
  const [matVals, setMatVals] = useState([...ID9]);
  const matRef   = useRef([...ID9]);
  const lerpRef  = useRef({ from:null, to:null, t:1, settled:true });
  useEffect(()=>{ if(lerpRef.current.t>=1) matRef.current=[...matVals]; },[matVals]);

  // Animation
  const [animating,  setAnimating]  = useState(false);
  const [animTarget, setAnimTarget] = useState('rotate');
  const [animSpeed,  setAnimSpeed]  = useState(1);
  const animPhase = useRef(0);

  // TX Slider
  const [activeTx, setActiveTx] = useState('rotate');
  const [txParam,  setTxParam]  = useState(0);

  // Warp
  const [warpMode, setWarpMode] = useState('none');
  const [warpAmt,  setWarpAmt]  = useState(0.4);

  // Source
  const [source,   setSource]   = useState('demo');
  const [statusMsg,setStatusMsg]= useState('DEMO');
  const [camError, setCamError] = useState('');

  // Stats
  const [fps,      setFps]      = useState(0);
  const [renderMs, setRenderMs] = useState(0);

  // Tab
  const [tab, setTab] = useState('matrix');

  // Hover tooltip for matrix cell
  const [hovCell, setHovCell] = useState(-1);

  // Refs
  const outputRef = useRef(null), sampleRef = useRef(null), videoRef = useRef(null);
  const streamRef = useRef(null), fileUrlRef= useRef(null);
  const rafRef    = useRef(null), tRef      = useRef(0);
  const fpsAcc    = useRef({frames:0,last:performance.now()});
  const sr        = useRef({});
  useEffect(()=>{sr.current={cols,rows,csKey,inv,colorMode,warpMode,warpAmt,source,animating,animTarget,animSpeed};},[cols,rows,csKey,inv,colorMode,warpMode,warpAmt,source,animating,animTarget,animSpeed]);

  // ── Main loop ──────────────────────────────────────────────────────────────
  useEffect(()=>{
    const oc=outputRef.current, sc=sampleRef.current; if(!oc||!sc) return;
    const oCtx=oc.getContext('2d'), sCtx=sc.getContext('2d',{willReadFrequently:true});
    let alive=true;

    const loop=async()=>{
      if(!alive) return;
      const{cols:C,rows:R,csKey:cs,inv:i,colorMode:cm,warpMode:wm,warpAmt:wa,source:src,animating:anim,animTarget:at,animSpeed:asp}=sr.current;
      const charset=CHARSETS[cs],lut=LUTS[cs];
      const sW=C*4,sH=R*4;
      const{cW,cH,fS}=cellDims(C,R);
      const t0=performance.now();
      if(sc.width!==sW||sc.height!==sH){sc.width=sW;sc.height=sH;}
      if(oc.width!==C*cW||oc.height!==R*cH){oc.width=C*cW;oc.height=R*cH;}

      try{
        if(src==='demo'){tRef.current+=0.018;drawDemo(sCtx,sW,sH,tRef.current);}
        else{const vid=videoRef.current;if(!vid||vid.readyState<2){rafRef.current=requestAnimationFrame(loop);return;}sCtx.drawImage(vid,0,0,sW,sH);}

        // Resolve matrix: lerp toward preset
        let M;
        const lrp=lerpRef.current;
        if(lrp.t<1){
          lrp.t=Math.min(1,lrp.t+0.07);
          M=lerpM(lrp.from,lrp.to,easeIO(lrp.t));
          matRef.current=[...M];
          if(lrp.t>=1&&!lrp.settled){lrp.settled=true;setMatVals([...lrp.to]);}
        } else {
          M=[...matRef.current];
        }

        // Compose animation layer
        if(anim){
          animPhase.current+=asp*0.025;
          M=mm(animMatrix(at,animPhase.current),M);
        }

        const uvT=(u,v)=>{
          let[u2,v2]=applyM(M,u,v);
          if(wm!=='none')[u2,v2]=applyWarp(wm,wa,u2,v2,tRef.current);
          return[u2,v2];
        };

        const{data}=sCtx.getImageData(0,0,sW,sH);
        const grid=await renderChunks(data,sW,sH,C,R,charset,lut,i,uvT,cm);
        paintGrid(oCtx,grid,C,R,cW,cH,fS,cm);
      }catch(_){/* ignore frame errors */}

      const now=performance.now();
      fpsAcc.current.frames++;
      if(now-fpsAcc.current.last>=600){
        setFps(Math.round(fpsAcc.current.frames/((now-fpsAcc.current.last)/1000)));
        setRenderMs(Math.round(now-t0));
        fpsAcc.current.frames=0;fpsAcc.current.last=now;
      }
      if(alive)rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);
    return()=>{alive=false;cancelAnimationFrame(rafRef.current);};
  },[]);

  // ── Grid controls ──────────────────────────────────────────────────────────
  const adjCols=useCallback((d)=>{
    setCols(c=>{const nc=Math.max(4,Math.min(256,c+d));if(lockRef.current)setRows(()=>Math.max(4,Math.min(256,Math.round(nc/aspectRef.current))));return nc;});
  },[]);
  const adjRows=useCallback((d)=>{
    setRows(r=>{const nr=Math.max(4,Math.min(256,r+d));if(lockRef.current)setCols(()=>Math.max(4,Math.min(256,Math.round(nr*aspectRef.current))));return nr;});
  },[]);
  const toggleLock=useCallback(()=>{
    setLockAspect(l=>{if(!l)aspectRef.current=colsRef.current/rowsRef.current;return!l;});
  },[]);

  // ── Preset (with lerp) ─────────────────────────────────────────────────────
  const applyPreset=useCallback((p)=>{
    const to=p.m();
    lerpRef.current={from:[...matRef.current],to,t:0,settled:false};
  },[]);

  // ── TX Slider ──────────────────────────────────────────────────────────────
  const applyTx=useCallback((type,val)=>{
    setTxParam(val);
    const m=txMatrix(type,val);
    setMatVals(m);
    matRef.current=[...m];
    lerpRef.current={...lerpRef.current,t:1};
  },[]);

  // ── Matrix cell edit ───────────────────────────────────────────────────────
  const editCell=useCallback((idx,v)=>{
    setMatVals(m=>{const nm=[...m];nm[idx]=parseFloat(v)||0;matRef.current=[...nm];return nm;});
  },[]);

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera=useCallback(async()=>{
    setCamError('');
    try{
      if(streamRef.current)streamRef.current.getTracks().forEach(t=>t.stop());
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1920},height:{ideal:1080}}});
      streamRef.current=stream;
      const vid=videoRef.current;vid.srcObject=stream;vid.src='';await vid.play();
      setSource('camera');setStatusMsg('CAMERA LIVE');
    }catch(e){setCamError(e.name==='NotAllowedError'?'Permission denied':e.message);}
  },[]);

  const handleFile=useCallback((e)=>{
    const file=e.target.files?.[0];if(!file)return;
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
    if(fileUrlRef.current)URL.revokeObjectURL(fileUrlRef.current);
    const url=URL.createObjectURL(file);fileUrlRef.current=url;
    const vid=videoRef.current;vid.srcObject=null;vid.src=url;vid.loop=true;vid.muted=true;vid.load();vid.play().catch(()=>{});
    setSource('file');setStatusMsg(file.name.length>22?file.name.slice(0,20)+'…':file.name);setCamError('');
  },[]);

  const goDemo=useCallback(()=>{
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
    const vid=videoRef.current;vid.srcObject=null;vid.src='';
    setSource('demo');setStatusMsg('DEMO');setCamError('');
  },[]);

  // ─── Style helpers ─────────────────────────────────────────────────────────
  const G='#00ff41', DG='#004400', BG='#050a04', BORDER='#002a00';

  /* eslint-disable react/prop-types */
  const Btn=({active,onClick,children,title,s={}})=>(
    <button onClick={onClick} title={title} style={{
      background:active?G:'transparent', color:active?BG:G,
      border:`1px solid ${active?G:BORDER}`,
      padding:'3px 7px', fontFamily:'monospace', fontSize:9,
      letterSpacing:1, cursor:'pointer', whiteSpace:'nowrap', ...s
    }}>{children}</button>
  );

  const TabBtn=({k,label})=>(
    <button onClick={()=>setTab(k)} style={{
      background:tab===k?'#001500':'transparent', color:tab===k?G:DG,
      border:'none', borderBottom:tab===k?`1px solid ${G}`:'1px solid transparent',
      padding:'5px 10px', fontFamily:'monospace', fontSize:9, letterSpacing:2, cursor:'pointer',
    }}>{label||k.toUpperCase()}</button>
  );
  /* eslint-enable react/prop-types */

  const {cW,cH}=cellDims(cols,rows);
  const canvasW=cols*cW, canvasH=rows*cH;
  const panelW=Math.max(canvasW,320);

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',padding:'12px 8px',fontFamily:"'Courier New',monospace"}}>

      {/* Hidden sampling canvas & video */}
      <canvas ref={sampleRef} width={128} height={128} style={{display:'none'}} />
      <video ref={videoRef} playsInline muted style={{display:'none'}} />

      {/* Header */}
      <div style={{color:G,marginBottom:6,textAlign:'center'}}>
        <div style={{fontSize:10,letterSpacing:5,opacity:.3}}>▓▒░ ASCII RENDERER ░▒▓</div>
      </div>

      {/* Status */}
      <div style={{width:panelW,display:'flex',justifyContent:'space-between',fontSize:9,color:G,letterSpacing:2,borderBottom:`1px solid ${BORDER}`,paddingBottom:3,marginBottom:4}}>
        <span>◆ {statusMsg} · {cols}×{rows}</span>
        <span style={{color:fps>=28?G:fps>=15?'#aaff00':'#ff6600'}}>{fps}fps · {renderMs}ms</span>
      </div>

      {/* Canvas */}
      <div style={{overflowX:'auto',maxWidth:'100vw'}}>
        <canvas ref={outputRef} width={canvasW} height={canvasH} style={{display:'block',background:'#000',boxShadow:'0 0 24px #00ff410d',maxWidth:'100vw',maxHeight:'80vh',objectFit:'contain'}}/>
      </div>

      {/* Panel */}
      <div style={{width:panelW,marginTop:6}}>
        <div style={{display:'flex',borderBottom:`1px solid ${BORDER}`,marginBottom:6}}>
          <TabBtn k='matrix' label='MATRIX'/>
          <TabBtn k='grid'   label='GRID'/>
          <TabBtn k='warp'   label='WARP'/>
          <TabBtn k='src'    label='SRC'/>
          <TabBtn k='set'    label='SET'/>
        </div>

        {/* ── MATRIX ──────────────────────────────────────────────────────── */}
        {tab==='matrix'&&(
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>

            {/* 3×3 matrix */}
            <div style={{minWidth:220}}>
              <div style={{fontSize:8,color:DG,letterSpacing:2,marginBottom:4}}>TRANSFORM MATRIX  <span style={{opacity:.5}}>{hovCell>=0?MAT_DESC[hovCell]:''}</span></div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:3,border:`1px solid ${BORDER}`,padding:6,background:'#020802'}}>
                {matVals.map((v,idx)=>{
                  const onDiag=idx===0||idx===4||idx===8;
                  return(
                    <div key={idx} style={{display:'flex',flexDirection:'column',alignItems:'center'}}
                      onMouseEnter={()=>setHovCell(idx)} onMouseLeave={()=>setHovCell(-1)}>
                      <span style={{fontSize:7,color:onDiag?'#007700':DG,letterSpacing:1,marginBottom:1}}>{MAT_LABELS[idx]}</span>
                      <input type='number' step='0.01'
                        value={parseFloat(v.toFixed(4))}
                        onChange={e=>editCell(idx,e.target.value)}
                        style={{width:'100%',background:hovCell===idx?'#001a00':'#000',color:onDiag?'#88ff88':G,
                          border:`1px solid ${hovCell===idx?G:BORDER}`,fontFamily:'monospace',fontSize:9,padding:'2px 2px',textAlign:'center'}}
                      />
                    </div>
                  );
                })}
              </div>
              {/* Reset */}
              <div style={{display:'flex',gap:4,marginTop:4}}>
                <Btn onClick={()=>applyPreset({m:()=>ID9.slice()})}>↺ IDENTITY</Btn>
                <Btn onClick={()=>{setMatVals([...ID9]);matRef.current=[...ID9];lerpRef.current={t:1,settled:true};}}>⚡ SNAP</Btn>
              </div>
            </div>

            {/* Right: slider + animate */}
            <div style={{flex:1,minWidth:180,display:'flex',flexDirection:'column',gap:8}}>

              {/* Live param slider */}
              <div>
                <div style={{fontSize:8,color:DG,letterSpacing:2,marginBottom:3}}>LIVE PARAMETER</div>
                <select value={activeTx} onChange={e=>{setActiveTx(e.target.value);setTxParam(0);}}
                  style={{width:'100%',background:'#000',color:G,border:`1px solid ${BORDER}`,fontFamily:'monospace',fontSize:9,marginBottom:4,padding:'2px'}}>
                  {TX_TARGETS.map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
                </select>
                <input type='range' min='-1' max='1' step='0.01' value={txParam}
                  onChange={e=>applyTx(activeTx,parseFloat(e.target.value))}
                  style={{width:'100%',accentColor:G}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:8,color:DG}}>
                  <span>-1.00</span><span style={{color:G}}>{txParam.toFixed(3)}</span><span>1.00</span>
                </div>
              </div>

              {/* Animate */}
              <div style={{border:`1px solid ${BORDER}`,padding:6}}>
                <div style={{fontSize:8,color:DG,letterSpacing:2,marginBottom:4}}>ANIMATE</div>
                <div style={{display:'flex',gap:4,marginBottom:4,flexWrap:'wrap'}}>
                  <Btn active={animating} onClick={()=>setAnimating(a=>!a)} s={{minWidth:54}}>
                    {animating?'■ STOP':'▶ RUN'}
                  </Btn>
                  <select value={animTarget} onChange={e=>setAnimTarget(e.target.value)}
                    style={{background:'#000',color:G,border:`1px solid ${BORDER}`,fontFamily:'monospace',fontSize:9,flex:1,padding:'2px'}}>
                    {ANIM_TARGETS.map(k=><option key={k} value={k}>{k.toUpperCase()}</option>)}
                  </select>
                </div>
                <div style={{display:'flex',gap:4,alignItems:'center'}}>
                  <span style={{color:DG,fontSize:8,whiteSpace:'nowrap'}}>SPD</span>
                  <input type='range' min='0.1' max='6' step='0.1' value={animSpeed}
                    onChange={e=>setAnimSpeed(parseFloat(e.target.value))}
                    style={{flex:1,accentColor:G}}/>
                  <span style={{color:G,fontSize:9,minWidth:26}}>{animSpeed.toFixed(1)}×</span>
                </div>
              </div>
            </div>

            {/* Presets — full width row */}
            <div style={{width:'100%'}}>
              <div style={{fontSize:8,color:DG,letterSpacing:2,marginBottom:4}}>PRESETS  <span style={{opacity:.4}}>(smooth lerp)</span></div>
              <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                {PRESETS.map(p=><Btn key={p.key} onClick={()=>applyPreset(p)}>{p.label}</Btn>)}
              </div>
            </div>
          </div>
        )}

        {/* ── GRID ────────────────────────────────────────────────────────── */}
        {tab==='grid'&&(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',gap:4,alignItems:'center'}}>
              <span style={{color:DG,fontSize:9,letterSpacing:1,width:36}}>COLS</span>
              {[-10,-5,-1].map(d=><Btn key={d} onClick={()=>adjCols(d)}>{d}</Btn>)}
              <span style={{color:G,fontSize:11,minWidth:28,textAlign:'center'}}>{cols}</span>
              {[1,5,10].map(d=><Btn key={d} onClick={()=>adjCols(d)}>+{d}</Btn>)}
            </div>
            <div style={{display:'flex',gap:4,alignItems:'center'}}>
              <span style={{color:DG,fontSize:9,letterSpacing:1,width:36}}>ROWS</span>
              {[-10,-5,-1].map(d=><Btn key={d} onClick={()=>adjRows(d)}>{d}</Btn>)}
              <span style={{color:G,fontSize:11,minWidth:28,textAlign:'center'}}>{rows}</span>
              {[1,5,10].map(d=><Btn key={d} onClick={()=>adjRows(d)}>+{d}</Btn>)}
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <Btn active={lockAspect} onClick={toggleLock}>{lockAspect?'🔒 LOCKED':'🔓 LOCK ASPECT'}</Btn>
              {lockAspect&&<span style={{color:DG,fontSize:9}}>ratio {(cols/rows).toFixed(3)}</span>}
            </div>
            <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
              {[[8,8],[16,16],[24,24],[32,32],[48,48],[64,64],[96,96],[128,128],[32,16],[64,32],[64,16],[128,64],[256,128]].map(([c,r])=>(
                <Btn key={`${c}x${r}`} active={cols===c&&rows===r} onClick={()=>{setCols(c);setRows(r);}}>{c}×{r}</Btn>
              ))}
            </div>
          </div>
        )}

        {/* ── WARP ────────────────────────────────────────────────────────── */}
        {tab==='warp'&&(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
              {['none','ripple','wave','swirl','fisheye','barrel','pinch','tunnel','twist'].map(m=>(
                <Btn key={m} active={warpMode===m} onClick={()=>setWarpMode(m)}>{m.toUpperCase()}</Btn>
              ))}
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <span style={{color:DG,fontSize:9,letterSpacing:1}}>AMT</span>
              <input type='range' min='0' max='1' step='0.01' value={warpAmt}
                onChange={e=>setWarpAmt(parseFloat(e.target.value))}
                style={{flex:1,accentColor:G}}/>
              <span style={{color:G,fontSize:9,minWidth:30}}>{warpAmt.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* ── SRC ─────────────────────────────────────────────────────────── */}
        {tab==='src'&&(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
              <Btn active={source==='demo'}   onClick={goDemo}>DEMO</Btn>
              <Btn active={source==='camera'} onClick={startCamera}>📷 CAMERA</Btn>
              <label style={{background:source==='file'?G:'transparent',color:source==='file'?BG:G,border:`1px solid ${source==='file'?G:BORDER}`,padding:'3px 7px',fontFamily:'monospace',fontSize:9,letterSpacing:1,cursor:'pointer'}}>
                📁 VIDEO FILE
                <input type='file' accept='video/*' onChange={handleFile} style={{display:'none'}}/>
              </label>
            </div>
            {camError&&<div style={{color:'#ff4444',fontSize:9}}>⚠ {camError}</div>}
          </div>
        )}

        {/* ── SET ─────────────────────────────────────────────────────────── */}
        {tab==='set'&&(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div>
              <div style={{fontSize:8,color:DG,letterSpacing:2,marginBottom:4}}>CHARSET</div>
              <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                {Object.keys(CHARSETS).map(k=>(
                  <Btn key={k} active={csKey===k} onClick={()=>setCsKey(k)}>{k.toUpperCase()}</Btn>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <Btn active={colorMode} onClick={()=>setColorMode(c=>!c)}>{colorMode?'🎨 COLOR':'⬜ MONO'}</Btn>
              <Btn active={inv} onClick={()=>setInv(i=>!i)}>{inv?'◑ INVERTED':'◐ NORMAL'}</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
