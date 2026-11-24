function naming(ctx){
 const birth=ctx.birth;
 ctx.host.innerHTML=`<div class="naming-view">
  <h3>八字起名</h3>
  <p class="thin">基于当前案例的排盘喜用神，从内置字库中挑选候选名（五行喜用匹配 · 三才五格 · 生肖宜忌 · 音律 · 寓意）。</p>
  <div class="spread" style="gap:.6rem;flex-wrap:wrap">
   <label>姓氏 <input data-nm-surname placeholder="李" style="max-width:6rem"></label>
   <label>性别 <select data-nm-gender><option>男</option><option>女</option></select></label>
   ${btn('生成候选名','data-nm-go')}
  </div>
  <div data-nm-status role="status"></div>
  <div data-nm-results></div>
 </div>`;
 const go=$('[data-nm-go]',ctx.root);
 if(!go)return;
 go.onclick=async()=>{
  const surname=($('[data-nm-surname]',ctx.root)?.value||'').trim()||'李';
  const gender=$('[data-nm-gender]',ctx.root)?.value||'男';
  const status=$('[data-nm-status]',ctx.root),out=$('[data-nm-results]',ctx.root);
  if(!birth||!birth.Y){status.textContent='请先在出生资料中填写生日，再使用起名。';return;}
  status.textContent='正在计算…';
  try{
   const r=await ctx.request('/api/console/naming',{surname,gender,birth});
   status.textContent=`喜用神：${r.useful.join('、')}（忌${r.caution.join('、')}）· 年支${r.zodiac}`;
   out.innerHTML=r.list.map((x,i)=>`<article class="card"><h4>${i+1}. ${esc(x.name)} <small>${esc(x.pinyin)} · ${x.total} 分</small></h4>
    <p class="thin">五行 ${x.dims.element} · 五格 ${x.dims.wuge} · 生肖 ${x.dims.zodiac} · 音律 ${x.dims.phonology} · 寓意 ${x.dims.meaning}</p>
    ${x.reasons.map(s=>`<p>· ${esc(s)}</p>`).join('')}</article>`).join('');
  }catch(e){status.textContent='起名失败：'+e.message;}
 };
}
export {naming};
