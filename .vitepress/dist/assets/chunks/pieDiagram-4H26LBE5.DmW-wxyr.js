import{g as j,s as J,a as Q,b as Y,q as ee,p as te,_ as s,l as w,c as ae,G as ie,K as re,L as se,M as G,N as ne,e as le,z as oe,O as ce,H as de}from"./theme.qWb0lkus.js";import{p as pe}from"./chunk-4BX2VUAB.Dfn-BOWB.js";import{p as ge}from"./wardley-L42UT6IY.CoTRGpy1.js";import"./framework.BDRKwY9B.js";var he=de.pie,C={sections:new Map,showData:!1},u=C.sections,D=C.showData,ue=structuredClone(he),fe=s(()=>structuredClone(ue),"getConfig"),me=s(()=>{u=new Map,D=C.showData,oe()},"clear"),ve=s(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);u.has(e)||(u.set(e,a),w.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),xe=s(()=>u,"getSections"),Se=s(e=>{D=e},"setShowData"),we=s(()=>D,"getShowData"),L={getConfig:fe,clear:me,setDiagramTitle:te,getDiagramTitle:ee,setAccTitle:Y,getAccTitle:Q,setAccDescription:J,getAccDescription:j,addSection:ve,getSections:xe,setShowData:Se,getShowData:we},Ce=s((e,a)=>{pe(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),De={parse:s(async e=>{const a=await ge("pie",e);w.debug(a),Ce(a,L)},"parse")},$e=s(e=>`
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
`,"getStyles"),ye=$e,Te=s(e=>{const a=[...e.values()].reduce((r,l)=>r+l,0),$=[...e.entries()].map(([r,l])=>({label:r,value:l})).filter(r=>r.value/a*100>=1);return ce().value(r=>r.value).sort(null)($)},"createPieArcs"),Ae=s((e,a,$,y)=>{var W;w.debug(`rendering pie chart
`+e);const r=y.db,l=ae(),T=ie(r.getConfig(),l.pie),A=40,n=18,p=4,c=450,d=c,f=re(a),o=f.append("g");o.attr("transform","translate("+d/2+","+c/2+")");const{themeVariables:i}=l;let[b]=se(i.pieOuterStrokeWidth);b??(b=2);const _=T.textPosition,g=Math.min(d,c)/2-A,O=G().innerRadius(0).outerRadius(g),B=G().innerRadius(g*_).outerRadius(g*_);o.append("circle").attr("cx",0).attr("cy",0).attr("r",g+b/2).attr("class","pieOuterCircle");const h=r.getSections(),N=Te(h),P=[i.pie1,i.pie2,i.pie3,i.pie4,i.pie5,i.pie6,i.pie7,i.pie8,i.pie9,i.pie10,i.pie11,i.pie12];let m=0;h.forEach(t=>{m+=t});const E=N.filter(t=>(t.data.value/m*100).toFixed(0)!=="0"),v=ne(P).domain([...h.keys()]);o.selectAll("mySlices").data(E).enter().append("path").attr("d",O).attr("fill",t=>v(t.data.label)).attr("class","pieCircle"),o.selectAll("mySlices").data(E).enter().append("text").text(t=>(t.data.value/m*100).toFixed(0)+"%").attr("transform",t=>"translate("+B.centroid(t)+")").style("text-anchor","middle").attr("class","slice");const I=o.append("text").text(r.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText"),k=[...h.entries()].map(([t,S])=>({label:t,value:S})),x=o.selectAll(".legend").data(k).enter().append("g").attr("class","legend").attr("transform",(t,S)=>{const F=n+p,V=F*k.length/2,X=12*n,Z=S*F-V;return"translate("+X+","+Z+")"});x.append("rect").attr("width",n).attr("height",n).style("fill",t=>v(t.label)).style("stroke",t=>v(t.label)),x.append("text").attr("x",n+p).attr("y",n-p).text(t=>r.getShowData()?`${t.label} [${t.value}]`:t.label);const U=Math.max(...x.selectAll("text").nodes().map(t=>(t==null?void 0:t.getBoundingClientRect().width)??0)),q=d+A+n+p+U,R=((W=I.node())==null?void 0:W.getBoundingClientRect().width)??0,H=d/2-R/2,K=d/2+R/2,z=Math.min(0,H),M=Math.max(q,K)-z;f.attr("viewBox",`${z} 0 ${M} ${c}`),le(f,c,M,T.useMaxWidth)},"draw"),be={draw:Ae},Me={parser:De,db:L,renderer:be,styles:ye};export{Me as diagram};
