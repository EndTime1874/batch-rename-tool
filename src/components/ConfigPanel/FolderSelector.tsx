import { Input, Typography } from "antd";

interface FolderSelectorProps {
  path: string;
  onPathChange: (path: string) => void;
}

export function FolderSelector({ path, onPathChange }: FolderSelectorProps) {
  return (
    <section className="config-section">
      <Typography.Text className="config-section__title">文件夹</Typography.Text>
      <Input
        aria-label="文件夹路径"
        onChange={(event) => onPathChange(event.target.value)}
        placeholder="选择或拖入文件夹"
        value={path}
      />
    </section>
  );
}
