/**
 * verify-baseline.cjs —— 验收基线快照（各验收脚本共用的单一真源）
 * ---------------------------------------------------------------------------
 * 为什么要有这个文件：
 *   补题后多份验收脚本原先各自内联"期望题量 / 题型 / 科目 / 各知识点题数"，
 *   每批都要逐份手改（H2 批改了 10 份脚本，且漏传了 verify-t0.cjs）。
 *   本文件把这些期望计数集中到一处，补题后只需更新这里。
 *
 * 设计约束（重要，勿简化）：
 *   1) 本快照 **不会自动跟随题库变化**。bankSha256 / soloSha256 记录生成时刻
 *      的题库指纹；脚本启动时调用 checkBank(N)，指纹不符即打印 [基线过期]
 *      警告，避免"期望值跟着实测值走、断言退化成永真"。
 *   2) 更新方式：把题库与验收脚本放同一目录，运行
 *        node verify-baseline.cjs --refresh
 *      它会打印"快照值 → 实测值"的逐项差异；确认差异符合本次补题意
 *      图后，再按输出更新本文件常量。
 *   3) 内容基线（verify-quality 的逐题指纹、各脚本内的硬哈希）**不在此处**，
 *      仍留在各自脚本内——那些是"不得变化"的锚，语义与本快照相反。
 *
 * 取值依据：2026-10-15 H2 批回传后的盘上题库（202 题 = 115 原创 + 87 OpenStax）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const B = {
  version: 'v5 · 2026-10-18',
  basis: '2026-10-18 H6 批（基础层加厚，30 个基础档知识点各补第 3 道）后的 193 题（全部为项目自有题库）',

  // ---- 题库指纹：用于检测"题库已变、快照未更新" ----
  bankSha256: '80df46b847d8971fa48e13f5bb469cf471609176ad2497da8d986c0504bc32e6',
  soloSha256: '80df46b847d8971fa48e13f5bb469cf471609176ad2497da8d986c0504bc32e6',

  // ---- 总量 ----
  total: 193,
  solo: 193,
  classic: 0,
  kpTotal: 90,
  topicCount: 8,

  // ---- 分布 ----
  byType: { choice: 133, fill: 35, solve: 25 },
  bySubject: { 'math-1': 193, 'math-2': 146, 'math-3': 157 },
  byTopic: { 0: 32, 1: 38, 2: 34, 3: 24, 4: 19, 5: 17, 6: 14, 7: 15 },
  byLevel: { '基础': 92, '强化': 68, '综合': 33 },

  // ---- 批次 ----
  batch: { orig: 54, h1: 14, h2: 25, h3: 20, h4: 20, h5: 8, h6: 30 },
  origByType: { choice: 28, fill: 15, solve: 11 },
  preH1: 154, // 剔除 H1/H2 批后（原 76 + H3 20 + H4 20 + H5 8 + H6 30）
  preH2: 168, // 剔除 H2 批后（原 76 + H1 14 + H3 20 + H4 20 + H5 8 + H6 30）
  oldSet: 65, // t45 口径的"旧题"数（至 t4/t5 交付时已存在的原创题，剔除 H1/H2/H3/H4/H5 批后）

  // ---- 专题专项 ----
  t6: 14,
  t7: 15,
  t67Kp: 12,
  solveKp: 25, // 解答题覆盖的知识点数
  h1Kp: 14, // H1 批覆盖的知识点数
  t0News: { choice: 3, fill: 1, solve: 1 },

  // ---- 各知识点题数 ----
  // 默认：t0–t6 每个知识点 1 题，t7 每个知识点 2 题。
  // 例外：下表为"实测值 ≠ 默认值"的全部知识点（2026-10-18 H6 批后实测，共 63 个）。
  kpDefaultByTopic: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2 },
  kpExceptions: {
    'kp-t0-01': 2, 'kp-t0-02': 3, 'kp-t0-03': 3, 'kp-t0-04': 3,
    'kp-t0-05': 2, 'kp-t0-06': 2, 'kp-t0-08': 3, 'kp-t0-09': 3,
    'kp-t0-11': 3, 'kp-t0-13': 2, 'kp-t0-15': 2, 'kp-t1-01': 3,
    'kp-t1-02': 3, 'kp-t1-03': 3, 'kp-t1-04': 3, 'kp-t1-06': 3,
    'kp-t1-07': 2, 'kp-t1-08': 2, 'kp-t1-12': 2, 'kp-t1-13': 2,
    'kp-t1-14': 2, 'kp-t1-15': 2, 'kp-t1-16': 2, 'kp-t1-19': 3,
    'kp-t2-01': 3, 'kp-t2-02': 2, 'kp-t2-03': 2, 'kp-t2-04': 3,
    'kp-t2-05': 2, 'kp-t2-06': 3, 'kp-t2-07': 3, 'kp-t2-08': 3,
    'kp-t2-09': 3, 'kp-t2-11': 3, 'kp-t2-12': 2, 'kp-t2-14': 3,
    'kp-t3-01': 4, 'kp-t3-03': 3, 'kp-t3-04': 2, 'kp-t3-07': 2,
    'kp-t3-08': 3, 'kp-t3-09': 2, 'kp-t3-10': 3, 'kp-t3-11': 2,
    'kp-t4-01': 3, 'kp-t4-07': 2, 'kp-t4-08': 2, 'kp-t4-09': 2,
    'kp-t4-10': 2, 'kp-t4-11': 3, 'kp-t5-01': 3, 'kp-t5-02': 3,
    'kp-t5-03': 2, 'kp-t5-04': 2, 'kp-t5-05': 2, 'kp-t5-06': 2,
    'kp-t5-08': 2, 'kp-t6-01': 3, 'kp-t6-02': 3, 'kp-t6-03': 3,
    'kp-t6-05': 3, 'kp-t7-01': 4, 'kp-t7-04': 3
  },

  // ---- 区间断言（供 t3 这类"后续批次仍应通过"的口径使用）----
  // 区间断言：下界 = 本批交付时的实测值（题库只增不减）；上界仅作误读防护，不是容量上限。
  range: {
    totalMin: 193,
    totalMax: 999,
    subjectMin: { 'math-1': 193, 'math-2': 146, 'math-3': 157 },
    subjectMax: { 'math-1': 999, 'math-2': 999, 'math-3': 999 }
  },

  // ---- 知识点题数期望值：例外优先，其次取调用方给的默认值（缺省 1）----
  kpExp(id, def) {
    if (Object.prototype.hasOwnProperty.call(B.kpExceptions, id)) return B.kpExceptions[id];
    return def === undefined ? 1 : def;
  },

  // ---- 题库指纹自检：不一致即提示快照可能过期（不阻断）----
  checkBank(N, label) {
    if (!N || !Array.isArray(N.questions)) return true;
    const sha = crypto.createHash('sha256').update(JSON.stringify(N.questions)).digest('hex');
    if (sha === B.bankSha256) return true;
    console.log('[基线过期] ' + (label ? label + '：' : '') +
      '实测题库指纹 ' + sha.slice(0, 16) + '… ≠ 快照 ' + B.bankSha256.slice(0, 16) + '…');
    console.log('           若本次是有意补题，请更新本快照（node verify-baseline.cjs --refresh 查看差异）；');
    console.log('           否则说明题库被意外改动，请先排查。');
    return false;
  }
};

// ---------------------------------------------------------------------------
// --refresh：打印"快照值 → 实测值"差异，供补题后更新本文件
// ---------------------------------------------------------------------------
if (require.main === module) {
  const dir = __dirname;
  const loadInto = (w, f) => new Function('window', fs.readFileSync(path.join(dir, f), 'utf8'))(w);
  let N, SW;
  try {
    const wAll = {};
    loadInto(wAll, 'question-bank.js'); // 经典库已退役，站点只加载本库
    N = wAll.ZHIXU_BANK;
    const wSolo = {};
    loadInto(wSolo, 'question-bank.js');
    SW = wSolo.ZHIXU_BANK;
    if (!N || !Array.isArray(N.questions) || !SW || !Array.isArray(SW.questions)) {
      throw new Error('题库对象结构异常');
    }
  } catch (e) {
    console.error('无法在当前目录读取题库（需要 question-bank.js 同目录）：' + e.message);
    process.exit(1);
  }
  const cnt = (a, f) => a.filter(f).length;
  const sha = s => crypto.createHash('sha256').update(s).digest('hex');
  const byType = {}; N.questions.forEach(q => byType[q.type] = (byType[q.type] || 0) + 1);
  const measured = {
    bankSha256: sha(JSON.stringify(N.questions)),
    soloSha256: sha(JSON.stringify(SW.questions)),
    total: N.questions.length,
    solo: SW.questions.length,
    classic: N.questions.length - SW.questions.length,
    kpTotal: N.knowledgePoints.length,
    topicCount: N.topics.length,
    byType,
    bySubject: ['math-1', 'math-2', 'math-3'].reduce((a, s) => (a[s] = cnt(N.questions, q => q.subject.includes(s)), a), {}),
    byTopic: [0, 1, 2, 3, 4, 5, 6, 7].reduce((a, t) => (a[t] = cnt(N.questions, q => q.topic === t), a), {}),
    batch: {
      orig: cnt(N.questions, q => /^calc-orig-t\d-\d+$/.test(q.id)),
      h1: cnt(N.questions, q => q.id.startsWith('calc-h1-')),
      h2: cnt(N.questions, q => q.id.startsWith('calc-h2-')),
      h3: cnt(N.questions, q => q.id.startsWith('calc-h3-')),
      h4: cnt(N.questions, q => q.id.startsWith('calc-h4-')),
      h5: cnt(N.questions, q => q.id.startsWith('calc-h5-')),
      h6: cnt(N.questions, q => q.id.startsWith('calc-h6-'))
    },
    byLevel: ['基础', '强化', '综合'].reduce((a, lv) => (a[lv] = cnt(N.questions, q => q.level === lv), a), {}),
    preH1: cnt(N.questions, q => !q.id.startsWith('calc-h1-') && !q.id.startsWith('calc-h2-')),
    preH2: cnt(N.questions, q => !q.id.startsWith('calc-h2-')),
    t6: cnt(N.questions, q => q.topic === 6),
    t7: cnt(N.questions, q => q.topic === 7),
    solveKp: new Set(N.questions.filter(q => q.type === 'solve').map(q => q.kpId)).size
  };
  console.log('=== 快照值 → 实测值 差异 ===');
  const cmp = (k, snap, act) => {
    const a = JSON.stringify(snap), b = JSON.stringify(act);
    console.log((a === b ? '  = ' : '  * ') + k.padEnd(12) + ' ' + a + (a === b ? '' : '  →  ' + b));
  };
  cmp('bankSha256', B.bankSha256, measured.bankSha256);
  cmp('soloSha256', B.soloSha256, measured.soloSha256);
  ['total', 'solo', 'classic', 'kpTotal', 'topicCount', 'byType', 'bySubject', 'byTopic', 'byLevel',
    'batch', 'preH1', 'preH2', 't6', 't7', 'solveKp'].forEach(k => cmp(k, B[k], measured[k]));
  // 知识点题数
  const def = k => B.kpDefaultByTopic[k.topic];
  const nowExc = {};
  N.knowledgePoints.forEach(k => {
    const c = cnt(N.questions, q => q.kpId === k.id);
    if (c !== def(k)) nowExc[k.id] = c;
  });
  const oldKeys = Object.keys(B.kpExceptions).sort().join(',');
  const newKeys = Object.keys(nowExc).sort().join(',');
  console.log('  ' + (oldKeys === newKeys && JSON.stringify(B.kpExceptions) === JSON.stringify(nowExc) ? '= ' : '* ') +
    'kpExceptions 共 ' + Object.keys(B.kpExceptions).length + ' → ' + Object.keys(nowExc).length + ' 项');
  if (oldKeys !== newKeys) {
    console.log('    新增：' + Object.keys(nowExc).filter(k => !(k in B.kpExceptions)).join(', ') || '（无）');
    console.log('    移除：' + Object.keys(B.kpExceptions).filter(k => !(k in nowExc)).join(', ') || '（无）');
  }
  console.log('\n标 * 的项与快照不一致；确认符合本次补题意图后，按实测值更新 verify-baseline.cjs。');
}

module.exports = B;
