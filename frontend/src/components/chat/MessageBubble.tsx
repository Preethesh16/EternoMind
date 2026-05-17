import type { Message } from '../../stores/chatStore'
import { StreamingText } from './StreamingText'

interface Props { message: Message }

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 backdrop-blur-sm ${
            isUser
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-tr-sm shadow-[0_0_20px_rgba(139,92,246,0.4)]'
              : 'bg-gradient-to-r from-white/10 to-white/5 text-slate-100 rounded-tl-sm border border-purple-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
          }`}
        >
          <StreamingText content={message.content} isStreaming={message.isStreaming} />
        </div>

        {/* Metrics bar — only for assistant, only after streaming done */}
        {!isUser && !message.isStreaming && message.metrics && (
          <div className="flex items-center gap-3 mt-1.5 px-1 text-xs text-slate-400">
            <span className="font-mono">
              {message.metrics.total_tokens.toLocaleString()} tokens
            </span>
            <span>·</span>
            <span
              className={`font-mono font-medium ${
                message.metrics.model.includes('70b') ? 'text-orange-400' : 'text-green-400'
              }`}
            >
              {message.metrics.model}
            </span>
            <span>·</span>
            <span className="font-mono">{message.metrics.latency_ms.toFixed(0)} ms</span>
            <span>·</span>
            <span className="font-mono">{message.metrics.memory_hits} memories</span>
          </div>
        )}
      </div>
    </div>
  )
}
