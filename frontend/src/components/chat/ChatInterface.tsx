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
    <div className="flex flex-col h-full bg-transparent">
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
            <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L5 11H10L11 23L21 9H16L13 2Z" stroke="currentColor" strokeWidth="1.2" className="text-purple-400" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-white text-lg font-medium">Ask EternoMind anything</p>
            <p className="text-slate-400 text-xs mt-2">
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
          <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-950/60 rounded-full px-3 py-1 w-fit border border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            {currentPipelineStep.replace(/_/g, ' ')}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-4 border-t border-purple-500/20 bg-gradient-to-b from-transparent to-black/20">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-black/30 backdrop-blur-md border border-purple-500/40 rounded-full px-5 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]"
            placeholder="Ask EternoMind anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            onClick={() => void handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full text-sm font-medium transition-all shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_rgba(139,92,246,0.7)]"
          >
            {isLoading ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
