import { Button, Space, Typography } from "antd";
import { FileTypeFilter } from "./FileTypeFilter";
import { FolderSelector } from "./FolderSelector";
import { RuleConfigurator } from "./RuleConfigurator";
import { TemplateManager } from "./TemplateManager";

interface ConfigPanelProps {
  extensions: string[];
  folderPath: string;
  recursive: boolean;
  onExtensionsChange: (extensions: string[]) => void;
  onFolderPathChange: (path: string) => void;
  onRecursiveChange: (recursive: boolean) => void;
}

export function ConfigPanel({
  extensions,
  folderPath,
  recursive,
  onExtensionsChange,
  onFolderPathChange,
  onRecursiveChange,
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
        <RuleConfigurator />
        <TemplateManager />
      </Space>

      <div className="config-panel__footer">
        <Button block disabled={!folderPath || extensions.length === 0} type="primary">
          生成预览
        </Button>
      </div>
    </aside>
  );
}
