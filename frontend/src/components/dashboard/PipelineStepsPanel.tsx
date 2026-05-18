import { useEffect, useRef, useState } from 'react'
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
  const messages = useChatStore((s) => s.messages)

  // Track step start times to compute per-step latency
  const stepTimingsRef = useRef<Record<string, { start: number; duration?: number }>>({})
  const lastStepRef = useRef<string | null>(null)
  const [, forceRender] = useState(0)

  useEffect(() => {
    const now = performance.now()
    // When a new step starts, record its start time and finalize the previous step
    if (currentStep && currentStep !== lastStepRef.current) {
      // Finalize previous step
      if (lastStepRef.current && stepTimingsRef.current[lastStepRef.current]) {
        const prev = stepTimingsRef.current[lastStepRef.current]
        if (prev.duration === undefined) {
          prev.duration = now - prev.start
        }
      }
      // Start new step
      stepTimingsRef.current[currentStep] = { start: now }
      lastStepRef.current = currentStep
      forceRender((v) => v + 1)
    }

    // When loading ends, finalize the last running step
    if (!isLoading && lastStepRef.current) {
      const last = stepTimingsRef.current[lastStepRef.current]
      if (last && last.duration === undefined) {
        last.duration = now - last.start
      }
      lastStepRef.current = null
      forceRender((v) => v + 1)
    }
  }, [currentStep, isLoading])

  // Reset timings when a new chat starts (no messages or new user message at end)
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last?.role === 'user' && isLoading) {
      stepTimingsRef.current = {}
    }
  }, [messages, isLoading])

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
          const isCompleted = !isLoading && stepTimingsRef.current[step]?.duration !== undefined
          const isIdle = !isRunning && !isDone && !isCompleted

          const timing = stepTimingsRef.current[step]?.duration

          return (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isRunning
                    ? 'bg-blue-400 animate-pulse'
                    : isDone || isCompleted
                    ? 'bg-green-400'
                    : 'bg-gray-600'
                }`}
              />
              <span
                className={`text-xs ${
                  isRunning
                    ? 'text-blue-300 font-medium'
                    : isDone || isCompleted
                    ? 'text-green-400'
                    : isIdle
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}
              >
                {STEP_LABELS[step]}
              </span>
              {(isDone || isCompleted) && timing !== undefined && (
                <span className="ml-auto text-gray-500 text-[10px] font-mono">
                  {timing < 1000 ? `${Math.round(timing)}ms` : `${(timing / 1000).toFixed(2)}s`}
                </span>
              )}
              {(isDone || isCompleted) && timing === undefined && (
                <span className="ml-auto text-green-500 text-xs">✓</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
