import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const ok = await register(username, password)
    setLoading(false)
    
    if (ok) {
      toast('Registration successful! Please login.', 'success')
      navigate('/login')
    } else {
      toast('Registration failed', 'error')
    }
  }

  return (
    <div className="supply-light-bg" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 40 }}>
        <h1 style={{ fontSize: '3rem', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase', marginBottom: 10, lineHeight: 1 }}>CREATE<br/>ACCOUNT</h1>
        <p className="text-gray" style={{ marginBottom: 40 }}>Join the supply chain.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="mono uppercase text-xs" style={{ fontWeight: 700 }}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              required 
              style={{ padding: '12px 0', border: 'none', borderBottom: '2px solid var(--c-black)', background: 'transparent', outline: 'none', fontSize: '1rem' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="mono uppercase text-xs" style={{ fontWeight: 700 }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required 
              style={{ padding: '12px 0', border: 'none', borderBottom: '2px solid var(--c-black)', background: 'transparent', outline: 'none', fontSize: '1rem' }}
            />
          </div>
          
          <button type="submit" disabled={loading} style={{ 
            background: 'var(--c-black)', color: 'var(--c-white)', 
            padding: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', 
            textTransform: 'uppercase', marginTop: 16 
          }}>
            {loading ? 'WAIT...' : 'REGISTER ->'}
          </button>
        </form>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Link to="/login" className="mono text-xs text-gray uppercase" style={{ textDecoration: 'underline' }}>
            BACK TO LOGIN
          </Link>
        </div>
      </div>
    </div>
  )
}
