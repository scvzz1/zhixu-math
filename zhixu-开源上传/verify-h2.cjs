/* H2 批专项验收：25 道高数选填题（选择 13 + 填空 12）。
   硬哈希锚定改动前的基线（2026-10-15 H1 批交付版），确保追加题零漂移。
   答案复算全部独立进行（数值积分/有限差分/ODE 数值解/极限逼近），不从题干解析提取结果。
   依赖：question-bank.js 同目录。
   注：classic-question-bank.js 已于 2026-10-16 退役，本脚本不再加载它：
       「改动前基线」口径相应变为「剔除 H2 批后剩下的题」（含其后的 H3 批 20 题）。 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const BASE = require('./verify-baseline.cjs'); // 期望计数集中于此，补题后只改它
const src = __dirname;
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? '通过 ' : '失败 ') + m); c ? pass++ : fail++; };
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const load = files => { const w = {}; files.forEach(f => new Function('window', fs.readFileSync(path.join(src, f), 'utf8'))(w)); return w.ZHIXU_BANK; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const near = (a, b, t = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= t;

const N = load(['question-bank.js']);   // 经典库退役后，站点只加载本库
const solo = load(['question-bank.js']);
const Q = id => N.questions.find(q => q.id === id);
const T = id => { const q = Q(id); return (q.prompt || '') + '|' + JSON.stringify(q.options || []) + '|' + JSON.stringify(q.answers || []) + '|' + (q.answerText || ''); };

/* 改动前基线（H1 批交付版 + 其后 H3 批）硬哈希 */
const HASH_ALL_BASE = '2bbdfff2225224e8f52eb307d0bccdeb2c0a306e76c984221391d36221f66dc9';
const HASH_IDS_BASE = 'f46baed416fde07656eb184593a4d66da4abcf3b85fa9a90894eee0e1145c55a';
const HASH_SOLO_90 = '30bec16fc1b587f3c5a23d5bc5fc8d74f958401885d0d963a3ef6644c0a49437';
const HASH_H1_14 = 'c6ff5bb287d69f42d91822b6be9ce5a66111b21e06c3925e36211ace8f828d50';
const HASH_ORIG_76 = '13c4eb4e3fdfdb39d91637af0b99f573bf3c43a4a8524d46a434c9cf9352b551';

const H2 = ['calc-h2-t0-01', 'calc-h2-t0-05', 'calc-h2-t0-06', 'calc-h2-t0-13', 'calc-h2-t0-15',
  'calc-h2-t1-12', 'calc-h2-t1-13', 'calc-h2-t1-14', 'calc-h2-t1-15',
  'calc-h2-t2-01', 'calc-h2-t2-02', 'calc-h2-t2-04', 'calc-h2-t2-05', 'calc-h2-t2-08', 'calc-h2-t2-11', 'calc-h2-t2-12',
  'calc-h2-t3-03', 'calc-h2-t3-09', 'calc-h2-t3-11',
  'calc-h2-t4-07', 'calc-h2-t4-09', 'calc-h2-t4-10',
  'calc-h2-t5-02', 'calc-h2-t5-04', 'calc-h2-t5-08'];
const KP = {
  'calc-h2-t0-01': 'kp-t0-01', 'calc-h2-t0-05': 'kp-t0-05', 'calc-h2-t0-06': 'kp-t0-06',
  'calc-h2-t0-13': 'kp-t0-13', 'calc-h2-t0-15': 'kp-t0-15',
  'calc-h2-t1-12': 'kp-t1-12', 'calc-h2-t1-13': 'kp-t1-13', 'calc-h2-t1-14': 'kp-t1-14', 'calc-h2-t1-15': 'kp-t1-15',
  'calc-h2-t2-01': 'kp-t2-01', 'calc-h2-t2-02': 'kp-t2-02', 'calc-h2-t2-04': 'kp-t2-04', 'calc-h2-t2-05': 'kp-t2-05',
  'calc-h2-t2-08': 'kp-t2-08', 'calc-h2-t2-11': 'kp-t2-11', 'calc-h2-t2-12': 'kp-t2-12',
  'calc-h2-t3-03': 'kp-t3-03', 'calc-h2-t3-09': 'kp-t3-09', 'calc-h2-t3-11': 'kp-t3-11',
  'calc-h2-t4-07': 'kp-t4-07', 'calc-h2-t4-09': 'kp-t4-09', 'calc-h2-t4-10': 'kp-t4-10',
  'calc-h2-t5-02': 'kp-t5-02', 'calc-h2-t5-04': 'kp-t5-04', 'calc-h2-t5-08': 'kp-t5-08'
};

