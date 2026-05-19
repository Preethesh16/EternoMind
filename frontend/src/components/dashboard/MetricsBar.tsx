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
        {/* Tokens */}
        <div className="bg-gray-900 rounded-lg p-2.5">
          <p className="text-gray-500 text-[10px] mb-0.5 uppercase tracking-wider">Total Tokens</p>
          <p className="text-white text-xl font-mono font-bold">
            {lastMetrics.total_tokens.toLocaleString()}
          </p>
          {lastMetrics.token_estimate && (
            <p className="text-green-400 text-[9px] mt-0.5 font-medium">
               Optimized from ~{Math.round(lastMetrics.token_estimate * 1.8)}
            </p>
          )}
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

              {lastMetrics.prompt_goal && (
                <div className="mb-4">
                  <span className="text-green-500 mb-1 block uppercase text-[10px] font-bold tracking-widest">Surgical Goal (Automated)</span>
                  <div className="text-green-400 bg-green-500/10 p-3 rounded border border-green-500/30 text-base font-bold italic">
                    "{lastMetrics.prompt_goal}"
                  </div>
                </div>
              )}

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
