/* 时区数据库支持：使用 Node 内置 ICU（Intl）读取历史夏令时规则。
 * 输入 IANA 名称（如 Asia/Shanghai），输出该瞬间的 UTC 偏移分钟数。 */
const cache=new Map();
export function validZone(tz){
 try{ new Intl.DateTimeFormat('en-US',{timeZone:tz}); return true; }catch(e){ return false; }
}
export function offsetMinutes(utcMs,tz){
 const d=new Date(utcMs);
 const fmt=new Intl.DateTimeFormat('en-US',{timeZone:tz,timeZoneName:'longOffset'});
 const part=fmt.formatToParts(d).find(p=>p.type==='timeZoneName');
 const m=/GMT([+-])(\d{2}):(\d{2})/.exec(part?part.value:'GMT+00:00');
 if(!m)return 0;
 const sign=m[1]==='-'?-1:1;
 return sign*(Number(m[2])*60+Number(m[3]));
}
export function localToUtc({Y,M,D,h=0,mi=0},tz){
 if(!validZone(tz))throw new Error('未知时区：'+tz);
 const wall=Date.UTC(Y,M-1,D,h,mi);
 let guess=wall-offsetMinutes(wall,tz)*60000;
 for(let i=0;i<3;i++){
  const off=offsetMinutes(guess,tz);
  const next=wall-off*60000;
  if(next===guess)break;
  guess=next;
 }
 return {utc:new Date(guess),offsetMin:offsetMinutes(guess,tz)};
}
export function offsetLabel(utcMs,tz){const o=offsetMinutes(utcMs,tz);const s=o<0?'-':'+';const a=Math.abs(o);return `UTC${s}${String(Math.floor(a/60)).padStart(2,'0')}:${String(a%60).padStart(2,'0')}`;}