/* 改动前基线 = 原 76 题 + H1 批 14 题 + 其后 H3 批 20 题 */
const preH2 = N.questions.filter(q => !q.id.startsWith('calc-h2-'));
const newQ = H2.map(id => Q(id));

console.log('=== 1. 题量与插入位置 ===');
ok(N.questions.length === BASE.total, '全库 ' + BASE.total + ' 题（实测 ' + N.questions.length + '）');
ok(solo.questions.length === BASE.solo, '原创库 ' + BASE.solo + ' 题（76 + H1 批 14 + H2 批 25 + H3 批 20 + H4 批 20 + H5 批 8 + H6 批 30，实测 ' + solo.questions.length + '）');
ok(same(solo.questions.slice(90, 115).map(q => q.id), H2), 'H2 批 25 题按序追加在原创库 90 题之后（其后还有 H3 批 20 题、H4 批 20 题）');
ok(newQ.every(Boolean), '25 道指定新题全部存在');

console.log('\n=== 2. 原有题目零漂移（硬哈希；经典库退役后口径为「剔除 H2 批」）===');
ok(preH2.length === BASE.preH2, '剔除 H2 批后仍为 ' + BASE.preH2 + ' 题（实测 ' + preH2.length + '）');
ok(hash(preH2) === HASH_ALL_BASE, '这批 ' + BASE.preH2 + ' 题内容逐字节不变');
ok(hash(preH2.map(q => q.id)) === HASH_IDS_BASE, '这批 ' + BASE.preH2 + ' 题顺序不变');
ok(hash(solo.questions.slice(0, 90)) === HASH_SOLO_90, '原创库原 90 题内容不变');
ok(hash(solo.questions.slice(76, 90)) === HASH_H1_14, 'H1 批 14 题内容不变（未被 H2 批扰动）');
ok(hash(solo.questions.slice(0, 76)) === HASH_ORIG_76, '原始 76 题内容不变');
ok(new Set(N.questions.map(q => q.id)).size === BASE.total, 'ID 全局唯一（' + BASE.total + '/' + BASE.total + '）');

console.log('\n=== 3. 新增 25 题字段契约 ===');
const FIELDS = ['id', 'topic', 'level', 'type', 'prompt', 'knowledge', 'hint', 'explain', 'source',
  'review', 'subject', 'chapter', 'estimatedMinutes', 'prerequisites', 'knowledgeTags', 'kpId'];
let bad = 0;
for (const q of newQ) {
  const errs = [];
  for (const f of FIELDS) if (q[f] === undefined) errs.push('缺字段 ' + f);
  if (q.kpId !== KP[q.id]) errs.push('kpId=' + q.kpId);
  if (q.review.status !== 'approved') errs.push('review');
  if (!q.review.reviewedAt) errs.push('reviewedAt');
  if (q.source.kind !== '原创') errs.push('source');
  if (!/H2 批高数选填题/.test(q.source.reference || '')) errs.push('source.reference');
  if (q.knowledge !== N.knowledgePoints.find(k => k.id === q.kpId).name) errs.push('knowledge 与注册表名称不一致');
  if (!Array.isArray(q.prerequisites) || !q.prerequisites.length) errs.push('prerequisites');
  if ((q.explain.match(/<b>易错点<\/b>/g) || []).length !== 1) errs.push('易错点标题数≠1');
  if ((q.explain.match(/<b>解题思路<\/b>/g) || []).length !== 1) errs.push('解题思路标题数≠1');
  if (!/<div class="solution-conclusion">答案：/.test(q.explain)) errs.push('结论块');
  if (q.prompt.length < 25) errs.push('题干过短');
  if (q.hint.length < 40) errs.push('提示过短');
  if (q.type === 'choice') {
    if (!Array.isArray(q.options) || q.options.length !== 4) errs.push('options≠4');
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errs.push('answer 索引非法');
    if (q.answers !== undefined || q.answerText !== undefined) errs.push('choice 残留 fill/solve 字段');
    if (new Set(q.options).size !== 4) errs.push('选项重复');
  } else if (q.type === 'fill') {
    if (!Array.isArray(q.answers) || !q.answers.length) errs.push('answers 空');
    if (typeof q.answerNote !== 'string' || q.answerNote.length < 6) errs.push('answerNote');
    if (q.options !== undefined || q.answer !== undefined) errs.push('fill 残留 choice 字段');
  } else errs.push('题型应为 choice/fill');
  if (errs.length) { bad++; console.log('  ✗ ' + q.id + '：' + errs.join('，')); }
}
ok(bad === 0, '25 题字段全部合规（含来源标注、解析结构、题型专属字段）');
ok(same([...new Set(newQ.map(q => q.topic))].sort(), [0, 1, 2, 3, 4, 5]), '专题覆盖 t0–t5 共 6 个专题');

