/*
 * H5 批专项验收：基础层收尾批（8 道基础题 = 7 选择 + 1 填空）
 * 依赖：question-bank.js（163 题）与同目录的出题施工图.md
 *
 * 判定口径：
 *   ① 原 155 题内容与顺序双硬哈希零漂移；8 题内容自洽；
 *   ② 8 题字段契约（kpId / level / type / minutes / source / review / 提示 / 解析结论）；
 *   ③ 8 题答案逐题独立复算——不用解析里的推导，改用余弦定理式坐标复算、数值差分、
 *      极限两侧取样、函数采样判同、平面代点回验等另一套方法；
 *   ④ 干扰项逐项排除（数值型比对真值；函数/方程型在采样点或三个给定点上比对）；
 *   ⑤ 施工图一致性：8 题题型 ⊆ 建议题型（C3）；**30 个主档=基础的知识点全部 ≥2 道基础题**。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dir = __dirname;
const h = s => crypto.createHash('sha256').update(s).digest('hex');
function load(files) { const w = {}; files.forEach(f => new Function('window', fs.readFileSync(path.join(dir, f), 'utf8'))(w)); return w.ZHIXU_BANK; }

const S = load(['question-bank.js']);
const Q = id => S.questions.find(q => q.id === id);

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const near = (a, b, e = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= e * Math.max(1, Math.abs(b));

/* ---------- 数值工具 ---------- */
const d2 = (f, x, hh = 1e-3) => (f(x + hh) - 2 * f(x) + f(x - hh)) / (hh * hh);      // 二阶中心差分
const pd = (f, x, y, hh = 1e-5) => (f(x, y + hh) - f(x, y - hh)) / (2 * hh);          // 偏导中心差分

/* LaTeX 选项 → 数值（覆盖本批写法） */
function numOf(tex) {
  if (/不存在|无定义|[一-龥]/.test(tex)) return null;
  let t = String(tex).replace(/\$/g, '')
    .replace(/\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^{}]+)\}/g, 'Math.sqrt($1)')
    .replace(/\\sqrt(\d+)/g, 'Math.sqrt($1)')
    .replace(/\\ln\s*(\d+)/g, 'Math.log($1)')
    .replace(/\\pi/g, 'Math.PI')
    .replace(/(\d)(Math\.(?:log|sqrt|PI|E))/g, '$1*$2')
    .replace(/\^\{?(\d+)\}?/g, '**$1')
    .replace(/\s+/g, '');
  if (!t) return null;
  try { const v = Function('return (' + t + ')')(); return Number.isFinite(v) ? v : null; } catch (e) { return null; }
}
function exactlyOne(q, truth, tol = 1e-9) {
  const vals = q.options.map(numOf);
  const hits = vals.filter(v => v !== null && near(v, truth, tol)).length;
  const parsed = vals.filter(v => v !== null).length;
  return { hits, parsed, vals };
}

const PRE_COUNT = 155;
const HASH_PRE155 = 'a1b5d8242a6e8495948bb87c829693042fcde14e85b000122994167900f7e9a3';
const HASH_IDS155 = 'f92286731815982da9010c4ac5c1903fb99d21c26fe622318d4c8b6aa17302d4';
const HASH_H5_8 = 'ca35c4cb6b3f4ac56f9cfcf29bb9144dcf3767d96277ae5d8c4a6d90d96fbe14';

/* ---------- 1. 零漂移 ---------- */
console.log('=== 1. 原 155 题零漂移 ===');
ok(S.questions.length === 193, '题量 = 193（155 + 本批 8 + H6 批 30，H6 加厚基础层）');
ok(h(JSON.stringify(S.questions.slice(0, PRE_COUNT))) === HASH_PRE155, '原 155 题内容逐字段零漂移');
ok(h(S.questions.slice(0, PRE_COUNT).map(q => q.id).join('|')) === HASH_IDS155, '原 155 题顺序零漂移');
const h5 = S.questions.slice(PRE_COUNT, PRE_COUNT + 8); // 只取本批 8 题（其后还有 H6 批 30 题）
ok(h(JSON.stringify(h5)) === HASH_H5_8, '本批 8 题内容自洽（顺序哈希）');

