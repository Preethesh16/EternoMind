import type { Message } from '../../stores/chatStore'
import { StreamingText } from './StreamingText'
import { modelBadgeTextClasses } from '../../lib/models'

interface Props { message: Message }

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5`}>
      <div className={`max-w-[82%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Bubble */}
        <div
          className={`rounded-2xl px-5 py-3.5 ${
            isUser ? 'bubble-user rounded-tr-sm' : 'bubble-assistant rounded-tl-sm'
          }`}
        >
          <StreamingText content={message.content} isStreaming={message.isStreaming} />
        </div>

        {/* Metrics bar — only for assistant, only after streaming done */}
        {!isUser && !message.isStreaming && message.metrics && (
          <div className="mt-2.5 space-y-2 fade-in">
            {/* Primary metrics */}
            <div className="flex items-center gap-2.5 px-1 text-[11px]">
              <span className="font-mono text-[#A8B4CC]">
                {message.metrics.total_tokens.toLocaleString()} tokens
              </span>
              <span className="text-[#434655]">•</span>
              <span
                className={`font-mono font-semibold ${modelBadgeTextClasses(message.metrics.model)}`}
                title={message.metrics.model}
              >
                {message.metrics.model.length > 30
                  ? message.metrics.model.slice(0, 30) + '…'
                  : message.metrics.model}
              </span>
              <span className="text-[#434655]">•</span>
              <span className="font-mono text-[#A8B4CC]">{message.metrics.latency_ms.toFixed(0)} ms</span>
              <span className="text-[#434655]">•</span>
              <span className="font-mono text-[#A8B4CC]">{message.metrics.memory_hits} memories</span>
            </div>

            {/* Secondary metrics: Complexity, Goal, Safety */}
            {(message.metrics.complexity_score || message.metrics.prompt_goal || message.metrics.safety_score !== undefined) && (
              <div className="flex flex-col gap-1.5 px-1">
                <div className="flex items-center gap-3 text-[11px] flex-wrap">
                  {message.metrics.complexity_score && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[#7BA8E8] uppercase tracking-wider text-[9px] font-semibold">Complexity</span>
                      <span
                        className={`font-mono font-medium px-2 py-0.5 rounded-full border ${
                          message.metrics.complexity_score === 1
                            ? 'bg-green-900/20 text-green-300 border-green-700/40'
                            : message.metrics.complexity_score === 2
                              ? 'bg-blue-900/20 text-blue-300 border-blue-700/40'
                              : message.metrics.complexity_score === 3
                                ? 'bg-yellow-900/20 text-yellow-300 border-yellow-700/40'
                                : message.metrics.complexity_score === 4
                                  ? 'bg-orange-900/20 text-orange-300 border-orange-700/40'
                                  : 'bg-red-900/20 text-red-300 border-red-700/40'
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
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[#7BA8E8] uppercase tracking-wider text-[9px] font-semibold">Safety</span>
                      <span
                        className={`font-mono font-medium px-2 py-0.5 rounded-full border ${
                          message.metrics.safety_score >= 80
                            ? 'bg-green-900/20 text-green-300 border-green-700/40'
                            : message.metrics.safety_score >= 60
                              ? 'bg-blue-900/20 text-blue-300 border-blue-700/40'
                              : message.metrics.safety_score >= 40
                                ? 'bg-yellow-900/20 text-yellow-300 border-yellow-700/40'
                                : 'bg-red-900/20 text-red-300 border-red-700/40'
                        }`}
                        title={`Safety Score: ${message.metrics.safety_score}/100`}
                      >
                        {message.metrics.safety_score}%
                      </span>
                    </span>
                  )}
                </div>

                {message.metrics.prompt_goal && (
                  <span className="text-[#94A3B8] italic text-[11px] leading-snug">
                    <span className="text-[#7BA8E8] not-italic uppercase tracking-wider text-[9px] font-semibold mr-1.5">Goal</span>
                    {message.metrics.prompt_goal}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
