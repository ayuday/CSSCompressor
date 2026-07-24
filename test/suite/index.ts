import * as path from 'path';
import * as fs from 'fs';

// VS Code 测试运行器 — 简化版
// 使用 Mocha 运行编译后的测试文件

export function run(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      // 动态 require Mocha（CJS 兼容）
      const Mocha = require('mocha');
      const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 10000,
      });

      const testsRoot = path.resolve(__dirname, '..');

      // 查找所有 .test.js 文件
      function findTestFiles(dir: string): string[] {
        const results: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== 'suite') {
            results.push(...findTestFiles(fullPath));
          } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
            results.push(fullPath);
          }
        }
        return results;
      }

      const files = findTestFiles(testsRoot);

      if (files.length === 0) {
        console.warn('No test files found.');
        resolve();
        return;
      }

      files.forEach((f: string) => mocha.addFile(f));

      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
