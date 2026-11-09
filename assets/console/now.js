const pad=n=>String(n).padStart(2,'0');
export function localNowParams(now=new Date(),city={}){
 const Y=now.getFullYear(),M=now.getMonth()+1,D=now.getDate(),h=now.getHours(),mi=now.getMinutes(),tz=-now.getTimezoneOffset()/60;
 return {name:'即刻天象',gender:'男',Y,M,D,h,mi,dateStr:[Y,pad(M),pad(D)].join('-'),timeStr:pad(h)+':'+pad(mi),calendar:'solar',useSolarTime:false,city:{label:'默认上海（未定位）',lat:31.23,lon:121.47,...city,tz,tzName:Intl.DateTimeFormat().resolvedOptions().timeZone},tz};
}

export function formatLocalDisplayTime({Y,M,D,h,mi}) {
 return [String(Y).padStart(4,'0'),pad(M),pad(D)].join('-')+' '+pad(h)+':'+pad(mi);
}
export function localDisplayTime(value) {
 const date=new Date(value);
 if(!Number.isFinite(+date))return '—';
 return formatLocalDisplayTime({Y:date.getFullYear(),M:date.getMonth()+1,D:date.getDate(),h:date.getHours(),mi:date.getMinutes()});
}
