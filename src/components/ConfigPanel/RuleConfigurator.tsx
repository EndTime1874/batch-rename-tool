import { Button, Typography } from "antd";

export function RuleConfigurator() {
  return (
    <section className="config-section">
      <div className="config-section__heading">
        <Typography.Text className="config-section__title">规则</Typography.Text>
        <Button size="small" type="text">
          添加
        </Button>
      </div>
      <div className="config-section__placeholder">尚未添加规则</div>
    </section>
  );
}
