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
  }))

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium text-sm">Token Savings</h3>
        {interactions.length >= 2 && (
          <span className="text-green-400 text-xs font-mono">
            {Math.round(
              (1 - interactions[interactions.length - 1].token_count_input /
                interactions[0].token_count_input) * 100
            )}% reduction
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="interaction"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            label={{ value: 'Interaction #', position: 'insideBottom', fill: '#6b7280', fontSize: 10 }}
          />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#e5e7eb', fontSize: 11 }}
            itemStyle={{ fontSize: 11 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine
            y={720}
            stroke="#4ade80"
            strokeDasharray="4 4"
            label={{ value: 'Memory-optimized baseline', position: 'insideTopRight', fill: '#4ade80', fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="input"
            stroke="#f87171"
            strokeWidth={2}
            dot={{ fill: '#f87171', r: 3 }}
            name="Input tokens"
          />
          <Line
            type="monotone"
            dataKey="output"
            stroke="#34d399"
            strokeWidth={2}
            dot={{ fill: '#34d399', r: 3 }}
            name="Output tokens"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
