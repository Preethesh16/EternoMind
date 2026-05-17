import { LoginScreen } from './components/auth/LoginScreen'
import { ChatInterface } from './components/chat/ChatInterface'
import { TokenSavingsChart } from './components/dashboard/TokenSavingsChart'
import { PipelineStepsPanel } from './components/dashboard/PipelineStepsPanel'
import { MetricsBar } from './components/dashboard/MetricsBar'
import { useSessionStore } from './stores/sessionStore'

export default function App() {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated)

  // Show login screen until authenticated + session created
  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-white overflow-hidden">
      {/* Left: Chat — 55% */}
      <div className="w-[55%] flex flex-col border-r border-gray-800">
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-950 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <div>
              <h1 className="text-white font-semibold text-base leading-tight">EternoMind</h1>
              <p className="text-gray-500 text-xs">Self-optimizing memory-aware AI</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>

      {/* Right: Dashboard — 45% */}
      <div className="w-[45%] flex flex-col overflow-y-auto bg-gray-900">
        <div className="px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-white font-semibold text-sm">Dashboard</h2>
          <p className="text-gray-500 text-xs">Token savings · Pipeline · Metrics</p>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <TokenSavingsChart />
          <PipelineStepsPanel />
          <MetricsBar />
        </div>
      </div>
    </div>
  )
}
