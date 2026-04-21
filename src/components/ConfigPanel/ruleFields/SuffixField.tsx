import { Input } from "antd";
import type { RuleConfig } from "../../../types";

type SuffixRule = Extract<RuleConfig, { type: "suffix" }>;

interface SuffixFieldProps {
  value: SuffixRule;
  onChange: (rule: SuffixRule) => void;
}

export function SuffixField({ value, onChange }: SuffixFieldProps) {
  return (
    <Input
      aria-label="后缀文本"
      onChange={(event) => onChange({ ...value, text: event.target.value })}
      placeholder="后缀文本"
      value={value.text}
    />
  );
}
