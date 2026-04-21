import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { invoke } from "@tauri-apps/api/core";
import type { RuleConfig, Template } from "../types";

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshTemplates = useCallback(async () => {
    setLoading(true);

    try {
      const nextTemplates = await invoke<Template[]>("list_templates");
      setTemplates(nextTemplates);
    } catch (error) {
      message.error(String(error));
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
        await invoke("save_template", { name, rules });
        message.success("模板已保存");
        await refreshTemplates();
        return true;
      } catch (error) {
        message.error(String(error));
        return false;
      }
    },
    [refreshTemplates],
  );

  const loadTemplate = useCallback(async (name: string) => {
    try {
      return await invoke<RuleConfig[]>("load_template", { name });
    } catch (error) {
      message.error(String(error));
      return null;
    }
  }, []);

  const deleteTemplate = useCallback(
    async (name: string) => {
      try {
        await invoke("delete_template", { name });
        message.success("模板已删除");
        await refreshTemplates();
        return true;
      } catch (error) {
        message.error(String(error));
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
