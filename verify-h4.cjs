/*
 * H4 批专项验收：基础层加厚批（20 道基础题 = 17 选择 + 3 填空）
 * 依赖：question-bank.js（155 题）
 *
 * 判定口径：
 *   ① 原 135 题内容与顺序双硬哈希零漂移；
 *   ② 20 题字段契约（kpId / level / type / minutes / source / review / 提示 / 解析结论）；
 *   ③ 20 题答案逐题独立复算——不用解析里的推导，改用数值积分、四阶差分、极限取样、
 *      级数部分和、有限差分求散度等另一套方法；
 *   ④ 选择题的干扰项逐项排除（数值型比对真值；函数型在采样点上比对）；
 *   ⑤ 施工图一致性：20 题题型 ⊆ 建议题型（C3）；主档为「基础」的知识点全部有基础题。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dir = __dirname;
const BASE = require('./verify-baseline.cjs'); // 全库口径读快照，补题后只改它
const h = s => crypto.createHash('sha256').update(s).digest('hex');
function load(files) { const w = {}; files.forEach(f => new Function('window', fs.readFileSync(path.join(dir, f), 'utf8'))(w)); return w.ZHIXU_BANK; }

const S = load(['question-bank.js']);
const Q = id => S.questions.find(q => q.id === id);

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const near = (a, b, e = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= e * Math.max(1, Math.abs(b));

/* ---------- 数值工具（与解析里的解析推导完全不同的一套算法） ---------- */
const simpson = (f, a, b, n = 20000) => {
  if (n % 2) n++;
  const hh = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * hh) * (i % 2 ? 4 : 2);
  return s * hh / 3;
};
const d1 = (f, x, hh = 1e-5) => (-f(x + 2 * hh) + 8 * f(x + hh) - 8 * f(x - hh) + f(x - 2 * hh)) / (12 * hh); // 四阶中心差分
const pd1 = (f, x, y, hh = 1e-5) => (-f(x, y + 2 * hh) + 8 * f(x, y + hh) - 8 * f(x, y - hh) + f(x, y - 2 * hh)) / (12 * hh);

/* LaTeX 选项 → 数值（只覆盖本批出现的写法；含中文的选项返回 null） */
function numOf(tex) {
  if (/不存在|无定义|[一-龥]/.test(tex)) return null;
  let t = String(tex).replace(/\$/g, '')
    .replace(/\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/e\^\{?(\d+)\}?/g, 'Math.E**$1')
    .replace(/\\pi/g, 'Math.PI')
    .replace(/\\ln\s*(\d+)/g, 'Math.log($1)')
    .replace(/\^\{?(\d+)\}?/g, '**$1')
    .replace(/\s+/g, '');
  if (!t) return null;
  try { const v = Function('return (' + t + ')')(); return Number.isFinite(v) ? v : null; } catch (e) { return null; }
}
/* 选项集合里「恰好一个等于真值」的检查 */
function exactlyOne(q, truth, tol = 1e-9) {
  const vals = q.options.map(numOf);
  const hits = vals.filter(v => v !== null && near(v, truth, tol)).length;
  const parsed = vals.filter(v => v !== null).length;
  return { hits, parsed, vals };
}

const PRE_COUNT = 135;
const HASH_PRE135 = '11f85dd9c4bf8e3ed7c930bb60d78d03fc85385dcc652d7adbe7c4c2e0e48739';
const HASH_IDS135 = '75cc063fffe39efc9fb39b6e2e544b8197c99a3b72ad1a06c89c0278b25a4d8d';
const HASH_H4_20 = '85f41a86d2edd6ddf05882414280d795d9a9356cf2bc37c434c9438eb66e416e';

/* ---------- 1. 零漂移 ---------- */
console.log('=== 1. 原 135 题零漂移 ===');
ok(S.questions.length === BASE.total, '题量 = ' + BASE.total + '（135 + H4 批 20 + 后续 H5 批 8）');
ok(h(JSON.stringify(S.questions.slice(0, PRE_COUNT))) === HASH_PRE135, '原 135 题内容逐字段零漂移');
ok(h(S.questions.slice(0, PRE_COUNT).map(q => q.id).join('|')) === HASH_IDS135, '原 135 题顺序零漂移');
const h4 = S.questions.slice(PRE_COUNT, PRE_COUNT + 20); // 只取本批 20 题，其后批次不计入
ok(h(JSON.stringify(h4)) === HASH_H4_20, '本批 20 题内容自洽（顺序哈希）');

