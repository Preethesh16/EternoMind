import { useState, useEffect } from 'react'
import './LoginScreen.css'
import { login } from '../../api/auth'
import { createSession } from '../../api/sessions'
import { useSessionStore } from '../../stores/sessionStore'

interface Props {
  onSuccess: () => void
}

export function LoginScreen({ onSuccess }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAuth = useSessionStore((s) => s.setAuth)
  const setSession = useSessionStore((s) => s.setSession)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return

    setLoading(true)
    setError(null)

    try {
      // Step 1: Authenticate
      const authData = await login(username.trim(), password.trim())

      // Step 2: Auto-create a session (must pass token — endpoint requires auth)
      // Do NOT mark user as authenticated until BOTH login and session creation succeed,
      // otherwise the app shows the dashboard with a null sessionId (chat would silently fail)
      const sessionData = await createSession(username.trim(), authData.access_token)

      // Both succeeded — commit auth + session to the store atomically
      setAuth(username.trim(), authData.access_token)
      setSession(sessionData.session_id)

      onSuccess()
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Login failed'
      // Map known backend errors to friendly messages
      if (raw === 'Invalid credentials' || raw.includes('401')) {
        setError('Wrong username or password.')
      } else if (raw.includes('Failed to fetch') || raw.includes('NetworkError') || raw.includes('ECONNREFUSED')) {
        setError('Backend is unreachable. Make sure it is running at http://localhost:8000.')
      } else if (raw.includes('429') || raw.toLowerCase().includes('rate limit')) {
        setError('Too many login attempts. Try again in a minute.')
      } else {
        setError(raw)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const updateGlow = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`)
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', updateGlow)
    return () => window.removeEventListener('mousemove', updateGlow)
  }, [])

  return (
    <div className="bg-cinematic min-h-screen flex items-center justify-center font-['Inter',sans-serif] text-[#E2E8F0] antialiased flex-col">
      {/* Interactive Cursor Glow Layer */}
      <div className="cursor-glow" id="cursor-glow"></div>
      
      {/* BEGIN: Main Container */}
      {/* user requested: content box to the centre so it fits the screen. Removing top margin/padding to center perfectly. */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden border border-[#071A44] shadow-glow mx-4 m-auto">
        {/* Left Column: Branding / Visuals */}
        <div className="bg-[#030B1F] p-12 flex flex-col justify-center border-r border-[#071A44] relative overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#071A44]/30 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
            {/* Logo and Wordmark */}
            <div className="flex items-center space-x-3">
              <img alt="EternoMind Logo" className="h-10 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBx7EE_Y4zgP40CrG97tWgqnQjUt-1G3YPlHiht9OgiVjFEq8vi3V-s8dYWcCdIbS0KNWVhHdjc1ycNINbc20wnyF8B2moqitR4vJu6eYqnotxdV4K6AykTyMAB-KJg-i9ZMuM21kLBREmEzPTM_F_uedNO37qyAtzPXKPQaYuiLaJ6eKezhCaxtELBp8v-RvbCeUMecjNuN2rP_WwOtU671hU059KxsNXMGygXYlerVYMsMgI4CtfNOegHG80LxxYWSH_AHVCsl6Yo"/>
              <span className="font-['Canela',serif] text-2xl text-white font-bold tracking-tight">EternoMind</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="font-['Canela',serif] text-4xl text-white leading-tight">Welcome back.</h1>
              <p className="text-[#94A3B8] text-lg max-w-sm">Sign in to access your self-optimizing AI runtime and manage your enterprise inference.</p>
            </div>
          </div>
        </div>
        
        {/* Right Column: Sign In Form */}
        <div className="bg-[#020617] p-12 flex flex-col justify-center relative">
          {/* Glass panel effect */}
          <div className="absolute inset-0 bg-white/[0.02] shadow-inner-glow pointer-events-none"></div>
          
          <div className="relative z-10 w-full max-w-sm mx-auto">
            <h2 className="font-['Canela',serif] text-2xl text-white mb-8 text-center md:text-left">Sign In</h2>
            
            <form onSubmit={(e) => void handleLogin(e)} className="space-y-6">
              {error && (
                <div className="bg-red-900/40 border border-red-700 rounded-lg px-3 py-2 text-red-300 text-sm">
                  {error}
                </div>
              )}
              
              {/* Username/Email Field */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2" htmlFor="username">Username / Email address</label>
                <input 
                  id="username"
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="demo"
                  disabled={loading}
                  required
                  autoFocus
                  className="block w-full bg-[#030B1F] border border-[#071A44] rounded-md py-3 px-4 text-white placeholder-[#94A3B8] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors sm:text-sm" 
                />
              </div>
              
              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2" htmlFor="password">Password</label>
                <input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  required
                  className="block w-full bg-[#030B1F] border border-[#071A44] rounded-md py-3 px-4 text-white placeholder-[#94A3B8] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors sm:text-sm" 
                />
              </div>
              
              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember-me" type="checkbox" className="h-4 w-4 bg-[#030B1F] border-[#071A44] rounded text-[#3B82F6] focus:ring-[#3B82F6] focus:ring-offset-[#020617] focus:ring-offset-2" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-[#94A3B8]">Remember me</label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-[#3B82F6] hover:text-blue-400 transition-colors">Forgot your password?</a>
                </div>
              </div>
              
              {/* Submit Button */}
              <div>
                <button 
                  type="submit" 
                  disabled={loading || !username.trim() || !password.trim()}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-[#020617] bg-white hover:bg-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-[#020617] transition-all duration-200"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                  {!loading && (
                    <svg aria-hidden="true" className="ml-2 -mr-1 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path clipRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" fillRule="evenodd"></path>
                    </svg>
                  )}
                </button>
              </div>
            </form>
            
            <p className="mt-8 text-center text-sm text-[#94A3B8]">
              Don't have an account? <a href="#" className="font-medium text-[#3B82F6] hover:text-blue-400 transition-colors">Contact sales</a>
            </p>
            {/* Demo hint */}
            <p className="text-gray-600 text-xs text-center mt-4">
              Use demo credentials from <code className="text-gray-500">seed_demo_user.py</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
