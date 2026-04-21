import { Input } from "antd";
import type { RuleConfig } from "../../../types";

type StripRule = Extract<RuleConfig, { type: "strip" }>;

interface StripFieldProps {
  value: StripRule;
  onChange: (rule: StripRule) => void;
}

export function StripField({ value, onChange }: StripFieldProps) {
  return (
    <Input
      aria-label="保留字符"
      onChange={(event) =>
        onChange({ ...value, keep_chars: event.target.value })
      }
      placeholder="保留字符，例如 -_ ."
      value={value.keep_chars}
    />
  );
}
