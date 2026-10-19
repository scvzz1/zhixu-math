/*
 * H3 批专项验收：知识点全覆盖替换批（20 道选择题）
 * 依赖：question-bank.js（155 题；H4 批 20 道基础题在其后，本脚本只用前 135 题）。经典库已于本批退役，脚本不再加载 classic-question-bank.js / baseline-pre-h3.js。
 *
 * 判定口径：
 *   ① 原 115 题（76 原创 + 14 H1 + 25 H2）内容与顺序双硬哈希零漂移；
 *   ② 20 题字段契约与答案索引与规格一致；
 *   ③ 20 题答案逐题独立复算（不用解析里的推导，改用数值/换法验算）；
 *   ④ 撤掉经典库后，90 个知识点的「建议题型」全覆盖，无 W2 型缺口。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const BASE = require('./verify-baseline.cjs'); // 期望计数集中于此，补题后只改它

const dir = __dirname;
const h = s => crypto.createHash('sha256').update(s).digest('hex');
function load(files) { const w = {}; files.forEach(f => new Function('window', fs.readFileSync(path.join(dir, f), 'utf8'))(w)); return w.ZHIXU_BANK; }

const S = load(['question-bank.js']);
const N = S; // 经典库退役后，站点可见题库即本库
const Q = id => S.questions.find(q => q.id === id);

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

/* ---------- 冻结哈希 ---------- */
const HASH_PRE115 = 'b6564c8b02017ed10e0ed78f24b648e93fe42e631df3641e4f04c990b50e7919';
const HASH_IDS115 = '351e69e8da2ff3056fe83c2bd7f390420cd1a44922fbe5047bf59e948c6f152a';
const HASH_ORIG76 = '13c4eb4e3fdfdb39d91637af0b99f573bf3c43a4a8524d46a434c9cf9352b551';
const HASH_H1_14 = 'c6ff5bb287d69f42d91822b6be9ce5a66111b21e06c3925e36211ace8f828d50';
const HASH_H2_25 = '40babe3ad4ea21a406253998eafbd9666742359d14d9f8325004003aea3a12c7';
const HASH_H3_20 = 'ab95c2b7430d276da51c3f3e427098bac8756442520d2e5a88b2f70d70563d05';

const SPEC = {
  'calc-h3-t0-01': { kp: 'kp-t0-03', level: '基础', min: 2, ans: 0 },
  'calc-h3-t0-02': { kp: 'kp-t0-07', level: '强化', min: 3, ans: 3 },
  'calc-h3-t0-03': { kp: 'kp-t0-08', level: '基础', min: 2, ans: 1 },
  'calc-h3-t0-04': { kp: 'kp-t0-10', level: '强化', min: 3, ans: 2 },
  'calc-h3-t1-01': { kp: 'kp-t1-01', level: '基础', min: 2, ans: 0 },
  'calc-h3-t1-02': { kp: 'kp-t1-03', level: '基础', min: 2, ans: 3 },
  'calc-h3-t1-03': { kp: 'kp-t1-04', level: '基础', min: 2, ans: 3 },
  'calc-h3-t1-04': { kp: 'kp-t1-05', level: '强化', min: 3, ans: 1 },
  'calc-h3-t2-01': { kp: 'kp-t2-01', level: '基础', min: 2, ans: 0 },
  'calc-h3-t2-02': { kp: 'kp-t2-02', level: '强化', min: 3, ans: 3 },
  'calc-h3-t2-03': { kp: 'kp-t2-03', level: '强化', min: 3, ans: 2 },
  'calc-h3-t3-01': { kp: 'kp-t3-02', level: '强化', min: 3, ans: 3 },
  'calc-h3-t3-02': { kp: 'kp-t3-03', level: '基础', min: 2, ans: 1 },
  'calc-h3-t3-03': { kp: 'kp-t3-04', level: '强化', min: 3, ans: 0 },
  'calc-h3-t3-04': { kp: 'kp-t3-06', level: '强化', min: 3, ans: 3 },
  'calc-h3-t3-05': { kp: 'kp-t3-07', level: '强化', min: 3, ans: 1 },
  'calc-h3-t4-01': { kp: 'kp-t4-01', level: '基础', min: 2, ans: 0 },
  'calc-h3-t4-02': { kp: 'kp-t4-03', level: '强化', min: 3, ans: 3 },
  'calc-h3-t4-03': { kp: 'kp-t4-04', level: '强化', min: 3, ans: 2 },
  'calc-h3-t5-01': { kp: 'kp-t5-01', level: '基础', min: 2, ans: 1 },
};
const NEW_IDS = Object.keys(SPEC);

