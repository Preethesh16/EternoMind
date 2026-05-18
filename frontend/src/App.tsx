import { useState } from 'react'
import { LoginScreen } from './components/auth/LoginScreen'
import { ChatInterface } from './components/chat/ChatInterface'
import { TokenSavingsChart } from './components/dashboard/TokenSavingsChart'
import { PipelineStepsPanel } from './components/dashboard/PipelineStepsPanel'
import { MetricsBar } from './components/dashboard/MetricsBar'
import { useSessionStore } from './stores/sessionStore'
import { useChatStore } from './stores/chatStore'
import { useMetricsStore } from './stores/metricsStore'
import { createSession } from './api/sessions'
import { logout as apiLogout } from './api/auth'

export default function App() {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated)
  const userId = useSessionStore((s) => s.userId)
  const accessToken = useSessionStore((s) => s.accessToken)
  const sessionId = useSessionStore((s) => s.sessionId)
  const storeLogout = useSessionStore((s) => s.logout)
  const setSession = useSessionStore((s) => s.setSession)
  const clearMessages = useChatStore((s) => s.clearMessages)
  const clearInteractions = useMetricsStore((s) => s.clearInteractions)

  const [resetting, setResetting] = useState(false)

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => {}} />
  }

  const handleLogout = async () => {
    if (accessToken) {
      try { await apiLogout(accessToken) } catch { /* ignore */ }
    }
    storeLogout()
    clearMessages()
    clearInteractions()
  }

  const handleResetSession = async () => {
    if (!userId) return
    setResetting(true)
    try {
      const newSession = await createSession(userId, accessToken)
      setSession(newSession.session_id)
      clearMessages()
      clearInteractions()
    } catch {
      // ignore
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-white overflow-hidden">
      {/* Left: Chat — 55% */}
      <div className="w-[55%] flex flex-col border-r border-gray-800">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-950 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <div>
              <h1 className="text-white font-semibold text-base leading-tight">EternoMind</h1>
              <p className="text-gray-500 text-xs">
                {sessionId ? `Session ${sessionId.slice(0, 8)}…` : 'Self-optimizing memory-aware AI'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Reset session */}
            <button
              onClick={() => void handleResetSession()}
              disabled={resetting}
              title="Start a new session (resets token counter for demo)"
              className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              {resetting ? 'Resetting…' : '↺ Reset Session'}
            </button>
            {/* User + logout */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">{userId}</span>
              <button
                onClick={() => void handleLogout()}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Sign out
              </button>
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
