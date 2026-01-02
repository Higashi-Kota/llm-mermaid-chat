const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:8000"

interface FetchConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

const config: FetchConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {},
}

export const setGlobalHeaders = (headers: Record<string, string>) => {
  Object.assign(config.headers, headers)
}

class HTTPError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public response: Response,
    // biome-ignore lint/suspicious/noExplicitAny: error body can be any shape
    public body?: any,
  ) {
    super(`HTTP Error: ${status} ${statusText}`)
    this.name = "HTTPError"
  }
}

export interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void
}

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const existingSignal = options.signal
  if (existingSignal) {
    existingSignal.addEventListener("abort", () => controller.abort())
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (controller.signal.aborted) {
      throw new Error("Request timeout")
    }
    throw error
  }
}

export function customInstance<T>(url: string, options?: RequestInit): CancellablePromise<T> {
  const controller = new AbortController()

  const method = options?.method ?? "GET"
  const headers = (options?.headers as Record<string, string>) ?? {}
  const body = options?.body
  const signal = options?.signal

  const fullURL = url.startsWith("http") ? url : `${config.baseURL}${url}`

  const mergedHeaders: Record<string, string> = {
    ...config.headers,
    ...headers,
  }

  if (signal) {
    signal.addEventListener("abort", () => controller.abort())
  }

  const fetchOptions: RequestInit = {
    method: method.toUpperCase(),
    headers: mergedHeaders,
    body,
    signal: controller.signal,
  }

  const promise = fetchWithTimeout(fullURL, fetchOptions, config.timeout).then(async (response) => {
    if (!response.ok) {
      let errorBody: unknown
      try {
        errorBody = await response.json()
      } catch {
        errorBody = await response.text()
      }
      throw new HTTPError(response.status, response.statusText, response, errorBody)
    }

    const contentType = response.headers.get("content-type") ?? ""

    let data: unknown
    if (response.status === 204) {
      data = undefined
    } else if (contentType.includes("application/json")) {
      data = await response.json()
    } else if (contentType.includes("text/")) {
      data = await response.text()
    } else {
      data = await response.blob()
    }

    // Orval expects { data, status, headers } format
    return {
      data,
      status: response.status,
      headers: response.headers,
    } as T
  }) as CancellablePromise<T>

  promise.cancel = () => {
    controller.abort()
  }

  return promise
}

export default customInstance
