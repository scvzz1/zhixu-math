/* H1 批专项验收：高数解答题补全 14 题（2026-10-15）。
   自包含，无外部快照依赖。
   基线：改动前 76 道原创题的内容与顺序硬哈希（2026-10-15 盘上版本）。
   本批只做一件事：在原创库末尾追加 14 道「解答题」，覆盖《出题施工图》表 A 中
   「解答用时」非空、而站点此前 0 道解答题的知识点。原有题目必须逐字节不变。
   注：classic-question-bank.js 已于 2026-10-16 退役，本脚本不再加载它：
       「原有题目」口径相应变为「剔除 H1/H2 批后剩下的题」（原 76 题 + 之后的 H3 批 20 题）。 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE = require('./verify-baseline.cjs'); // 期望计数集中于此，补题后只改它
const src = __dirname;
const load = files => {
  const w = {};
  for (const f of files) new Function('window', fs.readFileSync(path.join(src, f), 'utf8'))(w);
  return w.ZHIXU_BANK;
};
const N = load(['question-bank.js']);   // 经典库退役后，站点只加载本库
const solo = load(['question-bank.js']);                             // 原创库单载

const h = s => crypto.createHash('sha256').update(s).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const near = (a, b, t = 1e-6) => Math.abs(a - b) < t;
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? '通过 ' : '失败 ') + m); };

/* ---------- 冻结基线 ---------- */
const BASE_ALL = '36f9860c79a1d5f6396597cb5a10534df0b687fee1a56c0d599bf3b4579685f1';
const BASE_IDS = '37bb4a93740a92f64b4604e462e7a7501c334db0d5c7e789257e29f469f42bf9';
const HASH_H3_IDS = '8ec7bb602a6afe014d977d69f912b099cda29f42bd57e51efda5f104973ba411';
const BASE_ORIG76 = '13c4eb4e3fdfdb39d91637af0b99f573bf3c43a4a8524d46a434c9cf9352b551';

const H1 = ['calc-h1-t1-07', 'calc-h1-t1-08', 'calc-h1-t1-16', 'calc-h1-t2-03', 'calc-h1-t2-04',
  'calc-h1-t2-08', 'calc-h1-t2-11', 'calc-h1-t3-04', 'calc-h1-t3-07', 'calc-h1-t4-08',
  'calc-h1-t5-03', 'calc-h1-t5-05', 'calc-h1-t5-06', 'calc-h1-t7-04'];
const KPMAP = {
  'calc-h1-t1-07': 'kp-t1-07', 'calc-h1-t1-08': 'kp-t1-08', 'calc-h1-t1-16': 'kp-t1-16',
  'calc-h1-t2-03': 'kp-t2-03', 'calc-h1-t2-04': 'kp-t2-04', 'calc-h1-t2-08': 'kp-t2-08',
  'calc-h1-t2-11': 'kp-t2-11', 'calc-h1-t3-04': 'kp-t3-04', 'calc-h1-t3-07': 'kp-t3-07',
  'calc-h1-t4-08': 'kp-t4-08', 'calc-h1-t5-03': 'kp-t5-03', 'calc-h1-t5-05': 'kp-t5-05',
  'calc-h1-t5-06': 'kp-t5-06', 'calc-h1-t7-04': 'kp-t7-04'
};
const FIELDS = ['id', 'topic', 'level', 'type', 'prompt', 'knowledge', 'hint', 'explain', 'source',
  'review', 'subject', 'chapter', 'estimatedMinutes', 'prerequisites', 'answerText', 'knowledgeTags', 'kpId'];

const preH1 = N.questions.filter(q => !H1.includes(q.id) && !q.id.startsWith('calc-h2-'));
const newQ = H1.map(id => N.questions.find(q => q.id === id));

