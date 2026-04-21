import { Input, Space, Switch } from "antd";
import type { RuleConfig } from "../../../types";

type ReplaceRule = Extract<RuleConfig, { type: "replace" }>;

interface ReplaceFieldProps {
  value: ReplaceRule;
  onChange: (rule: ReplaceRule) => void;
}

export function ReplaceField({ value, onChange }: ReplaceFieldProps) {
  return (
    <Space.Compact block className="rule-field__compact">
      <Input
        aria-label="查找内容"
        onChange={(event) => onChange({ ...value, from: event.target.value })}
        placeholder="查找"
        value={value.from}
      />
      <Input
        aria-label="替换内容"
        onChange={(event) => onChange({ ...value, to: event.target.value })}
        placeholder="替换为"
        value={value.to}
      />
      <Switch
        checked={value.regex}
        checkedChildren="正则"
        onChange={(regex) => onChange({ ...value, regex })}
        unCheckedChildren="文本"
      />
    </Space.Compact>
  );
}
