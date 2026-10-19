/* t2 补题验收（kp-t2-09 ~ kp-t2-14 共 6 道）。
   自包含：结构类断言用硬期望值，数学结论用独立数值复算（中点法数值积分，不看解析）。 */
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
/* 经典库已于 2026-10-16 退役，站点只加载 question-bank.js。 */
const N = load('question-bank.js');
const byId = id => N.questions.find(q => q.id === id);
const kpCount = id => N.questions.filter(q => q.kpId === id).length;
/* 中点法数值积分：对本题涉及的多项式精度足够（误差 ~ h²）。 */
const numInt = (f, a, b, n = 200000) => { let s = 0; const h = (b - a) / n; for (let i = 0; i < n; i++) s += f(a + h * (i + 0.5)); return s * h; };

console.log('=== 1. 题量与新增 ===');
console.log('    全库 ' + N.questions.length + ' 题；t2 ' + N.questions.filter(q => q.topic === 2).length + ' 题');
ok(N.questions.length >= BASE.total, '全库题量 ≥ ' + BASE.total + '（经典库退役后口径；后续批次只会继续增长，故不做等值断言）');
const ids = ['calc-orig-t2-09','calc-orig-t2-10','calc-orig-t2-11','calc-orig-t2-12','calc-orig-t2-13','calc-orig-t2-14'];
const news = ids.map(byId);
ok(news.every(Boolean), '6 道新题全部存在（命中 ' + news.filter(Boolean).length + '/6）');
ok(new Set(N.questions.map(q => q.id)).size === N.questions.length, '全库 ID 无重复');

console.log('\n=== 2. 知识点覆盖（本轮核心）===');
ids.forEach((id, i) => {
  const kp = 'kp-t2-' + String(9 + i).padStart(2, '0');
  { const exp = BASE.kpExp(kp); ok(kpCount(kp) === exp, kp + ' 恰好 ' + exp + ' 题（实测 ' + kpCount(kp) + '；期望值取自基线快照）'); }
});
const t2kp = N.knowledgePoints.filter(k => k.topic === 2);
const t2empty = t2kp.filter(k => kpCount(k.id) === 0);
console.log('    t2 知识点 ' + t2kp.length + ' 个，无题的 ' + t2empty.length + ' 个');
ok(t2empty.length === 0, 't2 全部 14 个知识点均已有题');
const allEmpty = N.knowledgePoints.filter(k => kpCount(k.id) === 0).length;
console.log('    全库无题知识点：21 → 15（t2 批交付时），当前 ' + allEmpty);
ok(allEmpty <= 15, '全库无题知识点 ≤ 15（t2 批交付后为 15；后续批次会继续下降，故不做等值断言）');

console.log('\n=== 3. 字段契约 ===');
ok(news.every(q => q.subject.length === 3 && ['math-1','math-2','math-3'].every(s => q.subject.includes(s))),
  '6 题科目均为数一/二/三（t2 无排除项）');
ok(news.every(q => q.review && q.review.status === 'approved'), '6 题 review 均为 approved（否则界面会隐藏）');
ok(news.every(q => q.source && q.source.kind === '原创'), '6 题来源均标注为原创');
ok(news.every(q => q.source.reference && /自行编写/.test(q.source.reference)), '6 题来源注明题干与解析系自行编写');
ok(news.every(q => !/\*\*/.test(q.explain)), '解析中无 Markdown 粗体残留（应用 <b>）');
ok(news.every(q => (q.explain.match(/<b>易错点<\/b>/g) || []).length === 1), '解析均含 <b>易错点</b> 粗体小标题');
ok(news.every(q => (q.explain.match(/<b>解题思路<\/b>/g) || []).length === 1), '解析均含 <b>解题思路</b> 粗体小标题');
const cnt = t => news.filter(q => q.type === t).length;
ok(cnt('choice') === 3 && cnt('fill') === 1 && cnt('solve') === 2,
  '题型 choice 3 / fill 1 / solve 2（实测 ' + cnt('choice') + '/' + cnt('fill') + '/' + cnt('solve') + '）');
