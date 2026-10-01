import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { count, setDrawerOpen } = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    setShowMenu(false)
    navigate('/')
  }

  return (
    <header className="hdr">
      <div className="hdr__inner">

        {/* Left */}
        <nav className="hdr__left">
          <NavLink to="/products" style={({ isActive }) => ({ opacity: isActive ? 1 : 0.7, fontSize: '0.875rem', fontWeight: 500 })}>
            Shop ▾
          </NavLink>
          <NavLink to="/about" style={({ isActive }) => ({ opacity: isActive ? 1 : 0.7, fontSize: '0.875rem', fontWeight: 500 })}>
            About
          </NavLink>
        </nav>

        {/* Center Logo */}
        <Link to="/" className="hdr__logo">
          <span style={{
            background: '#fff', color: '#000', width: 24, height: 24, display: 'flex',
            alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: '0.75rem', fontWeight: 900, flexShrink: 0
          }}>BB</span>
          <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>Best Buy Finder</span>
        </Link>

        {/* Right */}
        <nav className="hdr__right" style={{ position: 'relative' }}>
          <NavLink to="/products" style={{ fontSize: '0.875rem', fontWeight: 500, opacity: 0.7 }}>
            Search
          </NavLink>

          {/* Account dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => user ? setShowMenu(p => !p) : navigate('/login')}
              style={{ fontSize: '0.875rem', fontWeight: 500, opacity: user ? 1 : 0.7 }}
            >
              {user ? user.username || 'Account' : 'Account'}
            </button>

            {showMenu && user && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 12px)', right: 0, background: '#111', border: '1px solid #333',
                minWidth: 160, zIndex: 200, padding: 4
              }}>
                <Link to="/orders" onClick={() => setShowMenu(false)} style={{ display: 'block', padding: '10px 16px', fontSize: '0.875rem' }}>My Orders</Link>
                <div style={{ height: 1, background: '#333', margin: '4px 0' }} />
                <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '0.875rem', color: '#888' }}>
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Cart */}
          <Link to="/cart" style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            Cart
            {count > 0 && (
              <span style={{
                background: '#fff', color: '#000', width: 18, height: 18, borderRadius: '50%',
                fontSize: '0.625rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {count}
              </span>
            )}
          </Link>
        </nav>

        {/* Click outside to close menu */}
        {showMenu && <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 150 }} />}
      </div>
    </header>
  )
}