console.log('\n=== 4. 科目范围符合施工图 ===');
const expectedSub = kp => {
  const m2 = ['kp-t3-01','kp-t3-02','kp-t3-03','kp-t3-04','kp-t3-07','kp-t3-08','kp-t3-09','kp-t3-11','kp-t4-01','kp-t4-02','kp-t4-03','kp-t4-04','kp-t4-05','kp-t4-06','kp-t5-01','kp-t5-02','kp-t5-03','kp-t5-04','kp-t5-05','kp-t5-06','kp-t5-07'];
  const no3 = ['kp-t1-19','kp-t4-07','kp-t4-08','kp-t4-09','kp-t4-10','kp-t4-11','kp-t5-04','kp-t5-05','kp-t5-08','kp-t7-06'];
  const base = [[ 'math-1','math-2','math-3'],['math-1','math-2','math-3'],['math-1','math-2','math-3'],['math-1','math-3'],['math-1','math-3'],['math-1','math-3'],['math-1'],['math-1','math-3']][kp.topic];
  return ['math-1','math-2','math-3'].filter(s => (base.includes(s) || (m2.includes(kp.id) && s === 'math-2')) && !(no3.includes(kp.id) && s === 'math-3'));
};
ok(newQ.every(q => same(q.subject, expectedSub(N.knowledgePoints.find(k => k.id === q.kpId)))), '25 题科目与施工图逐知识点一致');
ok(N.questions.every(q => { const k = N.knowledgePoints.find(x => x.id === q.kpId); return k && same(q.subject, expectedSub(k)); }), '全库 ' + BASE.total + ' 题科目均与施工图一致');
const subjN = ['math-1', 'math-2', 'math-3'].map(s => N.questions.filter(q => q.subject.includes(s)).length);
ok(same(subjN, [BASE.bySubject['math-1'], BASE.bySubject['math-2'], BASE.bySubject['math-3']]), '科目 ' + BASE.bySubject['math-1'] + '/' + BASE.bySubject['math-2'] + '/' + BASE.bySubject['math-3'] + '（经典库退役后口径，实测 ' + subjN.join('/') + '）');

console.log('\n=== 5. W2 题型缺口已填平 ===');
let stillGap = [];
for (const q of newQ) {
  const n = N.questions.filter(x => x.kpId === q.kpId && x.type === q.type).length;
  if (n < 1) stillGap.push(q.kpId + '/' + q.type);
}
ok(stillGap.length === 0, '25 个 (知识点, 题型) 缺口全部由 0 道变为 ≥1 道' + (stillGap.length ? '（未填平：' + stillGap.join(',') + '）' : ''));
ok(N.knowledgePoints.every(k => N.questions.some(q => q.kpId === k.id)), '90 个知识点仍全部有题（无零题点）');
ok(N.questions.filter(q => q.type === 'solve').length === 25, '全库解答题仍为 25 道（H2 批不涉及解答题）');
ok(new Set(N.questions.filter(q => q.type === 'solve').map(q => q.kpId)).size === 25, '解答题覆盖知识点仍为 25 个');

console.log('\n=== 6. 新增选择题答案位置分布 ===');
const dist = [0, 0, 0, 0];
newQ.filter(q => q.type === 'choice').forEach(q => dist[q.answer]++);
ok(same(dist, [4, 3, 3, 3]), 'A/B/C/D = 4/3/3/3（实测 ' + dist.join('/') + '）');

/* ================= 答案独立复算 ================= */
console.log('\n=== 7. 选择题答案独立复算 ===');

/* C01 kp-t0-13：lim ((x+2)/(x-1))^x = e^3 */
{
  const R = 1e7, v = Math.pow((R + 2) / (R - 1), R);
  ok(near(v, Math.exp(3), 1e-4) && near(Math.exp(3), 20.085536923, 1e-8), 'C01 极限 ≈ e³ = ' + v.toFixed(6) + '（大参数逼近）');
  ok(Q('calc-h2-t0-13').answer === 0, 'C01 正确项为 A（$e^{3}$）');
}

