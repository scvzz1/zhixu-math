const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const BASE = require('./verify-baseline.cjs'); // 期望计数集中于此，补题后只改它
const {JSDOM}=require('jsdom');
const {spawnSync}=require('child_process');
const root=process.env.ZHIXU_ROOT?path.resolve(process.env.ZHIXU_ROOT):path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
scripts.forEach(s=>new vm.Script(s));
const coverage=html.slice(html.indexOf('function diagCoverageText()'),html.indexOf('function diagnosticQueue()'));
const render=html.slice(html.indexOf('function explanationHTML('),html.indexOf('function renderQuestionBank('));
const c={window:{}};vm.createContext(c);
for(const name of ['question-bank.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),c);
const bank=c.window.ZHIXU_BANK;
let passed=0;function check(label,fn){fn();passed++}
const ctx={bankError:null,bankQuestions:bank.questions,topics:bank.topics,knowledgePoints:bank.knowledgePoints,GENERAL_TOPIC_INDEX:8,store:{profile:null},SUBJECT_NAMES:{'math-1':'数学一','math-2':'数学二','math-3':'数学三'},effectiveTopic:q=>q.topic,kpKey:q=>q.kpId,kpCounts:()=>new Map(bank.knowledgePoints.map(k=>[k.id,bank.questions.filter(q=>q.kpId===k.id).length]))};
vm.createContext(ctx);vm.runInContext(coverage+render,ctx);
const summaries={};
for(const [subject,count,topics] of [['math-1',BASE.bySubject['math-1'],8],['math-2',BASE.bySubject['math-2'],6],['math-3',BASE.bySubject['math-3'],7]]){
ctx.store.profile={subject};const text=ctx.diagCoverageText();summaries[subject]=text;
check(subject+' 当前数量与适用章节',()=>{assert(text.includes(count+' 道'));assert(text.includes(topics+' 个专题'));assert(text.includes('全部适用专题均有可用题目'));assert(!text.includes('待补题'));assert(text.includes('待诊断'))});
}
ctx.store.profile=null;check('无档案全库口径',()=>assert(ctx.diagCoverageText().includes('题库可用 '+BASE.bySubject['math-1']+' 道')));
ctx.store.profile={subject:'math-1'};ctx.bankQuestions=bank.questions.filter(q=>q.topic!==6);check('适用章节缺题真实提示',()=>assert(ctx.diagCoverageText().includes('向量代数和空间解析几何」暂无可用题目，待补题后纳入短测')));
ctx.store.profile={subject:'math-3'};check('不考章节不误报',()=>assert(!ctx.diagCoverageText().includes('向量代数和空间解析几何')));
ctx.bankQuestions=[];check('空题库',()=>assert(ctx.diagCoverageText().includes('没有已审核题目')));
ctx.bankError='invalid';check('损坏题库',()=>assert(ctx.diagCoverageText().includes('题库加载失败')));
for(const q of bank.questions){const fixed=ctx.explanationHTML(q.explain);check(q.id+' 公式和步骤结构',()=>{for(const formula of fixed.match(/\$\$[\s\S]*?\$\$|\$(?:\\.|[^$])*?\$/g)||[])assert(!formula.includes('<'));const doc=new JSDOM(fixed).window.document;const expected=(q.explain.match(/class="solution-step"/g)||[]).length;assert.equal(doc.querySelectorAll('.solution>.solution-step').length,expected);assert(!doc.querySelector('.solution-step .solution-step'))})}
check('原有HTML标签保留',()=>assert.equal(ctx.explanationHTML('<b>依据</b> $a<b$'),'<b>依据</b> $a&lt;b$'));
check('圆括号与方括号公式',()=>assert.equal(ctx.explanationHTML(String.raw`\(a<b\) \[x>y\]`),String.raw`\(a&lt;b\) \[x&gt;y\]`));
check('三条解析展示路径接入',()=>assert.equal((html.match(/explanationHTML\(q.explain\)/g)||[]).length,3));
const result={passed,summaries,browser:[]};
if(process.argv.includes('--browser')){
const cli=process.env.AGENT_BROWSER_BIN||'agent-browser';
const entry=process.env.ZHIXU_URL||'http://127.0.0.1:8765/index.html';
function run(...args){const r=spawnSync(cli,['--session','ui-acceptance',...args],{encoding:'utf8',timeout:45000});if(r.status!==0)throw Error(r.stderr||r.stdout);return r.stdout.trim()}
try{
const launch=process.env.AGENT_BROWSER_EXECUTABLE_PATH?['--executable-path',process.env.AGENT_BROWSER_EXECUTABLE_PATH]:[];
run(...launch,'open',entry);
run('snapshot','-i');
for(const width of [320,375,760,1248]){
run('set','viewport',String(width),'960');
const js=`(async()=>{localStorage.removeItem('zhixu-study-v1');showPage('practice');const q=bankQuestions.find(q=>q.id==='calc-orig-t2-09');const fb=document.getElementById('feedback');if(MathJax.typesetClear)MathJax.typesetClear([fb]);fb.className='feedback show good';fb.innerHTML=explanationHTML(q.explain);await MathJax.startup.promise;await MathJax.typesetPromise([fb]);fitMath(fb);const steps=[...fb.querySelectorAll('.solution>.solution-step')];const wide=steps.filter(e=>e.scrollWidth>e.clientWidth+1||e.lastElementChild.scrollWidth>e.lastElementChild.clientWidth+1).map(e=>({text:e.textContent.slice(0,40),w:e.clientWidth,sw:e.scrollWidth,cw:e.lastElementChild.clientWidth,csw:e.lastElementChild.scrollWidth,html:e.lastElementChild.innerHTML}));return JSON.stringify({width:${width},steps:steps.length,nested:fb.querySelectorAll('.solution-step .solution-step').length,merror:fb.querySelectorAll('mjx-merror').length,math:fb.querySelectorAll('mjx-container').length,overflow:document.documentElement.scrollWidth>innerWidth+1,wide,raw:fb.innerText.includes('$I_2'),text:fb.innerText.includes('核对')})})()`;
const out=run('eval',js);const data=JSON.parse(JSON.parse(out));console.log(JSON.stringify(data));assert.equal(data.steps,6);assert.equal(data.nested,0);assert.equal(data.merror,0);assert(data.math>0);assert(!data.overflow);assert.equal(data.wide.length,0);assert(!data.raw);assert(data.text);result.browser.push(data);
if(width===375||width===1248)run('screenshot',path.join(__dirname,`ui-fix-${width}.png`));
}
const interaction=`(async()=>{const texts={};for(const subject of ['math-1','math-2','math-3']){store.profile={...PROFILE_DEFAULTS,subject};texts[subject]={text:diagCoverageText(),queue:diagnosticQueue().length}}beginPractice(['calc-orig-t2-09'],'界面验收');selected=questions[qPos].answer;submitAnswer();await MathJax.typesetPromise([document.getElementById('feedback')]);fitMath(document.getElementById('feedback'));return JSON.stringify({texts,phase,correct:document.getElementById('feedback').classList.contains('good'),steps:document.querySelectorAll('#feedback .solution>.solution-step').length,merror:document.querySelectorAll('#feedback mjx-merror').length})})()`;
const i=JSON.parse(JSON.parse(run('eval',interaction)));assert.equal(i.phase,'submitted');assert(i.correct);assert.equal(i.steps,6);assert.equal(i.merror,0);result.interaction=i;
result.browserErrors=run('errors');assert(!result.browserErrors);console.log('PASS Browser '+result.browser.length+' widths and submission');
}finally{run('close')}
}
fs.writeFileSync(path.join(__dirname,'ui-fix-results.json'),JSON.stringify(result,null,2));
console.log('Checks passed: '+passed);
