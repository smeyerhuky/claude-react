import{ab as S,a6 as F,aI as j,_ as p,g as q,s as H,a as J,b as Z,q as K,p as Q,l as z,c as X,D as Y,H as ee,R as te,aJ as ae,e as re,y as ne,F as ie}from"./index-CG1NegK0.js";import{p as se}from"./chunk-4BX2VUAB-B8PylAZh.js";import{p as le}from"./treemap-75Q7IDZK-D68mgmzi.js";import{d as P}from"./arc-B_vBGtqe.js";import"./_baseUniq-BFpxe-Ce.js";import"./_basePickBy-vmI9rw78.js";import"./clone-fHC77I62.js";function oe(e,a){return a<e?-1:a>e?1:a>=e?0:NaN}function ce(e){return e}function ue(){var e=ce,a=oe,f=null,y=S(0),s=S(F),o=S(0);function l(t){var n,c=(t=j(t)).length,g,x,m=0,u=new Array(c),i=new Array(c),v=+y.apply(this,arguments),w=Math.min(F,Math.max(-F,s.apply(this,arguments)-v)),h,C=Math.min(Math.abs(w)/c,o.apply(this,arguments)),$=C*(w<0?-1:1),d;for(n=0;n<c;++n)(d=i[u[n]=n]=+e(t[n],n,t))>0&&(m+=d);for(a!=null?u.sort(function(A,D){return a(i[A],i[D])}):f!=null&&u.sort(function(A,D){return f(t[A],t[D])}),n=0,x=m?(w-c*$)/m:0;n<c;++n,v=h)g=u[n],d=i[g],h=v+(d>0?d*x:0)+$,i[g]={data:t[g],index:n,value:d,startAngle:v,endAngle:h,padAngle:C};return i}return l.value=function(t){return arguments.length?(e=typeof t=="function"?t:S(+t),l):e},l.sortValues=function(t){return arguments.length?(a=t,f=null,l):a},l.sort=function(t){return arguments.length?(f=t,a=null,l):f},l.startAngle=function(t){return arguments.length?(y=typeof t=="function"?t:S(+t),l):y},l.endAngle=function(t){return arguments.length?(s=typeof t=="function"?t:S(+t),l):s},l.padAngle=function(t){return arguments.length?(o=typeof t=="function"?t:S(+t),l):o},l}var pe=ie.pie,G={sections:new Map,showData:!1},T=G.sections,N=G.showData,ge=structuredClone(pe),de=p(()=>structuredClone(ge),"getConfig"),fe=p(()=>{T=new Map,N=G.showData,ne()},"clear"),he=p(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);T.has(e)||(T.set(e,a),z.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),me=p(()=>T,"getSections"),ve=p(e=>{N=e},"setShowData"),Se=p(()=>N,"getShowData"),L={getConfig:de,clear:fe,setDiagramTitle:Q,getDiagramTitle:K,setAccTitle:Z,getAccTitle:J,setAccDescription:H,getAccDescription:q,addSection:he,getSections:me,setShowData:ve,getShowData:Se},ye=p((e,a)=>{se(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),xe={parse:p(async e=>{const a=await le("pie",e);z.debug(a),ye(a,L)},"parse")},we=p(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),Ae=we,De=p(e=>{const a=[...e.values()].reduce((s,o)=>s+o,0),f=[...e.entries()].map(([s,o])=>({label:s,value:o})).filter(s=>s.value/a*100>=1).sort((s,o)=>o.value-s.value);return ue().value(s=>s.value)(f)},"createPieArcs"),Ce=p((e,a,f,y)=>{z.debug(`rendering pie chart
`+e);const s=y.db,o=X(),l=Y(s.getConfig(),o.pie),t=40,n=18,c=4,g=450,x=g,m=ee(a),u=m.append("g");u.attr("transform","translate("+x/2+","+g/2+")");const{themeVariables:i}=o;let[v]=te(i.pieOuterStrokeWidth);v??(v=2);const w=l.textPosition,h=Math.min(x,g)/2-t,C=P().innerRadius(0).outerRadius(h),$=P().innerRadius(h*w).outerRadius(h*w);u.append("circle").attr("cx",0).attr("cy",0).attr("r",h+v/2).attr("class","pieOuterCircle");const d=s.getSections(),A=De(d),D=[i.pie1,i.pie2,i.pie3,i.pie4,i.pie5,i.pie6,i.pie7,i.pie8,i.pie9,i.pie10,i.pie11,i.pie12];let b=0;d.forEach(r=>{b+=r});const R=A.filter(r=>(r.data.value/b*100).toFixed(0)!=="0"),E=ae(D);u.selectAll("mySlices").data(R).enter().append("path").attr("d",C).attr("fill",r=>E(r.data.label)).attr("class","pieCircle"),u.selectAll("mySlices").data(R).enter().append("text").text(r=>(r.data.value/b*100).toFixed(0)+"%").attr("transform",r=>"translate("+$.centroid(r)+")").style("text-anchor","middle").attr("class","slice"),u.append("text").text(s.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText");const W=[...d.entries()].map(([r,M])=>({label:r,value:M})),k=u.selectAll(".legend").data(W).enter().append("g").attr("class","legend").attr("transform",(r,M)=>{const O=n+c,B=O*W.length/2,V=12*n,U=M*O-B;return"translate("+V+","+U+")"});k.append("rect").attr("width",n).attr("height",n).style("fill",r=>E(r.label)).style("stroke",r=>E(r.label)),k.append("text").attr("x",n+c).attr("y",n-c).text(r=>s.getShowData()?`${r.label} [${r.value}]`:r.label);const _=Math.max(...k.selectAll("text").nodes().map(r=>(r==null?void 0:r.getBoundingClientRect().width)??0)),I=x+t+n+c+_;m.attr("viewBox",`0 0 ${I} ${g}`),re(m,g,I,l.useMaxWidth)},"draw"),$e={draw:Ce},Ge={parser:xe,db:L,renderer:$e,styles:Ae};export{Ge as diagram};
