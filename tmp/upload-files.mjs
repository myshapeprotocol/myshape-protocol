import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO = 'ContinuityLab-Org/continuity-protocol';

function findFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) findFiles(full, files);
    else files.push(full);
  }
  return files;
}

const basePath = process.argv[2] || 'tmp/continuity-protocol';
const files = findFiles(basePath);
console.log('Files to upload:', files.length);

for (const file of files) {
  const apiPath = relative(basePath, file).replace(/\\/g, '/');
  const content = readFileSync(file, 'utf8');

  // Write payload to temp JSON
  const payload = { message: 'chore: add community health files', content: Buffer.from(content).toString('base64') };
  const tmpFile = 'tmp/_payload.json';
  writeFileSync(tmpFile, JSON.stringify(payload));

  try {
    execSync(`gh api repos/${REPO}/contents/${apiPath} -X PUT --input ${tmpFile}`, { stdio: 'pipe' });
    console.log('OK:', apiPath);
  } catch(e) {
    const err = e.stderr?.toString() || '';
    // Check if file already exists (422)
    if (err.includes('422')) {
      console.log('SKIP (exists):', apiPath);
    } else {
      console.log('ERR:', apiPath, err.substring(0, 120));
    }
  }
}
console.log('Done');