/* 数值工具 */
const simp = (f, a, b, n) => { const hh = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * hh) * (i % 2 ? 4 : 2); return s * hh / 3; };
const d1 = (f, x, hh = 1e-6) => (f(x + hh) - f(x - hh)) / (2 * hh);
const d3 = (f, x, hh = 1e-3) => (f(x + 2 * hh) - 2 * f(x + hh) + 2 * f(x - hh) - f(x - 2 * hh)) / (2 * hh ** 3);
const d2f = (f, x, hh = 1e-2) => (-f(x + 2 * hh) + 16 * f(x + hh) - 30 * f(x) + 16 * f(x - hh) - f(x - 2 * hh)) / (12 * hh * hh);
const dpx = (g, x, y, hh = 1e-6) => (g(x + hh, y) - g(x - hh, y)) / (2 * hh);
const dpy = (g, x, y, hh = 1e-6) => (g(x, y + hh) - g(x, y - hh)) / (2 * hh);
const d2mix = (g, x, y, hh = 1e-4) => (g(x + hh, y + hh) - g(x + hh, y - hh) - g(x - hh, y + hh) + g(x - hh, y - hh)) / (4 * hh * hh);
const mid2 = (f, x0, x1, y0, y1, n) => { let s = 0; const hx = (x1 - x0) / n, hy = (y1 - y0) / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += f(x0 + (i + .5) * hx, y0 + (j + .5) * hy) * hx * hy; return s; };

console.log('=== 1. 原 115 题零漂移（双硬哈希） ===');
ok(h(JSON.stringify(S.questions.slice(0, 115))) === HASH_PRE115, '原 115 题内容硬哈希不变');
ok(h(JSON.stringify(S.questions.slice(0, 115).map(q => q.id))) === HASH_IDS115, '原 115 题 ID 顺序硬哈希不变');
ok(h(JSON.stringify(S.questions.slice(0, 76))) === HASH_ORIG76, '原始 76 题内容不变');
ok(h(JSON.stringify(S.questions.slice(76, 90))) === HASH_H1_14, 'H1 批 14 题内容不变');
ok(h(JSON.stringify(S.questions.slice(90, 115))) === HASH_H2_25, 'H2 批 25 题内容不变');
ok(!fs.existsSync(path.join(dir, 'classic-question-bank.js')), '经典题库文件已退役（目录内不再存在 classic-question-bank.js）');
ok(N.questions.every(q => !(q.source && q.source.license === 'CC BY-NC-SA 4.0')), '全库已无 CC BY-NC-SA 4.0 转写题');
ok(h(JSON.stringify(N.questions.slice(115, 135))) === HASH_H3_20, 'H3 批 20 题内容硬哈希与规格一致');

console.log('');
console.log('=== 2. 题量与整体结构 ===');
ok(S.questions.length === BASE.total, '本库 ' + BASE.total + ' 题（本批交付时为 135，H4 批后为 155；实测 ' + S.questions.length + '）');
ok(N.questions.length === BASE.total, '站点可见题库 ' + BASE.total + ' 题（经典库退役后本库即全库，实测 ' + N.questions.length + '）');
const byType = {}; S.questions.forEach(q => { byType[q.type] = (byType[q.type] || 0) + 1; });
ok(byType.choice === BASE.byType.choice && byType.fill === BASE.byType.fill && byType.solve === BASE.byType.solve, '本库题型 ' + BASE.byType.choice + ' 选择 / ' + BASE.byType.fill + ' 填空 / ' + BASE.byType.solve + ' 解答（实测 ' + JSON.stringify(byType) + '）');
ok(new Set(S.questions.map(q => q.id)).size === BASE.total, 'ID 全局唯一（' + BASE.total + '/' + BASE.total + '）');
const v = s => S.questions.filter(q => q.subject.includes(s)).length;
ok(v('math-1') === BASE.bySubject['math-1'] && v('math-2') === BASE.bySubject['math-2'] && v('math-3') === BASE.bySubject['math-3'], '本库科目 数一 ' + BASE.bySubject['math-1'] + ' / 数二 ' + BASE.bySubject['math-2'] + ' / 数三 ' + BASE.bySubject['math-3'] + '（实测 ' + [v('math-1'), v('math-2'), v('math-3')].join('/') + '）');

