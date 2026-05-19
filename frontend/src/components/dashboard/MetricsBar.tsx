import { useState } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { modelBadgeClasses } from '../../lib/models'

export function MetricsBar() {
  const messages = useChatStore((s) => s.messages)
  const [showPrompt, setShowPrompt] = useState(false)

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

  // Find the user query for this response
  const lastAssistantIdx = messages.findLastIndex(m => m.role === 'assistant' && m.metrics)
  const userQuery = lastAssistantIdx > 0 ? messages[lastAssistantIdx - 1].content : ''

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-medium text-sm">Last Response Metrics</h3>
        {lastMetrics.optimized_prompt && (
          <button 
            onClick={() => setShowPrompt(true)}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded px-1.5 py-0.5 transition-colors"
          >
            View Optimized Prompt
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Tokens — Before vs After */}
        <div className="bg-gray-900 rounded-lg p-2.5 col-span-2">
          <p className="text-gray-500 text-[10px] mb-1.5 uppercase tracking-wider">Token Optimization</p>
          <div className="flex items-center gap-3">
            {/* Before (raw) */}
            <div className="flex flex-col items-center">
              <p className="text-red-400 text-[9px] uppercase font-medium">Before</p>
              <p className="text-red-300 text-lg font-mono font-bold">
                {lastMetrics.raw_token_estimate
                  ? lastMetrics.raw_token_estimate.toLocaleString()
                  : Math.round((lastMetrics.token_estimate || lastMetrics.total_tokens) * 1.8).toLocaleString()}
              </p>
            </div>
            {/* Arrow */}
            <span className="text-gray-500 text-lg">→</span>
            {/* After (optimized) */}
            <div className="flex flex-col items-center">
              <p className="text-green-400 text-[9px] uppercase font-medium">After</p>
              <p className="text-green-300 text-lg font-mono font-bold">
                {lastMetrics.total_tokens.toLocaleString()}
              </p>
            </div>
            {/* Savings % */}
            <div className="ml-auto bg-green-500/10 border border-green-500/30 rounded-lg px-2.5 py-1.5">
              <p className="text-green-400 text-sm font-bold font-mono">
                {(() => {
                  const raw = lastMetrics.raw_token_estimate || Math.round((lastMetrics.token_estimate || lastMetrics.total_tokens) * 1.8)
                  const saved = Math.round(((raw - lastMetrics.total_tokens) / raw) * 100)
                  return saved > 0 ? `-${saved}%` : '0%'
                })()}
              </p>
              <p className="text-green-500/70 text-[8px] uppercase">saved</p>
            </div>
          </div>
        </div>

        {/* Latency */}
        <div className="bg-gray-900 rounded-lg p-2.5">
          <p className="text-gray-500 text-[10px] mb-0.5 uppercase tracking-wider">Latency</p>
          <p className="text-white text-xl font-mono font-bold">
            {lastMetrics.latency_ms.toFixed(0)}
            <span className="text-gray-500 text-xs font-normal ml-1">ms</span>
          </p>
        </div>

        {/* Model */}
        <div className="bg-gray-900 rounded-lg p-2.5">
          <p className="text-gray-500 text-[10px] mb-1 uppercase tracking-wider">Groq Model</p>
          <span
            className={`inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${modelBadgeClasses(lastMetrics.model)}`}
            title={lastMetrics.model}
          >
            {lastMetrics.model}
          </span>
        </div>

        {/* Memory hits */}
        <div className="bg-gray-900 rounded-lg p-2.5">
          <p className="text-gray-500 text-[10px] mb-0.5 uppercase tracking-wider">Memory Hits</p>
          <p className="text-white text-xl font-mono font-bold">
            {lastMetrics.memory_hits}
          </p>
        </div>

        {/* Complexity */}
        {lastMetrics.complexity_score && (
          <div className="bg-gray-900 rounded-lg p-2.5">
            <p className="text-gray-500 text-[10px] mb-1 uppercase tracking-wider">Complexity</p>
            <span
              className={`inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${
                lastMetrics.complexity_score === 1
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : lastMetrics.complexity_score === 2
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : lastMetrics.complexity_score === 3
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : lastMetrics.complexity_score === 4
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
              title={`Complexity Level ${lastMetrics.complexity_score}/5`}
            >
              {lastMetrics.complexity_score === 1
                ? 'Very Simple'
                : lastMetrics.complexity_score === 2
                  ? 'Simple'
                  : lastMetrics.complexity_score === 3
                    ? 'Medium'
                    : lastMetrics.complexity_score === 4
                      ? 'Complex'
                      : 'Very Complex'}
            </span>
          </div>
        )}

        {/* Safety Score */}
        {lastMetrics.safety_score !== undefined && (
          <div className="bg-gray-900 rounded-lg p-2.5">
            <p className="text-gray-500 text-[10px] mb-1 uppercase tracking-wider">Input Safety</p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${
                  lastMetrics.safety_score >= 80
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : lastMetrics.safety_score >= 60
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : lastMetrics.safety_score >= 40
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
                title="Input safety score (0-100)"
              >
                {lastMetrics.safety_score}%
              </span>
              <span className="text-[9px] text-gray-500">
                {lastMetrics.safety_score >= 80
                  ? 'Safe'
                  : lastMetrics.safety_score >= 60
                    ? 'Good'
                    : lastMetrics.safety_score >= 40
                      ? 'Caution'
                      : 'Alert'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Optimized Prompt Modal */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h4 className="text-white font-semibold">Surgical Prompt Optimization</h4>
              <button onClick={() => setShowPrompt(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-xs leading-relaxed">
              <div className="mb-4">
                <span className="text-gray-500 mb-1 block uppercase text-[10px] tracking-widest">Original Query</span>
                <div className="text-indigo-300 bg-indigo-500/10 p-2 rounded border border-indigo-500/20 text-sm">
                  {userQuery}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {lastMetrics.prompt_goal && (
                  <div className="col-span-2">
                    <span className="text-green-500 mb-1 block uppercase text-[10px] font-bold tracking-widest">Surgical Goal (Automated)</span>
                    <div className="text-green-400 bg-green-500/10 p-3 rounded border border-green-500/30 text-base font-bold italic">
                      "{lastMetrics.prompt_goal}"
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-gray-500 mb-1 block uppercase text-[10px] tracking-widest">Task Complexity</span>
                  <div className="bg-gray-800 p-3 rounded border border-gray-700 flex items-center gap-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div 
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            (lastMetrics.complexity_score || 3) >= i 
                              ? i === 5 ? 'bg-red-500' : i === 4 ? 'bg-orange-500' : i === 3 ? 'bg-yellow-500' : i === 2 ? 'bg-blue-500' : 'bg-green-500'
                              : 'bg-gray-600'
                          }`}
                          title={`Level ${i}`}
                        />
                      ))}
                    </div>
                    <span className="text-white text-xs font-medium">
                      {lastMetrics.complexity_score === 1
                        ? 'Very Simple'
                        : lastMetrics.complexity_score === 2
                          ? 'Simple'
                          : lastMetrics.complexity_score === 3
                            ? 'Medium'
                            : lastMetrics.complexity_score === 4
                              ? 'Complex'
                              : 'Very Complex'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 mb-1 block uppercase text-[10px] tracking-widest">Input Safety</span>
                  <div className="bg-gray-800 p-3 rounded border border-gray-700 flex items-center gap-2">
                    <div className="w-8 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          (lastMetrics.safety_score || 50) >= 80
                            ? 'bg-green-500'
                            : (lastMetrics.safety_score || 50) >= 60
                              ? 'bg-blue-500'
                              : (lastMetrics.safety_score || 50) >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, lastMetrics.safety_score || 50)}%` }}
                      />
                    </div>
                    <span className="text-white text-xs font-medium min-w-max">
                      {lastMetrics.safety_score || 50}%
                    </span>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="text-gray-500 mb-1 block uppercase text-[10px] tracking-widest">Selected Model</span>
                  <div className={`text-[10px] font-mono font-medium px-2 py-2 rounded border ${modelBadgeClasses(lastMetrics.model)}`}>
                    {lastMetrics.model}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-gray-500 mb-1 block uppercase text-[10px] tracking-widest">Optimized LLM Prompt</span>
                <pre className="bg-black/50 p-3 rounded border border-gray-800 text-gray-400 whitespace-pre-wrap text-[10px] max-h-64 overflow-y-auto">
                  {lastMetrics.optimized_prompt}
                </pre>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 flex justify-end">
              <button 
                onClick={() => setShowPrompt(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
