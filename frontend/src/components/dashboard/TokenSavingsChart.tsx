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

// Cost per 1k tokens (USD) — Groq public pricing approximations
const COST_PER_1K = {
  large: 0.002,  // llama3-70b-8192
  small: 0.0002, // llama3-8b-8192
}

function estimateCostUsd(tokens: number, model: string): number {
  const rate = model.includes('70b') ? COST_PER_1K.large : COST_PER_1K.small
  return (tokens / 1000) * rate
}

export function TokenSavingsChart() {
  const interactions = useMetricsStore((s) => s.interactions)

  if (interactions.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-medium text-sm mb-2">Token Savings</h3>
        <div className="flex items-center justify-center h-28 text-gray-500 text-xs">
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

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium text-sm">Token Savings</h3>
        <div className="flex items-center gap-2">
          {interactions.length >= 2 && reduction > 0 && (
            <span className="text-green-400 text-xs font-mono">
              {reduction}% reduction
            </span>
          )}
          {totalSaved > 0 && (
            <span className="bg-emerald-900/50 text-emerald-300 border border-emerald-700 text-xs font-mono px-2 py-0.5 rounded-full">
              Saved ${totalSaved.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
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
            tickFormatter={(v: number) => `$${v.toFixed(3)}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#e5e7eb', fontSize: 11 }}
            itemStyle={{ fontSize: 11 }}
            formatter={(value: number, name: string) => {
              if (name === 'Cost (USD)') return [`$${value.toFixed(4)}`, name]
              return [value, name]
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
