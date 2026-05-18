import { useChatStore } from '../../stores/chatStore'
import { modelBadgeClasses } from '../../lib/models'

export function MetricsBar() {
  const messages = useChatStore((s) => s.messages)

  // Get the last assistant message that has metrics
  const lastMetrics = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.metrics)?.metrics

  if (!lastMetrics) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-medium text-sm mb-2">Last Response Metrics</h3>
        <p className="text-gray-500 text-xs">Waiting for first response…</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-white font-medium text-sm mb-3">Last Response Metrics</h3>
      <div className="grid grid-cols-2 gap-3">
        {/* Tokens */}
        <div className="bg-gray-900 rounded-lg p-2.5">
          <p className="text-gray-500 text-xs mb-0.5">Tokens used</p>
          <p className="text-white text-xl font-mono font-bold">
            {lastMetrics.total_tokens.toLocaleString()}
          </p>
        </div>

        {/* Latency */}
        <div className="bg-gray-900 rounded-lg p-2.5">
          <p className="text-gray-500 text-xs mb-0.5">Latency</p>
          <p className="text-white text-xl font-mono font-bold">
            {lastMetrics.latency_ms.toFixed(0)}
            <span className="text-gray-500 text-xs font-normal ml-1">ms</span>
          </p>
        </div>

        {/* Model */}
        <div className="bg-gray-900 rounded-lg p-2.5">
          <p className="text-gray-500 text-xs mb-1">Model</p>
          <span
            className={`inline-block text-xs font-mono font-medium px-2 py-0.5 rounded-full ${modelBadgeClasses(lastMetrics.model)}`}
            title={lastMetrics.model}
          >
            {lastMetrics.model}
          </span>
        </div>

        {/* Memory hits */}
        <div className="bg-gray-900 rounded-lg p-2.5">
          <p className="text-gray-500 text-xs mb-0.5">Memory hits</p>
          <p className="text-white text-xl font-mono font-bold">
            {lastMetrics.memory_hits}
          </p>
        </div>
      </div>
    </div>
  )
}
