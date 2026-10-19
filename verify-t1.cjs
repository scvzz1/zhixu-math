/* t1 补题验收（kp-t1-10 ~ kp-t1-19 共 10 道）+ 数三排除映射专项。
   自包含：结构类断言用硬期望值，数学结论用独立数值复算。 */
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
/* 经典库已于 2026-10-16 退役，站点只加载 question-bank.js，归一化以本库为准。 */
const N = load('question-bank.js');
const byId = id => N.questions.find(q => q.id === id);

console.log('=== 1. 题量与新增 ===');
console.log('    全库 ' + N.questions.length + ' 题；t1 ' + N.questions.filter(q => q.topic === 1).length + ' 题');
ok(N.questions.length >= BASE.total, '全库题量 ≥ ' + BASE.total + '（经典库退役后口径；后续批次只会继续增长，故不做等值断言）');
const ids = ['calc-orig-t1-10','calc-orig-t1-11','calc-orig-t1-12','calc-orig-t1-13','calc-orig-t1-14',
             'calc-orig-t1-15','calc-orig-t1-16','calc-orig-t1-17','calc-orig-t1-18','calc-orig-t1-19'];
const news = ids.map(byId);
ok(news.every(Boolean), '10 道新题全部存在（命中 ' + news.filter(Boolean).length + '/10）');
ok(new Set(N.questions.map(q => q.id)).size === N.questions.length, '全库 ID 无重复');

console.log('\n=== 2. 知识点覆盖 ===');
const kpCount = id => N.questions.filter(q => q.kpId === id).length;
['kp-t1-10','kp-t1-11','kp-t1-12','kp-t1-13','kp-t1-14','kp-t1-15','kp-t1-16','kp-t1-17','kp-t1-18','kp-t1-19']
  .forEach(id => { const exp = BASE.kpExp(id); ok(kpCount(id) === exp, id + ' 恰好 ' + exp + ' 题（实测 ' + kpCount(id) + '；期望值取自基线快照）'); });
const t1kp = N.knowledgePoints.filter(k => k.topic === 1);
const t1empty = t1kp.filter(k => kpCount(k.id) === 0);
console.log('    t1 知识点 ' + t1kp.length + ' 个，无题的 ' + t1empty.length + ' 个');
ok(t1empty.length === 0, 't1 全部 19 个知识点均已有题');
const allEmpty = N.knowledgePoints.filter(k => kpCount(k.id) === 0).length;
console.log('    全库无题知识点：31 → 21（t1 批交付时），当前 ' + allEmpty);
ok(allEmpty <= 21, '全库无题知识点 ≤ 21（t1 批交付后为 21；后续批次会继续下降，故不做等值断言）');

console.log('\n=== 3. 数三排除映射（本轮新增能力，两个文件必须同时改）===');
const t119 = byId('calc-orig-t1-19');
ok(t119.subject.length === 2 && t119.subject.includes('math-1') && t119.subject.includes('math-2') && !t119.subject.includes('math-3'),
  'kp-t1-19（曲率）subject = math-1 + math-2，不含 math-3（实测 [' + t119.subject.join(',') + ']）');
const t1others = news.filter(q => q.id !== 'calc-orig-t1-19');
ok(t1others.every(q => q.subject.length === 3), '其余 9 道 t1 题科目仍为数一/二/三');
const visibleM3 = N.questions.filter(q => q.subject.includes('math-3'));
ok(!visibleM3.some(q => q.kpId === 'kp-t1-19'), '数三可见集合中不含 kp-t1-19（界面按 q.subject 过滤）');
ok(visibleM3.length >= BASE.bySubject['math-3'], '数学三可见 ≥ ' + BASE.bySubject['math-3'] + ' 题（经典库退役后口径；后续批次会继续增长）');
const visibleM2 = N.questions.filter(q => q.subject.includes('math-2')).length;
const visibleM1 = N.questions.filter(q => q.subject.includes('math-1')).length;
console.log('    可见题量：数一 ' + visibleM1 + ' · 数二 ' + visibleM2 + ' · 数三 ' + visibleM3.length);
ok(visibleM1 >= BASE.bySubject['math-1'] && visibleM2 >= BASE.bySubject['math-2'], '数学一 ≥ ' + BASE.bySubject['math-1'] + '、数学二 ≥ ' + BASE.bySubject['math-2'] + '（经典库退役后的下限）');