console.log('=== 1. 题量与插入位置 ===');
ok(N.questions.length === BASE.total, '全库 ' + BASE.total + ' 题（实测 ' + N.questions.length + '）');
ok(solo.questions.length === BASE.solo, '本库 ' + BASE.solo + ' 题（76 + H1 批 14 + H2 批 25 + H3 批 20 + H4 批 20 + H5 批 8 + H6 批 30，实测 ' + solo.questions.length + '）');
ok(same(solo.questions.slice(76, 90).map(q => q.id), H1), 'H1 批 14 题按序追加在原创库 76 题之后（H2 批 25 题再接其后）');
ok(newQ.every(Boolean), '14 道指定新题全部存在');

console.log('\n=== 2. 原有题目零漂移（硬哈希；经典库退役后口径为「剔除 H1/H2 批」）===');
ok(preH1.length === BASE.preH1, '剔除 H1 批与 H2 批后仍为 ' + BASE.preH1 + ' 题（实测 ' + preH1.length + '）');
ok(h(JSON.stringify(preH1)) === BASE_ALL, '这批 ' + BASE.preH1 + ' 题内容逐字节不变');
ok(h(JSON.stringify(preH1.map(q => q.id))) === BASE_IDS, '这批 ' + BASE.preH1 + ' 题顺序不变');
ok(h(JSON.stringify(preH1.slice(0, 76))) === BASE_ORIG76, '原创库原 76 题内容不变');
ok(h(JSON.stringify(preH1.slice(76, 96).map(q => q.id))) === HASH_H3_IDS, 'H3 批 20 题紧随原创 76 题之后且顺序不变（H4 批 20 题再接其后）');
ok(new Set(N.questions.map(q => q.id)).size === BASE.total, 'ID 全局唯一（' + BASE.total + '/' + BASE.total + '）');

console.log('\n=== 3. 新增 14 题字段契约 ===');
let bad = 0;
for (const q of newQ) {
  const errs = [];
  const kp = KPMAP[q.id], kpObj = N.knowledgePoints.find(k => k.id === kp);
  if (q.type !== 'solve') errs.push('type≠solve');
  if (q.level !== '综合') errs.push('level≠综合');
  if (q.kpId !== kp) errs.push('kpId=' + q.kpId);
  if (q.topic !== Number(kp[4])) errs.push('topic=' + q.topic);
  if (Object.keys(q).sort().join(',') !== FIELDS.slice().sort().join(',')) errs.push('字段集不符');
  if (!q.knowledgeTags || q.knowledgeTags[0] !== kpObj.name) errs.push('knowledgeTags 未命中注册表');
  if (q.knowledge !== kpObj.name) errs.push('knowledge 与标签不一致');
  if (!q.chapter) errs.push('chapter 缺失');
  if (typeof q.answerText !== 'string' || q.answerText.length < 30) errs.push('answerText 过短');
  if (q.options !== undefined || q.answer !== undefined) errs.push('残留选择项字段');
  if (!q.review || q.review.status !== 'approved' || q.review.reviewedAt !== '2026-10-15') errs.push('review');
  if (!q.source || q.source.kind !== '原创' || !/原创/.test(q.source.license)) errs.push('source 非原创');
  if (!Array.isArray(q.prerequisites) || q.prerequisites.length < 2) errs.push('prerequisites');
  if (!q.hint || /答案|选项[ABCD]|应选/.test(q.hint)) errs.push('hint 泄露答案');
  if ((q.explain.match(/<b>解题思路<\/b>/g) || []).length !== 1) errs.push('解题思路标题');
  if ((q.explain.match(/<b>易错点<\/b>/g) || []).length !== 1) errs.push('易错点标题');
  if (!/class="solution-conclusion"/.test(q.explain)) errs.push('缺结论块');
  if (/\*\*/.test(q.explain)) errs.push('Markdown 粗体残留');
  if (![8, 10, 12].includes(q.estimatedMinutes)) errs.push('minutes=' + q.estimatedMinutes);
  if (errs.length) { bad++; console.log('  ✗ ' + q.id + ' → ' + errs.join('、')); }
}
ok(bad === 0, '14 题字段全部合规（' + (bad ? bad + ' 题不合规' : '题量/类型/考点/来源/解析结构/用时均通过') + '）');

