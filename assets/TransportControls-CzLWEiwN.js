import{c as s,r as g,j as e,C as v,B as r,p as j,P as y}from"./index-71EdIMDT.js";import{S as N}from"./square-Cji9AMcn.js";/**
 * @license lucide-react v0.507.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]],u=s("download",b);/**
 * @license lucide-react v0.507.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],k=s("rotate-ccw",f);/**
 * @license lucide-react v0.507.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],C=s("save",w),M=g.memo(({isPlaying:a,currentTime:n,totalDuration:c,onPlay:i,onStop:l,onPreview:m,onExportChain:d,onRenderMix:h})=>{const o=t=>{const p=Math.floor(t/60),x=Math.floor(t%60);return`${p.toString().padStart(2,"0")}:${x.toString().padStart(2,"0")}`};return e.jsx(v,{className:"bg-gray-900/95 border-gray-700 p-2",children:e.jsxs("div",{className:"flex items-center justify-between gap-2 text-sm",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(r,{size:"sm",onClick:i,className:`${a?"bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-black":"bg-gray-700 hover:bg-gray-600"}`,children:a?e.jsxs(e.Fragment,{children:[e.jsx(j,{className:"w-3 h-3 mr-1"})," Pause"]}):e.jsxs(e.Fragment,{children:[e.jsx(y,{className:"w-3 h-3 mr-1"})," Play"]})}),e.jsxs(r,{size:"sm",variant:"outline",onClick:l,className:"hover:bg-red-600 hover:border-red-600",children:[e.jsx(N,{className:"w-3 h-3 mr-1"})," Stop"]}),e.jsxs(r,{size:"sm",variant:"outline",onClick:m,className:"hover:bg-blue-600 hover:border-blue-600",children:[e.jsx(k,{className:"w-3 h-3 mr-1"})," Preview"]})]}),e.jsxs("div",{className:"font-mono text-lg text-green-400 bg-black/60 px-3 py-1 rounded border border-green-400/30 min-w-[120px] text-center",children:[o(n)," / ",o(c)]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsxs(r,{size:"sm",onClick:d,className:"bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",children:[e.jsx(u,{className:"w-3 h-3 mr-1"})," Export"]}),e.jsxs(r,{size:"sm",onClick:h,className:"bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",children:[e.jsx(C,{className:"w-3 h-3 mr-1"})," Render"]})]})]})})});M.displayName="TransportControls";export{M as TransportControls};
