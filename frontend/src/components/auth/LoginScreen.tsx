import { useState } from 'react'
import { login } from '../../api/auth'
import { createSession } from '../../api/sessions'
import { useSessionStore } from '../../stores/sessionStore'

export function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const setAuth = useSessionStore((s) => s.setAuth)
  const setSession = useSessionStore((s) => s.setSession)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return

    setLoading(true)
    setError(null)

    try {
      // 1. Authenticate
      const tokens = await login(username.trim(), password.trim())
      setAuth(username.trim(), tokens.access_token)

      // 2. Auto-create a session immediately after login
      const session = await createSession(tokens.access_token)
      setSession(session.session_id)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚡</div>
          <h1 className="text-white text-2xl font-bold">EternoMind</h1>
          <p className="text-gray-400 text-sm mt-1">Self-optimizing memory-aware AI</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-white font-semibold text-lg mb-6">Sign in</h2>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { void handleLogin(e) }} className="flex flex-col gap-4">
            <div>
              <label className="block text-gray-400 text-xs mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="demo"
                autoComplete="username"
                disabled={loading}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          Use the demo credentials from <code className="text-gray-500">seed_demo_user.py</code>
        </p>
      </div>
    </div>
  )
}
