import { Empty } from "antd";

export function PreviewPanel() {
  return (
    <div className="preview-panel">
      <Empty description="请先选择文件夹并配置规则" />
    </div>
  );
}
