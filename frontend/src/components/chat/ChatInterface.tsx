import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useChat } from '../../hooks/useChat'
import { MessageBubble } from './MessageBubble'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const currentPipelineStep = useChatStore((s) => s.currentPipelineStep)
  const { sendMessage } = useChat()

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    setError(null)
    await sendMessage(text, (msg) => setError(msg))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-900/60 border-b border-red-700 text-red-200 text-xs">
          <span className="animate-spin text-base">⟳</span>
          {error}
          <button
            className="ml-auto text-red-300 hover:text-white"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">⚡</div>
            <p className="text-gray-400 text-sm font-medium">Ask EternoMind anything</p>
            <p className="text-gray-600 text-xs mt-1">
              Watch token usage drop as memory learns your context
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Pipeline step status pill */}
      {currentPipelineStep && (
        <div className="px-4 pb-1">
          <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-950/50 rounded-full px-3 py-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            {currentPipelineStep.replace(/_/g, ' ')}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="Ask EternoMind anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            onClick={() => void handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            {isLoading ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
