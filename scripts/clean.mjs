import { promises as fs } from 'node:fs';
import { join, normalize } from 'node:path';

const rootDir = process.cwd();
const TARGETS = ['node_modules', '.vitepress/cache', '.vitepress/dist'];

async function remove(target) {
  const path = normalize(join(rootDir, target));
  try {
    await fs.rm(path, { force: true, recursive: true });
    console.log(`Deleted: ${target}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to delete ${target}: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

const targets = [...TARGETS];
if (process.argv.includes('--del-lock')) {
  targets.push('pnpm-lock.yaml');
}

await Promise.all(targets.map(remove));