console.log('\n=== 4. 字段契约 ===');
ok(news.every(q => q.review && q.review.status === 'approved'), '10 题 review 均为 approved');
ok(news.every(q => q.source && q.source.kind === '原创'), '10 题来源均标注为原创');
ok(news.every(q => !/\*\*/.test(q.explain)), '解析中无 Markdown 粗体残留（应用 <b>）');
ok(news.every(q => (q.explain.match(/<b>易错点<\/b>/g) || []).length === 1), '解析均含 <b>易错点</b>');
ok(news.every(q => (q.explain.match(/<b>解题思路<\/b>/g) || []).length === 1), '解析均含 <b>解题思路</b>');
const cnt = t => news.filter(q => q.type === t).length;
ok(cnt('choice') === 6 && cnt('fill') === 2 && cnt('solve') === 2, '题型 choice 6 / fill 2 / solve 2（实测 ' + cnt('choice') + '/' + cnt('fill') + '/' + cnt('solve') + '）');
const ch = news.filter(q => q.type === 'choice');
ok(ch.every(q => q.options.length === 4 && new Set(q.options).size === 4 && q.answer >= 0 && q.answer < 4), '选择题 4 个互异选项且 answer 合法');
ok(news.filter(q => q.type === 'fill').every(q => Array.isArray(q.answers) && q.answers.length > 0 && !q.options), '填空题有 answers 且无 options');
ok(news.filter(q => q.type === 'solve').every(q => typeof q.answerText === 'string' && q.answerText.length > 30), '解答题有 answerText');
ok(news.every(q => q.hint && !/答案|应选|选项 ?[ABCD]/.test(q.hint)), '提示不泄露答案或选项字母');
ok(news.every(q => q.prerequisites && q.prerequisites.length > 0), '10 题均带 prerequisites');
const scores = news.map(q => q.level).reduce((a,l) => (a[l] = (a[l]||0)+1, a), {});
console.log('    难度分布：' + JSON.stringify(scores));

console.log('\n=== 5. 目标用时（依施工图）===');
[['calc-orig-t1-10',3],['calc-orig-t1-11',3],['calc-orig-t1-12',3],['calc-orig-t1-13',12],['calc-orig-t1-14',3],
 ['calc-orig-t1-15',12],['calc-orig-t1-16',3],['calc-orig-t1-17',3],['calc-orig-t1-18',3],['calc-orig-t1-19',2]]
  .forEach(([id, m]) => ok(byId(id).estimatedMinutes === m, id + ' 用时 ' + m + '（实测 ' + byId(id).estimatedMinutes + '）'));

