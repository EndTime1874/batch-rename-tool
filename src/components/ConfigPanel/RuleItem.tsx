import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Button, Tag, Tooltip } from "antd";
import { RuleField } from "./ruleFields/RuleField";
import type { RuleConfig } from "../../types";

interface RuleItemProps {
  id: string;
  rule: RuleConfig;
  onChange: (rule: RuleConfig) => void;
  onDelete: () => void;
}

const RULE_META: Record<
  RuleConfig["type"],
  { label: string; color: string }
> = {
  prefix: { label: "前缀", color: "blue" },
  suffix: { label: "后缀", color: "cyan" },
  strip: { label: "去特殊", color: "purple" },
  case: { label: "大小写", color: "green" },
  replace: { label: "替换", color: "orange" },
  sequence: { label: "序号", color: "gold" },
  datetime: { label: "日期", color: "geekblue" },
};

export function RuleItem({ id, rule, onChange, onDelete }: RuleItemProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const meta = RULE_META[rule.type];

  return (
    <div
      className={`rule-item${isDragging ? " rule-item--dragging" : ""}`}
      ref={setNodeRef}
      style={style}
    >
      <Tooltip title="拖动排序">
        <button
          aria-label="拖动排序"
          className="rule-item__handle"
          type="button"
          {...attributes}
          {...listeners}
        >
          ::
        </button>
      </Tooltip>

      <Tag className="rule-item__tag" color={meta.color}>
        {meta.label}
      </Tag>

      <div className="rule-item__fields">
        <RuleField onChange={onChange} rule={rule} />
      </div>

      <Button danger onClick={onDelete} size="small" type="text">
        删除
      </Button>
    </div>
  );
}
