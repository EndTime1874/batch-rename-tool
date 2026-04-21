import { Button, Space, Typography } from "antd";

export function TemplateManager() {
  return (
    <section className="config-section">
      <Typography.Text className="config-section__title">模板</Typography.Text>
      <Space size={8}>
        <Button size="small">载入</Button>
        <Button size="small">保存</Button>
      </Space>
    </section>
  );
}