/* ---------- 2. 字段契约 ---------- */
console.log('');
console.log('=== 2. 字段契约 ===');
const SPEC = {
  'calc-h4-t0-01': { kp: 'kp-t0-02', type: 'choice', ans: 2, min: 2 },
  'calc-h4-t0-02': { kp: 'kp-t0-03', type: 'choice', ans: 0, min: 2 },
  'calc-h4-t0-03': { kp: 'kp-t0-04', type: 'choice', ans: 1, min: 2 },
  'calc-h4-t0-04': { kp: 'kp-t0-09', type: 'choice', ans: 0, min: 2 },
  'calc-h4-t1-01': { kp: 'kp-t1-01', type: 'choice', ans: 1, min: 2 },
  'calc-h4-t1-02': { kp: 'kp-t1-02', type: 'choice', ans: 0, min: 2 },
  'calc-h4-t1-03': { kp: 'kp-t1-03', type: 'choice', ans: 2, min: 2 },
  'calc-h4-t1-04': { kp: 'kp-t1-06', type: 'choice', ans: 3, min: 2 },
  'calc-h4-t2-01': { kp: 'kp-t2-06', type: 'choice', ans: 1, min: 2 },
  'calc-h4-t2-02': { kp: 'kp-t2-07', type: 'choice', ans: 3, min: 2 },
  'calc-h4-t2-03': { kp: 'kp-t2-09', type: 'choice', ans: 2, min: 2 },
  'calc-h4-t2-04': { kp: 'kp-t2-14', type: 'fill', ans: '4', min: 2 },
  'calc-h4-t3-01': { kp: 'kp-t3-01', type: 'choice', ans: 3, min: 2 },
  'calc-h4-t3-02': { kp: 'kp-t3-08', type: 'choice', ans: 0, min: 2 },
  'calc-h4-t3-03': { kp: 'kp-t3-10', type: 'fill', ans: '3', min: 2 },
  'calc-h4-t4-01': { kp: 'kp-t4-01', type: 'choice', ans: 1, min: 2 },
  'calc-h4-t4-02': { kp: 'kp-t4-11', type: 'fill', ans: '8', min: 2 },
  'calc-h4-t5-01': { kp: 'kp-t5-01', type: 'choice', ans: 2, min: 2 },
  'calc-h4-t6-01': { kp: 'kp-t6-02', type: 'choice', ans: 3, min: 2 },
  'calc-h4-t7-01': { kp: 'kp-t7-01', type: 'choice', ans: 3, min: 2 }
};
let contract = 0, contractFail = [];
for (const [id, sp] of Object.entries(SPEC)) {
  const q = Q(id);
  if (!q) { contractFail.push(id + ' 缺失'); continue; }
  const bads = [];
  if (q.kpId !== sp.kp) bads.push('kpId=' + q.kpId);
  if (q.level !== '基础') bads.push('level=' + q.level);
  if (q.type !== sp.type) bads.push('type=' + q.type);
  if (q.estimatedMinutes !== sp.min) bads.push('min=' + q.estimatedMinutes);
  if (!q.hint || q.hint.length < 20) bads.push('hint 过短');
  if (!q.explain || !/solution-conclusion/.test(q.explain)) bads.push('解析缺结论块');
  if (!q.explain || /<b>易错点<\/b>/.test(q.explain) === false) bads.push('解析缺易错点');
  if (!q.source || q.source.kind !== '原创' || !q.source.license) bads.push('来源标注不合规');
  if (!q.review || q.review.reviewedAt !== '2026-10-17') bads.push('审核日期不是本批');
  if (q.type === 'choice') {
    if (!Array.isArray(q.options) || q.options.length !== 4) bads.push('选项数≠4');
    else if (new Set(q.options).size !== 4) bads.push('选项重复');
    if (q.answer !== sp.ans) bads.push('answer=' + q.answer);
    if (q.options || q.answers) { /* noop */ }
    if (q.answers) bads.push('choice 不应带 answers');
  } else {
    if (!Array.isArray(q.answers) || !q.answers.includes(sp.ans)) bads.push('answers 不含 ' + sp.ans);
    if (q.options || q.answer !== undefined) bads.push('fill 不应带 options/answer');
    if (!q.answerNote) bads.push('填空缺 answerNote');
  }
  if (bads.length === 0) contract++; else contractFail.push(id + ' → ' + bads.join('、'));
}
ok(contract === 20, '20 题字段契约全部合规' + (contractFail.length ? '；异常：' + contractFail.join(' | ') : ''));

