import { Button, Space, Typography } from "antd";
import { FileTypeFilter } from "./FileTypeFilter";
import { FolderSelector } from "./FolderSelector";
import { RuleConfigurator } from "./RuleConfigurator";
import { TemplateManager } from "./TemplateManager";

interface ConfigPanelProps {
  folderPath: string;
  onFolderPathChange: (path: string) => void;
}

export function ConfigPanel({
  folderPath,
  onFolderPathChange,
}: ConfigPanelProps) {
  return (
    <aside className="config-panel">
      <div className="config-panel__header">
        <Typography.Title level={4}>批量重命名</Typography.Title>
      </div>

      <Space className="config-panel__body" direction="vertical" size={18}>
        <FolderSelector path={folderPath} onPathChange={onFolderPathChange} />
        <FileTypeFilter />
        <RuleConfigurator />
        <TemplateManager />
      </Space>

      <div className="config-panel__footer">
        <Button block disabled={!folderPath} type="primary">
          生成预览
        </Button>
      </div>
    </aside>
  );
}
