/* 第 20 轮验收：t6/t7 补题（18 道原创）+ 去掉 empty 标记 + 专题级 subjects 清理。
   基线原为盘上第 13 轮版本（verify/ 下两份，109 题）；该快照已在 2026-10-12 的工作区
   清理中移除，脚本改为「基线可选」：找不到快照时跳过对比类断言并明确标注，其余断言
   全部基于当前版本与硬期望值，保证脚本始终可重跑。 */
const fs = require('fs');
const path = require('path');

const BASE = require('./verify-baseline.cjs'); // 期望计数集中于此，补题后只改它
const src = __dirname;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  \u2713 ' + m); } else { fail++; console.log('  \u2717 ' + m); } };
/* 注意：脚本内所有显示用的题量文案都从 verify-baseline.cjs 取，避免退役/补题后残留旧数字。 */
const load = (...files) => {
  const win = {};
  for (const f of files.filter(Boolean)) new Function('window', fs.readFileSync(path.join(src, f), 'utf8'))(win);
  return win.ZHIXU_BANK;
};
const hasBase = fs.existsSync(path.join(src, 'verify', 'question-bank.js'));
const B = hasBase ? load('verify/question-bank.js') : null;
const N = load('question-bank.js');   // 经典库退役后，站点只加载本库

console.log('=== 1. 题量与新增 ===');
console.log('    当前版本 ' + N.questions.length + ' 题'
  + (hasBase ? '（基线 ' + B.questions.length + ' 题）' : '（基线快照已清理）'));
ok(N.questions.length === BASE.total, '题量 = ' + BASE.total + '（实测 ' + N.questions.length + '；H1 批补 ' + BASE.batch.h1 + ' 道解答题，H2 批补 ' + BASE.batch.h2 + ' 道选填题）');
const newIds = N.questions.filter(q => q.id.startsWith('calc-orig-t')).map(q => q.id);
ok(newIds.length === BASE.batch.orig, '原创补题累计 ' + BASE.batch.orig + ' 道（实测 ' + newIds.length + '）');
ok(newIds.every(id => /^calc-orig-t\d-\d+$/.test(id)), '新增题 ID 全部为 calc-orig-t* 形式');
const h1Ids = N.questions.filter(q => q.id.startsWith('calc-h1-')).map(q => q.id);
ok(h1Ids.length === BASE.batch.h1, 'H1 批补题 ' + BASE.batch.h1 + ' 道（实测 ' + h1Ids.length + '）');
const t6n = N.questions.filter(q => q.topic === 6).length;
const t7n = N.questions.filter(q => q.topic === 7).length;
console.log('    t6 = ' + t6n + ' 道 · t7 = ' + t7n + ' 道');
ok(t6n === BASE.t6 && t7n === BASE.t7, 't6 ' + BASE.t6 + ' 题、t7 ' + BASE.t7 + ' 题（H1 批为 kp-t7-04 补 1 道解答题）');

console.log('\n=== 2. 原有题零漂移（需 verify/ 基线快照）===');
if (!hasBase) {
  console.log('    [跳过] 基线快照不在本地，无法逐字段复现；该结论见第 20 轮记录、复算报告与 PROJECT_INDEX。');
} else {
  const baseById = new Map(B.questions.map(q => [q.id, q]));
  const drift = [];
  for (const [id, bq] of baseById) {
    const nq = N.questions.find(q => q.id === id);
    if (!nq) { drift.push(id + '(丢失)'); continue; }
    if (JSON.stringify(bq) !== JSON.stringify(nq)) drift.push(id);
  }
  ok(drift.length === 0, '原有 ' + baseById.size + ' 题逐字段零漂移（实测差异 ' + drift.length + ' 处'
    + (drift.length ? '：' + drift.slice(0, 5).join(', ') : '') + '）');
}

