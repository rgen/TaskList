'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState('signin')
  const [form, setForm] = useState({ username: '', password: '', newPassword: '', code: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username, password: form.password })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.message)
    router.push('/')
    router.refresh()
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username, password: form.password })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.message)
    router.push('/')
    router.refresh()
  }

  const handleRecover = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    const res = await fetch('/api/auth/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username, code: form.code, newPassword: form.newPassword })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.message)
    setSuccess('Password updated. You can now sign in.')
    setTab('signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">TaskList</h1>
        <p className="text-gray-500 text-sm mb-6">Manage your tasks efficiently</p>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {[['signin','Sign In'],['register','Register'],['recover','Forgot Password']].map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setError(''); setSuccess('') }}
              className={`pb-2 mr-4 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

        {/* Sign In */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input name="username" value={form.username} onChange={update} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" value={form.password} onChange={update} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Signing in\u2026' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Register */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input name="username" value={form.username} onChange={update} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" value={form.password} onChange={update} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Creating account\u2026' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Recover */}
        {tab === 'recover' && (
          <form onSubmit={handleRecover} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input name="username" value={form.username} onChange={update} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recovery Code</label>
              <input name="code" value={form.code} onChange={update} required placeholder="Enter your recovery code"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input name="newPassword" type="password" value={form.newPassword} onChange={update} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Resetting\u2026' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
