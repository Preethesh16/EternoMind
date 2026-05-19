import { useState, useEffect } from 'react'
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
import { LandingPage } from './components/landing/LandingPage'
import './components/chat/ChatPage.css'

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
  const [showLanding, setShowLanding] = useState(true)

  // Cursor glow effect — same as landing/login
  useEffect(() => {
    if (!isAuthenticated) return
    const resetScroll = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      document
        .querySelectorAll<HTMLElement>('.chat-dashboard-panel, .chat-messages')
        .forEach((el) => {
          el.scrollTop = 0
        })
    }
    resetScroll()
    requestAnimationFrame(resetScroll)
    const updateGlow = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`)
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', updateGlow)
    return () => window.removeEventListener('mousemove', updateGlow)
  }, [isAuthenticated])

  if (showLanding && !isAuthenticated) {
    return <LandingPage onSignIn={() => setShowLanding(false)} />
  }

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
    setShowLanding(true)
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
    <div className="chat-page-root antialiased">
      {/* Ambient glow orbs (background, behind everything) */}
      <div className="chat-glow-orb" />
      <div className="chat-glow-orb-2" />

      {/* Cursor follower glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-200"
        style={{
          background:
            'radial-gradient(700px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), rgba(59, 130, 246, 0.07), transparent 70%)',
        }}
      />

      {/* Left: Chat — 55% */}
      <div className="chat-main-panel relative z-10 border-r border-[#152050]/60">
        {/* Header */}
        <div className="chat-surface px-5 py-3 border-b border-[#152050]/60 flex-shrink-0 flex items-center justify-between slide-in-down">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/logo.png"
                alt="EternoMind"
                className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-blue-500/20"
              />
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[#1a4fd8] to-[#4D9EFF] opacity-20 blur-md -z-10" />
            </div>
            <div>
              <h1 className="display-font text-white font-bold text-lg leading-none tracking-tight">
                EternoMind
              </h1>
              <p className="text-[#7BA8E8] text-[10px] mt-1 uppercase tracking-[0.15em] font-semibold">
                {sessionId ? `Session ${sessionId.slice(0, 8)}` : 'Self-optimizing AI runtime'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleResetSession()}
              disabled={resetting}
              title="Start a new session (resets token counter for demo)"
              className="chat-btn-ghost text-xs rounded-full px-4 py-1.5 disabled:opacity-40"
            >
              {resetting ? 'Resetting…' : '↺ New Session'}
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-[#152050]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a4fd8] to-[#4D9EFF] flex items-center justify-center text-white text-xs font-bold">
                {userId?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#d7e3fc] font-medium">{userId}</span>
                <button
                  onClick={() => void handleLogout()}
                  className="text-[10px] text-[#A8B4CC] hover:text-red-400 transition-colors text-left"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="chat-main-body min-h-0 overflow-hidden">
          <ChatInterface />
        </div>
      </div>

      {/* Right: Dashboard — 45% */}
      <div className="chat-dashboard-panel relative z-10 bg-[#050E2A]/50 backdrop-blur-sm">
        <div className="chat-surface px-5 py-3 border-b border-[#152050]/60 flex-shrink-0 slide-in-down sticky top-0 z-20">
          <h2 className="display-font text-white font-bold text-base tracking-tight">
            Dashboard
          </h2>
          <p className="text-[#7BA8E8] text-[10px] uppercase tracking-[0.15em] font-semibold mt-0.5">
            Token savings · Pipeline · Metrics
          </p>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div className="fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <TokenSavingsChart />
          </div>
          <div className="fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <PipelineStepsPanel />
          </div>
          <div className="fade-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <MetricsBar />
          </div>
        </div>
      </div>
    </div>
  )
}