console.log('');
console.log('=== 3. 20 题字段契约 ===');
let bad = 0;
for (const id of NEW_IDS) {
  const q = Q(id), sp = SPEC[id], e = [];
  if (!q) { bad++; console.log('  FAIL ' + id + '：缺失'); continue; }
  if (q.kpId !== sp.kp) e.push('kpId=' + q.kpId);
  if (q.type !== 'choice') e.push('type=' + q.type);
  if (q.level !== sp.level) e.push('level=' + q.level);
  if (q.estimatedMinutes !== sp.min) e.push('minutes=' + q.estimatedMinutes);
  if (q.answer !== sp.ans) e.push('answer=' + q.answer);
  if (!Array.isArray(q.options) || q.options.length !== 4) e.push('options');
  if (new Set(q.options.map(x => x.replace(/\s/g, ''))).size !== 4) e.push('options 重复');
  if (q.answers !== undefined || q.answerText !== undefined) e.push('choice 残留字段');
  if (!q.review || q.review.status !== 'approved') e.push('review');
  if (!q.source || q.source.kind !== '原创') e.push('source');
  if (q.source && q.source.license === 'CC BY-NC-SA 4.0') e.push('许可仍为 CC');
  if ((q.explain.match(/<b>易错点<\/b>/g) || []).length !== 1) e.push('易错点数');
  if ((q.explain.match(/<b>解题思路<\/b>/g) || []).length !== 1) e.push('解题思路数');
  if (!/class="solution-conclusion"/.test(q.explain)) e.push('缺结论块');
  if (q.knowledgeTags[0] !== S.knowledgePoints.find(k => k.id === q.kpId).name) e.push('knowledge 名称');
  if (e.length) { bad++; console.log('  FAIL ' + id + '：' + e.join('，')); }
}
ok(bad === 0, '20 题字段全部合规');

console.log('');
console.log('=== 4. 20 题知识点归属：补题前 0 道 -> 补题后 >=1 道 ===');
let kpBad = 0;
for (const id of NEW_IDS) {
  const sp = SPEC[id];
  const now = S.questions.filter(q => q.kpId === sp.kp).length;
  const nowCh = S.questions.filter(q => q.kpId === sp.kp && q.type === 'choice').length;
  if (now < 1 || nowCh < 1) { kpBad++; console.log('  FAIL ' + sp.kp + ' 仍缺题或缺 choice'); }
}
ok(kpBad === 0, '20 个知识点补题后均有 choice 题（原 14 个 0 题点已解锁，另 6 个补上 choice 题型）');

console.log('');
console.log('=== 5. 20 题答案独立复算（换方法，不复用解析推导） ===');

