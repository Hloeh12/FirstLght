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
async function drawSvg(ctx,svg,x,y,w,h){
 const copy=svg.cloneNode(true);
 copy.setAttribute('width',w);copy.setAttribute('height',h);
 copy.querySelectorAll('.zi-path').forEach(p=>{p.setAttribute('fill','none');p.setAttribute('stroke-width','1.65');});
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml'}));
 try{
  const image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('盘面矢量导出失败'));image.src=url;});
  ctx.drawImage(image,x,y,w,h);
 }finally{URL.revokeObjectURL(url);}
}
export async function shareChart(root,title){
 const canvas=document.createElement('canvas'),g=canvas.getContext('2d');
 if(!g)throw Error('设备不支持画布导出');
 const w=600,pad=20,body=w-2*pad,board=root.querySelector('.zi-board'),wheel=root.querySelector('.wheel');
 const visual=board?body*1.13:wheel?body:0;
 const info=[...root.querySelectorAll('.zi-detail p,.orbit-info span,.pillar,.matrix + article p,.card h2')].slice(0,16)
  .map(x=>x.innerText.trim().replace(/\s+/g,' ')).filter(Boolean);
 g.font='15px -apple-system,sans-serif';
 const lines=info.flatMap(x=>wrap(g,x,body));
 const height=142+visual+lines.length*23;
 canvas.width=w*2;canvas.height=height*2;g.scale(2,2);
 const bg=g.createLinearGradient(0,0,w,height);bg.addColorStop(0,'#fff6fb');bg.addColorStop(1,'#f3e7f6');
 g.fillStyle=bg;g.fillRect(0,0,w,height);
 const text=(value,x,y,size,color='#472c40',max=w-pad*2)=>{
  g.fillStyle=color;g.font='600 '+size+'px -apple-system,sans-serif';g.fillText(value,x,y,max);
 };
 text('FIRST LIGHT · 星谕',pad,32,14,'#a03d68');
 text(title.replace(/\s*▾$/,''),pad,66,24);
 let y=94;
 if(board){
  const cw=body/4,ch=visual/4;
  const cell=(x,t,width,h,color)=>{
   g.fillStyle=color;g.fillRect(x,t,width,h);g.strokeStyle='#d7b7cd';g.strokeRect(x,t,width,h);
  };
  cell(pad+cw,y+ch,2*cw,2*ch,'#fff2f8');
  [...board.querySelector('.zi-center').children].slice(0,10).forEach((n,i)=>text(n.innerText.trim(),pad+cw+9,y+ch+22+i*21,13,'#683755',cw*2-18));
  for(const p of board.querySelectorAll('[data-palace]')){
   const x=pad+(Number(p.style.gridColumn)-1)*cw,t=y+(Number(p.style.gridRow)-1)*ch;
   cell(x,t,cw,ch,p.classList.contains('selected')?'#f6d9e9':'#fffafd');
   const stars=[...p.querySelectorAll('.zi-star')].slice(0,5);
   stars.forEach((n,i)=>text(n.innerText.trim().replace(/\s+/g,' '),x+5,t+18+i*16,11,'#903651',cw-10));
   const borrowed=p.querySelector('.zi-sub');
   if(borrowed)text(borrowed.innerText.trim(),x+5,t+104,10,'#63526b',cw-10);
   text(p.querySelector('footer').innerText.trim().replace(/\s+/g,' '),x+5,t+ch-9,12,'#58415d',cw-10);
  }
  await drawSvg(g,board.querySelector('.zi-overlay'),pad,y,body,visual);
  y+=visual+20;
 }else if(wheel){await drawSvg(g,wheel,pad,y,body,visual);y+=visual+20;}
 for(const line of lines){text(line,pad,y,15);y+=23;}
 const native=window.webkit?.messageHandlers?.shareChart;
 if(native){native.postMessage(canvas.toDataURL('image/png'));return;}
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 if(!blob)throw Error('PNG 导出失败');
 const file=new File([blob],'FirstLight-chart.png',{type:'image/png'});
 if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file]});return;}catch(error){if(error.name==='AbortError')return;}}
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
