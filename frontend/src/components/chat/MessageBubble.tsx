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
          <div className="mt-2 space-y-1.5">
            {/* Primary metrics */}
            <div className="flex items-center gap-3 px-1 text-xs text-gray-500">
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

            {/* Secondary metrics: Complexity and Prompt Goal */}
            {(message.metrics.complexity_score || message.metrics.prompt_goal) && (
              <div className="flex items-center gap-3 px-1 text-xs text-gray-400">
                {message.metrics.complexity_score && (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-gray-500">Complexity:</span>
                      <span
                        className={`font-mono font-medium px-2 py-0.5 rounded ${
                          message.metrics.complexity_score === 1
                            ? 'bg-green-900/30 text-green-300'
                            : message.metrics.complexity_score === 2
                              ? 'bg-yellow-900/30 text-yellow-300'
                              : 'bg-red-900/30 text-red-300'
                        }`}
                      >
                        {message.metrics.complexity_score === 1
                          ? 'Simple'
                          : message.metrics.complexity_score === 2
                            ? 'Medium'
                            : 'Complex'}
                      </span>
                    </span>
                    {message.metrics.prompt_goal && <span>·</span>}
                  </>
                )}
                {message.metrics.prompt_goal && (
                  <span className="text-gray-400 italic">Goal: {message.metrics.prompt_goal}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
