import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { ReceiptPrinter } from '../components/ReceiptPrinter'
import { motion, AnimatePresence } from 'framer-motion'

const INR = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function CartPage() {
  const { cart, subtotal, removeFromCart, clearCart, fetchCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(null)

  const tax = subtotal * 0.18  // GST 18%
  const total = subtotal + tax

  useEffect(() => { fetchCart() }, [fetchCart])

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return }
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
        const dateStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`
        const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

        const lines = [
          { kind: 'title', text: 'Best Buy Finder' },
          { kind: 'center', text: 'bestbuyfinder.in' },
          { kind: 'center', text: 'GST IN 27XXXXX1234Z1' },
          { kind: 'rule' },
          { kind: 'row', left: `Order #${orderId}`, right: `${dateStr}` },
          { kind: 'row', left: user.username || 'Customer', right: timeStr },
          { kind: 'rule' },
          ...cart.map(item => ({
            kind: 'row',
            left: `${item.quantity || 1}x ${(item.title || item.name || 'Item').slice(0, 16)}`,
            right: INR(parseFloat(item.price) * (item.quantity || 1)).replace('₹','')
          })),
          { kind: 'rule' },
          { kind: 'row', left: 'Subtotal', right: INR(subtotal).replace('₹','') },
          { kind: 'row', left: 'GST (18%)', right: INR(tax).replace('₹','') },
          { kind: 'total', left: 'TOTAL', right: INR(total).replace('₹','') },
          { kind: 'rule', char: '=' },
          { kind: 'barcode', code: `${orderId}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}` },
          { kind: 'center', text: 'Dhanyavaad! Thank you!' },
        ]
        setOrderPlaced({ lines, total: INR(total), orderId })
        clearCart()
      } else {
        alert(data.error)
      }
    } catch (e) {
      console.error(e)
      alert('Checkout failed. Is the Flask server running on port 5000?')
    } finally {
      setProcessing(false)
    }
  }

  // ── ORDER SUCCESS SCREEN ────────────────────────────────────────
  if (orderPlaced) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          minHeight: 'calc(100vh - 60px)',
          background: 'radial-gradient(ellipse at top, #1a1a1a 0%, #000 60%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-start', paddingTop: 60, paddingBottom: 80, gap: 32
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16,1,0.3,1] }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            style={{ fontSize: '3rem', marginBottom: 12 }}
          >
            🎉
          </motion.div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase', color: '#fff', marginBottom: 8 }}>
            Order Placed!
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            #{orderPlaced.orderId} · Your receipt is printing below
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16,1,0.3,1] }}
        >
          <ReceiptPrinter
            lines={orderPlaced.lines}
            total={orderPlaced.total}
            autoPrint={true}
            onTear={() => navigate('/orders')}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Grab & tear the receipt to go to your orders →
        </motion.p>
      </motion.div>
    )
  }

  // ── EMPTY CART ──────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="supply-light-bg" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: 40 }}
        >
          <div style={{ fontSize: '4rem', marginBottom: 24 }}>🛍</div>
          <h2 style={{ fontSize: '2.5rem', fontStyle: 'italic', fontWeight: 900, marginBottom: 12, textTransform: 'uppercase' }}>
            Your Bag<br/>is Empty
          </h2>
          <p style={{ color: 'var(--c-gray)', marginBottom: 32 }}>Add some items and come back.</p>
          <Link to="/products" style={{
            display: 'inline-block', background: 'var(--c-black)', color: 'var(--c-white)',
            padding: '16px 40px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 700
          }}>
            Browse Products
          </Link>
        </motion.div>
      </div>
    )
  }

  // ── CART PAGE ───────────────────────────────────────────────────
  return (
    <div style={{ background: '#0a0a0a', minHeight: 'calc(100vh - 60px)', padding: '40px 0' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ fontStyle: 'italic', fontWeight: 900, fontSize: '2.5rem', textTransform: 'uppercase', color: '#fff', marginBottom: 32 }}
        >
          CART ({cart.length})
        </motion.h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

          {/* ── YOUR BAG CARD ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: '#1a1a1a',
              borderRadius: 20,
              padding: 20,
              border: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            {/* Bag header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Your bag</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                {cart.reduce((s, i) => s + (i.quantity || 1), 0)} item{cart.reduce((s, i) => s + (i.quantity || 1), 0) !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Items */}
            <AnimatePresence>
              {cart.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: '#242424',
                    borderRadius: 14,
                    padding: '14px 16px',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                  }}
                >
                  {/* Image */}
                  <div style={{
                    width: 60, height: 60, borderRadius: 10, background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {item.image
                      ? <img src={item.image} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                      : <span style={{ fontSize: '1.5rem' }}>📦</span>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                      {item.name || item.title || 'Product'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', marginBottom: 6, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
                      {item.source || 'Supply'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem' }}>
                      Qty {item.quantity || 1}
                    </div>
                  </div>

                  {/* Price + Remove */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
                      {INR(parseFloat(item.price) * (item.quantity || 1))}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{ color: 'rgba(255,100,100,0.7)', fontSize: '0.6875rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                    >
                      REMOVE
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* ── SUMMARY PANEL ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ position: 'sticky', top: 76 }}
          >
            <div style={{ background: '#1a1a1a', borderRadius: 20, padding: 24, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 20 }}>
                Summary
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem' }}>
                  <span>Subtotal</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{INR(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem' }}>
                  <span>GST (18%)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#6cff6c' }}>+{INR(tax)}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
                  <span>Total</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{INR(total)}</span>
                </div>
              </div>
            </div>

            {!user && (
              <div style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,165,0,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚠ Login required to checkout
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCheckout}
              disabled={processing}
              style={{
                width: '100%', padding: '18px 24px',
                background: processing ? '#333' : '#fff',
                color: processing ? '#888' : '#000',
                border: 'none', borderRadius: 14,
                fontFamily: 'var(--font-mono)', fontWeight: 900, textTransform: 'uppercase',
                fontSize: '0.9375rem', cursor: processing ? 'wait' : 'pointer',
                letterSpacing: '0.05em', transition: 'background 0.2s, color 0.2s'
              }}
            >
              {processing ? 'Processing...' : user ? 'CHECKOUT →' : 'LOGIN TO CHECKOUT →'}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
