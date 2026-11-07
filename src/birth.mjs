import {localToUtc} from './tz.mjs';
// PRC notices / IANA asia: all transitions at 02:00 local clock.
// 1988-04-10 is retained only as an explicitly selected non-official compatibility rule.
export const CHINA_DST=[[1986,5,4,9,14],[1987,4,12,9,13],[1988,4,17,9,11],[1989,4,16,9,17],[1990,4,15,9,16],[1991,4,14,9,15]];
export function chinaDstState({Y,M,D,h=12,mi=0},rule='iana'){
 const row=CHINA_DST.find(x=>x[0]===Y);
 if(!row)return {applied:false,warning:null,rule};
 const [,sm,sd,em,ed]=row,wall=Date.UTC(Y,M-1,D,h,mi);
 const start=Date.UTC(Y,sm-1,Y===1988&&rule==='compat-apr10'?10:sd,2),end=Date.UTC(Y,em-1,ed,2);
 if(wall>=start&&wall<start+3600000)throw Error('该钟表时刻处于夏令时跳时的 02:00–02:59，不存在；请核对出生记录。');
 const fold=wall>=end-3600000&&wall<end;
 return {applied:wall>=start+3600000&&wall<end&&!fold,warning:fold?'夏令时结束日 01:00–01:59 重复；本盘按第二次出现的标准时起盘。':null,rule};
}
export function inChinaDST(Y,M,D,h=12,mi=0,rule='iana'){return chinaDstState({Y,M,D,h,mi},rule).applied;}
export function resolveBirthTime({Y,M,D,h=12,mi=0,city={},dst1988Rule='iana'}){
 const tz=Number(city.tz??8),lon=Number(city.lon),tzName=city.tzName;
 const china=tzName==='Asia/Shanghai'||tzName==='Asia/Chongqing'||!tzName&&tz===8&&lon>=73&&lon<=136;
 let utc,offsetMin,state={applied:false,warning:null,rule:dst1988Rule};
 if(china&&Y>=1986&&Y<=1991){
  state=chinaDstState({Y,M,D,h,mi},dst1988Rule);offsetMin=480+(state.applied?60:0);
  utc=new Date(Date.UTC(Y,M-1,D,h,mi)-offsetMin*60000);
 }else if(tzName){const r=localToUtc({Y,M,D,h,mi},tzName);utc=r.utc;offsetMin=r.offsetMin;}
 else{offsetMin=tz*60;utc=new Date(Date.UTC(Y,M-1,D,h,mi)-offsetMin*60000);}
 const standard=new Date(Date.UTC(Y,M-1,D,h,mi)-(state.applied?3600000:0));
 return {utc,offsetMin,standard:{Y:standard.getUTCFullYear(),M:standard.getUTCMonth()+1,D:standard.getUTCDate(),h:standard.getUTCHours(),mi:standard.getUTCMinutes()},dstApplied:state.applied,warning:state.warning,dstRule:state.rule};
}
const doy=(Y,M,D)=>Math.floor((Date.UTC(Y,M-1,D)-Date.UTC(Y,0,1))/86400000)+1;
export function equationOfTimeMinutes(Y,M,D){const B=2*Math.PI*(doy(Y,M,D)-81)/364;return 9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);}
export function timeIndexFromMinutes(min){if(min<60)return 0;if(min>=1380)return 12;return Math.floor((min-60)/120)+1;}
const pad=n=>String(n).padStart(2,'0');
// Legacy callers share the exact same civil-time resolver as all professional charts.
export function birthCorrections(o){
 const r=resolveBirthTime({...o,city:o.city??{tz:o.tz,lon:o.lon,tzName:o.tzName}}),s=r.standard;
 const tz=Number(o.tz??o.city?.tz??8),lon=Number(o.lon??o.city?.lon),std=s.h*60+s.mi;
 const eot=o.useSolarTime?equationOfTimeMinutes(s.Y,s.M,s.D):null,lonMin=o.useSolarTime?(lon-tz*15)*4:null;
 const solarMin=std+(lonMin??0)+(eot??0),sMin=((solarMin%1440)+1440)%1440;
 return {utcDate:r.utc,solar:{minutes:sMin,timeIndex:timeIndexFromMinutes(sMin),clock:`${pad(Math.floor(sMin/60))}:${pad(Math.floor(sMin%60))}`},meta:{dstApplied:r.dstApplied,dstRule:r.dstRule,warning:r.warning,solarApplied:!!o.useSolarTime,eotMin:eot,lonOffsetMin:lonMin,standardClock:`${pad(s.h)}:${pad(s.mi)}`,note:r.dstApplied?'夏令时-1h':null}};
}
