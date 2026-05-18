import { useState } from 'react'
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

  return (
    <div className="flex h-screen w-screen bg-gray-950 items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚡</div>
          <h1 className="text-white text-2xl font-bold">EternoMind</h1>
          <p className="text-gray-400 text-sm mt-1">Self-optimizing memory-aware AI</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-white font-semibold text-base mb-6">Sign in</h2>

          <form onSubmit={(e) => void handleLogin(e)} className="flex flex-col gap-4">
            {/* Error */}
            {error && (
              <div className="bg-red-900/40 border border-red-700 rounded-lg px-3 py-2 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="demo"
                disabled={loading}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
                autoFocus
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo hint */}
          <p className="text-gray-600 text-xs text-center mt-4">
            Use demo credentials from <code className="text-gray-500">seed_demo_user.py</code>
          </p>
        </div>
      </div>
    </div>
  )
}
