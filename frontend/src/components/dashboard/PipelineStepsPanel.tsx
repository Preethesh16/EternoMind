import { useChatStore } from '../../stores/chatStore'

const PIPELINE_STEPS = [
  'security',
  'langgraph',
  'memory_retrieval',
  'context_relevancy',
  'rag_retrieval',
  'prompt_optimizer',
  'cascadeflow_routing',
  'groq_llm',
  'validation',
  'response',
  'memory_update',
] as const

const STEP_LABELS: Record<string, string> = {
  security: 'Security',
  langgraph: 'LangGraph',
  memory_retrieval: 'Memory Retrieval',
  context_relevancy: 'Context Relevancy',
  rag_retrieval: 'RAG Retrieval',
  prompt_optimizer: 'Prompt Optimizer',
  cascadeflow_routing: 'cascadeflow Routing',
  groq_llm: 'Groq LLM',
  validation: 'Validation',
  response: 'Response',
  memory_update: 'Memory Update',
}

export function PipelineStepsPanel() {
  const currentStep = useChatStore((s) => s.currentPipelineStep)
  const isLoading = useChatStore((s) => s.isLoading)

  const activeIndex = currentStep
    ? PIPELINE_STEPS.findIndex((s) => s === currentStep)
    : -1

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-lg p-4 border border-purple-500/30 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_20px_rgba(139,92,246,0.2)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-purple-400">🚀</span>
        <h3 className="text-white font-medium text-sm">Pipeline Steps</h3>
      </div>
      <div className="flex flex-col gap-1.5">
        {PIPELINE_STEPS.map((step, idx) => {
          const isDone = isLoading && idx < activeIndex
          const isRunning = isLoading && idx === activeIndex
          const isIdle = !isRunning && !isDone

          return (
            <div key={step} className="flex items-center gap-2">
              {/* Status dot */}
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                  isRunning
                    ? 'bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(192,132,250,0.8)]'
                    : isDone
                    ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]'
                    : 'bg-purple-600/40'
                }`}
              />
              <span
                className={`text-xs transition-colors ${
                  isRunning
                    ? 'text-purple-300 font-medium'
                    : isDone
                    ? 'text-green-400'
                    : isIdle
                    ? 'text-slate-500'
                    : 'text-slate-400'
                }`}
              >
                {STEP_LABELS[step]}
              </span>
              {isDone && (
                <span className="text-green-400 text-xs ml-auto">✓</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
