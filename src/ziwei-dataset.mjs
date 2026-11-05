import {DatabaseSync} from 'node:sqlite';
import {inflateSync} from 'node:zlib';
let database;
export function datasetReading({dateStr,timeIndex,gender}){
 if(!process.env.ZIWEI_DATASET_DB) return {available:false,reason:'dataset_not_configured'};
 database??=new DatabaseSync(process.env.ZIWEI_DATASET_DB,{readOnly:true});
 if(database.prepare("SELECT value FROM metadata WHERE key='complete'").get()?.value!=='true')throw new Error('Dataset import incomplete');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)||!Number.isInteger(timeIndex)||timeIndex<0||timeIndex>11||!['男','女'].includes(gender))throw new Error('Use corrected Gregorian date, hour branch index 0–11 and explicit gender');
 const key=`${dateStr}-${timeIndex}-${gender==='男'?'male':'female'}`;
 const row=database.prepare('SELECT payload FROM readings WHERE key=?').get(key);
 if(!row)return {available:false,reason:'outside_dataset_coverage',key};
 return {available:true,key,contentVersion:'ca268829f7a9',engineCompatibility:'not_yet_verified',source:'Renhuai123/ziwei-doushu · 王多鱼AI · CC BY 4.0',reading:JSON.parse(inflateSync(row.payload).toString('utf8'))};
}