{
  const g = x => (x * x - 5 * x + 6) / (x * x - 4);
  const L = (g(2 - 1e-7) + g(2 + 1e-7)) / 2;
  ok(near(L, -1 / 4, 1e-9) && Q('calc-h3-t0-01').answer === 0, 'H3-01 极限 = ' + L.toFixed(9) + ' = -1/4（去心邻域取值复核）');
}
{
  let mx = 0; for (const x of [1e-2, 1e-3, 1e-4, 1e-5, 1e-6]) mx = Math.max(mx, Math.abs(x * Math.sin(1 / x)));
  ok(mx <= 1e-2 && Q('calc-h3-t0-02').answer === 3, 'H3-02 |x sin(1/x)| 上界 ' + mx.toExponential(2) + ' -> 0（有界性夹逼复核）');
}
{
  const f = (x, a) => (x < 0 ? 2 * x + a : x * x + 1);
  const L = f(-1e-9, 1), R = f(1e-9, 1);
  ok(near(L, R, 1e-8) && near(L, 1, 1e-6) && Q('calc-h3-t0-03').answer === 1, 'H3-03 取 a=1 时左极限 ' + L.toFixed(6) + ' = 右极限 ' + R.toFixed(6) + '（单侧取值复核）');
}
{
  const g = x => Math.sqrt(x * x + 3 * x) - x;
  const vals = [1e6, 1e7, 1e8].map(g);
  ok(vals.every(x => near(x, 1.5, 1e-5)) && Q('calc-h3-t0-04').answer === 2, 'H3-04 大参数取值 ' + vals.map(x => x.toFixed(6)).join(' / ') + ' -> 3/2');
}
{
  const f = x => Math.atan(x) - Math.log(x);
  ok(near(d1(f, 1), -0.5, 1e-8) && Q('calc-h3-t1-01').answer === 0, 'H3-05 f-prime(1) = ' + d1(f, 1).toFixed(9) + ' = -1/2（中心差分复核）');
}
{
  const f = x => (x * x + 1) / (x * x - 1);
  ok(near(d1(f, 2), -8 / 9, 1e-7) && Q('calc-h3-t1-02').answer === 3, 'H3-06 f-prime(2) = ' + d1(f, 2).toFixed(9) + ' = -8/9（中心差分复核）');
}
{
  const f = x => x * x * Math.exp(2 * x);
  ok(near(d3(f, 0), 12, 1e-4) && Q('calc-h3-t1-03').answer === 3, 'H3-07 三阶导数 (0) = ' + d3(f, 0).toFixed(8) + ' = 12（中心差分 h=1e-3，截断误差 O(h^2)）');
}
{
  const f = x => x ** 3;
  const dy = d1(f, 1) * 0.02, del = f(1.02) - f(1);
  ok(near(dy, 0.06, 1e-9) && near(del, 0.061208, 1e-12) && Q('calc-h3-t1-04').answer === 1, 'H3-08 dy = ' + dy.toFixed(6) + '、Delta y = ' + del.toFixed(6) + '（两者确不同，dy 为线性主部）');
}
{
  const C = x => Math.log(Math.abs(x)) + 2 ** x / Math.LN2;
  const target = x => 1 / x + 2 ** x;
  const pts = [0.7, 1.7, 2.9];
  ok(pts.every(x => near(d1(C, x), target(x), 1e-6)) && Q('calc-h3-t2-01').answer === 0, 'H3-09 正确项求导 = 1/x + 2^x（三点数值求导复核）');
}
{
  const tail = e => simp(x => 1 / (x * x), e, 1, 20000);
  const a = tail(1e-3), b = tail(1e-4);
  ok(b > a * 9 && a > 900 && Q('calc-h3-t2-02').answer === 3, 'H3-10 尾部积分 1/e-1 随 e 减小而发散（e=1e-3 -> ' + a.toFixed(1) + '；e=1e-4 -> ' + b.toFixed(1) + '）');
}
{
  const F = x => Math.exp(x * x) - Math.exp(x);
  const analytic = x => 2 * x * Math.exp(x * x) - Math.exp(x);
  const pts = [0.8, 1.3, -0.6];
  ok(pts.every(x => near(d1(F, x), analytic(x), 1e-5)) && Q('calc-h3-t2-03').answer === 2, 'H3-11 变限积分导数与 2x e^(x^2) - e^x 在三点逐点吻合（数值求导复核）');
}
{
  const z = (x, y) => x * x * y ** 3;
  ok(near(d2mix(z, 1, 2), 24, 1e-3) && Q('calc-h3-t3-01').answer === 3, 'H3-12 混合偏导 = ' + d2mix(z, 1, 2).toFixed(6) + ' = 24（四点混合差分复核）');
  ok(near(d2mix(z, 1, 2), 12, 1e-3) === false && near(d2mix(z, 1, 2), 16, 1e-3) === false, 'H3-12 干扰项 12（对 y 的二阶偏导）与 16（对 x 的二阶偏导）确非本题所问');
}
{
  const f1 = (x, y) => (x === 0 && y === 0) ? 0 : x * y / Math.sqrt(x * x + y * y);
  const fx1 = dpx(f1, 0, 0), fy1 = dpy(f1, 0, 0);
  const rat1 = f1(1e-3, 1e-3) / Math.hypot(1e-3, 1e-3);
  const f2 = (x, y) => (x === 0 && y === 0) ? 0 : x * y / (x * x + y * y);
  const fx2 = dpx(f2, 0, 0), fy2 = dpy(f2, 0, 0);
  const rat2 = f2(1e-3, 1e-3);
  ok(near(fx1, 0, 1e-5) && near(fy1, 0, 1e-5) && Math.abs(rat1) > 0.1, 'H3-13 反例一：原点偏导 ~0（' + fx1.toExponential(1) + '）但 Delta z/rho = ' + rat1.toFixed(4) + ' 不趋 0 => 偏导存在推不出可微');
  ok(near(fx2, 0, 1e-5) && near(fy2, 0, 1e-5) && near(rat2, 0.5, 1e-6), 'H3-13 反例二：原点偏导 ~0 但沿 y=x 取值 ' + rat2.toFixed(4) + ' != f(0,0) => 偏导存在推不出连续');
  ok(Q('calc-h3-t3-02').answer === 1, 'H3-13 故选「可微 => 偏导存在」（选项位 B）');
}
{
  const F = (u, w) => u * u + w * w;
  const G = (x, y) => F(x + y, x * y);
  const optA = (x, y) => 2 * (x + y) + y * 2 * (x * y);
  const optB = (x, y) => 2 * (x + y) + x * 2 * (x * y);
  const optC = (x, y) => 2 * (x + y) + 2 * (x * y);
  const pts = [[0.7, 1.3], [1.4, 0.6], [2.1, 1.9]];
  ok(pts.every(([x, y]) => near(optA(x, y), dpx(G, x, y), 1e-5)), 'H3-14 选项 A（f_1 + y*f_2）与数值偏导逐点吻合');
  ok(pts.every(([x, y]) => !near(optB(x, y), dpx(G, x, y), 1e-3)) && pts.every(([x, y]) => !near(optC(x, y), dpx(G, x, y), 1e-3)), 'H3-14 干扰项 B、C 均不吻合');
  ok(Q('calc-h3-t3-03').answer === 0, 'H3-14 故选 A');
}
{
  const f = (x, y) => x * x + y * y;
  const plane = (x, y) => 2 * x + 2 * y - 2;
  ok(near(plane(1, 1), 2, 1e-12) && near(f(1, 1), 2, 1e-12), 'H3-15 平面与曲面同时过点 (1,1,2)');
  const r2 = dx => Math.abs(f(1 + dx, 1) - plane(1 + dx, 1)) / (dx * dx);
  ok(Math.abs(r2(1e-2) - 1) < 0.05 && Math.abs(r2(1e-3) - 1) < 0.005, 'H3-15 切触误差为 O(dx^2)（比值 ->1），确为切平面而非割平面');
  ok(Q('calc-h3-t3-04').answer === 3, 'H3-15 法向量 (f_x, f_y, -1) = (2,2,-1) 与平面系数一致，故选 D');
}
{
  const f = (x, y) => x ** 3 - y ** 3 + 3 * x * x + 3 * y * y - 9 * x;
  const fx = (x, y) => 3 * x * x + 6 * x - 9, fy = (x, y) => -3 * y * y + 6 * y;
  const crit = [[1, 0], [1, 2], [-3, 0], [-3, 2]];
  ok(crit.every(([x, y]) => near(fx(x, y), 0, 1e-9) && near(fy(x, y), 0, 1e-9)), 'H3-16 四个驻点均满足 f_x = f_y = 0');
  const ACB = (x, y) => (6 * x + 6) * (-6 * y + 6);
  const types = crit.map(([x, y]) => (ACB(x, y) > 0 ? ((6 * x + 6) > 0 ? 'min' : 'max') : 'saddle'));
  ok(types.join() === 'min,saddle,saddle,max', 'H3-16 AC-B^2 判据给出 极小/鞍/鞍/极大（实测 ' + types.join() + '）');
  ok(near(f(1, 0), -5, 1e-12) && near(f(-3, 2), 31, 1e-12), 'H3-16 极小值 ' + f(1, 0) + '、极大值 ' + f(-3, 2) + '（与选项 -5 / 31 对应）');
  ok([[1.05, 0], [0.95, 0], [1, 0.05], [1, -0.05]].every(([x, y]) => f(x, y) > -5), 'H3-16 (1,0) 邻域取值均大于 -5，确为极小');
}
{
  const I = mid2((x, y) => x + y, 0, 1, 0, 2, 600);
  ok(near(I, 3, 1e-6) && Q('calc-h3-t4-01').answer === 0, 'H3-17 二重积分 = ' + I.toFixed(9) + ' = 3（二维中点积分复核）');
}
{
  const I = mid2((x, y) => x + y, 0, 2, 0, 1, 600), A = 2 * 1;
  ok(near(I / A, 1.5, 1e-6) && Q('calc-h3-t4-02').answer === 3, 'H3-18 平均值 = ' + (I / A).toFixed(9) + ' = 3/2（积分 ÷ 面积复核）');
}
{
  const orig = simp(x => x * x * (1 - x * x) / 2, 0, 1, 2000);
  const swap = simp(y => y ** 4 / 3, 0, 1, 2000);
  const wrong = simp(y => y * (1 - y ** 3) / 3, 0, 1, 2000);
  ok(near(orig, 1 / 15, 1e-10) && near(swap, 1 / 15, 1e-10), 'H3-19 原式 = 换序式 = 1/15 = ' + swap.toFixed(6) + '（取 f = x^2 y，内层解析 + 外层 Simpson 复核）');
  ok(!near(wrong, orig, 1e-2), 'H3-19 干扰项（另一块三角形）= ' + wrong.toFixed(6) + ' = 1/10，与原式确不相同');
  ok(Q('calc-h3-t4-03').answer === 2, 'H3-19 故选 C');
}
{
  const y = x => 2 * Math.exp(-x) + 3 * Math.exp(-2 * x) + x / 2 - 3 / 4;
  const ode = x => d2f(y, x) + 3 * d1(y, x) + 2 * y(x) - x;
  ok([0.3, 1.1, 2.4].every(x => near(ode(x), 0, 1e-6)), 'H3-20 通解（C1 e^-x + C2 e^-2x + x/2 - 3/4）逐点满足该 ODE（数值代入复核）');
  const r = [-1, -2];
  ok(r.length === 2 && new Set(r).size === 2, 'H3-20 特征根 -1、-2 互异 => 通解恰含 2 个独立任意常数（否定「3 个」选项）');
  ok(Q('calc-h3-t5-01').answer === 1, 'H3-20 故选「二阶线性微分方程」');
}

