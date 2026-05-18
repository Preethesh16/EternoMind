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

// Groq public pricing per 1,000 tokens (USD) — approximate for blended in/out
// llama-3.3-70b-versatile ≈ $0.59 / 1M tokens input, $0.79 / 1M tokens output
// llama-3.1-8b-instant   ≈ $0.05 / 1M tokens input, $0.08 / 1M tokens output
// We use blended estimates for simplicity in the demo.
const COST_PER_1K_USD = {
  large: 0.0007, // ~$0.70 per 1M
  small: 0.00007, // ~$0.07 per 1M
}

export function estimateCostUsd(tokens: number, model: string): number {
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
