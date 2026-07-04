const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'node_modules', '@prisma', 'client', 'runtime');

if (fs.existsSync(srcDir)) {
  fs.readdirSync(srcDir).forEach((f) => {
    if (!f.endsWith('.js') && !f.endsWith('.mjs')) return;
    const base = f.replace(/\.(js|mjs)$/, '');
    const dtsFile = base + '.d.ts';
    if (!fs.existsSync(path.join(srcDir, dtsFile))) {
      fs.writeFileSync(path.join(srcDir, dtsFile), 'export {};\n');
    }
  });
}

const { execSync } = require('child_process');
const prismaCli = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
execSync(`node "${prismaCli}" generate`, { stdio: 'inherit', env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/db' } });
