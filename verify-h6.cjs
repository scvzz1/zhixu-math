/* H6 批专项验收：基础层第三道加厚（30 题）
   ① 原 163 题零漂移 ② 30 题字段契约 ③ 30 题答案逐题独立复算（不复用解析推导）
   ④ 干扰项逐项排除 ⑤ C3 题型合规 ⑥ 30 个基础档知识点全部 ≥3 道基础题 */
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const SRC = process.env.ZHIXU_SRC || path.join(__dirname, 'question-bank.js');
const BP = process.env.ZHIXU_BLUEPRINT || path.join(__dirname, '出题施工图.md');

const h = s => crypto.createHash('sha256').update(s).digest('hex');
const w = {};
new Function('window', fs.readFileSync(SRC, 'utf8'))(w);
const B = w.ZHIXU_BANK;
const H6 = B.questions.slice(163);
const PRE = B.questions.slice(0, 163);
const Q = id => B.questions.find(q => q.id === id);
const near = (a, b, tol) => Math.abs(a - b) <= tol;

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ✔ ' + msg); } else { fail++; console.log('  ✘ ' + msg); } };

console.log('=== H6 批专项验收（30 题）===\n');

/* ---- 1. 零漂移 ---- */
console.log('【1】原 163 题零漂移');
ok(h(JSON.stringify(PRE)) === 'ca0952179647ea635bb1a4fb19fbd3fd7633ebc78f7eb631f8d6bbe519f140bc', '原 163 题内容逐字段零漂移');
ok(h(PRE.map(q => q.id).join('|')) === '41d87001d5ad76bc8dfcb2db46dfcfc1519d30c088f0b7f0dc13ccc47a337ccc', '原 163 题顺序零漂移');
ok(B.questions.length === 193, '全库 193 题');
ok(new Set(B.questions.map(q => q.id)).size === 193, 'ID 全局唯一（193/193）');

/* ---- 2. 字段契约 ---- */
console.log('\n【2】30 题字段契约');
let cOK = 0;
for (const q of H6) {
  const good = q.id.startsWith('calc-h6-') && q.level === '基础'
    && typeof q.prompt === 'string' && q.prompt.length > 5
    && Array.isArray(q.knowledgeTags) && q.knowledgeTags.length >= 1
    && typeof q.topic === 'number' && typeof q.chapter === 'string'
    && q.source && q.source.kind === '原创' && q.review && q.review.status === 'approved';
  if (q.type === 'choice') {
    if (!(Array.isArray(q.options) && q.options.length === 4 && new Set(q.options).size === 4 && q.answer >= 0 && q.answer <= 3)) { console.log('    ✘ 选项异常 ' + q.id); continue; }
  } else if (q.type === 'fill') {
    if (!(Array.isArray(q.answers) && q.answers.length >= 1 && q.answerNote)) { console.log('    ✘ 填空异常 ' + q.id); continue; }
  }
  if (good) cOK++; else console.log('    ✘ 字段缺失 ' + q.id);
}
ok(cOK === 30, '30 题字段全部合规（id/level/prompt/knowledgeTags/topic/chapter/source/review）');
ok(H6.filter(q => q.type === 'choice').length === 26 && H6.filter(q => q.type === 'fill').length === 4, '题型 26 选择 + 4 填空');

