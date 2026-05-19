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

            {/* Secondary metrics: Complexity, Goal, and Safety */}
            {(message.metrics.complexity_score || message.metrics.prompt_goal || message.metrics.safety_score !== undefined) && (
              <div className="flex flex-col gap-1.5 px-1">
                {/* Complexity and Safety on same line */}
                <div className="flex items-center gap-3 text-xs">
                  {message.metrics.complexity_score && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-gray-500">Complexity:</span>
                      <span
                        className={`font-mono font-medium px-2 py-0.5 rounded ${
                          message.metrics.complexity_score === 1
                            ? 'bg-green-900/30 text-green-300'
                            : message.metrics.complexity_score === 2
                              ? 'bg-blue-900/30 text-blue-300'
                              : message.metrics.complexity_score === 3
                                ? 'bg-yellow-900/30 text-yellow-300'
                                : message.metrics.complexity_score === 4
                                  ? 'bg-orange-900/30 text-orange-300'
                                  : 'bg-red-900/30 text-red-300'
                        }`}
                        title={`Complexity Level ${message.metrics.complexity_score}`}
                      >
                        {message.metrics.complexity_score === 1
                          ? 'Very Simple'
                          : message.metrics.complexity_score === 2
                            ? 'Simple'
                            : message.metrics.complexity_score === 3
                              ? 'Medium'
                              : message.metrics.complexity_score === 4
                                ? 'Complex'
                                : 'Very Complex'}
                      </span>
                    </span>
                  )}
                  
                  {message.metrics.safety_score !== undefined && (
                    <>
                      {message.metrics.complexity_score && <span className="text-gray-600">·</span>}
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-gray-500">Safety:</span>
                        <span
                          className={`font-mono font-medium px-2 py-0.5 rounded ${
                            message.metrics.safety_score >= 80
                              ? 'bg-green-900/30 text-green-300'
                              : message.metrics.safety_score >= 60
                                ? 'bg-blue-900/30 text-blue-300'
                                : message.metrics.safety_score >= 40
                                  ? 'bg-yellow-900/30 text-yellow-300'
                                  : 'bg-red-900/30 text-red-300'
                          }`}
                          title={`Safety Score: ${message.metrics.safety_score}/100`}
                        >
                          {message.metrics.safety_score}%
                        </span>
                      </span>
                    </>
                  )}
                </div>

                {/* Prompt Goal on separate line */}
                {message.metrics.prompt_goal && (
                  <span className="text-gray-400 italic text-xs">Goal: {message.metrics.prompt_goal}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
