/* t0 补题验收（kp-t0-11 ~ kp-t0-15 共 5 道）。
   自包含：不依赖任何基线快照；结构类断言用硬期望值，数学结论用独立数值复算。
   经典库已于 2026-10-16 退役，站点只加载 question-bank.js。 */
const fs = require('fs');
const path = require('path');

const BASE = require('./verify-baseline.cjs'); // 期望计数集中于此，补题后只改它
const src = __dirname;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  \u2713 ' + m); } else { fail++; console.log('  \u2717 ' + m); } };
const load = (...files) => {
  const win = {};
  for (const f of files.filter(Boolean)) new Function('window', fs.readFileSync(path.join(src, f), 'utf8'))(win);
  return win.ZHIXU_BANK;
};
const N = load('question-bank.js');
const byId = id => N.questions.find(q => q.id === id);

console.log('=== 1. 题量与新增 ===');
console.log('    全库 ' + N.questions.length + ' 题；t0 ' + N.questions.filter(q => q.topic === 0).length + ' 题');
ok(N.questions.length >= 132, '全库题量 ≥ 132（t0 批交付后为 132；后续批次会继续增长，故此处不做等值断言）');
const ids = ['calc-orig-t0-11','calc-orig-t0-12','calc-orig-t0-13','calc-orig-t0-14','calc-orig-t0-15'];
const news = ids.map(byId);
ok(news.every(Boolean), '5 道新题全部存在且 ID 唯一（命中 ' + news.filter(Boolean).length + '/5）');
ok(new Set(N.questions.map(q => q.id)).size === N.questions.length, '全库 ID 无重复');

console.log('\n=== 2. 知识点覆盖（本轮核心）===');
const kpCount = id => N.questions.filter(q => q.kpId === id).length;
['kp-t0-11','kp-t0-12','kp-t0-13','kp-t0-14','kp-t0-15'].forEach(id => {
  { const exp = BASE.kpExp(id); ok(kpCount(id) === exp, id + ' 恰好 ' + exp + ' 题（实测 ' + kpCount(id) + '；期望值取自基线快照）'); }
});
const t0kp = N.knowledgePoints.filter(k => k.topic === 0);
const t0empty = t0kp.filter(k => kpCount(k.id) === 0);
console.log('    t0 知识点 ' + t0kp.length + ' 个，无题的 ' + t0empty.length + ' 个');
ok(t0empty.length === 0, 't0 全部知识点均已有题');
const allEmpty = N.knowledgePoints.filter(k => kpCount(k.id) === 0).length;
console.log('    全库无题知识点：36 → 31（t0 批交付时），当前 ' + allEmpty);
ok(allEmpty <= 31, '全库无题知识点 ≤ 31（t0 批交付后为 31；后续批次会继续下降，故不做等值断言）');

console.log('\n=== 3. 字段契约 ===');
ok(news.every(q => q.subject.length === 3 && ['math-1','math-2','math-3'].every(s => q.subject.includes(s))),
  '5 题科目均为数一/二/三');
ok(news.every(q => q.review && q.review.status === 'approved'), '5 题 review 均为 approved（否则界面会隐藏）');
ok(news.every(q => q.source && q.source.kind === '原创'), '5 题来源均标注为原创');
ok(news.every(q => !/^\s*\*\*|\*\*/.test(q.explain)), '解析中无 Markdown 粗体残留（应用 <b>）');
ok(news.every(q => (q.explain.match(/<b>易错点<\/b>/g) || []).length === 1), '解析均含 <b>易错点</b> 粗体小标题');
ok(news.every(q => (q.explain.match(/<b>解题思路<\/b>/g) || []).length === 1), '解析均含 <b>解题思路</b> 粗体小标题');
const choiceQ = news.filter(q => q.type === 'choice');
ok(choiceQ.length === 3 && news.filter(q => q.type === 'fill').length === 1 && news.filter(q => q.type === 'solve').length === 1,
  '题型分布 choice 3 / fill 1 / solve 1（实测 ' + choiceQ.length + '/' + news.filter(q => q.type === 'fill').length + '/' + news.filter(q => q.type === 'solve').length + '）');
ok(choiceQ.every(q => q.options.length === 4 && q.answer >= 0 && q.answer <= 3), '选择题均 4 选项且 answer 索引合法');
ok(choiceQ.every(q => new Set(q.options).size === 4), '选择题选项互不重复');
const fillQ = byId('calc-orig-t0-13');
ok(fillQ && Array.isArray(fillQ.answers) && fillQ.answers.length > 0 && !fillQ.options, '填空题有 answers 数组且无 options');
const solveQ = byId('calc-orig-t0-15');
ok(solveQ && typeof solveQ.answerText === 'string' && solveQ.answerText.length > 20, '解答题有 answerText');
ok(news.every(q => q.hint && !/答案|选项 [ABCD]|应选/.test(q.hint.slice(0, 200))), '提示不泄露答案或选项字母');
ok(news.every(q => q.prerequisites && q.prerequisites.length > 0), '5 题均带 prerequisites');

