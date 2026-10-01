import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setQuery('')
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/products?q=${encodeURIComponent(query.trim())}`)
      onClose()
    }
  }

  return (
    <div className={`search-overlay${open ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="search-overlay__box">
        <form onSubmit={handleSearch}>
          <input
            ref={inputRef}
            type="search"
            className="search-overlay__input"
            placeholder="Search for laptops, phones, headphones..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </form>
        <div style={{ padding: '16px 24px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['MacBook Pro', 'Sony Headphones', 'iPhone 15', 'Samsung TV', 'iPad'].map(s => (
            <button
              key={s}
              onClick={() => { setQuery(s); navigate(`/products?q=${encodeURIComponent(s)}`); onClose() }}
              style={{
                padding: '6px 14px',
                border: '1px solid var(--c-border)',
                borderRadius: 'var(--r-full)',
                background: 'var(--c-surface)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-sans)',
                color: 'var(--c-text)'
              }}
              onMouseEnter={e => { e.target.style.background = 'var(--c-text)'; e.target.style.color = '#fff'; e.target.style.borderColor = 'var(--c-text)' }}
              onMouseLeave={e => { e.target.style.background = 'var(--c-surface)'; e.target.style.color = 'var(--c-text)'; e.target.style.borderColor = 'var(--c-border)' }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ padding: '10px 24px 20px', fontSize: '0.75rem', color: 'var(--c-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Press Enter to search</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  )
}
