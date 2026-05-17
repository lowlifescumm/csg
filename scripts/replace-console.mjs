#!/usr/bin/env node
/**
 * Replace all console.* calls with logger.* across the source tree.
 * Run: node scripts/replace-console.mjs
 */
/* eslint-disable no-console */
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', '.next', 'coverage', 'dist', 'out', '.git', '__tests__']);
const EXCLUDE_FILES = new Set(['lib/logger.js', 'lib/logger.ts', 'scripts/replace-console.mjs']);

const LOG_METHODS = ['log', 'error', 'warn', 'info', 'debug', 'trace'];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(full);
    } else if (entry.isFile() && EXTS.has(entry.name.slice(entry.name.lastIndexOf('.')))) {
      yield full;
    }
  }
}

function replaceConsole(content, filePath) {
  let result = content;
  let hasLoggerImport = /import\s+logger|require\s*\(\s*['"][^'"]*logger/.test(result);

  for (const method of LOG_METHODS) {
    const regex = new RegExp(`console\\.${method}\\s*\\(`, 'g');
    result = result.replace(regex, `logger.${method}(`);
  }

  // Remove any accidental logger.log — our logger only has trace/debug/info/warn/error
  result = result.replace(/logger\.log\s*\(/g, 'logger.info(');

  // If we made replacements and there's no logger import, add one at the top
  if (result !== content && !hasLoggerImport) {
    const importLine = "const logger = require('../lib/logger');\n";
    // Determine relative path depth from file to project root
    const parts = filePath.split(/[\\/]/);
    const appIdx = parts.indexOf('app');
    const libIdx = parts.indexOf('lib');
    const srcIdx = parts.indexOf('src');
    const rootIdx = Math.max(appIdx, libIdx, srcIdx);
    const depth = rootIdx >= 0 ? parts.slice(rootIdx + 1, -1).length : 0;
    const relPrefix = depth === 0 ? './' : '../'.repeat(depth);
    const relPath = filePath.includes('/app/') ? `${relPrefix}../../lib/logger` :
                    filePath.includes('/src/') ? `${relPrefix}../lib/logger` :
                    filePath.includes('/lib/') ? `${relPrefix}./logger` :
                    `${relPrefix}lib/logger`;

    const importStatement = `const logger = require('${relPath}');\n`;

    // Add after any existing 'use strict' or at very top
    if (result.startsWith('"use strict"') || result.startsWith("'use strict'")) {
      const lines = result.split('\n');
      lines.splice(1, 0, importStatement);
      result = lines.join('\n');
    } else {
      result = importStatement + result;
    }
  }

  return result;
}

async function main() {
  const root = process.cwd();
  let filesProcessed = 0;
  let replacements = 0;

  for await (const file of walk(root)) {
    const rel = file.slice(root.length + 1);
    if (EXCLUDE_FILES.has(rel)) continue;

    const content = await readFile(file, 'utf8');
    if (!/console\.(log|error|warn|info|debug|trace)\s*\(/.test(content)) continue;

    const updated = replaceConsole(content, rel);
    if (updated !== content) {
      await writeFile(file, updated, 'utf8');
      filesProcessed++;
      const count = (content.match(/console\.(log|error|warn|info|debug|trace)\s*\(/g) || []).length;
      replacements += count;
      console.log(`  ✓ ${rel} (${count} replacements)`);
    }
  }

  console.log(`\nDone. ${filesProcessed} files updated, ${replacements} console.* calls replaced.`);
}

main().catch(e => { console.error(e); process.exit(1); });
