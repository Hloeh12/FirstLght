/* 出生时刻校正：中国 1986–1991 夏令时、真太阳时（经度修正 + 均时差）。
 * 规则依据公开客户端注释：真太阳时只用于紫微时辰索引，不改变西方/印度盘的天文 UTC。 */
const DST=[[1986,5,4,9,14],[1987,4,12,9,13],[1988,4,10,9,11],[1989,4,16,9,17],[1990,4,15,9,16],[1991,4,14,9,15]];
const doy=(Y,M,D)=>Math.floor((Date.UTC(Y,M-1,D)-Date.UTC(Y,0,1))/86400000)+1;
export function inChinaDST(Y,M,D){for(const w of DST)if(Y===w[0]&&doy(Y,M,D)>=doy(w[0],w[1],w[2])&&doy(Y,M,D)<=doy(w[0],w[3],w[4]))return true;return false;}
export function equationOfTimeMinutes(Y,M,D){const B=2*Math.PI*(doy(Y,M,D)-81)/364;return 9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);}
export function timeIndexFromMinutes(min){if(min<60)return 0;if(min>=1380)return 12;return Math.floor((min-60)/120)+1;}
const pad=n=>String(n).padStart(2,'0');
export function birthCorrections(o){
 const tz=Number(o.tz)||0,lon=Number(o.lon)||0,useSolar=!!o.useSolarTime;
 let Y=o.Y,M=o.M,D=o.D;
 const wall=(Number(o.h)||0)*60+(Number(o.mi)||0);
 const dstApplied=tz===8&&lon>=73&&lon<=136&&inChinaDST(Y,M,D);
 let std=wall-(dstApplied?60:0);
 if(std<0){std+=1440;const d0=new Date(Date.UTC(Y,M-1,D)-86400000);Y=d0.getUTCFullYear();M=d0.getUTCMonth()+1;D=d0.getUTCDate();}
 const utcDate=new Date(Date.UTC(Y,M-1,D,Math.floor(std/60),std%60)-tz*3600000);
 let solarMin=std,eot=null,lonMin=null;
 if(useSolar){eot=equationOfTimeMinutes(Y,M,D);lonMin=(lon-tz*15)*4;solarMin=std+lonMin+eot;}
 const shift=Math.floor(solarMin/1440),sMin=solarMin-shift*1440;
 return {utcDate,solar:{minutes:sMin,timeIndex:timeIndexFromMinutes(sMin),clock:`${pad(Math.floor(sMin/60))}:${pad(Math.round(sMin%60))}`},meta:{dstApplied,solarApplied:useSolar,eotMin:eot==null?null:Math.round(eot*10)/10,lonOffsetMin:lonMin==null?null:Math.round(lonMin*10)/10,standardClock:`${pad(Math.floor(std/60))}:${pad(std%60)}`,note:dstApplied?'已按 1986–1991 中国夏令时校正':null}};
}
