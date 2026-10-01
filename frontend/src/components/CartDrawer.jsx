import React, { useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'

export default function CartDrawer() {
  const { cart, count, subtotal, drawerOpen, setDrawerOpen, removeFromCart } = useCart()

  // Close on escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setDrawerOpen])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const tax = subtotal * 0.08
  const total = subtotal + tax

  return (
    <div className={`cart-overlay${drawerOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setDrawerOpen(false) }}>
      <div className="cart-drawer">
        {/* Head */}
        <div className="cart-drawer__head">
          <div>
            <div className="cart-drawer__title">Your Cart</div>
            {count > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)', marginTop: 2 }}>{count} item{count !== 1 ? 's' : ''}</div>}
          </div>
          <button className="cart-drawer__close" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>

        {/* Body */}
        <div className="cart-drawer__body">
          {cart.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 24px' }}>
              <div className="empty-state__icon">🛒</div>
              <div className="heading-md">Your cart is empty</div>
              <p style={{ color: 'var(--c-muted)', fontSize: '0.875rem', textAlign: 'center', marginTop: 8 }}>Add some items from our shop to get started</p>
              <Link to="/products" className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setDrawerOpen(false)}>
                Browse Products
              </Link>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item__img">
                  {item.image
                    ? <img src={item.image} alt={item.name || item.title} onError={e => e.target.style.display='none'} />
                    : <span style={{ fontSize: '1.5rem' }}>📦</span>
                  }
                </div>
                <div className="cart-item__info">
                  <div className="cart-item__name">{item.name || item.title || item.id}</div>
                  <div className="cart-item__source">{item.source || 'Product'}</div>
                  <div className="cart-item__row">
                    <div className="qty-stepper">
                      <button className="qty-btn" aria-label="Decrease">−</button>
                      <div className="qty-val">{item.quantity || 1}</div>
                      <button className="qty-btn" aria-label="Increase">+</button>
                    </div>
                    <div className="cart-item__price">₹{parseFloat(item.price).toFixed(2)}</div>
                  </div>
                  <button className="cart-item__remove" onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Foot */}
        {cart.length > 0 && (
          <div className="cart-drawer__foot">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8125rem', color: 'var(--c-muted)' }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text)' }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8125rem', color: 'var(--c-muted)' }}>
              <span>Tax (8%)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text)' }}>₹{tax.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingTop: 12, borderTop: '2px solid var(--c-text)', fontWeight: 800, fontSize: '1.0625rem' }}>
              <span>Total</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>₹{total.toFixed(2)}</span>
            </div>
            <Link to="/cart" className="btn btn-primary btn-full" onClick={() => setDrawerOpen(false)} style={{ display: 'flex', marginBottom: 10 }}>
              View Cart & Checkout
            </Link>
            <button onClick={() => setDrawerOpen(false)} className="btn btn-outline btn-full" style={{ display: 'flex' }}>
              Continue Shopping
            </button>
            <div className="os-trust" style={{ marginTop: 16 }}>
              <div className="os-trust-item"><span>🔒</span><span>Secure</span></div>
              <div className="os-trust-item"><span>🚚</span><span>Free Shipping</span></div>
              <div className="os-trust-item"><span>↩️</span><span>Easy Returns</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
