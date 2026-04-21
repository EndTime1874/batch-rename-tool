# BatchRename

基于 Tauri + React + Rust 的桌面批量重命名工具。

## 环境要求

- Node.js 20+ 或当前 LTS
- npm
- Rust stable
- Tauri 桌面构建依赖
- macOS：Xcode Command Line Tools
- Windows：Visual Studio Build Tools，勾选 MSVC C++ 工具链和 Windows SDK

## 安装依赖

```bash
npm install
```

如果是第一次在本机开发 Tauri，先确认 Rust 工具链可用：

```bash
rustup update
cargo --version
```

## 本地开发

启动 Tauri 开发模式：

```bash
npm run tauri dev
```

只启动前端 Vite：

```bash
npm run dev
```

## 构建前端

```bash
npm run build
```

## 运行测试

Rust 核心逻辑测试：

```bash
cd src-tauri
cargo test
```

格式检查：

```bash
cd src-tauri
cargo fmt --check
```

## macOS 打包

### 标准 DMG（当前架构）

生成当前系统架构的 DMG：

```bash
npm run build:mac
```

产物位置：

```text
build/BatchRename_1.0.0_aarch64.dmg  # Apple Silicon
或
build/BatchRename_1.0.0_x64.dmg      # Intel
```

### Universal Binary DMG（通用二进制）

生成同时支持 Apple Silicon 和 Intel 的通用版本：

```bash
npm run build:mac:universal
```

需要先安装 Intel target：

```bash
rustup target add x86_64-apple-darwin
```

产物位置：

```text
build/BatchRename_1.0.0_universal.dmg
```

### 传统构建方式

也可以使用传统命令（产物在 `src-tauri/target/release/bundle/dmg/`）：

```bash
npm run tauri:build:mac
npm run tauri:build:mac:universal
```

### 已知问题

如果 `hdiutil` 在项目目录下创建 DMG 失败，可以临时把构建目录放到 `/tmp`：

```bash
CARGO_TARGET_DIR=/tmp/batchrename-tauri-target npm run build:mac
```

## Windows 打包

Windows 支持两种发行版本：

### 便携版（绿色版）

数据保存在 EXE 同级 `config/` 目录，可复制到 U 盘随身携带：

```bash
npm run build:win:portable
```

产物位置：

```text
build/BatchRename-Portable/
├── BatchRename.exe
├── portable.flag      # 便携版标识文件
├── config/            # 数据存储目录（模板、备份、日志）
└── README.txt
```

### 安装版（NSIS 安装包）

数据保存在系统标准目录（`C:\Users\xxx\AppData\Roaming\BatchRename\`）：

```bash
npm run build:win:installer
```

产物位置：

```text
build/batch-rename_1.0.0_x64-setup.exe
```

安装包默认安装到 Program Files，并通过 NSIS hook 创建桌面快捷方式。

### 运行模式识别

程序启动时自动检测 `portable.flag` 文件：

- 存在：便携版模式，数据保存在软件目录
- 不存在：安装版模式，数据保存在系统目录

界面左下角会显示当前运行模式。

### 传统构建方式

也可以使用传统命令（仅生成 NSIS 安装包到 `src-tauri/target/release/bundle/nsis/`）：

```bash
npm run tauri:build:windows
```

## 通用 Tauri 打包

也可以直接运行 Tauri CLI：

```bash
npm run tauri build
```

Tauri 会自动合并平台配置：

- macOS：`src-tauri/tauri.macos.conf.json`
- Windows：`src-tauri/tauri.windows.conf.json`

## 发布前检查

```bash
npm run build
cd src-tauri && cargo test && cargo fmt --check
```

确认 Git 工作区只包含预期改动：

```bash
git status --short
```
