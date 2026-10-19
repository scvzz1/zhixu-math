/* 生成器扩展验证：用扩展后的 original() 造一道 fill + 一道 solve，验证
   ① 字段形状正确（fill 有 answers、无 options/answer；solve 有 answerText）；
   ② 界面真实加载后题库不报错、总数 = 基线 +2、excludedCount=0；
   ③ 能真正驱动界面把这两道题答完（fill 判分 / solve 自评）。
   依赖：question-bank.js、latest/index.html、
        以及测试夹具 gen-test.fixture.txt（本脚本的组成部分，勿当临时文件清理）。 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const src = __dirname;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  \u2713 ' + m); } else { fail++; console.log('  \u2717 ' + m); } };

/* ---- 1. 生成注入了两道题目的测试题库 ---- */
/* 锚点用阶段四首题的稳定调用，避免阶段三解析扩展与换行风格影响。
   夹具末尾补逗号，随后保留原阶段四题目调用。 */
const marker = "original('calc-orig-t6-01'";
const snippet = fs.readFileSync(path.join(src, 'gen-test.fixture.txt'), 'utf8');
let qbSrc = fs.readFileSync(path.join(src, 'question-bank.js'), 'utf8');
const idx = qbSrc.lastIndexOf(marker);
if (idx < 0) { console.error('未找到注入锚点，脚本需更新'); process.exit(2); }
const at = idx;
qbSrc = qbSrc.slice(0, at) + snippet + ',' + qbSrc.slice(at);
const GEN = 'question-bank.gentest.js';
fs.writeFileSync(path.join(src, GEN), qbSrc, 'utf8');

/* ---- 2. 纯 JS 校验生成器输出 ---- */
const win = {};
for (const f of [GEN]) new Function('window', fs.readFileSync(path.join(src, f), 'utf8'))(win); // 经典库已退役
const bank = win.ZHIXU_BANK;
/* 基线题量从未注入版本动态取得，避免题库增长后断言过期。 */
const baseWin = {};
for (const f of ['question-bank.js']) new Function('window', fs.readFileSync(path.join(src, f), 'utf8'))(baseWin);
const BASE = baseWin.ZHIXU_BANK.questions.length;
const TOTAL = BASE + 2;
console.log('生成器输出校验（基线 ' + BASE + ' 题 → 注入后应为 ' + TOTAL + '）：');
ok(bank.questions.length === TOTAL, '注入后题量 ' + BASE + ' → ' + TOTAL + '（实测 ' + bank.questions.length + '）');
const fq = bank.questions.find(q => q.id === 'calc-gentest-fill-0001');
const sq = bank.questions.find(q => q.id === 'calc-gentest-solve-0001');
ok(!!fq && !!sq, '两道测试题已生成');
ok(fq.type === 'fill' && !('options' in fq) && !('answer' in fq) && Array.isArray(fq.answers) && fq.answers.length === 3,
  'fill：type=fill、已移除 options/answer、answers 3 个等价写法');
ok(fq.estimatedMinutes === 2, 'fill：minutes 参数生效（=2，非默认 3）');
ok(fq.explain.includes('不要把公比') && !fq.explain.includes('避免只凭结论记忆'),
  'fill：pitfall 覆盖了通用易错句');
ok(sq.type === 'solve' && !('options' in sq) && typeof sq.answerText === 'string' && sq.answerText.includes('收敛半径'),
  'solve：type=solve、已移除 options/answer、answerText 有内容');
ok(sq.estimatedMinutes === 5, 'solve：minutes 参数生效（=5）');
ok([fq, sq].every(q => q.kpId && q.subject.length), 'kpId 与 subject 均正常解析（kpId=' + fq.kpId + ' / ' + sq.kpId + '）');

/* ---- 3. 界面真实加载 + 驱动作答 ---- */
let html = fs.readFileSync(path.join(src, 'latest', 'index.html'), 'utf8');
const inline = js => js.replace(/<\/script/gi, '<\\/script');
html = html.replace(/<script src="\.\/question-bank\.js"[^>]*><\/script>/,
  () => '<script>' + inline(fs.readFileSync(path.join(src, GEN), 'utf8')) + '</script>');
fs.mkdirSync(path.join(src, 'e2e-gen'), { recursive: true });
fs.writeFileSync(path.join(src, 'e2e-gen', 'index.html'), html, 'utf8');

