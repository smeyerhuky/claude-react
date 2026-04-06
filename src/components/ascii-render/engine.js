// ─── CHARSETS ─────────────────────────────────────────────────────────────────
export const CHARSETS = {
  dense:   ' .\'`^",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  blocks:  ' ░▒▓█',
  braille: ' ⠁⠃⠇⠏⠟⠿⡿⣿',
  simple:  ' .:-=+*#%@',
  binary:  ' .:01',
};
export function buildLUT(cs) {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) lut[i] = Math.min(cs.length-1, Math.floor(i/255*cs.length));
  return lut;
}
export const LUTS = Object.fromEntries(Object.entries(CHARSETS).map(([k,v])=>[k,buildLUT(v)]));

// ─── MATRIX OPS ───────────────────────────────────────────────────────────────
export const ID9 = [1,0,0, 0,1,0, 0,0,1];

export const mm = (A,B) => [
  A[0]*B[0]+A[1]*B[3]+A[2]*B[6], A[0]*B[1]+A[1]*B[4]+A[2]*B[7], A[0]*B[2]+A[1]*B[5]+A[2]*B[8],
  A[3]*B[0]+A[4]*B[3]+A[5]*B[6], A[3]*B[1]+A[4]*B[4]+A[5]*B[7], A[3]*B[2]+A[4]*B[5]+A[5]*B[8],
  A[6]*B[0]+A[7]*B[3]+A[8]*B[6], A[6]*B[1]+A[7]*B[4]+A[8]*B[7], A[6]*B[2]+A[7]*B[5]+A[8]*B[8],
];
export const applyM = (m,u,v) => {
  const w = m[6]*u + m[7]*v + m[8];
  if (Math.abs(w)<1e-10) return [u,v];
  return [(m[0]*u+m[1]*v+m[2])/w, (m[3]*u+m[4]*v+m[5])/w];
};
export const lerpM  = (A,B,t) => A.map((a,i)=>a+(B[i]-a)*t);
export const easeIO = t => t<.5?2*t*t:1-2*(1-t)*(1-t);

// Matrix builders
export const MRot  = a => [Math.cos(a),-Math.sin(a),0, Math.sin(a),Math.cos(a),0, 0,0,1];
export const MScl  = (sx,sy) => [sx,0,0, 0,sy,0, 0,0,1];
export const MShX  = s => [1,s,0, 0,1,0, 0,0,1];
export const MShY  = s => [1,0,0, s,1,0, 0,0,1];
export const MTrn  = () => [0,1,0, 1,0,0, 0,0,1];
export const MFlH  = () => [-1,0,0, 0,1,0, 0,0,1];
export const MFlV  = () => [1,0,0, 0,-1,0, 0,0,1];
export const MPsp  = (px,py) => [1,0,0, 0,1,0, px,py,1];

export const PRESETS = [
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
export function applyWarp(mode, amt, u, v, t) {
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
export function h2r(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}
export function hslRgb(h,s,l){const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return[h2r(p,q,h+1/3),h2r(p,q,h),h2r(p,q,h-1/3)].map(v=>Math.round(v*255));}
export function drawDemo(ctx,w,h,t) {
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
export function renderChunks(pixels, sW, sH, cols, rows, cs, lut, inv, uvT, colorMode) {
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

export function paintGrid(ctx,grid,cols,rows,cW,cH,fS,colorMode) {
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

// ─── CELL DIMS ────────────────────────────────────────────────────────────────
export const CANVAS_SIZE = 1024;
export function cellDims(cols,rows){
  const cW=Math.max(5,Math.floor(CANVAS_SIZE/cols));
  const cH=Math.max(6,Math.floor(CANVAS_SIZE/rows));
  return { cW, cH, fS:Math.max(4,cH-2) };
}

// ─── ANIM TARGETS ────────────────────────────────────────────────────────────
export const ANIM_TARGETS = ['rotate','shearX','shearY','zoom','perspX','perspY','flip','bounce'];
export const animMatrix = (target, ph) => {
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
export const MAT_LABELS = ['sx','kx','dx', 'ky','sy','dy', 'px','py','w'];
export const MAT_DESC   = ['x-scale','x-shear','x-trans','y-shear','y-scale','y-trans','persp-x','persp-y','homo-w'];

// ─── TX SLIDER TARGETS ───────────────────────────────────────────────────────
export const TX_TARGETS = ['rotate','scaleX','scaleY','shearX','shearY','zoom','perspX','perspY'];
export const txMatrix = (type, val) => {
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

// ─── GRID SIZE PRESETS ────────────────────────────────────────────────────────
export const GRID_PRESETS = [
  [8,8],[16,16],[24,24],[32,32],[48,48],[64,64],[96,96],[128,128],
  [32,16],[64,32],[64,16],[128,64],[256,128],
];

// ─── THEME COLORS ─────────────────────────────────────────────────────────────
export const G      = '#00ff41';
export const DG     = '#004400';
export const BG     = '#050a04';
export const BORDER = '#002a00';
