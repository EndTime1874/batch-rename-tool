import { useEffect, useRef, useState, type MutableRefObject } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Select, Typography } from "antd";
import { RuleItem } from "./RuleItem";
import type { RuleConfig } from "../../types";

type RuleType = RuleConfig["type"];

interface RuleEntry {
  id: string;
  config: RuleConfig;
}

interface RuleConfiguratorProps {
  rules: RuleConfig[];
  onRulesChange: (rules: RuleConfig[]) => void;
}

const RULE_TYPE_OPTIONS: Array<{ value: RuleType; label: string }> = [
  { value: "prefix", label: "前缀" },
  { value: "suffix", label: "后缀" },
  { value: "strip", label: "去特殊字符" },
  { value: "case", label: "大小写" },
  { value: "replace", label: "查找替换" },
  { value: "sequence", label: "序号" },
  { value: "datetime", label: "日期" },
];

function createDefaultRule(type: RuleType): RuleConfig {
  switch (type) {
    case "prefix":
      return { type, text: "" };
    case "suffix":
      return { type, text: "" };
    case "strip":
      return { type, keep_chars: "-_ ." };
    case "case":
      return { type, mode: "lower" };
    case "replace":
      return { type, from: "", to: "", regex: false };
    case "sequence":
      return { type, start: 1, step: 1, digits: 3, sort_by: "name" };
    case "datetime":
      return { type, source: "modified", format: "YYYYMMDD" };
  }
}

function serializeRules(rules: RuleConfig[]) {
  return JSON.stringify(rules);
}

function createRuleEntries(
  rules: RuleConfig[],
  nextIdRef: MutableRefObject<number>,
) {
  return rules.map((rule) => {
    const entry = {
      id: `rule-${nextIdRef.current}`,
      config: rule,
    };

    nextIdRef.current += 1;
    return entry;
  });
}

export function RuleConfigurator({
  rules,
  onRulesChange,
}: RuleConfiguratorProps) {
  const nextIdRef = useRef(1);
  const [entries, setEntries] = useState<RuleEntry[]>(() =>
    createRuleEntries(rules, nextIdRef),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const updateEntries = (nextEntries: RuleEntry[]) => {
    setEntries(nextEntries);
    onRulesChange(nextEntries.map((entry) => entry.config));
  };

  useEffect(() => {
    const currentRules = entries.map((entry) => entry.config);

    if (serializeRules(currentRules) !== serializeRules(rules)) {
      setEntries(createRuleEntries(rules, nextIdRef));
    }
  }, [rules, entries]);

  const handleAddRule = (type: RuleType) => {
    const nextEntry: RuleEntry = {
      id: `rule-${nextIdRef.current}`,
      config: createDefaultRule(type),
    };

    nextIdRef.current += 1;
    updateEntries([...entries, nextEntry]);
  };

  const handleUpdateRule = (id: string, config: RuleConfig) => {
    updateEntries(
      entries.map((entry) => (entry.id === id ? { ...entry, config } : entry)),
    );
  };

  const handleDeleteRule = (id: string) => {
    updateEntries(entries.filter((entry) => entry.id !== id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = entries.findIndex((entry) => entry.id === active.id);
    const newIndex = entries.findIndex((entry) => entry.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    updateEntries(arrayMove(entries, oldIndex, newIndex));
  };

  return (
    <section className="config-section">
      <div className="config-section__heading">
        <Typography.Text className="config-section__title">规则</Typography.Text>
        <Select
          className="rule-configurator__add"
          onChange={handleAddRule}
          options={RULE_TYPE_OPTIONS}
          placeholder="添加规则"
          size="small"
          value={null}
        />
      </div>

      {entries.length > 0 ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext
            items={entries.map((entry) => entry.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="rule-configurator__list">
              {entries.map((entry) => (
                <RuleItem
                  id={entry.id}
                  key={entry.id}
                  onChange={(config) => handleUpdateRule(entry.id, config)}
                  onDelete={() => handleDeleteRule(entry.id)}
                  rule={entry.config}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="config-section__placeholder">尚未添加规则</div>
      )}
    </section>
  );
}