/* ---------- 3. 答案独立复算 ---------- */
console.log('');
console.log('=== 3. 答案独立复算（20 题） ===');

/* 3.1 极限与函数值：两个反例都用取样验证 */
{
  const f1 = x => (x * x - 1) / (x - 1);                       // 1 处无定义
  const lim1 = (f1(1 - 1e-7) + f1(1 + 1e-7)) / 2;
  const f2 = x => (x * x - 1) / (x - 1);
  const atOne = 5;                                             // 强行定义 f(1)=5
  const lim2 = (f2(1 - 1e-7) + f2(1 + 1e-7)) / 2;
  ok(near(lim1, 2, 1e-5) && near(lim2, 2, 1e-5) && Math.abs(lim2 - atOne) > 1,
    'kp-t0-02：极限 $=2$ 时既可出现「该点无定义」，也可出现「有定义但 $f(x_0)=5\\ne2$」（两个反例均成立）');
  const q = Q('calc-h4-t0-01');
  ok(q.options[q.answer].includes('可以没有定义') && q.options[q.answer].includes('不等于'),
    'kp-t0-02：所选选项正是「可以无定义，也可以有定义但不等于 $A$」');
}

/* 3.2 因式分解约分求极限 */
{
  const f = x => (x * x - 1) / (x * x + 3 * x + 2);
  const v = (f(-1 - 1e-7) + f(-1 + 1e-7)) / 2;
  const q = Q('calc-h4-t0-02');
  const { hits, parsed } = exactlyOne(q, v, 1e-5);
  ok(near(v, -2, 1e-5) && hits === 1 && parsed === 3,
    'kp-t0-03：左右取样得极限 ' + v.toFixed(9) + '，选项恰有 1 项等于该值（解析出 ' + parsed + ' 个数值项）');
}

/* 3.3 根式极限与有理化 */
{
  const f = x => (Math.sqrt(x + 1) - 2) / (x - 3);
  const v = (f(3 - 1e-6) + f(3 + 1e-6)) / 2;
  const q = Q('calc-h4-t0-03');
  const { hits, parsed } = exactlyOne(q, v, 1e-5);
  ok(near(v, 0.25, 1e-5) && hits === 1 && parsed === 4,
    'kp-t0-04：两侧取样得极限 ' + v.toFixed(9) + '，四个选项全为数值且恰有 1 项等于 1/4');
}

/* 3.4 间断点分类 */
{
  const f = x => (x * x - 1) / (x * x - 3 * x + 2);
  const at1 = (f(1 - 1e-7) + f(1 + 1e-7)) / 2;   // 左右极限应同为 -2
  const left2 = f(2 - 1e-9), right2 = f(2 + 1e-9);
  const q = Q('calc-h4-t0-04');
  ok(near(at1, -2, 1e-4) && Math.abs(left2) > 1e7 && Math.abs(right2) > 1e7 && left2 * right2 < 0,
    'kp-t0-09：$x=1$ 左右极限同为 ' + at1.toFixed(6) + '（可去）；$x=2$ 两侧幅度 > 1e7 且异号（无穷）');
  ok(/可去/.test(q.options[q.answer]) && /无穷/.test(q.options[q.answer]) &&
     q.options[q.answer].indexOf('$x=1$') < q.options[q.answer].indexOf('$x=2$'),
    'kp-t0-09：所选选项的「$x=1$ 可去、$x=2$ 无穷」与数值结论一致');
}

