import { useEffect, useState } from "react";
import { Button, Checkbox, Input, Space, Typography } from "antd";
import { open } from "@tauri-apps/plugin-dialog";
import { invokeCommand } from "../../utils/tauriInvoke";

interface FolderSelectorProps {
  path: string;
  recursive: boolean;
  onPathChange: (path: string) => void;
  onRecursiveChange: (recursive: boolean) => void;
}

type ValidationState = "idle" | "validating" | "valid" | "invalid";

export function FolderSelector({
  path,
  recursive,
  onPathChange,
  onRecursiveChange,
}: FolderSelectorProps) {
  const [opening, setOpening] = useState(false);
  const [validation, setValidation] = useState<ValidationState>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const trimmedPath = path.trim();

    if (!trimmedPath) {
      setValidation("idle");
      setError("");
      return;
    }

    setValidation("validating");
    let cancelled = false;

    const timer = window.setTimeout(() => {
      invokeCommand<void>(
        "validate_folder",
        { path: trimmedPath },
        { showError: false },
      )
        .then(() => {
          if (cancelled) {
            return;
          }

          setValidation("valid");
          setError("");
        })
        .catch((reason: unknown) => {
          if (cancelled) {
            return;
          }

          setValidation("invalid");
          setError(String(reason));
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [path]);

  const handleSelectFolder = async () => {
    setOpening(true);

    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择文件夹",
      });

      if (typeof selected === "string") {
        onPathChange(selected);
      }
    } finally {
      setOpening(false);
    }
  };

  return (
    <section className="config-section">
      <Typography.Text className="config-section__title">文件夹</Typography.Text>
      <Space.Compact block>
        <Input
          aria-label="文件夹路径"
          onChange={(event) => onPathChange(event.target.value)}
          placeholder="选择或拖入文件夹"
          status={validation === "invalid" ? "error" : undefined}
          value={path}
        />
        <Button loading={opening} onClick={handleSelectFolder}>
          选择
        </Button>
      </Space.Compact>

      {validation === "invalid" ? (
        <Typography.Text type="danger">{error}</Typography.Text>
      ) : null}

      <Checkbox
        checked={recursive}
        onChange={(event) => onRecursiveChange(event.target.checked)}
      >
        包含子文件夹
      </Checkbox>
    </section>
  );
}