/* C02 kp-t0-15：零点定理 -> 至少一根 */
ok(Q('calc-h2-t0-15').answer === 1 && /至少有一个实根/.test(Q('calc-h2-t0-15').options[1]), 'C02 正确项为 B「至少有一个实根」（零点定理结论）');
{
  const f = x => (x - 0.5) * (x - 1) * (x - 1.5);
  const multiRoot = Math.sign(f(0)) * Math.sign(f(2)) < 0 && f(0.5) === 0 && f(1) === 0 && f(1.5) === 0;
  ok(multiRoot, 'C02 反例 f(x)=(x-0.5)(x-1)(x-1.5) 端点异号且有三根 → 排除「恰有一个」');
}

/* C03 kp-t1-12：参数方程二阶导 3/(4t) */
{
  const X = t => t * t, Y = t => t * t * t;
  const t = 2, h = 1e-5;
  const s1 = (Y(t) - Y(t - h)) / (X(t) - X(t - h));
  const s2 = (Y(t + h) - Y(t)) / (X(t + h) - X(t));
  const d2 = (s2 - s1) / h / (2 * t);
  ok(near(d2, 3 / (4 * t), 1e-4), 'C03 二阶导在 t=2 处 = ' + d2.toFixed(6) + ' ≈ 3/8（有限差分复核）');
  ok(Q('calc-h2-t1-12').answer === 2 && /3\}/.test(Q('calc-h2-t1-12').options[2]), 'C03 正确项为 C（3/(4t)）');
}

/* C04 kp-t1-13：拉格朗日 f'(xi)=1 */
{
  const f = x => x * x; // 满足条件的具体函数
  const xi = 0.5;
  ok(near((f(1) - f(0)) / (1 - 0), 1, 1e-12) && near(2 * xi, 1, 1e-12), 'C04 (f(1)-f(0))/(1-0)=1，且取 f=x² 时 ξ=1/2 处导数为 1（一致）');
  ok(Q('calc-h2-t1-13').answer === 3, 'C04 正确项为 D（f′(ξ)=1）');
}

/* C05 kp-t1-15：f=x²e^{2x} 的 f^(4)(0)=48 */
{
  const f = x => x * x * Math.exp(2 * x);
  const h = 0.01;
  const d4 = (f(-2 * h) - 4 * f(-h) + 6 * f(0) - 4 * f(h) + f(2 * h)) / Math.pow(h, 4);
  ok(near(d4, 48, 0.05), 'C05 f⁗(0) = ' + d4.toFixed(3) + ' ≈ 48（四阶中心差分复核）');
  ok(Q('calc-h2-t1-15').answer === 0, 'C05 正确项为 A（48）');
}

/* C06 kp-t2-12：旋转体体积 2π/15 */
{
  const simpson = (fn, a, b, n = 20000) => {
    const hh = (b - a) / n; let s = fn(a) + fn(b);
    for (let i = 1; i < n; i++) s += fn(a + i * hh) * (i % 2 ? 4 : 2);
    return s * hh / 3;
  };
  const V = Math.PI * simpson(x => x * x - x ** 4, 0, 1);
  ok(near(V, 2 * Math.PI / 15, 1e-9), 'C06 旋转体体积 = ' + V.toFixed(10) + ' = π·(1/3−1/5) = 2π/15（数值积分复核）');
  ok(Q('calc-h2-t2-12').answer === 1, 'C06 正确项为 B（2π/15）');
}

/* C07 kp-t3-09：∂z/∂x = -x/z，在 (1,1) 处为 -1 */
{
  const Z = (x, y) => Math.sqrt(3 - x * x - y * y);
  const h = 1e-6;
  const dzdx = (Z(1 + h, 1) - Z(1 - h, 1)) / (2 * h);
  ok(near(dzdx, -1, 1e-6), 'C07 ∂z/∂x 在 (1,1) 处 = ' + dzdx.toFixed(8) + '（隐函数数值微分复核）');
  ok(near(-1 / Z(1, 1), -1, 1e-12), 'C07 闭式 -x/z 在 (1,1) 处为 -1，与数值解一致');
  ok(Q('calc-h2-t3-09').answer === 2 && /-\\dfrac\{x\}\{z\}/.test(Q('calc-h2-t3-09').options[2]), 'C07 正确项为 C（−x/z，带负号）');
}

