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
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-white font-medium text-sm mb-3">Pipeline Steps</h3>
      <div className="flex flex-col gap-1.5">
        {PIPELINE_STEPS.map((step, idx) => {
          const isDone = isLoading && idx < activeIndex
          const isRunning = isLoading && idx === activeIndex
          const isIdle = !isRunning && !isDone

          return (
            <div key={step} className="flex items-center gap-2">
              {/* Status dot */}
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isRunning
                    ? 'bg-blue-400 animate-pulse'
                    : isDone
                    ? 'bg-green-400'
                    : 'bg-gray-600'
                }`}
              />
              <span
                className={`text-xs ${
                  isRunning
                    ? 'text-blue-300 font-medium'
                    : isDone
                    ? 'text-green-400'
                    : isIdle
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}
              >
                {STEP_LABELS[step]}
              </span>
              {isDone && (
                <span className="text-green-500 text-xs ml-auto">✓</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
