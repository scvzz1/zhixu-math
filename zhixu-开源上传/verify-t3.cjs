/* t3 补题验收（kp-t3-08 ~ kp-t3-11 共 4 道）+ 空间曲线仅数一/三的科目专项。
   自包含：结构类断言用硬期望值，数学结论用独立数值复算（不看解析）。 */
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
/* 经典库已于 2026-10-16 退役，站点只加载 question-bank.js，科目基准直接取本库的 subjectsByTopic[3]。 */
const N = load('question-bank.js');
const byId = id => N.questions.find(q => q.id === id);
const kpCount = id => N.questions.filter(q => q.kpId === id).length;

console.log('=== 1. 题量与新增 ===');
console.log('    全库 ' + N.questions.length + ' 题；t3 ' + N.questions.filter(q => q.topic === 3).length + ' 题');
ok(N.questions.length >= BASE.range.totalMin && N.questions.length <= BASE.range.totalMax, '全库题量位于 ' + BASE.range.totalMin + '–' + BASE.range.totalMax + '（实测 ' + N.questions.length + '）');
const ids = ['calc-orig-t3-08','calc-orig-t3-09','calc-orig-t3-10','calc-orig-t3-11'];
const news = ids.map(byId);
ok(news.every(Boolean), '4 道新题全部存在（命中 ' + news.filter(Boolean).length + '/4）');
ok(new Set(N.questions.map(q => q.id)).size === N.questions.length, '全库 ID 无重复');

console.log('\n=== 2. 知识点覆盖（本轮核心）===');
ids.forEach((id, i) => {
  const kp = 'kp-t3-' + String(8 + i).padStart(2, '0');
  { const exp = BASE.kpExp(kp, 1); ok(kpCount(kp) === exp, kp + ' 恰好 ' + exp + ' 题（实测 ' + kpCount(kp) + '；期望值取自基线快照：H2 批补 t3-09/t3-11，H4 批补 t3-08/t3-10，H6 批再为 t3-08/t3-10 各补 1 道基础题）'); }
});
const t3kp = N.knowledgePoints.filter(k => k.topic === 3);
const t3empty = t3kp.filter(k => kpCount(k.id) === 0);
console.log('    t3 知识点 ' + t3kp.length + ' 个，无题的 ' + t3empty.length + ' 个');
ok(t3empty.length === 0, 't3 全部 11 个知识点均已有题');
const allEmpty = N.knowledgePoints.filter(k => kpCount(k.id) === 0).length;
console.log('    全库无题知识点：15 → ' + allEmpty);
ok(allEmpty >= 0 && allEmpty <= 11, '全库无题知识点不超过 t3 交付时的 11（实测 ' + allEmpty + '）');

console.log('\n=== 3. 科目映射：空间曲线仅数一/三（数二不考空间解析几何）===');
const t310 = byId('calc-orig-t3-10');
ok(t310.subject.length === 2 && t310.subject.includes('math-1') && t310.subject.includes('math-3') && !t310.subject.includes('math-2'),
  'kp-t3-10（空间曲线切线与法平面）subject = math-1 + math-3，不含 math-2（实测 [' + t310.subject.join(',') + ']）');
const others = news.filter(q => q.id !== 'calc-orig-t3-10');
ok(others.every(q => q.subject.length === 3), '其余 3 道 t3 题科目仍为数一/二/三');
const visibleM2 = N.questions.filter(q => q.subject.includes('math-2'));
ok(!visibleM2.some(q => q.kpId === 'kp-t3-10'), '数二可见集合中不含 kp-t3-10（界面按 q.subject 过滤）');
const visibleM3 = N.questions.filter(q => q.subject.includes('math-3'));
const visibleM1 = N.questions.filter(q => q.subject.includes('math-1'));
console.log('    可见题量：数一 ' + visibleM1.length + ' · 数二 ' + visibleM2.length + ' · 数三 ' + visibleM3.length);
ok(visibleM1.length === N.questions.length && visibleM2.length >= BASE.range.subjectMin['math-2'] && visibleM2.length <= BASE.range.subjectMax['math-2'] && visibleM3.length >= BASE.range.subjectMin['math-3'] && visibleM3.length <= BASE.range.subjectMax['math-3'],
  '科目数量位于t3至全覆盖范围；数三允许施工图傅里叶归属纠正（精确计数由全库专项验收）');

