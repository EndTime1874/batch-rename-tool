import { Button, Space, Tag, Typography } from "antd";
import { CloudOutlined, UsbOutlined } from "@ant-design/icons";
import { FileTypeFilter } from "./FileTypeFilter";
import { FolderSelector } from "./FolderSelector";
import { RuleConfigurator } from "./RuleConfigurator";
import { TemplateManager } from "./TemplateManager";
import type { RuleConfig } from "../../types";

interface ConfigPanelProps {
  appMode: "portable" | "installed" | null;
  extensions: string[];
  folderPath: string;
  recursive: boolean;
  rules: RuleConfig[];
  onExtensionsChange: (extensions: string[]) => void;
  onFolderPathChange: (path: string) => void;
  onGeneratePreview: () => void;
  onRecursiveChange: (recursive: boolean) => void;
  onRulesChange: (rules: RuleConfig[]) => void;
  previewLoading: boolean;
}

export function ConfigPanel({
  appMode,
  extensions,
  folderPath,
  recursive,
  rules,
  onExtensionsChange,
  onFolderPathChange,
  onGeneratePreview,
  onRecursiveChange,
  onRulesChange,
  previewLoading,
}: ConfigPanelProps) {
  return (
    <aside className="config-panel">
      <div className="config-panel__header">
        <Typography.Title level={4}>批量重命名</Typography.Title>
      </div>

      <Space className="config-panel__body" direction="vertical" size={18}>
        <FolderSelector
          onPathChange={onFolderPathChange}
          onRecursiveChange={onRecursiveChange}
          path={folderPath}
          recursive={recursive}
        />
        <FileTypeFilter
          extensions={extensions}
          onExtensionsChange={onExtensionsChange}
        />
        <RuleConfigurator rules={rules} onRulesChange={onRulesChange} />
        <TemplateManager rules={rules} onLoadRules={onRulesChange} />
      </Space>

      {appMode && (
        <div style={{ padding: "12px 16px" }}>
          {appMode === "portable" ? (
            <Tag color="orange" icon={<UsbOutlined />}>
              便携版 · 数据保存在软件目录
            </Tag>
          ) : (
            <Tag color="blue" icon={<CloudOutlined />}>
              安装版 · 数据保存在系统目录
            </Tag>
          )}
        </div>
      )}

      <div className="config-panel__footer">
        <Button
          block
          disabled={!folderPath || extensions.length === 0 || rules.length === 0}
          loading={previewLoading}
          onClick={onGeneratePreview}
          type="primary"
        >
          生成预览
        </Button>
      </div>
    </aside>
  );
}