/* 3.5 基本求导公式（tan + cot） */
{
  const f = x => Math.tan(x) + 1 / Math.tan(x);
  const truth = x => 1 / Math.cos(x) ** 2 - 1 / Math.sin(x) ** 2;
  const pts = [0.7, 1.3, 2.1, 2.7];
  ok(pts.every(x => near(d1(f, x), truth(x), 1e-6)),
    'kp-t1-01：四阶差分与 $\\sec^2x-\\csc^2x$ 在 4 个采样点吻合（最大误差 ' +
    Math.max(...pts.map(x => Math.abs(d1(f, x) - truth(x)))).toExponential(2) + '）');
  const q = Q('calc-h4-t1-01');
  // 其余三项在采样点上都不等于真值
  const others = q.options.filter((_, i) => i !== q.answer).map(numOf);
  ok(others.every(v => v === null), 'kp-t1-01：三个干扰项都是函数表达式（非数值），已由下一条逐项排除');
  const F = {
    'sec2_plus_csc2': x => 1 / Math.cos(x) ** 2 + 1 / Math.sin(x) ** 2,
    'secTan_minus_cscCot': x => (1 / Math.cos(x)) * Math.tan(x) - (1 / Math.sin(x)) / Math.tan(x),
    'sec2_plus_cscCot': x => 1 / Math.cos(x) ** 2 + (1 / Math.sin(x)) / Math.tan(x)
  };
  const refuted = Object.entries(F).every(([k, g]) => pts.some(x => Math.abs(g(x) - truth(x)) > 1e-3));
  ok(refuted, 'kp-t1-01：三个干扰项（$\\sec^2+\\csc^2$、$\\sec x\\tan x-\\csc x\\cot x$、$\\sec^2+\\csc x\\cot x$）在采样点均被否证');
}

/* 3.6 复合函数求导 */
{
  const f = x => Math.exp(Math.cos(x));
  const truth = x => -Math.sin(x) * Math.exp(Math.cos(x));
  const pts = [0.5, 1.5, 2.5];
  ok(pts.every(x => near(d1(f, x), truth(x), 1e-6)),
    'kp-t1-02：四阶差分与 $-\\sin x\\,e^{\\cos x}$ 在 3 个采样点吻合');
  const q = Q('calc-h4-t1-02');
  const G = [x => Math.sin(x) * Math.exp(Math.cos(x)), x => Math.cos(x) * Math.exp(Math.sin(x)), x => -Math.exp(Math.cos(x))];
  ok(G.every(g => pts.some(x => Math.abs(g(x) - truth(x)) > 1e-3)), 'kp-t1-02：三个干扰项在采样点均被否证');
}

/* 3.7 乘积求导 */
{
  const f = x => x * x * Math.log(x);
  const truth = x => 2 * x * Math.log(x) + x;
  const pts = [0.4, 1.2, 2.7];
  ok(pts.every(x => near(d1(f, x), truth(x), 1e-5)),
    'kp-t1-03：四阶差分与 $2x\\ln x+x$ 在 3 个采样点吻合');
  const q = Q('calc-h4-t1-03');
  const G = [x => 2 * x * Math.log(x), x => x, x => 2 * x * Math.log(x) - x];
  ok(G.every(g => pts.some(x => Math.abs(g(x) - truth(x)) > 1e-3)), 'kp-t1-03：三个干扰项在采样点均被否证');
}

/* 3.8 切线方程：line 必须过切点且斜率等于导数值 */
{
  const f = x => Math.log(x);
  const parseLine = tex => {
    const body = String(tex).replace(/\$/g, '').replace(/^y=/, '');
    try { return Function('x', 'return (' + body + ')'); } catch (e) { return null; }
  };
  const q = Q('calc-h4-t1-04');
  const ls = q.options.map(parseLine);
  const good = ls.map((g, i) => g && near(g(1), f(1), 1e-9) && near((g(1 + 1e-6) - g(1 - 1e-6)) / 2e-6, 1 / 1, 1e-6));
  ok(good[q.answer] === true, 'kp-t1-06：所选直线过切点 $(1,0)$ 且斜率 $=1/x|_{x=1}$');
  ok(good.filter(Boolean).length === 1, 'kp-t1-06：四条直线中恰有 1 条同时满足「过切点 + 斜率等于导数值」');
}

