// Generic SSE hook for GET-based event streams (utility)
// For POST /api/v1/chat use useChat instead (fetch + ReadableStream)
import { useEffect, useRef } from 'react'

type Handlers = Record<string, (data: unknown) => void>

export function useSSE(url: string | null, handlers: Handlers): void {
  const handlersRef = useRef<Handlers>(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!url) return

    const source = new EventSource(url)

    Object.keys(handlersRef.current).forEach((eventName) => {
      source.addEventListener(eventName, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          handlersRef.current[eventName]?.(data)
        } catch {
          handlersRef.current[eventName]?.(e.data)
        }
      })
    })

    source.onerror = () => source.close()

    return () => source.close()
  }, [url])
}