console.log('\n=== 4. 字段契约 ===');
ok(news.every(q => q.review && q.review.status === 'approved'), '4 题 review 均为 approved（否则界面会隐藏）');
ok(news.every(q => q.source && q.source.kind === '原创'), '4 题来源均标注为原创');
ok(news.every(q => !/\*\*/.test(q.explain)), '解析中无 Markdown 粗体残留（应用 <b>）');
ok(news.every(q => (q.explain.match(/<b>易错点<\/b>/g) || []).length === 1), '解析均含 <b>易错点</b> 粗体小标题');
ok(news.every(q => (q.explain.match(/<b>解题思路<\/b>/g) || []).length === 1), '解析均含 <b>解题思路</b> 粗体小标题');
const cnt = t => news.filter(q => q.type === t).length;
ok(cnt('choice') === 1 && cnt('fill') === 2 && cnt('solve') === 1,
  '题型 choice 1 / fill 2 / solve 1（实测 ' + cnt('choice') + '/' + cnt('fill') + '/' + cnt('solve') + '）');
const ch = news.filter(q => q.type === 'choice');
ok(ch.every(q => q.options.length === 4 && new Set(q.options).size === 4 && q.answer >= 0 && q.answer < 4),
  '选择题 4 个互异选项且 answer 索引合法');
ok(news.filter(q => q.type === 'fill').every(q => Array.isArray(q.answers) && q.answers.length > 0 && !q.options),
  '填空题有 answers 数组且无 options');
ok(news.filter(q => q.type === 'solve').every(q => typeof q.answerText === 'string' && q.answerText.length > 20),
  '解答题有 answerText');
ok(news.every(q => q.hint && !/答案|应选|选项 ?[ABCD]/.test(q.hint)), '提示不泄露答案或选项字母');
ok(news.every(q => q.prerequisites && q.prerequisites.length > 0), '4 题均带 prerequisites');
console.log('    难度分布：' + JSON.stringify(news.map(q => q.level).reduce((a, l) => (a[l] = (a[l] || 0) + 1, a), {})));

console.log('\n=== 5. 目标用时（依施工图 选填 2/3/2 + 解答 12）===');
[['calc-orig-t3-08',2],['calc-orig-t3-09',3],['calc-orig-t3-10',2],['calc-orig-t3-11',12]]
  .forEach(([id, m]) => ok(byId(id).estimatedMinutes === m, id + ' 用时 ' + m + '（实测 ' + byId(id).estimatedMinutes + '）'));

console.log('\n=== 6. 数学独立复算（数值法，不看解析）===');
// T3-08 二重极限 xy/(x²+y²)：沿不同路径结果不同 → 不存在
const ratio = (x, y) => (x * y) / (x * x + y * y);
ok(Math.abs(ratio(1e-3, 0)) < 1e-12, 'T3-08 沿 y=0 趋近得 0');
ok(Math.abs(ratio(1e-3, 1e-3) - 0.5) < 1e-12, 'T3-08 沿 y=x 趋近得 1/2');
const ks = [0.5, 1, 2, -1, 3].map(k => ratio(1e-4, k * 1e-4));
ok(Math.max(...ks) - Math.min(...ks) > 0.3, 'T3-08 沿 y=kx 的值随 k 变化 → 极限与路径有关，故不存在');
ok(byId('calc-orig-t3-08').answer === 2, 'T3-08 答案索引指向「不存在」');
// T3-09 隐函数 x²+y²+z²=6 在 (2,1,1)：∂z/∂x = −x/z = −2
const zOf = (x, y) => Math.sqrt(6 - x * x - y * y); // 在 (2,1,1) 附近取上支
const h = 1e-6;
const dzdxNum = (zOf(2 + h, 1) - zOf(2 - h, 1)) / (2 * h);
console.log('    数值 ∂z/∂x = ' + dzdxNum.toFixed(6) + '；公式 −x/z = −2');
ok(Math.abs(dzdxNum + 2) < 1e-3, 'T3-09 数值微分为 −2（与公式 −x/z 一致）');
ok(Math.abs(-(2) / 1 + 2) < 1e-12, 'T3-09 各偏导代入：−F_x/F_z = −2x/(2z) = −2');
ok(byId('calc-orig-t3-09').answers.includes('-2'), 'T3-09 answers 含 -2');
const FzAt = 2 * 1; // 该点 z=1 → F_z = 2z
ok(FzAt !== 0, 'T3-09 该点 F_z = 2z = ' + FzAt + ' ≠ 0，隐函数公式适用');
// T3-10 参数曲线 (t²,t,t³)：切向量 (2,1,3)，法平面 2x+y+3z=6
const P = t => [t * t, t, t * t * t];
const T = t => [2 * t, 1, 3 * t * t];
ok(Math.abs(P(1)[0] - 1) < 1e-12 && Math.abs(P(1)[1] - 1) < 1e-12 && Math.abs(P(1)[2] - 1) < 1e-12,
  'T3-10 t=1 时点为 (1,1,1)');
