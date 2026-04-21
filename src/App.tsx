import { useEffect, useState } from "react";
import { Layout } from "antd";
import { listen, TauriEvent } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { ConfigPanel } from "./components/ConfigPanel/ConfigPanel";
import { PreviewPanel } from "./components/PreviewPanel/PreviewPanel";

interface DragDropPayload {
  paths: string[];
}

function App() {
  const [folderPath, setFolderPath] = useState("");
  const [recursive, setRecursive] = useState(false);
  const [extensions, setExtensions] = useState<string[]>([]);

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
          onRecursiveChange={setRecursive}
          recursive={recursive}
        />
      </Layout.Sider>
      <Layout.Content className="app-content">
        <PreviewPanel />
      </Layout.Content>
    </Layout>
  );
}

export default App;
