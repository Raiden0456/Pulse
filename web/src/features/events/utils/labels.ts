const taskLabels: Record<string, string> = {
  "mail-scan": "Скан почты",
  invoices: "Фактуры",
  "morning-brief": "Утренний бриф",
  "pre-standup-brief": "Перед стендапом",
  "weekly-review": "Итог недели",
}

const sourceLabels: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
}

export const taskLabel = (task: string) => taskLabels[task] ?? task
export const sourceLabel = (source: string) => sourceLabels[source] ?? source
