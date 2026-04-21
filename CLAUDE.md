# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

BatchRename 是一个基于 Tauri + React + Rust 的跨平台桌面批量重命名工具。

- **前端**：React 19 + TypeScript + Vite + Ant Design，使用 React Compiler
- **后端**：Rust + Tauri 2.x，核心重命名逻辑在 Rust 中实现
- **架构**：前端通过 Tauri IPC 调用后端 Rust commands，后端处理文件扫描、规则应用、冲突检测、重命名执行

## 开发命令

```bash
# 安装依赖
npm install

# 启动 Tauri 开发模式（前端 + 后端）
npm run tauri dev

# 仅启动前端 Vite 开发服务器
npm run dev

# 构建前端
npm run build

# Rust 测试
cd src-tauri && cargo test

# Rust 格式检查
cd src-tauri && cargo fmt --check

# 生成应用图标（从 src-tauri/app-icon.png）
npm run tauri icon src-tauri/app-icon.png
```

## 打包命令

```bash
# macOS DMG
npm run tauri:build:mac

# macOS Universal Binary（需先安装 Intel target）
rustup target add x86_64-apple-darwin
npm run tauri:build:mac:universal

# Windows NSIS 安装包（在 Windows 环境执行）
npm run tauri:build:windows

# 通用打包（自动合并平台配置）
npm run tauri build
```

产物位置：
- macOS: `src-tauri/target/release/bundle/dmg/`
- Windows: `src-tauri/target/release/bundle/nsis/`

## 核心架构

### Rust 后端结构

```
src-tauri/src/
├── commands/          # Tauri commands（前端调用入口）
│   ├── file_cmd.rs    # 文件扫描、验证
│   ├── rename_cmd.rs  # 预览、执行、撤销重命名
│   └── template_cmd.rs # 模板管理
├── core/              # 核心业务逻辑
│   ├── scanner.rs     # 文件扫描（递归、扩展名过滤）
│   ├── rule_engine.rs # 规则引擎（应用规则链）
│   ├── rules/         # 各类重命名规则实现
│   ├── conflict.rs    # 冲突检测（重名、覆盖）
│   ├── validation.rs  # 文件名合法性验证
│   ├── renamer.rs     # 执行重命名、撤销操作
│   └── backup.rs      # CSV 备份、操作日志
├── models/            # 数据模型（FileItem, RuleConfig, Template）
└── utils/             # 工具函数（路径处理）
```

### 前端结构

```
src/
├── components/
│   ├── ConfigPanel/   # 左侧配置面板
│   │   ├── FolderSelector.tsx      # 文件夹选择
│   │   ├── FileTypeFilter.tsx      # 文件类型过滤
│   │   ├── RuleConfigurator.tsx    # 规则配置器
│   │   ├── RuleItem.tsx            # 单个规则项（拖拽排序）
│   │   ├── ruleFields/             # 各规则类型的配置字段
│   │   └── TemplateManager.tsx     # 模板管理
│   └── PreviewPanel/  # 右侧预览面板
│       ├── PreviewList.tsx         # 预览列表（虚拟滚动）
│       ├── PreviewCard.tsx         # 单个预览项
│       ├── StatsBar.tsx            # 统计信息栏
│       └── ResultPanel.tsx         # 执行结果面板
├── hooks/
│   ├── useRenamePreview.ts  # 预览逻辑（生成、过滤、选择）
│   ├── useRenameExecute.ts  # 执行、撤销逻辑
│   └── useTemplates.ts      # 模板 CRUD
├── types/index.ts     # TypeScript 类型定义
└── utils/tauriInvoke.ts # Tauri IPC 封装
```

### 数据流

1. **预览流程**：用户配置规则 → `preview_rename` command → Rust 扫描文件 → 应用规则链 → 检测冲突 → 返回 `PreviewItem[]` → 前端展示
2. **执行流程**：用户选择文件 → `execute_rename` command → Rust 写 CSV 备份 → 执行重命名 → 写操作日志 → 返回结果
3. **撤销流程**：`undo_last` command → 读取最后一次操作日志 → 反向重命名

### 规则系统

规则按顺序应用（pipeline），每个规则接收上一个规则的输出：

- **Prefix/Suffix**：添加前缀/后缀
- **Strip**：保留指定字符，删除其他
- **Case**：大小写转换（upper/lower/capitalize）
- **Replace**：字符串替换（支持正则）
- **Sequence**：序号（支持按名称/时间/大小排序）
- **DateTime**：插入文件时间戳（支持自定义格式）

规则实现位于 `src-tauri/src/core/rules/`，每个规则实现 `RuleTrait`。

### 模板系统

模板存储在 Tauri app data 目录的 `templates.json`，包含规则配置和创建时间。前端通过 `template_cmd` 进行 CRUD 操作。

## 重要约定

- **Rust 代码**：使用 `cargo fmt` 格式化，遵循 Rust 2021 edition 规范
- **TypeScript 代码**：使用 React 19 特性，启用 React Compiler
- **错误处理**：Rust commands 返回 `Result<T, String>`，前端统一处理错误提示
- **路径处理**：跨平台路径使用 `std::path::PathBuf`，前端传递字符串路径
- **Tauri IPC**：所有后端调用通过 `src/utils/tauriInvoke.ts` 封装，统一错误处理
- **拖拽支持**：App.tsx 监听 `TauriEvent.DRAG_DROP` 事件，支持拖拽文件夹到窗口

## 平台特定配置

- macOS 配置：`src-tauri/tauri.macos.conf.json`
- Windows 配置：`src-tauri/tauri.windows.conf.json`
- Windows 使用 NSIS 安装包，通过 hook 创建桌面快捷方式

## 已知问题

- macOS 上 `hdiutil` 在项目目录创建 DMG 可能失败，可临时使用 `CARGO_TARGET_DIR=/tmp/batchrename-tauri-target npm run tauri:build:mac` 解决