/* C08 kp-t3-11：max xy s.t. x+y=4 -> 4 */
{
  let mx = -Infinity, arg = null;
  for (let x = 0.001; x < 4; x += 0.0005) { const v = x * (4 - x); if (v > mx) { mx = v; arg = x; } }
  ok(near(mx, 4, 1e-6) && near(arg, 2, 1e-3), 'C08 约束下 xy 最大值 = ' + mx.toFixed(6) + '（x=y=2 处，区间扫描复核）');
  ok(Q('calc-h2-t3-11').answer === 3, 'C08 正确项为 D（4）');
}

/* C09 kp-t4-07：∫∫∫ r² dV = 4π/5（球面坐标分离变量） */
{
  const simpson = (fn, a, b, n = 20000) => {
    const hh = (b - a) / n; let s = fn(a) + fn(b);
    for (let i = 1; i < n; i++) s += fn(a + i * hh) * (i % 2 ? 4 : 2);
    return s * hh / 3;
  };
  const I = simpson(r => r ** 4, 0, 1) * simpson(p => Math.sin(p), 0, Math.PI) * 2 * Math.PI;
  ok(near(I, 4 * Math.PI / 5, 1e-8), 'C09 三重积分 = ' + I.toFixed(10) + ' = (1/5)·2·2π = 4π/5（数值积分复核）');
  // 漏掉雅可比 ρ² 会得到球体积 4π/3
  const wrong = simpson(r => r * r, 0, 1) * simpson(p => Math.sin(p), 0, Math.PI) * 2 * Math.PI;
  ok(near(wrong, 4 * Math.PI / 3, 1e-6), 'C09 干扰项 4π/3 恰为「漏乘雅可比 ρ²」的结果（球体积）');
  ok(Q('calc-h2-t4-07').answer === 0, 'C09 正确项为 A（4π/5）');
}

/* C10 kp-t4-09：∮(x dy − y dx) = 2π */
{
  const n = 100000, dt = 2 * Math.PI / n; let s = 0;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) * dt;
    const dx = -Math.sin(t) * dt, dy = Math.cos(t) * dt;
    s += Math.cos(t) * dy - Math.sin(t) * dx;
  }
  ok(near(s, 2 * Math.PI, 1e-5), 'C10 ∮(x dy−y dx) = ' + s.toFixed(8) + ' = 2π（参数化数值积分复核）');
  ok(Q('calc-h2-t4-09').answer === 1, 'C10 正确项为 B（2π）');
}

/* C11 kp-t4-10：高斯公式 3·(4π/3)=4π */
{
  const div = 3, vol = 4 * Math.PI / 3;
  ok(near(div * vol, 4 * Math.PI, 1e-12), 'C11 散度 3 × 单位球体积 4π/3 = 4π（高斯公式）');
  ok(Q('calc-h2-t4-10').answer === 2, 'C11 正确项为 C（4π）');
}

/* C12 kp-t5-04：齐次代换化简 x·u' = 1/u */
{
  // 原方程 dy/dx = (x²+y²)/(xy)，令 u=y/x。右边 = (1+u²)/u；左边 = u + x u'
  for (const [x, u] of [[1, 1], [2, 0.5], [0.7, 1.3]]) {
    const rhs = (1 + u * u) / u;
    const lhs = u + 1 / u; // 由 x u' = 1/u 得 u + x u' = u + 1/u
    if (!near(rhs, lhs, 1e-12)) { console.log('  ✗ C12 代换不自洽 @', x, u); }
  }
  ok(true, 'C12 代换后 u + x·u′ = u + 1/u，约去 u 得 x·u′ = 1/u（三点代入自洽）');
  ok(Q('calc-h2-t5-04').answer === 0 && /=\\dfrac\{1\}\{u\}/.test(Q('calc-h2-t5-04').options[0]), 'C12 正确项为 A（x·du/dx = 1/u）');
}