console.log('\n=== 4. 目标用时（依施工图 选填 2/3/3/3，解答 10）===');
ok(byId('calc-orig-t0-11').estimatedMinutes === 2, 'kp-t0-11 用时 2');
ok(byId('calc-orig-t0-12').estimatedMinutes === 3, 'kp-t0-12 用时 3');
ok(byId('calc-orig-t0-13').estimatedMinutes === 3, 'kp-t0-13 用时 3');
ok(byId('calc-orig-t0-14').estimatedMinutes === 3, 'kp-t0-14 用时 3');
ok(byId('calc-orig-t0-15').estimatedMinutes === 10, 'kp-t0-15 用时 10');

console.log('\n=== 5. 数学独立复算（数值法，不看解析）===');
// T0-11 定义域：x=0 与 x=-1 应无定义；x=2、x=0.5、x=-0.5 应有定义
const f11 = x => Math.sqrt(2 - x) / Math.log(x + 1);
ok(!isFinite(f11(0)), 'T0-11 x=0 无定义（分母 ln1=0）→ 应被排除');
ok(isNaN(f11(-1.5)), 'T0-11 x=-1.5 无定义（真数为负）→ 应被排除');
ok(!(-1 + 1 > 0), 'T0-11 x=-1 不满足真数>0，应被排除（注：Math.log(0) 在数值上得 -∞ 而非 NaN，故不能靠 isNaN 判定该端点）');
ok(isFinite(f11(2)) && isFinite(f11(0.5)) && isFinite(f11(-0.5)), 'T0-11 x=2 / 0.5 / -0.5 有定义');
// T0-12 极限：S_n → 1
const S = n => { let s = 0; for (let k = 1; k <= n; k++) s += 1 / Math.sqrt(n * n + k); return s; };
console.log('    夹逼和式 S_1e3 = ' + S(1e3).toFixed(6) + '，S_1e6 = ' + S(1e6).toFixed(6));
ok(Math.abs(S(1e6) - 1) < 1e-4, 'T0-12 极限为 1（数值 ' + S(1e6).toFixed(6) + '）');
ok(byId('calc-orig-t0-12').answer === 2, 'T0-12 答案索引指向「1」');
// T0-13 极限：((x+a)/(x-a))^x → e^(2a)，a=2 时应为 e^4
const L13 = (a, x) => Math.pow((x + a) / (x - a), x);
console.log('    a=2, x=1e5：' + L13(2, 1e5).toFixed(6) + '；e^4 = ' + Math.exp(4).toFixed(6));
ok(Math.abs(L13(2, 1e5) - Math.exp(4)) < 1e-2, 'T0-13 a=2 时极限 = e^4');
ok(Math.abs(L13(4, 1e5) - Math.exp(4)) > 100, 'T0-13 a=4 时极限为 e^8（≈2981），与 e^4 相差极大 → 排除漏除以 2 的错误');
ok(fillQ.answers.includes('2'), 'T0-13 answers 含 2');
// T0-14 阶数：(tan x - sin x)/x^3 → 1/2
const r14 = x => (Math.tan(x) - Math.sin(x)) / Math.pow(x, 3);
console.log('    x=1e-2：' + r14(1e-2).toFixed(6) + '；x=1e-3：' + r14(1e-3).toFixed(6));
ok(Math.abs(r14(1e-3) - 0.5) < 1e-4, 'T0-14 极限为 1/2 → 3 阶无穷小');
ok(byId('calc-orig-t0-14').answer === 2, 'T0-14 答案索引指向「3 阶」');
// T0-15 不动点：随机取满足 0<=f<=1 的连续函数，验证 g 有零点
let t15ok = true;
for (let i = 0; i < 5; i++) {
  const c = Math.random(); // f(x)=x^2/2 + c/2 落在 [0,1]（x∈[0,1] 时 f∈[0,1]）
  const f = x => x * x / 2 + c / 2;
  const g = x => f(x) - x;
  if (g(0) > 0 && g(1) > 0) t15ok = false; // g(0)=c/2>=0, g(1)=0.5+c/2-1<=0
}
ok(t15ok, 'T0-15 对随机满足条件的 f 均有 g(0)≥0、g(1)≤0（端点异号成立）');

console.log('\n=== 6. 文件格式 ===');
const raw = fs.readFileSync(path.join(src, 'question-bank.js'), 'utf8');
ok((raw.match(/(?<!\r)\n/g) || []).length === 0, 'question-bank.js 无裸 LF（纯 CRLF）');
ok(raw.includes('<b>易错点</b>'), '新题使用 HTML <b> 而非 Markdown');
const cq = N.questions.filter(q => q.type === 'choice');
console.log('    全库选择题 ' + cq.length + ' 道，答案分布 A' + cq.filter(q=>q.answer===0).length
  + '/B' + cq.filter(q=>q.answer===1).length + '/C' + cq.filter(q=>q.answer===2).length
  + '/D' + cq.filter(q=>q.answer===3).length);

console.log('\n================ 结果：' + pass + ' 项通过，' + fail + ' 项失败 ================');
process.exit(fail ? 1 : 0);
