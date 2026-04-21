import { Button, Empty, Radio, Space } from "antd";
import { PreviewCard } from "./PreviewCard";
import type { IndexedPreviewItem } from "../../hooks/useRenamePreview";
import type { PreviewFileType } from "../../types";

interface PreviewListProps {
  filterType: PreviewFileType;
  items: IndexedPreviewItem[];
  onFilterByType: (type: PreviewFileType) => void;
  onInvertSelect: () => void;
  onToggleSelect: (index: number) => void;
  onToggleSelectAll: () => void;
}

const FILTER_OPTIONS: Array<{ value: PreviewFileType; label: string }> = [
  { value: "all", label: "全部" },
  { value: "image", label: "图片" },
  { value: "video", label: "视频" },
  { value: "audio", label: "音频" },
  { value: "document", label: "文档" },
];

export function PreviewList({
  filterType,
  items,
  onFilterByType,
  onInvertSelect,
  onToggleSelect,
  onToggleSelectAll,
}: PreviewListProps) {
  return (
    <div className="preview-list">
      <div className="preview-list__toolbar">
        <Radio.Group
          onChange={(event) => onFilterByType(event.target.value)}
          optionType="button"
          options={FILTER_OPTIONS}
          size="small"
          value={filterType}
        />
        <Space size={8}>
          <Button onClick={onToggleSelectAll} size="small">
            全选
          </Button>
          <Button onClick={onInvertSelect} size="small">
            反选
          </Button>
        </Space>
      </div>

      {items.length > 0 ? (
        <div className="preview-list__items">
          {items.map(({ item, index }) => (
            <PreviewCard
              item={item}
              key={`${item.original.path}-${item.new_name}`}
              onToggle={() => onToggleSelect(index)}
            />
          ))}
        </div>
      ) : (
        <Empty description="当前类型没有可预览文件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
}
