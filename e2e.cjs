const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const BASE = require('./verify-baseline.cjs'); // 期望计数集中于此，补题后只改它
const src = __dirname;
const dir = path.join(src, 'e2e');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  \u2713 ' + m); } else { fail++; console.log('  \u2717 ' + m); } };
const inline = js => js.replace(/<\/script/gi, '<\\/script');

/* 通过环境变量切换基线/新版，用于「改动前后」对照。 */
const QB = process.env.QB || 'question-bank.js';
console.log('（本次加载：' + QB + '；经典库已退役）\n');

let html = fs.readFileSync(path.join(src, 'latest', 'index.html'), 'utf8');
/* 注意：题库含大量 LaTeX（$'、$`、$& 等），替换值必须用函数返回，否则会被当作 $ 特殊模式解释。 */
html = html.replace(/<script src="\.\/question-bank\.js"[^>]*><\/script>/,
  () => '<script>' + inline(fs.readFileSync(path.join(src, QB), 'utf8')) + '</script>');
ok(!/src="\.\/question-bank\.js"/.test(html), '题库已内联进页面（去除外部依赖，排除加载路径干扰）');
ok(!/classic-question-bank/.test(html), '页面已不再引用 classic-question-bank.js');
fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');

const vc = new VirtualConsole();
const jsErrors = [];
vc.on('jsdomError', e => jsErrors.push(String(e && (e.message || e))));
vc.on('error', (...a) => jsErrors.push('console.error: ' + a.join(' ')));

