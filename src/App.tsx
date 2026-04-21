import { useEffect, useState } from "react";
import { Layout } from "antd";
import { listen, TauriEvent } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { ConfigPanel } from "./components/ConfigPanel/ConfigPanel";
import { PreviewPanel } from "./components/PreviewPanel/PreviewPanel";
import { useRenamePreview } from "./hooks/useRenamePreview";
import { invokeCommand } from "./utils/tauriInvoke";
import type { RuleConfig } from "./types";

interface DragDropPayload {
  paths: string[];
}

function App() {
  const [folderPath, setFolderPath] = useState("");
  const [recursive, setRecursive] = useState(false);
  const [extensions, setExtensions] = useState<string[]>([]);
  const [rules, setRules] = useState<RuleConfig[]>([]);
  const [appMode, setAppMode] = useState<"portable" | "installed" | null>(null);
  const preview = useRenamePreview();

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let disposed = false;

    listen<DragDropPayload>(TauriEvent.DRAG_DROP, (event) => {
      const [path] = event.payload.paths;

      if (path) {
        setFolderPath(path);
      }
    })
      .then((handler) => {
        if (disposed) {
          handler();
          return;
        }

        unlisten = handler;
      })
      .catch((error: unknown) => {
        console.error("Failed to listen for drag-drop events", error);
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    invokeCommand<string>("get_app_mode")
      .then((mode) => {
        setAppMode(mode as "portable" | "installed");
      })
      .catch((error: unknown) => {
        console.error("Failed to get app mode", error);
      });
  }, []);

  return (
    <Layout className="app-shell">
      <Layout.Sider className="app-sidebar" width={360}>
        <ConfigPanel
          appMode={appMode}
          extensions={extensions}
          folderPath={folderPath}
          onExtensionsChange={setExtensions}
          onFolderPathChange={setFolderPath}
          onGeneratePreview={() =>
            preview.generatePreview(folderPath, recursive, extensions, rules)
          }
          onRecursiveChange={setRecursive}
          onRulesChange={setRules}
          previewLoading={preview.loading}
          recursive={recursive}
          rules={rules}
        />
      </Layout.Sider>
      <Layout.Content className="app-content">
        <PreviewPanel
          conflictCount={preview.conflictCount}
          filterType={preview.filterType}
          items={preview.filteredItems}
          loading={preview.loading}
          onFilterByType={preview.filterByType}
          onInvertSelect={preview.invertSelect}
          onToggleSelect={preview.toggleSelect}
          onToggleSelectAll={preview.toggleSelectAll}
          selectedCount={preview.selectedCount}
          selectedItems={preview.selectedItems}
          totalCount={preview.totalCount}
          warningCount={preview.warningCount}
        />
      </Layout.Content>
    </Layout>
  );
}

export default App;
