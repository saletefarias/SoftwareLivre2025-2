const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'package');

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    for (const f of fs.readdirSync(p)) rmrf(path.join(p, f));
    fs.rmdirSync(p);
  } else fs.unlinkSync(p);
}

function copy(src, dest) {
  const s = path.join(root, src);
  if (!fs.existsSync(s)) return;
  const d = path.join(out, dest || src);
  const stat = fs.statSync(s);
  if (stat.isDirectory()) {
    fs.mkdirSync(d, { recursive: true });
    for (const f of fs.readdirSync(s)) copy(path.join(src, f), path.join(dest || src, f));
  } else {
    fs.mkdirSync(path.dirname(d), { recursive: true });
    fs.copyFileSync(s, d);
  }
}

console.log('Cleaning previous package/');
rmrf(out);
fs.mkdirSync(out, { recursive: true });

console.log('Building project...');
execSync('pnpm build', { stdio: 'inherit', cwd: root });

console.log('Copying artifacts...');
copy('manifest.json', 'manifest.json');
copy('dist', 'dist');
copy('icons', 'icons');
copy('readme.md', 'readme.md');
copy('package.json', 'package.json');

console.log('Package created at ./package');
