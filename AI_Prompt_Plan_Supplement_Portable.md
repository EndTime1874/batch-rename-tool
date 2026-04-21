# BatchRename AI Prompt Plan — 补充计划

**基于已完成的 17 个 Task，新增以下功能补充**
**Tauri 2 + Rust + React 19 + Ant Design · Windows 专项 · v1.1**

---

## 阶段一：项目补充计划

### Task 01 · Windows 双版本构建（便携版 + 安装包）

**提示词：**

在已完成的项目基础上，实现 Windows 构建时可选择输出「便携版（绿色版）」或「安装包（NSIS .exe）」两种产物。两种版本的核心区别只有一点：**数据存储位置不同**。

---

**第一步：数据目录路由逻辑（Rust 端）**

修改 `src-tauri/src/utils/path_util.rs`，将原有的数据目录函数替换为以下逻辑：

```rust
use std::path::PathBuf;
use tauri::Manager;

/// 检测是否为便携版：EXE 同级目录存在 `portable.flag` 文件即视为便携版
pub fn is_portable() -> bool {
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            return dir.join("portable.flag").exists();
        }
    }
    false
}

/// 获取应用数据根目录
/// - 便携版：EXE 同级的 config/ 文件夹
/// - 安装版：系统标准目录（Windows: AppData\Roaming\BatchRename\）
pub fn get_app_data_dir(app: &tauri::AppHandle) -> PathBuf {
    if is_portable() {
        // 便携版：数据跟着 EXE 走
        std::env::current_exe()
            .expect("无法获取 EXE 路径")
            .parent()
            .expect("无法获取 EXE 所在目录")
            .join("config")
    } else {
        // 安装版：Tauri 标准数据目录
        // Windows: C:\Users\xxx\AppData\Roaming\BatchRename\
        // macOS:   ~/Library/Application Support/com.batchrename.app/
        app.path()
            .app_data_dir()
            .expect("无法获取系统应用数据目录")
    }
}

/// 子目录快捷函数（均基于 get_app_data_dir）
pub fn get_templates_path(app: &tauri::AppHandle) -> PathBuf {
    get_app_data_dir(app).join("templates.json")
}

pub fn get_config_path(app: &tauri::AppHandle) -> PathBuf {
    get_app_data_dir(app).join("user_config.json")
}

pub fn get_backup_dir(app: &tauri::AppHandle) -> PathBuf {
    get_app_data_dir(app).join("backup")
}

pub fn get_log_path(app: &tauri::AppHandle) -> PathBuf {
    get_app_data_dir(app).join("logs").join("rename.log")
}

/// 启动时确保所有必要目录存在
pub fn ensure_app_dirs(app: &tauri::AppHandle) -> Result<(), String> {
    let base = get_app_data_dir(app);
    for dir in [
        base.clone(),
        base.join("backup"),
        base.join("logs"),
    ] {
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("创建目录失败 {}: {}", dir.display(), e))?;
    }
    Ok(())
}
```

将所有 `commands/` 和 `core/` 中原本调用旧路径函数的地方，统一改为传入 `app: &tauri::AppHandle` 并调用新函数。在 `main.rs` 的 `setup` hook 中调用 `ensure_app_dirs(&app)`。

---

**第二步：新增 Tauri Command，让前端可以查询当前运行模式**

在 `src-tauri/src/commands/config_cmd.rs` 中新增：

```rust
/// 返回当前运行模式，供前端展示
#[tauri::command]
pub fn get_app_mode() -> String {
    if crate::utils::path_util::is_portable() {
        "portable".to_string()
    } else {
        "installed".to_string()
    }
}
```

在 `main.rs` 的 `tauri::generate_handler![]` 中注册 `get_app_mode`。

---

**第三步：前端展示当前运行模式**

在 `src/hooks/useUserConfig.ts` 中，启动时调用 `invoke('get_app_mode')` 获取模式，存入全局状态。

在 `ConfigPanel.tsx` 底部（或设置区域）添加一行只读提示：

```tsx
// mode 为 'portable' 时显示：
<Tag color="orange" icon={<UsbOutlined />}>便携版 · 数据保存在软件目录</Tag>

// mode 为 'installed' 时显示：
<Tag color="blue" icon={<CloudOutlined />}>安装版 · 数据保存在系统目录</Tag>
```

---

**第四步：构建脚本（双版本自动化）**

在项目根目录新建 `scripts/build-windows.js`（Node.js 脚本）：

```js
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
execSync('npm run tauri build', { stdio: 'inherit' });

if (mode === 'portable') {
  // 便携版：取出 EXE，创建便携包文件夹
  const exeSrc = path.join(distDir, 'nsis', 'batch-rename_1.0.0_x64-setup.exe');
  // 注意：Tauri NSIS 会生成安装包，便携版我们直接取 release 下的原始 EXE
  const rawExe = path.join(__dirname, '../src-tauri/target/release/batch-rename.exe');
  const portableDir = path.join(__dirname, '../dist-portable');

  fs.rmSync(portableDir, { recursive: true, force: true });
  fs.mkdirSync(portableDir);

  // 复制 EXE
  fs.copyFileSync(rawExe, path.join(portableDir, 'BatchRename.exe'));

  // 创建 portable.flag（这个文件的存在告诉程序自己是便携版）
  fs.writeFileSync(path.join(portableDir, 'portable.flag'), '');

  // 创建空的 config 文件夹（让用户知道数据在这里）
  fs.mkdirSync(path.join(portableDir, 'config'), { recursive: true });

  // 写一个 README.txt 说明
  fs.writeFileSync(path.join(portableDir, 'README.txt'),
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
  console.log(`\n✅ 安装包构建完成：${nsisDir}`);
  console.log('   安装版数据保存在：C:\\Users\\xxx\\AppData\\Roaming\\BatchRename\\');
}
```

在 `package.json` 的 `scripts` 中新增：

```json
{
  "scripts": {
    "build:win:portable":  "node scripts/build-windows.js portable",
    "build:win:installer": "node scripts/build-windows.js installer"
  }
}
```

---

**第五步：验证两种构建产物**

便携版验证：
1. 运行 `npm run build:win:portable`
2. 打开 `dist-portable/` 文件夹，确认包含 `BatchRename.exe`、`portable.flag`、`config/`、`README.txt`
3. 启动 `BatchRename.exe`，界面右下角显示「便携版 · 数据保存在软件目录」
4. 创建一个模板，关闭程序，检查 `config/templates.json` 已生成
5. 将整个 `dist-portable/` 文件夹复制到桌面，重新启动，模板数据仍然存在
6. 将文件夹复制到 U 盘，在另一台 Windows 电脑上启动，功能正常

安装版验证：
1. 运行 `npm run build:win:installer`
2. 安装 `src-tauri/target/release/bundle/nsis/` 下的 `.exe` 安装包
3. 启动程序，界面显示「安装版 · 数据保存在系统目录」
4. 创建模板，检查 `C:\Users\xxx\AppData\Roaming\BatchRename\templates.json` 已生成
5. 卸载程序，确认 `AppData\Roaming\BatchRename\` 中数据仍然保留（用户数据不随卸载删除）

**验证标准：**
两种构建命令均无报错；便携版拷贝到新路径后数据跟随；安装版数据在系统目录；程序界面正确显示当前运行模式；`portable.flag` 不存在时自动走安装版逻辑（两者互不干扰）。