console.log('\n=== 3. 知识点覆盖（本轮核心目标）===');
const kpCount = kp => N.questions.filter(q => q.kpId === kp.id).length;
const t67 = N.knowledgePoints.filter(k => k.topic === 6 || k.topic === 7);
const empty = t67.filter(k => kpCount(k) === 0);
console.log('    t6/t7 知识点共 ' + t67.length + ' 个，无题的 ' + empty.length + ' 个');
ok(t67.length === BASE.t67Kp && empty.length === 0, 't6/t7 全部 ' + BASE.t67Kp + ' 个知识点均已有题（消灭零作答）');
ok(N.knowledgePoints.filter(k => k.topic === 6).every(k => kpCount(k) === BASE.kpExp(k.id, BASE.kpDefaultByTopic[6])), 't6 每个知识点题数符合基线快照');
ok(N.knowledgePoints.filter(k => k.topic === 7).every(k => kpCount(k) === BASE.kpExp(k.id, BASE.kpDefaultByTopic[7])), 't7 每个知识点题数符合基线快照');
const allKpEmpty = N.knowledgePoints.filter(k => kpCount(k) === 0).length;
console.log('    全库无题知识点：48 → ' + allKpEmpty);
ok(allKpEmpty === 0, '全库' + BASE.kpTotal + '知识点全覆盖，无题知识点为0（实测 ' + allKpEmpty + '）');

console.log('\n=== 4. empty 标记与专题呈现 ===');
ok(N.topics.length === BASE.topicCount, '专题数仍为 ' + BASE.topicCount);
ok(N.topics.every(t => t.empty === undefined), '全部专题已无 empty 标记（不再显示「待补题」）');
ok(N.topics[6].subjects.join(',') === 'math-1' && N.topics[7].subjects.join(',') === 'math-1,math-3',
  't6 科目=math-1、t7 科目=math-1,math-3（与大纲一致）');
console.log('    逐题科目：t6 = ' + JSON.stringify([...new Set(N.questions.filter(q => q.topic === 6).flatMap(q => q.subject))])
  + ' · t7 = ' + JSON.stringify([...new Set(N.questions.filter(q => q.topic === 7).flatMap(q => q.subject))]));

console.log('\n=== 5. 题型分布与字段完整性（' + BASE.total + ' 题）===');
const byType = {};
N.questions.forEach(q => { byType[q.type] = (byType[q.type] || 0) + 1; });
console.log('    ' + JSON.stringify(byType));
ok(byType.choice === BASE.byType.choice && byType.fill === BASE.byType.fill && byType.solve === BASE.byType.solve, '全库题型：choice ' + BASE.byType.choice + ' / fill ' + BASE.byType.fill + ' / solve ' + BASE.byType.solve);
const nt = {};
N.questions.filter(q => q.id.startsWith('calc-orig-t')).forEach(q => { nt[q.type] = (nt[q.type] || 0) + 1; });
console.log('    原创补题累计 54 题：' + JSON.stringify(nt));
ok(nt.choice === BASE.origByType.choice && nt.fill === BASE.origByType.fill && nt.solve === BASE.origByType.solve, '原创补题（' + BASE.batch.orig + ' 道）题型：choice ' + BASE.origByType.choice + ' / fill ' + BASE.origByType.fill + ' / solve ' + BASE.origByType.solve);
ok(nt.solve === BASE.origByType.solve, '原创库解答题 ' + BASE.origByType.solve + ' 道（原7道 + t4三道 + t5一道）');

const F17 = ['id','topic','level','type','prompt','hint','explain','source','review','subject','chapter','knowledgeTags','prerequisites','estimatedMinutes','knowledge','kpId'];
const missField = N.questions.filter(q => F17.some(f => q[f] === undefined));
ok(missField.length === 0, '全部 ' + BASE.total + ' 题 17 个字段齐全（缺 ' + missField.length + '）');
ok(N.questions.every(q => q.kpId !== null), '全部 ' + BASE.total + ' 题 kpId 非 null');
ok(N.questions.every(q => Array.isArray(q.subject) && q.subject.length && q.subject.every(s => ['math-1','math-2','math-3'].includes(s))), '全部 ' + BASE.total + ' 题 subject 合法');
ok(N.questions.every(q => q.review && q.review.status === 'approved'), '全部' + BASE.total + '题均为approved');
ok(new Set(N.questions.map(q => q.id)).size === BASE.total, 'ID 全局唯一（' + BASE.total + '/' + BASE.total + '）');
ok(N.questions.filter(q => q.type === 'choice').every(q => Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4), '全部选择题 4 个选项且答案索引在范围内');
ok(N.questions.filter(q => q.type === 'choice').every(q => new Set(q.options).size === 4), '全部选择题 4 个选项互不相同');
ok(N.questions.filter(q => q.type === 'fill').every(q => Array.isArray(q.answers) && q.answers.length > 0), '全部填空题 answers 非空');
ok(N.questions.filter(q => q.type === 'solve').every(q => typeof q.answerText === 'string' && q.answerText.length > 0), '全部解答题 answerText 非空');