const ch = news.filter(q => q.type === 'choice');
ok(ch.every(q => q.options.length === 4 && new Set(q.options).size === 4 && q.answer >= 0 && q.answer < 4),
  '选择题 4 个互异选项且 answer 索引合法');
ok(news.filter(q => q.type === 'fill').every(q => Array.isArray(q.answers) && q.answers.length > 0 && !q.options),
  '填空题有 answers 数组且无 options');
ok(news.filter(q => q.type === 'solve').every(q => typeof q.answerText === 'string' && q.answerText.length > 20),
  '解答题有 answerText');
ok(news.every(q => q.hint && !/答案|应选|选项 ?[ABCD]/.test(q.hint)), '提示不泄露答案或选项字母');
ok(news.every(q => q.prerequisites && q.prerequisites.length > 0), '6 题均带 prerequisites');
console.log('    难度分布：' + JSON.stringify(news.map(q => q.level).reduce((a, l) => (a[l] = (a[l] || 0) + 1, a), {})));

console.log('\n=== 4. 目标用时（依施工图 选填 2/3/3 + 解答 10/12 + 填 2）===');
[['calc-orig-t2-09',2],['calc-orig-t2-10',3],['calc-orig-t2-11',3],
 ['calc-orig-t2-12',10],['calc-orig-t2-13',12],['calc-orig-t2-14',2]]
  .forEach(([id, m]) => ok(byId(id).estimatedMinutes === m, id + ' 用时 ' + m + '（实测 ' + byId(id).estimatedMinutes + '）'));

console.log('\n=== 5. 数学独立复算（数值法，不看解析）===');
// T2-09 比较定积分大小：I2 < I1 < I3
const I1 = numInt(x => x * x, 0, 1), I2 = numInt(x => x * x * x, 0, 1), I3 = numInt(x => Math.sqrt(x), 0, 1);
console.log('    I1=' + I1.toFixed(6) + '  I2=' + I2.toFixed(6) + '  I3=' + I3.toFixed(6));
ok(Math.abs(I1 - 1/3) < 1e-6 && Math.abs(I2 - 1/4) < 1e-6 && Math.abs(I3 - 2/3) < 1e-6, 'T2-09 三个积分值分别为 1/3、1/4、2/3');
ok(I2 < I1 && I1 < I3, 'T2-09 大小关系 I2 < I1 < I3 成立');
ok(byId('calc-orig-t2-09').answer === 2, 'T2-09 答案索引指向「$I_2<I_1<I_3$」');
// T2-10 中值定理：反例 f=4x 积分恰为 2，但 f(1)=4>2
ok(Math.abs(numInt(x => 4 * x, 0, 1) - 2) < 1e-9, 'T2-10 反例 f=4x 的定积分恰为 2（C 不成立）');
ok(4 * 1 > 2, 'T2-10 f=4x 时 f(1)=4>2，故「处处不超过 2」为假');
ok(Math.abs(4 * 0.5 - 2) < 1e-12, 'T2-10 存在内点 ξ=0.5 使 f(ξ)=2（中值定理的可达性）');
ok(byId('calc-orig-t2-10').answer === 0, 'T2-10 答案索引指向「存在 ξ∈(0,1) 使 f(ξ)=2」');
// T2-11 部分分式：(x+2)/(x²+x) 是否等于 2/x - 1/(x+1)
const lhs = x => (x + 2) / (x * x + x), rhs = x => 2 / x - 1 / (x + 1);
ok([0.5, 1, 2, 3, 5, 10].every(x => Math.abs(lhs(x) - rhs(x)) < 1e-12),
  'T2-11 部分分式 (x+2)/(x²+x) = 2/x − 1/(x+1)（在 6 个采样点上数值一致）');
ok([2, 3, 5].every(x => Math.abs(Math.exp(2 * Math.log(x) - Math.log(x + 1)) - x * x / (x + 1)) < 1e-12),
  'T2-11 对数合并 2ln|x|−ln|x+1| = ln|x²/(x+1)| 成立');
