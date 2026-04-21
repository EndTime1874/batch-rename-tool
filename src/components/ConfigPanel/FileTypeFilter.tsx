import { Tag, Typography } from "antd";

export function FileTypeFilter() {
  return (
    <section className="config-section">
      <Typography.Text className="config-section__title">文件类型</Typography.Text>
      <div className="config-section__placeholder">
        <Tag color="blue">全部类型</Tag>
      </div>
    </section>
  );
}
