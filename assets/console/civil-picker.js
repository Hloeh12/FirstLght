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
  picker.innerHTML='<summary>日期与时刻</summary><div class="liquid-glass civil-wheel-panel"><div class="spread"><button type="button" data-wheel-now>↺ 恢复当下</button><button type="button" data-wheel-apply class="primary">确定应用</button></div><div class="civil-wheels"></div></div>';
  anchor.after(picker);
  const summary=picker.querySelector('summary'),host=picker.querySelector('.civil-wheels');
  const outputs=new Map();
  for(const input of [date,clock].filter(Boolean)){
   const output=document.createElement('output');
   input.after(output);outputs.set(input,output);input.type='hidden';
  }
  const read=()=>{
   const now=localNowParams();
   const [dayText,timeText]=String(date?.value||'').split('T');
   const [Y,M,D]=dayText.split('-').map(Number);
   const [h,mi]=String(clock?.value||timeText||'').split(':').map(Number);
   return {Y:Y||now.Y,M:M||now.M,D:D||now.D,h:Number.isFinite(h)?h:now.h,mi:Number.isFinite(mi)?mi:now.mi};
  };
  const display=()=>{
   for(const [input,output] of outputs)output.textContent=input.value.replace('T',' ')||'尚未选定';
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
  const set=(value)=>{
   selected={...value,minute:value.h*60+value.mi};
   if(isLunar())selected.Y=Math.min(2100,Math.max(1900,selected.Y));
   draw();
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
