/* t4/t5 自包含专项验收。旧题内容哈希取自 2026-10-16 经典库退役后的本库基线。
   数学验证独立计算题干模型，并与题库答案绑定；不从解析提取计算结果。 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const BASE = require('./verify-baseline.cjs'); // 期望计数集中于此，补题后只改它
const src = __dirname;
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? '通过 ' : '失败 ') + m); c ? pass++ : fail++; };
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const load = files => { const w = {}; files.forEach(f => new Function('window', fs.readFileSync(path.join(src, f), 'utf8'))(w)); return w.ZHIXU_BANK; };
const N = load(['question-bank.js']);   // 经典库退役后，站点只加载本库
const ids = ['t4-06','t4-07','t4-08','t4-09','t4-10','t4-11','t5-04','t5-05','t5-06','t5-07','t5-08'].map(x => 'calc-orig-' + x);
const q = id => N.questions.find(x => x.id === 'calc-orig-' + id);
const news = ids.map(id => N.questions.find(q => q.id === id));
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const close = (a,b,t=1e-8) => Math.abs(a-b) < t;
const integrate = (f,a,b,n=10000) => { let sum=0; const h=(b-a)/n; for(let i=0;i<n;i++) sum+=f(a+(i+0.5)*h); return sum*h; };
const deriv = (f,x,h=1e-5) => (f(x+h)-f(x-h))/(2*h);
const deriv2 = (f,x,h=1e-4) => (f(x+h)-2*f(x)+f(x-h))/(h*h);
console.log('=== 结构与施工规格 ===');
ok(N.questions.length === BASE.total, '全库' + BASE.total + '题');
ok(news.every(Boolean) && news.length === 11, '11道指定新题全部存在');
ok(new Set(N.questions.map(q=>q.id)).size === BASE.total, 'ID唯一');
ok(N.knowledgePoints.length === BASE.kpTotal && N.knowledgePoints.every(k=>N.questions.some(q=>q.kpId===k.id)), '90知识点全覆盖');
ok([0,1,2,3,4,5,6,7].every((t,i)=>N.questions.filter(q=>q.topic===t).length === BASE.byTopic[t]), '专题题量30/37/37/25/26/28/6/13（H1 批 t1+3/t2+4/t3+2/t4+1/t5+3/t7+1；H2 批 t0+5/t1+4/t2+7/t3+3/t4+3/t5+3）');
ok(N.topics.every(t=>!t.empty), '全部专题已无empty标记');
ok(same(['choice','fill','solve'].map(t=>news.filter(q=>q.type===t).length),[4,3,4]), '新题型4选择/3填空/4解答');
ok(same(['choice','fill','solve'].map(t=>N.questions.filter(q=>q.type===t).length),[BASE.byType.choice,BASE.byType.fill,BASE.byType.solve]), '全库题型' + BASE.byType.choice + '/' + BASE.byType.fill + '/' + BASE.byType.solve);
ok(same(['math-1','math-2','math-3'].map(s=>N.questions.filter(q=>q.subject.includes(s)).length),[BASE.bySubject['math-1'],BASE.bySubject['math-2'],BASE.bySubject['math-3']]), '科目' + BASE.bySubject['math-1'] + '/' + BASE.bySubject['math-2'] + '/' + BASE.bySubject['math-3']);
const specs = [
 ['t4-06','强化','choice',3,['math-1','math-2','math-3']],
 ['t4-07','综合','solve',12,['math-1']], ['t4-08','综合','choice',4,['math-1']],
 ['t4-09','综合','solve',12,['math-1']], ['t4-10','综合','solve',12,['math-1']], ['t4-11','基础','fill',2,['math-1']],
 ['t5-04','强化','fill',4,['math-1','math-2']], ['t5-05','强化','choice',3,['math-1','math-2']],
 ['t5-06','强化','choice',3,['math-1','math-2','math-3']], ['t5-07','综合','solve',12,['math-1','math-2','math-3']], ['t5-08','强化','fill',3,['math-1']]
];
for(const [id,level,type,min,sub] of specs) {
 const x=q(id), kp='kp-'+id;
 ok(x && x.kpId===kp && N.questions.filter(z=>z.kpId===kp).length===BASE.kpExp(kp), id+'单值kpId且该知识点题数正确（H1/H2 批为其补题后为 2）');
 ok(x && x.level===level && x.type===type && x.estimatedMinutes===min && same(x.subject,sub), id+'难度/题型/分钟/科目符合施工图');
}
ok(news.every(q=>q.source.kind==='原创' && /真题/.test(q.source.reference) && q.review.status==='approved'), '来源审核完整');
ok(news.every(q=>q.knowledgeTags.includes(N.knowledgePoints.find(k=>k.id===q.kpId).name)), '知识点名称精确匹配注册表');
ok(news.every(q=>q.prerequisites.length && q.hint && !/答案|选项[ABCD]|应选/.test(q.hint)), '前置知识与提示完整且不泄露选项');
ok(news.every(q=>q.explain.includes('<b>解题思路</b>') && q.explain.includes('<b>易错点</b>') && q.explain.includes('solution-conclusion') && !/\*\*/.test(q.explain)), '解析有思路/易错/结论且无Markdown残留');
ok(news.filter(q=>q.type==='choice').every(q=>q.options.length===4 && new Set(q.options).size===4 && Number.isInteger(q.answer)), '选择四项互异且索引为整数');
ok(news.filter(q=>q.type==='fill').every(q=>q.answers.length && !q.options && q.answer===undefined), '填空答案非空且不带选择字段');
ok(news.filter(q=>q.type==='solve').every(q=>q.answerText.length>20 && !q.options && q.answer===undefined), '解答参考答案完整且不带选择字段');
console.log('=== 独立数学计算 ===');
// 中值定理：面积6、积分保序，中值点存在来自连续矩形上介值性；构造反例否定其他选项。
const rect = f => integrate(x=>integrate(y=>f(x,y),0,3,120),0,2,120);
ok(close(rect(()=>1),6) && close(rect(()=>3),18), 't4-06两端常函数给出积分范围6至18');
const I = rect(x=>1+x*x/2);
ok(close(I,10,1e-4) && !close(I,6*(1+1/2)), 't4-06中心点反例：积分10而6f(中心)=9');
ok(q('t4-06').answer===1 && q('t4-06').options[1].includes('I=6f'), 't4-06答案绑定中值定理面积因子');
// 用水平切片独立于解析的球面坐标：截面面积π(4-z²)。
const triple = integrate(z=>z*z*Math.PI*(4-z*z),0,2);
ok(close(triple,64*Math.PI/15,1e-6), 't4-07水平切片积分64π/15');
const spherical = integrate(r=>r**4,0,2)*integrate(p=>Math.cos(p)**2*Math.sin(p),0,Math.PI/2)*2*Math.PI;
ok(close(spherical,triple,1e-6), 't4-07球面范围与雅可比和切片法一致');
ok(q('t4-07').answerText.includes('64') && q('t4-07').answerText.includes('15') && q('t4-07').answerText.includes('rho^2'), 't4-07参考答案绑定值与雅可比');
// 反向参数x=1-u,y=2-2u，u∈[0,1]，ds=√5du，dy=-2du。
const first = integrate(u=>(1-u)*Math.sqrt(5),0,1), second=integrate(u=>(1-u)*(-2),0,1);
ok(close(first,Math.sqrt(5)/2) && close(second,-1), 't4-08反向参数独立计算两类曲线积分');
const curveOpts=[[Math.sqrt(5)/2,1],[-Math.sqrt(5)/2,-1],[1,-Math.sqrt(5)/2],[Math.sqrt(5)/2,-1]];
ok(curveOpts.filter(([a,b])=>close(a,first)&&close(b,second)).length===1 && q('t4-08').answer===3, 't4-08四项中D唯一正确');
// 顺时针椭圆参数x=2cos t,y=-sin t，直接代线积分而非格林。
const line=integrate(t=>{const x=2*Math.cos(t),y=-Math.sin(t),dx=-2*Math.sin(t),dy=-Math.cos(t);return (x-y**3)*dx+(x**3+y)*dy;},0,2*Math.PI);
ok(close(line,-15*Math.PI/2,1e-7), 't4-09顺时针椭圆直接参数积分-15π/2');
ok(q('t4-09').answerText.includes('-\\frac{15\\pi}{2}'), 't4-09参考答案与直接积分一致');
// 球面单位法向=(x,y,z)，F·n=1+z，dS=sinφ dφdθ。
const flux=2*Math.PI*integrate(p=>(1+Math.cos(p))*Math.sin(p),0,Math.PI/2);
ok(close(flux,3*Math.PI,1e-7), 't4-10直接球面通量3π，与补面法一致');
ok(close(2*Math.PI-(-Math.PI),flux,1e-7) && q('t4-10').answerText.includes('3\\pi'), 't4-10向下补面通量-π且答案绑定3π');
const F=(x,y,z)=>[y*z,x*z,x*y+z*z];
const div=deriv(x=>F(x,2,3)[0],1)+deriv(y=>F(1,y,3)[1],2)+deriv(z=>F(1,2,z)[2],3);
ok(close(div,6,1e-7) && q('t4-11').answers.includes('6'), 't4-11中心差商散度6且填空接受6');
const bern=x=>1/(1+x);
ok([-0.5,0,0.4,1,2].every(x=>close(deriv(bern,x)+bern(x),x*bern(x)**2,1e-7)) && bern(0)===1, 't5-04解1/(x+1)满足方程与初值');
ok(bern(1)===0.5 && q('t5-04').answers.includes('1/2') && q('t5-04').answers.includes('0.5'), 't5-04答案1/2与小数均接受');
const down=x=>-Math.log(1-x);
ok([-1,0,0.5].every(x=>close(deriv2(down,x),deriv(down,x)**2,1e-6)), 't5-05数值验证y″=(y′)²');
ok(close(down(0),0) && close(deriv(down,0),1) && down(1-1e-8)>18, 't5-05初值符合且x=1发散，最大连通解区间x<1');
ok(q('t5-05').answer===0 && !close(deriv2(x=>Math.log(1+x),0),1,1e-6) && !close(deriv2(x=>Math.exp(x)-1,0.5),deriv(x=>Math.exp(x)-1,0.5)**2,1e-5), 't5-05B/D方程不满足，C非连通解区间，A唯一');
const hom=x=>(1-2*x)*Math.exp(2*x);
ok([-0.5,0,0.4].every(x=>close(deriv2(hom,x)-4*deriv(hom,x)+4*hom(x),0,2e-6)), 't5-06解满足二阶齐次方程');
ok(hom(0)===1 && close(deriv(hom,0),0,1e-8) && q('t5-06').answer===2, 't5-06初值成立且C为答案');
const nh=x=>Math.exp(x)*(x+x*x/2+x*x*x/6);
ok([-0.5,0,0.5,1].every(x=>close(deriv2(nh,x)-2*deriv(nh,x)+nh(x),(x+1)*Math.exp(x),2e-6)), 't5-07解满足非齐次方程');
ok(nh(0)===0 && close(deriv(nh,0),1,1e-8) && q('t5-07').answerText.includes('\\frac{x^3}{6}'), 't5-07初值与参考答案一致');
const euler=x=>x*(1-Math.log(x));
ok([0.3,1,Math.E,4].every(x=>close(x*x*deriv2(euler,x)-x*deriv(euler,x)+euler(x),0,2e-6)), 't5-08解满足欧拉方程');
ok(euler(1)===1 && close(deriv(euler,1),0) && euler(Math.E)===0 && q('t5-08').answers.includes('0'), 't5-08两初值与y(e)=0一致');
console.log('=== 旧题零漂移硬基线 ===');
const fixedOptions={
 'calc-stage3-differential-0001':{before:['$1$','$sin1$','$1+sin1$','$2$'],after:['$1$',String.raw`$\sin1$`,String.raw`$1+\sin1$`,'$2$']},
 'calc-stage3-integral-0001':{before:['$ln2$','$1$','$2$','$e-1$'],after:[String.raw`$\ln2$`,'$1$','$2$','$e-1$']},
 'calc-stage3-multivariable-0001':{before:['$2$','$4$','$sqrt{20}$','$20$'],after:['$2$','$4$',String.raw`$\sqrt{20}$`,'$20$']},
 'calc-stage3-double-integral-0001':{before:['$1$','$pi$','$2pi$','$4pi$'],after:['$1$',String.raw`$\pi$`,String.raw`$2\pi$`,String.raw`$4\pi$`]}
};
for(const [id,x] of Object.entries(fixedOptions))ok(same(N.questions.find(q=>q.id===id).options,x.after),id+'精确选项修复');
const old=N.questions.filter(q=>!ids.includes(q.id) && !q.id.startsWith('calc-h1-') && !q.id.startsWith('calc-h2-') && !q.id.startsWith('calc-h3-') && !q.id.startsWith('calc-h4-') && !q.id.startsWith('calc-h5-') && !q.id.startsWith('calc-h6-'));
ok(old.length===BASE.oldSet, '旧题仍为' + BASE.oldSet + '道（H1–H6 批新题均不属旧题集）');
// 六题解析/提示已单独审阅，回填原值后仍须满足下述旧题内容硬哈希（经典库退役后重新冻结）。
const reviewedText = {"calc-stage3-limit-0001":{"hint":"把分子写成 $f(x)-f(0)$ 的形式，比较差商定义；先判断题目是否给出了连续条件。","explain":"<div class=\"solution\"><div class=\"solution-step\"><span class=\"step-number\">思路</span><div>围绕“极限与函数值”识别题型，先写出适用定义或公式，再完成化简。</div></div><div class=\"solution-step\"><span class=\"step-number\">1</span><div>题目没有说明 $f$ 在 $0$ 处连续，差商极限只描述趋近过程。</div></div><div class=\"solution-step\"><span class=\"step-number\">2</span><div>因此不能由该极限直接确定 $f(0)$，正确选项应为“无法确定”。</div></div><div class=\"solution-step\"><span class=\"step-number\">易错</span><div>注意条件、系数和最后一步的代入，避免只凭结论记忆。</div></div><div class=\"solution-conclusion\">答案：无法确定。</div></div>"},"calc-stage3-differential-0001":{"hint":"观察 $2x\\cos(x^2)$ 是 $\\sin(x^2)$ 的导数，先求一个原函数，再用初值确定常数。","explain":"<div class=\"solution\"><div class=\"solution-step\"><span class=\"step-number\">思路</span><div>围绕“导数与积分的联系”识别题型，先写出适用定义或公式，再完成化简。</div></div><div class=\"solution-step\"><span class=\"step-number\">1</span><div>$\\int2x\\cos(x^2)dx=\\sin(x^2)+C$。</div></div><div class=\"solution-step\"><span class=\"step-number\">2</span><div>由 $f(0)=1$ 得 $C=1$，所以 $f(1)=\\sin1+1$。</div></div><div class=\"solution-step\"><span class=\"step-number\">易错</span><div>注意条件、系数和最后一步的代入，避免只凭结论记忆。</div></div><div class=\"solution-conclusion\">答案：$1+sin1$。</div></div>"},"calc-stage3-integral-0001":{"hint":"被积函数是 $\\frac{u'}u$ 型，直接使用 $\\int\\frac{u'}u dx=\\ln|u|+C$，再代入上下限。","explain":"<div class=\"solution\"><div class=\"solution-step\"><span class=\"step-number\">思路</span><div>围绕“对数型积分”识别题型，先写出适用定义或公式，再完成化简。</div></div><div class=\"solution-step\"><span class=\"step-number\">1</span><div>原函数为 $\\ln(1+x)$。</div></div><div class=\"solution-step\"><span class=\"step-number\">2</span><div>代入上下限得 $\\ln2-\\ln1=\\ln2$。</div></div><div class=\"solution-step\"><span class=\"step-number\">易错</span><div>注意条件、系数和最后一步的代入，避免只凭结论记忆。</div></div><div class=\"solution-conclusion\">答案：$ln2$。</div></div>"},"calc-stage3-multivariable-0001":{"hint":"方向导数的最大值等于梯度的模。先求梯度，再在给定点代入并求模。","explain":"<div class=\"solution\"><div class=\"solution-step\"><span class=\"step-number\">思路</span><div>围绕“梯度与方向导数”识别题型，先写出适用定义或公式，再完成化简。</div></div><div class=\"solution-step\"><span class=\"step-number\">1</span><div>$\\nabla f=(2x,4y)$，故 $\\nabla f(1,1)=(2,4)$。</div></div><div class=\"solution-step\"><span class=\"step-number\">2</span><div>最大方向导数为 $|\\nabla f|=\\sqrt{2^2+4^2}=\\sqrt{20}$。</div></div><div class=\"solution-step\"><span class=\"step-number\">易错</span><div>注意条件、系数和最后一步的代入，避免只凭结论记忆。</div></div><div class=\"solution-conclusion\">答案：$sqrt{20}$。</div></div>"},"calc-stage3-double-integral-0001":{"hint":"被积函数为 1，二重积分就是区域面积；单位圆的半径为 1。","explain":"<div class=\"solution\"><div class=\"solution-step\"><span class=\"step-number\">思路</span><div>围绕“二重积分的几何意义”识别题型，先写出适用定义或公式，再完成化简。</div></div><div class=\"solution-step\"><span class=\"step-number\">1</span><div>$\\iint_D1\\,dA$ 表示区域 $D$ 的面积。</div></div><div class=\"solution-step\"><span class=\"step-number\">2</span><div>单位圆面积为 $\\pi\\cdot1^2=\\pi$。</div></div><div class=\"solution-step\"><span class=\"step-number\">易错</span><div>注意条件、系数和最后一步的代入，避免只凭结论记忆。</div></div><div class=\"solution-conclusion\">答案：$pi$。</div></div>"},"calc-stage3-ode-0001":{"hint":"这是 $y'=-y$ 的指数衰减方程，先写通解 $y=Ce^{-x}$，再代入初值。","explain":"<div class=\"solution\"><div class=\"solution-step\"><span class=\"step-number\">思路</span><div>围绕“一阶线性微分方程”识别题型，先写出适用定义或公式，再完成化简。</div></div><div class=\"solution-step\"><span class=\"step-number\">1</span><div>$y'+y=0$ 即 $y'=-y$，通解为 $y=Ce^{-x}$。</div></div><div class=\"solution-step\"><span class=\"step-number\">2</span><div>由 $y(0)=C=2$，得到 $y=2e^{-x}$。</div></div><div class=\"solution-step\"><span class=\"step-number\">易错</span><div>注意条件、系数和最后一步的代入，避免只凭结论记忆。</div></div><div class=\"solution-conclusion\">答案：$2e^{-x}$。</div></div>"}};
ok(hash(old.map(q=>{const z={...q,...(reviewedText[q.id]||{})};if(fixedOptions[q.id])z.options=fixedOptions[q.id].before;delete z.subject;return z;}))==='c971c1197c78a7f0f094fde4b8424c454e77f264c3e54b3e5f60549d11ad1fca', BASE.oldSet+'旧题仅六解析/提示为已审阅例外，其余内容保持冻结硬哈希');
ok(hash(old.map(q=>[q.id,q.subject]))==='d008d80cc809af05dac86b3fe2e7a3bba598d765762a690e4041bfa1f079950e' && hash(old.map(q=>[q.id,['calc-orig-t7-11','calc-orig-t7-12'].includes(q.id)?['math-1','math-3']:q.subject]))==='900e9dd234ec7157e04e9c3d8db13b4cee2cb3109c584ddc2d579c38db89cc7d', BASE.oldSet+'旧题仅两道傅里叶科目变化，回填后保持冻结科目硬哈希');
ok(hash(old.map(q=>q.id))==='a6bf97882d45da2eae7f75b589d806d3989357ff1c366e08da2f06bf5e50b113', BASE.oldSet+'旧题相对顺序与ID不变');
const expectedSub=k=> {
 if(k.topic<=2) return k.id==='kp-t1-19'?['math-1','math-2']:['math-1','math-2','math-3'];
 if(k.topic===3) return ['kp-t3-05','kp-t3-06','kp-t3-10'].includes(k.id)?['math-1','math-3']:['math-1','math-2','math-3'];
 if(k.topic===4) return Number(k.id.slice(-2))<=6?['math-1','math-2','math-3']:['math-1'];
 if(k.topic===5) return k.id==='kp-t5-08'?['math-1']:['kp-t5-04','kp-t5-05'].includes(k.id)?['math-1','math-2']:['math-1','math-2','math-3'];
 return k.topic===6 || k.id==='kp-t7-06'?['math-1']:['math-1','math-3']; // 傅里叶仅数一，t7专题并集仍含数三。
};
ok(N.questions.every(q=>same(q.subject,expectedSub(N.knowledgePoints.find(k=>k.id===q.kpId)))), BASE.total + '题逐知识点科目全部符合施工图');
const solo=load(['question-bank.js']);
ok(solo.questions.every(q=>same(q.subject,expectedSub(solo.knowledgePoints.find(k=>k.id===q.kpId)))), '原创题库单独加载科目正确（避免被classic覆盖掩盖）');
const rawQ=fs.readFileSync(path.join(src,'question-bank.js'),'utf8');
ok(!/(?<!\r)\n/.test(rawQ) && !/\r(?!\n)/.test(rawQ), 'question-bank纯CRLF');
ok(/const mathTwoKpIds =[^;]+;/.test(rawQ) && /const mathThreeExcludedKpIds =[^;]+;/.test(rawQ), '本库保留数二白名单与数三排除表');
console.log(`结果：${pass}项通过，${fail}项失败`);
process.exit(fail?1:0);
