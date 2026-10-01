import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { count, setDrawerOpen } = useCart()
  const { user } = useAuth()

  return (
    <header className="hdr">
      <div className="hdr__inner">
        
        {/* Left Links */}
        <nav className="hdr__left">
          <NavLink to="/products" className="hdr__link">
            Shop ▾
          </NavLink>
          <NavLink to="/about" className="hdr__link">
            About
          </NavLink>
        </nav>

        {/* Center Logo */}
        <Link to="/" className="hdr__logo">
          <span style={{ background: '#fff', color: '#000', padding: '0 4px', borderRadius: 2, marginRight: 4, fontSize: '0.875rem' }}>S</span>
          shopify supply
        </Link>

        {/* Right Links */}
        <nav className="hdr__right">
          <button className="hdr__link" onClick={() => document.getElementById('searchBtn')?.click()}>
            Search
          </button>
          <Link to={user ? "/orders" : "/login"} className="hdr__link">
            Account
          </Link>
          <button className="hdr__link" onClick={() => setDrawerOpen(true)}>
            Cart {count > 0 && `(${count})`}
          </button>
        </nav>

      </div>
    </header>
  )
}
