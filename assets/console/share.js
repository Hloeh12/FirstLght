import {drawSvg} from './vector-canvas.js';
function wrap(ctx,value,width){
 const out=[];
 let line='';
 for(const c of value){
  if(ctx.measureText(line+c).width>width){out.push(line);line='';}
  line+=c;
 }
 if(line)out.push(line);
 return out;
}
function panel(g,x,y,w,h){
 const r=20;g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();
 const fill=g.createLinearGradient(x,y,x+w,y+h);fill.addColorStop(0,'rgba(255,255,255,.95)');fill.addColorStop(1,'rgba(255,234,244,.88)');
 g.shadowColor='#ff4f8b22';g.shadowBlur=18;g.shadowOffsetY=7;g.fillStyle=fill;g.fill();g.shadowBlur=0;g.shadowOffsetY=0;g.strokeStyle='#ffffff';g.lineWidth=1.5;g.stroke();
}
export async function shareChart(root,title){
 await document.fonts?.ready;
 const canvas=document.createElement('canvas'),g=canvas.getContext('2d');
 if(!g)throw Error('设备不支持画布导出');
 const w=720,pad=26,body=w-2*pad,board=root.querySelector('.zi-board'),wheel=root.querySelector('.wheel'),vedic=root.querySelector('.vedic-chart'),matrix=root.querySelector('.matrix');
 g.font='16px -apple-system,sans-serif';
 const pillarRows=matrix?[...matrix.querySelectorAll('.pillar')].map(p=>p.innerText.trim().split(/\n+/).flatMap(t=>wrap(g,t.trim(),body/4-14))):[];
 const visual=board?body*1.25:wheel||vedic?body:matrix?Math.max(...pillarRows.map(p=>p.length))*23+25:0;
 const selectors='.zi-detail p,.period-guidance p,.period-guidance dd,.vedic-period h3,.vedic-period p,.pair-reading h3,.pair-reading p,.orbit-info span,[data-instant-caption]';
 let info=[...root.querySelectorAll(selectors)].map(x=>x.innerText.trim().replace(/\s+/g,' ')).filter(Boolean);
 if(!info.length)info=[...root.querySelectorAll('.card h2,.card p,.grid-table tbody tr')].slice(0,14).map(x=>x.innerText.trim().replace(/\s+/g,' '));
 info=[...new Set(info)].slice(0,24);
 g.font='600 23px -apple-system,sans-serif';const heading=wrap(g,title.replace(/\s*▾$/,''),body);
 g.font='16px -apple-system,sans-serif';const lines=info.flatMap(x=>wrap(g,x,body-28)),header=90+heading.length*25;
 const height=header+visual+(visual?30:0)+lines.length*25+85;
 canvas.width=w*2;canvas.height=height*2;g.scale(2,2);
 const bg=g.createLinearGradient(0,0,w,height);bg.addColorStop(0,'#fff8fc');bg.addColorStop(.4,'#ffeaf4');bg.addColorStop(1,'#fff6fb');g.fillStyle=bg;g.fillRect(0,0,w,height);
 const text=(value,x,y,size,color='#793254',max=w-pad*2)=>{g.fillStyle=color;g.font='600 '+size+'px -apple-system,sans-serif';g.fillText(value,x,y,max);};
 text('FIRSTLGHT · 星谕初光',pad,34,15,'#bd3b76');
 heading.forEach((line,i)=>text(line,pad,66+i*25,23));let y=header;
 if(board){
  const cw=body/4,ch=visual/4;
  const cell=(x,t,width,h,color)=>{g.fillStyle=color;g.fillRect(x,t,width,h);g.strokeStyle='#e8bad2';g.strokeRect(x,t,width,h);};
  cell(pad+cw,y+ch,2*cw,2*ch,'#fff2f8');
  [...board.querySelector('.zi-center').children].slice(0,11).forEach((n,i)=>text(n.innerText.trim(),pad+cw+9,y+ch+23+i*24,13,'#80345d',cw*2-18));
  for(const p of board.querySelectorAll('[data-palace]')){
   const x=pad+(Number(p.style.gridColumn)-1)*cw,t=y+(Number(p.style.gridRow)-1)*ch;
   cell(x,t,cw,ch,p.classList.contains('selected')?'#ffe0ee':'#fffafd');
   [...p.querySelectorAll('.zi-star')].slice(0,7).forEach((n,i)=>text(n.innerText.trim().replace(/\s+/g,' '),x+6,t+19+i*18,12,'#a13d6a',cw-12));
   const footer=p.querySelector('footer');if(footer)wrap(g,footer.innerText.trim().replace(/\s+/g,' '),cw-12).slice(0,2).forEach((line,i)=>text(line,x+6,t+ch-28+i*16,11,'#873359',cw-12));
  }
  await drawSvg(g,board.querySelector('.zi-overlay'),pad,y,body,visual);y+=visual+26;
 }else if(wheel||vedic){await drawSvg(g,wheel||vedic,pad,y,body,visual);y+=visual+26;}
 else if(matrix){
  const cw=body/4;
  pillarRows.forEach((rows,i)=>{panel(g,pad+i*cw,y,cw-3,visual);rows.forEach((line,j)=>text(line,pad+i*cw+7,y+23+j*23,15,'#90365e',cw-17));});y+=visual+26;
 }
 if(lines.length){panel(g,pad,y-5,body,lines.length*25+24);for(const line of lines){text(line,pad+14,y+17,16);y+=25;}y+=30;}
 text('留一束初光，照见当下的自己',pad,height-20,13,'#a45c82');
 const native=window.webkit?.messageHandlers?.shareChart;
 if(native){native.postMessage(canvas.toDataURL('image/png'));return;}
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 if(!blob)throw Error('PNG 导出失败');
 const file=new File([blob],'FirstLight-chart.png',{type:'image/png'});
 if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file]});return;}catch(error){if(error.name==='AbortError')return;}}
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
