import type { Message } from '../../stores/chatStore'
import { StreamingText } from './StreamingText'
import { modelBadgeTextClasses } from '../../lib/models'

interface Props { message: Message }

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-gray-800 text-gray-100 rounded-tl-sm'
          }`}
        >
          <StreamingText content={message.content} isStreaming={message.isStreaming} />
        </div>

        {/* Metrics bar — only for assistant, only after streaming done */}
        {!isUser && !message.isStreaming && message.metrics && (
          <div className="flex items-center gap-3 mt-1.5 px-1 text-xs text-gray-500">
            <span className="font-mono">
              {message.metrics.total_tokens.toLocaleString()} tokens
            </span>
            <span>·</span>
            <span
              className={`font-mono font-medium ${modelBadgeTextClasses(message.metrics.model)}`}
              title={message.metrics.model}
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
