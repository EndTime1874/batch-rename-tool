import { Select } from "antd";
import type { CaseMode, RuleConfig } from "../../../types";

type CaseRule = Extract<RuleConfig, { type: "case" }>;

interface CaseFieldProps {
  value: CaseRule;
  onChange: (rule: CaseRule) => void;
}

const CASE_OPTIONS: Array<{ value: CaseMode; label: string }> = [
  { value: "upper", label: "全大写" },
  { value: "lower", label: "全小写" },
  { value: "capitalize", label: "首字母大写" },
];

export function CaseField({ value, onChange }: CaseFieldProps) {
  return (
    <Select
      aria-label="大小写模式"
      onChange={(mode) => onChange({ ...value, mode })}
      options={CASE_OPTIONS}
      value={value.mode}
    />
  );
}