(async () => {
  const dom = new JSDOM(html, {
    /* 页面脚本已全部内联，无需真实取文件；用 http 源而不是 file://，否则 jsdom 不提供 localStorage，
       与存储相关的 6 条用例会假失败（历史遗留的「既有失败」根因即此）。 */
    url: 'http://test.local/index.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      /* jsdom 未实现下面几个浏览器 API（页面会用到），补等价桩；非页面缺陷。 */
      if (typeof window.structuredClone !== 'function') {
        window.structuredClone = v => JSON.parse(JSON.stringify(v));
      }
      if (typeof window.matchMedia !== 'function') {
        window.matchMedia = q => ({ matches: false, media: q, onchange: null,
          addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } });
      }
      if (typeof window.ResizeObserver !== 'function') {
        window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      }
      if (typeof window.IntersectionObserver !== 'function') {
        window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
      }
    }
  });
  const win = dom.window;
  await new Promise(res => { if (win.document.readyState === 'complete') return res(); win.addEventListener('load', res); });
  await new Promise(r => setTimeout(r, 400));

  console.log('=== 1. 页面与题库加载 ===');
  ok(Array.isArray(win.bankLoadErrors) && win.bankLoadErrors.length === 0, 'bankLoadErrors 为空（实测 ' + JSON.stringify(win.bankLoadErrors) + '）');
  ok(!!win.ZHIXU_BANK, 'ZHIXU_BANK 已建立');
  ok(win.ZHIXU_BANK.questions.length === BASE.total, '题库装载 ' + BASE.total + ' 题（实测 ' + win.ZHIXU_BANK.questions.length + '）');
  const fatal = jsErrors.filter(e => !/Could not load|Not implemented|MathJax|CSS|stylesheet/i.test(e));
  ok(fatal.length === 0, '无页面脚本异常（实测 ' + fatal.length + ' 条' + (fatal.length ? '：' + fatal.slice(0, 3).join(' | ') : '') + '）');

  console.log('\n=== 2. 题库面板按科目筛选（调用界面自身的 filteredQuestions）===');
  const sub = v => { win.document.getElementById('bankSubjectFilter').value = v; };
  sub('all');   const nAll = win.filteredQuestions().length;
  sub('math-1'); const n1 = win.filteredQuestions().length;
  sub('math-2'); const q2 = win.filteredQuestions();
  sub('math-3'); const n3 = win.filteredQuestions().length;
  console.log('    数学一 ' + n1 + ' · 数学二 ' + q2.length + ' · 数学三 ' + n3 + '（全部 ' + nAll + '）');
  ok(nAll === BASE.total, '科目=全部 → ' + BASE.total + ' 题');
  ok(n1 === BASE.bySubject['math-1'], '数学一可见 ' + BASE.bySubject['math-1'] + ' 题');
  ok(q2.length === BASE.bySubject['math-2'], '数学二可见 ' + BASE.bySubject['math-2'] + ' 题');
  const tset = new Set(q2.map(q => q.topic));
  ok(tset.has(3) && tset.has(5) && tset.has(4), '数学二可见题含 t3 多元微分、t4 多元积分、t5 常微分方程');
  ok([...tset].every(i => [0, 1, 2, 3, 4, 5].includes(i)), '数学二可见题仅落在 t0–t5（不含 t6 向量几何 / t7 无穷级数）');
  const cnt = new Map(); q2.forEach(q => cnt.set(q.topic, (cnt.get(q.topic) || 0) + 1));
  console.log('    数学二分专题：' + [0, 1, 2, 3, 4, 5].map(i => 't' + i + '=' + (cnt.get(i) || 0)).join(', '));

  console.log('\n=== 3. 列表渲染 ===');
  sub('all'); win.renderQuestionBank();
  const count = win.document.getElementById('bankCount').textContent;
  console.log('    bankCount = ' + count.replace(/\s+/g, ' ').trim());
  ok(new RegExp('\\b' + BASE.total + '\\s*\\/\\s*' + BASE.total + '\\b').test(count), '界面计数显示 ' + BASE.total + ' / ' + BASE.total);
  ok(win.document.querySelectorAll('#bankList .bank-item').length === BASE.total, '题库列表实际渲染 ' + BASE.total + ' 条');

  console.log('\n=== 4. 学习档案切换为数学二 → 短测覆盖与抽题 ===');
  const firstOpt = el => { const o = [...el.options].map(x => x.value).filter(Boolean); el.value = o[0]; };
  firstOpt(win.document.getElementById('profileYear'));
  win.document.getElementById('profileSubject').value = 'math-2';
  firstOpt(win.document.getElementById('profileStage'));
  firstOpt(win.document.getElementById('profileMinutes'));
  win.document.getElementById('profileSave').click();
  await new Promise(r => setTimeout(r, 200));
  const saved = win.document.getElementById('profileSaved').textContent;
  console.log('    档案状态栏 = ' + saved.replace(/\s+/g, ' ').trim());
  ok(/数学二/.test(saved), '档案已保存为数学二');
  const cov = (win.document.getElementById('diagCoverage')?.textContent || '').replace(/\s+/g, ' ').trim();
  console.log('    短测覆盖文案 = ' + cov);
  ok(new RegExp('数学二可用\\s*' + BASE.bySubject['math-2'] + '\\s*道').test(cov), '短测覆盖文案显示「按数学二可用 ' + BASE.bySubject['math-2'] + ' 道」');
  ok(!/向量代数和空间解析几何|无穷级数/.test(cov.split('；')[0] ? cov.slice(0, cov.indexOf('暂无可用题目') + 6) : cov) || /待补题/.test(cov), '空入口专题仍标注为「待补题」，不纳入诊断');

  const picked = win.diagnosticQueue();
  const pk = new Set(picked.map(q => q.topic));
  console.log('    起点短测实际抽题 ' + picked.length + ' 道，覆盖专题 ' + [...pk].sort().join(', '));
  ok(picked.length > 0, '起点短测可生成题目（' + picked.length + ' 道）');
  ok(picked.every(q => q.subject.includes('math-2')), '抽出的每道题都属数学二范围（科目过滤生效）');
  ok(pk.has(3) && pk.has(5), '短测已覆盖到 t3 多元微分与 t5 常微分方程（改动前这两块缺数二题）');
  ok(!pk.has(6) && !pk.has(7), '短测未把空入口专题（t6/t7）纳入');

  console.log('\n=== 5. 切回数学一 → 空入口专题已消失、待补题标记已撤销 ===');
  win.document.getElementById('profileSubject').value = 'math-1';
  win.document.getElementById('profileSave').click();
  await new Promise(r => setTimeout(r, 200));
  const cov1 = (win.document.getElementById('diagCoverage')?.textContent || '').replace(/\s+/g, ' ').trim();
  console.log('    短测覆盖文案 = ' + cov1);
  ok(new RegExp('数学一可用\\s*' + BASE.bySubject['math-1'] + '\\s*道').test(cov1), '短测覆盖文案显示「按数学一可用 ' + BASE.bySubject['math-1'] + ' 道」');
  ok(/覆盖\s*8\s*个专题/.test(cov1), '数学一下覆盖 8 个专题（含新的 t6/t7）');
  ok(/全部适用专题均有可用题目/.test(cov1), '数学一下不再有「暂无可用题目」的专题');
  const missingNote = win.document.getElementById('diagPendingNote');
  ok(missingNote.hidden === true, '「暂无题目（待补题）」提示已隐藏');
  const fwText = (win.document.getElementById('knowledgeFramework')?.textContent || '').replace(/\s+/g, ' ');
  ok(!/待补题/.test(fwText), '知识框架区已无「待补题」标记（empty 撤销生效）');
  ok(new RegExp('向量代数和空间解析几何\\s*·?\\s*6\\s*个知识点\\s*·\\s*' + BASE.t6 + '\\s*道题').test(fwText), '知识框架区显示「向量代数和空间解析几何 6 个知识点 · ' + BASE.t6 + ' 道题」');
  ok(new RegExp('无穷级数\\s*·?\\s*6\\s*个知识点\\s*·\\s*' + BASE.t7 + '\\s*道题').test(fwText), '知识框架区显示「无穷级数 6 个知识点 · ' + BASE.t7 + ' 道题」');
  const picked1 = win.diagnosticQueue();
  const pk1 = new Set(picked1.map(q => q.topic));
  console.log('    起点短测抽题 ' + picked1.length + ' 道，覆盖专题 ' + [...pk1].sort().join(', '));
  ok(pk1.has(6) && pk1.has(7), '数学一短测已纳入 t6 向量几何与 t7 无穷级数');

  console.log('\n=== 6. 新题可在界面中真实作答 ===');
  /* 抽一道本批新增的选择题与填空题，驱动界面作答。 */
  win.beginPractice(['calc-orig-t7-03'], '本批新题测试');
  await new Promise(r => setTimeout(r, 200));
  const opts = [...win.document.querySelectorAll('#answerArea .option')];
  ok(opts.length === 4, '新增选择题渲染出 4 个选项');
  /* 答案位置已随机化，动态取正确项，避免断言写死位置 */
  const t703 = win.ZHIXU_BANK.questions.find(q => q.id === 'calc-orig-t7-03');
  opts[t703.answer].click();
  win.submitAnswer();
  await new Promise(r => setTimeout(r, 200));
  ok(/回答正确/.test(win.document.getElementById('feedback').textContent), '新增选择题选正确项（位置 ' + 'ABCD'[t703.answer] + '，正项级数发散项）被判正确');

  win.beginPractice(['calc-orig-t7-06'], '本批新题测试');
  await new Promise(r => setTimeout(r, 200));
  const fin = win.document.getElementById('fillInput');
  ok(!!fin, '新增填空题渲染出输入框');
  fin.value = '条件收敛';
  win.submitAnswer();
  await new Promise(r => setTimeout(r, 200));
  ok(/回答正确/.test(win.document.getElementById('feedback').textContent), '新增填空题填「条件收敛」被判正确');

  console.log('\n=== 结果：' + pass + ' 项通过，' + fail + ' 项失败 ===');
  dom.window.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('E2E 脚本异常：', e); process.exit(2); });
