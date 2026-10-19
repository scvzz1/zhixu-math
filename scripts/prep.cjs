const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'latest');
fs.mkdirSync(out, { recursive: true });
for (const n of ['index.html', 'question-bank.js']) {
  fs.copyFileSync(path.join(root, n), path.join(out, n));
}
console.log('prep: latest/ 已生成（index.html + question-bank.js）');