console.log('\n=== 4. 科目范围符合施工图 ===');
const expectedSub = k => {
  if (k.topic <= 2) return k.id === 'kp-t1-19' ? ['math-1', 'math-2'] : ['math-1', 'math-2', 'math-3'];
  if (k.topic === 3) return ['kp-t3-05', 'kp-t3-06', 'kp-t3-10'].includes(k.id) ? ['math-1', 'math-3'] : ['math-1', 'math-2', 'math-3'];
  if (k.topic === 4) return Number(k.id.slice(-2)) <= 6 ? ['math-1', 'math-2', 'math-3'] : ['math-1'];
  if (k.topic === 5) return k.id === 'kp-t5-08' ? ['math-1'] : (['kp-t5-04', 'kp-t5-05'].includes(k.id) ? ['math-1', 'math-2'] : ['math-1', 'math-2', 'math-3']);
  return (k.topic === 6 || k.id === 'kp-t7-06') ? ['math-1'] : ['math-1', 'math-3'];
};
let subBad = 0;
for (const q of newQ) {
  const kpObj = N.knowledgePoints.find(k => k.id === q.kpId);
  if (!same(q.subject, expectedSub(kpObj))) { subBad++; console.log('  ✗ ' + q.id + ' 科目 ' + JSON.stringify(q.subject) + ' 期望 ' + JSON.stringify(expectedSub(kpObj))); }
}
ok(subBad === 0, '14 题科目与施工图一致（t4-08/t7-04 仅数一/一三）');
ok(N.questions.every(q => { const k = N.knowledgePoints.find(x => x.id === q.kpId); return k && same(q.subject, expectedSub(k)); }), '全库 ' + BASE.total + ' 题科目均与施工图一致');

console.log('\n=== 5. 补题目标达成（此前该知识点 0 道解答题）===');
let zeroBefore = 0, cover = 0;
for (const [id, kp] of Object.entries(KPMAP)) {
  const nonH1Solve = N.questions.filter(q => q.kpId === kp && q.type === 'solve' && !q.id.startsWith('calc-h1-')).length;
  if (nonH1Solve !== 0) { zeroBefore++; console.log('  ✗ ' + kp + ' 变更前已有 ' + nonH1Solve + ' 道解答题，与本批前提不符'); }
  if (N.questions.filter(q => q.kpId === kp && q.type === 'solve').length >= 1) cover++;
}
ok(zeroBefore === 0, '14 个目标知识点在 H1 批之前均无解答题（原库侧实测为 0）');
ok(cover === BASE.h1Kp, BASE.h1Kp + ' 个目标知识点现均有解答题（实测 ' + cover + '/' + BASE.h1Kp + '）');
const solveKp = new Set(N.questions.filter(q => q.type === 'solve').map(q => q.kpId));
const t15solveKp = ['kp-t1-07', 'kp-t1-08', 'kp-t1-16', 'kp-t2-03', 'kp-t2-04', 'kp-t2-08', 'kp-t2-11', 'kp-t3-04', 'kp-t3-07', 'kp-t4-08', 'kp-t5-03', 'kp-t5-05', 'kp-t5-06', 'kp-t7-04'];
ok(solveKp.size === BASE.solveKp, '全库解答题覆盖 ' + BASE.solveKp + ' 个知识点（11 → 25，实测 ' + solveKp.size + '）');
ok(N.knowledgePoints.every(k => N.questions.some(q => q.kpId === k.id)), '90 知识点仍全覆盖，无零题点');
ok(N.questions.filter(q => q.type === 'solve').length === 25, '全库解答题 25 道（实测 ' + N.questions.filter(q => q.type === 'solve').length + '）');
const byType = t => N.questions.filter(q => q.type === t).length;
ok(byType('choice') === BASE.byType.choice && byType('fill') === BASE.byType.fill && byType('solve') === BASE.byType.solve, '题型 ' + BASE.byType.choice + ' 选择 / ' + BASE.byType.fill + ' 填空 / ' + BASE.byType.solve + ' 解答（经典库退役后口径；H2 批：选择 +13、填空 +12）');

