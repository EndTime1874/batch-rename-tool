import { useMemo, useState } from "react";
import { message } from "antd";
import { invokeCommand } from "../utils/tauriInvoke";
import type { PreviewFileType, PreviewItem, RuleConfig } from "../types";

export interface IndexedPreviewItem {
  index: number;
  item: PreviewItem;
}

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "tiff",
  "heic",
]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "avi", "mkv", "webm", "m4v"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "flac", "aac", "m4a", "ogg"]);
const DOCUMENT_EXTENSIONS = new Set([
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
]);

export function getPreviewFileType(item: PreviewItem): Exclude<
  PreviewFileType,
  "all"
> | "other" {
  const extension = item.original.ext.toLowerCase().replace(/^\./, "");

  if (IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    return "video";
  }

  if (AUDIO_EXTENSIONS.has(extension)) {
    return "audio";
  }

  if (DOCUMENT_EXTENSIONS.has(extension)) {
    return "document";
  }

  return "other";
}

function normalizePreviewItems(items: PreviewItem[]) {
  return items.map((item) => ({
    ...item,
    selected: item.conflict || item.warning ? false : item.selected,
  }));
}

export function useRenamePreview() {
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [filterType, setFilterType] = useState<PreviewFileType>("all");
  const [loading, setLoading] = useState(false);

  const generatePreview = async (
    path: string,
    recursive: boolean,
    extensions: string[],
    rules: RuleConfig[],
  ) => {
    setLoading(true);

    try {
      const items = await invokeCommand<PreviewItem[]>("preview_rename", {
        path,
        recursive,
        extensions,
        rules,
      });
      const warningCount = items.filter((item) => item.warning).length;

      setPreviewItems(normalizePreviewItems(items));
      setFilterType("all");

      if (warningCount > 0) {
        message.warning(`${warningCount} 个文件存在跨平台风险，已在预览中标记`);
      }
    } catch {
      setPreviewItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    setPreviewItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index && !item.conflict && !item.warning
          ? { ...item, selected: !item.selected }
          : item,
      ),
    );
  };

  const toggleSelectAll = () => {
    setPreviewItems((items) => {
      const selectableItems = items.filter((item) => !item.conflict && !item.warning);
      const shouldSelect = selectableItems.some((item) => !item.selected);

      return items.map((item) =>
        item.conflict || item.warning
          ? item
          : { ...item, selected: shouldSelect },
      );
    });
  };

  const invertSelect = () => {
    setPreviewItems((items) =>
      items.map((item) =>
        item.conflict || item.warning
          ? item
          : { ...item, selected: !item.selected },
      ),
    );
  };

  const filterByType = (type: PreviewFileType) => {
    setFilterType(type);
  };

  const filteredItems = useMemo<IndexedPreviewItem[]>(
    () =>
      previewItems
        .map((item, index) => ({ item, index }))
        .filter(({ item }) =>
          filterType === "all" ? true : getPreviewFileType(item) === filterType,
        ),
    [filterType, previewItems],
  );

  const totalCount = previewItems.length;
  const selectedCount = previewItems.filter((item) => item.selected).length;
  const conflictCount = previewItems.filter((item) => item.conflict).length;
  const warningCount = previewItems.filter((item) => item.warning).length;
  const selectedItems = useMemo(
    () =>
      previewItems.filter(
        (item) => item.selected && !item.conflict && !item.warning,
      ),
    [previewItems],
  );

  return {
    conflictCount,
    filterByType,
    filteredItems,
    filterType,
    generatePreview,
    invertSelect,
    loading,
    previewItems,
    selectedCount,
    selectedItems,
    toggleSelect,
    toggleSelectAll,
    totalCount,
    warningCount,
  };
}
