import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CHARSETS, LUTS, ID9, mm, applyM, lerpM, easeIO,
  animMatrix, txMatrix, applyWarp,
  drawDemo, renderChunks, paintGrid, cellDims,
  ANIM_TARGETS, TX_TARGETS,
} from './engine';

export default function useAsciiEngine() {
  // Grid
  const [cols,       setCols]       = useState(32);
  const [rows,       setRows]       = useState(32);
  const [lockAspect, setLockAspect] = useState(false);
  const aspectRef = useRef(1);
  const colsRef   = useRef(32), rowsRef = useRef(32), lockRef = useRef(false);
  useEffect(()=>{colsRef.current=cols; rowsRef.current=rows;},[cols,rows]);
  useEffect(()=>{lockRef.current=lockAspect;},[lockAspect]);

  // Charset / invert / color
  const [csKey,     setCsKey]     = useState('dense');
  const [inv,       setInv]       = useState(false);
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
  const [source,    setSource]    = useState('demo');
  const [statusMsg, setStatusMsg] = useState('DEMO');
  const [camError,  setCamError]  = useState('');

  // Stats
  const [fps,      setFps]      = useState(0);
  const [renderMs, setRenderMs] = useState(0);

  // Tab
  const [tab, setTab] = useState('matrix');

  // Hover tooltip for matrix cell
  const [hovCell, setHovCell] = useState(-1);

  // Refs
  const outputRef = useRef(null), sampleRef = useRef(null), videoRef = useRef(null);
  const streamRef = useRef(null), fileUrlRef = useRef(null);
  const rafRef    = useRef(null), tRef       = useRef(0);
  const fpsAcc    = useRef({frames:0, last:performance.now()});
  const sr        = useRef({});
  useEffect(()=>{
    sr.current={cols,rows,csKey,inv,colorMode,warpMode,warpAmt,source,animating,animTarget,animSpeed};
  },[cols,rows,csKey,inv,colorMode,warpMode,warpAmt,source,animating,animTarget,animSpeed]);

  // ── Main loop ──────────────────────────────────────────────────────────────
  useEffect(()=>{
    const oc=outputRef.current, sc=sampleRef.current; if(!oc||!sc) return;
    const oCtx=oc.getContext('2d'), sCtx=sc.getContext('2d',{willReadFrequently:true});
    let alive=true;

    const loop=async()=>{
      if(!alive) return;
      const{cols:C,rows:R,csKey:cs,inv:i,colorMode:cm,warpMode:wm,warpAmt:wa,source:src,animating:anim,animTarget:at,animSpeed:asp}=sr.current;
      const charset=CHARSETS[cs], lut=LUTS[cs];
      const sW=C*4, sH=R*4;
      const{cW,cH,fS}=cellDims(C,R);
      const t0=performance.now();
      if(sc.width!==sW||sc.height!==sH){sc.width=sW; sc.height=sH;}
      if(oc.width!==C*cW||oc.height!==R*cH){oc.width=C*cW; oc.height=R*cH;}

      try{
        if(src==='demo'){tRef.current+=0.018; drawDemo(sCtx,sW,sH,tRef.current);}
        else{const vid=videoRef.current; if(!vid||vid.readyState<2){rafRef.current=requestAnimationFrame(loop); return;} sCtx.drawImage(vid,0,0,sW,sH);}

        let M;
        const lrp=lerpRef.current;
        if(lrp.t<1){
          lrp.t=Math.min(1,lrp.t+0.07);
          M=lerpM(lrp.from,lrp.to,easeIO(lrp.t));
          matRef.current=[...M];
          if(lrp.t>=1&&!lrp.settled){lrp.settled=true; setMatVals([...lrp.to]);}
        } else {
          M=[...matRef.current];
        }

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
        fpsAcc.current.frames=0; fpsAcc.current.last=now;
      }
      if(alive) rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);
    return()=>{alive=false; cancelAnimationFrame(rafRef.current);};
  },[]);

  // ── Grid controls ──────────────────────────────────────────────────────────
  const adjCols=useCallback((d)=>{
    setCols(c=>{const nc=Math.max(4,Math.min(256,c+d)); if(lockRef.current)setRows(()=>Math.max(4,Math.min(256,Math.round(nc/aspectRef.current)))); return nc;});
  },[]);
  const adjRows=useCallback((d)=>{
    setRows(r=>{const nr=Math.max(4,Math.min(256,r+d)); if(lockRef.current)setCols(()=>Math.max(4,Math.min(256,Math.round(nr*aspectRef.current)))); return nr;});
  },[]);
  const toggleLock=useCallback(()=>{
    setLockAspect(l=>{if(!l)aspectRef.current=colsRef.current/rowsRef.current; return!l;});
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
    setMatVals(m=>{const nm=[...m]; nm[idx]=parseFloat(v)||0; matRef.current=[...nm]; return nm;});
  },[]);

  // ── Snap to identity ───────────────────────────────────────────────────────
  const snapMatrix=useCallback(()=>{
    setMatVals([...ID9]);
    matRef.current=[...ID9];
    lerpRef.current={t:1,settled:true};
  },[]);

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera=useCallback(async()=>{
    setCamError('');
    try{
      if(streamRef.current)streamRef.current.getTracks().forEach(t=>t.stop());
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1920},height:{ideal:1080}}});
      streamRef.current=stream;
      const vid=videoRef.current; vid.srcObject=stream; vid.src=''; await vid.play();
      setSource('camera'); setStatusMsg('CAMERA LIVE');
    }catch(e){setCamError(e.name==='NotAllowedError'?'Permission denied':e.message);}
  },[]);

  const handleFile=useCallback((e)=>{
    const file=e.target.files?.[0]; if(!file)return;
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null;}
    if(fileUrlRef.current)URL.revokeObjectURL(fileUrlRef.current);
    const url=URL.createObjectURL(file); fileUrlRef.current=url;
    const vid=videoRef.current; vid.srcObject=null; vid.src=url; vid.loop=true; vid.muted=true; vid.load(); vid.play().catch(()=>{});
    setSource('file'); setStatusMsg(file.name.length>22?file.name.slice(0,20)+'…':file.name); setCamError('');
  },[]);

  const goDemo=useCallback(()=>{
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null;}
    const vid=videoRef.current; vid.srcObject=null; vid.src='';
    setSource('demo'); setStatusMsg('DEMO'); setCamError('');
  },[]);

  return {
    // State
    cols, rows, lockAspect, csKey, inv, colorMode,
    matVals, animating, animTarget, animSpeed,
    activeTx, txParam, warpMode, warpAmt,
    source, statusMsg, camError, fps, renderMs, tab, hovCell,
    // Setters
    setCols, setRows,
    setCsKey, setInv, setColorMode, setMatVals,
    setAnimating, setAnimTarget, setAnimSpeed,
    setActiveTx, setTxParam, setWarpMode, setWarpAmt, setTab, setHovCell,
    // Refs
    outputRef, sampleRef, videoRef,
    // Callbacks
    adjCols, adjRows, toggleLock,
    applyPreset, applyTx, editCell, snapMatrix,
    startCamera, handleFile, goDemo,
  };
}