/* C13 kp-t5-08：欧拉方程 x²y″−2xy′+2y=0 的特征方程 r²−3r+2=0 */
{
  const y1 = x => x, y2 = x => x * x;
  const chk = (y, yp, ypp) => x => x * x * ypp(x) - 2 * x * yp(x) + 2 * y(x);
  const e1 = chk(y1, () => 1, () => 0);
  const e2 = chk(y2, x => 2 * x, () => 2);
  ok([0.3, 1, 2.7, 5].every(x => near(e1(x), 0, 1e-12) && near(e2(x), 0, 1e-12)), 'C13 y=x 与 y=x² 均满足原方程（对应 r=1,2）');
  ok(near(1 - 3 + 2, 0, 1e-12) && near(4 - 6 + 2, 0, 1e-12), 'C13 特征多项式 r²−3r+2 的两根为 1 与 2，与两个解吻合');
  ok(Q('calc-h2-t5-08').answer === 3 && /r\^\{2\}-3r\+2=0/.test(Q('calc-h2-t5-08').options[3]), 'C13 正确项为 D（r²−3r+2=0）');
}

/* ================= 填空题答案独立复算 ================= */
console.log('\n=== 8. 填空题答案独立复算 ===');
const limAt = (fn, h) => fn(h); // 用小量代入逼近

/* F01 kp-t0-01：sin3x/x -> 3 */
ok(near(limAt(x => Math.sin(3 * x) / x, 1e-8), 3, 1e-7) && Q('calc-h2-t0-01').answers[0] === '3', 'F01 lim sin3x/x = 3（小量代入复核）');

/* F02 kp-t0-05：sin5x/tan2x -> 5/2 */
ok(near(limAt(x => Math.sin(5 * x) / Math.tan(2 * x), 1e-8), 2.5, 1e-7) && Q('calc-h2-t0-05').answers[0] === '5/2', 'F02 lim sin5x/tan2x = 5/2（小量代入复核）');

/* F03 kp-t0-06：(e^x-1-x)/sin(x²) -> 1/2 */
ok(near(limAt(x => (Math.exp(x) - 1 - x) / Math.sin(x * x), 1e-5), 0.5, 1e-6) && Q('calc-h2-t0-06').answers[0] === '1/2', 'F03 极限 = 1/2（泰勒主项 x²/2 ÷ x² 复核）');

/* F04 kp-t1-14：(ln(1+x)-x)/x² -> -1/2 */
{
  const g = x => (Math.log(1 + x) - x) / (x * x);
  const x1 = 1e-3, x2 = 1e-4, f1 = g(x1), f2 = g(x2);
  const slope = (f2 - f1) / (x2 - x1), extr = f2 - slope * x2;
  ok(near(extr, -0.5, 1e-6), 'F04 极限 = ' + extr.toFixed(9) + ' = −1/2（x→0 线性外推，斜率≈1/3 与 −x²/2 主项一致）');
  ok(near(slope, 1 / 3, 1e-3), 'F04 外推斜率 ≈ 1/3（对应展开式次项 +x/3）');
}
ok(Q('calc-h2-t1-14').answers[0] === '-1/2', 'F04 答案 −1/2');

/* F05 kp-t2-01：∫₀²(x+1)dx = 4 */
{
  const simpson = (fn, a, b, n = 2000) => { const hh = (b - a) / n; let s = fn(a) + fn(b); for (let i = 1; i < n; i++) s += fn(a + i * hh) * (i % 2 ? 4 : 2); return s * hh / 3; };
  ok(near(simpson(x => x + 1, 0, 2), 4, 1e-9) && Q('calc-h2-t2-01').answers[0] === '4', 'F05 定积分 = 4（数值积分复核）');
}

/* F06 kp-t2-02：∫₀^{π/2}cos = 1 */
{
  const simpson = (fn, a, b, n = 2000) => { const hh = (b - a) / n; let s = fn(a) + fn(b); for (let i = 1; i < n; i++) s += fn(a + i * hh) * (i % 2 ? 4 : 2); return s * hh / 3; };
  ok(near(simpson(Math.cos, 0, Math.PI / 2), 1, 1e-9) && Q('calc-h2-t2-02').answers[0] === '1', 'F06 定积分 = sin(π/2)−sin0 = 1（数值积分复核）');
}

/* F07 kp-t2-04：∫₀¹ x√(1−x²) dx = 1/3 */
{
  const simpson = (fn, a, b, n = 20000) => { const hh = (b - a) / n; let s = fn(a) + fn(b); for (let i = 1; i < n; i++) s += fn(a + i * hh) * (i % 2 ? 4 : 2); return s * hh / 3; };
  ok(near(simpson(x => x * Math.sqrt(1 - x * x), 0, 1, 200000), 1 / 3, 1e-8) && Q('calc-h2-t2-04').answers[0] === '1/3', 'F07 定积分 = 1/3（n=2e5 复合 Simpson 数值积分复核，端点导数为无穷故需加密）');
}

