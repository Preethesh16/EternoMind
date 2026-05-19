import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useChat } from '../../hooks/useChat'
import { MessageBubble } from './MessageBubble'
import { ModelSelector } from './ModelSelector'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const currentPipelineStep = useChatStore((s) => s.currentPipelineStep)
  const selectedModel = useSessionStore((s) => s.selectedModel)
  const setSelectedModel = useSessionStore((s) => s.setSelectedModel)
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
    <div className="chat-interface-shell flex flex-col h-full min-h-0">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-5 py-3 bg-red-950/40 border-b border-red-700/50 text-red-200 text-xs backdrop-blur-md fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="flex-1">{error}</span>
          <button
            className="text-red-300 hover:text-white transition-colors"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages flex-1 overflow-y-auto px-5 py-4 min-h-0">
        {messages.length === 0 && (
          <div className="chat-empty-state flex flex-col items-center text-center fade-in">
            {/* Logo glow */}
            <div className="relative mb-5">
              <img
                src="/logo.png"
                alt="EternoMind"
                className="w-16 h-16 rounded-2xl object-cover shadow-2xl shadow-blue-500/30"
              />
              <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-[#1a4fd8] to-[#4D9EFF] opacity-30 blur-xl -z-10 animate-pulse" />
            </div>

            <h2 className="display-font text-2xl text-[#d7e3fc] font-bold mb-2 tracking-tight">
              Ask EternoMind <span className="text-[#4D9EFF]">anything</span>
            </h2>
            <p className="text-[#A8B4CC] text-xs max-w-md leading-relaxed mb-6">
              Watch token usage drop in real time as memory learns your context. Every interaction makes it smarter, cheaper, and faster.
            </p>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {[
                'Explain transformer attention',
                'How does multi-head attention work?',
                'What is positional encoding?',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="chat-btn-ghost text-xs rounded-full px-3 py-1.5 fade-in"
                  style={{ animationDelay: `${0.3 + i * 0.1}s`, opacity: 0 }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="msg-enter">
            <MessageBubble message={msg} />
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Pipeline step status pill */}
      {currentPipelineStep && (
        <div className="px-6 pb-2 fade-in">
          <div className="pipeline-pill flex items-center gap-2 rounded-full px-3 py-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4D9EFF] pulse-glow" />
            <span>{currentPipelineStep.replace(/_/g, ' ')}</span>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-5 py-3 border-t border-[#152050]/60 chat-surface flex-shrink-0">
        <div className="flex gap-2 items-center">
          <ModelSelector
            value={selectedModel}
            onChange={setSelectedModel}
            disabled={isLoading}
          />
          <input
            className="chat-input flex-1 rounded-full px-4 py-2.5 text-sm"
            placeholder="Ask EternoMind anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            onClick={() => void handleSend()}
            disabled={isLoading || !input.trim()}
            className="chat-btn-primary rounded-full px-4 py-2.5 text-sm flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="hidden sm:inline">Thinking</span>
              </>
            ) : (
              <>
                Send
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
