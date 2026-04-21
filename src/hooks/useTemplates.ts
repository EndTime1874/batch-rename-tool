import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { invokeCommand } from "../utils/tauriInvoke";
import type { RuleConfig, Template } from "../types";

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshTemplates = useCallback(async () => {
    setLoading(true);

    try {
      const nextTemplates = await invokeCommand<Template[]>("list_templates");
      setTemplates(nextTemplates);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTemplates();
  }, [refreshTemplates]);

  const saveTemplate = useCallback(
    async (name: string, rules: RuleConfig[]) => {
      try {
        await invokeCommand<void>("save_template", { name, rules });
        message.success("模板已保存");
        await refreshTemplates();
        return true;
      } catch {
        return false;
      }
    },
    [refreshTemplates],
  );

  const loadTemplate = useCallback(async (name: string) => {
    try {
      return await invokeCommand<RuleConfig[]>("load_template", { name });
    } catch {
      return null;
    }
  }, []);

  const deleteTemplate = useCallback(
    async (name: string) => {
      try {
        await invokeCommand<void>("delete_template", { name });
        message.success("模板已删除");
        await refreshTemplates();
        return true;
      } catch {
        return false;
      }
    },
    [refreshTemplates],
  );

  return {
    deleteTemplate,
    loadTemplate,
    loading,
    refreshTemplates,
    saveTemplate,
    templates,
  };
}
