import {btn} from './ui.js';

const pad = value => String(value).padStart(2, '0');

export function installCivilPickers(sheet) {
 for (const input of sheet.querySelectorAll('input[type=date],input[type=time],input[type=datetime-local]')) {
  const type = input.type;
  const value = input.value;
  input.type = 'text';
  input.value = value;
  input.autocomplete = 'off';
  input.placeholder = {date:'YYYY-MM-DD',time:'HH:MM','datetime-local':'YYYY-MM-DD HH:MM'}[type];
  input.pattern = {date:'[0-9]{4}-[0-9]{2}-[0-9]{2}',time:'(?:[01][0-9]|2[0-3]):[0-5][0-9]','datetime-local':'[0-9]{4}-[0-9]{2}-[0-9]{2}[ T](?:[01][0-9]|2[0-3]):[0-5][0-9]'}[type];
  if (type !== 'date') continue;
  const label = input.closest('label');
  const wrap = document.createElement('div');
  wrap.className = 'civil-picker';
  label.before(wrap);
  wrap.append(label);
  const picker = document.createElement('details');
  picker.innerHTML = '<summary>选择日期</summary><div class="civil-calendar"></div>';
  wrap.append(picker);
  const host = picker.lastElementChild;
  let year, month;
  const draw = () => {
   const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
   const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
   const prefix = year + '-' + pad(month) + '-';
   host.innerHTML = '<div class="spread">' + btn('‹','data-month-step="-1" aria-label="上个月"') +
    '<b>' + year + '年' + month + '月</b>' + btn('›','data-month-step="1" aria-label="下个月"') +
    '</div><div class="civil-days">' + [...'日一二三四五六'].map(day=>'<small>'+day+'</small>').join('') +
    '<span></span>'.repeat(first) + Array.from({length:days},(_,i)=>btn(i+1,
      'data-day="'+(i+1)+'" aria-pressed="'+(input.value===prefix+pad(i+1))+'"')).join('')+'</div>';
  };
  picker.addEventListener('toggle', () => {
   if (!picker.open) return;
   input.blur();
   const [y,m] = input.value.split('-').map(Number);
   const today = new Date();
   year = y >= 100 && y <= 9999 ? y : today.getFullYear();
   month = m >= 1 && m <= 12 ? m : today.getMonth()+1;
   draw();
  });
  host.addEventListener('click', event => {
   const button = event.target.closest('button');
   if (!button) return;
   if (button.dataset.monthStep) {
    const date = new Date(Date.UTC(year, month - 1 + Number(button.dataset.monthStep), 1));
    if (date.getUTCFullYear() < 100 || date.getUTCFullYear() > 9999) return;
    year = date.getUTCFullYear();
    month = date.getUTCMonth() + 1;
    draw();
    host.querySelector('[data-month-step="'+button.dataset.monthStep+'"]')?.focus();
   } else if (button.dataset.day) {
    input.value = year + '-' + pad(month) + '-' + pad(button.dataset.day);
    input.dispatchEvent(new Event('change',{bubbles:true}));
    picker.open = false;
    picker.firstElementChild.focus();
   }
  });
 }
}
