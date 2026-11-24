import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {baziPro} from '../src/bazi-pro.mjs';
import {composeFullReport} from '../assets/console/full-report.js';
import {classify,retrieve,answerHtml,presetQuestions,INTENTS} from '../assets/console/report-qa.js';
import {TOPICS,pickSections,topicHtml,topicDocument} from '../assets/console/topic-report.js';
import {exportHtmlDocument} from '../assets/console/report-export.js';

const BIRTH={Y:1987,M:2,D:14,h:10,mi:0,gender:'女',city:{lat:31.2,lon:121.5,tz:8}};

function fakeDocument(){
 return {sections:[
  {title:'一、命局格局总览',lines:['【性格】日主甲木身弱，喜用水木，性格温和而有韧性。']},
  {title:'三、事业专题解读',lines:['【事业】官星得位，适合文教、策划、文字相关行业；创业宜合伙。','【财富】财星入库，中年之后财势渐稳，忌投机。']},
  {title:'五、婚姻感情专题',lines:['【婚姻】配偶宫逢合，感情宜迟不宜早，相处以沟通为先。']},
  {title:'七、结论与建议',lines:['【建议】关键窗口在 2032 年前后，宜把握事业机会。']},
 ]};
}

test('report-qa: 意图分类命中领域',()=>{
 assert.equal(classify('我适合做什么行业').id,'career');
 assert.equal(classify('财运怎么样').id,'wealth');
 assert.equal(classify('哪一年是关键窗口').id,'timing');
 assert.equal(classify('性格有什么特点').id,'self');
});
test('report-qa: 检索返回带章节号的证据',()=>{
 const rep=fakeDocument();
 const hits=retrieve(rep,INTENTS.find(i=>i.id==='career'));
 assert.ok(hits.length>=1);
 assert.equal(hits[0].secNo,2);
 assert.ok(answerHtml(rep,'我适合什么行业').includes('data-qa-jump="2"'));
});
test('report-qa: 无命中时给换问法提示',()=>{
 assert.ok(answerHtml(fakeDocument(),'量子力学').includes('换个问法'));
});
test('report-qa: 预置问题按体系区分',()=>{
 assert.notEqual(JSON.stringify(presetQuestions('bazi')),JSON.stringify(presetQuestions('vedic')));
});
test('topic-report: 专题抽章重组且自包含',()=>{
 const rep={...fakeDocument(),cover:{name:'测试',system:'八字'},title:'全盘详批'};
 const t=TOPICS.find(x=>x.id==='career');
 const html=topicHtml(rep,t);
 assert.ok(html.includes('事业专题 · 测试'));
 assert.ok(topicDocument(rep,t).startsWith('<!DOCTYPE html>'));
 // 应包含事业章与结论章
 assert.ok(html.includes('适合文教'));
 assert.ok(html.includes('2032'));
});
test('topic-report: 财富专题不含婚姻章',()=>{
 const rep={...fakeDocument(),cover:{name:'测试',system:'八字'}};
 const html=topicHtml(rep,TOPICS.find(x=>x.id==='wealth'));
 assert.ok(html.includes('财星入库'));
 assert.ok(!html.includes('配偶宫'));
});
test('批次3模块已进 bundle',()=>{
 const js=readFileSync(new URL('../js/console.js',import.meta.url),'utf8');
 assert.ok(js.includes('data-rpt-qa')&&js.includes('data-rpt-topic'));
});