/* ---------- 2. 字段契约 ---------- */
console.log('\n=== 2. 字段契约 ===');
const SPEC = {
  'calc-h5-t0-01': { kp: 'kp-t0-08', type: 'choice', ans: 0, min: 2 },
  'calc-h5-t0-02': { kp: 'kp-t0-11', type: 'choice', ans: 3, min: 2 },
  'calc-h5-t1-01': { kp: 'kp-t1-04', type: 'choice', ans: 2, min: 2 },
  'calc-h5-t1-02': { kp: 'kp-t1-19', type: 'fill', ans: '2', min: 2 },
  'calc-h5-t3-01': { kp: 'kp-t3-01', type: 'choice', ans: 3, min: 2 },
  'calc-h5-t6-01': { kp: 'kp-t6-01', type: 'choice', ans: 1, min: 2 },
  'calc-h5-t6-02': { kp: 'kp-t6-03', type: 'choice', ans: 3, min: 2 },
  'calc-h5-t6-03': { kp: 'kp-t6-05', type: 'choice', ans: 2, min: 2 }
};
for (const [id, sp] of Object.entries(SPEC)) {
  const q = Q(id);
  if (!q) { ok(false, id + ' 存在'); continue; }
  const good = q.kpId === sp.kp && q.level === '基础' && q.type === sp.type
    && q.estimatedMinutes === sp.min && q.source && q.source.kind === '原创'
    && q.review && q.review.status === 'approved' && q.review.reviewedAt === '2026-10-17'
    && typeof q.hint === 'string' && q.hint.length > 20
    && typeof q.explain === 'string' && /solution-conclusion/.test(q.explain);
  ok(good, id + ' 字段契约完整（' + sp.kp + ' / 基础 / ' + sp.type + ' / ' + sp.min + ' 分钟）');
  if (sp.type === 'choice') {
    const answerOk = q.answer === sp.ans && new Set(q.options).size === 4;
    ok(answerOk, id + ' 选项 4 个互不相同，答案下标 = ' + sp.ans);
  } else {
    ok(Array.isArray(q.answers) && q.answers.includes(sp.ans), id + ' 填空标准答案含 ' + sp.ans);
  }
}

/* ---------- 3. 答案独立复算 ---------- */
console.log('\n=== 3. 8 题答案逐题独立复算（换方法，不复用解析推导） ===');

/* 3.1 分段函数的单侧极限：左右两侧各取三个半径取样，看是否都收敛到同一值 */
{
  const f = x => (x < 1 ? x * x : 2 * x - 1);
  const left = [1e-3, 1e-4, 1e-5].map(e => f(1 - e));
  const right = [1e-3, 1e-4, 1e-5].map(e => f(1 + e));
  const conv = v => Math.abs(v - 1) < 2e-3;
  const q = Q('calc-h5-t0-01');
  ok(left.every(conv) && right.every(conv),
    'kp-t0-08：左支采样 ' + left.map(v => v.toFixed(6)).join('/') + '，右支采样 ' + right.map(v => v.toFixed(6)).join('/') + '，双侧同趋于 1');
  const { hits } = exactlyOne(q, 1, 1e-6);
  ok(hits === 1 && q.answer === 0, 'kp-t0-08：选项恰有 1 项等于 1，且与标注一致');
}

