import { CaseField } from "./CaseField";
import { DateTimeField } from "./DateTimeField";
import { PrefixField } from "./PrefixField";
import { ReplaceField } from "./ReplaceField";
import { SequenceField } from "./SequenceField";
import { StripField } from "./StripField";
import { SuffixField } from "./SuffixField";
import type { RuleConfig } from "../../../types";

interface RuleFieldProps {
  rule: RuleConfig;
  onChange: (rule: RuleConfig) => void;
}

export function RuleField({ rule, onChange }: RuleFieldProps) {
  switch (rule.type) {
    case "prefix":
      return <PrefixField onChange={onChange} value={rule} />;
    case "suffix":
      return <SuffixField onChange={onChange} value={rule} />;
    case "strip":
      return <StripField onChange={onChange} value={rule} />;
    case "case":
      return <CaseField onChange={onChange} value={rule} />;
    case "replace":
      return <ReplaceField onChange={onChange} value={rule} />;
    case "sequence":
      return <SequenceField onChange={onChange} value={rule} />;
    case "datetime":
      return <DateTimeField onChange={onChange} value={rule} />;
  }
}
