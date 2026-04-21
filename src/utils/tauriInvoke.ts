import { message } from "antd";
import { invoke } from "@tauri-apps/api/core";

type InvokeArgs = Record<string, unknown>;

interface InvokeCommandOptions {
  showError?: boolean;
}

export async function invokeCommand<T>(
  command: string,
  args?: InvokeArgs,
  options: InvokeCommandOptions = {},
) {
  const { showError = true } = options;

  try {
    return await invoke<T>(command, args);
  } catch (error) {
    if (showError) {
      message.error(String(error));
    }

    throw error;
  }
}
