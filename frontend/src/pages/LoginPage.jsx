import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(username, password)
    setLoading(false)
    if (result.ok) {
      navigate('/')
    } else {
      setError(result.error || 'Invalid credentials')
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left panel - dark brand */}
      <div style={{ background: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px 60px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>
          Best Buy Finder
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontStyle: 'italic', fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9, marginBottom: 24 }}>
            Welcome<br/>Back.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sign in to manage your orders<br/>and saved carts.
          </p>
        </motion.div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
          © 2026 Best Buy Finder
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{ background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ width: '100%', maxWidth: 360 }}
        >
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>Sign in</h1>
          <p style={{ color: 'var(--c-gray)', fontSize: '0.875rem', marginBottom: 40 }}>Enter your credentials to continue</p>

          {error && (
            <div style={{ background: '#FFF0F0', border: '1px solid #ffcccc', padding: '12px 16px', marginBottom: 24, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#cc0000' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8 }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="your_username"
                style={{
                  width: '100%', padding: '12px 0', border: 'none', borderBottom: '2px solid #000',
                  background: 'transparent', outline: 'none', fontSize: '1rem', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 0', border: 'none', borderBottom: '2px solid #000',
                  background: 'transparent', outline: 'none', fontSize: '1rem', boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 12, padding: '16px', background: loading ? '#555' : '#000', color: '#fff',
                border: 'none', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase',
                fontSize: '0.875rem', cursor: loading ? 'wait' : 'pointer', transition: 'background 0.2s'
              }}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>
          </form>

          <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--c-border-verylight)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--c-gray)' }}>Don't have an account? </span>
            <Link to="/register" style={{ fontSize: '0.875rem', fontWeight: 700, textDecoration: 'underline' }}>
              Create one →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
