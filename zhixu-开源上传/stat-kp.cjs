/* 统计知识点注册表与实际出题覆盖：总知识点 / 有题 / 无题，按专题分布 */
const fs = require('fs');
const win = {};
for (const f of ['question-bank.js']) { // 经典库已退役
  new Function('window', fs.readFileSync(f, 'utf8'))(win);
}
const b = win.ZHIXU_BANK;
const kps = b.knowledgePoints || [];
const qs = b.questions || [];

// 每道题归属的 kpId（resolveKnowledgePoints 已写入 q.kpId）
const covered = new Set();
for (const q of qs) {
  if (q.kpId) covered.add(q.kpId);
  if (Array.isArray(q.kpIds)) q.kpIds.forEach(x => covered.add(x));
}

const byTopic = new Map();
for (const kp of kps) {
  if (!byTopic.has(kp.topic)) byTopic.set(kp.topic, { total: 0, covered: 0, missing: [] });
  const rec = byTopic.get(kp.topic);
  rec.total++;
  if (covered.has(kp.id)) rec.covered++;
  else rec.missing.push(kp.id + ' ' + kp.name);
}

console.log('题库总量:', qs.length, ' 题目归属到的 kpId 数:', covered.size);
console.log('知识点注册表总数:', kps.length);
let tot = 0, cov = 0;
const missingAll = [];
for (const t of [...byTopic.keys()].sort((a, b2) => a - b2)) {
  const r = byTopic.get(t);
  const name = (b.topics[t] && b.topics[t].name) || ('topic' + t);
  tot += r.total; cov += r.covered;
  console.log(`  t${t} ${name}: 共 ${r.total}  有题 ${r.covered}  无题 ${r.total - r.covered}`);
  r.missing.forEach(x => missingAll.push('t' + t + ' ' + x));
}
console.log(`\n汇总: 共 ${tot} 个知识点，有题 ${cov}，无题 ${tot - cov}`);
console.log('\n=== 无题知识点清单 (' + missingAll.length + ') ===');
missingAll.forEach((x, i) => console.log('  ' + (i + 1) + '. ' + x));