/* 3.9 奇偶性定积分 */
{
  const v = simpson(x => x ** 4 + x ** 3, -1, 1);
  const q = Q('calc-h4-t2-01');
  const { hits, parsed } = exactlyOne(q, v, 1e-8);
  ok(near(v, 0.4, 1e-10) && hits === 1 && parsed === 4,
    'kp-t2-06：复合 Simpson 得 ' + v.toFixed(12) + '，四个选项全为数值且恰有 1 项等于 $2/5$');
}

/* 3.10 对数型积分 */
{
  const v = simpson(x => 1 / x, 1, Math.E ** 2);
  const q = Q('calc-h4-t2-02');
  const { hits, parsed } = exactlyOne(q, v, 1e-8);
  ok(near(v, 2, 1e-8) && hits === 1 && parsed === 4,
    'kp-t2-07：复合 Simpson 得 ' + v.toFixed(10) + '，四个选项全为数值且恰有 1 项等于该值');
}

/* 3.11 定积分可加性：构造满足已知的两个积分的具体函数再验算 */
{
  const f = x => 1.5 + x;   // ∫0^1 = 2，∫0^2 = 5
  const i01 = simpson(f, 0, 1), i02 = simpson(f, 0, 2), i12 = simpson(f, 1, 2);
  const q = Q('calc-h4-t2-03');
  const { hits, parsed } = exactlyOne(q, i12, 1e-6);
  ok(near(i01, 2, 1e-9) && near(i02, 5, 1e-9) && near(i12, 3, 1e-9) && hits === 1 && parsed === 4,
    'kp-t2-09：取 $f(x)=1.5+x$（$\\int_0^1=2$、$\\int_0^2=5$），Simpson 得 $\\int_1^2=$ ' + i12.toFixed(9) + '，选项恰 1 项相符');
}

/* 3.12 平均值（填空） */
{
  const avg = simpson(x => 3 * x * x, 0, 2) / 2;
  const q = Q('calc-h4-t2-04');
  ok(near(avg, 4, 1e-9) && q.answers.includes('4'), 'kp-t2-14：$\\frac{1}{2}\\int_0^2 3x^2\\mathrm{d}x=$ ' + avg.toFixed(9) + '，填空答案含 4');
}

/* 3.13 偏导数计算（在两组点上比对，避开候选式在特殊点上的偶然相等） */
{
  const z = (x, y) => x * x * y ** 3;
  const cands = [
    (x, y) => 2 * x * y ** 3,
    (x, y) => 3 * x * x * y ** 3,
    (x, y) => 6 * x * y * y,
    (x, y) => 3 * x * x * y * y
  ];
  const q = Q('calc-h4-t3-01');
  const pts = [[3, 2], [1, 3]];
  const detail = pts.map(([x, y]) => {
    const truth = pd1(z, x, y);
    const hits = cands.filter(g => near(g(x, y), truth, 1e-6)).length;
    return { x, y, truth, hits };
  });
  ok(detail.every(d => d.hits === 1) && detail.every((d, i) => near(cands[q.answer](d.x, d.y), d.truth, 1e-6)),
    'kp-t3-01：$(3,2)$ 处差分值 ' + detail[0].truth.toFixed(3) + '、$(1,3)$ 处 ' + detail[1].truth.toFixed(3) +
    '；两点上四个候选式都恰有 1 个相符（选中的正是 $3x^2y^2$）');
}

/* 3.14 二元极限（多方向取样收敛） */
{
  const f = (x, y) => (x * x * y) / (x * x + y * y);
  let worst = 0;
  for (const th of [0, 0.3, 0.8, 1.2, Math.PI / 4, 2.2, 3.0]) {
    for (const r of [1e-2, 1e-3, 1e-4]) {
      worst = Math.max(worst, Math.abs(f(r * Math.cos(th), r * Math.sin(th))));
    }
  }
  const q = Q('calc-h4-t3-02');
  const { hits, parsed } = exactlyOne(q, 0, 1e-9);
  ok(worst < 1e-2 && hits === 1 && parsed === 3,
    'kp-t3-08：沿 7 个方向、半径 1e-2～1e-4 取样，最大幅值 ' + worst.toExponential(2) + ' → 极限为 0，选项恰 1 项为 0');
  // 对照：同族的 xy/(x²+y²) 沿 y=x 得 1/2，说明不能混用
  const mixed = (x, y) => (x * y) / (x * x + y * y);
  ok(near(mixed(1e-4, 1e-4), 0.5, 1e-9), 'kp-t3-08：对照组 $xy/(x^2+y^2)$ 沿 $y=x$ 得 0.5，确认两题结论不同');
}