console.log('\n=== 6. 数学独立复算（数值法，不看解析）===');
// T1-10 f'(0) = lim x sin(1/x) = 0
const dq10 = x => x * Math.sin(1 / x);
ok(Math.abs(dq10(1e-6)) < 1e-6 && Math.abs(dq10(-1e-6)) < 1e-6, 'T1-10 差商 x·sin(1/x) → 0，故 f′(0)=0');
ok(isFinite(dq10(1e-6)) && Math.abs(Math.sin(1 / 1e-6)) <= 1, 'T1-10 振荡项 sin(1/x) 有界（被 x 压住）');
ok(byId('calc-orig-t1-10').answer === 0, 'T1-10 答案索引指向 0');
// T1-11 |x| 左右差商不等；|x^3| 与 x^2 sin(1/x) 可导
const dqAbs = h => Math.abs(h) / h;
ok(Math.abs(dqAbs(1e-6) - 1) < 1e-9 && Math.abs(dqAbs(-1e-6) + 1) < 1e-9, 'T1-11 |x| 左右差商为 +1 / −1，不可导');
ok(Math.abs(Math.pow(1e-6, 3) / 1e-6 - 1e-12) < 1e-20, 'T1-11 |x³|/x = x² → 0，可导');
ok(Math.abs(1e-6 * 1e-6 * Math.sin(1 / 1e-6) / 1e-6) < 1e-6, 'T1-11 x²sin(1/x)/x → 0，可导');
ok(byId('calc-orig-t1-11').answer === 2, 'T1-11 答案索引指向 |x| 那一项');
// T1-12 参数方程二阶导 → -1（用参数化的有限差分独立算）
const X = t => t - Math.sin(t), Y = t => 1 - Math.cos(t);
const t0 = Math.PI / 2, h = 1e-4;
const s1 = (Y(t0) - Y(t0 - h)) / (X(t0) - X(t0 - h));
const s2 = (Y(t0 + h) - Y(t0)) / (X(t0 + h) - X(t0));
const d2 = (s2 - s1) / ((X(t0 + h) - X(t0 - h)) / 2);
console.log('    参数方程二阶导数值：' + d2.toFixed(6));
ok(Math.abs(d2 + 1) < 1e-3, 'T1-12 d²y/dx²|_{t=π/2} = −1');
ok(byId('calc-orig-t1-12').answers.includes('-1'), 'T1-12 answers 含 -1');
// T1-13 罗尔：对随机满足条件的 f，F=e^{-x}f 满足 F(0)=F(1)=0 且 F′ 在 (0,1) 有零点
let t13ok = true;
for (let i = 0; i < 5; i++) {
  const f = x => x * (1 - x) * (1 + 0.3 * Math.sin(i + x)); // 满足 f(0)=f(1)=0 且在 [0,1] 连续可导
  const F = x => Math.exp(-x) * f(x);
  const dF = x => (F(x + 1e-6) - F(x - 1e-6)) / 2e-6;
  if (Math.abs(F(0)) > 1e-12 || Math.abs(F(1)) > 1e-12) t13ok = false;
  let found = false; // 找 F′ 的零点（罗尔保证存在），不是找 F 变号
  for (let k = 1; k < 500; k++) {
    const a = k / 500, b = (k + 1) / 500;
    if (dF(a) * dF(b) <= 0) { found = true; break; }
  }
  if (!found) t13ok = false;
}
ok(t13ok, 'T1-13 辅助函数 F=e^{-x}f 满足 F(0)=F(1)=0，且 F′ 在 (0,1) 内有零点（罗尔结论成立）');
// T1-14 极限 = 1，且 (1+cos x)/(1+sin x) 无极限（说明洛必达失效）
const g = x => (x + Math.sin(x)) / (x - Math.cos(x));
const h14 = x => (1 + Math.cos(x)) / (1 + Math.sin(x));
console.log('    x=1e6：原式 = ' + g(1e6).toFixed(8) + '；导数之比 = ' + h14(1e6).toFixed(4));
ok(Math.abs(g(1e6) - 1) < 1e-5, 'T1-14 原极限为 1');
const osc = [1e6, 1e6 + 1, 1e6 + 2, 1e6 + 3].map(h14);
ok(Math.max(...osc) - Math.min(...osc) > 0.5, 'T1-14 导数之比随 x 振荡、无极限 → 洛必达给不出结论');
ok(byId('calc-orig-t1-14').answer === 1, 'T1-14 答案索引指向 1');
// T1-15 泰勒极限 = -4/3，且只展到 x² 会误得 0
const num15 = x => Math.cos(2 * x) - Math.exp(-2 * x * x);
console.log('    x=1e-3：原式 = ' + (num15(1e-3) / 1e-12).toFixed(8));
ok(Math.abs(num15(1e-3) / Math.pow(1e-3, 4) + 4 / 3) < 1e-3, 'T1-15 极限为 −4/3');
ok(Math.abs(num15(1e-3) / 1e-6) < 1e-4, 'T1-15 低阶（x²）项确实相消：分子除以 x² 仍 → 0（只展到 x² 会误得 0）');
// T1-16 f=x³-3x²+3x 在 x=1 单调穿过，无极值
const f16 = x => x * x * x - 3 * x * x + 3 * x;
ok(f16(0.9) < f16(1) && f16(1) < f16(1.1), 'T1-16 x=1 处单调穿过（两侧函数值一大一小），不是极值点');
ok(Math.abs(3 * Math.pow(0.9 - 1, 2) - 0.03) < 1e-12 && 3 * Math.pow(1 - 1, 2) === 0, 'T1-16 f′(x)=3(x−1)² ≥ 0 且在 x=1 两侧不变号');
ok(byId('calc-orig-t1-16').answer === 3, 'T1-16 答案索引指向「不取得极值」');
// T1-17 y=x⁴-2x³ 拐点 (0,0) 与 (1,-1)
const dd17 = x => 12 * x * (x - 1);
const f17 = x => Math.pow(x, 4) - 2 * Math.pow(x, 3);
ok(dd17(-0.1) > 0 && dd17(0.5) < 0 && dd17(2) > 0, 'T1-17 y″ 在 0 与 1 两侧都变号 → 两个拐点');
ok(Math.abs(f17(0)) < 1e-12 && Math.abs(f17(1) + 1) < 1e-12, 'T1-17 拐点坐标为 (0,0) 与 (1,−1)');
ok(byId('calc-orig-t1-17').answer === 2, 'T1-17 答案索引指向「(0,0) 与 (1,-1)」');
// T1-18 y=x²/(x-1)：铅直 x=1、斜 y=x+1
const f18 = x => x * x / (x - 1);
ok(!isFinite(f18(1)), 'T1-18 x=1 处趋于无穷 → 铅直渐近线');
ok(Math.abs(f18(1e6) - (1e6 + 1)) < 1e-3 && Math.abs(f18(-1e6) - (-1e6 + 1)) < 1e-3, 'T1-18 两侧都满足 y−(x+1) → 0 → 斜渐近线 y=x+1');
ok(byId('calc-orig-t1-18').answer === 3, 'T1-18 答案索引指向「x=1 与 y=x+1」');
// T1-19 曲率半径 R=1
const yp = x => -Math.tan(x), ypp = x => -1 / Math.pow(Math.cos(x), 2);
const K19 = Math.abs(ypp(0)) / Math.pow(1 + Math.pow(yp(0), 2), 1.5);
console.log('    曲率 K = ' + K19.toFixed(6) + '，曲率半径 R = ' + (1 / K19).toFixed(6));
ok(Math.abs(K19 - 1) < 1e-12 && Math.abs(1 / K19 - 1) < 1e-12, 'T1-19 曲率与曲率半径均为 1');
ok(byId('calc-orig-t1-19').answers.includes('1'), 'T1-19 answers 含 1');

console.log('\n=== 7. 文件格式（本库 CRLF；经典库已退役）===');
{
  const qbRaw = fs.readFileSync(path.join(src, 'question-bank.js'), 'utf8');
  ok((qbRaw.match(/(?<!\r)\n/g) || []).length === 0, 'question-bank.js 保持纯 CRLF（CRLF ' + (qbRaw.match(/\r\n/g) || []).length + ' / 裸LF 0）');
  ok(!fs.existsSync(path.join(src, 'classic-question-bank.js')), 'classic-question-bank.js 已退役（不再存在此文件）');
}
const cq = N.questions.filter(q => q.type === 'choice');
console.log('    全库选择题 ' + cq.length + ' 道，答案分布 A' + cq.filter(q=>q.answer===0).length
  + '/B' + cq.filter(q=>q.answer===1).length + '/C' + cq.filter(q=>q.answer===2).length
  + '/D' + cq.filter(q=>q.answer===3).length);

console.log('\n================ 结果：' + pass + ' 项通过，' + fail + ' 项失败 ================');
process.exit(fail ? 1 : 0);
