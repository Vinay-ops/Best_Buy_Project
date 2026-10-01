import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="supply-dark-footer" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 60, borderBottom: '1px solid var(--c-border-dark)' }}>
        <div className="footer-left">
          <h2>Save more with Best Buy Finder.</h2>
          <p>Join 50,000+ smart shoppers. Get price drop alerts for free.</p>
        </div>
        <div className="footer-right">
          <form className="footer-form" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" />
            <button type="submit">Sign up</button>
          </form>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 40, fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', gap: 60 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Shop</div>
            <Link to="/products" className="text-gray" style={{ textDecoration: 'none' }}>All Products</Link>
            <Link to="/products?q=tech" className="text-gray" style={{ textDecoration: 'none' }}>Tech</Link>
            <Link to="/products?q=apparel" className="text-gray" style={{ textDecoration: 'none' }}>Apparel</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Company</div>
            <Link to="/about" className="text-gray" style={{ textDecoration: 'none' }}>About</Link>
            <Link to="/login" className="text-gray" style={{ textDecoration: 'none' }}>Account</Link>
          </div>
        </div>
        
        <div style={{ textAlign: 'right', color: 'var(--c-gray)' }}>
          <div>© 2026 Best Buy Finder · All rights reserved.</div>
          <div style={{ marginTop: 8 }}>Built for extreme utility.</div>
        </div>
      </div>
    </footer>
  )
}
