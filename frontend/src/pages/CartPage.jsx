import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartPage() {
  const { cart, subtotal, removeFromCart, fetchCart } = useCart()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)

  const tax = subtotal * 0.08
  const total = subtotal + tax

  useEffect(() => { fetchCart() }, [fetchCart])

  const handleCheckout = async () => {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 1500))
    fetch('/api/checkout', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (!d.error) navigate('/orders')
        else alert(d.error)
      })
      .finally(() => setProcessing(false))
  }

  if (cart.length === 0) {
    return (
      <div className="supply-light-bg" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontStyle: 'italic', fontWeight: 900, marginBottom: 20 }}>YOUR CART IS EMPTY</h2>
          <Link to="/products" className="btn-primary" style={{ display: 'inline-block' }}>CONTINUE SHOPPING</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="supply-light-bg" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', minHeight: 'calc(100vh - 60px)' }}>
        
        {/* Items */}
        <div style={{ borderRight: '1px solid var(--c-border-verylight)' }}>
          <div style={{ padding: '40px', borderBottom: '1px solid var(--c-border-verylight)' }}>
            <h1 style={{ fontSize: '2.5rem', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase' }}>CART ({cart.length})</h1>
          </div>
          
          {cart.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', padding: 40, borderBottom: '1px solid var(--c-border-verylight)' }}>
              <div style={{ width: 120, height: 120, background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 40 }}>
                {item.image ? <img src={item.image} alt="" style={{ maxWidth:'80%', maxHeight:'80%', objectFit: 'contain' }}/> : '📦'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 8 }}>{item.name || item.title}</div>
                <div className="mono text-gray text-xs uppercase" style={{ marginBottom: 20 }}>{item.source}</div>
                <button onClick={() => removeFromCart(item.id)} style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>Remove</button>
              </div>
              <div className="mono" style={{ fontSize: '1.125rem' }}>
                USD ${parseFloat(item.price).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ padding: 40, background: '#FAFAFA' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 40 }}>ORDER SUMMARY</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: '1rem' }}>
            <span className="text-gray">Subtotal</span>
            <span className="mono">${subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: '1rem' }}>
            <span className="text-gray">Tax</span>
            <span className="mono">${tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '40px 0', fontSize: '1.5rem', fontWeight: 700, borderTop: '2px solid #000', paddingTop: 20 }}>
            <span>TOTAL</span>
            <span className="mono">${total.toFixed(2)}</span>
          </div>

          <button 
            className="btn-primary" 
            style={{ width: '100%', padding: '20px', fontSize: '1rem' }}
            onClick={handleCheckout}
            disabled={processing}
          >
            {processing ? 'PROCESSING...' : 'CHECKOUT'}
          </button>
        </div>
      </div>
    </div>
  )
}
