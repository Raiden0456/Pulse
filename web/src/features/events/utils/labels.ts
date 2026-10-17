import { hasMessage, t } from "@/i18n"

const sourceLabels: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
}

export function taskLabel(task: string) {
  const key = `task.${task}`
  return hasMessage(key) ? t(key) : task
}

export const sourceLabel = (source: string) => sourceLabels[source] ?? source
