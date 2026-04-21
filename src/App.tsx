import { useEffect, useState } from "react";
import { Layout } from "antd";
import { listen, TauriEvent } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { ConfigPanel } from "./components/ConfigPanel/ConfigPanel";
import { PreviewPanel } from "./components/PreviewPanel/PreviewPanel";
import { useRenamePreview } from "./hooks/useRenamePreview";
import type { RuleConfig } from "./types";

interface DragDropPayload {
  paths: string[];
}

function App() {
  const [folderPath, setFolderPath] = useState("");
  const [recursive, setRecursive] = useState(false);
  const [extensions, setExtensions] = useState<string[]>([]);
  const [rules, setRules] = useState<RuleConfig[]>([]);
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

  return (
    <Layout className="app-shell">
      <Layout.Sider className="app-sidebar" width={360}>
        <ConfigPanel
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
        />
      </Layout.Content>
    </Layout>
  );
}

export default App;
