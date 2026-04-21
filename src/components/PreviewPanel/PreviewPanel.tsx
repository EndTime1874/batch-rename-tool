import { Button, Empty, Spin } from "antd";
import { PreviewList } from "./PreviewList";
import { StatsBar } from "./StatsBar";
import type { IndexedPreviewItem } from "../../hooks/useRenamePreview";
import type { PreviewFileType } from "../../types";

interface PreviewPanelProps {
  conflictCount: number;
  filterType: PreviewFileType;
  items: IndexedPreviewItem[];
  loading: boolean;
  selectedCount: number;
  totalCount: number;
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
  selectedCount,
  totalCount,
  onFilterByType,
  onInvertSelect,
  onToggleSelect,
  onToggleSelectAll,
}: PreviewPanelProps) {
  const hasItems = totalCount > 0;

  return (
    <Spin spinning={loading}>
      <section className="preview-panel">
        {hasItems ? (
          <>
            <StatsBar
              conflictCount={conflictCount}
              selectedCount={selectedCount}
              totalCount={totalCount}
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
              <Button disabled={selectedCount === 0} type="primary">
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
