const { spawnSync } = require('child_process');
const path = require('path');
const root = path.join(__dirname, '..');

const offline = [
  'verify-baseline.cjs', 'verify-t0.cjs', 'verify-t1.cjs', 'verify-t2.cjs', 'verify-t3.cjs', 'verify-t45.cjs',
  'verify-r20.cjs', 'verify-h1.cjs', 'verify-h2.cjs', 'verify-h3.cjs', 'verify-h4.cjs', 'verify-h5.cjs',
  'verify-h6.cjs', 'verify-quality.cjs', 'audit-blueprint.cjs',
  'verify-ui-fixes.cjs', 'verify-stage6.cjs', 'verify-stage7.cjs', 'verify-stage8.cjs', 'e2e.cjs', 'gen-test.cjs'
];

const env = { ...process.env, ZHIXU_ROOT: root };
let failed = [];
for (const s of offline) {
  process.stdout.write('[' + s + '] ');
  const r = spawnSync(process.execPath, [path.join(root, s)], { cwd: root, env, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const tail = out.trim().split('\n').filter(Boolean).pop() || '';
  if (r.status === 0) {
    console.log('ok  ' + tail.slice(0, 90));
  } else {
    console.log('FAIL rc=' + r.status + '  ' + tail.slice(0, 120));
    failed.push(s);
  }
}

console.log('');
if (failed.length) {
  console.log('失败 ' + failed.length + ' 个：' + failed.join(', '));
  process.exit(1);
}
console.log('全部通过。浏览器用例另跑：npm run test:browser（需本机 Chrome，可设 CHROME_PATH）');