/* 3.2 同一函数：在采样点上比较函数值与定义域（含 x=0 与 x<0 的边界） */
{
  const cand = [
    x => Math.sqrt(x * x),
    x => (x * x) / x,
    x => Math.exp(Math.log(x)),
    x => Math.log(Math.exp(x))
  ];
  const samples = [-2, -0.5, 0, 0.5, 2];
  const verdict = cand.map((g, i) => samples.every(x => {
    const v = g(x);
    return Number.isFinite(v) && near(v, x, 1e-12);
  }));
  ok(JSON.stringify(verdict) === JSON.stringify([false, false, false, true]),
    'kp-t0-11：采样点 [' + samples.join(',') + '] 上逐一比对，仅第 4 项处处等于 x（A 在负数处取相反数、B 在 0 处无定义、C 在负数处无定义）');
  const q = Q('calc-h5-t0-02');
  ok(q.answer === 3 && verdict[3] === true && verdict.slice(0, 3).every(v => v === false),
    'kp-t0-11：标注答案落在唯一成立的候选上');
}

/* 3.3 高阶导数：二阶中心差分数值求 f''(0) */
{
  const f = x => x * Math.exp(x);
  const v = d2(f, 0, 1e-3);
  const q = Q('calc-h5-t1-01');
  const { hits } = exactlyOne(q, 2, 1e-5);
  ok(near(v, 2, 1e-5) && hits === 1 && q.answer === 2,
    'kp-t1-04：数值二阶差分得 ' + v.toFixed(9) + '，选项恰有 1 项等于 2');
}

/* 3.4 曲率：数值一阶/二阶导数代入 κ = |y''|/(1+y'^2)^{3/2} */
{
  const f = x => x * x;
  const y1 = pd((x, t) => t * t, 0, 0) === 0 ? (f(1e-5) - f(-1e-5)) / 2e-5 : null;  // y' 在 0
  const y2 = d2(f, 0, 1e-3);
  const kappa = Math.abs(y2) / Math.pow(1 + y1 * y1, 1.5);
  const q = Q('calc-h5-t1-02');
  ok(near(kappa, 2, 1e-4) && q.answers.includes('2'),
    'kp-t1-19：数值导数得 y\'(0)=' + y1.toFixed(8) + '、y\'\'(0)=' + y2.toFixed(8) + '，κ=' + kappa.toFixed(8) + '（曲率半径 0.5）');
}

/* 3.5 偏导数：对 y 的中心差分，在 (2,3) 处 */
{
  const z = (x, y) => Math.pow(x, y);
  const v = pd(z, 2, 3, 1e-7);
  const truth = 8 * Math.log(2);
  const q = Q('calc-h5-t3-01');
  const { hits } = exactlyOne(q, truth, 1e-9);
  ok(near(v, truth, 1e-5) && hits === 1 && q.answer === 3,
    'kp-t3-01：数值偏导得 ' + v.toFixed(9) + '，与 $8\\ln 2$=' + truth.toFixed(9) + ' 一致，选项恰有 1 项相符');
}

/* 3.6 向量的模：逐分量复算 2a-b，并与四个选项比对 */
{
  const a = [1, -2, 2], b = [2, 1, -1];
  const c = a.map((v, i) => 2 * v - b[i]);
  const norm = Math.hypot(...c);
  const q = Q('calc-h5-t6-01');
  const { hits, parsed } = exactlyOne(q, norm, 1e-9);
  ok(c.join(',') === '0,-5,5' && near(norm, 5 * Math.SQRT2, 1e-12) && hits === 1 && parsed === 4,
    'kp-t6-01：$2\\vec a-\\vec b$=(' + c.join(',') + ')，模=' + norm.toFixed(9) + '，四个选项恰 1 项相等');
}

/* 3.7 平面方程：把四个选项当平面，代三个点回验（恰有一个平面三点全过） */
{
  const pts = [[1, 0, 0], [0, 2, 0], [0, 0, 3]];
  const coef = q => {
    const t = q.options.map(o => String(o).replace(/\$/g, '').replace(/\s+/g, ''));
    return t.map(s => {
      const m = s.match(/^(-?\d*)x([+-]\d*)y([+-]\d*)z([+-]\d+)=0$/);
      if (!m) return null;
      const g = v => (v === '' ? 1 : v === '+' ? 1 : v === '-' ? -1 : Number(v));
      return [g(m[1]), g(m[2]), g(m[3]), Number(m[4])];
    });
  };
  const q = Q('calc-h5-t6-02');
  const planes = coef(q);
  const fits = planes.map(p => p && pts.every(([x, y, z]) => Math.abs(p[0] * x + p[1] * y + p[2] * z + p[3]) < 1e-12));
  ok(JSON.stringify(fits) === JSON.stringify([false, false, false, true]) && q.answer === 3,
    'kp-t6-02：四点式逐项代三点，仅第 4 项三点全满足（对应截距 1/2/3 的 6x+3y+2z-6=0）');
}

