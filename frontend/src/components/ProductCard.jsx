import React, { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { motion } from 'framer-motion'

export default function ProductCard({ product, index = 0 }) {
  const { addToCart, loading } = useCart()
  const toast = useToast()
  const [adding, setAdding] = useState(false)

  const name = product.name || product.title || 'Product Name'
  const price = parseFloat(product.price || 0)
  
  const handleAdd = async (e) => {
    e.preventDefault()
    setAdding(true)
    const ok = await addToCart(product)
    setAdding(false)
    if (ok) toast(`${name} added to cart`, 'success')
    else toast('Please login to add items to cart', 'error')
  }

  return (
    <motion.div 
      className="supply-grid-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: (index % 3) * 0.1, duration: 0.5 }}
    >
      {index < 2 && <div className="badge-sold-out" style={{ background: '#000', color: '#fff' }}>HOT</div>}
      
      <div className="card-image-wrap">
        {product.image ? (
          <img src={product.image} alt={name} loading="lazy" />
        ) : (
          <div className="placeholder-img"></div>
        )}
        
        {/* Quick Add Overlay */}
        <div className="card-quick-add">
          <button onClick={handleAdd} disabled={adding || loading}>
            {adding ? '...' : 'QUICK ADD'}
          </button>
        </div>
      </div>

      <div className="card-footer" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="card-title">{name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-price">USD ${price.toFixed(2)}</div>
          <div className="card-price text-gray" style={{ fontSize: '0.6875rem' }}>{product.source || 'Supply'}</div>
        </div>
      </div>
    </motion.div>
  )
}
