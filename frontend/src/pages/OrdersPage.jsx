import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const INR = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function OrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/orders', { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { navigate('/login'); return null }
        return r.json()
      })
      .then(data => { if (data?.orders) setOrders(data.orders) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [navigate])

  const formatDate = (str) => new Date(str).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  if (loading) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          Loading orders...
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: 'calc(100vh - 60px)', padding: '40px 0 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 style={{ fontSize: '2.5rem', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase', color: '#fff', marginBottom: 8 }}>
              Order History
            </h1>
            {user && (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>
                Hi {user.username}! Track and manage your recent purchases.
              </p>
            )}
          </motion.div>
          <Link to="/products" style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 8
          }}>
            ← Continue Shopping
          </Link>
        </div>

        {/* Empty */}
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: '#1a1a1a', borderRadius: 20, padding: 60, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 20 }}>📦</div>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>No orders yet</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Start shopping to see your order history here.</p>
            <Link to="/products" style={{
              display: 'inline-block', background: '#fff', color: '#000', padding: '12px 28px',
              fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 700, borderRadius: 8
            }}>
              Browse Products →
            </Link>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map((order, idx) => (
              <motion.div
                key={order.order_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                style={{ background: '#1a1a1a', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}
              >
                {/* Order Row */}
                <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', alignItems: 'center', gap: 16 }}>
                  {/* Order # */}
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Order</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.9375rem' }}>#{order.order_id}</div>
                  </div>
                  {/* Date */}
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Date</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>{formatDate(order.created_at)}</div>
                  </div>
                  {/* Items */}
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Items</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>{(order.items || []).length} product{(order.items || []).length !== 1 ? 's' : ''}</div>
                  </div>
                  {/* Total */}
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Total</div>
                    <div style={{ color: '#fff', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>{INR(order.total_amount)}</div>
                  </div>
                  {/* Status + Toggle */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{ background: 'rgba(108,255,108,0.12)', color: '#6cff6c', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
                      ✓ Completed
                    </span>
                    <button
                      onClick={() => setSelected(selected?.order_id === order.order_id ? null : order)}
                      style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                      {selected?.order_id === order.order_id ? '▲ Hide' : '▼ Details'}
                    </button>
                  </div>
                </div>

                {/* Item chips preview */}
                <div style={{ padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(order.items || []).map((item, i) => (
                    <span key={i} style={{
                      background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                      padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontFamily: 'var(--font-mono)'
                    }}>
                      {(item.product_title || 'Product').slice(0, 30)}
                    </span>
                  ))}
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {selected?.order_id === order.order_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div style={{ padding: 24 }}>
                        {(order.items || []).map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 0', borderBottom: i < order.items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', gap: 16
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4 }}>{item.product_title}</div>
                              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>Qty: {item.quantity}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9375rem' }}>{INR(item.price)}</div>
                              <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                                Total: {INR(item.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: 900, fontSize: '1.125rem', fontStyle: 'italic' }}>
                          <span style={{ color: '#fff' }}>ORDER TOTAL</span>
                          <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{INR(order.total_amount)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
