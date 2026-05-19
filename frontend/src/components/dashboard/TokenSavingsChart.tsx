import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { useMetricsStore } from '../../stores/metricsStore'
import { estimateCostUsd } from '../../lib/models'

export function TokenSavingsChart() {
  const interactions = useMetricsStore((s) => s.interactions)

  if (interactions.length === 0) {
    return (
      <div className="chat-card p-4">
        <h3 className="display-font text-[#d7e3fc] font-bold text-sm mb-2 tracking-tight">Token Savings</h3>
        <div className="flex items-center justify-center h-28 text-[#A8B4CC] text-xs">
          Send your first message to start tracking token savings
        </div>
      </div>
    )
  }

  const data = interactions.map((i) => ({
    interaction: i.interaction_number,
    input: i.token_count_input,
    output: i.token_count_output,
    total: i.token_count_input + i.token_count_output,
    cost: estimateCostUsd(i.token_count_input + i.token_count_output, i.model_used),
  }))

  // Get the last message to check if estimated_cost is available from real-time metrics
  const lastMessageWithMetrics = [...useMetricsStore.getState()?.interactions || []]?.at(-1)
  const lastModel = lastMessageWithMetrics?.model_used || 'llama-3.1-8b-instant'

  // List of available models
  const availableModels = [
    { name: 'llama-3.1-8b-instant', label: 'Small (Fast)', tier: 'small', cost: '$0.05/$0.08 per 1M', tokens: '8B params', use: 'Quick queries' },
    { name: 'llama-3.3-70b-versatile', label: 'Large (Accurate)', tier: 'large', cost: '$0.59/$0.79 per 1M', tokens: '70B params', use: 'Complex reasoning' },
    { name: 'mixtral-8x7b-32768', label: 'Expert (Specialized)', tier: 'medium', cost: '$0.24/$0.24 per 1M', tokens: 'MoE 56B', use: 'Specialized tasks' },
  ]

  // Total savings calculation: assume interaction 1 was the "naive" baseline,
  // and every subsequent interaction saves the difference vs that baseline.
  const baselineCost = data[0]?.cost ?? 0
  const totalActualCost = data.reduce((sum, d) => sum + d.cost, 0)
  const wouldHaveCost = baselineCost * data.length
  const totalSaved = Math.max(0, wouldHaveCost - totalActualCost)

  // Token reduction percentage from interaction 1 to latest
  const firstTokens = interactions[0].token_count_input
  const lastTokens = interactions[interactions.length - 1].token_count_input
  const reduction = firstTokens > 0 ? Math.round((1 - lastTokens / firstTokens) * 100) : 0

  // Check for unsafe inputs in recent interactions
  const unsafeInteractions = interactions.filter((i) => (i.safety_score ?? 100) < 70)
  const hasUnsafeInput = unsafeInteractions.length > 0

  return (
    <div className="chat-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="display-font text-[#d7e3fc] font-bold text-sm tracking-tight">Token Savings & Cost Analysis</h3>
          <p className="text-[#A8B4CC] text-xs mt-1">Tracks input/output tokens and estimated cost per interaction</p>
        </div>
        <div className="flex items-center gap-2">
          {interactions.length >= 2 && reduction > 0 && (
            <span className="text-emerald-400 text-xs font-mono font-semibold">
              {reduction}% reduction
            </span>
          )}
          {totalSaved > 0 && (
            <span className="bg-emerald-900/30 text-emerald-300 border border-emerald-700/50 text-xs font-mono px-2.5 py-0.5 rounded-full">
              Saved ${totalSaved < 0.01 ? totalSaved.toFixed(5) : totalSaved.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* Safety Warning */}
      {hasUnsafeInput && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-2">
          <span className="text-red-500 font-bold text-lg">⚠️</span>
          <div className="flex-1">
            <p className="text-red-400 font-semibold text-sm">Unsafe Input Detected</p>
            <p className="text-red-300 text-xs mt-1">
              {unsafeInteractions.length} interaction(s) contain suspicious or sensitive data requests:
            </p>
            <div className="mt-2 space-y-1">
              {unsafeInteractions.map((interaction) => (
                <p key={interaction.interaction_number} className="text-red-300 text-xs ml-2">
                  • Interaction #{interaction.interaction_number}: Safety {interaction.safety_score ?? 100}% 
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Available Models Section */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {availableModels.map((model) => {
          // Highlight only the model that was actually used
          const isSelected = lastModel === model.name
          
          const tierColors = {
            small: { bg: 'bg-green-900/40', border: 'border-green-600', text: 'text-green-300' },
            medium: { bg: 'bg-yellow-900/40', border: 'border-yellow-600', text: 'text-yellow-300' },
            large: { bg: 'bg-orange-900/40', border: 'border-orange-600', text: 'text-orange-300' },
          }
          const tierColor = tierColors[model.tier as keyof typeof tierColors] || tierColors.medium
          const bgColor = isSelected ? tierColor.bg : 'bg-gray-700/30'
          const borderColor = isSelected ? tierColor.border : 'border-gray-600'
          const textColor = isSelected ? tierColor.text : 'text-gray-400'

          return (
            <div 
              key={model.name}
              className={`${bgColor} border ${borderColor} rounded p-3 transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-blue-500' : ''}`}
            >
              <div className="flex items-start gap-2">
                {isSelected && (
                  <span className="inline-block w-3 h-3 bg-blue-400 rounded-full mt-0.5 flex-shrink-0 animate-pulse"></span>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`${textColor} text-sm font-semibold flex items-center gap-2`}>
                    {model.label}
                    {isSelected && <span className="text-xs bg-blue-600 px-2 py-0.5 rounded whitespace-nowrap">✓ ACTIVE</span>}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{model.tokens}</p>
                  <p className="text-gray-600 text-xs">{model.cost}</p>
                  <p className="text-gray-500 text-xs italic mt-1">{model.use}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="interaction"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            label={{ value: 'Interaction #', position: 'insideBottom', fill: '#6b7280', fontSize: 10 }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#a78bfa', fontSize: 10 }}
            tickFormatter={(v: number) => {
              if (v === 0) return '$0.00'
              if (v < 0.0001) return `$${v.toFixed(6)}`
              if (v < 0.01) return `$${v.toFixed(5)}`
              return `$${v.toFixed(3)}`
            }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#e5e7eb', fontSize: 11 }}
            itemStyle={{ fontSize: 11 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                const totalTokens = data.input + data.output
                return (
                  <div className="bg-gray-900 border border-gray-600 rounded p-3 shadow-lg max-w-xs">
                    <p className="text-gray-300 font-semibold text-sm mb-2">Interaction #{data.interaction}</p>
                    
                    <div className="space-y-2 mb-3 border-b border-gray-700 pb-2">
                      <p className="text-red-400 text-xs">
                        <span className="font-mono">Input tokens: {data.input}</span>
                        <span className="text-gray-500 text-xs ml-2">(what you sent)</span>
                      </p>
                      <p className="text-green-400 text-xs">
                        <span className="font-mono">Output tokens: {data.output}</span>
                        <span className="text-gray-500 text-xs ml-2">(what AI generated)</span>
                      </p>
                      <p className="text-blue-400 text-xs">
                        <span className="font-mono">Total: {totalTokens}</span>
                        <span className="text-gray-500 text-xs ml-2">(combined)</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-purple-300 font-semibold text-xs">Cost Breakdown:</p>
                      <p className="text-purple-400 font-mono text-xs">
                        ${data.cost.toFixed(6)} USD
                      </p>
                      <p className="text-gray-500 text-xs">
                        {totalTokens} tokens @ avg rate
                      </p>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine
            yAxisId="left"
            y={720}
            stroke="#4ade80"
            strokeDasharray="4 4"
            label={{ value: 'Memory-optimized baseline', position: 'insideTopRight', fill: '#4ade80', fontSize: 10 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="input"
            stroke="#f87171"
            strokeWidth={2}
            dot={{ fill: '#f87171', r: 3 }}
            name="Input tokens"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="output"
            stroke="#34d399"
            strokeWidth={2}
            dot={{ fill: '#34d399', r: 3 }}
            name="Output tokens"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cost"
            stroke="#a78bfa"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={{ fill: '#a78bfa', r: 2 }}
            name="Cost (USD)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