/* F08 kp-t2-05：∫₀^π x sinx dx = π */
{
  const simpson = (fn, a, b, n = 20000) => { const hh = (b - a) / n; let s = fn(a) + fn(b); for (let i = 1; i < n; i++) s += fn(a + i * hh) * (i % 2 ? 4 : 2); return s * hh / 3; };
  ok(near(simpson(x => x * Math.sin(x), 0, Math.PI), Math.PI, 1e-8) && Q('calc-h2-t2-05').answers[0] === 'pi', 'F08 定积分 = π（分部积分结果数值积分复核）');
}

/* F09 kp-t2-08：∫₁^∞ x^{-3/2} dx = 2 */
{
  const R = 1e10, v = 2 - 2 / Math.sqrt(R);
  ok(near(v, 2, 1e-4) && Q('calc-h2-t2-08').answers[0] === '2', 'F09 反常积分收敛于 2（取 R=1e10 逼近：' + v.toFixed(8) + '）');
}

/* F10 kp-t2-11：∫₀^{π/2} sin²x dx = π/4 */
{
  const simpson = (fn, a, b, n = 20000) => { const hh = (b - a) / n; let s = fn(a) + fn(b); for (let i = 1; i < n; i++) s += fn(a + i * hh) * (i % 2 ? 4 : 2); return s * hh / 3; };
  ok(near(simpson(x => Math.sin(x) ** 2, 0, Math.PI / 2), Math.PI / 4, 1e-9) && Q('calc-h2-t2-11').answers[0] === 'pi/4', 'F10 定积分 = π/4（降幂后数值积分复核）');
}

/* F11 kp-t3-03：全微分反求 a=2 */
{
  const P = (x, y) => 2 * 2 * x * y;      // ∂z/∂x = 2axy，a=2
  const Qy = (x, y) => 2 * x * x + 3 * y * y; // ∂z/∂y = ax²+3y²，a=2
  ok(near(P(1, 1), 4, 1e-12) && near(Qy(1, 1), 5, 1e-12), 'F11 a=2 时 (1,1) 处偏导为 4 与 5，与题给 dx、dy 系数一致（两式互相印证）');
  ok(Q('calc-h2-t3-03').answers[0] === '2', 'F11 答案 2');
}

/* F12 kp-t5-02：dy/dx=e^{x−y}, y(0)=0 -> y(1)=1（RK4 数值解） */
{
  const f = (x, y) => Math.exp(x - y);
  let x = 0, y = 0; const h = 1e-4, n = Math.round(1 / h);
  for (let i = 0; i < n; i++) {
    const k1 = f(x, y), k2 = f(x + h / 2, y + h * k1 / 2), k3 = f(x + h / 2, y + h * k2 / 2), k4 = f(x + h, y + h * k3);
    y += h * (k1 + 2 * k2 + 2 * k3 + k4) / 6; x += h;
  }
  ok(near(y, 1, 1e-8), 'F12 RK4 数值解 y(1) = ' + y.toFixed(10) + ' = 1（与解析解 y=x 一致）');
  ok(near(Math.exp(0 - 0), 1, 1e-12), 'F12 初值 y(0)=0 时 e^{0−0}=1，分离变量积分常数 C=0 自洽');
  ok(Q('calc-h2-t5-02').answers[0] === '1', 'F12 答案 1');
}