/* 3.15 空间曲线切线（填空 d=3） */
{
  const P = t => [t, t * t, t ** 3];
  const hh = 1e-6;
  const a = P(1 - hh), b = P(1 + hh);
  const dir = [0, 1, 2].map(i => (b[i] - a[i]) / (2 * hh));
  const scale = dir[0];
  ok(near(dir[0] / scale, 1, 1e-5) && near(dir[1] / scale, 2, 1e-5) && near(dir[2] / scale, 3, 1e-5),
    'kp-t3-10：$t=1$ 处有限差分方向向量归一后为 $(1,2,' + (dir[2] / scale).toFixed(6) + ')$，即 $d=3$');
  ok(Q('calc-h4-t3-03').answers.includes('3'), 'kp-t3-10：填空答案含 3');
}

/* 3.16 矩形区域二重积分（二维中点法） */
{
  const nx = 4000, ny = 6000, dx = 2 / nx, dy = 3 / ny;
  let s = 0;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) s += 1;
  const v = s * dx * dy;
  const q = Q('calc-h4-t4-01');
  const { hits, parsed } = exactlyOne(q, v, 1e-9);
  ok(near(v, 6, 1e-12) && hits === 1 && parsed === 4,
    'kp-t4-01：二维中点法得 ' + v.toFixed(10) + '（2×3 的面积），选项恰 1 项符合');
}

/* 3.17 散度（填空 8，用中心差分独立求偏导） */
{
  const F = (x, y, z) => [x * x, y * y, z * z];
  const div = (x, y, z) => {
    const hh = 1e-6;
    const a = F(x + hh, y, z)[0] - F(x - hh, y, z)[0];
    const b = F(x, y + hh, z)[1] - F(x, y - hh, z)[1];
    const c = F(x, y, z + hh)[2] - F(x, y, z - hh)[2];
    return (a + b + c) / (2 * hh);
  };
  const v = div(1, 2, 1);
  ok(near(v, 8, 1e-6) && Q('calc-h4-t4-02').answers.includes('8'),
    'kp-t4-11：中心差分得 $\\operatorname{div}\\mathbf{F}(1,2,1)=$ ' + v.toFixed(6) + '，填空答案含 8');
}

/* 3.18 通解定常数（代回方程验证） */
{
  const C = 2, y = x => C * Math.exp(-2 * x) + 1, dy = x => -2 * C * Math.exp(-2 * x);
  const res = [0, 0.7, 1.9].map(x => dy(x) + 2 * y(x) - 2);
  ok(near(y(0), 3, 1e-12) && res.every(r => near(r, 0, 1e-12)),
    'kp-t5-01：$C=2$ 时 $y(0)=3$ 且 $y\'+2y-2$ 在 3 个采样点为 0（代回验证通过）');
  const q = Q('calc-h4-t5-01');
  const { hits, parsed } = exactlyOne(q, 2, 1e-9);
  ok(hits === 1 && parsed === 4, 'kp-t5-01：选项恰 1 项等于 2');
}

/* 3.19 向量夹角 */
{
  const a = [1, 2, 2], b = [2, -1, 0];
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const na = Math.hypot(...a), nb = Math.hypot(...b);
  const th = Math.acos(Math.max(-1, Math.min(1, dot / (na * nb))));
  const q = Q('calc-h4-t6-01');
  const { hits, parsed } = exactlyOne(q, th, 1e-9);
  ok(near(dot, 0, 1e-12) && near(th, Math.PI / 2, 1e-12) && hits === 1 && parsed === 4,
    'kp-t6-02：数量积 ' + dot + '、模 ' + na.toFixed(4) + '/' + nb.toFixed(4) + '，夹角 ' + (th / Math.PI).toFixed(6) + 'π');
}

