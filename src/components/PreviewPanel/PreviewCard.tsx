import { Checkbox, Tag, Typography } from "antd";
import { getPreviewFileType } from "../../hooks/useRenamePreview";
import type { PreviewItem } from "../../types";

interface PreviewCardProps {
  item: PreviewItem;
  onToggle: () => void;
}

const FILE_TYPE_META = {
  image: { label: "图片", color: "blue" },
  video: { label: "视频", color: "purple" },
  audio: { label: "音频", color: "green" },
  document: { label: "文档", color: "cyan" },
  other: { label: "其他", color: "default" },
} as const;

export function PreviewCard({ item, onToggle }: PreviewCardProps) {
  const fileType = getPreviewFileType(item);
  const meta = FILE_TYPE_META[fileType];

  return (
    <article
      className={`preview-card${item.conflict ? " preview-card--conflict" : ""}`}
    >
      <Checkbox
        checked={item.selected}
        disabled={item.conflict}
        onChange={onToggle}
      />
      <Tag className="preview-card__type" color={meta.color}>
        {meta.label}
      </Tag>
      <Typography.Text className="preview-card__name" ellipsis>
        {item.original.name}
        {item.original.ext ? `.${item.original.ext}` : ""}
      </Typography.Text>
      <span className="preview-card__arrow">-&gt;</span>
      <Typography.Text className="preview-card__name" ellipsis strong>
        {item.new_name}
      </Typography.Text>
      {item.conflict ? (
        <Tag className="preview-card__conflict" color="orange">
          ! 冲突
        </Tag>
      ) : null}
    </article>
  );
}
