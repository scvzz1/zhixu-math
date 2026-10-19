const fs = require('fs'), path = require('path');
const src = __dirname;

/* 从 index.html 抽出判分三函数（normalizeAnswer / numericValue / answersMatch）实测。
   按函数名匹配抽取，不再依赖行号——行号会随网页增删行而漂移，2026-10-16 起改为内容锚定。 */
const html = fs.readFileSync(path.join(src, 'latest', 'index.html'), 'utf8');
const grab = name => { const m = html.match(new RegExp('function ' + name + '\\s*\\([^)]*\\)\\s*\\{[^\\n]*\\}')); return m ? m[0] : null; };
const parts = [grab('normalizeAnswer'), grab('numericValue'), grab('answersMatch')];
if (parts.some(p => !p)) { console.error('抽取失败：在 index.html 中找不到判分三函数，请检查网页是否改名'); process.exit(2); }
const code = parts.join('\n');
const answersMatch = new Function(code + '\nreturn answersMatch;')();

const win = {};
for (const f of ['question-bank.js']) new Function('window', fs.readFileSync(path.join(src, f), 'utf8'))(win); // 经典库已退役
const B = win.ZHIXU_BANK;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  \u2713 ' + m); } else { fail++; console.log('  \u2717 ' + m); } };

console.log('=== t7-04 填空：answers 应接受中文与英文 ===');
const q4 = B.questions.find(q => q.id === 'calc-orig-t7-04');
console.log('    answers = ' + JSON.stringify(q4.answers));
ok(answersMatch('收敛', q4.answers), '输入「收敛」→ 通过');
ok(answersMatch('converge', q4.answers), '输入「converge」→ 通过（修复前为不通过）');
ok(answersMatch('Converge', q4.answers), '输入「Converge」→ 通过（大小写不敏感）');
ok(answersMatch('convergent', q4.answers), '输入「convergent」→ 通过');
ok(!answersMatch('发散', q4.answers), '输入「发散」→ 不通过（仍是错误答案）');

console.log('\n=== t7-06 填空：answers 应接受中文与英文 ===');
const q6 = B.questions.find(q => q.id === 'calc-orig-t7-06');
console.log('    answers = ' + JSON.stringify(q6.answers));
ok(answersMatch('条件收敛', q6.answers), '输入「条件收敛」→ 通过');
ok(answersMatch('conditionally convergent', q6.answers), '输入「conditionally convergent」→ 通过（修复前为不通过）');
ok(answersMatch('Conditionally Convergent', q6.answers), '输入「Conditionally Convergent」→ 通过（大小写与空格不敏感）');
ok(!answersMatch('绝对收敛', q6.answers), '输入「绝对收敛」→ 不通过（仍是错误答案）');

console.log('\n=== 其余填空题回归（应保持可用）===');
const q604 = B.questions.find(q => q.id === 'calc-orig-t6-04');
ok(answersMatch('-2', q604.answers) && answersMatch('$-2$', q604.answers), 't6-04 仍接受 -2 / $-2$');
const q708 = B.questions.find(q => q.id === 'calc-orig-t7-08');
ok(answersMatch('(-2,2)', q708.answers) && answersMatch('-2<x<2', q708.answers), 't7-08 仍接受 (-2,2) / -2<x<2');
const q711 = B.questions.find(q => q.id === 'calc-orig-t7-11');
ok(answersMatch('0', q711.answers), 't7-11 仍接受 0');
const q712 = B.questions.find(q => q.id === 'calc-orig-t7-12');
ok(answersMatch('2', q712.answers), 't7-12 仍接受 2');

console.log('\n=== t7-01 选项去等价 + t6-01 干扰项 ===');
const q1 = B.questions.find(q => q.id === 'calc-orig-t7-01');
console.log('    t7-01 选项 = ' + JSON.stringify(q1.options));
ok(new Set(q1.options).size === 4, 't7-01 四个选项互异');
ok(!q1.options.some(o => /\|u_n\|/.test(o)), 't7-01 已移除与「绝对收敛」等价的 |u_n| 选项');
ok(q1.options[q1.answer] === '$\\displaystyle\\lim_{n\\to\\infty}u_n=0$', 't7-01 正确答案仍指向 $\\lim u_n=0$（与位置无关）');
const q601 = B.questions.find(q => q.id === 'calc-orig-t6-01');
console.log('    t6-01 选项 = ' + JSON.stringify(q601.options));
ok(new Set(q601.options).size === 4, 't6-01 四个选项互异');
ok(q601.options[1] === '$\\left(\\frac29,-\\frac19,\\frac29\\right)$', 't6-01 干扰项已改为 (2/9,-1/9,2/9)（对应「误用 |a|²=9 作分母」）');

console.log('\n=== 解析中不再有不会渲染的 Markdown 粗体 ===');
const nq = B.questions.filter(q => q.id.startsWith('calc-orig-'));
ok(nq.every(q => !/\*\*/.test(q.explain || '')), '18 题解析中 ** 已全部清零');
ok(nq.filter(q => q.explain.includes('<b>')).length >= 3, '原有的 <b> 粗体小标题保留');

console.log('\n' + (fail === 0 ? '全部通过：' : '存在失败：') + pass + ' 项通过 / ' + fail + ' 项失败');
