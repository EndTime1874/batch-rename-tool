import { useState } from "react";
import { message } from "antd";
import { invokeCommand } from "../utils/tauriInvoke";
import type { ExecuteResult, PreviewItem, UndoResult } from "../types";

export function useRenameExecute() {
  const [executing, setExecuting] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [undoResult, setUndoResult] = useState<UndoResult | null>(null);

  const executeRename = async (items: PreviewItem[]) => {
    setExecuting(true);
    setUndoResult(null);

    try {
      const executeResult = await invokeCommand<ExecuteResult>("execute_rename", {
        items,
      });
      setResult(executeResult);
      return executeResult;
    } catch {
      return undefined;
    } finally {
      setExecuting(false);
    }
  };

  const undoLast = async () => {
    setUndoing(true);

    try {
      const nextUndoResult = await invokeCommand<UndoResult>("undo_last");
      setUndoResult(nextUndoResult);

      if (nextUndoResult.restored === 0 && nextUndoResult.failed === 0) {
        message.info("暂无可撤销的操作");
      }

      return nextUndoResult;
    } catch {
      return undefined;
    } finally {
      setUndoing(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setUndoResult(null);
  };

  return {
    clearResult,
    executeRename,
    executing,
    result,
    undoLast,
    undoing,
    undoResult,
  };
}
