import { useChatStore } from '../../stores/chatStore'

export function MetricsBar() {
  const messages = useChatStore((s) => s.messages)

  // Get the last assistant message that has metrics
  const lastMetrics = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.metrics)?.metrics

  if (!lastMetrics) {
    return (
      <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-lg p-4 border border-purple-500/30 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_20px_rgba(139,92,246,0.2)]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-purple-400">📊</span>
          <h3 className="text-white font-medium text-sm">Last Response Metrics</h3>
        </div>
        <p className="text-slate-400 text-xs">Waiting for first response…</p>
      </div>
    )
  }

  const isLargeModel = lastMetrics.model.includes('70b')

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-lg p-4 border border-purple-500/30 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_20px_rgba(139,92,246,0.2)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-purple-400">📊</span>
        <h3 className="text-white font-medium text-sm">Last Response Metrics</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Tokens */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-lg p-2.5 border border-purple-500/20">
          <p className="text-slate-400 text-xs mb-0.5">Tokens used</p>
          <p className="text-white text-xl font-mono font-bold">
            {lastMetrics.total_tokens.toLocaleString()}
          </p>
        </div>

        {/* Latency */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-lg p-2.5 border border-purple-500/20">
          <p className="text-slate-400 text-xs mb-0.5">Latency</p>
          <p className="text-white text-xl font-mono font-bold">
            {lastMetrics.latency_ms.toFixed(0)}
            <span className="text-slate-400 text-xs font-normal ml-1">ms</span>
          </p>
        </div>

        {/* Model */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-lg p-2.5 border border-purple-500/20">
          <p className="text-slate-400 text-xs mb-1">Model</p>
          <span
            className={`inline-block text-xs font-mono font-medium px-2 py-0.5 rounded-full ${
              isLargeModel
                ? 'bg-orange-900/40 text-orange-300 border border-orange-600/50'
                : 'bg-green-900/40 text-green-300 border border-green-600/50'
            }`}
          >
            {lastMetrics.model}
          </span>
        </div>

        {/* Memory hits */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-lg p-2.5 border border-purple-500/20">
          <p className="text-slate-400 text-xs mb-0.5">Memory hits</p>
          <p className="text-white text-xl font-mono font-bold">
            {lastMetrics.memory_hits}
          </p>
        </div>
      </div>
    </div>
  )
}
