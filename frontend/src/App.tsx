import { ChatInterface } from './components/chat/ChatInterface'
import { TokenSavingsChart } from './components/dashboard/TokenSavingsChart'
import { PipelineStepsPanel } from './components/dashboard/PipelineStepsPanel'
import { MetricsBar } from './components/dashboard/MetricsBar'

export default function App() {
  // Generate subtle scattered stars
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 1 + 0.3,
    duration: Math.random() * 4 + 4,
    delay: Math.random() * 3,
  }))

  return (
    <div className="h-screen w-screen relative overflow-hidden text-white" style={{ backgroundColor: '#0A0A1A' }}>
      {/* Subtle stars field */}
      {stars.map(star => (
        <div
          key={star.id}
          className="fixed rounded-full pointer-events-none"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            boxShadow: `0 0 ${star.size}px rgba(255, 255, 255, 0.3)`,
            animation: `float-stars ${star.duration}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
            opacity: 0.4,
          }}
        />
      ))}

      {/* Bottom-left nebula - main element */}
      <div className="fixed bottom-0 left-0 w-[1400px] h-[1200px] pointer-events-none" style={{
        background: 'radial-gradient(ellipse 800px 700px at 35% 95%, rgba(107, 33, 168, 0.5), rgba(75, 0, 130, 0.2) 40%, transparent 85%)',
        filter: 'blur(100px)',
      }} />

      {/* Right edge aurora glow */}
      <div className="fixed top-0 right-0 w-[800px] h-full z-0 pointer-events-none" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(107, 33, 168, 0.15) 35%, rgba(75, 0, 130, 0.08) 70%, transparent 100%)',
        filter: 'blur(80px)',
      }} />

      {/* Content Container */}
      <div className="relative z-10 flex h-screen w-screen">
        {/* Left: Chat — 55% */}
        <div className="w-[55%] flex flex-col border-r border-purple-500/20">
          <div className="px-4 py-3 border-b border-purple-500/20 bg-transparent backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L5 11H10L11 23L21 9H16L13 2Z" stroke="currentColor" strokeWidth="1.2" className="text-purple-400" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="-space-y-0.5">
                <h1 className="text-white text-sm font-semibold">EternoMind</h1>
                <p className="text-slate-400 text-xs">Self-optimizing memory-aware AI</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        </div>

        {/* Right: Dashboard — 45% */}
        <div className="w-[45%] flex flex-col overflow-y-auto bg-gradient-to-b from-black/40 via-black/30 to-black/40 backdrop-blur-md">
          <div className="px-4 py-3 border-b border-purple-500/20 flex-shrink-0">
            <h2 className="text-white text-sm font-semibold">Dashboard</h2>
            <p className="text-slate-400 text-xs">Token savings · Pipeline · Metrics</p>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <TokenSavingsChart />
            <PipelineStepsPanel />
            <MetricsBar />
          </div>
        </div>
      </div>
    </div>
  )
}
