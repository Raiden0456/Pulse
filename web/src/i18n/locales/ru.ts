import type { Messages } from "./en"

export const ru: Messages = {
  "common.errorTitle": "Что-то пошло не так",
  "common.open": "Открыть",
  "common.justNow": "только что",
  "common.switchLanguage": "Переключить на английский",

  "errors.wrongPassword": "Неверный пароль",
  "errors.wallpaperTooLarge": "Фото больше 15 МБ",
  "errors.wallpaperNotImage": "Это не картинка",

  "auth.tagline": "Всё, что произошло, на одном экране",
  "auth.password": "Пароль",
  "auth.signIn": "Войти",
  "auth.signingIn": "Входим…",
  "auth.logout": "Выйти",

  "today.morning": "Доброе утро",
  "today.afternoon": "Добрый день",
  "today.evening": "Добрый вечер",
  "today.night": "Доброй ночи",
  "today.subtitle": "Вот что произошло, пока тебя не было.",
  "today.statAttention": "требуют внимания",
  "today.statCritical": {
    one: "требуют внимания · {count} критичный",
    few: "требуют внимания · {count} критичных",
    many: "требуют внимания · {count} критичных",
    other: "требуют внимания · {count} критичных",
  },
  "today.statAgents": "агентов в норме",
  "today.statApps": "приложений онлайн",

  "attention.title": "Требует внимания",
  "attention.window": "За последние 3 дня",
  "attention.empty": "Ничего срочного. Можно выдохнуть.",
  "attention.until": "до {date}",
  "attention.runFailed": "{task}: ошибка выполнения",
  "attention.overdue": "Просрочена",
  "attention.unpaid": "Не оплачена",
  "attention.invoices": "Фактуры",

  "tasks.title": "Агенты",
  "tasks.description": "Последний прогон каждой таски",
  "tasks.empty": "Пока ни одного отчёта.",

  "activity.title": "Активность",
  "activity.empty": "Тут появятся отчёты агентов.",
  "activity.error": "ошибка",
  "activity.openBrief": "Открыть брифинг",

  "apps.title": "Приложения",
  "apps.empty": "Добавь приложения в PULSE_APPS.",
  "apps.online": "онлайн · {ms} мс",
  "apps.down": "недоступно",

  "wallpaper.label": "Фон",
  "wallpaper.choose": "Выбрать фон",
  "wallpaper.change": "Сменить фон",
  "wallpaper.remove": "Убрать фон",
  "wallpaper.dim": "Затемнение",

  "task.mail-scan": "Скан почты",
  "task.invoices": "Фактуры",
  "task.morning-brief": "Утренний бриф",
  "task.pre-standup-brief": "Перед стендапом",
  "task.weekly-review": "Итог недели",
}