const vc = new VirtualConsole();
const jsErrors = [];
vc.on('jsdomError', e => jsErrors.push(String(e && (e.message || e))));
vc.on('error', (...a) => jsErrors.push('console.error: ' + a.join(' ')));

(async () => {
  const dom = new JSDOM(html, {
    /* 页面脚本已全部内联，用 http 源而非 file://：jsdom 在 file:// 下不提供 localStorage，
       「填空渲染输入框」会假失败（与 e2e.cjs 同源）。 */
    url: 'http://test.local/index.html',
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      if (typeof w.structuredClone !== 'function') w.structuredClone = v => JSON.parse(JSON.stringify(v));
      if (typeof w.matchMedia !== 'function') w.matchMedia = q => ({ matches: false, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } });
      if (typeof w.ResizeObserver !== 'function') w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      if (typeof w.IntersectionObserver !== 'function') w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
    }
  });
  const W = dom.window;
  await new Promise(res => { if (W.document.readyState === 'complete') return res(); W.addEventListener('load', res); });
  await new Promise(r => setTimeout(r, 400));

  console.log('\n界面加载校验：');
  ok(Array.isArray(W.bankLoadErrors) && W.bankLoadErrors.length === 0, 'bankLoadErrors 为空');
  W.document.getElementById('bankSubjectFilter').value = 'all';
  W.renderQuestionBank();
  const cnt = (W.document.getElementById('bankCount').textContent || '').replace(/\s+/g, ' ').trim();
  console.log('    bankCount = ' + cnt);
  ok(new RegExp(TOTAL + '\\s*/\\s*' + TOTAL).test(cnt), '界面装载并通过校验 ' + TOTAL + ' 题（实测「' + cnt + '」）');
  ok(W.document.querySelectorAll('#bankList .bank-item').length === TOTAL, '题库列表实际渲染 ' + TOTAL + ' 条');

  console.log('\n真实作答驱动：');
  /* 填空题：填对 → 判为正确 */
  W.beginPractice(['calc-gentest-fill-0001'], '生成器测试');
  await new Promise(r => setTimeout(r, 200));
  const fillInput = W.document.getElementById('fillInput');
  ok(!!fillInput, '填空题渲染出输入框 #fillInput');
  fillInput.value = '1';
  W.submitAnswer();
  await new Promise(r => setTimeout(r, 200));
  const fbFill = W.document.getElementById('feedback').textContent;
  ok(/回答正确/.test(fbFill), '填空填「1」被判正确');
  ok(/本题可接受答案/.test(fbFill), '反馈列出了可接受答案清单');

  /* 填空题：填错 → 判为不一致，且等价写法提示在 */
  W.beginPractice(['calc-gentest-fill-0001'], '生成器测试');
  await new Promise(r => setTimeout(r, 200));
  W.document.getElementById('fillInput').value = '2';
  W.submitAnswer();
  await new Promise(r => setTimeout(r, 200));
  ok(/不一致/.test(W.document.getElementById('feedback').textContent), '填空填「2」被判不一致');

  /* 解答题：提交后进入自评，点「我做对了」入库 */
  W.beginPractice(['calc-gentest-solve-0001'], '生成器测试');
  await new Promise(r => setTimeout(r, 200));
  const solveInput = W.document.getElementById('solveAnswer');
  ok(!!solveInput, '解答题渲染出作答框 #solveAnswer');
  solveInput.value = 'R=1, [-1,1)';
  W.submitAnswer();
  await new Promise(r => setTimeout(r, 200));
  const selfBtn = W.document.querySelector('#feedback [data-self="1"]');
  ok(!!selfBtn, '解答题提交后进入「自评」阶段并给出自评按钮');
  ok(/参考答案/.test(W.document.getElementById('feedback').textContent), '自评阶段展示参考答案');
  selfBtn.click();
  await new Promise(r => setTimeout(r, 200));
  ok(/已记录为答对/.test(W.document.getElementById('feedback').textContent), '自评「做对了」被记录');

  const fatal = jsErrors.filter(e => !/Could not load|Not implemented|MathJax|CSS|stylesheet/i.test(e));
  ok(fatal.length === 0, '无页面脚本异常（' + fatal.length + ' 条' + (fatal.length ? '：' + fatal.slice(0, 2).join(' | ') : '') + '）');

  console.log('\n=== 结果：' + pass + ' 项通过，' + fail + ' 项失败 ===');
  dom.window.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('脚本异常：', e); process.exit(2); });