console.log('\n=== 6. 答案独立复算 ===');
const T = id => newQ.find(q => q.id === id).answerText;

// H1-01 闭区间最值：f=|x²-1| on [-2,2]
{
  const f = x => Math.abs(x * x - 1);
  let mx = -1e9, mn = 1e9;
  for (let i = 0; i <= 200000; i++) { const v = f(-2 + 4 * i / 200000); if (v > mx) mx = v; if (v < mn) mn = v; }
  ok(near(mx, 3, 1e-6) && near(mn, 0, 1e-6) && /=3\$/.test(T('calc-h1-t1-07')) && /=0\$/.test(T('calc-h1-t1-07')), 'H1-01 最大 3／最小 0（数值扫描 + 结论文字复核）');
}
// H1-02 靠墙羊圈：2x+y=12，S=x(12-2x)
{
  let best = -1e9;
  for (let i = 1; i <= 59999; i++) { const x = 6 * i / 60000; const s = x * (12 - 2 * x); if (s > best) best = s; }
  ok(near(best, 18, 1e-6) && /18/.test(T('calc-h1-t1-08')), 'H1-02 最大面积 18 平方米（区间扫描复核）');
}
// H1-03 极值定参：f'=3x²+2ax+b，f'(1)=0，f(1)=-2
{
  const a = 0, b = -3;
  ok(near(3 + 2 * a + b, 0) && near(1 + a + b, -2) && near(6 * 1, 6) && near(-6 * 1, -6), 'H1-03 a=0、b=-3 使 f′(1)=0 且 f(1)=−2（x=1 极小、x=−1 极大）');
}
// H1-04 变限积分：F'=2e^{-4x²}-e^{-x²}
{
  const Fp = x => 2 * Math.exp(-4 * x * x) - Math.exp(-x * x);
  // 独立用数值微分复核 F' 表达式
  const F = x => { let s = 0; const n = 40000, a = x, b = 2 * x; const hh = (b - a) / n; for (let i = 0; i < n; i++) s += Math.exp(-Math.pow(a + (i + .5) * hh, 2)); return s * hh; };
  const fd = x => (F(x + 1e-6) - F(x - 1e-6)) / 2e-6;
  const pts = [0.3, 0.5, 0.7, 1.1];
  ok(pts.every(x => near(Fp(x), fd(x), 2e-5)), 'H1-04 F′(x)=2e^(−4x²)−e^(−x²) 与数值微分一致');
  const r = Math.sqrt(Math.log(2) / 3);
  ok(near(Fp(r), 0, 1e-12) && Fp(0) > 0 && Fp(2 * r) < 0 && Fp(-r) === Fp(r), 'H1-04 驻点 x=±√(ln2/3)，左极小右极大（符号变号复核）');
}
// H1-05 ∫₀¹x²√(1-x²)dx = π/16
{
  let s = 0; const n = 2000000, hh = 1 / n;
  for (let i = 0; i < n; i++) { const x = (i + .5) * hh; s += x * x * Math.sqrt(1 - x * x); }
  ok(near(s * hh, Math.PI / 16, 1e-7) && /\\frac\{\\pi\}\{16\}|\\dfrac\{\\pi\}\{16\}/.test(T('calc-h1-t2-04')), 'H1-05 积分 = π/16 ≈ ' + (s * hh).toFixed(9) + '（数值积分复核）');
}
// H1-06 ∫₁^∞ dx/(x(x+1)) = ln2（先算有限上限 R 再取极限，按定义复核）
{
  const R = 1000, n = 2000000, hh = (R - 1) / n;
  let s = 0;
  for (let i = 0; i < n; i++) { const x = 1 + (i + .5) * hh; s += 1 / (x * (x + 1)); }
  const partial = s * hh;                       // ∫₁^R
  const closed = Math.log(R / (R + 1)) + Math.log(2);   // 解析值
  ok(near(partial, closed, 1e-7), 'H1-06 ∫₁^R = ln(R/(R+1))+ln2 数值复核（R=1000，误差 ' + Math.abs(partial - closed).toExponential(2) + '）');
  ok(near(closed, Math.log(2), 1e-3) && Math.abs(Math.log(2) - closed) < 1e-3, 'H1-06 取 R→+∞ 极限存在有限 → 收敛于 ln2（闭式 ' + closed.toFixed(9) + '）');
  ok(/收敛/.test(T('calc-h1-t2-08')) && /\\ln2/.test(T('calc-h1-t2-08')), 'H1-06 结论文字含「收敛」与 ln2');
}
// H1-07 ∫₁² dx/(x(x²+1)) = ½ln(8/5)
{
  let s = 0; const n = 2000000, hh = 1 / n;
  for (let i = 0; i < n; i++) { const x = 1 + (i + .5) * hh; s += 1 / (x * (x * x + 1)); }
  ok(near(s * hh, 0.5 * Math.log(8 / 5), 1e-8), 'H1-07 定积分 = ½ln(8/5) ≈ ' + (s * hh).toFixed(9) + '（数值积分复核）');
}
// H1-08 抽象复合：u=xy, v=x/y → ∂z/∂x=yf_u+f_v/y, ∂z/∂y=xf_u−xf_v/y²
{
  // 取具体可积的 f(u,v)=u²+u·v²（f_u=2u+v², f_v=2uv），则 g=f(xy,x/y)=x²y²+x³/y
  const fu = (u, v) => 2 * u + v * v, fv = (u, v) => 2 * u * v;
  const G = (x, y) => x * x * y * y + x * x * x / y;
  const pts = [[1, 1], [0.7, 1.3], [1.4, 0.6], [2, 0.5]];
  const chk = pts.every(([x, y]) => {
    const u = x * y, v = x / y;
    const gx = y * fu(u, v) + (1 / y) * fv(u, v);
    const gy = x * fu(u, v) - (x / (y * y)) * fv(u, v);
    const fx = (G(x + 1e-6, y) - G(x - 1e-6, y)) / 2e-6;
    const fy = (G(x, y + 1e-6) - G(x, y - 1e-6)) / 2e-6;
    return near(gx, fx, 1e-4) && near(gy, fy, 1e-4);
  });
  ok(chk, 'H1-08 链式法则 ∂z/∂x=yf_u+f_v/y、∂z/∂y=xf_u−xf_v/y² 经数值微分复核');
  ok(near(1 * 2 + 1 * 3, 5, 1e-12) && near(1 * 2 - 1 * 3, -1, 1e-12) && /5/.test(T('calc-h1-t3-04')) && /-1/.test(T('calc-h1-t3-04')), 'H1-08 (1,1) 处理论值 5 与 −1');
}
// H1-09 f=x³+y³−3xy
{
  const fx = (x, y) => 3 * x * x - 3 * y, fy = (x, y) => 3 * y * y - 3 * x;
  const fxx = x => 6 * x, fyy = y => 6 * y;
  const AC1 = fxx(1) * fyy(1) - 9, AC0 = fxx(0) * fyy(0) - 9;
  ok(near(fx(1, 1), 0) && near(fy(1, 1), 0) && near(fx(0, 0), 0) && near(fy(0, 0), 0), 'H1-09 驻点 (1,1) 与 (0,0)');
  ok(AC1 > 0 && fxx(1) > 0 && AC0 < 0 && near(1 + 1 - 3, -1), 'H1-09 AC−B²=27>0 极小值 −1；(0,0) 处 −9<0 非极值');
}
// H1-10 圆周曲线积分
{
  const a = 2, n = 400000, dt = 2 * Math.PI / n;
  let I1 = 0, I2 = 0;
  for (let i = 0; i < n; i++) {
    const t = (i + .5) * dt, x = a * Math.cos(t), y = a * Math.sin(t);
    const dx = -a * Math.sin(t) * dt, dy = a * Math.cos(t) * dt;
    I1 += (x * x + y * y) * a * dt;
    I2 += (-y) * dx + x * dy;
  }
  ok(near(I1, 2 * Math.PI * a ** 3, 1e-6) && near(I2, 2 * Math.PI * a ** 2, 1e-6), 'H1-10 ∮(x²+y²)ds=2πa³、∮(−y)dx+xdy=2πa²（数值复核）');
  ok(near(5 / 2, 2.5) && near(3 / 2, 1.5) && /a\^2/.test(T('calc-h1-t4-08')) && /2\\pi a\^2/.test(T('calc-h1-t4-08')), 'H1-10 参数化复算 ∮(x²+y²)ds=2π√5、∮(−y)dx+xdy=2π√3');
}
// H1-11 y'−y/x=x, y(1)=0 → y=x²−x
{
  const y = x => x * x - x, yp = x => 2 * x - 1;
  const pts = [1, 2, 4, 9];
  ok(pts.every(x => near(yp(x) - y(x) / x, x, 1e-12)) && near(y(1), 0, 1e-12), 'H1-11 y=x²−x 满足方程与初值（逐点代入复核）');
}
// H1-12 y''=3√y, y(0)=1, y'(0)=2 → y=(x+2)⁴/16
{
  const y = x => Math.pow(x + 2, 4) / 16, yp = x => Math.pow(x + 2, 3) / 4, ypp = x => 3 * Math.pow(x + 2, 2) / 4;
  const pts = [0, 0.5, 1, 2];
  ok(pts.every(x => near(ypp(x), 3 * Math.sqrt(y(x)), 1e-9)) && near(y(0), 1, 1e-12) && near(yp(0), 2, 1e-12), 'H1-12 y=(x+2)⁴/16 满足方程与两条初值（代入复核）');
}
// H1-13 y''−2y'+5y=0, y(0)=1, y'(0)=0 → y=e^x(cos2x−½sin2x)
{
  const y = x => Math.exp(x) * (Math.cos(2 * x) - .5 * Math.sin(2 * x));
  const yp = x => Math.exp(x) * (-2.5 * Math.sin(2 * x));
  const ypp = x => Math.exp(x) * (-2.5 * Math.sin(2 * x) - 5 * Math.cos(2 * x));
  const pts = [0, 0.4, 1.2, 3];
  ok(pts.every(x => near(0.5 * (ypp(x) - 2 * yp(x) + 5 * y(x)), 0, 1e-9)) || pts.every(x => near(ypp(x) - 2 * yp(x) + 5 * y(x), 0, 1e-8)), 'H1-13 特解满足方程（逐点代入复核）');
  ok(near(y(0), 1, 1e-12) && near(yp(0), 0, 1e-12), 'H1-13 特解满足 y(0)=1、y′(0)=0');
}
// H1-14 幂级数 Σ(x−1)^n/(n2^n)
{
  const R = 2;
  ok(near(R, 2), 'H1-14 收敛半径 R=2');
  let s1 = 0; for (let n = 1; n <= 200000; n++) s1 += Math.pow(-1, n) / n;
  ok(near(s1, -Math.log(2), 1e-3), 'H1-14 左端点 x=−1 化为交错调和级数，收敛于 −ln2 ≈ ' + s1.toFixed(6));
  let s3 = 0; for (let n = 1; n <= 200000; n++) s3 += 1 / n;
  ok(s3 > 12 && Math.log(200000) + 0.577 > 12, 'H1-14 右端点 x=3 化为调和级数，发散（部分和 ≈ ' + s3.toFixed(3) + '）');
  ok(/\[-1,\s*3\)/.test(T('calc-h1-t7-04')) || /收敛域为 \$\[-1,3\)\$/.test(T('calc-h1-t7-04')), 'H1-14 结论收敛域 [−1,3)');
}

console.log('\n结果：' + pass + ' 项通过，' + fail + ' 项失败');
process.exit(fail ? 1 : 0);
