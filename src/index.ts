#!/usr/bin/env node
import pegjs from 'pegjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import yargs from 'yargs';

function computeHash(text: string): string {
  return createHash('md5')
    .update(text)
    .digest('hex');
}

function make(source: string, hash: string, outputPath: string): void {
  writeFileSync(
    outputPath,
    `// ${hash}\n${pegjs.generate(source, { output: 'source', format: 'commonjs' })}`,
  );
}

function main(): void {
  const argv = yargs
    .option('encoding', {
      alias: 'e',
      default: 'utf-8',
    })
    .option('force', {
      alias: 'f',
      type: 'boolean',
      default: false,
    }).argv;
  for (const inputPath of argv._) {
    const parsed = path.parse(inputPath);
    const grammarSource = readFileSync(inputPath, argv.encoding);
    const grammarHash = computeHash(grammarSource);
    const outputPath = path.join(parsed.dir, `${parsed.name}.js`);
    if (!argv.force && existsSync(outputPath)) {
      const output = readFileSync(outputPath, 'utf-8');
      const hash = output.slice(3, 35);
      console.log(`[pegjs-make] Old source hash: ${hash}`);
      console.log(`[pegjs-make] New source hash: ${grammarHash}`);
      if (hash === grammarHash) {
        console.log('[pegjs-make] Nothing to do.');
      } else {
        make(grammarSource, grammarHash, outputPath);
        console.log('[pegjs-make] Updated.');
      }
    } else {
      make(grammarSource, grammarHash, outputPath);
      console.log('[pegjs-make] Created');
    }
  }
}

main();
