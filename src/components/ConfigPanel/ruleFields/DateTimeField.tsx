import { Input, Select, Space } from "antd";
import type { DateSource, RuleConfig } from "../../../types";

type DateTimeRule = Extract<RuleConfig, { type: "datetime" }>;

interface DateTimeFieldProps {
  value: DateTimeRule;
  onChange: (rule: DateTimeRule) => void;
}

const DATE_SOURCE_OPTIONS: Array<{ value: DateSource; label: string }> = [
  { value: "created", label: "创建日期" },
  { value: "modified", label: "修改日期" },
];

export function DateTimeField({ value, onChange }: DateTimeFieldProps) {
  return (
    <Space.Compact block>
      <Select
        aria-label="日期来源"
        className="datetime-field__source"
        onChange={(source) => onChange({ ...value, source })}
        options={DATE_SOURCE_OPTIONS}
        value={value.source}
      />
      <Input
        aria-label="日期格式"
        onChange={(event) => onChange({ ...value, format: event.target.value })}
        placeholder="YYYYMMDD"
        value={value.format}
      />
    </Space.Compact>
  );
}
