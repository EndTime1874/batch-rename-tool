import { InputNumber, Select, Space } from "antd";
import type { RuleConfig, SortBy } from "../../../types";

type SequenceRule = Extract<RuleConfig, { type: "sequence" }>;

interface SequenceFieldProps {
  value: SequenceRule;
  onChange: (rule: SequenceRule) => void;
}

const SORT_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: "name", label: "名称" },
  { value: "created", label: "创建时间" },
  { value: "modified", label: "修改时间" },
  { value: "size", label: "大小" },
];

function numericValue(value: number | null, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

export function SequenceField({ value, onChange }: SequenceFieldProps) {
  return (
    <Space className="sequence-field" size={6} wrap>
      <InputNumber
        aria-label="起始值"
        min={0}
        onChange={(nextValue) =>
          onChange({ ...value, start: numericValue(nextValue, value.start) })
        }
        placeholder="起始"
        value={value.start}
      />
      <InputNumber
        aria-label="步长"
        min={1}
        onChange={(nextValue) =>
          onChange({ ...value, step: numericValue(nextValue, value.step) })
        }
        placeholder="步长"
        value={value.step}
      />
      <InputNumber
        aria-label="位数"
        min={1}
        onChange={(nextValue) =>
          onChange({ ...value, digits: numericValue(nextValue, value.digits) })
        }
        placeholder="位数"
        value={value.digits}
      />
      <Select
        aria-label="排序依据"
        onChange={(sortBy) => onChange({ ...value, sort_by: sortBy })}
        options={SORT_OPTIONS}
        value={value.sort_by}
      />
    </Space>
  );
}