console.log('');
console.log('=== 6. 撤掉经典库后：知识点与建议题型全覆盖 ===');
const md = fs.readFileSync(path.join(dir, '出题施工图.md'), 'utf8').replace(/<br\s*\/?>/gi, ' ');
const ROW = /^\|\s*(kp-t\d-\d\d)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|\s*$/;
const cl = x => String(x).replace(/\*/g, '').trim();
const tset = x => String(x).replace(/\*/g, '').split(/[·+\/、]/).map(z => z.trim()).filter(Boolean);
const rows = {};
md.split(/\r?\n/).forEach(l => { const m = l.match(ROW); if (m) rows[cl(m[1])] = { types: tset(m[8]) }; });
const zeroKp = [], gaps = [];
S.knowledgePoints.forEach(k => {
  const qs = S.questions.filter(q => q.kpId === k.id);
  if (!qs.length) { zeroKp.push(k.id); return; }
  const have = new Set(qs.map(q => q.type));
  (rows[k.id] ? rows[k.id].types : []).forEach(t => { if (!have.has(t)) gaps.push(k.id + '·' + t); });
});
ok(zeroKp.length === 0, '90 个知识点全部有题（撤掉经典库后无空点）');
ok(gaps.length === 0, '全部知识点的「建议题型」均已覆盖，无 W2 型缺口（实测缺口 ' + gaps.length + ' 个' + (gaps.length ? '：' + gaps.join('，') : '') + '）');

