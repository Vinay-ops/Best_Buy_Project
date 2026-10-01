import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
      .then(data => {
        if (data?.orders) setOrders(data.orders)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [navigate])

  const formatDate = (str) => new Date(str).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--c-surface)', minHeight: '70vh', padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: 860 }}>
        {/* Header */}
        <div className="page-header__inner" style={{ padding: '0 0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="heading-xl">Order History</h1>
            <p style={{ color: 'var(--c-muted)', marginTop: 8, fontSize: '0.9375rem' }}>
              {user ? `Hi ${user.username}!` : ''} Track and manage your recent purchases
            </p>
          </div>
          <Link to="/products" className="btn btn-outline btn-sm">
            🛍 Continue Shopping
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state" style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)' }}>
            <div className="empty-state__icon">📦</div>
            <h3 className="heading-md">No orders yet</h3>
            <p style={{ color: 'var(--c-muted)', maxWidth: 300, textAlign: 'center' }}>
              You haven't placed any orders yet. Start shopping to see your history here.
            </p>
            <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>
              Browse Products →
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order, idx) => (
              <div key={order.order_id} className="order-card">
                <div className="order-card__head">
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <div className="caption" style={{ marginBottom: 2 }}>Order</div>
                      <div className="order-id">#{order.order_id}</div>
                    </div>
                    <div>
                      <div className="caption" style={{ marginBottom: 2 }}>Date</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{formatDate(order.created_at)}</div>
                    </div>
                    <div>
                      <div className="caption" style={{ marginBottom: 2 }}>Items</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{(order.items || []).length} product{(order.items || []).length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="order-status completed">✓ Completed</span>
                    <div style={{ textAlign: 'right' }}>
                      <div className="caption" style={{ marginBottom: 2 }}>Total</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.125rem' }}>
                        ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-card__body">
                  {/* Items Preview */}
                  <div className="order-items-preview" style={{ marginBottom: 14 }}>
                    {(order.items || []).map((item, i) => (
                      <span key={i} className="order-item-chip">
                        {(item.product_title || 'Product').slice(0, 28)}
                      </span>
                    ))}
                  </div>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelected(selected?.order_id === order.order_id ? null : order)}
                  >
                    {selected?.order_id === order.order_id ? '▲ Hide Details' : '▼ View Details'}
                  </button>

                  {/* Expanded Details */}
                  {selected?.order_id === order.order_id && (
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--c-border)' }}>
                      {(order.items || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--c-border)', gap: 16 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.product_title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)', marginTop: 2 }}>Qty: {item.quantity}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹{parseFloat(item.price).toFixed(2)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)' }}>Total: ₹{(item.price * item.quantity).toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontWeight: 800, fontSize: '1rem' }}>
                        <span>Order Total</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>₹{parseFloat(order.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
