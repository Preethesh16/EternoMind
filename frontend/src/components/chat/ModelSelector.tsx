import { useEffect, useState } from 'react'
import { API_BASE } from '../../api/client'

interface Model {
  id: string
  label: string
  tier: 'auto' | 'small' | 'large' | 'expert'
}

interface Props {
  value: string
  onChange: (modelId: string) => void
  disabled?: boolean
}

const TIER_COLORS: Record<string, string> = {
  auto:   'text-indigo-400',
  small:  'text-green-400',
  large:  'text-orange-400',
  expert: 'text-purple-400',
}

const TIER_DOT: Record<string, string> = {
  auto:   'bg-indigo-400',
  small:  'bg-green-400',
  large:  'bg-orange-400',
  expert: 'bg-purple-400',
}

export function ModelSelector({ value, onChange, disabled }: Props) {
  const [models, setModels] = useState<Model[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/models`)
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .catch(() => {
        // fallback list if backend is unreachable
        setModels([
          { id: 'auto',                                       label: 'Auto (cascadeflow routing)', tier: 'auto'   },
          { id: 'llama-3.1-8b-instant',                      label: 'Llama 3.1 8B — Fast',        tier: 'small'  },
          { id: 'llama-3.3-70b-versatile',                   label: 'Llama 3.3 70B — Balanced',   tier: 'large'  },
          { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B — Expert', tier: 'expert' },
          { id: 'qwen/qwen3-32b',                            label: 'Qwen3 32B — Reasoning',      tier: 'large'  },
        ])
      })
  }, [])

  const selected = models.find((m) => m.id === value) ?? models[0]

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs border border-gray-700 hover:border-gray-500 bg-gray-900 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-40 min-w-[120px]"
        title="Select model"
      >
        {selected && (
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TIER_DOT[selected.tier] ?? 'bg-gray-400'}`} />
        )}
        <span className={`truncate max-w-[140px] ${selected ? TIER_COLORS[selected.tier] : 'text-gray-400'}`}>
          {selected?.label ?? 'Select model…'}
        </span>
        <span className="text-gray-500 ml-auto">▾</span>
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* dropdown */}
          <div className="absolute bottom-full mb-1 left-0 z-20 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 font-medium">
              Choose model
            </div>
            {models.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { onChange(m.id); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-gray-800 transition-colors text-left ${
                  value === m.id ? 'bg-gray-800' : ''
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TIER_DOT[m.tier]}`} />
                <span className={`flex-1 ${TIER_COLORS[m.tier]}`}>{m.label}</span>
                {value === m.id && <span className="text-indigo-400 text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
