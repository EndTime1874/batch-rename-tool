import { Button, Empty, Modal, Spin } from "antd";
import { PreviewList } from "./PreviewList";
import { ResultPanel } from "./ResultPanel";
import { StatsBar } from "./StatsBar";
import { useRenameExecute } from "../../hooks/useRenameExecute";
import type { IndexedPreviewItem } from "../../hooks/useRenamePreview";
import type { PreviewFileType, PreviewItem } from "../../types";

interface PreviewPanelProps {
  conflictCount: number;
  filterType: PreviewFileType;
  items: IndexedPreviewItem[];
  loading: boolean;
  selectedItems: PreviewItem[];
  selectedCount: number;
  totalCount: number;
  warningCount: number;
  onFilterByType: (type: PreviewFileType) => void;
  onInvertSelect: () => void;
  onToggleSelect: (index: number) => void;
  onToggleSelectAll: () => void;
}

export function PreviewPanel({
  conflictCount,
  filterType,
  items,
  loading,
  selectedItems,
  selectedCount,
  totalCount,
  warningCount,
  onFilterByType,
  onInvertSelect,
  onToggleSelect,
  onToggleSelectAll,
}: PreviewPanelProps) {
  const hasItems = totalCount > 0;
  const {
    clearResult,
    executeRename,
    executing,
    result,
    undoLast,
    undoing,
    undoResult,
  } = useRenameExecute();
  const spinning = loading || executing;

  const handleExecute = () => {
    Modal.confirm({
      cancelText: "取消",
      content: `将处理 ${selectedItems.length} 个文件，是否继续？`,
      okText: "继续",
      onOk: () => executeRename(selectedItems),
      title: "确认执行重命名",
    });
  };

  return (
    <Spin spinning={spinning}>
      <section className="preview-panel">
        {result ? (
          <ResultPanel
            onBack={clearResult}
            onUndo={undoLast}
            result={result}
            undoing={undoing}
            undoResult={undoResult}
          />
        ) : hasItems ? (
          <>
            <StatsBar
              conflictCount={conflictCount}
              selectedCount={selectedCount}
              totalCount={totalCount}
              warningCount={warningCount}
            />
            <PreviewList
              filterType={filterType}
              items={items}
              onFilterByType={onFilterByType}
              onInvertSelect={onInvertSelect}
              onToggleSelect={onToggleSelect}
              onToggleSelectAll={onToggleSelectAll}
            />
            <div className="preview-panel__footer">
              <Button
                disabled={selectedItems.length === 0}
                loading={executing}
                onClick={handleExecute}
                type="primary"
              >
                执行重命名
              </Button>
            </div>
          </>
        ) : (
          <Empty description="请先选择文件夹并配置规则" />
        )}
      </section>
    </Spin>
  );
}