/* 3.8 两平面夹角：法向量点积除以模积，取绝对值 */
{
  const n1 = [1, 2, 2], n2 = [2, -1, 2];
  const dot = n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2];
  const cos = Math.abs(dot) / (Math.hypot(...n1) * Math.hypot(...n2));
  const q = Q('calc-h5-t6-03');
  const { hits } = exactlyOne(q, 4 / 9, 1e-12);
  ok(dot === 4 && near(cos, 4 / 9, 1e-12) && hits === 1 && q.answer === 2,
    'kp-t6-05：$\\vec n_1\\cdot\\vec n_2$=4、两模均为 3，cos=' + cos.toFixed(9) + '，选项恰 1 项等于 $4/9$');
}

/* ---------- 4. 施工图一致性 ---------- */
console.log('\n=== 4. 施工图一致性（C3）与基础档覆盖 ===');
const md = fs.readFileSync(path.join(dir, '出题施工图.md'), 'utf8');
const rows = {};
for (const line of md.split(/\r?\n/)) {
  const m = line.match(/^\|\s*(kp-t\d-\d+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/);
  if (m) rows[m[1].trim()] = { main: m[5].trim(), types: m[8].trim() };
}
let c3bad = 0;
for (const [id, sp] of Object.entries(SPEC)) {
  const allow = rows[sp.kp].types.split('·').map(s => s.trim());
  const q = Q(id);
  if (!allow.includes(q.type)) { console.log('  ✘ C3 违规：' + id + ' 题型 ' + q.type + ' 不在 ' + allow.join('/')); c3bad++; }
}
ok(c3bad === 0, '8 题题型全部落在各点「建议题型」内（C3）');

const baseKps = Object.keys(rows).filter(kp => rows[kp].main === '基础');
const basicCnt = {};
S.questions.forEach(q => { if (q.level === '基础') basicCnt[q.kpId] = (basicCnt[q.kpId] || 0) + 1; });
const short = baseKps.filter(kp => (basicCnt[kp] || 0) < 2);
ok(baseKps.length === 30, '施工图主档=基础的知识点共 30 个');
ok(short.length === 0, '30 个基础档知识点全部 ≥2 道基础题（缺口 ' + short.length + ' 个）');
ok(S.questions.filter(q => q.level === '基础').length === 92, '全库基础题 92 道（62 + H6 批 30）');

/* ---------- 5. 全库计数与答案位置 ---------- */
console.log('\n=== 5. 全库计数 ===');
const lv = {}, ty = {};
S.questions.forEach(q => { lv[q.level] = (lv[q.level] || 0) + 1; ty[q.type] = (ty[q.type] || 0) + 1; });
ok(S.questions.length === 193 && lv['基础'] === 92 && lv['强化'] === 68 && lv['综合'] === 33,
  '总 193 题，难度 92/68/33');
ok(ty.choice === 133 && ty.fill === 35 && ty.solve === 25, '题型 133/35/25');
const ansPos = [0, 0, 0, 0];
S.questions.filter(q => q.type === 'choice').forEach(q => ansPos[q.answer]++);
ok(ansPos.join('/') === '33/34/35/31', '选择题答案位置 A/B/C/D = ' + ansPos.join('/'));

/* ---------- 汇总 ---------- */
console.log('\n================ H5 批专项：' + pass + ' 项通过 / ' + fail + ' 项失败 ================');
if (fail) process.exit(1);
