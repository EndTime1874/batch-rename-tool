import { useState } from "react";
import { Button, Input, Modal, Select, Space, Typography, message } from "antd";
import { useTemplates } from "../../hooks/useTemplates";
import type { RuleConfig } from "../../types";

interface TemplateManagerProps {
  rules: RuleConfig[];
  onLoadRules: (rules: RuleConfig[]) => void;
}

export function TemplateManager({ rules, onLoadRules }: TemplateManagerProps) {
  const {
    deleteTemplate,
    loadTemplate,
    loading,
    saveTemplate,
    templates,
  } = useTemplates();
  const [selectedName, setSelectedName] = useState<string>();
  const [saveOpen, setSaveOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const templateOptions = templates.map((template) => ({
    label: template.name,
    value: template.name,
  }));
  const normalizedName = templateName.trim();
  const hasSelectedTemplate = Boolean(selectedName);
  const hasDuplicateName = templates.some(
    (template) => template.name === normalizedName,
  );

  const handleLoad = async () => {
    if (!selectedName) {
      return;
    }

    const loadedRules = await loadTemplate(selectedName);
    if (!loadedRules) {
      return;
    }

    onLoadRules(loadedRules);
    message.success("模板已载入");
  };

  const handleSave = async (name: string) => {
    const saved = await saveTemplate(name, rules);

    if (saved) {
      setSelectedName(name);
      setSaveOpen(false);
      setTemplateName("");
    }
  };

  const handleSaveConfirm = () => {
    if (!normalizedName) {
      message.warning("请输入模板名称");
      return;
    }

    if (hasDuplicateName) {
      Modal.confirm({
        cancelText: "取消",
        content: `模板「${normalizedName}」已存在，是否覆盖？`,
        okText: "覆盖",
        onOk: () => handleSave(normalizedName),
        title: "覆盖模板",
      });
      return;
    }

    void handleSave(normalizedName);
  };

  const handleDelete = () => {
    if (!selectedName) {
      return;
    }

    Modal.confirm({
      cancelText: "取消",
      content: `删除后无法从模板列表恢复「${selectedName}」。`,
      okText: "删除",
      okButtonProps: { danger: true },
      onOk: async () => {
        const deleted = await deleteTemplate(selectedName);

        if (deleted) {
          setSelectedName(undefined);
        }
      },
      title: "删除模板",
    });
  };

  const handleOpenSave = () => {
    setTemplateName(selectedName ?? "");
    setSaveOpen(true);
  };

  return (
    <section className="config-section">
      <div className="config-section__heading">
        <Typography.Text className="config-section__title">模板</Typography.Text>
        <Button
          disabled={rules.length === 0}
          onClick={handleOpenSave}
          size="small"
          type="text"
        >
          保存
        </Button>
      </div>
      <Space.Compact className="template-manager__controls">
        <Select
          allowClear
          className="template-manager__select"
          disabled={templates.length === 0}
          loading={loading}
          onChange={setSelectedName}
          options={templateOptions}
          placeholder="选择模板"
          size="small"
          value={selectedName}
        />
        <Button
          disabled={!hasSelectedTemplate}
          onClick={handleLoad}
          size="small"
        >
          载入
        </Button>
        <Button
          danger
          disabled={!hasSelectedTemplate}
          onClick={handleDelete}
          size="small"
        >
          删除
        </Button>
      </Space.Compact>
      {templates.length === 0 ? (
        <div className="config-section__placeholder">暂无模板</div>
      ) : null}

      <Modal
        cancelText="取消"
        okText="保存"
        onCancel={() => setSaveOpen(false)}
        onOk={handleSaveConfirm}
        open={saveOpen}
        title="保存模板"
      >
        <Input
          autoFocus
          maxLength={40}
          onChange={(event) => setTemplateName(event.target.value)}
          onPressEnter={handleSaveConfirm}
          placeholder="模板名称"
          showCount
          value={templateName}
        />
      </Modal>
    </section>
  );
}
