export interface FileItem {
  path: string;
  name: string;
  ext: string;
  size: number;
  created: string;
  modified: string;
}

export interface PreviewItem {
  original: FileItem;
  new_name: string;
  conflict: boolean;
  selected: boolean;
}

export type PreviewFileType = "all" | "image" | "video" | "audio" | "document";

export type CaseMode = "upper" | "lower" | "capitalize";
export type SortBy = "name" | "created" | "modified" | "size";
export type DateSource = "created" | "modified";

export type RuleConfig =
  | { type: "prefix"; text: string }
  | { type: "suffix"; text: string }
  | { type: "strip"; keep_chars: string }
  | { type: "case"; mode: CaseMode }
  | { type: "replace"; from: string; to: string; regex: boolean }
  | {
      type: "sequence";
      start: number;
      step: number;
      digits: number;
      sort_by: SortBy;
    }
  | { type: "datetime"; source: DateSource; format: string };

export interface FailureItem {
  path: string;
  error: string;
}

export interface LogEntry {
  timestamp: string;
  old_path: string;
  new_path: string;
  status: string;
}

export interface ExecuteResult {
  success: number;
  failed: number;
  rolled_back: number;
  failures: FailureItem[];
  entries: LogEntry[];
}

export interface UndoResult {
  restored: number;
  failed: number;
}

export interface Template {
  name: string;
  rules: RuleConfig[];
  created: string;
}
