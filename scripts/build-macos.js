const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mode = process.argv[2]; // 'dmg' 或 'universal'

if (!mode || !['dmg', 'universal'].includes(mode)) {
  console.error('用法: node scripts/build-macos.js [dmg|universal]');
  process.exit(1);
}

const buildDir = path.join(__dirname, '../build');

// 确保 build 目录存在
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

console.log(`\n开始构建 macOS ${mode === 'universal' ? 'Universal Binary' : 'DMG'}...\n`);

// 执行 Tauri 构建
try {
  if (mode === 'universal') {
    execSync('npm run tauri:build:mac:universal', { stdio: 'inherit' });
  } else {
    execSync('npm run tauri:build:mac', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('构建失败:', error.message);
  process.exit(1);
}

// 查找并复制 DMG 文件
const dmgDir = path.join(__dirname, '../src-tauri/target/release/bundle/dmg');

if (!fs.existsSync(dmgDir)) {
  console.error(`错误：找不到 DMG 目录 ${dmgDir}`);
  process.exit(1);
}

const files = fs.readdirSync(dmgDir);
const dmgFile = files.find(f => f.endsWith('.dmg'));

if (!dmgFile) {
  console.error(`错误：在 ${dmgDir} 中找不到 .dmg 文件`);
  process.exit(1);
}

const srcDmg = path.join(dmgDir, dmgFile);
const destDmg = path.join(buildDir, dmgFile);

// 复制 DMG 到 build 目录
fs.copyFileSync(srcDmg, destDmg);

console.log(`\n✅ macOS ${mode === 'universal' ? 'Universal Binary' : ''} DMG 构建完成`);
console.log(`\n📦 发行包位置：${destDmg}`);

if (mode === 'universal') {
  console.log('\n   支持架构：Apple Silicon (ARM64) + Intel (x86_64)');
} else {
  console.log('\n   支持架构：当前系统架构');
}
