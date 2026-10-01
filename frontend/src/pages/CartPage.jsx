import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ReceiptPrinter } from '../components/ReceiptPrinter'
import { motion, AnimatePresence } from 'framer-motion'

export default function CartPage() {
  const { cart, subtotal, removeFromCart, clearCart, fetchCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(null) // holds order data when placed

  const tax = subtotal * 0.08
  const total = subtotal + tax

  useEffect(() => { fetchCart() }, [fetchCart])

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setProcessing(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (!data.error) {
        const orderId = data.order_id || Math.floor(Math.random() * 9000 + 1000)
        const now = new Date()
        const dateStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getFullYear()).slice(-2)}`
        const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

        // Build receipt lines
        const lines = [
          { kind: 'title', text: 'Best Buy Finder' },
          { kind: 'center', text: 'bestbuyfinder.app' },
          { kind: 'rule' },
          { kind: 'row', left: `Order #${orderId}`, right: `${dateStr} ${timeStr}` },
          { kind: 'rule' },
          ...cart.map(item => ({
            kind: 'row',
            left: `${item.quantity || 1} ${(item.title || item.name || 'Item').slice(0, 18)}`,
            right: `${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}`
          })),
          { kind: 'rule' },
          { kind: 'row', left: 'Subtotal', right: subtotal.toFixed(2) },
          { kind: 'row', left: 'Tax 8%', right: tax.toFixed(2) },
          { kind: 'total', left: 'Total', right: `$${total.toFixed(2)}` },
          { kind: 'rule', char: '=' },
          { kind: 'barcode', code: `${orderId}${now.getMonth() + 1}${now.getDate()}` },
          { kind: 'center', text: 'Thank you!' },
        ]
        setOrderPlaced({ lines, total: `$${total.toFixed(2)}`, orderId })
        clearCart()
      } else {
        alert(data.error)
      }
    } catch (e) {
      console.error(e)
      alert('Checkout failed. Is the Flask server running?')
    } finally {
      setProcessing(false)
    }
  }

  // Order success screen with receipt
  if (orderPlaced) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f5f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 40 }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center' }}
        >
          <h1 style={{ fontSize: '3rem', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase', color: '#000', marginBottom: 8 }}>
            ORDER PLACED!
          </h1>
          <p style={{ color: '#888', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
            #{orderPlaced.orderId} · Your receipt is printing below
          </p>
        </motion.div>

        <ReceiptPrinter
          lines={orderPlaced.lines}
          total={orderPlaced.total}
          autoPrint={true}
          onTear={() => navigate('/orders')}
        />

        <p style={{ color: '#aaa', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textAlign: 'center' }}>
          Drag the receipt to tear it off, or click "Tear off"
        </p>
      </motion.div>
    )
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <div className="supply-light-bg" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', fontStyle: 'italic', fontWeight: 900, marginBottom: 20, textTransform: 'uppercase' }}>
            YOUR CART<br/>IS EMPTY
          </h2>
          <p style={{ color: 'var(--c-gray)', marginBottom: 32 }}>Add some items and come back.</p>
          <Link to="/products" style={{
            display: 'inline-block',
            background: 'var(--c-black)', color: 'var(--c-white)',
            padding: '16px 40px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 700
          }}>
            BROWSE PRODUCTS
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="supply-light-bg" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', minHeight: 'calc(100vh - 60px)', alignItems: 'start' }}>

        {/* Cart Items */}
        <div style={{ borderRight: '1px solid var(--c-border-verylight)' }}>
          <div style={{ padding: '40px 40px 32px', borderBottom: '1px solid var(--c-border-verylight)' }}>
            <h1 style={{ fontSize: '2.5rem', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase' }}>
              CART ({cart.length})
            </h1>
          </div>

          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', padding: '32px 40px', borderBottom: '1px solid var(--c-border-verylight)', gap: 32, alignItems: 'center' }}
              >
                {/* Image */}
                <div style={{ width: 100, height: 100, background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--c-border-verylight)' }}>
                  {item.image
                    ? <img src={item.image} alt="" style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: '2rem' }}>📦</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name || item.title || 'Product'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--c-gray)', textTransform: 'uppercase', marginBottom: 16 }}>
                    Qty: {item.quantity || 1}
                    {item.source && ` · ${item.source}`}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textDecoration: 'underline', color: 'var(--c-gray)', textTransform: 'uppercase' }}
                  >
                    Remove
                  </button>
                </div>

                {/* Price */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, flexShrink: 0 }}>
                  ${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div style={{ padding: 40, position: 'sticky', top: 60, background: '#fafafa', borderBottom: '1px solid var(--c-border-verylight)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 32, fontFamily: 'var(--font-mono)' }}>
            Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--c-gray)' }}>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--c-gray)' }}>Tax (8%)</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>${tax.toFixed(2)}</span>
            </div>
            <div style={{ height: 1, background: '#000', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 900, fontStyle: 'italic' }}>
              <span>TOTAL</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {!user && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--c-gray)', marginBottom: 16, textTransform: 'uppercase' }}>
              ⚠ Login required to checkout
            </p>
          )}

          <button
            onClick={handleCheckout}
            disabled={processing}
            style={{
              width: '100%', padding: '18px',
              background: processing ? '#555' : '#000',
              color: '#fff',
              fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase',
              fontSize: '0.875rem', border: 'none', cursor: processing ? 'wait' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {processing ? 'PROCESSING...' : user ? 'CHECKOUT →' : 'LOGIN TO CHECKOUT →'}
          </button>
        </div>
      </div>
    </div>
  )
}