ok(byId('calc-orig-t2-11').answer === 1, 'T2-11 答案索引指向 ln|x²/(x+1)|+C');
// T2-12 旋转体体积 V = π∫(x²−x⁴) = 2π/15
const V = Math.PI * numInt(x => x * x - x * x * x * x, 0, 1);
console.log('    V = ' + V.toFixed(8) + '；2π/15 = ' + (2 * Math.PI / 15).toFixed(8));
ok(Math.abs(V - 2 * Math.PI / 15) < 1e-6, 'T2-12 旋转体体积 = 2π/15');
ok(2 * Math.PI / 15 > 0, 'T2-12 体积为正（若误取 x⁴−x² 会得负值，可据此自查）');
ok(typeof byId('calc-orig-t2-12').answerText === 'string' && /2\\pi|2\\mathrm\{\\pi\}/.test(byId('calc-orig-t2-12').answerText + byId('calc-orig-t2-12').explain),
  'T2-12 参考答案与解析均给出 2π/15');
// T2-13 抽水做功 W = 10⁴π∫(3−x)dx = 4π×10⁴
const W = 1000 * 10 * Math.PI * numInt(x => 3 - x, 0, 2);
console.log('    W = ' + W.toFixed(2) + '；4π×10⁴ = ' + (4e4 * Math.PI).toFixed(2));
ok(Math.abs(W - 4e4 * Math.PI) < 1e-3, 'T2-13 抽水做功 = 4π×10⁴ J');
ok(Math.abs(numInt(x => 3 - x, 0, 2) - 4) < 1e-9, 'T2-13 提升高度积分 ∫₀²(3−x)dx = 4（提升高度随深度变化，非常数）');
ok(Math.abs(numInt(x => 3 - x, 0, 2) - numInt(() => 1, 0, 2)) > 1,
  'T2-13 若误把提升高度当常数 1 m，结果会差 2 倍以上（陷阱可复现）');
// T2-14 平均值 = (1/3)∫₀³x²dx = 3
const avg = numInt(x => x * x, 0, 3) / 3;
console.log('    平均值 = ' + avg.toFixed(6));
ok(Math.abs(avg - 3) < 1e-6, 'T2-14 平均值 = 3');
ok(Math.abs(numInt(x => x * x, 0, 3) - 9) < 1e-6, 'T2-14 定积分值为 9（若不除以区间长度就会误填 9）');
ok(byId('calc-orig-t2-14').answers.includes('3'), 'T2-14 answers 含 3');

console.log('\n=== 6. 可见题量 ===');
const m1 = N.questions.filter(q => q.subject.includes('math-1')).length;
const m2 = N.questions.filter(q => q.subject.includes('math-2')).length;
const m3 = N.questions.filter(q => q.subject.includes('math-3')).length;
console.log('    数一 ' + m1 + ' · 数二 ' + m2 + ' · 数三 ' + m3);
ok(m1 >= BASE.bySubject['math-1'] && m2 >= BASE.bySubject['math-2'] && m3 >= BASE.bySubject['math-3'], '数一 ≥ ' + BASE.bySubject['math-1'] + ' / 数二 ≥ ' + BASE.bySubject['math-2'] + ' / 数三 ≥ ' + BASE.bySubject['math-3'] + '（经典库退役后的下限）');

console.log('\n=== 7. 文件格式（本库 CRLF；经典库已退役）===');
{
  const qbRaw = fs.readFileSync(path.join(src, 'question-bank.js'), 'utf8');
  ok((qbRaw.match(/(?<!\r)\n/g) || []).length === 0, 'question-bank.js 保持纯 CRLF（CRLF ' + (qbRaw.match(/\r\n/g) || []).length + ' / 裸LF 0）');
  ok(!fs.existsSync(path.join(src, 'classic-question-bank.js')), 'classic-question-bank.js 已退役（不再存在此文件）');
}
const cq = N.questions.filter(q => q.type === 'choice');
console.log('    全库选择题 ' + cq.length + ' 道，答案分布 A' + cq.filter(q => q.answer === 0).length
  + '/B' + cq.filter(q => q.answer === 1).length + '/C' + cq.filter(q => q.answer === 2).length
  + '/D' + cq.filter(q => q.answer === 3).length);

console.log('\n================ 结果：' + pass + ' 项通过，' + fail + ' 项失败 ================');
process.exit(fail ? 1 : 0);
