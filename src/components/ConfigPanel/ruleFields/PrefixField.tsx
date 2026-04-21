import { Input } from "antd";
import type { RuleConfig } from "../../../types";

type PrefixRule = Extract<RuleConfig, { type: "prefix" }>;

interface PrefixFieldProps {
  value: PrefixRule;
  onChange: (rule: PrefixRule) => void;
}

export function PrefixField({ value, onChange }: PrefixFieldProps) {
  return (
    <Input
      aria-label="前缀文本"
      onChange={(event) => onChange({ ...value, text: event.target.value })}
      placeholder="前缀文本"
      value={value.text}
    />
  );
}
