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

const buildDir = path.join(__dirname, '../build');

// 确保 build 目录存在
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

if (mode === 'portable') {
  // 便携版：取出 EXE，创建便携包文件夹
  const rawExe = path.join(__dirname, '../src-tauri/target/release/batch-rename.exe');
  const portableDir = path.join(buildDir, 'BatchRename-Portable');

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
  console.log(`\n📦 发行包位置：${portableDir}`);
} else {
  // 安装版：复制 NSIS 安装包到 build 目录
  const nsisDir = path.join(distDir, 'nsis');
  if (!fs.existsSync(nsisDir)) {
    console.error(`错误：找不到 NSIS 安装包目录 ${nsisDir}`);
    process.exit(1);
  }

  // 查找安装包文件
  const files = fs.readdirSync(nsisDir);
  const installerFile = files.find(f => f.endsWith('.exe'));

  if (!installerFile) {
    console.error(`错误：在 ${nsisDir} 中找不到 .exe 安装包`);
    process.exit(1);
  }

  const srcInstaller = path.join(nsisDir, installerFile);
  const destInstaller = path.join(buildDir, installerFile);

  // 复制安装包到 build 目录
  fs.copyFileSync(srcInstaller, destInstaller);

  console.log(`\n✅ 安装包构建完成`);
  console.log('   安装版数据保存在：C:\\Users\\xxx\\AppData\\Roaming\\BatchRename\\');
  console.log(`\n📦 发行包位置：${destInstaller}`);
}