ok(T(1)[0] === 2 && T(1)[1] === 1 && T(1)[2] === 3, 'T3-10 切向量为 (2,1,3)');
// 数值验证切向量与曲线一致：用差商逼近
const sec = [(P(1 + h)[0] - P(1 - h)[0]) / (2 * h), (P(1 + h)[1] - P(1 - h)[1]) / (2 * h), (P(1 + h)[2] - P(1 - h)[2]) / (2 * h)];
ok(Math.abs(sec[0] - 2) < 1e-4 && Math.abs(sec[1] - 1) < 1e-9 && Math.abs(sec[2] - 3) < 1e-3,
  'T3-10 中心差商 ' + sec.map(v => v.toFixed(4)).join(',') + ' ≈ (2,1,3)，切向量自洽');
const sum310 = 2 * 1 + 1 * 1 + 3 * 1;
ok(sum310 === 6, 'T3-10 2x+y+3z 在 (1,1,1) 处取 ' + sum310 + ' → 法平面 2x+y+3z=6，d=6');
ok(byId('calc-orig-t3-10').answers.includes('6'), 'T3-10 answers 含 6');
// T3-11 表面积为 a² 的长方体最大体积 = √6/36 · a³（a=1 时用随机可行点验证上界）
const a = 1;
const Vmax = Math.sqrt(6) / 36 * Math.pow(a, 3);
let bound = true, samples = 0;
for (let i = 0; i < 3000; i++) {
  const x = 0.05 + Math.random() * 1.5, y = 0.05 + Math.random() * 1.5;
  const z = (0.5 * a * a - x * y) / (x + y); // 由 2(xy+yz+zx)=a² 解出 z
  if (z <= 0) continue;
  samples++;
  if (x * y * z > Vmax + 1e-12) { bound = false; break; }
}
console.log('    a=1 时 Vmax = ' + Vmax.toFixed(6) + '；随机可行点采样 ' + samples + ' 个');
ok(samples > 200, 'T3-11 随机采样到足够多的可行点（' + samples + ' 个）');
ok(bound, 'T3-11 所有随机可行点的体积均不超过 √6/36（上界成立）');
const eq = 1 / Math.sqrt(6);
ok(Math.abs(2 * (eq * eq * 3) - 1) < 1e-12, 'T3-11 等号点 x=y=z=1/√6 满足约束 2(xy+yz+zx)=1');
ok(Math.abs(eq * eq * eq - Vmax) < 1e-12, 'T3-11 等号点体积恰为 √6/36');
const at = byId('calc-orig-t3-11');
ok(typeof at.answerText === 'string' && /sqrt\{6\}|\\sqrt 6/.test(at.answerText + at.explain) && /36/.test(at.answerText + at.explain),
  'T3-11 参考答案与解析均给出 √6/36 · a³');

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
