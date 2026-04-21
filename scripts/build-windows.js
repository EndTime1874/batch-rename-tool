const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mode = process.argv[2]; // 'portable' 或 'installer'

if (!mode || !['portable', 'installer'].includes(mode)) {
  console.error('用法: node scripts/build-windows.js [portable|installer]');
  process.exit(1);
}

const distDir = path.join(__dirname, '../src-tauri/target/release/bundle');

console.log(`\n开始构建 Windows ${mode === 'portable' ? '便携版' : '安装包'}...\n`);

// 执行 Tauri 构建
try {
  execSync('npm run tauri build', { stdio: 'inherit' });
} catch (error) {
  console.error('构建失败:', error.message);
  process.exit(1);
}

if (mode === 'portable') {
  // 便携版：取出 EXE，创建便携包文件夹
  const rawExe = path.join(__dirname, '../src-tauri/target/release/batch-rename.exe');
  const portableDir = path.join(__dirname, '../dist-portable');

  if (!fs.existsSync(rawExe)) {
    console.error(`错误：找不到可执行文件 ${rawExe}`);
    process.exit(1);
  }

  // 清理并创建便携版目录
  if (fs.existsSync(portableDir)) {
    fs.rmSync(portableDir, { recursive: true, force: true });
  }
  fs.mkdirSync(portableDir);

  // 复制 EXE
  fs.copyFileSync(rawExe, path.join(portableDir, 'BatchRename.exe'));

  // 创建 portable.flag（这个文件的存在告诉程序自己是便携版）
  fs.writeFileSync(path.join(portableDir, 'portable.flag'), '');

  // 创建空的 config 文件夹（让用户知道数据在这里）
  fs.mkdirSync(path.join(portableDir, 'config'), { recursive: true });

  // 写一个 README.txt 说明
  fs.writeFileSync(
    path.join(portableDir, 'README.txt'),
    'BatchRename 便携版\n' +
      '==================\n' +
      '直接运行 BatchRename.exe 即可使用。\n' +
      '所有数据（模板、备份、日志）保存在同级 config/ 文件夹中。\n' +
      '将整个文件夹复制到任意位置（包括 U 盘）均可正常使用。\n'
  );

  console.log(`\n✅ 便携版构建完成：${portableDir}`);
  console.log('   文件结构：');
  console.log('   BatchRename.exe');
  console.log('   portable.flag');
  console.log('   config/         ← 数据保存位置');
  console.log('   README.txt');
} else {
  // 安装版：直接指向 NSIS 生成的安装包
  const nsisDir = path.join(distDir, 'nsis');
  if (fs.existsSync(nsisDir)) {
    console.log(`\n✅ 安装包构建完成：${nsisDir}`);
    console.log('   安装版数据保存在：C:\\Users\\xxx\\AppData\\Roaming\\BatchRename\\');
  } else {
    console.error(`错误：找不到 NSIS 安装包目录 ${nsisDir}`);
    process.exit(1);
  }
}
