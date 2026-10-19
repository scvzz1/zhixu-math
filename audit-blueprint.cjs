/* 出题施工图自检（表 A 规格一致性）
 *
 * 规约来自《出题施工图》§2.2 取值规范与 §2.4 一致性约束：
 *   C1（硬）「解答用时」非 `—`  ⟺  「建议题型」含 solve
 *   C2（硬）「选填用时」非 `—`  ⟺  「建议题型」含 choice 或 fill
 *   C3（硬）题库中该知识点实际出现的题型 ⊆ 「建议题型」
 *   W1（提示）「建议题型」种类数 > 「建议题量」——仅提示，说明该批次要从中挑若干种落地
 *   W2（提示）「建议题型」已列但题库内 0 道——即尚未补齐的题型缺口（H2 的依据）
 *
 * 用法：node audit-blueprint.cjs [出题施工图.md] [question-bank.js]
 *   参数可省，默认取脚本同目录下的同名文件。经典库已于 2026-10-16 退役，不再参与 C3/W2 判定。
 * 退出码：存在硬约束违规时为 1（提示项不影响退出码）。
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const bp = process.argv[2] || path.join(dir, '出题施工图.md');
const qb = process.argv[3] || path.join(dir, 'question-bank.js');

const md = fs.readFileSync(bp, 'utf8');
const ROW = /^\|\s*(kp-t\d-\d\d)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|\s*$/;
const clean = s => String(s).replace(/\*/g, '').replace(/<br\s*\/?>/gi, ' ').trim();
const tsetOf = s => clean(s).split(/[·+\/、]/).map(x => x.trim()).filter(Boolean);

const rows = [];
for (const line of md.split(/\r?\n/)) {
  const m = line.match(ROW);
  if (!m) continue;
  rows.push({
    kpId: clean(m[1]), name: clean(m[2]), basis: clean(m[3]), subject: clean(m[4]),
    level: clean(m[5]), tf: clean(m[6]), ans: clean(m[7]), types: tsetOf(m[8]),
    planned: clean(m[9]), existing: clean(m[10]), hit: clean(m[11])
  });
}
if (!rows.length) { console.error('未解析到表 A 数据行，检查 ' + bp); process.exit(2); }

let bank = null;
if (fs.existsSync(qb)) {
  const w = {};
  new Function('window', fs.readFileSync(qb, 'utf8'))(w);
  bank = w.ZHIXU_BANK;
}

const hard = [], soft = [];
const H = (r, rule, msg) => hard.push({ id: r.kpId, name: r.name, rule, msg });
const S = (r, rule, msg) => soft.push({ id: r.kpId, name: r.name, rule, msg });

const actualTypes = kp => {
  if (!bank) return null;
  const t = {};
  for (const q of bank.questions) if (q.kpId === kp) t[q.type] = (t[q.type] || 0) + 1;
  return t;
};

for (const r of rows) {
  const tset = r.types;
  if (!tset.length) { H(r, 'R0', '建议题型为空'); continue; }
  const unknown = tset.filter(t => !['choice', 'fill', 'solve'].includes(t));
  if (unknown.length) H(r, 'R0', '建议题型含未知取值: ' + unknown.join('、'));
  if (tset.length !== new Set(tset).size) H(r, 'R0', '建议题型有重复项: ' + r.types);
  if (!['基础', '强化', '综合'].includes(r.level)) H(r, 'R5', '难度取值非法: ' + r.level);
  if (!/^(✔|◐|—)/.test(r.hit)) H(r, 'R6', '真题命中取值非法: ' + r.hit);
  if (!/^\d+$/.test(r.planned)) H(r, 'R4', '建议题量非法: ' + r.planned);
  if (!/^\d+$/.test(r.existing)) H(r, 'R4', '现有题量非法: ' + r.existing);
  if (!/^\d+$/.test(r.tf) && r.tf !== '—') H(r, 'R2', '选填用时取值非法: ' + r.tf);
  if (!/^\d+$/.test(r.ans) && r.ans !== '—') H(r, 'R1', '解答用时取值非法: ' + r.ans);

  // C1
  const ansNum = /^\d+$/.test(r.ans), hasSolve = tset.includes('solve');
  if (ansNum && !hasSolve) H(r, 'C1', `解答用时=${r.ans}，但建议题型=${r.types} 不含 solve`);
  if (!ansNum && hasSolve) H(r, 'C1', `解答用时=—，但建议题型=${r.types} 含 solve`);

  // C2
  const tfNum = /^\d+$/.test(r.tf), hasTF = tset.includes('choice') || tset.includes('fill');
  if (tfNum && !hasTF) H(r, 'C2', `选填用时=${r.tf}，但建议题型=${r.types} 不含 choice/fill`);
  if (!tfNum && hasTF) H(r, 'C2', `选填用时=—，但建议题型=${r.types} 含 choice/fill`);

  // C3
  const at = actualTypes(r.kpId);
  if (at) {
    const miss = Object.keys(at).filter(t => !tset.includes(t));
    if (miss.length) H(r, 'C3', `题库已有题型 ${miss.join('、')}，但建议题型=${r.types} 未列`);
  }

  // W1
  if (tset.length > Number(r.planned)) S(r, 'W1', `建议题型 ${tset.length} 种 > 建议题量 ${r.planned}（该批次从中挑 ${r.planned} 种落地）`);

  // W2
  if (at) {
    const notYet = tset.filter(t => !at[t]);
    if (notYet.length) S(r, 'W2', `建议题型已列但库内 0 道: ${notYet.join('、')}`);
  }
}

console.log('出题施工图 §2.4 自检：' + path.basename(bp));
console.log('  表 A 数据行 ' + rows.length + ' 行');
console.log('  硬约束（C1/C2/C3 + 取值合法性）：' + (hard.length ? hard.length + ' 项违规' : '全部通过'));
if (hard.length) for (const f of hard) console.log(`    ✗ [${f.rule}] ${f.id} ${f.name} → ${f.msg}`);
console.log('  提示项（W1/W2）：' + soft.length + ' 条');
const w1 = soft.filter(x => x.rule === 'W1').length, w2 = soft.filter(x => x.rule === 'W2');
console.log('    W1 题型种类 > 建议题量：' + w1 + ' 条');
console.log('    W2 建议题型尚未落地（题型缺口）：' + w2.length + ' 条' + (w2.length ? ' —— 即 H2 批的规范依据' : ''));
if (w2.length) {
  const byType = {};
  for (const x of w2) byType[x.msg.split(': ')[1]] = (byType[x.msg.split(': ')[1]] || 0) + 1;
  console.log('      缺口分布：' + Object.entries(byType).map(([k, v]) => k + ' × ' + v).join('，'));
}
console.log('\n  结果：' + (hard.length ? '存在硬约束违规，需修正' : '硬约束全部通过'));
process.exit(hard.length ? 1 : 0);
