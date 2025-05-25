import{c as t,r as x,j as e,B as s,p as z,P}from"./index-CJbHX0Ru.js";import{P as M}from"./progress-DeXdwjJT.js";import{S as F}from"./square-w2KgOFgo.js";/**
 * @license lucide-react v0.507.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]],I=t("download",S);/**
 * @license lucide-react v0.507.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=[["polygon",{points:"13 19 22 12 13 5 13 19",key:"587y9g"}],["polygon",{points:"2 19 11 12 2 5 2 19",key:"3pweh0"}]],q=t("fast-forward",T);/**
 * @license lucide-react v0.507.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=[["polygon",{points:"11 19 2 12 11 5 11 19",key:"14yba5"}],["polygon",{points:"22 19 13 12 22 5 22 19",key:"1pi1cj"}]],B=t("rewind",R);/**
 * @license lucide-react v0.507.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],H=t("rotate-ccw",E);/**
 * @license lucide-react v0.507.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],L=t("save",G);/**
 * @license lucide-react v0.507.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=[["polygon",{points:"19 20 9 12 19 4 19 20",key:"o2sva"}],["line",{x1:"5",x2:"5",y1:"19",y2:"5",key:"1ocqjk"}]],U=t("skip-back",V);/**
 * @license lucide-react v0.507.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=[["polygon",{points:"5 4 15 12 5 20 5 4",key:"16p6eg"}],["line",{x1:"19",x2:"19",y1:"5",y2:"19",key:"futhcm"}]],J=t("skip-forward",A),K=x.memo(({isPlaying:h,currentTime:d,totalDuration:r,onPlay:g,onStop:v,onPreview:y,onExportChain:j,onRenderMix:b,onSeek:c,onNextTrack:N,onPrevTrack:k,chain:a=[]})=>{var p;const[O,Q]=x.useState(!1),i=o=>{const n=Math.floor(o/60),m=Math.floor(o%60);return`${n.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`};x.useCallback(o=>{const n=o[0]/100*r;c==null||c(n)},[r,c]);const u=r>0?d/r*100:0,l=a.findIndex(o=>!0),w=l<a.length-1,f=l>0;return e.jsxs("div",{className:"bg-gray-900/95 border-t border-gray-700 p-3",children:[e.jsxs("div",{className:"mb-3",children:[e.jsxs("div",{className:"flex items-center justify-between text-xs text-gray-400 mb-1",children:[e.jsx("span",{children:i(d)}),e.jsx("span",{className:"text-purple-400",children:"Chain Progress"}),e.jsx("span",{children:i(r)})]}),e.jsxs("div",{className:"relative",children:[e.jsx(M,{value:u,className:"h-2 bg-gray-800"}),a.length>0&&e.jsx("div",{className:"absolute top-0 left-0 right-0 h-2 pointer-events-none",children:a.map((o,n)=>{const m=a.slice(0,n).reduce((C,$)=>C+$.duration,0),_=r>0?m/r*100:0;return e.jsx("div",{className:"absolute top-0 bottom-0 w-px bg-cyan-400 opacity-70",style:{left:`${_}%`},title:`Track ${n+1}: ${o.name}`},o.chainId)})})]})]}),e.jsxs("div",{className:"flex items-center justify-between gap-4",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(s,{size:"sm",variant:"outline",onClick:k,disabled:!f,className:"hover:bg-blue-600 hover:border-blue-600",children:e.jsx(U,{className:"w-3 h-3"})}),e.jsx(s,{size:"sm",variant:"outline",className:"hover:bg-gray-600",children:e.jsx(B,{className:"w-3 h-3"})}),e.jsx(s,{size:"sm",onClick:g,className:`px-4 ${h?"bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-black":"bg-gray-700 hover:bg-gray-600"}`,children:h?e.jsxs(e.Fragment,{children:[e.jsx(z,{className:"w-4 h-4 mr-1"})," Pause"]}):e.jsxs(e.Fragment,{children:[e.jsx(P,{className:"w-4 h-4 mr-1"})," Play"]})}),e.jsx(s,{size:"sm",variant:"outline",onClick:v,className:"hover:bg-red-600 hover:border-red-600",children:e.jsx(F,{className:"w-3 h-3"})}),e.jsx(s,{size:"sm",variant:"outline",className:"hover:bg-gray-600",children:e.jsx(q,{className:"w-3 h-3"})}),e.jsx(s,{size:"sm",variant:"outline",onClick:N,disabled:!w,className:"hover:bg-blue-600 hover:border-blue-600",children:e.jsx(J,{className:"w-3 h-3"})})]}),e.jsxs("div",{className:"font-mono text-sm text-green-400 bg-black/60 px-3 py-1 rounded border border-green-400/30 min-w-[100px] text-center",children:[i(d)," / ",i(r)]}),e.jsx("div",{className:"text-xs text-gray-400 min-w-[80px] text-center",children:a.length>0?e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:["Track ",l+1," / ",a.length]}),e.jsx("div",{className:"text-purple-400",children:((p=a[l])==null?void 0:p.name)||"Unknown"})]}):e.jsx("div",{children:"No tracks"})}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsxs(s,{size:"sm",onClick:y,variant:"outline",className:"hover:bg-blue-600 hover:border-blue-600",children:[e.jsx(H,{className:"w-3 h-3 mr-1"})," Preview"]}),e.jsxs(s,{size:"sm",onClick:j,className:"bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",children:[e.jsx(I,{className:"w-3 h-3 mr-1"})," Export"]}),e.jsxs(s,{size:"sm",onClick:b,className:"bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",children:[e.jsx(L,{className:"w-3 h-3 mr-1"})," Render"]})]})]})]})});K.displayName="TransportControls";export{K as TransportControls};
