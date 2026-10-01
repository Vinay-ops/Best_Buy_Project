import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const result = await register(username, password)
    setLoading(false)
    if (result.ok) {
      navigate('/login')
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left panel */}
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
            Join The<br/>Supply.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Create an account to track<br/>orders and save carts.
          </p>
        </motion.div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
          © 2026 Best Buy Finder
        </div>
      </div>

      {/* Right panel */}
      <div style={{ background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ width: '100%', maxWidth: 360 }}
        >
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>Create account</h1>
          <p style={{ color: 'var(--c-gray)', fontSize: '0.875rem', marginBottom: 40 }}>Fill in the details below to get started</p>

          {error && (
            <div style={{ background: '#FFF0F0', border: '1px solid #ffcccc', padding: '12px 16px', marginBottom: 24, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#cc0000' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { label: 'Username', value: username, setter: setUsername, type: 'text', placeholder: 'your_username', autoComplete: 'username' },
              { label: 'Password', value: password, setter: setPassword, type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
              { label: 'Confirm Password', value: confirm, setter: setConfirm, type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
            ].map(({ label, value, setter, type, placeholder, autoComplete }) => (
              <div key={label}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8 }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  required
                  autoComplete={autoComplete}
                  placeholder={placeholder}
                  style={{
                    width: '100%', padding: '12px 0', border: 'none', borderBottom: '2px solid #000',
                    background: 'transparent', outline: 'none', fontSize: '1rem', boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 12, padding: '16px', background: loading ? '#555' : '#000', color: '#fff',
                border: 'none', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase',
                fontSize: '0.875rem', cursor: loading ? 'wait' : 'pointer', transition: 'background 0.2s'
              }}
            >
              {loading ? 'CREATING...' : 'CREATE ACCOUNT →'}
            </button>
          </form>

          <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--c-border-verylight)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--c-gray)' }}>Already have an account? </span>
            <Link to="/login" style={{ fontSize: '0.875rem', fontWeight: 700, textDecoration: 'underline' }}>
              Sign in →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