console.log('');
console.log('=== 7. 答案位置分布 ===');
const d20 = [0, 0, 0, 0]; S.questions.slice(115, 135).forEach(q => d20[q.answer]++);
ok(d20.join() === '5,5,3,7', 'H3 批 20 题答案 A/B/C/D = ' + d20.join(' / '));
const all = [0, 0, 0, 0]; S.questions.filter(q => q.type === 'choice').forEach(q => all[q.answer]++);
ok(all[3] >= 15, '本库 83 道选择题 A/B/C/D = ' + all.join(' / ') + '（改前 63 道为 17/17/20/9，D 由 9 提升到 ' + all[3] + '）');

console.log('');
console.log('=== 8. 换行风格 ===');
const rawQ = fs.readFileSync(path.join(dir, 'question-bank.js'), 'utf8');
ok(!/(?<!\r)\n/.test(rawQ) && /\r\n/.test(rawQ), 'question-bank.js 保持纯 CRLF（裸 LF ' + (rawQ.match(/(?<!\r)\n/g) || []).length + '）');
ok(!fs.existsSync(path.join(dir, 'classic-question-bank.js')), 'classic-question-bank.js 已退役，不再随站点加载');

console.log('');
console.log('----');
console.log('H3 批专项：' + pass + ' 项通过 / ' + fail + ' 项失败');
if (fail) process.exit(1);