console.log('\n=== 6. 累计54道原创补题的内容规范 ===');
const nq = N.questions.filter(q => q.id.startsWith('calc-orig-t'));
ok(nq.every(q => q.explain.includes('class="solution"')), '解析均为四段 solution 结构');
ok(nq.every(q => q.explain.includes('解题思路') || q.explain.includes('思路')), '解析含「思路」段');
ok(nq.every(q => q.explain.includes('<b>易错点</b>')), '解析含「易错点」段');
ok(nq.every(q => !/避免只凭结论记忆/.test(q.explain)), '易错点全部为每题专属（无通用兜底句）');
ok(nq.every(q => !/围绕“/.test(q.explain)), '解题思路全部为每题专属（无通用兜底句）');
ok(nq.every(q => q.explain.includes('solution-conclusion')), '解析含「结论」段');
ok(nq.every(q => q.source && q.source.kind === '原创' && /真题/.test(q.source.reference)), '来源标注为原创，并在 reference 中说明真题仅作考法标定');
ok(nq.every(q => q.review.reviewedAt === (/^calc-orig-t[45]-/.test(q.id) ? '2026-10-13' : '2026-10-12')), '审核日期按批次为2026-10-12或2026-10-13');
ok(nq.every(q => Number.isFinite(q.estimatedMinutes) && q.estimatedMinutes > 0), '目标用时均为正数');
const minSet = [...new Set(nq.map(q => q.estimatedMinutes))].sort((a, b) => a - b);
console.log('    目标用时取值：' + JSON.stringify(minSet));
ok(minSet.length >= 3, '目标用时不再被写死为单值（实测 ' + minSet.length + ' 种取值）');

console.log('\n=== 7. 科目可见范围 ===');
const visible = (bank, s) => bank.questions.filter(q => q.subject.includes(s)).length;
const v = s => visible(N, s);
console.log('    数学一 ' + v('math-1') + ' · 数学二 ' + v('math-2') + ' · 数学三 ' + v('math-3')
  + (hasBase ? '（基线 ' + visible(B, 'math-1') + ' / ' + visible(B, 'math-2') + ' / ' + visible(B, 'math-3') + '）' : ''));
ok(v('math-1') === BASE.bySubject['math-1'], '数学一可见 ' + BASE.bySubject['math-1'] + ' 题');
ok(v('math-2') === BASE.bySubject['math-2'], '数学二可见' + BASE.bySubject['math-2'] + '题（H2 批 25 题中 21 题含数二：t4-07/09/10 与 t5-08 为数一专属）');
ok(v('math-3') === BASE.bySubject['math-3'], '数学三可见' + BASE.bySubject['math-3'] + '题（H2 批 25 题中 20 题含数三：t4-07/09/10、t5-04、t5-08 不含数三）');

console.log('\n=== 8. 经典题库已退役 ===');
/* 退役依据：source.license === 'CC BY-NC-SA 4.0' 的 OpenStax 转写题曾占全库 87 道，
   2026-10-16 已由「知识点全覆盖」批次的原创题替换并从站点加载中移除。 */
const classicQ = N.questions.filter(q => q.source && q.source.license === 'CC BY-NC-SA 4.0');
ok(classicQ.length === BASE.classic, '全库已无 OpenStax 选编题（快照期望 ' + BASE.classic + '，实测 ' + classicQ.length + '）');
ok(!fs.existsSync(path.join(src, 'classic-question-bank.js')), 'classic-question-bank.js 已从站点目录移除');
/* 剩余 7 道「原创变式」在 source.reference 里把公开教材写作出处，仅用于标定考法；
   它们没有 CC 许可、没有 source.url、题干与数据均为原创，因此不构成转载义务。 */
const refHits = N.questions.filter(q => /openstax/i.test(String((q.source || {}).reference || '')));
ok(refHits.every(q => q.source.kind === '原创变式' && !q.source.url && !/CC BY/.test(String(q.source.license))),
  '提及公开教材的仅 ' + refHits.length + ' 道「原创变式」（无 URL、无 CC 许可、仅作考法标定）');
ok(N.questions.every(q => !q.source.url), '题库不再带任何外部教材 URL');

console.log('\n=== 结果：' + pass + ' 项通过，' + fail + ' 项失败 ===');
process.exit(fail ? 1 : 0);
