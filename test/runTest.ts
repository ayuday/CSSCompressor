import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  try {
    // 扩展开发路径（项目根目录）
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // 测试文件路径
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // 运行测试
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions'],
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
