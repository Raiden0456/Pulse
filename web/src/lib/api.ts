export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

const codeMessages: Record<string, string> = {
  wrong_password: "Неверный пароль",
  wallpaper_too_large: "Фото больше 15 МБ",
  wallpaper_not_image: "Это не картинка",
}

type Method = "GET" | "POST" | "PUT" | "DELETE"

export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const isBlob = body instanceof Blob
  const res = await fetch(path, {
    method,
    headers: body === undefined || isBlob ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : isBlob ? body : JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new ApiError(res.status, data?.error ?? res.statusText, data?.code)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown = {}) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: <T = void>(path: string) => request<T>("DELETE", path),
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError && err.code && codeMessages[err.code]) return codeMessages[err.code]
  return err instanceof Error ? err.message : String(err)
}
