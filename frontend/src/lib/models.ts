// Central model identification and pricing helpers.
// Update here when Groq decommissions models or pricing changes.

// Current Groq model names (as of 2026-05-18)
// Old names (decommissioned): llama3-70b-8192, llama3-8b-8192
// New names: llama-3.3-70b-versatile, llama-3.1-8b-instant
const LARGE_MODEL_PATTERNS = ['70b', '70-b', 'large', 'versatile']
const SMALL_MODEL_PATTERNS = ['8b', '8-b', 'small', 'instant']

export function isLargeModel(model: string): boolean {
  if (!model) return false
  const lower = model.toLowerCase()
  return LARGE_MODEL_PATTERNS.some((p) => lower.includes(p))
}

export function isSmallModel(model: string): boolean {
  if (!model) return false
  const lower = model.toLowerCase()
  // Check small first to avoid 70b accidentally matching
  return SMALL_MODEL_PATTERNS.some((p) => lower.includes(p)) && !isLargeModel(model)
}

// Groq public pricing per 1,000,000 tokens (USD) as of May 2026
// llama-3.3-70b-versatile: $0.59 input, $0.79 output → average $0.69
// llama-3.1-8b-instant: $0.05 input, $0.08 output → average $0.065
const GROQ_PRICING = {
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.2-90b-vision-preview': { input: 0.50, output: 0.50 },
}

const COST_PER_1K_USD = {
  large: 0.00069, // $0.69 per 1M = $0.00069 per 1K (70b average)
  small: 0.0000065, // $0.065 per 1M = $0.0000065 per 1K (8b average)
}

export function estimateCostUsd(tokens: number, model: string): number {
  // Try exact model match first
  const pricing = GROQ_PRICING[model as keyof typeof GROQ_PRICING]
  if (pricing) {
    const avgCostPerMillion = (pricing.input + pricing.output) / 2
    return (tokens / 1_000_000) * avgCostPerMillion
  }
  
  // Fall back to pattern matching
  const rate = isLargeModel(model) ? COST_PER_1K_USD.large : COST_PER_1K_USD.small
  return (tokens / 1000) * rate
}

// Tailwind class combos for the model badge.
// Orange = large/expensive model, Green = small/cheap model.
export function modelBadgeClasses(model: string): string {
  return isLargeModel(model)
    ? 'bg-orange-900/50 text-orange-300 border border-orange-700'
    : 'bg-green-900/50 text-green-300 border border-green-700'
}

export function modelBadgeTextClasses(model: string): string {
  return isLargeModel(model) ? 'text-orange-400' : 'text-green-400'
}

export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00'
  if (cost < 0.0001) return `$${cost.toFixed(6)}`
  if (cost < 0.01) return `$${cost.toFixed(5)}`
  if (cost < 0.1) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
}
