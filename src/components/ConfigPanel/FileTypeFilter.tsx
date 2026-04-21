import { useEffect, useMemo, useState } from "react";
import { Checkbox, Input, Tag, Typography } from "antd";

const FILE_TYPE_GROUPS = [
  {
    key: "images",
    label: "图片",
    extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "heic"],
  },
  {
    key: "videos",
    label: "视频",
    extensions: ["mp4", "mov", "avi", "mkv", "webm", "m4v"],
  },
  {
    key: "audio",
    label: "音频",
    extensions: ["mp3", "wav", "flac", "aac", "m4a", "ogg"],
  },
  {
    key: "documents",
    label: "文档",
    extensions: [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "md",
      "csv",
    ],
  },
] as const;

type FileTypeGroupKey = (typeof FILE_TYPE_GROUPS)[number]["key"];

const DEFAULT_GROUPS = FILE_TYPE_GROUPS.map((group) => group.key);

interface FileTypeFilterProps {
  extensions: string[];
  onExtensionsChange: (extensions: string[]) => void;
}

function parseCustomExtensions(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().replace(/^\.+/, "").toLowerCase())
    .filter(Boolean);
}

function uniqueExtensions(extensions: string[]) {
  return Array.from(new Set(extensions));
}

export function FileTypeFilter({
  extensions,
  onExtensionsChange,
}: FileTypeFilterProps) {
  const [selectedGroups, setSelectedGroups] =
    useState<FileTypeGroupKey[]>(DEFAULT_GROUPS);
  const [customInput, setCustomInput] = useState("");

  const selectedExtensions = useMemo(() => {
    const groupedExtensions = FILE_TYPE_GROUPS.flatMap((group) =>
      selectedGroups.includes(group.key) ? [...group.extensions] : [],
    );

    return uniqueExtensions([
      ...groupedExtensions,
      ...parseCustomExtensions(customInput),
    ]);
  }, [customInput, selectedGroups]);

  useEffect(() => {
    onExtensionsChange(selectedExtensions);
  }, [onExtensionsChange, selectedExtensions]);

  return (
    <section className="config-section">
      <Typography.Text className="config-section__title">文件类型</Typography.Text>
      <Checkbox.Group
        className="file-type-filter__groups"
        onChange={(checkedValues) =>
          setSelectedGroups(checkedValues as FileTypeGroupKey[])
        }
        value={selectedGroups}
      >
        {FILE_TYPE_GROUPS.map((group) => (
          <Checkbox key={group.key} value={group.key}>
            {group.label}
          </Checkbox>
        ))}
      </Checkbox.Group>

      <Input
        aria-label="自定义扩展名"
        onChange={(event) => setCustomInput(event.target.value)}
        placeholder="自定义扩展名，英文逗号分隔"
        value={customInput}
      />

      <div className="file-type-filter__summary">
        <Typography.Text type="secondary">
          已选择 {extensions.length} 种扩展名
        </Typography.Text>
        <div className="file-type-filter__tags">
          {selectedExtensions.slice(0, 12).map((extension) => (
            <Tag key={extension}>{extension}</Tag>
          ))}
          {selectedExtensions.length > 12 ? (
            <Tag>+{selectedExtensions.length - 12}</Tag>
          ) : null}
        </div>
      </div>
    </section>
  );
}