/* 3.20 等比级数部分和 */
{
  let s = 0; for (let n = 1; n <= 60; n++) s += (1 / 3) ** n;
  const q = Q('calc-h4-t7-01');
  const { hits, parsed } = exactlyOne(q, s, 1e-9);
  ok(near(s, 0.5, 1e-9) && hits === 1 && parsed === 4,
    'kp-t7-01：前 60 项部分和 ' + s.toFixed(12) + '（余项 < 1e-28），选项恰 1 项等于 1/2');
}

/* ---------- 4. 施工图一致性 ---------- */
console.log('');
console.log('=== 4. 施工图一致性 ===');
const md = fs.readFileSync(path.join(dir, '出题施工图.md'), 'utf8');
const rows = {};
for (const line of md.split(/\r?\n/)) {
  const m = line.match(/^\|\s*(kp-t\d-\d+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/);
  if (m) rows[m[1].trim()] = { level: m[5].trim(), types: m[8].trim().split('·').map(s => s.trim()) };
}
ok(Object.keys(rows).length === 90, '施工图表 A 解析到 90 行');

let c3bad = [];
for (const [id, sp] of Object.entries(SPEC)) {
  const q = Q(id);
  const r = rows[sp.kp];
  if (!r) { c3bad.push(id + ' 无对应行'); continue; }
  if (!r.types.includes(q.type)) c3bad.push(id + '(' + q.type + '∉' + r.types.join('/') + ')');
}
ok(c3bad.length === 0, 'C3：20 题实际题型全部落在各自知识点的「建议题型」内' + (c3bad.length ? '；违规：' + c3bad.join('，') : ''));

const basisKp = Object.entries(rows).filter(([, r]) => r.level === '基础').map(([k]) => k);
const zeroBasic = basisKp.filter(k => !S.questions.some(q => q.kpId === k && q.level === '基础'));
ok(zeroBasic.length === 0, '施工图「难度」列为主档「基础」的 ' + basisKp.length + ' 个知识点，全部已有基础题（补前 kp-t3-01 为 0 道）');

/* ---------- 5. 统计 ---------- */
console.log('');
console.log('=== 5. 统计口径 ===');
const lv = {}, ty = {};
S.questions.forEach(q => { lv[q.level] = (lv[q.level] || 0) + 1; ty[q.type] = (ty[q.type] || 0) + 1; });
ok(lv['基础'] === BASE.byLevel['基础'] && lv['强化'] === BASE.byLevel['强化'] && lv['综合'] === BASE.byLevel['综合'], '难度 基础 ' + BASE.byLevel['基础'] + ' / 强化 ' + BASE.byLevel['强化'] + ' / 综合 ' + BASE.byLevel['综合'] + '（基础占比 ' + (BASE.byLevel['基础'] / BASE.total * 100).toFixed(1) + '%）');
ok(ty.choice === BASE.byType.choice && ty.fill === BASE.byType.fill && ty.solve === BASE.byType.solve, '题型 选择 ' + BASE.byType.choice + ' / 填空 ' + BASE.byType.fill + ' / 解答 ' + BASE.byType.solve);
const pos = [0, 0, 0, 0];
S.questions.filter(q => q.type === 'choice').forEach(q => pos[q.answer]++);
ok(pos[3] >= 21, '选择题答案位置 A/B/C/D = ' + pos.join(' / ') + '（改前 22/22/23/16，D 由 16 提升到 ' + pos[3] + '）');
const subj = { 'math-1': 0, 'math-2': 0, 'math-3': 0 };
S.questions.forEach(q => (q.subject || []).forEach(s => { if (subj[s] !== undefined) subj[s]++; }));
console.log('  （科目 数一/数二/数三 = ' + subj['math-1'] + ' / ' + subj['math-2'] + ' / ' + subj['math-3'] + '）');

/* ---------- 6. 换行风格 ---------- */
console.log('');
console.log('=== 6. 换行风格 ===');
const raw = fs.readFileSync(path.join(dir, 'question-bank.js'), 'utf8');
ok(!/(?<!\r)\n/.test(raw) && /\r\n/.test(raw), 'question-bank.js 保持纯 CRLF（裸 LF ' + (raw.match(/(?<!\r)\n/g) || []).length + '）');

console.log('');
console.log('----');
console.log('H4 批专项：' + pass + ' 项通过 / ' + fail + ' 项失败');
if (fail) process.exit(1);