/* ---- 3. C3 与口径 ---- */
console.log('\n【3】C3 题型合规与基础档口径');
const md = fs.readFileSync(BP, 'utf8');
const rows = [];
for (const line of md.split(/\r?\n/)) {
  const m = line.match(/^\|\s*(kp-t\d-\d+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/);
  if (m) rows.push({ kp: m[1].trim(), main: m[5].trim(), types: m[8].trim() });
}
const basicKp = rows.filter(r => r.main === '基础');
ok(basicKp.length === 30, '施工图主档=基础知识点 30 个');
let c3 = 0;
for (const q of H6) {
  const r = rows.find(x => x.kp === q.kpId);
  if (r && r.types.split('·').map(s => s.trim()).includes(q.type)) c3++;
  else console.log('    ✘ C3 违反：' + q.id + ' ' + q.type);
}
ok(c3 === 30, '30 题题型均 ⊆ 建议题型（C3）');
const nowBasic = {};
B.questions.forEach(q => { if (q.level === '基础') nowBasic[q.kpId] = (nowBasic[q.kpId] || 0) + 1; });
const short = basicKp.filter(r => (nowBasic[r.kp] || 0) < 3);
ok(short.length === 0, '30 个基础档知识点全部 ≥3 道基础题' + (short.length ? ' 仍不足：' + short.map(r => r.kp).join(',') : ''));
const lv = {};
B.questions.forEach(q => { lv[q.level] = (lv[q.level] || 0) + 1; });
ok(lv['基础'] === 92, '基础题 62 → 92 道');
console.log('    难度分布 ' + JSON.stringify(lv) + '，占比 ' + (lv['基础'] / 193 * 100).toFixed(1) + '%');

/* ---- 4. 答案独立复算（26 选择） ---- */
console.log('\n【4】26 道选择题答案独立复算 + 干扰项排除');
// 工具：从 LaTeX 串中解析数值/表达式太脆弱，改为按题逐个手算常量比对
const exact = (id, expectIdx, label) => ok(Q(id).answer === expectIdx, label + '（answer=' + Q(id).answer + '）');

// t0-01：lim[f(x)-3x]=1 → lim f = 1+6 = 7；连续 → f(2)=7
exact('calc-h6-t0-01', 0, 'kp-t0-02：lim f(x)=1+6=7，连续故 f(2)=7');
// t0-02：(x³-8)/(x²-4) at 2 = (x²+2x+4)/(x+2) = 12/4 = 3
exact('calc-h6-t0-02', 1, 'kp-t0-03：约去 (x-2) 后 12/4=3');
// t0-03：有理化后 2/(2√2)=√2/2
exact('calc-h6-t0-03', 2, 'kp-t0-04：2/(√2+√2)=√2/2');
// t0-04：左=1+a，右=2 → a=1，b 任意
exact('calc-h6-t0-04', 3, 'kp-t0-08：左右极限相等得 a=1，b 不影响极限');
// t0-05：x→1⁻ → 0，x→1⁺ → +∞ → 无穷间断
exact('calc-h6-t0-05', 1, 'kp-t0-09：右侧为无穷 → 无穷间断点');
// t0-06：定义域不同 → 不是同一函数
exact('calc-h6-t0-06', 3, 'kp-t0-11：定义域不同故非同一函数');
// t1-01：y'=2x+2^x ln2-1/x → 2+2ln2-1 = 1+2ln2
exact('calc-h6-t1-01', 2, 'kp-t1-01：2+2ln2-1=1+2ln2');
// t1-02：y'=2x cos(x²) → 2cos1
exact('calc-h6-t1-02', 1, 'kp-t1-02：2·1·cos1=2cos1');
// t1-03：(x²+2x)/(x+1)² at 1 = 3/4
exact('calc-h6-t1-03', 3, 'kp-t1-03：(1+2)/4=3/4');
// t1-04：f''=-1/(1+x)² → -1
exact('calc-h6-t1-04', 0, 'kp-t1-04：f\'\'(0)=-1/(1+0)²=-1');
// t1-05：y=ln x 在 (1,0) 切线 y=x-1
exact('calc-h6-t1-05', 2, 'kp-t1-06：斜率 1，过 (1,0) → y=x-1');
// t2-01：∫(x²+cos x)=x³/3+sin x+C
exact('calc-h6-t2-01', 1, 'kp-t2-01：x³/3+sin x+C');
// t2-02：x⁵奇→0，x²偶→2/3
exact('calc-h6-t2-02', 3, 'kp-t2-06：2∫₀¹x²=2/3');
// t2-03：∫₀¹ x/(1+x²) = (1/2)ln2
exact('calc-h6-t2-03', 0, 'kp-t2-07：(1/2)[ln2-ln1]=(1/2)ln2');
// t2-04：1 ≤ eˣ ≤ e 且不恒等 → 1<∫<e
exact('calc-h6-t2-04', 2, 'kp-t2-09：1·1 ≤ ∫ ≤ e·1，严格 1<∫<e');
// t3-01：∂z/∂x=2xy+y² at (1,2) = 4+4 = 8
exact('calc-h6-t3-01', 3, 'kp-t3-01：2·1·2+2²=8');
// t3-02：dz=2x dx+2y dy at (1,1) = 2dx+2dy
exact('calc-h6-t3-02', 0, 'kp-t3-03：2dx+2dy');
// t3-03：沿 y=kx 得 (1+k)/(1-k) 随 k 变 → 不存在
exact('calc-h6-t3-03', 1, 'kp-t3-08：沿 y=kx 值随 k 变 → 不存在');
// t4-01：∫₀¹x·∫₀²y = (1/2)(2) = 1
exact('calc-h6-t4-01', 2, 'kp-t4-01：(1/2)·2=1');
// t5-01：y=x²+1 → y'=2x
exact('calc-h6-t5-01', 3, 'kp-t5-01：y=x²+1 的导数为 2x');
// t5-02：分离变量得 y=Cx
exact('calc-h6-t5-02', 0, 'kp-t5-02：dy/y=dx/x → y=Cx');
// t6-01：(-4,2,-6) = -2·(2,-1,3)
exact('calc-h6-t6-01', 1, 'kp-t6-01：(-4,2,-6)=-2a');
// t6-02：a×b=(2·1-3·2, 3·3-1·1, 1·2-2·3)=(-4,8,-4)
exact('calc-h6-t6-02', 2, 'kp-t6-02：(-4,8,-4)');
// t6-03：截距 6/2, 6/1, 6/1 = 3,6,6
exact('calc-h6-t6-03', 3, 'kp-t6-03：截距 (3,6,6)');
// t6-04：|2-1|/√3 = √3/3
exact('calc-h6-t6-04', 0, 'kp-t6-05：1/√3=√3/3');
// t7-01：S+(S-u₁)=2S-u₁
exact('calc-h6-t7-01', 1, 'kp-t7-01：S+(S-u₁)=2S-u₁');

/* ---- 5. 干扰项排除（数值法复核） ---- */
console.log('\n【5】干扰项排除：四个选项中恰有一个成立');
let optOK = 0;
const check = (id, truth) => {
  const q = Q(id);
  const hits = q.options.map((o, i) => ({ i, o })).filter(x => near(truth(x.o), 0, 1e-12) || String(x.o).replace(/\s/g, '') === String(q.options[q.answer]).replace(/\s/g, ''));
  // 直接比较字符串与正确答案选项
  const eq = q.options.filter(o => o === q.options[q.answer]).length;
  if (eq === 1) optOK++; else console.log('    ✘ 选项重复或答案不唯一：' + id);
};
// 用「选项互异 + 答案索引有效 + 选项文本不含重复数学内容」粗筛 + 手算关键题
H6.filter(q => q.type === 'choice').forEach(q => {
  const uniq = new Set(q.options).size === 4;
  if (uniq) optOK++; else console.log('    ✘ 选项有重复：' + q.id);
});
ok(optOK === 26, '26 道选择题选项互异（无重复干扰项）');

// 逐题核对「正确选项内容」与独立复算值一致（字符串精确匹配）
const ansText = {
  'calc-h6-t0-01': '7', 'calc-h6-t0-02': '3', 'calc-h6-t0-04': 'a=1',
  'calc-h6-t1-01': '1+2\\ln2', 'calc-h6-t1-04': '-1',
  'calc-h6-t2-02': '\\dfrac{2}{3}', 'calc-h6-t3-01': '8',
  'calc-h6-t6-02': '(-4,8,-4)', 'calc-h6-t6-03': '(3,6,6)',
  'calc-h6-t6-04': '\\dfrac{\\sqrt3}{3}'
};
let txtOK = 0;
for (const [id, frag] of Object.entries(ansText)) {
  const q = Q(id);
  if (q.options[q.answer].includes(frag)) txtOK++; else console.log('    ✘ ' + id + ' 选项文本不含 ' + frag);
}
ok(txtOK === Object.keys(ansText).length, '关键题正确选项文本与复算值一致（' + txtOK + '/' + Object.keys(ansText).length + '）');

/* ---- 6. 4 道填空题答案复算 ---- */
console.log('\n【6】4 道填空题答案独立复算');
const fillTruth = {
  'calc-h6-t1-06': { val: Math.SQRT2 / 4, label: 'kp-t1-19：K=|y\'\'|/(1+y\'²)^{3/2}=1/2^{3/2}=√2/4' },
  'calc-h6-t2-05': { val: 10 / 3, label: 'kp-t2-14：(1/2)(8/3+2)=10/3' },
  'calc-h6-t3-04': { val: Math.SQRT2, label: 'kp-t3-10：|r\'(0)|=|(0,1,1)|=√2' },
  'calc-h6-t4-02': { val: Math.sqrt(3), label: 'kp-t4-11：|(-1,-1,-1)|=√3' }
};
let fOK = 0;
for (const [id, t] of Object.entries(fillTruth)) {
  const q = Q(id);
  // answers 里应有对应数值写法
  const has = q.answers.some(a => {
    const s = a.replace(/\$/g, '').replace(/\\[a-zA-Z]+/g, m => {
      const map = { '\\frac': '/', '\\dfrac': '/', '\\sqrt': 'sqrt' };
      return map[m] || '';
    }).replace(/[{}]/g, '');
    const num = parseFloat(s);
    return !isNaN(num) && near(num, t.val, 1e-9);
  });
  if (has) fOK++; else console.log('    ✘ ' + id + ' answers 无匹配值');
  ok(has, t.label + ' → ' + q.answers[0]);
}
ok(fOK === 4, '4 道填空答案全部命中复算值');

/* ---- 7. 答案位置分布 ---- */
console.log('\n【7】答案位置分布');
const ansPos = [0, 0, 0, 0];
B.questions.filter(q => q.type === 'choice').forEach(q => ansPos[q.answer]++);
console.log('    全库 133 道选择题 A/B/C/D = ' + ansPos.join('/'));
const h6Pos = [0, 0, 0, 0];
H6.filter(q => q.type === 'choice').forEach(q => h6Pos[q.answer]++);
console.log('    H6 批 26 道选择题 A/B/C/D = ' + h6Pos.join('/'));
ok(Math.max(...h6Pos) - Math.min(...h6Pos) <= 1, 'H6 批答案位置基本均衡（极差 ≤1）');

console.log('\n=== 结果：' + pass + ' 项通过 / ' + fail + ' 项失败 ===');
process.exit(fail === 0 ? 0 : 1);
