# BatchRename

BatchRename 是一个基于 Tauri 2 + React + Rust 的桌面批量重命名工具。

前端负责界面、规则配置和预览展示；Rust 后端负责文件扫描、规则应用、冲突检测、备份、重命名执行和撤销。

## 快速开始

```bash
npm install
npm run tauri dev
```

如果这是第一次在本机开发 Tauri 项目，先确认 Rust 工具链可用：

```bash
rustup update
cargo --version
```

## 环境要求

- Node.js 20+ 或当前 LTS
- npm
- Rust stable
- Tauri 桌面构建依赖
- macOS：Xcode Command Line Tools
- Windows：Visual Studio Build Tools，需要安装 MSVC C++ 工具链和 Windows SDK

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 只启动 Vite 前端开发服务器 |
| `npm run tauri dev` | 启动完整 Tauri 开发模式 |
| `npm run build` | TypeScript 检查并构建前端资源 |
| `cd src-tauri && cargo test` | 运行 Rust 单元测试 |
| `cd src-tauri && cargo fmt --check` | 检查 Rust 格式 |

## 推荐打包命令

这些命令会把最终发行产物复制到项目根目录的 `build/`。`build/` 是生成目录，不需要提交到 Git。

### macOS DMG

生成当前机器架构的 DMG：

```bash
npm run build:mac
```

产物示例：

```text
build/BatchRename_1.0.0_aarch64.dmg  # Apple Silicon
build/BatchRename_1.0.0_x64.dmg      # Intel
```

`build:mac` 的流程是：

1. 让 Tauri 只生成 `.app`。
2. 脚本在系统临时目录里创建 DMG。
3. 把 DMG 复制到 `build/`。

这个命令不会调用 Tauri 默认的 `bundle_dmg.sh`，因此正常情况下不会弹出 Finder 安装窗口。

### macOS Universal DMG

生成同时支持 Apple Silicon 和 Intel 的通用 DMG：

```bash
rustup target add x86_64-apple-darwin
npm run build:mac:universal
```

产物位置：

```text
build/BatchRename_1.0.0_universal.dmg
```

### Windows 便携版

生成绿色版目录，数据会保存在程序同级的 `config/` 目录：

```bash
npm run build:win:portable
```

产物结构：

```text
build/BatchRename-Portable/
├── BatchRename.exe
├── portable.flag
├── config/
└── README.txt
```

### Windows 安装版

生成 NSIS 安装包：

```bash
npm run build:win:installer
```

产物示例：

```text
build/batch-rename_1.0.0_x64-setup.exe
```

安装版默认安装到 Program Files，应用数据保存在：

```text
C:\Users\<用户名>\AppData\Roaming\BatchRename\
```

## 底层 Tauri 打包命令

下面这些命令主要用于排查 Tauri 原生打包流程，不是日常发布推荐命令。

| 命令 | 产物位置 | 说明 |
| --- | --- | --- |
| `npm run tauri:build:mac` | `src-tauri/target/release/bundle/dmg/` | Tauri 默认 DMG 流程，可能弹出 Finder 安装窗口 |
| `npm run tauri:build:mac:universal` | `src-tauri/target/universal-apple-darwin/release/bundle/dmg/` | Tauri 默认 Universal DMG 流程 |
| `npm run tauri:build:windows` | `src-tauri/target/release/bundle/nsis/` | Tauri 默认 NSIS 安装包 |
| `npm run tauri build` | `src-tauri/target/release/bundle/` | 按平台配置执行默认打包 |

如果只是想拿到发布给用户的安装包，请优先使用 `npm run build:mac`、`npm run build:mac:universal`、`npm run build:win:portable` 或 `npm run build:win:installer`。

## 项目结构

```text
src/
├── components/        # React UI 组件
├── hooks/             # 前端业务 hooks
├── types/             # TypeScript 类型
├── utils/             # 前端工具函数和 Tauri IPC 封装
└── styles/            # 全局样式

src-tauri/src/
├── commands/          # Tauri commands，供前端调用
├── core/              # 扫描、规则、冲突检测、备份、重命名核心逻辑
├── models/            # Rust 数据模型
└── utils/             # Rust 工具函数

scripts/
├── build-macos.js     # macOS 推荐打包脚本，最终输出到 build/
└── build-windows.js   # Windows 推荐打包脚本，最终输出到 build/
```

## 平台配置

- 通用配置：`src-tauri/tauri.conf.json`
- macOS 配置：`src-tauri/tauri.macos.conf.json`
- Windows 配置：`src-tauri/tauri.windows.conf.json`
- Tauri capabilities：`src-tauri/capabilities/default.json`

## 发布前检查

```bash
npm run build
cd src-tauri && cargo test && cargo fmt --check
```

确认工作区只包含预期改动：

```bash
git status --short
```

## 常见问题

### 运行 `npm run build:mac` 后，安装包在哪里？

在项目根目录的 `build/`：

```text
build/BatchRename_1.0.0_aarch64.dmg
```

### 为什么我打包时弹出了 Finder 安装窗口？

通常是因为运行了底层命令 `npm run tauri:build:mac`，它会使用 Tauri 默认的 DMG 脚本，并在制作 DMG 时调用 Finder 做窗口布局。

日常发布请运行：

```bash
npm run build:mac
```

### `hdiutil` 报错怎么办？

DMG 创建依赖 macOS 的 `hdiutil`，请在普通 Terminal 里运行打包命令，不要在受限沙箱或没有磁盘镜像权限的环境里运行。

如果仍然失败，可以先确认 Xcode Command Line Tools 已安装：

```bash
xcode-select --install
```

### Windows 便携版和安装版有什么区别？

便携版目录里有 `portable.flag`，程序会把模板、备份和日志保存在同级 `config/` 目录。

安装版没有 `portable.flag`，程序会把数据保存在系统用户数据目录。
