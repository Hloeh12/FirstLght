// Render our closed set of local chart primitives directly. No Blob images,
// foreignObject, remote fonts or asynchronous SVG decoder are involved.
const number=(node,key,fallback=0)=>{const n=parseFloat(node.getAttribute(key));return Number.isFinite(n)?n:fallback;};
const numeric=(value,fallback=1)=>{const n=parseFloat(value);return Number.isFinite(n)?n:fallback;};
const skipped=new Set(['defs','linearGradient','radialGradient','stop','filter','marker','title','desc']);
export function drawSvg(ctx,svg,x,y,width,height){
 const box=(svg.getAttribute('viewBox')||`0 0 ${width} ${height}`).trim().split(/[\s,]+/).map(Number);
 if(box.length!==4||box.some(n=>!Number.isFinite(n))||box[2]<=0||box[3]<=0)throw Error('盘面矢量尺寸无效');
 const paint=(value,node)=>{
  if(!value||value==='none')return null;
  const ref=value.match(/url\(["']?[^)"']*#([^)"']+)["']?\)/);
  if(!ref)return value;
  const gradient=[...svg.querySelectorAll('[id]')].find(n=>n.id===ref[1]);
  if(!gradient||gradient.localName!=='linearGradient')return '#ff77aa';
  const b=node.getBBox(),units=gradient.getAttribute('gradientUnits')==='userSpaceOnUse';
  const coordinate=(key,dimension,start,fallback)=>{
   const raw=gradient.getAttribute(key)??fallback,n=parseFloat(raw);
   return units?n:(start+(raw.endsWith('%')?n/100:n)*dimension);
  };
  const g=ctx.createLinearGradient(coordinate('x1',b.width,b.x,'0'),coordinate('y1',b.height,b.y,'0'),coordinate('x2',b.width,b.x,'1'),coordinate('y2',b.height,b.y,'0'));
  for(const stop of gradient.querySelectorAll('stop')){
   const raw=stop.getAttribute('offset')||'0',offset=parseFloat(raw)/(raw.endsWith('%')?100:1),style=getComputedStyle(stop);
   g.addColorStop(Math.max(0,Math.min(1,offset)),style.stopColor||stop.getAttribute('stop-color')||'#ff77aa');
  }
  return g;
 };
 const visit=node=>{
  const tag=node.localName;
  if(skipped.has(tag)||node.matches('.comet-head,.flight-current,.flight-ripple,.flight-target-dot'))return;
  const css=getComputedStyle(node);
  if(css.display==='none'||css.visibility==='hidden'||numeric(css.opacity)===0)return;
  ctx.save();
  try{
   ctx.globalAlpha*=numeric(css.opacity);
   if(css.transform&&css.transform!=='none'){
    const m=new DOMMatrix(css.transform),origin=css.transformOrigin.split(/\s+/).map(parseFloat),ox=origin[0]||0,oy=origin[1]||0;
    ctx.translate(ox,oy);ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f);ctx.translate(-ox,-oy);
   }else if(node.transform?.baseVal){for(let i=0;i<node.transform.baseVal.numberOfItems;i++){const m=node.transform.baseVal.getItem(i).matrix;ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f);}}
   if(tag==='svg'||tag==='g'||tag==='a'){for(const child of node.children)visit(child);return;}
   const fill=paint(css.fill,node),stroke=paint(css.stroke,node),alpha=ctx.globalAlpha;
   ctx.lineWidth=numeric(css.strokeWidth,1);ctx.lineCap=css.strokeLinecap||'butt';ctx.lineJoin=css.strokeLinejoin||'miter';
   const dash=node.hasAttribute('pathLength')&&!node.matches('.zi-opposition')?[]:(css.strokeDasharray||'').match(/[\d.]+/g)?.map(Number)||[];
   ctx.setLineDash(dash);
   if(css.filter?.includes('drop-shadow')){ctx.shadowColor='#ff77aa88';ctx.shadowBlur=3;}
   if(tag==='text'){
    ctx.font=`${css.fontWeight||400} ${css.fontSize||'10px'} ${css.fontFamily||'sans-serif'}`;
    ctx.textAlign=css.textAnchor==='middle'?'center':css.textAnchor==='end'?'right':'left';
    ctx.textBaseline=['central','middle'].includes(css.dominantBaseline)?'middle':css.dominantBaseline==='hanging'?'top':'alphabetic';
    if(fill){ctx.fillStyle=fill;ctx.globalAlpha=alpha*numeric(css.fillOpacity);ctx.fillText(node.textContent,number(node,'x'),number(node,'y'));}return;
   }
   let path;
   if(tag==='path')path=new Path2D(node.getAttribute('d')||'');
   else{
    path=new Path2D();
    if(tag==='line'){path.moveTo(number(node,'x1'),number(node,'y1'));path.lineTo(number(node,'x2'),number(node,'y2'));}
    else if(tag==='circle')path.arc(number(node,'cx'),number(node,'cy'),number(node,'r'),0,Math.PI*2);
    else if(tag==='ellipse')path.ellipse(number(node,'cx'),number(node,'cy'),number(node,'rx'),number(node,'ry'),0,0,Math.PI*2);
    else if(tag==='rect')path.rect(number(node,'x'),number(node,'y'),number(node,'width'),number(node,'height'));
    else if(tag==='polygon'||tag==='polyline'){
     const points=(node.getAttribute('points')||'').trim().split(/[\s,]+/).map(Number);
     for(let i=0;i+1<points.length;i+=2)i?path.lineTo(points[i],points[i+1]):path.moveTo(points[i],points[i+1]);
     if(tag==='polygon')path.closePath();
    }else return;
   }
   if(fill&&tag!=='line'){ctx.fillStyle=fill;ctx.globalAlpha=alpha*numeric(css.fillOpacity);ctx.fill(path);}
   if(stroke){ctx.strokeStyle=stroke;ctx.globalAlpha=alpha*numeric(css.strokeOpacity);ctx.stroke(path);}
   if(stroke&&node.getAttribute('marker-end')?.includes('url')&&node.getTotalLength){
    const length=node.getTotalLength(),end=node.getPointAtLength(length),prev=node.getPointAtLength(Math.max(0,length-1));
    ctx.translate(end.x,end.y);ctx.rotate(Math.atan2(end.y-prev.y,end.x-prev.x));ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-6,-3);ctx.lineTo(-6,3);ctx.closePath();ctx.fillStyle=stroke;ctx.fill();
   }
  }finally{ctx.restore();}
 };
 ctx.save();
 try{ctx.translate(x,y);ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();ctx.scale(width/box[2],height/box[3]);ctx.translate(-box[0],-box[1]);visit(svg);}
 finally{ctx.restore();}
}