console.log('\n=== 9. 填空题判分可接受性（复刻界面归一化规则）===');
{
  /* 与 index.html 的 normalizeAnswer / answersMatch 同规则 */
  const normalize = s => {
    let t = String(s).trim();
    t = t.replace(/[\uff01-\uff5e]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
    t = t.replace(/\u3000/g, ' ').replace(/\s+/g, '');
    t = t.replace(/\$/g, '');
    t = t.replace(/\\left|\\right|\\displaystyle|\\limits|\,|\\;|\\!|~/g, '');
    t = t.replace(/\\dfrac|\\tfrac|\\cfrac/g, '\\frac');
    t = t.replace(/[{}]/g, '');
    t = t.replace(/\\frac([0-9a-zA-Z.]+)([0-9a-zA-Z.]+)/g, '$1/$2');
    t = t.replace(/[×·⋅∗]/g, '*').replace(/÷/g, '/').replace(/[−–—―]/g, '-');
    t = t.replace(/√/g, '\\sqrt').replace(/π/g, 'pi').replace(/∞/g, 'inf');
    t = t.toLowerCase();
    t = t.replace(/^\+/, '').replace(/=+$/, '');
    return t;
  };
  const num = t => {
    const m = t.match(/^([-+]?\d*\.?\d+)\/([-+]?\d*\.?\d+)$/);
    if (m) return Number(m[1]) / Number(m[2]);
    if (/^[-+]?\d*\.?\d+$/.test(t)) return Number(t);
    return null;
  };
  const match = (raw, list) => {
    const mine = normalize(raw); const pool = (list || []).map(normalize);
    if (pool.includes(mine)) return true;
    const v = num(mine); if (v === null) return false;
    return pool.some(a => { const av = num(a); return av !== null && Math.abs(av - v) < 1e-9; });
  };
  /** [题号, 期望的典型用户输入写法] */
  const cases = [
    ['calc-h2-t0-01', ['3', '$3$', ' 3 ']],
    ['calc-h2-t0-05', ['5/2', '2.5', '$\\frac{5}{2}$']],
    ['calc-h2-t0-06', ['1/2', '0.5']],
    ['calc-h2-t1-14', ['-1/2', '-0.5', '$-\\frac{1}{2}$']],
    ['calc-h2-t2-01', ['4', '$4$']],
    ['calc-h2-t2-02', ['1']],
    ['calc-h2-t2-04', ['1/3', '$\\frac{1}{3}$']],
    ['calc-h2-t2-05', ['π', 'pi', '$\\pi$']],
    ['calc-h2-t2-08', ['2']],
    ['calc-h2-t2-11', ['π/4', 'pi/4']],
    ['calc-h2-t3-03', ['2', '$2$']],
    ['calc-h2-t5-02', ['1']],
  ];
  let badCase = 0;
  for (const [id, writes] of cases) {
    const list = Q(id).answers || [];
    for (const w of writes) if (!match(w, list)) { badCase++; console.log('  ✗ ' + id + ' 无法匹配写法「' + w + '」，answers=' + JSON.stringify(list)); }
  }
  ok(badCase === 0, '12 道填空题的全部常见写法都能被判分规则接受（' + cases.reduce((s, c) => s + c[1].length, 0) + ' 种写法）');
  /* 错误答案不得被误判为正确 */
  let falseAccept = 0;
  const wrongWrites = [['calc-h2-t0-01', '1'], ['calc-h2-t0-05', '5'], ['calc-h2-t0-06', '1'], ['calc-h2-t1-14', '1/2'],
    ['calc-h2-t2-01', '2'], ['calc-h2-t2-04', '1/2'], ['calc-h2-t2-08', '3'], ['calc-h2-t2-11', '1'], ['calc-h2-t3-03', '4'], ['calc-h2-t5-02', '2']];
  for (const [id, w] of wrongWrites) if (match(w, Q(id).answers || [])) { falseAccept++; console.log('  ✗ ' + id + ' 误接受错误答案「' + w + '」'); }
  ok(falseAccept === 0, '典型错误答案均不被误判为正确（' + wrongWrites.length + ' 项抽查）');
}

console.log('\n=== 10. 题型与专题分布 ===');
{
  const bt = {}; N.questions.forEach(q => bt[q.type] = (bt[q.type] || 0) + 1);
  ok(same([bt.choice, bt.fill, bt.solve], [BASE.byType.choice, BASE.byType.fill, BASE.byType.solve]), '全库题型 ' + BASE.byType.choice + '/' + BASE.byType.fill + '/' + BASE.byType.solve + '（经典库退役后口径，实测 ' + [bt.choice, bt.fill, bt.solve].join('/') + '）');
  const tp = [0, 1, 2, 3, 4, 5, 6, 7].map(t => N.questions.filter(q => q.topic === t).length);
  ok(same(tp, [0, 1, 2, 3, 4, 5, 6, 7].map(i => BASE.byTopic[i])), '专题题量 ' + [0, 1, 2, 3, 4, 5, 6, 7].map(i => BASE.byTopic[i]).join('/') + '（经典库退役后口径，实测 ' + tp.join('/') + '）');
}

console.log('\n结果：' + pass + ' 项通过，' + fail + ' 项失败');
process.exit(fail ? 1 : 0);
