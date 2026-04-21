import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const mode = process.argv[2]; // 'dmg' 或 'universal'

if (!mode || !['dmg', 'universal'].includes(mode)) {
  console.error('用法: node scripts/build-macos.js [dmg|universal]');
  process.exit(1);
}

const buildDir = path.join(projectRoot, 'build');
const targetBundleDir =
  mode === 'universal'
    ? path.join(projectRoot, 'src-tauri/target/universal-apple-darwin/release/bundle')
    : path.join(projectRoot, 'src-tauri/target/release/bundle');
const macosDir = path.join(targetBundleDir, 'macos');
const tauriConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src-tauri/tauri.conf.json'), 'utf8'));
const appName = `${tauriConfig.productName}.app`;

function archSuffix() {
  if (mode === 'universal') {
    return 'universal';
  }

  return process.arch === 'arm64' ? 'aarch64' : process.arch;
}

function runTauriAppBuild() {
  const tauriCli = path.join(projectRoot, 'node_modules/.bin/tauri');
  const args = ['build', '--bundles', 'app', '--ci'];

  if (mode === 'universal') {
    args.splice(1, 0, '--target', 'universal-apple-darwin');
  }

  execFileSync(tauriCli, args, { cwd: projectRoot, stdio: 'inherit' });
}

function createDmg(destDmg) {
  const appSource = path.join(macosDir, appName);

  if (!fs.existsSync(appSource)) {
    throw new Error(`找不到 macOS app：${appSource}`);
  }

  const stageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'batchrename-dmg-'));
  const stageDir = path.join(stageRoot, tauriConfig.productName);
  const tempDmg = path.join(stageRoot, path.basename(destDmg));

  try {
    fs.mkdirSync(stageDir, { recursive: true });
    fs.cpSync(appSource, path.join(stageDir, appName), { recursive: true });
    fs.symlinkSync('/Applications', path.join(stageDir, 'Applications'));

    execFileSync(
      'hdiutil',
      ['create', '-srcfolder', stageDir, '-volname', tauriConfig.productName, '-fs', 'HFS+', '-format', 'UDZO', '-ov', tempDmg],
      { stdio: 'inherit' }
    );

    fs.copyFileSync(tempDmg, destDmg);
  } finally {
    fs.rmSync(stageRoot, { recursive: true, force: true });
  }
}

// 确保 build 目录存在
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const buildLabel = mode === 'universal' ? 'Universal Binary DMG' : 'DMG';

console.log(`\n开始构建 macOS ${buildLabel}...\n`);

const dmgFile = `${tauriConfig.productName}_${tauriConfig.version}_${archSuffix()}.dmg`;
const destDmg = path.join(buildDir, dmgFile);

// 只让 Tauri 生成 .app，DMG 由本脚本创建，避免 bundle_dmg.sh 弹出 Finder 安装窗口。
try {
  runTauriAppBuild();
  createDmg(destDmg);
} catch (error) {
  console.error('构建失败:', error.message);
  process.exit(1);
}

console.log(`\n✅ macOS ${buildLabel} 构建完成`);
console.log(`\n📦 发行包位置：${destDmg}`);

if (mode === 'universal') {
  console.log('\n   支持架构：Apple Silicon (ARM64) + Intel (x86_64)');
} else {
  console.log('\n   支持架构：当前系统架构');
}
