import {LunarYear,Solar} from 'lunar-javascript';
import {formatLocalDisplayTime,localNowParams} from './now.js';

const rowHeight=36;
const numberRange=(first,last)=>Array.from({length:last-first+1},(_,i)=>first+i);
const pad=n=>String(n).padStart(2,'0');

export function installCivilPickers(sheet) {
 for(const form of sheet.querySelectorAll('form')){
  const date=form.querySelector('input[type=date],input[type=datetime-local]');
  const clock=form.querySelector('input[type=time]');
  if(!date&&!clock)continue;
  const combined=date?.type==='datetime-local';
  const anchor=(date||clock).closest('label');
  const picker=document.createElement('details');
  picker.className='civil-picker';
  // v0.84.0：滚轮选年月日太慢（年份列要滚上百行），面板顶部加「快速输入行」——
// 年/月/日/时/分 五个框可直接键入，回车即生效，滚轮降为次选方式。
picker.innerHTML='<summary>日期与时刻</summary><div class="liquid-glass civil-wheel-panel"><div class="spread"><button type="button" data-wheel-now>↺ 恢复当下</button><button type="button" data-wheel-apply class="primary">确定应用</button></div><div class="civil-quick" role="group" aria-label="直接输入日期与时刻"><label class="cq">年<input data-cq="Y" inputmode="numeric" maxlength="4" placeholder="1995"></label><label class="cq">月<input data-cq="M" inputmode="numeric" maxlength="2" placeholder="11"></label><label class="cq">日<input data-cq="D" inputmode="numeric" maxlength="2" placeholder="02"></label><label class="cq">时<input data-cq="h" inputmode="numeric" maxlength="2" placeholder="23"></label><label class="cq">分<input data-cq="mi" inputmode="numeric" maxlength="2" placeholder="40"></label></div><div class="civil-wheels"></div></div>';
  anchor.after(picker);
  const summary=picker.querySelector('summary'),host=picker.querySelector('.civil-wheels');
  const outputs=new Map();
  for(const input of [date,clock].filter(Boolean)){
   const output=document.createElement('output');
   input.after(output);outputs.set(input,output);
   input.classList.add('native-civil-input');
   input.removeAttribute('hidden');
  }
  const read=()=>{
   const now=localNowParams();
   const [dayText,timeText]=String(date?.value||'').split('T');
   const [Y,M,D]=dayText.split('-').map(Number);
   const [h,mi]=String(clock?.value||timeText||'').split(':').map(Number);
   return {Y:Y||now.Y,M:M||now.M,D:D||now.D,h:Number.isFinite(h)?h:now.h,mi:Number.isFinite(mi)?mi:now.mi};
  };
  const display=()=>{
   for(const [input,output] of outputs)output.textContent=input.value.replace('T',' ')||'未选择';
   summary.textContent=date&&!(clock||combined)?'选择日期':'选择日期与时刻';
  };
  display();
  let selected;
  const isLunar=()=>form.elements.calendar?.value==='lunar';
  const days=()=>{
   if(!isLunar())return new Date(selected.Y,selected.M,0).getDate();
   const year=LunarYear.fromYear(selected.Y);
   const leap=form.elements.leap;
   if(leap?.checked&&year.getLeapMonth()!==selected.M)leap.checked=false;
   return year.getMonth(leap?.checked?-selected.M:selected.M)?.getDayCount()||29;
  };
  const place=(column,index)=>{column.scrollTop=index*rowHeight;};
  function column(key,title,values,format=pad){
   const wrap=document.createElement('div');
   wrap.className='civil-wheel-column';
   const heading=document.createElement('b');heading.textContent=title;
   const list=document.createElement('div');
   list.className='civil-wheel';
   list.setAttribute('role','listbox');list.setAttribute('aria-label',title);
   list.dataset.wheel=key;
   let marked;
   const paint=()=>{
    marked?.setAttribute('aria-selected','false');
    marked=list.children[values.indexOf(selected[key])];
    marked?.setAttribute('aria-selected','true');
   };
   const commit=(index)=>{
    const value=values[index];
    if(value==null||selected[key]===value)return;
    selected[key]=value;paint();
    if(key==='Y'||key==='M'){
     selected.D=Math.min(selected.D,days());
     const old=host.querySelector('[data-wheel=D]');
     if(old){
      const replacement=column('D','日期',numberRange(1,days()));
      old.parentElement.replaceWith(replacement);
      place(replacement.lastElementChild,selected.D-1);
     }
    }
   };
   for(const [index,value] of values.entries()){
    const button=document.createElement('button');
    button.type='button';button.role='option';button.setAttribute('aria-selected','false');button.textContent=format(value);button.dataset.wheelValue=value;
    button.onclick=()=>{commit(index);place(list,index);};
    list.append(button);
   }
   let frame;
   list.addEventListener('scroll',()=>{
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{if(list.isConnected)commit(Math.round(list.scrollTop/rowHeight));});
   },{passive:true});
   wrap.append(heading,list);paint();
   return wrap;
  }
  const draw=()=>{
   selected.D=Math.min(selected.D,days());
   host.replaceChildren();
   if(date)host.append(column('Y','年份',isLunar()?numberRange(1900,2100):numberRange(Math.min(1800,selected.Y),Math.max(2200,selected.Y)),String),
    column('M','月份',numberRange(1,12)),column('D','日期',numberRange(1,days())));
   if(combined||clock&&!clock.disabled)host.append(column('minute','时辰',numberRange(0,1439),value=>pad(Math.floor(value/60))+':'+pad(value%60)));
   for(const list of host.querySelectorAll('[data-wheel]')){
    const index=[...list.children].findIndex(option=>option.getAttribute('aria-selected')==='true');
    if(index>=0)place(list,index);
   }
  };
// 快速输入行：只收数字，回车或失焦即写回滚轮状态并重绘，避免滚动上百行找年份。
const quickHost=picker.querySelector('.civil-quick');
function paintQuick(){for(const f of quickHost.querySelectorAll('input'))f.value=String(selected?.[f.dataset.cq]??'');}
const applyQuick=()=>{
 const n=(f,max)=>{const v=Number(String(f.value).trim());return Number.isFinite(v)&&v>=0&&v<=max?Math.round(v):null;};
 const y=n(quickHost.querySelector('[data-cq=Y]'),9999),m=n(quickHost.querySelector('[data-cq=M]'),12),d=n(quickHost.querySelector('[data-cq=D]'),31),
  h=n(quickHost.querySelector('[data-cq=h]'),23),mi=n(quickHost.querySelector('[data-cq=mi]'),59);
 if(y==null||m==null||d==null||h==null||mi==null)return;
 selected={...selected,Y:y,M:m,D:d,h,mi};
 selected.minute=h*60+mi;
 if(isLunar())selected.Y=Math.min(2100,Math.max(1900,selected.Y));
 draw();
};
for(const f of quickHost.querySelectorAll('input')){
 f.addEventListener('input',()=>{f.value=f.value.replace(/[^\d]/g,'');});
 f.addEventListener('change',applyQuick);
 f.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyQuick();f.blur();}});
}
const set=(value)=>{
 selected={...value,minute:value.h*60+value.mi};
 if(isLunar())selected.Y=Math.min(2100,Math.max(1900,selected.Y));
 draw();
 paintQuick();
};
  picker.addEventListener('toggle',()=>{if(picker.open)set(read());});
  picker.querySelector('[data-wheel-now]').onclick=()=>{
   const now=localNowParams();
   if(!isLunar()){set(now);return;}
   const lunar=Solar.fromYmd(now.Y,now.M,now.D).getLunar();
   const month=lunar.getMonth();
   if(form.elements.leap)form.elements.leap.checked=month<0;
   set({...now,Y:lunar.getYear(),M:Math.abs(month),D:lunar.getDay()});
  };
  picker.querySelector('[data-wheel-apply]').onclick=()=>{
   for(const list of host.querySelectorAll('[data-wheel]')){
    const option=list.children[Math.round(list.scrollTop/rowHeight)];
    if(option)selected[list.dataset.wheel]=Number(option.dataset.wheelValue);
   }
   selected.D=Math.min(selected.D,days());
   const value=formatLocalDisplayTime({...selected,h:Math.floor(selected.minute/60),mi:selected.minute%60});
   if(date)date.value=combined?value.replace(' ','T'):value.slice(0,10);
   if(clock&&!clock.disabled)clock.value=value.slice(11);
   display();picker.open=false;
   if(form.hasAttribute('data-wheel-submit'))form.requestSubmit();else summary.focus();
  };
  form.elements.calendar?.addEventListener('change',()=>{if(picker.open)set(read());});
  form.elements.leap?.addEventListener('change',()=>{if(picker.open)draw();});
  form.elements.unknown?.addEventListener('change',()=>{if(picker.open)set(read());});
  if(form.hasAttribute('data-wheel-submit'))picker.open=true;
 }
}
