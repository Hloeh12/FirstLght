'use strict';

async function shareChartImage(){
 const panel=document.querySelector('#resultsHost > .on');
 if(!chart||!panel)throw new Error('请先生成命盘');
 const grid=panel.querySelector('.zwgrid');
 const svg=panel.querySelector('svg');
 const canvas=document.createElement('canvas');
 const w=640,padding=24,board=w-2*padding;
 const details=grid?[...panel.querySelectorAll('#zwDetail p')].map(p=>p.textContent)
  :[...panel.querySelectorAll('.pillar-cards > div,.bazi-structure > p,.row')].slice(0,9).map(p=>p.innerText.trim().replace(/\n/g,' '));
 const hasVisual=grid||svg;
 const height=142+(hasVisual?board+20:0)+Math.max(1,details.length)*64;
 canvas.width=w*2;
 canvas.height=height*2;
 const ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('设备暂时无法生成画布');
 ctx.scale(2,2);
 const bg=ctx.createLinearGradient(0,0,w,height);
 bg.addColorStop(0,'#fff8fc');bg.addColorStop(1,'#f6e7fa');
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,height);
 const text=(value,x,y,size=15,weight=500,color='#472c40',maxWidth=w-2*padding)=>{
  ctx.fillStyle=color;
  ctx.font=weight+' '+size+'px -apple-system, system-ui, sans-serif';
  ctx.fillText(value,x,y,maxWidth);
 };
 text('FIRST LIGHT  ·  星谕命盘',padding,38,16,750,'#a53767');
 text(document.getElementById('readingSummary').textContent.replace(/^🌸\s*|\s*▾$/g,''),padding,75,25,750);
 const period=panel.querySelector('#zwFlowCaption')?.textContent;
 text(document.getElementById('overviewBtn').textContent.replace(/\s*▾$/,'')+(period?' · '+period:''),padding,104,15,600,'#805269');
 let y=125;
 if(grid){
  const step=board/4;
  const cellFill=(x,y,w,h,color)=>{
   ctx.fillStyle=color;
   ctx.fillRect(x+1,y+1,w-2,h-2);
   ctx.strokeStyle='#ead0df';
   ctx.strokeRect(x+1,y+1,w-2,h-2);
  };
  cellFill(padding+step,y+step,step*2,step*2,'#ffeaf5');
  const center=[...grid.querySelector('.zwcenter').children].map(n=>n.textContent).filter(Boolean);
  for(const [i,line] of center.entries())text(line,padding+step+16,y+step+38+i*33,i===1?24:15,i===1?800:600,'#723452',step*2-32);
  for(const cell of grid.querySelectorAll('.zwcell')){
   const x=padding+(Number(cell.style.gridColumn)-1)*step;
   const top=y+(Number(cell.style.gridRow)-1)*step;
   cellFill(x,top,step,step,cell.classList.contains('selected')?'#ffddec':cell.classList.contains('related')?'#fff0f7':'#fffbfe');
   text(cell.querySelector('.zw-h span').textContent,x+9,top+20,15,800,'#893354',step-45);
   text(cell.querySelector('.zw-h small').textContent,x+step-40,top+20,13,600,'#724d62',34);
   const stars=cell.querySelectorAll('.zw-star,.zw-borrow');
   for(const [i,star] of [...stars].slice(0,4).entries()){
    text(star.textContent.replace(/(生年|流)/g,' $1'),x+9,top+44+i*19,12,700,'#843b55',step-16);
   }
   const foot=cell.querySelector('.zw-foot');
   text([...foot.children].map(n=>n.textContent).join(' · '),x+9,top+step-10,13,700,'#6a4674',step-16);
  }
  const overlay=grid.querySelector('.zw-overlay');
  if(overlay?.childElementCount)await drawSvgImage(ctx,overlay,padding,y,board,board);
  y+=board+20;
 }else if(svg){
  await drawSvgImage(ctx,svg,padding,y,board,board);
  y+=board+20;
 }
 for(const entry of details){
  const lines=[];
  let line='';
  ctx.font='500 15px -apple-system, system-ui, sans-serif';
  for(const char of entry){
   if(ctx.measureText(line+char).width>board){lines.push(line);line='';}
   line+=char;
  }
  if(line)lines.push(line);
  for(const [i,part] of lines.slice(0,3).entries())text(part,padding,y+i*19);
  y+=Math.max(31,Math.min(3,lines.length)*19+8);
 }
 const native=window.webkit?.messageHandlers?.shareChart;
 if(native){
  native.postMessage(canvas.toDataURL('image/png'));
  return;
 }
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 if(!blob)throw new Error('无法导出 PNG');
 const file=new File([blob],'FirstLight-chart.png',{type:'image/png'});
 if(navigator.canShare?.({files:[file]})){
  try{await navigator.share({files:[file]});return;}
  catch(error){if(error.name==='AbortError')return;}
 }
 const link=document.createElement('a');
 const url=URL.createObjectURL(blob);
 link.href=url;link.download=file.name;link.click();
 setTimeout(()=>URL.revokeObjectURL(url),5000);
}

async function drawSvgImage(ctx,svg,x,y,width,height){
 const node=svg.cloneNode(true);
 node.setAttribute('width',width);
 node.setAttribute('height',height);
 node.removeAttribute('style');
 node.querySelectorAll('.triad-polygon').forEach(p=>{
  p.setAttribute('fill','#ff4f8b14');p.setAttribute('stroke','#df367b');p.setAttribute('stroke-width','1.2');
 });
 node.querySelectorAll('.opposition').forEach(p=>{
  p.setAttribute('fill','none');p.setAttribute('stroke','#df367b');p.setAttribute('stroke-dasharray','5 4');
 });
 node.querySelectorAll('.flying-arc').forEach(p=>{
  p.setAttribute('fill','none');p.setAttribute('stroke-width','1.7');
 });
 node.querySelectorAll('.flying-pill text').forEach(p=>{p.setAttribute('font-size','9');p.setAttribute('font-weight','700');});
 const markup=new XMLSerializer().serializeToString(node);
 const url=URL.createObjectURL(new Blob([markup],{type:'image/svg+xml;charset=utf-8'}));
 try{
  const image=new Image();
  await new Promise((resolve,reject)=>{
   image.onload=resolve;
   image.onerror=()=>reject(new Error('无法绘制盘面矢量层'));
   image.src=url;
  });
  ctx.drawImage(image,x,y,width,height);
 }finally{URL.revokeObjectURL(url);}
}
